/**
 * DLP Policy Engine for Executive Intent
 *
 * Determines how to handle content based on Nightfall DLP findings.
 * Three possible outcomes:
 * - ALLOWED: No sensitive data, index as-is
 * - REDACTED: PII found, redact and index
 * - QUARANTINED: Critical secrets found, do not index
 */

export type DlpAction = "allowed" | "redacted" | "quarantined";

export interface NightfallFinding {
  detector: string;
  detectorUUID: string;
  confidence: "VERY_LIKELY" | "HIGH" | "POSSIBLE" | "LOW";
  location: {
    byteRange: { start: number; end: number };
    codepointRange: { start: number; end: number };
  };
  finding?: string; // The actual matched text (may not always be present)
}

export interface DlpScanResult {
  action: DlpAction;
  findings: NightfallFinding[];
  redactedText?: string;
  summary: DlpSummary;
}

export interface DlpSummary {
  totalFindings: number;
  findingsByType: Record<string, number>;
  action: DlpAction;
  reason: string;
}

// Detectors that trigger QUARANTINE (critical secrets - never index)
const QUARANTINE_DETECTORS = new Set([
  "API_KEY",
  "AWS_KEY",
  "AZURE_KEY",
  "GCP_KEY",
  "PRIVATE_KEY",
  "PASSWORD",
  "SECRET_KEY",
  "DATABASE_CONNECTION_STRING",
  "JWT",
  "OAUTH_TOKEN",
  "SSH_KEY",
  "PGP_KEY",
  "ENCRYPTION_KEY",
]);

// Detectors that trigger REDACT (PII - redact but allow indexing)
const REDACT_DETECTORS = new Set([
  "SSN",
  "SOCIAL_SECURITY_NUMBER",
  "CREDIT_CARD",
  "CREDIT_CARD_NUMBER",
  "BANK_ACCOUNT",
  "IBAN",
  "ROUTING_NUMBER",
  "PASSPORT_NUMBER",
  "DRIVERS_LICENSE",
  "NATIONAL_ID",
  "TAX_ID",
  "EMAIL_ADDRESS",
  "PHONE_NUMBER",
  "IP_ADDRESS",
  "DATE_OF_BIRTH",
  "MEDICAL_RECORD_NUMBER",
  "HEALTH_INSURANCE_ID",
]);

// Confidence threshold for taking action
const CONFIDENCE_THRESHOLD: Record<
  NightfallFinding["confidence"],
  number
> = {
  VERY_LIKELY: 4,
  HIGH: 3,
  POSSIBLE: 2,
  LOW: 1,
};

const MIN_CONFIDENCE_FOR_ACTION = CONFIDENCE_THRESHOLD.HIGH;

/**
 * Determines the DLP action based on Nightfall findings
 */
export function determineAction(findings: NightfallFinding[]): DlpAction {
  if (!findings || findings.length === 0) {
    return "allowed";
  }

  // Filter to only high-confidence findings
  const significantFindings = findings.filter(
    (f) => CONFIDENCE_THRESHOLD[f.confidence] >= MIN_CONFIDENCE_FOR_ACTION
  );

  if (significantFindings.length === 0) {
    return "allowed";
  }

  // Check for quarantine-level detectors first
  const hasQuarantineDetector = significantFindings.some((f) =>
    QUARANTINE_DETECTORS.has(f.detector)
  );

  if (hasQuarantineDetector) {
    return "quarantined";
  }

  // Check for redact-level detectors
  const hasRedactDetector = significantFindings.some((f) =>
    REDACT_DETECTORS.has(f.detector)
  );

  if (hasRedactDetector) {
    return "redacted";
  }

  // Unknown detector type - default to allowed
  return "allowed";
}

/**
 * Redacts sensitive content from text based on findings
 */
export function redactText(
  text: string,
  findings: NightfallFinding[]
): string {
  if (!findings || findings.length === 0 || !text) {
    return text;
  }

  // Sort findings by start position in reverse order (process from end to start)
  // to avoid position shifts when replacing
  const sortedFindings = [...findings]
    .filter((f) => CONFIDENCE_THRESHOLD[f.confidence] >= MIN_CONFIDENCE_FOR_ACTION)
    .filter((f) => REDACT_DETECTORS.has(f.detector))
    .sort((a, b) => b.location.codepointRange.start - a.location.codepointRange.start);

  let result = text;

  for (const finding of sortedFindings) {
    const { start, end } = finding.location.codepointRange;
    const redactionLabel = getRedactionLabel(finding.detector);
    result = result.slice(0, start) + redactionLabel + result.slice(end);
  }

  return result;
}

/**
 * Gets the redaction label for a detector type
 */
function getRedactionLabel(detector: string): string {
  const labels: Record<string, string> = {
    EMAIL_ADDRESS: "[EMAIL_REDACTED]",
    PHONE_NUMBER: "[PHONE_REDACTED]",
    SSN: "[SSN_REDACTED]",
    SOCIAL_SECURITY_NUMBER: "[SSN_REDACTED]",
    CREDIT_CARD: "[CARD_REDACTED]",
    CREDIT_CARD_NUMBER: "[CARD_REDACTED]",
    BANK_ACCOUNT: "[ACCOUNT_REDACTED]",
    IP_ADDRESS: "[IP_REDACTED]",
    DATE_OF_BIRTH: "[DOB_REDACTED]",
    PASSPORT_NUMBER: "[PASSPORT_REDACTED]",
    DRIVERS_LICENSE: "[LICENSE_REDACTED]",
  };

  return labels[detector] || "[REDACTED]";
}

/**
 * Creates a summary of DLP findings
 */
export function createSummary(
  findings: NightfallFinding[],
  action: DlpAction
): DlpSummary {
  const findingsByType: Record<string, number> = {};

  for (const finding of findings) {
    findingsByType[finding.detector] =
      (findingsByType[finding.detector] || 0) + 1;
  }

  let reason: string;
  switch (action) {
    case "quarantined":
      reason = "Critical secrets detected - content not indexed";
      break;
    case "redacted":
      reason = "PII detected and redacted before indexing";
      break;
    default:
      reason = "No sensitive data detected";
  }

  return {
    totalFindings: findings.length,
    findingsByType,
    action,
    reason,
  };
}

/**
 * Main entry point: Processes Nightfall findings and returns scan result
 */
export function processScanResult(
  text: string,
  findings: NightfallFinding[]
): DlpScanResult {
  const action = determineAction(findings);
  const summary = createSummary(findings, action);

  const result: DlpScanResult = {
    action,
    findings,
    summary,
  };

  // Only include redacted text if action is 'redacted'
  if (action === "redacted") {
    result.redactedText = redactText(text, findings);
  }

  return result;
}

/**
 * Check if a detector is in the quarantine category
 */
export function isQuarantineDetector(detector: string): boolean {
  return QUARANTINE_DETECTORS.has(detector);
}

/**
 * Check if a detector is in the redact category
 */
export function isRedactDetector(detector: string): boolean {
  return REDACT_DETECTORS.has(detector);
}
