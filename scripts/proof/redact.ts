/**
 * Centralized secret redaction module for Executive Intent proof system
 *
 * Detects and redacts sensitive patterns from evidence output to prevent
 * accidental secret leakage in public artifacts.
 */

// Secret patterns to detect and block
export const SECRET_PATTERNS = [
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, // JWT tokens
  /sk-[A-Za-z0-9]{48}/g, // OpenAI keys
  /sk-proj-[A-Za-z0-9_-]+/g, // OpenAI project keys
  /NF-[A-Za-z0-9]{30,}/g, // Nightfall keys
  /GOCSPX-[A-Za-z0-9_-]+/g, // Google OAuth secrets
  /ghp_[A-Za-z0-9]{36}/g, // GitHub tokens
  /gsk_[A-Za-z0-9]{50,}/g, // Groq keys
  /re_[A-Za-z0-9_]{20,}/g, // Resend keys
  /signkey-[a-z]+-[a-f0-9]+/g, // Inngest signing keys
  /supabase_service_role_[A-Za-z0-9_-]+/gi, // Supabase service role
  /password[=:]\s*["']?[^"'\s]+["']?/gi, // Password patterns
  /api[_-]?key[=:]\s*["']?[A-Za-z0-9_-]+["']?/gi, // API key patterns
];

/**
 * Check if an object contains any secret patterns
 */
export function containsSecrets(obj: unknown): boolean {
  const str = JSON.stringify(obj);
  return SECRET_PATTERNS.some(pattern => {
    pattern.lastIndex = 0; // Reset regex state
    return pattern.test(str);
  });
}

/**
 * Redact any secrets from an object by replacing matches with [REDACTED]
 */
export function redactSecrets<T>(obj: T): T {
  const str = JSON.stringify(obj);
  let redacted = str;

  SECRET_PATTERNS.forEach(pattern => {
    pattern.lastIndex = 0; // Reset regex state
    redacted = redacted.replace(pattern, '[REDACTED]');
  });

  return JSON.parse(redacted) as T;
}

/**
 * Redact secrets from a string
 */
export function redactString(str: string): string {
  let redacted = str;

  SECRET_PATTERNS.forEach(pattern => {
    pattern.lastIndex = 0;
    redacted = redacted.replace(pattern, '[REDACTED]');
  });

  return redacted;
}
