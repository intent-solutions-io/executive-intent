import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard/connections?error=${error}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/dashboard/connections?error=no_code", request.url)
    );
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Token exchange failed:", errorData);
      return NextResponse.redirect(
        new URL("/dashboard/connections?error=token_exchange_failed", request.url)
      );
    }

    const tokens = await tokenResponse.json();

    // TODO: Get user info from token
    // TODO: Get tenant_id and user_id from session
    // TODO: Encrypt refresh token with KMS
    // TODO: Store connection in database

    const tenantId = "placeholder-tenant-id";
    const userId = "placeholder-user-id";
    const connectionId = "placeholder-connection-id";

    // Emit connect completed event to trigger sync
    await inngest.send({
      name: "google/connect.completed",
      data: {
        tenantId,
        userId,
        connectionId,
      },
    });

    return NextResponse.redirect(
      new URL("/dashboard/connections?success=connected", request.url)
    );
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/dashboard/connections?error=callback_failed", request.url)
    );
  }
}
