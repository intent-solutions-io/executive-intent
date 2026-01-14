/**
 * Gmail API Client for Executive Intent
 *
 * Handles fetching emails using the Gmail API with OAuth tokens.
 */

import { google, gmail_v1 } from "googleapis";
import { getSecret } from "@/lib/secret-manager";

export interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string[];
  date: string;
  snippet: string;
  body: string;
  externalUrl: string;
}

export interface GmailSyncResult {
  messages: GmailMessage[];
  newHistoryId: string | null;
}

/**
 * Creates an authenticated Gmail client
 */
export async function createGmailClient(accessToken: string): Promise<gmail_v1.Gmail> {
  const clientSecret = await getSecret("GOOGLE_CLIENT_SECRET");

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    clientSecret
  );

  oauth2Client.setCredentials({ access_token: accessToken });

  return google.gmail({ version: "v1", auth: oauth2Client });
}

/**
 * Refreshes an access token using a refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const clientSecret = await getSecret("GOOGLE_CLIENT_SECRET");

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    clientSecret
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const { credentials } = await oauth2Client.refreshAccessToken();

  if (!credentials.access_token) {
    throw new Error("Failed to refresh access token");
  }

  return {
    accessToken: credentials.access_token,
    expiresIn: credentials.expiry_date
      ? Math.floor((credentials.expiry_date - Date.now()) / 1000)
      : 3600,
  };
}

/**
 * Fetches messages from Gmail
 * If historyId is provided, fetches incremental changes
 * Otherwise fetches recent messages
 */
export async function fetchGmailMessages(
  accessToken: string,
  historyId: string | null,
  maxResults: number = 50
): Promise<GmailSyncResult> {
  const gmail = await createGmailClient(accessToken);

  if (historyId) {
    // Incremental sync using history API
    return await fetchHistoryChanges(gmail, historyId, maxResults);
  } else {
    // Initial sync - fetch recent messages
    return await fetchRecentMessages(gmail, maxResults);
  }
}

/**
 * Fetches recent messages for initial sync
 */
async function fetchRecentMessages(
  gmail: gmail_v1.Gmail,
  maxResults: number
): Promise<GmailSyncResult> {
  const messages: GmailMessage[] = [];

  // List recent messages
  const listResponse = await gmail.users.messages.list({
    userId: "me",
    maxResults,
    q: "in:inbox", // Only inbox messages for MVP
  });

  const messageIds = listResponse.data.messages || [];

  // Fetch full message details for each
  for (const msg of messageIds) {
    if (!msg.id) continue;

    try {
      const fullMessage = await fetchMessageDetails(gmail, msg.id);
      if (fullMessage) {
        messages.push(fullMessage);
      }
    } catch (error) {
      console.error(`Failed to fetch message ${msg.id}:`, error);
      // Continue with other messages
    }
  }

  // Get current history ID for future incremental syncs
  const profile = await gmail.users.getProfile({ userId: "me" });
  const newHistoryId = profile.data.historyId || null;

  return { messages, newHistoryId };
}

/**
 * Fetches incremental changes using history API
 */
async function fetchHistoryChanges(
  gmail: gmail_v1.Gmail,
  startHistoryId: string,
  maxResults: number
): Promise<GmailSyncResult> {
  const messages: GmailMessage[] = [];
  const processedIds = new Set<string>();

  try {
    const historyResponse = await gmail.users.history.list({
      userId: "me",
      startHistoryId,
      maxResults,
      historyTypes: ["messageAdded"],
    });

    const history = historyResponse.data.history || [];

    for (const item of history) {
      const addedMessages = item.messagesAdded || [];

      for (const added of addedMessages) {
        const msgId = added.message?.id;
        if (!msgId || processedIds.has(msgId)) continue;

        processedIds.add(msgId);

        try {
          const fullMessage = await fetchMessageDetails(gmail, msgId);
          if (fullMessage) {
            messages.push(fullMessage);
          }
        } catch (error) {
          console.error(`Failed to fetch message ${msgId}:`, error);
        }
      }
    }

    const newHistoryId = historyResponse.data.historyId || startHistoryId;
    return { messages, newHistoryId };

  } catch (error: unknown) {
    // If history is too old, fall back to recent messages
    if (error && typeof error === 'object' && 'code' in error && error.code === 404) {
      console.log("History too old, falling back to recent messages");
      return await fetchRecentMessages(gmail, maxResults);
    }
    throw error;
  }
}

/**
 * Fetches full message details including body
 */
async function fetchMessageDetails(
  gmail: gmail_v1.Gmail,
  messageId: string
): Promise<GmailMessage | null> {
  const response = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  const message = response.data;
  if (!message.id || !message.threadId) return null;

  // Extract headers
  const headers = message.payload?.headers || [];
  const getHeader = (name: string) =>
    headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

  const subject = getHeader("subject");
  const from = getHeader("from");
  const to = getHeader("to").split(",").map(t => t.trim()).filter(Boolean);
  const date = getHeader("date");

  // Extract body text
  const body = extractBodyText(message.payload);

  return {
    id: message.id,
    threadId: message.threadId,
    subject,
    from,
    to,
    date,
    snippet: message.snippet || "",
    body,
    externalUrl: `https://mail.google.com/mail/u/0/#inbox/${message.id}`,
  };
}

/**
 * Extracts plain text body from message payload
 */
function extractBodyText(payload: gmail_v1.Schema$MessagePart | undefined): string {
  if (!payload) return "";

  // Check for plain text body directly
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64(payload.body.data);
  }

  // Check parts for multipart messages
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBase64(part.body.data);
      }
    }

    // Recurse into nested parts
    for (const part of payload.parts) {
      const text = extractBodyText(part);
      if (text) return text;
    }
  }

  // Fall back to HTML and strip tags (basic)
  if (payload.mimeType === "text/html" && payload.body?.data) {
    const html = decodeBase64(payload.body.data);
    return stripHtmlTags(html);
  }

  return "";
}

/**
 * Decodes base64url encoded string
 */
function decodeBase64(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

/**
 * Basic HTML tag stripping
 */
function stripHtmlTags(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}
