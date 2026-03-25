import { describe, it, expect, vi, beforeEach } from "vitest";
import { schemas } from "@/lib/validation";

describe("validation schemas", () => {
  describe("contactForm", () => {
    it("accepts valid contact form data", () => {
      const result = schemas.contactForm.safeParse({
        name: "John Doe",
        email: "john@example.com",
        message: "Hello, I have a question.",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing name", () => {
      const result = schemas.contactForm.safeParse({
        name: "",
        email: "john@example.com",
        message: "Hello",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid email", () => {
      const result = schemas.contactForm.safeParse({
        name: "John",
        email: "not-an-email",
        message: "Hello",
      });
      expect(result.success).toBe(false);
    });

    it("rejects message over 5000 chars", () => {
      const result = schemas.contactForm.safeParse({
        name: "John",
        email: "john@example.com",
        message: "x".repeat(5001),
      });
      expect(result.success).toBe(false);
    });

    it("trims whitespace from name and message", () => {
      const result = schemas.contactForm.safeParse({
        name: "  John  ",
        email: "john@example.com",
        message: "  Hello  ",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("John");
        expect(result.data.message).toBe("Hello");
      }
    });
  });

  describe("chatMessage", () => {
    it("accepts valid chat message", () => {
      const result = schemas.chatMessage.safeParse({
        business_id: "550e8400-e29b-41d4-a716-446655440000",
        message: "Hello!",
      });
      expect(result.success).toBe(true);
    });

    it("rejects non-UUID business_id", () => {
      const result = schemas.chatMessage.safeParse({
        business_id: "not-a-uuid",
        message: "Hello!",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty message", () => {
      const result = schemas.chatMessage.safeParse({
        business_id: "550e8400-e29b-41d4-a716-446655440000",
        message: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects message over 500 chars", () => {
      const result = schemas.chatMessage.safeParse({
        business_id: "550e8400-e29b-41d4-a716-446655440000",
        message: "x".repeat(501),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("stripeCheckout", () => {
    it("accepts valid plans", () => {
      expect(schemas.stripeCheckout.safeParse({ plan: "starter" }).success).toBe(true);
      expect(schemas.stripeCheckout.safeParse({ plan: "growth" }).success).toBe(true);
      expect(schemas.stripeCheckout.safeParse({ plan: "pro" }).success).toBe(true);
    });

    it("rejects invalid plans", () => {
      expect(schemas.stripeCheckout.safeParse({ plan: "enterprise" }).success).toBe(false);
    });
  });

  describe("supportTicket", () => {
    it("accepts valid ticket", () => {
      const result = schemas.supportTicket.safeParse({
        subject: "Help needed",
        message: "I can't connect my Meta account.",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.urgency).toBe("medium"); // default
      }
    });

    it("accepts custom urgency", () => {
      const result = schemas.supportTicket.safeParse({
        subject: "Urgent",
        message: "Everything is broken!",
        urgency: "high",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.urgency).toBe("high");
      }
    });
  });

  describe("whiteLabelUpdate", () => {
    it("accepts valid hex colors", () => {
      const result = schemas.whiteLabelUpdate.safeParse({
        primary_color: "#ff6600",
        accent_color: "#3b82f6",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid hex colors", () => {
      const result = schemas.whiteLabelUpdate.safeParse({
        primary_color: "red",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("customDomainRegister", () => {
    it("accepts valid domains", () => {
      expect(schemas.customDomainRegister.safeParse({ domain: "app.example.com" }).success).toBe(true);
      expect(schemas.customDomainRegister.safeParse({ domain: "my-brand.io" }).success).toBe(true);
    });

    it("rejects invalid domains", () => {
      expect(schemas.customDomainRegister.safeParse({ domain: "not a domain" }).success).toBe(false);
      expect(schemas.customDomainRegister.safeParse({ domain: "" }).success).toBe(false);
    });
  });

  describe("zapierLeadsQuery", () => {
    it("applies defaults", () => {
      const result = schemas.zapierLeadsQuery.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(25);
      }
    });

    it("coerces string limit to number", () => {
      const result = schemas.zapierLeadsQuery.safeParse({ limit: "50" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
      }
    });

    it("caps limit at 100", () => {
      const result = schemas.zapierLeadsQuery.safeParse({ limit: "200" });
      expect(result.success).toBe(false);
    });
  });

  describe("agencyCreate", () => {
    it("accepts valid agency name", () => {
      const result = schemas.agencyCreate.safeParse({ name: "My Agency" });
      expect(result.success).toBe(true);
    });

    it("rejects empty name", () => {
      const result = schemas.agencyCreate.safeParse({ name: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("dealCreate", () => {
    it("accepts valid deal", () => {
      const result = schemas.dealCreate.safeParse({
        title: "New Deal",
        value_cents: 5000,
      });
      expect(result.success).toBe(true);
    });

    it("rejects negative value", () => {
      const result = schemas.dealCreate.safeParse({
        title: "Bad Deal",
        value_cents: -100,
      });
      expect(result.success).toBe(false);
    });

    it("defaults value_cents to 0", () => {
      const result = schemas.dealCreate.safeParse({ title: "Free Deal" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.value_cents).toBe(0);
      }
    });
  });
});
