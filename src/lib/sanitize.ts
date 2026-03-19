/**
 * Strip HTML tags to prevent XSS in stored data.
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/**
 * Sanitize a string for safe storage — trim, strip HTML, limit length.
 */
export function sanitizeString(input: unknown, maxLength = 500): string {
  if (typeof input !== "string") return "";
  return stripHtml(input.trim()).slice(0, maxLength);
}

/**
 * Sanitize an email address — lowercase, trim, basic format check.
 */
export function sanitizeEmail(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const email = input.trim().toLowerCase();
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) ? email : null;
}

/**
 * Sanitize a phone number — keep only digits and leading +.
 */
export function sanitizePhone(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const cleaned = input.replace(/[^\d+]/g, "");
  return cleaned.length >= 7 ? cleaned : null;
}
