import { describe, it, expect } from "vitest";
import { stubTestEnv } from "@/__tests__/setup-env";
import { enrichLead, formatEnrichmentForScoring } from "../lead-enrichment";

stubTestEnv();

const defaultBusiness = {
  location_city: "New York",
  location_state: "NY",
};

function makeLead(overrides: Partial<{
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  custom_answers: Record<string, unknown> | null;
  source: string;
}> = {}) {
  return {
    first_name: "John",
    last_name: "Doe",
    email: "john@gmail.com",
    phone: "12125551234",
    custom_answers: null,
    source: "meta",
    ...overrides,
  };
}

describe("enrichLead", () => {
  it("classifies gmail.com as personal email", () => {
    const result = enrichLead(makeLead({ email: "user@gmail.com" }), defaultBusiness);
    expect(result.email_type).toBe("personal");
  });

  it("classifies mailinator.com as disposable email", () => {
    const result = enrichLead(makeLead({ email: "temp@mailinator.com" }), defaultBusiness);
    expect(result.email_type).toBe("disposable");
  });

  it("classifies business.com as business email", () => {
    const result = enrichLead(makeLead({ email: "ceo@business.com" }), defaultBusiness);
    expect(result.email_type).toBe("business");
  });

  it('returns "unknown" email_type when no email provided', () => {
    const result = enrichLead(makeLead({ email: null }), defaultBusiness);
    expect(result.email_type).toBe("unknown");
  });

  it("infers state from area code (212 -> NY)", () => {
    const result = enrichLead(makeLead({ phone: "12125551234" }), defaultBusiness);
    expect(result.geo_state).toBe("NY");
  });

  it('returns name_confidence "high" when both first and last name exist with length>1', () => {
    const result = enrichLead(makeLead({ first_name: "John", last_name: "Doe" }), defaultBusiness);
    expect(result.name_confidence).toBe("high");
  });

  it('returns name_confidence "low" when no name', () => {
    const result = enrichLead(makeLead({ first_name: null, last_name: null }), defaultBusiness);
    expect(result.name_confidence).toBe("low");
  });

  it('returns name_confidence "medium" when only first name', () => {
    const result = enrichLead(makeLead({ first_name: "John", last_name: null }), defaultBusiness);
    expect(result.name_confidence).toBe("medium");
  });

  it('detects "provided_both_contacts" signal when email+phone present', () => {
    const result = enrichLead(
      makeLead({ email: "john@gmail.com", phone: "12125551234" }),
      defaultBusiness
    );
    expect(result.engagement_signals).toContain("provided_both_contacts");
  });

  it('detects "answered_custom_questions" signal', () => {
    const result = enrichLead(
      makeLead({ custom_answers: { goal: "lose weight" } }),
      defaultBusiness
    );
    expect(result.engagement_signals).toContain("answered_custom_questions");
  });

  it("estimates distance 25 when same state", () => {
    const result = enrichLead(
      makeLead({ phone: "12125551234" }),
      { location_city: "Buffalo", location_state: "NY" }
    );
    expect(result.distance_miles).toBe(25);
  });

  it("estimates distance 200 when different state", () => {
    const result = enrichLead(
      makeLead({ phone: "12125551234" }),
      { location_city: "Los Angeles", location_state: "CA" }
    );
    expect(result.distance_miles).toBe(200);
  });
});

describe("formatEnrichmentForScoring", () => {
  it("includes email type line for non-unknown", () => {
    const enrichment = enrichLead(makeLead({ email: "user@gmail.com" }), defaultBusiness);
    const text = formatEnrichmentForScoring(enrichment);
    expect(text).toContain("Email type: personal");
  });

  it("includes estimated location", () => {
    const enrichment = enrichLead(makeLead({ phone: "12125551234" }), defaultBusiness);
    const text = formatEnrichmentForScoring(enrichment);
    expect(text).toContain("Estimated location: NY");
  });

  it("includes engagement signals", () => {
    const enrichment = enrichLead(
      makeLead({ email: "user@gmail.com", phone: "12125551234" }),
      defaultBusiness
    );
    const text = formatEnrichmentForScoring(enrichment);
    expect(text).toContain("Engagement signals:");
    expect(text).toContain("provided_both_contacts");
  });

  it("always includes name confidence", () => {
    const enrichment = enrichLead(makeLead({ first_name: null, last_name: null, email: null, phone: null }), defaultBusiness);
    const text = formatEnrichmentForScoring(enrichment);
    expect(text).toContain("Name confidence: low");
  });
});
