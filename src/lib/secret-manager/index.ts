/**
 * Secrets Manager for Executive Intent
 *
 * Provides secure secret access with:
 * - Development: Fast local access via process.env
 * - Production: Google Secret Manager via ADC/WIF (no API keys)
 * - Per-instance caching (fetch once per cold start)
 * - Graceful migration fallback (env with warning)
 *
 * Usage:
 *   const apiKey = await getSecret("NIGHTFALL_API_KEY");
 *
 * Warm-up (optional, reduces first-request latency):
 *   await warmSecrets();
 */

import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

/**
 * Secrets managed by Secret Manager in production.
 * Maps environment variable names to Secret Manager secret IDs.
 */
export const MANAGED_SECRETS = {
  // Supabase
  SUPABASE_SERVICE_ROLE_KEY: "supabase-service-role-key",

  // Google OAuth
  GOOGLE_CLIENT_SECRET: "google-oauth-client-secret",

  // Nightfall DLP
  NIGHTFALL_API_KEY: "nightfall-api-key",

  // Inngest
  INNGEST_EVENT_KEY: "inngest-event-key",
  INNGEST_SIGNING_KEY: "inngest-signing-key",
} as const;

export type SecretName = keyof typeof MANAGED_SECRETS;

// In-memory cache (per-instance)
const secretCache = new Map<string, string>();

// Lazy-initialized client
let smClient: SecretManagerServiceClient | null = null;

function getClient(): SecretManagerServiceClient {
  if (!smClient) {
    smClient = new SecretManagerServiceClient();
  }
  return smClient;
}

function getProjectId(): string {
  const projectId = process.env.GCP_PROJECT_ID;
  if (!projectId) {
    throw new Error("GCP_PROJECT_ID not set");
  }
  return projectId;
}

function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Fetches a secret from Secret Manager
 */
async function fetchFromSecretManager(secretId: string): Promise<string> {
  const client = getClient();
  const projectId = getProjectId();

  const [version] = await client.accessSecretVersion({
    name: `projects/${projectId}/secrets/${secretId}/versions/latest`,
  });

  const payload = version.payload?.data;
  if (!payload) {
    throw new Error(`Secret ${secretId} has no payload`);
  }

  return typeof payload === "string"
    ? payload
    : Buffer.from(payload).toString("utf8");
}

/**
 * Gets a secret value.
 *
 * - Development: Returns from process.env (fast, no network)
 * - Production: Returns from Secret Manager (secure, audited)
 *
 * Caches in memory per instance to avoid repeated fetches.
 */
export async function getSecret(name: SecretName): Promise<string> {
  // Check cache first
  if (secretCache.has(name)) {
    return secretCache.get(name)!;
  }

  // Development: always use env (fast local iteration)
  if (isDevelopment()) {
    const value = process.env[name];
    if (!value) {
      throw new Error(`Secret ${name} not set in environment`);
    }
    secretCache.set(name, value);
    return value;
  }

  // Production: try Secret Manager first
  const secretId = MANAGED_SECRETS[name];

  try {
    const value = await fetchFromSecretManager(secretId);
    secretCache.set(name, value);
    return value;
  } catch (error) {
    // Fallback to env during migration (with warning)
    const envValue = process.env[name];
    if (envValue) {
      console.warn(
        `[secrets] ${name} not in Secret Manager, using env fallback. ` +
          `Migrate to: gcloud secrets create ${secretId} --data-file=-`
      );
      secretCache.set(name, envValue);
      return envValue;
    }

    throw new Error(
      `Secret ${name} not found in Secret Manager or environment: ${error}`
    );
  }
}

/**
 * Gets a secret synchronously from cache.
 * Throws if secret hasn't been warmed up first.
 * Use this only after calling warmSecrets() or getSecret().
 */
export function getSecretSync(name: SecretName): string {
  const value = secretCache.get(name);
  if (!value) {
    throw new Error(
      `Secret ${name} not in cache. Call warmSecrets() or getSecret() first.`
    );
  }
  return value;
}

/**
 * Pre-fetches all managed secrets into cache.
 * Call this on application startup to reduce first-request latency.
 *
 * Returns a status object indicating which secrets were loaded.
 */
export async function warmSecrets(): Promise<{
  loaded: SecretName[];
  failed: Array<{ name: SecretName; error: string }>;
}> {
  const loaded: SecretName[] = [];
  const failed: Array<{ name: SecretName; error: string }> = [];

  const secretNames = Object.keys(MANAGED_SECRETS) as SecretName[];

  await Promise.all(
    secretNames.map(async (name) => {
      try {
        await getSecret(name);
        loaded.push(name);
      } catch (error) {
        failed.push({
          name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    })
  );

  return { loaded, failed };
}

/**
 * Clears the secret cache. Mainly for testing.
 */
export function clearSecretCache(): void {
  secretCache.clear();
}

/**
 * Checks if secrets are available (for health checks / evidence).
 */
export async function checkSecretsHealth(): Promise<{
  status: "ok" | "degraded" | "unavailable";
  source: "secret-manager" | "environment" | "none";
  available: SecretName[];
  missing: SecretName[];
}> {
  const available: SecretName[] = [];
  const missing: SecretName[] = [];

  const secretNames = Object.keys(MANAGED_SECRETS) as SecretName[];

  for (const name of secretNames) {
    try {
      await getSecret(name);
      available.push(name);
    } catch {
      missing.push(name);
    }
  }

  const source = isDevelopment() ? "environment" : "secret-manager";
  const status =
    missing.length === 0
      ? "ok"
      : available.length === 0
        ? "unavailable"
        : "degraded";

  return { status, source, available, missing };
}
