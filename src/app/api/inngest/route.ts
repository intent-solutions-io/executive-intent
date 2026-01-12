import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { googleConnect, googleDisconnect } from "@/lib/inngest/functions/google-connect";
import { gmailSync } from "@/lib/inngest/functions/gmail-sync";
import { dlpScan } from "@/lib/inngest/functions/dlp-scan";
import { embedIndex } from "@/lib/inngest/functions/embed-index";

// Create an API route to serve the Inngest functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    googleConnect,
    googleDisconnect,
    gmailSync,
    dlpScan,
    embedIndex,
  ],
});
