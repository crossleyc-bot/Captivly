import { stripHtml, sanitizeString, sanitizeEmail, sanitizePhone } from "../sanitize";

describe("stripHtml", () => {
  it("removes HTML tags", () => {
    expect(stripHtml("<b>bold</b>")).toBe("bold");
    expect(stripHtml('<script>alert("xss")</script>')).toBe('alert("xss")');
    expect(stripHtml("<p>hello</p> <br/> world")).toBe("hello  world");
  });

  it("returns plain text unchanged", () => {
    expect(stripHtml("no tags here")).toBe("no tags here");
  });
});

describe("sanitizeString", () => {
  it("trims whitespace", () => {
    expect(sanitizeString("  hello  ")).toBe("hello");
  });

  it("strips HTML tags", () => {
    expect(sanitizeString("<b>bold</b>")).toBe("bold");
  });

  it("truncates to maxLength", () => {
    expect(sanitizeString("abcdefghij", 5)).toBe("abcde");
  });

  it("returns empty string for non-string inputs", () => {
    expect(sanitizeString(123)).toBe("");
    expect(sanitizeString(null)).toBe("");
    expect(sanitizeString(undefined)).toBe("");
    expect(sanitizeString({})).toBe("");
  });
});

describe("sanitizeEmail", () => {
  it("lowercases and trims", () => {
    expect(sanitizeEmail("  User@Example.COM  ")).toBe("user@example.com");
  });

  it("accepts valid emails", () => {
    expect(sanitizeEmail("test@example.com")).toBe("test@example.com");
  });

  it("rejects invalid formats", () => {
    expect(sanitizeEmail("not-an-email")).toBeNull();
    expect(sanitizeEmail("@missing.local")).toBeNull();
    expect(sanitizeEmail("missing@.com")).toBeNull();
    expect(sanitizeEmail("has spaces@example.com")).toBeNull();
  });

  it("returns null for non-string inputs", () => {
    expect(sanitizeEmail(42)).toBeNull();
    expect(sanitizeEmail(null)).toBeNull();
  });
});

describe("sanitizePhone", () => {
  it("strips non-digit characters except +", () => {
    expect(sanitizePhone("(555) 123-4567")).toBe("5551234567");
    expect(sanitizePhone("+1-555-123-4567")).toBe("+15551234567");
  });

  it("rejects too-short numbers", () => {
    expect(sanitizePhone("123")).toBeNull();
    expect(sanitizePhone("12345")).toBeNull();
  });

  it("returns null for non-string inputs", () => {
    expect(sanitizePhone(123)).toBeNull();
    expect(sanitizePhone(null)).toBeNull();
  });
});
