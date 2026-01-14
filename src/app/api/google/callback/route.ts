import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { inngest } from "@/lib/inngest/client";
import { getSecret } from "@/lib/secret-manager";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

interface TenantRow {
  id: string;
  name: string;
}

interface UserRow {
  id: string;
  tenant_id: string;
  email: string;
}

interface ConnectionRow {
  id: string;
  tenant_id: string;
  user_id: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/connections?error=${error}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/connections?error=no_code", request.url)
    );
  }

  try {
    // Get client secret from Secret Manager
    const clientSecret = await getSecret("GOOGLE_CLIENT_SECRET");

    // Exchange code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: clientSecret,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Token exchange failed:", errorData);
      return NextResponse.redirect(
        new URL("/connections?error=token_exchange_failed", request.url)
      );
    }

    const tokens = await tokenResponse.json();
    console.log("Got tokens:", {
      access_token: tokens.access_token ? "present" : "missing",
      refresh_token: tokens.refresh_token ? "present" : "missing",
      expires_in: tokens.expires_in
    });

    // Get user info from Google
    const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      console.error("Failed to get user info");
      return NextResponse.redirect(
        new URL("/connections?error=userinfo_failed", request.url)
      );
    }

    const userInfo = await userInfoResponse.json();
    console.log("User info:", { email: userInfo.email, id: userInfo.id });

    const supabase = await createAdminClient();

    // Create or get tenant (using email domain as tenant for demo)
    const emailDomain = userInfo.email.split("@")[1];
    const { data: tenantData, error: tenantError } = await supabase
      .from("tenants")
      .upsert({ name: emailDomain } as never, { onConflict: "name" })
      .select()
      .single();

    if (tenantError) {
      console.error("Failed to create tenant:", tenantError);
      return NextResponse.redirect(
        new URL("/connections?error=tenant_failed", request.url)
      );
    }

    const tenant = tenantData as unknown as TenantRow;

    // Create or get user
    const { data: userData, error: userError } = await supabase
      .from("users")
      .upsert(
        { tenant_id: tenant.id, email: userInfo.email, role: "admin" } as never,
        { onConflict: "email" }
      )
      .select()
      .single();

    if (userError) {
      console.error("Failed to create user:", userError);
      return NextResponse.redirect(
        new URL("/connections?error=user_failed", request.url)
      );
    }

    const user = userData as unknown as UserRow;

    // Store the connection with tokens
    // Note: In production, encrypt refresh_token with KMS before storing
    const { data: connectionData, error: connectionError } = await supabase
      .from("google_connections")
      .upsert(
        {
          tenant_id: tenant.id,
          user_id: user.id,
          status: "active",
          scopes: [
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/calendar.readonly",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
          ],
          // Store tokens (would be encrypted in production)
          encrypted_refresh_token: tokens.refresh_token,
          encrypted_dek: tokens.access_token, // Temporarily store access token here
          last_synced_at: null,
          gmail_history_id: null,
          calendar_sync_token: null,
        } as never,
        { onConflict: "tenant_id,user_id" }
      )
      .select()
      .single();

    if (connectionError) {
      console.error("Failed to create connection:", connectionError);
      return NextResponse.redirect(
        new URL("/connections?error=connection_failed", request.url)
      );
    }

    const connection = connectionData as unknown as ConnectionRow;

    console.log("Connection created:", connection.id);

    // Create audit event
    await supabase.from("audit_events").insert({
      tenant_id: tenant.id,
      user_id: user.id,
      action: "google_connected",
      object_type: "google_connection",
      object_id: connection.id,
      metadata: { email: userInfo.email },
    } as never);

    // Emit connect completed event to trigger sync
    await inngest.send({
      name: "google/connect.completed",
      data: {
        tenantId: tenant.id,
        userId: user.id,
        connectionId: connection.id,
      },
    });

    return NextResponse.redirect(
      new URL("/connections?success=connected", request.url)
    );
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/connections?error=callback_failed", request.url)
    );
  }
}
