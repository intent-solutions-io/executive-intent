import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import { scanTextFields, NightfallFinding } from "@/lib/nightfall/client";
import {
  determineAction,
  redactText,
  createSummary,
  DlpAction,
} from "@/lib/nightfall/policy";

/**
 * Handles DLP scanning via Nightfall.
 *
 * Steps:
 * 1. Call Nightfall API with text fields
 * 2. Evaluate findings against policy tiers
 * 3. Apply policy action (ALLOW, REDACT, QUARANTINE)
 * 4. Update document with DLP status
 * 5. If allowed/redacted, emit embedding request
 */
export const dlpScan = inngest.createFunction(
  {
    id: "dlp-scan",
    name: "Nightfall DLP Scan",
    retries: 3,
  },
  { event: "dlp/scan.requested" },
  async ({ event, step }) => {
    const { tenantId, documentId, source, externalId, textFields } = event.data;

    // Step 1: Call Nightfall API
    const scanResult = await step.run("scan-nightfall", async () => {
      console.log(`Scanning document ${documentId} with Nightfall`);

      try {
        const { findings, findingsByField } = await scanTextFields(textFields);
        console.log(`Nightfall found ${findings.length} findings`);

        return {
          findings,
          findingsByField,
          scanned: true,
        };
      } catch (error) {
        console.error("Nightfall scan failed:", error);
        // If Nightfall fails, allow the document through
        // In production, you might want to quarantine instead
        return {
          findings: [] as NightfallFinding[],
          findingsByField: {} as Record<string, NightfallFinding[]>,
          scanned: false,
          error: String(error),
        };
      }
    });

    // Step 2: Evaluate policy
    const policyResult = await step.run("evaluate-policy", async () => {
      const action = determineAction(scanResult.findings);
      const summary = createSummary(scanResult.findings, action);

      console.log(`DLP policy result for ${documentId}: ${action}`);

      return {
        action,
        summary,
      };
    });

    // Step 3: Apply redaction if needed
    let sanitizedText: Record<string, string> = textFields;
    if (policyResult.action === "redacted") {
      sanitizedText = await step.run("apply-redaction", async () => {
        const redacted: Record<string, string> = {};

        for (const [field, text] of Object.entries(textFields)) {
          // Get findings for this field
          const fieldFindings = scanResult.findingsByField[field] || [];
          redacted[field] = redactText(text, fieldFindings);
        }

        console.log(`Redacted ${scanResult.findings.length} findings in document ${documentId}`);
        return redacted;
      });
    }

    // Step 4: Update document with DLP status
    await step.run("update-document", async () => {
      const supabase = await createAdminClient();
      // Map action to dlp_status enum
      const dlpStatus: "allowed" | "redacted" | "quarantined" = policyResult.action;

      const { error } = await supabase
        .from("documents")
        .update({
          dlp_status: dlpStatus,
          dlp_summary: policyResult.summary,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", documentId);

      if (error) {
        console.error("Failed to update document DLP status:", error);
        throw error;
      }

      console.log(`Updated document ${documentId} with status: ${dlpStatus}`);
      return { updated: true };
    });

    // Step 5: Store sanitized text for embedding (if not quarantined)
    if (policyResult.action !== "quarantined") {
      // Store the sanitized text in a temporary field or pass to embedding
      await step.run("store-sanitized", async () => {
        // For now, we'll pass the sanitized text via the embedding event
        // In a more robust implementation, you might store this in a separate table
        return { sanitized: true };
      });

      // Step 6: Emit embedding request
      await step.sendEvent("request-embedding", {
        name: "embedding/index.requested",
        data: {
          tenantId,
          documentId,
          // Pass sanitized text for embedding
          sanitizedText,
        },
      });
    } else {
      console.log(`Document ${documentId} quarantined - no embedding generated`);
    }

    // Step 7: Audit
    await step.run("audit-dlp", async () => {
      const supabase = await createAdminClient();
      await supabase.from("audit_events").insert({
        tenant_id: tenantId,
        action: `dlp_${policyResult.action}`,
        object_type: "document",
        object_id: documentId,
        metadata: {
          source,
          externalId,
          findingsCount: scanResult.findings.length,
          scanned: scanResult.scanned,
        },
      } as never);

      console.log(`Audit: DLP scan for ${source}/${externalId} - ${policyResult.action}`);
      return { audited: true };
    });

    return {
      success: true,
      documentId,
      action: policyResult.action,
      summary: policyResult.summary,
      findingsCount: scanResult.findings.length,
    };
  }
);
