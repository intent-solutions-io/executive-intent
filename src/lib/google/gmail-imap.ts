import Imap from "imap";
import { simpleParser, ParsedMail } from "mailparser";

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
 * Fetch emails via IMAP using app password
 * No OAuth required - just GMAIL_USER_EMAIL and GMAIL_APP_PASSWORD
 */
export async function fetchGmailMessagesImap(
  maxResults: number = 10
): Promise<GmailSyncResult> {
  const email = process.env.GMAIL_USER_EMAIL;
  const password = process.env.GMAIL_APP_PASSWORD;

  if (!email || !password) {
    throw new Error("GMAIL_USER_EMAIL and GMAIL_APP_PASSWORD required");
  }

  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: email,
      password: password.replace(/\s+/g, ""), // Remove spaces from app password
      host: "imap.gmail.com",
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });

    const messages: GmailMessage[] = [];

    imap.once("ready", () => {
      imap.openBox("INBOX", true, (err, box) => {
        if (err) {
          imap.end();
          reject(err);
          return;
        }

        console.log(`INBOX has ${box.messages.total} messages`);

        // Get the last N message UIDs
        const total = box.messages.total;
        const start = Math.max(1, total - maxResults + 1);
        const range = `${start}:${total}`;

        const f = imap.seq.fetch(range, {
          bodies: "",
          struct: true,
        });

        f.on("message", (msg, seqno) => {
          let buffer = "";

          msg.on("body", (stream) => {
            stream.on("data", (chunk) => {
              buffer += chunk.toString("utf8");
            });
          });

          msg.once("end", () => {
            simpleParser(buffer)
              .then((parsed: ParsedMail) => {
                const gmailMsg: GmailMessage = {
                  id: `imap-${seqno}-${Date.now()}`,
                  threadId: parsed.messageId || `thread-${seqno}`,
                  subject: parsed.subject || "(no subject)",
                  from: parsed.from?.text || "unknown",
                  to: parsed.to
                    ? Array.isArray(parsed.to)
                      ? parsed.to.map((t) => t.text)
                      : [parsed.to.text]
                    : [],
                  date: parsed.date?.toISOString() || new Date().toISOString(),
                  snippet: (parsed.text || "").substring(0, 200),
                  body: parsed.text || parsed.html || "",
                  externalUrl: `https://mail.google.com/mail/u/0/#inbox/${parsed.messageId || seqno}`,
                };
                messages.push(gmailMsg);
              })
              .catch((parseErr) => {
                console.error(`Failed to parse message ${seqno}:`, parseErr);
              });
          });
        });

        f.once("error", (err) => {
          console.error("Fetch error:", err);
        });

        f.once("end", () => {
          console.log(`Fetched ${messages.length} messages`);
          imap.end();
        });
      });
    });

    imap.once("error", (err: Error) => {
      reject(err);
    });

    imap.once("end", () => {
      resolve({
        messages,
        newHistoryId: `imap-${Date.now()}`,
      });
    });

    imap.connect();
  });
}
