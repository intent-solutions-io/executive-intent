import { describe, test, expect, beforeEach } from "vitest";
import {
  generateDek,
  encryptWithDek,
  decryptWithDek,
  envelopeEncrypt,
  envelopeDecrypt,
  isValidEnvelope,
  serializeEnvelope,
  deserializeEnvelope,
  MockKmsClient,
  type EncryptedEnvelope,
  type KmsClient,
} from "@/lib/crypto/envelope";

describe("Envelope Encryption", () => {
  let kmsClient: KmsClient;

  beforeEach(() => {
    kmsClient = new MockKmsClient();
  });

  describe("generateDek", () => {
    test("generates 32-byte DEK", () => {
      const dek = generateDek();
      expect(dek.length).toBe(32);
    });

    test("generates different DEK each time", () => {
      const dek1 = generateDek();
      const dek2 = generateDek();
      expect(dek1.equals(dek2)).toBe(false);
    });
  });

  describe("encryptWithDek / decryptWithDek", () => {
    test("encrypts data with DEK", () => {
      const dek = generateDek();
      const plaintext = "secret data";

      const { encrypted, iv, authTag } = encryptWithDek(plaintext, dek);

      expect(encrypted).toBeInstanceOf(Buffer);
      expect(encrypted.length).toBeGreaterThan(0);
      expect(iv).toBeInstanceOf(Buffer);
      expect(iv.length).toBe(12); // GCM IV is 12 bytes
      expect(authTag).toBeInstanceOf(Buffer);
      expect(authTag.length).toBe(16);
    });

    test("decrypts back to original", () => {
      const dek = generateDek();
      const plaintext = "secret data";

      const { encrypted, iv, authTag } = encryptWithDek(plaintext, dek);
      const decrypted = decryptWithDek(encrypted, dek, iv, authTag);

      expect(decrypted).toBe(plaintext);
    });

    test("different DEK produces different ciphertext", () => {
      const dek1 = generateDek();
      const dek2 = generateDek();
      const plaintext = "same data";

      const result1 = encryptWithDek(plaintext, dek1);
      const result2 = encryptWithDek(plaintext, dek2);

      expect(result1.encrypted.equals(result2.encrypted)).toBe(false);
    });

    test("handles large payloads", () => {
      const dek = generateDek();
      const plaintext = "A".repeat(100000); // 100KB

      const { encrypted, iv, authTag } = encryptWithDek(plaintext, dek);
      const decrypted = decryptWithDek(encrypted, dek, iv, authTag);

      expect(decrypted).toBe(plaintext);
      expect(decrypted.length).toBe(100000);
    });

    test("handles unicode content", () => {
      const dek = generateDek();
      const plaintext = "Hello 世界 🌍 émoji";

      const { encrypted, iv, authTag } = encryptWithDek(plaintext, dek);
      const decrypted = decryptWithDek(encrypted, dek, iv, authTag);

      expect(decrypted).toBe(plaintext);
    });

    test("handles empty string", () => {
      const dek = generateDek();
      const plaintext = "";

      const { encrypted, iv, authTag } = encryptWithDek(plaintext, dek);
      const decrypted = decryptWithDek(encrypted, dek, iv, authTag);

      expect(decrypted).toBe(plaintext);
    });

    test("fails with wrong DEK", () => {
      const dek1 = generateDek();
      const dek2 = generateDek();
      const plaintext = "secret";

      const { encrypted, iv, authTag } = encryptWithDek(plaintext, dek1);

      // Should throw when trying to decrypt with wrong key
      expect(() => decryptWithDek(encrypted, dek2, iv, authTag)).toThrow();
    });

    test("fails with tampered ciphertext", () => {
      const dek = generateDek();
      const plaintext = "secret";

      const { encrypted, iv, authTag } = encryptWithDek(plaintext, dek);

      // Tamper with the ciphertext
      encrypted[0] = encrypted[0] ^ 0xff;

      // Should throw due to auth tag mismatch
      expect(() => decryptWithDek(encrypted, dek, iv, authTag)).toThrow();
    });
  });

  describe("envelopeEncrypt / envelopeDecrypt", () => {
    test("encrypts DEK with KEK", async () => {
      const data = "oauth-refresh-token-12345";

      const envelope = await envelopeEncrypt(data, kmsClient);

      expect(envelope.encryptedDek).toBeDefined();
      expect(envelope.encryptedDek.length).toBeGreaterThan(0);
      // DEK should be encrypted (base64 of 32 bytes)
      expect(Buffer.from(envelope.encryptedDek, "base64").length).toBe(32);
    });

    test("decrypts back to original", async () => {
      const originalData = "oauth-refresh-token-12345";

      const envelope = await envelopeEncrypt(originalData, kmsClient);
      const decrypted = await envelopeDecrypt(envelope, kmsClient);

      expect(decrypted).toBe(originalData);
    });

    test("different DEK per encryption", async () => {
      const data = "same-data";

      const envelope1 = await envelopeEncrypt(data, kmsClient);
      const envelope2 = await envelopeEncrypt(data, kmsClient);

      // Each encryption should use a different DEK
      expect(envelope1.encryptedDek).not.toBe(envelope2.encryptedDek);
      // And therefore produce different ciphertext (even for same plaintext)
      expect(envelope1.encryptedData).not.toBe(envelope2.encryptedData);
    });

    test("handles large payloads", async () => {
      const data = "token-".repeat(10000); // ~60KB

      const envelope = await envelopeEncrypt(data, kmsClient);
      const decrypted = await envelopeDecrypt(envelope, kmsClient);

      expect(decrypted).toBe(data);
    });

    test("includes all envelope components", async () => {
      const envelope = await envelopeEncrypt("test", kmsClient);

      expect(envelope).toHaveProperty("encryptedData");
      expect(envelope).toHaveProperty("encryptedDek");
      expect(envelope).toHaveProperty("iv");
      expect(envelope).toHaveProperty("authTag");

      // All should be base64 strings
      expect(typeof envelope.encryptedData).toBe("string");
      expect(typeof envelope.encryptedDek).toBe("string");
      expect(typeof envelope.iv).toBe("string");
      expect(typeof envelope.authTag).toBe("string");
    });
  });

  describe("isValidEnvelope", () => {
    test("returns true for valid envelope", async () => {
      const envelope = await envelopeEncrypt("test", kmsClient);
      expect(isValidEnvelope(envelope)).toBe(true);
    });

    test("returns false for null", () => {
      expect(isValidEnvelope(null)).toBe(false);
    });

    test("returns false for undefined", () => {
      expect(isValidEnvelope(undefined)).toBe(false);
    });

    test("returns false for empty object", () => {
      expect(isValidEnvelope({})).toBe(false);
    });

    test("returns false for missing fields", () => {
      expect(
        isValidEnvelope({
          encryptedData: "abc",
          encryptedDek: "def",
          // missing iv and authTag
        })
      ).toBe(false);
    });

    test("returns false for empty strings", () => {
      expect(
        isValidEnvelope({
          encryptedData: "",
          encryptedDek: "def",
          iv: "ghi",
          authTag: "jkl",
        })
      ).toBe(false);
    });

    test("returns false for non-string values", () => {
      expect(
        isValidEnvelope({
          encryptedData: 123,
          encryptedDek: "def",
          iv: "ghi",
          authTag: "jkl",
        })
      ).toBe(false);
    });
  });

  describe("serializeEnvelope / deserializeEnvelope", () => {
    test("serializes and deserializes correctly", async () => {
      const original = await envelopeEncrypt("test data", kmsClient);

      const serialized = serializeEnvelope(original);
      const deserialized = deserializeEnvelope(serialized);

      expect(deserialized).toEqual(original);
    });

    test("serializes to JSON string", async () => {
      const envelope = await envelopeEncrypt("test", kmsClient);
      const serialized = serializeEnvelope(envelope);

      expect(typeof serialized).toBe("string");
      expect(() => JSON.parse(serialized)).not.toThrow();
    });

    test("throws on invalid JSON", () => {
      expect(() => deserializeEnvelope("not json")).toThrow();
    });

    test("throws on invalid envelope format", () => {
      expect(() => deserializeEnvelope('{"foo": "bar"}')).toThrow(
        "Invalid envelope format"
      );
    });

    test("can decrypt after serialization round-trip", async () => {
      const originalData = "my-secret-token";
      const envelope = await envelopeEncrypt(originalData, kmsClient);

      const serialized = serializeEnvelope(envelope);
      const deserialized = deserializeEnvelope(serialized);

      const decrypted = await envelopeDecrypt(deserialized, kmsClient);
      expect(decrypted).toBe(originalData);
    });
  });

  describe("MockKmsClient", () => {
    test("encrypts and decrypts consistently", async () => {
      const client = new MockKmsClient();
      const plaintext = Buffer.from("test key material");

      const encrypted = await client.encrypt(plaintext);
      const decrypted = await client.decrypt(encrypted);

      expect(decrypted.equals(plaintext)).toBe(true);
    });

    test("produces different output than input", async () => {
      const client = new MockKmsClient();
      const plaintext = Buffer.from("test key material");

      const encrypted = await client.encrypt(plaintext);

      expect(encrypted.equals(plaintext)).toBe(false);
    });
  });
});
