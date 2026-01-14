import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getSecret } from "@/lib/secret-manager";

// Cached client instance
let adminClient: SupabaseClient<Database> | null = null;

/**
 * Creates a Supabase admin client with service role key.
 * ONLY use this server-side, never expose to the browser.
 *
 * Fetches service role key from Secret Manager (prod) or env (dev).
 * Caches the client instance for reuse.
 */
export async function createAdminClient(): Promise<SupabaseClient<Database>> {
  if (adminClient) {
    return adminClient;
  }

  const serviceRoleKey = await getSecret("SUPABASE_SERVICE_ROLE_KEY");

  adminClient = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  return adminClient;
}
