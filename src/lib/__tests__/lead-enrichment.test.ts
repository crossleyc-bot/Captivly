import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { stubTestEnv } from "@/__tests__/setup-env";
import {
  enrichLead,
  formatEnrichmentForScoring,
  ClearbitEnrichmentProvider,
  ApolloEnrichmentProvider,
  getEnrichmentProvider,
} from "../lead-enrichment";

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

// ---------------------------------------------------------------------------
// Heuristic enrichment tests (preserved from original)
// ---------------------------------------------------------------------------

describe("enrichLead — heuristic mode", () => {
  beforeEach(() => {
    delete process.env.CLEARBIT_API_KEY;
    delete process.env.APOLLO_API_KEY;
  });

  it("classifies gmail.com as personal email", async () => {
    const result = await enrichLead(makeLead({ email: "user@gmail.com" }), defaultBusiness);
    expect(result.email_type).toBe("personal");
  });

  it("classifies mailinator.com as disposable email", async () => {
    const result = await enrichLead(makeLead({ email: "temp@mailinator.com" }), defaultBusiness);
    expect(result.email_type).toBe("disposable");
  });

  it("classifies business.com as business email", async () => {
    const result = await enrichLead(makeLead({ email: "ceo@business.com" }), defaultBusiness);
    expect(result.email_type).toBe("business");
  });

  it('returns "unknown" email_type when no email provided', async () => {
    const result = await enrichLead(makeLead({ email: null }), defaultBusiness);
    expect(result.email_type).toBe("unknown");
  });

  it("infers state from area code (212 -> NY)", async () => {
    const result = await enrichLead(makeLead({ phone: "12125551234" }), defaultBusiness);
    expect(result.geo_state).toBe("NY");
  });

  it('returns name_confidence "high" when both first and last name exist with length>1', async () => {
    const result = await enrichLead(makeLead({ first_name: "John", last_name: "Doe" }), defaultBusiness);
    expect(result.name_confidence).toBe("high");
  });

  it('returns name_confidence "low" when no name', async () => {
    const result = await enrichLead(makeLead({ first_name: null, last_name: null }), defaultBusiness);
    expect(result.name_confidence).toBe("low");
  });

  it('returns name_confidence "medium" when only first name', async () => {
    const result = await enrichLead(makeLead({ first_name: "John", last_name: null }), defaultBusiness);
    expect(result.name_confidence).toBe("medium");
  });

  it('detects "provided_both_contacts" signal when email+phone present', async () => {
    const result = await enrichLead(
      makeLead({ email: "john@gmail.com", phone: "12125551234" }),
      defaultBusiness
    );
    expect(result.engagement_signals).toContain("provided_both_contacts");
  });

  it('detects "answered_custom_questions" signal', async () => {
    const result = await enrichLead(
      makeLead({ custom_answers: { goal: "lose weight" } }),
      defaultBusiness
    );
    expect(result.engagement_signals).toContain("answered_custom_questions");
  });

  it("estimates distance 25 when same state", async () => {
    const result = await enrichLead(
      makeLead({ phone: "12125551234" }),
      { location_city: "Buffalo", location_state: "NY" }
    );
    expect(result.distance_miles).toBe(25);
  });

  it("estimates distance 200 when different state", async () => {
    const result = await enrichLead(
      makeLead({ phone: "12125551234" }),
      { location_city: "Los Angeles", location_state: "CA" }
    );
    expect(result.distance_miles).toBe(200);
  });

  it("sets enrichment_source to heuristic when no API keys", async () => {
    const result = await enrichLead(makeLead(), defaultBusiness);
    expect(result.enrichment_source).toBe("heuristic");
  });

  it("returns null for company fields in heuristic mode", async () => {
    const result = await enrichLead(makeLead(), defaultBusiness);
    expect(result.company_name).toBeNull();
    expect(result.company_domain).toBeNull();
    expect(result.company_size).toBeNull();
    expect(result.job_title).toBeNull();
    expect(result.industry).toBeNull();
    expect(result.linkedin_url).toBeNull();
    expect(result.annual_revenue).toBeNull();
    expect(result.social_profiles).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// Clearbit provider tests
// ---------------------------------------------------------------------------

describe("ClearbitEnrichmentProvider", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.CLEARBIT_API_KEY;
  });

  it("returns null when CLEARBIT_API_KEY is not set", async () => {
    delete process.env.CLEARBIT_API_KEY;
    const result = await ClearbitEnrichmentProvider.enrich({
      email: "john@acme.com",
      first_name: "John",
      last_name: "Doe",
    });
    expect(result).toBeNull();
  });

  it("parses a successful Clearbit response", async () => {
    process.env.CLEARBIT_API_KEY = "test_key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        company: {
          name: "Acme Corp",
          domain: "acme.com",
          employees: 150,
          employeesRange: { min: 101, max: 250 },
          industry: "Technology",
          revenueRange: { min: 10_000_000, max: 50_000_000 },
        },
        employment: {
          title: "VP of Marketing",
        },
        linkedin: { handle: "johndoe" },
        twitter: { handle: "johndoe" },
        geo: {
          city: "San Francisco",
          state: "CA",
          postalCode: "94105",
        },
      }),
    });

    const result = await ClearbitEnrichmentProvider.enrich({
      email: "john@acme.com",
      first_name: "John",
      last_name: "Doe",
    });

    expect(result).not.toBeNull();
    expect(result!.source).toBe("clearbit");
    expect(result!.company_name).toBe("Acme Corp");
    expect(result!.company_domain).toBe("acme.com");
    expect(result!.company_size).toBe("101-250");
    expect(result!.job_title).toBe("VP of Marketing");
    expect(result!.industry).toBe("Technology");
    expect(result!.linkedin_url).toBe("https://linkedin.com/in/johndoe");
    expect(result!.annual_revenue).toBe("$10-50M");
    expect(result!.social_profiles.linkedin).toBe("https://linkedin.com/in/johndoe");
    expect(result!.social_profiles.twitter).toBe("https://twitter.com/johndoe");
    expect(result!.geo_city).toBe("San Francisco");
    expect(result!.geo_state).toBe("CA");
    expect(result!.geo_zip).toBe("94105");
  });

  it("returns null on 404 (person not found)", async () => {
    process.env.CLEARBIT_API_KEY = "test_key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    const result = await ClearbitEnrichmentProvider.enrich({
      email: "nobody@nowhere.com",
      first_name: null,
      last_name: null,
    });
    expect(result).toBeNull();
  });

  it("returns null on 429 (rate limit)", async () => {
    process.env.CLEARBIT_API_KEY = "test_key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
    });

    const result = await ClearbitEnrichmentProvider.enrich({
      email: "john@acme.com",
      first_name: "John",
      last_name: "Doe",
    });
    expect(result).toBeNull();
  });

  it("returns null on network error", async () => {
    process.env.CLEARBIT_API_KEY = "test_key";
    global.fetch = vi.fn().mockRejectedValue(new Error("Network failure"));

    const result = await ClearbitEnrichmentProvider.enrich({
      email: "john@acme.com",
      first_name: "John",
      last_name: "Doe",
    });
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Apollo provider tests
// ---------------------------------------------------------------------------

describe("ApolloEnrichmentProvider", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.APOLLO_API_KEY;
  });

  it("returns null when APOLLO_API_KEY is not set", async () => {
    delete process.env.APOLLO_API_KEY;
    const result = await ApolloEnrichmentProvider.enrich({
      email: "john@acme.com",
      first_name: "John",
      last_name: "Doe",
    });
    expect(result).toBeNull();
  });

  it("parses a successful Apollo response", async () => {
    process.env.APOLLO_API_KEY = "test_key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        person: {
          title: "Director of Sales",
          linkedin_url: "https://linkedin.com/in/jdoe",
          twitter_url: "https://twitter.com/jdoe",
          city: "Austin",
          state: "TX",
          organization: {
            name: "Widget Inc",
            primary_domain: "widget.com",
            estimated_num_employees: 75,
            industry: "Retail",
            annual_revenue: 5_000_000,
          },
        },
      }),
    });

    const result = await ApolloEnrichmentProvider.enrich({
      email: "john@widget.com",
      first_name: "John",
      last_name: "Doe",
    });

    expect(result).not.toBeNull();
    expect(result!.source).toBe("apollo");
    expect(result!.company_name).toBe("Widget Inc");
    expect(result!.company_domain).toBe("widget.com");
    expect(result!.company_size).toBe("51-200");
    expect(result!.job_title).toBe("Director of Sales");
    expect(result!.industry).toBe("Retail");
    expect(result!.linkedin_url).toBe("https://linkedin.com/in/jdoe");
    expect(result!.annual_revenue).toBe("$1-10M");
    expect(result!.social_profiles.linkedin).toBe("https://linkedin.com/in/jdoe");
    expect(result!.social_profiles.twitter).toBe("https://twitter.com/jdoe");
    expect(result!.geo_city).toBe("Austin");
    expect(result!.geo_state).toBe("TX");
  });

  it("returns null on API error", async () => {
    process.env.APOLLO_API_KEY = "test_key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const result = await ApolloEnrichmentProvider.enrich({
      email: "john@acme.com",
      first_name: "John",
      last_name: "Doe",
    });
    expect(result).toBeNull();
  });

  it("returns null on network error", async () => {
    process.env.APOLLO_API_KEY = "test_key";
    global.fetch = vi.fn().mockRejectedValue(new Error("DNS resolution failed"));

    const result = await ApolloEnrichmentProvider.enrich({
      email: "john@acme.com",
      first_name: "John",
      last_name: "Doe",
    });
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Provider selection tests
// ---------------------------------------------------------------------------

describe("getEnrichmentProvider", () => {
  afterEach(() => {
    delete process.env.CLEARBIT_API_KEY;
    delete process.env.APOLLO_API_KEY;
  });

  it("returns Clearbit provider when CLEARBIT_API_KEY is set", () => {
    process.env.CLEARBIT_API_KEY = "cb_key";
    const provider = getEnrichmentProvider();
    expect(provider).not.toBeNull();
    expect(provider!.name).toBe("clearbit");
  });

  it("returns Apollo provider when only APOLLO_API_KEY is set", () => {
    process.env.APOLLO_API_KEY = "ap_key";
    const provider = getEnrichmentProvider();
    expect(provider).not.toBeNull();
    expect(provider!.name).toBe("apollo");
  });

  it("prefers Clearbit over Apollo when both keys are set", () => {
    process.env.CLEARBIT_API_KEY = "cb_key";
    process.env.APOLLO_API_KEY = "ap_key";
    const provider = getEnrichmentProvider();
    expect(provider).not.toBeNull();
    expect(provider!.name).toBe("clearbit");
  });

  it("returns null when no API keys are set", () => {
    const provider = getEnrichmentProvider();
    expect(provider).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// API failure fallback tests
// ---------------------------------------------------------------------------

describe("enrichLead — API fallback", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.CLEARBIT_API_KEY;
    delete process.env.APOLLO_API_KEY;
  });

  it("falls back to heuristic when Clearbit API fails", async () => {
    process.env.CLEARBIT_API_KEY = "test_key";
    global.fetch = vi.fn().mockRejectedValue(new Error("Connection refused"));

    const result = await enrichLead(makeLead(), defaultBusiness);
    expect(result.enrichment_source).toBe("heuristic");
    expect(result.email_type).toBe("personal"); // heuristic still works
    expect(result.company_name).toBeNull();
  });

  it("falls back to heuristic when Clearbit returns 404", async () => {
    process.env.CLEARBIT_API_KEY = "test_key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    const result = await enrichLead(makeLead(), defaultBusiness);
    expect(result.enrichment_source).toBe("heuristic");
    expect(result.email_type).toBe("personal");
  });

  it("merges API data with heuristic data when API succeeds", async () => {
    process.env.CLEARBIT_API_KEY = "test_key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        company: {
          name: "Acme Corp",
          domain: "acme.com",
          industry: "Fitness",
        },
        employment: { title: "Owner" },
        geo: { city: "New York", state: "NY" },
        linkedin: {},
        twitter: {},
      }),
    });

    const result = await enrichLead(
      makeLead({ email: "boss@acme.com", phone: "12125551234" }),
      defaultBusiness
    );

    // API-provided fields
    expect(result.enrichment_source).toBe("clearbit");
    expect(result.company_name).toBe("Acme Corp");
    expect(result.industry).toBe("Fitness");
    expect(result.job_title).toBe("Owner");

    // Heuristic fields still present
    expect(result.email_type).toBe("business");
    expect(result.phone_type).toBe("mobile");
    expect(result.name_confidence).toBe("high");
    expect(result.engagement_signals).toContain("provided_both_contacts");

    // API geo takes precedence
    expect(result.geo_city).toBe("New York");
    expect(result.geo_state).toBe("NY");
  });
});

