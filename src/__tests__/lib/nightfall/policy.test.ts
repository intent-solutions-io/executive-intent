import { describe, test, expect } from "vitest";
import {
  determineAction,
  redactText,
  createSummary,
  processScanResult,
  isQuarantineDetector,
  isRedactDetector,
  type NightfallFinding,
} from "@/lib/nightfall/policy";

// Helper to create a finding
const createFinding = (
  detector: string,
  confidence: NightfallFinding["confidence"] = "HIGH",
  start = 0,
  end = 10
): NightfallFinding => ({
  detector,
  detectorUUID: `uuid-${detector}`,
  confidence,
  location: {
    byteRange: { start, end },
    codepointRange: { start, end },
  },
});

describe("DLP Policy Engine", () => {
  describe("determineAction", () => {
    describe("QUARANTINE: Critical secrets", () => {
      test("detects API keys", () => {
        const findings = [createFinding("API_KEY")];
        expect(determineAction(findings)).toBe("quarantined");
      });

      test("detects AWS keys", () => {
        const findings = [createFinding("AWS_KEY")];
        expect(determineAction(findings)).toBe("quarantined");
      });

      test("detects passwords", () => {
        const findings = [createFinding("PASSWORD")];
        expect(determineAction(findings)).toBe("quarantined");
      });

      test("detects private keys", () => {
        const findings = [createFinding("PRIVATE_KEY")];
        expect(determineAction(findings)).toBe("quarantined");
      });

      test("detects SSH keys", () => {
        const findings = [createFinding("SSH_KEY")];
        expect(determineAction(findings)).toBe("quarantined");
      });

      test("detects database connection strings", () => {
        const findings = [createFinding("DATABASE_CONNECTION_STRING")];
        expect(determineAction(findings)).toBe("quarantined");
      });

      test("detects JWTs", () => {
        const findings = [createFinding("JWT")];
        expect(determineAction(findings)).toBe("quarantined");
      });
    });

    describe("QUARANTINE: SSN and national IDs", () => {
      test("detects SSN and treats as redact (not quarantine)", () => {
        // SSN is PII, not a secret - should be redacted, not quarantined
        const findings = [createFinding("SSN")];
        expect(determineAction(findings)).toBe("redacted");
      });

      test("detects national IDs", () => {
        const findings = [createFinding("NATIONAL_ID")];
        expect(determineAction(findings)).toBe("redacted");
      });
    });

    describe("QUARANTINE: Credit card numbers", () => {
      test("detects credit cards and treats as redact", () => {
        // Credit cards are PII, should be redacted
        const findings = [createFinding("CREDIT_CARD")];
        expect(determineAction(findings)).toBe("redacted");
      });

      test("detects credit card numbers", () => {
        const findings = [createFinding("CREDIT_CARD_NUMBER")];
        expect(determineAction(findings)).toBe("redacted");
      });
    });

    describe("REDACT: Email addresses", () => {
      test("detects and flags email addresses for redaction", () => {
        const findings = [createFinding("EMAIL_ADDRESS")];
        expect(determineAction(findings)).toBe("redacted");
      });
    });

    describe("REDACT: Phone numbers", () => {
      test("detects and flags phone numbers for redaction", () => {
        const findings = [createFinding("PHONE_NUMBER")];
        expect(determineAction(findings)).toBe("redacted");
      });
    });

    describe("ALLOW: Clean content", () => {
      test("allows content with no findings", () => {
        expect(determineAction([])).toBe("allowed");
      });

      test("allows content with null findings", () => {
        expect(determineAction(null as unknown as NightfallFinding[])).toBe(
          "allowed"
        );
      });

      test("allows content with undefined findings", () => {
        expect(
          determineAction(undefined as unknown as NightfallFinding[])
        ).toBe("allowed");
      });

      test("allows content with only low confidence findings", () => {
        const findings = [createFinding("API_KEY", "LOW")];
        expect(determineAction(findings)).toBe("allowed");
      });

      test("allows content with only possible confidence findings", () => {
        const findings = [createFinding("PASSWORD", "POSSIBLE")];
        expect(determineAction(findings)).toBe("allowed");
      });
    });

    describe("Mixed content categorization", () => {
      test("quarantine takes precedence over redact", () => {
        const findings = [
          createFinding("EMAIL_ADDRESS"),
          createFinding("API_KEY"),
        ];
        expect(determineAction(findings)).toBe("quarantined");
      });

      test("redact takes precedence over allow", () => {
        const findings = [
          createFinding("EMAIL_ADDRESS"),
          createFinding("UNKNOWN_DETECTOR"),
        ];
        expect(determineAction(findings)).toBe("redacted");
      });

      test("handles multiple quarantine-level findings", () => {
        const findings = [
          createFinding("API_KEY"),
          createFinding("PASSWORD"),
          createFinding("PRIVATE_KEY"),
        ];
        expect(determineAction(findings)).toBe("quarantined");
      });

      test("handles multiple redact-level findings", () => {
        const findings = [
          createFinding("EMAIL_ADDRESS"),
          createFinding("PHONE_NUMBER"),
          createFinding("SSN"),
        ];
        expect(determineAction(findings)).toBe("redacted");
      });
    });
  });

  describe("redactText", () => {
    test("redacts email addresses", () => {
      const text = "Contact john@example.com for help";
      const findings = [createFinding("EMAIL_ADDRESS", "HIGH", 8, 24)];
      expect(redactText(text, findings)).toBe(
        "Contact [EMAIL_REDACTED] for help"
      );
    });

    test("redacts phone numbers", () => {
      const text = "Call 555-123-4567 today";
      const findings = [createFinding("PHONE_NUMBER", "HIGH", 5, 17)];
      expect(redactText(text, findings)).toBe("Call [PHONE_REDACTED] today");
    });

    test("redacts SSN", () => {
      const text = "SSN: 123-45-6789";
      const findings = [createFinding("SSN", "HIGH", 5, 16)];
      expect(redactText(text, findings)).toBe("SSN: [SSN_REDACTED]");
    });

    test("redacts multiple findings", () => {
      const text = "Email: test@test.com Phone: 555-1234";
      const findings = [
        createFinding("EMAIL_ADDRESS", "HIGH", 7, 20),
        createFinding("PHONE_NUMBER", "HIGH", 28, 36),
      ];
      expect(redactText(text, findings)).toBe(
        "Email: [EMAIL_REDACTED] Phone: [PHONE_REDACTED]"
      );
    });

    test("handles empty text", () => {
      expect(redactText("", [createFinding("EMAIL_ADDRESS")])).toBe("");
    });

    test("handles no findings", () => {
      expect(redactText("Hello world", [])).toBe("Hello world");
    });

    test("ignores low confidence findings", () => {
      const text = "Contact john@example.com";
      const findings = [createFinding("EMAIL_ADDRESS", "LOW", 8, 24)];
      expect(redactText(text, findings)).toBe("Contact john@example.com");
    });

    test("ignores quarantine-level detectors (should not be redacted)", () => {
      const text = "API_KEY=sk-1234567890";
      const findings = [createFinding("API_KEY", "HIGH", 8, 21)];
      // API keys are quarantined, not redacted
      expect(redactText(text, findings)).toBe("API_KEY=sk-1234567890");
    });
  });

  describe("createSummary", () => {
    test("creates summary for allowed content", () => {
      const summary = createSummary([], "allowed");
      expect(summary).toEqual({
        totalFindings: 0,
        findingsByType: {},
        action: "allowed",
        reason: "No sensitive data detected",
      });
    });

    test("creates summary for redacted content", () => {
      const findings = [
        createFinding("EMAIL_ADDRESS"),
        createFinding("PHONE_NUMBER"),
        createFinding("EMAIL_ADDRESS"),
      ];
      const summary = createSummary(findings, "redacted");
      expect(summary).toEqual({
        totalFindings: 3,
        findingsByType: {
          EMAIL_ADDRESS: 2,
          PHONE_NUMBER: 1,
        },
        action: "redacted",
        reason: "PII detected and redacted before indexing",
      });
    });

    test("creates summary for quarantined content", () => {
      const findings = [createFinding("API_KEY"), createFinding("PASSWORD")];
      const summary = createSummary(findings, "quarantined");
      expect(summary).toEqual({
        totalFindings: 2,
        findingsByType: {
          API_KEY: 1,
          PASSWORD: 1,
        },
        action: "quarantined",
        reason: "Critical secrets detected - content not indexed",
      });
    });
  });

  describe("processScanResult", () => {
    test("processes clean content", () => {
      const result = processScanResult("Hello world", []);
      expect(result.action).toBe("allowed");
      expect(result.findings).toHaveLength(0);
      expect(result.redactedText).toBeUndefined();
      expect(result.summary.action).toBe("allowed");
    });

    test("processes content requiring redaction", () => {
      const text = "Contact test@example.com";
      const findings = [createFinding("EMAIL_ADDRESS", "HIGH", 8, 24)];
      const result = processScanResult(text, findings);

      expect(result.action).toBe("redacted");
      expect(result.findings).toHaveLength(1);
      expect(result.redactedText).toBe("Contact [EMAIL_REDACTED]");
      expect(result.summary.action).toBe("redacted");
    });

    test("processes content requiring quarantine", () => {
      const text = "Password: secret123";
      const findings = [createFinding("PASSWORD", "HIGH", 10, 19)];
      const result = processScanResult(text, findings);

      expect(result.action).toBe("quarantined");
      expect(result.findings).toHaveLength(1);
      expect(result.redactedText).toBeUndefined(); // No redaction for quarantined
      expect(result.summary.action).toBe("quarantined");
    });

    test("returns proper DLP summary structure", () => {
      const findings = [
        createFinding("EMAIL_ADDRESS"),
        createFinding("PHONE_NUMBER"),
      ];
      const result = processScanResult("test", findings);

      expect(result.summary).toHaveProperty("totalFindings");
      expect(result.summary).toHaveProperty("findingsByType");
      expect(result.summary).toHaveProperty("action");
      expect(result.summary).toHaveProperty("reason");
      expect(typeof result.summary.totalFindings).toBe("number");
      expect(typeof result.summary.findingsByType).toBe("object");
    });
  });

  describe("isQuarantineDetector", () => {
    test("returns true for API_KEY", () => {
      expect(isQuarantineDetector("API_KEY")).toBe(true);
    });

    test("returns true for PASSWORD", () => {
      expect(isQuarantineDetector("PASSWORD")).toBe(true);
    });

    test("returns false for EMAIL_ADDRESS", () => {
      expect(isQuarantineDetector("EMAIL_ADDRESS")).toBe(false);
    });

    test("returns false for unknown detector", () => {
      expect(isQuarantineDetector("UNKNOWN")).toBe(false);
    });
  });

  describe("isRedactDetector", () => {
    test("returns true for EMAIL_ADDRESS", () => {
      expect(isRedactDetector("EMAIL_ADDRESS")).toBe(true);
    });

    test("returns true for PHONE_NUMBER", () => {
      expect(isRedactDetector("PHONE_NUMBER")).toBe(true);
    });

    test("returns true for SSN", () => {
      expect(isRedactDetector("SSN")).toBe(true);
    });

    test("returns false for API_KEY", () => {
      expect(isRedactDetector("API_KEY")).toBe(false);
    });

    test("returns false for unknown detector", () => {
      expect(isRedactDetector("UNKNOWN")).toBe(false);
    });
  });
});
