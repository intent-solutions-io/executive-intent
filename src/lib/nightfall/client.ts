/**
 * Nightfall DLP API Client for Executive Intent
 *
 * Scans text for sensitive data using Nightfall's REST API.
 */

import { getSecret } from "@/lib/secret-manager";

const NIGHTFALL_API_URL = "https://api.nightfall.ai/v3/scan";

export interface NightfallFinding {
  detector: string;
  detectorUUID: string;
  confidence: "VERY_LIKELY" | "HIGH" | "POSSIBLE" | "LOW";
  location: {
    byteRange: { start: number; end: number };
    codepointRange: { start: number; end: number };
  };
  finding?: string;
}

export interface NightfallScanRequest {
  payload: string[];
  config: {
    detectionRules: Array<{
      detectors: Array<{
        minNumFindings?: number;
        minConfidence?: string;
        detectorType: string;
        nightfallDetector?: string;
      }>;
    }>;
  };
}

export interface NightfallScanResponse {
  findings: NightfallFinding[][];
}

/**
 * Default detectors for Executive Intent
 * These cover common PII and secrets
 */
const DEFAULT_DETECTORS = [
  // Secrets (QUARANTINE level)
  { detectorType: "NIGHTFALL_DETECTOR", nightfallDetector: "API_KEY" },
  { detectorType: "NIGHTFALL_DETECTOR", nightfallDetector: "CRYPTOGRAPHIC_KEY" },
  { detectorType: "NIGHTFALL_DETECTOR", nightfallDetector: "PASSWORD_IN_CODE" },
  // PII (REDACT level)
  { detectorType: "NIGHTFALL_DETECTOR", nightfallDetector: "CREDIT_CARD_NUMBER" },
  { detectorType: "NIGHTFALL_DETECTOR", nightfallDetector: "US_SOCIAL_SECURITY_NUMBER" },
  { detectorType: "NIGHTFALL_DETECTOR", nightfallDetector: "PHONE_NUMBER" },
  { detectorType: "NIGHTFALL_DETECTOR", nightfallDetector: "EMAIL_ADDRESS" },
  { detectorType: "NIGHTFALL_DETECTOR", nightfallDetector: "IP_ADDRESS" },
  { detectorType: "NIGHTFALL_DETECTOR", nightfallDetector: "US_BANK_ROUTING_MICR" },
];

/**
 * Scans text with Nightfall DLP
 */
export async function scanText(
  textPayloads: string[]
): Promise<NightfallFinding[]> {
  let apiKey: string;
  try {
    apiKey = await getSecret("NIGHTFALL_API_KEY");
  } catch {
    console.warn("NIGHTFALL_API_KEY not available, skipping DLP scan");
    return [];
  }

  // Filter out empty strings
  const validPayloads = textPayloads.filter(t => t && t.trim().length > 0);

  if (validPayloads.length === 0) {
    return [];
  }

  const requestBody = {
    payload: validPayloads,
    config: {
      detectionRules: [
        {
          logicalOp: "ANY",
          detectors: DEFAULT_DETECTORS.map(d => ({
            ...d,
            minConfidence: "POSSIBLE",
            minNumFindings: 1,
          })),
        },
      ],
    },
  };

  try {
    const response = await fetch(NIGHTFALL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Nightfall API error:", response.status, errorText);
      throw new Error(`Nightfall API error: ${response.status}`);
    }

    const data = (await response.json()) as NightfallScanResponse;

    // Flatten findings from all payloads
    const allFindings: NightfallFinding[] = [];
    for (const payloadFindings of data.findings || []) {
      if (payloadFindings) {
        allFindings.push(...payloadFindings);
      }
    }

    return allFindings;
  } catch (error) {
    console.error("Nightfall scan error:", error);
    throw error;
  }
}

/**
 * Scans multiple text fields and returns findings with field context
 */
export async function scanTextFields(
  textFields: Record<string, string>
): Promise<{
  findings: NightfallFinding[];
  findingsByField: Record<string, NightfallFinding[]>;
}> {
  const fieldNames = Object.keys(textFields);
  const fieldValues = fieldNames.map(name => textFields[name] || "");

  const findings = await scanText(fieldValues);

  // Map findings back to fields based on which payload they came from
  // Note: This is a simplification - in production we'd track offsets more carefully
  const findingsByField: Record<string, NightfallFinding[]> = {};

  for (const name of fieldNames) {
    findingsByField[name] = [];
  }

  // For now, associate all findings with all non-empty fields
  // A more sophisticated implementation would track payload indices
  for (const finding of findings) {
    for (const name of fieldNames) {
      if (textFields[name] && textFields[name].length > 0) {
        findingsByField[name].push(finding);
        break; // Only assign to first matching field
      }
    }
  }

  return { findings, findingsByField };
}

/**
 * Quick check if text contains any sensitive data
 * Returns true if any HIGH or VERY_LIKELY findings
 */
export async function hasSensitiveData(text: string): Promise<boolean> {
  const findings = await scanText([text]);

  return findings.some(
    f => f.confidence === "HIGH" || f.confidence === "VERY_LIKELY"
  );
}
