/**
 * Envelope Encryption for Executive Intent
 *
 * Uses Google Cloud KMS for envelope encryption of sensitive data like OAuth tokens.
 *
 * Flow:
 * 1. Generate a random Data Encryption Key (DEK)
 * 2. Encrypt the data with the DEK (AES-256-GCM)
 * 3. Encrypt the DEK with Cloud KMS (KEK)
 * 4. Store both encrypted data and encrypted DEK
 *
 * Decryption:
 * 1. Decrypt the DEK using Cloud KMS
 * 2. Decrypt the data using the DEK
 */

import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16;
const DEK_LENGTH = 32; // 256 bits

export interface EncryptedEnvelope {
  encryptedData: string; // Base64 encoded
  encryptedDek: string; // Base64 encoded (encrypted by KMS)
  iv: string; // Base64 encoded
  authTag: string; // Base64 encoded
}

export interface KmsClient {
  encrypt(plaintext: Buffer): Promise<Buffer>;
  decrypt(ciphertext: Buffer): Promise<Buffer>;
}

/**
 * Mock KMS client for testing (uses simple XOR with a fixed key)
 * In production, use the real Google Cloud KMS client
 */
export class MockKmsClient implements KmsClient {
  private readonly mockKey = Buffer.from(
    "0123456789abcdef0123456789abcdef",
    "hex"
  );

  async encrypt(plaintext: Buffer): Promise<Buffer> {
    // Simple XOR for testing - NOT SECURE, only for tests
    const result = Buffer.alloc(plaintext.length);
    for (let i = 0; i < plaintext.length; i++) {
      result[i] = plaintext[i] ^ this.mockKey[i % this.mockKey.length];
    }
    return result;
  }

  async decrypt(ciphertext: Buffer): Promise<Buffer> {
    // XOR is its own inverse
    return this.encrypt(ciphertext);
  }
}

/**
 * Generates a new random Data Encryption Key
 */
export function generateDek(): Buffer {
  return randomBytes(DEK_LENGTH);
}

/**
 * Encrypts data using a DEK (Data Encryption Key)
 */
export function encryptWithDek(
  data: string,
  dek: Buffer
): { encrypted: Buffer; iv: Buffer; authTag: Buffer } {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, dek, iv);

  const encrypted = Buffer.concat([
    cipher.update(data, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return { encrypted, iv, authTag };
}

/**
 * Decrypts data using a DEK
 */
export function decryptWithDek(
  encrypted: Buffer,
  dek: Buffer,
  iv: Buffer,
  authTag: Buffer
): string {
  const decipher = createDecipheriv(ALGORITHM, dek, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Encrypts data using envelope encryption
 *
 * @param data - The plaintext data to encrypt
 * @param kmsClient - KMS client for encrypting the DEK
 * @returns Encrypted envelope containing all necessary components
 */
export async function envelopeEncrypt(
  data: string,
  kmsClient: KmsClient
): Promise<EncryptedEnvelope> {
  // Generate a fresh DEK for each encryption
  const dek = generateDek();

  // Encrypt the data with the DEK
  const { encrypted, iv, authTag } = encryptWithDek(data, dek);

  // Encrypt the DEK with KMS (the Key Encryption Key)
  const encryptedDek = await kmsClient.encrypt(dek);

  return {
    encryptedData: encrypted.toString("base64"),
    encryptedDek: encryptedDek.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

/**
 * Decrypts data from an encrypted envelope
 *
 * @param envelope - The encrypted envelope
 * @param kmsClient - KMS client for decrypting the DEK
 * @returns The original plaintext data
 */
export async function envelopeDecrypt(
  envelope: EncryptedEnvelope,
  kmsClient: KmsClient
): Promise<string> {
  // Decrypt the DEK using KMS
  const encryptedDek = Buffer.from(envelope.encryptedDek, "base64");
  const dek = await kmsClient.decrypt(encryptedDek);

  // Decrypt the data using the DEK
  const encrypted = Buffer.from(envelope.encryptedData, "base64");
  const iv = Buffer.from(envelope.iv, "base64");
  const authTag = Buffer.from(envelope.authTag, "base64");

  return decryptWithDek(encrypted, dek, iv, authTag);
}

/**
 * Validates that an envelope has all required fields
 */
export function isValidEnvelope(envelope: unknown): envelope is EncryptedEnvelope {
  if (!envelope || typeof envelope !== "object") {
    return false;
  }

  const e = envelope as Record<string, unknown>;

  return (
    typeof e.encryptedData === "string" &&
    typeof e.encryptedDek === "string" &&
    typeof e.iv === "string" &&
    typeof e.authTag === "string" &&
    e.encryptedData.length > 0 &&
    e.encryptedDek.length > 0 &&
    e.iv.length > 0 &&
    e.authTag.length > 0
  );
}

/**
 * Serializes an envelope to a JSON string for storage
 */
export function serializeEnvelope(envelope: EncryptedEnvelope): string {
  return JSON.stringify(envelope);
}

/**
 * Deserializes an envelope from a JSON string
 */
export function deserializeEnvelope(serialized: string): EncryptedEnvelope {
  const parsed = JSON.parse(serialized);
  if (!isValidEnvelope(parsed)) {
    throw new Error("Invalid envelope format");
  }
  return parsed;
}
