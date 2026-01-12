import { inngest } from "../client";

/**
 * DLP policy tiers
 */
const DLP_TIERS = {
  QUARANTINE: [
    "PASSWORD",
    "API_KEY",
    "PRIVATE_KEY",
    "SSN",
    "NATIONAL_ID",
    "BANK_ACCOUNT",
    "CREDIT_CARD",
  ],
  REDACT: [
    "EMAIL_ADDRESS",
    "PHONE_NUMBER",
    "ADDRESS",
    "PARTIAL_CARD",
  ],
};

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
    const findings = await step.run("scan-nightfall", async () => {
      // TODO: Call Nightfall API
      // const nightfall = new NightfallClient(process.env.NIGHTFALL_API_KEY);
      // const response = await nightfall.scanText(Object.values(textFields));

      console.log(`Scanning document ${documentId} with Nightfall`);

      // Mock response - no findings for now
      return {
        findings: [] as Array<{
          detector: string;
          confidence: string;
          location: { start: number; end: number };
          field: string;
        }>,
      };
    });

    // Step 2: Evaluate policy
    const policyResult = await step.run("evaluate-policy", async () => {
      const detectorTypes = findings.findings.map((f) => f.detector);

      // Check for quarantine-level findings
      const hasQuarantineLevel = detectorTypes.some((d) =>
        DLP_TIERS.QUARANTINE.includes(d)
      );
      if (hasQuarantineLevel) {
        return {
          action: "quarantine" as const,
          summary: {
            totalFindings: findings.findings.length,
            quarantineReasons: detectorTypes.filter((d) =>
              DLP_TIERS.QUARANTINE.includes(d)
            ),
          },
        };
      }

      // Check for redact-level findings
      const hasRedactLevel = detectorTypes.some((d) =>
        DLP_TIERS.REDACT.includes(d)
      );
      if (hasRedactLevel) {
        return {
          action: "redacted" as const,
          summary: {
            totalFindings: findings.findings.length,
            redactedTypes: detectorTypes.filter((d) =>
              DLP_TIERS.REDACT.includes(d)
            ),
          },
        };
      }

      // No sensitive findings
      return {
        action: "allowed" as const,
        summary: {
          totalFindings: 0,
        },
      };
    });

    // Step 3: Apply redaction if needed
    let sanitizedText = textFields;
    if (policyResult.action === "redacted") {
      sanitizedText = await step.run("apply-redaction", async () => {
        // TODO: Apply redaction to text fields
        // Replace sensitive spans with [REDACTED]
        console.log(`Redacting ${findings.findings.length} findings in document ${documentId}`);
        return textFields; // Would be redacted version
      });
    }

    // Step 4: Update document with DLP status
    await step.run("update-document", async () => {
      // TODO: Update document in DB with dlp_status and dlp_summary
      console.log(`Updating document ${documentId} with status: ${policyResult.action}`);
      return { updated: true };
    });

    // Step 5: Emit embedding request if allowed/redacted
    if (policyResult.action !== "quarantine") {
      await step.sendEvent("request-embedding", {
        name: "embedding/index.requested",
        data: {
          tenantId,
          documentId,
        },
      });
    }

    // Step 6: Audit
    await step.run("audit-dlp", async () => {
      console.log(`Audit: DLP scan for ${source}/${externalId} - ${policyResult.action}`);
      return { audited: true };
    });

    return {
      success: true,
      documentId,
      action: policyResult.action,
      summary: policyResult.summary,
    };
  }
);
