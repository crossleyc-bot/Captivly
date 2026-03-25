import { describe, it, expect, vi, beforeEach } from "vitest";

// Set env before importing
vi.stubEnv("TOKEN_ENCRYPTION_KEY", "test-secret-key-for-unit-tests-32chars!");

import { encryptToken, decryptToken, isEncrypted } from "@/lib/token-encryption";

describe("token-encryption", () => {
  describe("encryptToken", () => {
    it("returns a string with enc: prefix", () => {
      const result = encryptToken("my-secret-token");
      expect(result).toMatch(/^enc:/);
    });

    it("produces different ciphertext for same plaintext (due to random IV)", () => {
      const a = encryptToken("same-token");
      const b = encryptToken("same-token");
      expect(a).not.toBe(b);
    });
  });

  describe("decryptToken", () => {
    it("round-trips correctly", () => {
      const original = "ya29.a0AfH6SMBx3Gj2VK2cR_tokenvalue_here";
      const encrypted = encryptToken(original);
      const decrypted = decryptToken(encrypted);
      expect(decrypted).toBe(original);
    });

    it("returns unencrypted values as-is (backwards compatibility)", () => {
      const plaintext = "old-unencrypted-token";
      expect(decryptToken(plaintext)).toBe(plaintext);
    });

    it("handles empty strings", () => {
      const encrypted = encryptToken("");
      const decrypted = decryptToken(encrypted);
      expect(decrypted).toBe("");
    });

    it("handles tokens with special characters", () => {
      const original = "token/with+special=chars&more%20stuff";
      const encrypted = encryptToken(original);
      const decrypted = decryptToken(encrypted);
      expect(decrypted).toBe(original);
    });
  });

  describe("isEncrypted", () => {
    it("returns true for encrypted values", () => {
      const encrypted = encryptToken("test");
      expect(isEncrypted(encrypted)).toBe(true);
    });

    it("returns false for plain text", () => {
      expect(isEncrypted("plain-token")).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(isEncrypted("")).toBe(false);
    });
  });
});
