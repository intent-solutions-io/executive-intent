/**
 * Test data factories for Executive Intent
 */

export const fixtures = {
  // Tenant factory
  tenant: (overrides?: Partial<TenantFixture>) => ({
    id: "test-tenant-id",
    name: "Test Company",
    plan: "free" as const,
    created_at: new Date().toISOString(),
    ...overrides,
  }),

  // User factory
  user: (overrides?: Partial<UserFixture>) => ({
    id: "test-user-id",
    tenant_id: "test-tenant-id",
    email: "test@example.com",
    role: "member" as const,
    created_at: new Date().toISOString(),
    ...overrides,
  }),

  // Google connection factory
  googleConnection: (overrides?: Partial<GoogleConnectionFixture>) => ({
    id: "test-connection-id",
    tenant_id: "test-tenant-id",
    user_id: "test-user-id",
    status: "active" as const,
    scopes: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/calendar.readonly",
    ],
    encrypted_refresh_token: "encrypted-token-data",
    encrypted_dek: "encrypted-dek-data",
    gmail_history_id: "12345",
    calendar_sync_token: "sync-token-123",
    last_synced_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  // Document factory
  document: (overrides?: Partial<DocumentFixture>) => ({
    id: "test-doc-id",
    tenant_id: "test-tenant-id",
    connection_id: "test-connection-id",
    source: "gmail" as const,
    external_id: "msg-123abc",
    external_url: "https://mail.google.com/mail/u/0/#inbox/msg-123abc",
    title: "Test Email Subject",
    author: "sender@example.com",
    participants: {
      from: "sender@example.com",
      to: ["recipient@example.com"],
      cc: [],
    },
    timestamp: new Date().toISOString(),
    dlp_status: "allowed" as const,
    dlp_summary: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  // Document chunk factory
  documentChunk: (overrides?: Partial<DocumentChunkFixture>) => ({
    id: "test-chunk-id",
    tenant_id: "test-tenant-id",
    document_id: "test-doc-id",
    chunk_index: 0,
    chunk_text: "This is a test chunk of text from an email.",
    embedding: new Array(768).fill(0.1), // 768-dim vector
    chunk_hash: "abc123hash",
    created_at: new Date().toISOString(),
    ...overrides,
  }),

  // Audit event factory
  auditEvent: (overrides?: Partial<AuditEventFixture>) => ({
    id: "test-audit-id",
    tenant_id: "test-tenant-id",
    user_id: "test-user-id",
    action: "document.created",
    object_type: "document",
    object_id: "test-doc-id",
    metadata: {},
    created_at: new Date().toISOString(),
    ...overrides,
  }),

  // Gmail message (raw API response)
  gmailMessage: (overrides?: Partial<GmailMessageFixture>) => ({
    id: "msg-123abc",
    threadId: "thread-456def",
    labelIds: ["INBOX"],
    snippet: "This is a preview of the email content...",
    historyId: "12345",
    internalDate: Date.now().toString(),
    payload: {
      headers: [
        { name: "From", value: "sender@example.com" },
        { name: "To", value: "recipient@example.com" },
        { name: "Subject", value: "Test Email Subject" },
        { name: "Date", value: new Date().toUTCString() },
      ],
      body: {
        data: Buffer.from("This is the email body content.").toString(
          "base64"
        ),
      },
    },
    ...overrides,
  }),

  // Calendar event (raw API response)
  calendarEvent: (overrides?: Partial<CalendarEventFixture>) => ({
    id: "event-789ghi",
    status: "confirmed",
    htmlLink: "https://calendar.google.com/event?eid=abc123",
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    summary: "Team Meeting",
    description: "Weekly sync to discuss project progress.",
    location: "Conference Room A",
    creator: { email: "organizer@example.com" },
    organizer: { email: "organizer@example.com" },
    start: { dateTime: new Date().toISOString(), timeZone: "America/New_York" },
    end: {
      dateTime: new Date(Date.now() + 3600000).toISOString(),
      timeZone: "America/New_York",
    },
    attendees: [
      { email: "attendee1@example.com", responseStatus: "accepted" },
      { email: "attendee2@example.com", responseStatus: "tentative" },
    ],
    ...overrides,
  }),

  // Nightfall finding
  nightfallFinding: (
    type: NightfallDetectorType,
    overrides?: Partial<NightfallFindingFixture>
  ) => ({
    detector: type,
    detectorUUID: `uuid-${type}`,
    confidence: "HIGH" as const,
    location: {
      byteRange: { start: 0, end: 10 },
      codepointRange: { start: 0, end: 10 },
    },
    matchedDetectionRules: [],
    matchedDetectionRuleUUIDs: [],
    ...overrides,
  }),

  // DLP scan result
  dlpScanResult: (status: "allowed" | "redacted" | "quarantined") => {
    const findings: NightfallFindingFixture[] = [];

    if (status === "quarantined") {
      findings.push(fixtures.nightfallFinding("API_KEY"));
      findings.push(fixtures.nightfallFinding("PASSWORD"));
    } else if (status === "redacted") {
      findings.push(fixtures.nightfallFinding("EMAIL_ADDRESS"));
      findings.push(fixtures.nightfallFinding("PHONE_NUMBER"));
    }

    return {
      status,
      findings,
      redactedText:
        status === "redacted"
          ? "Contact [EMAIL_REDACTED] at [PHONE_REDACTED]"
          : undefined,
      summary: {
        totalFindings: findings.length,
        findingsByType: findings.reduce(
          (acc, f) => {
            acc[f.detector] = (acc[f.detector] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
      },
    };
  },
};

// Type definitions for fixtures
interface TenantFixture {
  id: string;
  name: string;
  plan: "free" | "pro" | "enterprise";
  created_at: string;
}

interface UserFixture {
  id: string;
  tenant_id: string;
  email: string;
  role: "admin" | "member";
  created_at: string;
}

interface GoogleConnectionFixture {
  id: string;
  tenant_id: string;
  user_id: string;
  status: "active" | "revoked" | "error";
  scopes: string[];
  encrypted_refresh_token: string;
  encrypted_dek: string;
  gmail_history_id: string | null;
  calendar_sync_token: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

interface DocumentFixture {
  id: string;
  tenant_id: string;
  connection_id: string;
  source: "gmail" | "calendar";
  external_id: string;
  external_url: string | null;
  title: string | null;
  author: string | null;
  participants: Record<string, unknown> | null;
  timestamp: string | null;
  dlp_status: "pending" | "allowed" | "redacted" | "quarantined";
  dlp_summary: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface DocumentChunkFixture {
  id: string;
  tenant_id: string;
  document_id: string;
  chunk_index: number;
  chunk_text: string;
  embedding: number[];
  chunk_hash: string;
  created_at: string;
}

interface AuditEventFixture {
  id: string;
  tenant_id: string;
  user_id: string | null;
  action: string;
  object_type: string | null;
  object_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface GmailMessageFixture {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  historyId: string;
  internalDate: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body: { data?: string };
  };
}

interface CalendarEventFixture {
  id: string;
  status: string;
  htmlLink: string;
  created: string;
  updated: string;
  summary: string;
  description?: string;
  location?: string;
  creator: { email: string };
  organizer: { email: string };
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  attendees?: Array<{ email: string; responseStatus: string }>;
}

type NightfallDetectorType =
  | "API_KEY"
  | "PASSWORD"
  | "SSN"
  | "CREDIT_CARD"
  | "EMAIL_ADDRESS"
  | "PHONE_NUMBER"
  | "IP_ADDRESS"
  | "AWS_KEY"
  | "PRIVATE_KEY";

interface NightfallFindingFixture {
  detector: NightfallDetectorType;
  detectorUUID: string;
  confidence: "VERY_LIKELY" | "HIGH" | "POSSIBLE" | "LOW";
  location: {
    byteRange: { start: number; end: number };
    codepointRange: { start: number; end: number };
  };
  matchedDetectionRules: string[];
  matchedDetectionRuleUUIDs: string[];
}

export type {
  TenantFixture,
  UserFixture,
  GoogleConnectionFixture,
  DocumentFixture,
  DocumentChunkFixture,
  AuditEventFixture,
  GmailMessageFixture,
  CalendarEventFixture,
  NightfallDetectorType,
  NightfallFindingFixture,
};
