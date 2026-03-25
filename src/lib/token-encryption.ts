import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

function getEncryptionKey(): Buffer {
  const secret = process.env.TOKEN_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("TOKEN_ENCRYPTION_KEY is not configured");
  }
  // Derive a fixed-length key from the secret using scrypt
  return scryptSync(secret, "captivly-token-salt", KEY_LENGTH);
}

/**
 * Encrypts a plaintext token. Returns a base64-encoded string containing
 * salt + iv + authTag + ciphertext.
 */
export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const salt = randomBytes(SALT_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf-8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Pack: salt(16) + iv(16) + authTag(16) + ciphertext
  const packed = Buffer.concat([salt, iv, authTag, encrypted]);
  return `enc:${packed.toString("base64")}`;
}

/**
 * Decrypts a token previously encrypted with encryptToken().
 * Returns the original plaintext. If the value is not encrypted
 * (no "enc:" prefix), returns it as-is for backwards compatibility.
 */
export function decryptToken(encrypted: string): string {
  // Backwards compatibility: unencrypted tokens don't have the prefix
  if (!encrypted.startsWith("enc:")) {
    return encrypted;
  }

  const key = getEncryptionKey();
  const packed = Buffer.from(encrypted.slice(4), "base64");

  const salt = packed.subarray(0, SALT_LENGTH);
  const iv = packed.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = packed.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
  );
  const ciphertext = packed.subarray(
    SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
  );

  // salt is included for future per-token key derivation; currently unused
  void salt;

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf-8");
}

/**
 * Check if a token value is already encrypted.
 */
export function isEncrypted(value: string): boolean {
  return value.startsWith("enc:");
}