// ---------------------------------------------------------------------------
// formatEnrichmentForScoring tests
// ---------------------------------------------------------------------------

describe("formatEnrichmentForScoring", () => {
  it("includes email type line for non-unknown", async () => {
    const enrichment = await enrichLead(makeLead({ email: "user@gmail.com" }), defaultBusiness);
    const text = formatEnrichmentForScoring(enrichment);
    expect(text).toContain("Email type: personal");
  });

  it("includes estimated location", async () => {
    const enrichment = await enrichLead(makeLead({ phone: "12125551234" }), defaultBusiness);
    const text = formatEnrichmentForScoring(enrichment);
    expect(text).toContain("Estimated location: NY");
  });

  it("includes engagement signals", async () => {
    const enrichment = await enrichLead(
      makeLead({ email: "user@gmail.com", phone: "12125551234" }),
      defaultBusiness
    );
    const text = formatEnrichmentForScoring(enrichment);
    expect(text).toContain("Engagement signals:");
    expect(text).toContain("provided_both_contacts");
  });

  it("always includes name confidence", async () => {
    const enrichment = await enrichLead(
      makeLead({ first_name: null, last_name: null, email: null, phone: null }),
      defaultBusiness
    );
    const text = formatEnrichmentForScoring(enrichment);
    expect(text).toContain("Name confidence: low");
  });

  it("includes enrichment source", async () => {
    const enrichment = await enrichLead(makeLead(), defaultBusiness);
    const text = formatEnrichmentForScoring(enrichment);
    expect(text).toContain("Enrichment source: heuristic");
  });

  it("includes company fields when present", () => {
    const text = formatEnrichmentForScoring({
      email_domain: "acme.com",
      email_type: "business",
      phone_type: "mobile",
      geo_city: "San Francisco",
      geo_state: "CA",
      geo_zip: "94105",
      distance_miles: 25,
      name_confidence: "high",
      engagement_signals: ["provided_both_contacts"],
      enrichment_source: "clearbit",
      company_name: "Acme Corp",
      company_domain: "acme.com",
      company_size: "51-200",
      job_title: "Marketing Manager",
      industry: "Technology",
      linkedin_url: "https://linkedin.com/in/johndoe",
      annual_revenue: "$10-50M",
      social_profiles: {
        linkedin: "https://linkedin.com/in/johndoe",
        twitter: "https://twitter.com/johndoe",
      },
    });

    expect(text).toContain("Enrichment source: clearbit");
    expect(text).toContain("Company: Acme Corp");
    expect(text).toContain("Company size: 51-200 employees");
    expect(text).toContain("Industry: Technology");
    expect(text).toContain("Job title: Marketing Manager");
    expect(text).toContain("Annual revenue: $10-50M");
    expect(text).toContain("LinkedIn: https://linkedin.com/in/johndoe");
    expect(text).toContain("Social profiles:");
  });

  it("omits company fields when null", () => {
    const text = formatEnrichmentForScoring({
      email_domain: "gmail.com",
      email_type: "personal",
      phone_type: "mobile",
      geo_city: null,
      geo_state: "NY",
      geo_zip: null,
      distance_miles: 25,
      name_confidence: "high",
      engagement_signals: [],
      enrichment_source: "heuristic",
      company_name: null,
      company_domain: null,
      company_size: null,
      job_title: null,
      industry: null,
      linkedin_url: null,
      annual_revenue: null,
      social_profiles: {},
    });

    expect(text).not.toContain("Company:");
    expect(text).not.toContain("Company size:");
    expect(text).not.toContain("Industry:");
    expect(text).not.toContain("Job title:");
    expect(text).not.toContain("Annual revenue:");
    expect(text).not.toContain("LinkedIn:");
    expect(text).not.toContain("Social profiles:");
  });
});
