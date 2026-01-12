import { describe, test, expect } from "vitest";
import {
  chunkText,
  chunkEmail,
  chunkCalendarEvent,
  generateChunkHash,
  validateChunks,
  type TextChunk,
} from "@/lib/embeddings/chunker";

describe("Text Chunker", () => {
  describe("generateChunkHash", () => {
    test("generates consistent hash for same input", () => {
      const hash1 = generateChunkHash("test text", 0);
      const hash2 = generateChunkHash("test text", 0);
      expect(hash1).toBe(hash2);
    });

    test("generates different hash for different text", () => {
      const hash1 = generateChunkHash("text one", 0);
      const hash2 = generateChunkHash("text two", 0);
      expect(hash1).not.toBe(hash2);
    });

    test("generates different hash for different index", () => {
      const hash1 = generateChunkHash("same text", 0);
      const hash2 = generateChunkHash("same text", 1);
      expect(hash1).not.toBe(hash2);
    });

    test("hash is 16 characters", () => {
      const hash = generateChunkHash("test", 0);
      expect(hash).toHaveLength(16);
    });

    test("hash only contains hex characters", () => {
      const hash = generateChunkHash("test", 0);
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe("chunkText", () => {
    test("handles empty text", () => {
      expect(chunkText("")).toEqual([]);
      expect(chunkText("   ")).toEqual([]);
    });

    test("handles short text that fits in one chunk", () => {
      const text = "Short text";
      const chunks = chunkText(text, { maxChunkSize: 100 });
      expect(chunks).toHaveLength(1);
      expect(chunks[0].text).toBe("Short text");
      expect(chunks[0].index).toBe(0);
    });

    test("splits long text into multiple chunks", () => {
      const text =
        "This is a longer piece of text. It should be split into multiple chunks for processing.";
      const chunks = chunkText(text, { maxChunkSize: 40, overlapSize: 5 });
      expect(chunks.length).toBeGreaterThan(1);
    });

    test("respects max chunk size", () => {
      const text = "Word ".repeat(100); // 500 characters
      const chunks = chunkText(text, { maxChunkSize: 100, overlapSize: 10 });
      for (const chunk of chunks) {
        expect(chunk.text.length).toBeLessThanOrEqual(110);
      }
    });

    test("generates consistent chunk hashes", () => {
      const text = "Test text for hashing";
      const chunks1 = chunkText(text);
      const chunks2 = chunkText(text);
      expect(chunks1[0].hash).toBe(chunks2[0].hash);
    });
  });

  describe("chunkEmail", () => {
    test("includes subject in chunks", () => {
      const chunks = chunkEmail("Test Subject", "Email body here.");
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].text).toContain("Subject: Test Subject");
    });

    test("handles empty body", () => {
      const chunks = chunkEmail("Subject Only", "");
      expect(chunks.length).toBe(1);
      expect(chunks[0].text).toBe("Subject: Subject Only");
    });
  });

  describe("chunkCalendarEvent", () => {
    test("includes event title", () => {
      const chunks = chunkCalendarEvent(
        "Team Standup",
        undefined,
        undefined,
        undefined
      );
      expect(chunks[0].text).toContain("Event: Team Standup");
    });

    test("includes location when provided", () => {
      const chunks = chunkCalendarEvent(
        "Meeting",
        undefined,
        "Conference Room",
        undefined
      );
      const allText = chunks.map((c) => c.text).join(" ");
      expect(allText).toContain("Location: Conference Room");
    });

    test("includes attendees when provided", () => {
      const chunks = chunkCalendarEvent("Meeting", undefined, undefined, [
        "alice@test.com",
        "bob@test.com",
      ]);
      const allText = chunks.map((c) => c.text).join(" ");
      expect(allText).toContain("Attendees:");
    });
  });

  describe("validateChunks", () => {
    test("returns true for valid chunks", () => {
      const chunks = chunkText("Valid text for validation.");
      expect(validateChunks(chunks)).toBe(true);
    });

    test("returns true for empty array", () => {
      expect(validateChunks([])).toBe(true);
    });

    test("returns false for invalid index", () => {
      const chunks: TextChunk[] = [
        {
          text: "test",
          index: 5,
          hash: generateChunkHash("test", 5),
          startOffset: 0,
          endOffset: 4,
        },
      ];
      expect(validateChunks(chunks)).toBe(false);
    });

    test("returns false for invalid hash", () => {
      const chunks: TextChunk[] = [
        {
          text: "test",
          index: 0,
          hash: "invalidhash12345",
          startOffset: 0,
          endOffset: 4,
        },
      ];
      expect(validateChunks(chunks)).toBe(false);
    });
  });
});
