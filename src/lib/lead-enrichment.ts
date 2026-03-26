import type { LeadEnrichment } from "@/types/database";

/**
 * Known disposable email domains.
 * In production, use a larger list or a validation API.
 */
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "tempmail.com",
  "throwaway.email",
  "yopmail.com",
  "sharklasers.com",
  "guerrillamailblock.com",
  "grr.la",
  "10minutemail.com",
  "trashmail.com",
]);

/**
 * Common personal email domains.
 */
const PERSONAL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "aol.com",
  "icloud.com",
  "mail.com",
  "protonmail.com",
  "zoho.com",
  "live.com",
  "msn.com",
  "comcast.net",
  "att.net",
  "verizon.net",
  "me.com",
]);

/**
 * US area code to state mapping (partial — covers major metros).
 * In production, use a phone validation API for accurate data.
 */
const AREA_CODE_STATE: Record<string, string> = {
  "212": "NY", "213": "CA", "214": "TX", "215": "PA", "216": "OH",
  "301": "MD", "302": "DE", "303": "CO", "304": "WV", "305": "FL",
  "310": "CA", "312": "IL", "313": "MI", "314": "MO", "315": "NY",
  "316": "KS", "317": "IN", "318": "LA", "319": "IA", "320": "MN",
  "323": "CA", "330": "OH", "334": "AL", "336": "NC", "337": "LA",
  "404": "GA", "405": "OK", "407": "FL", "408": "CA", "410": "MD",
  "412": "PA", "414": "WI", "415": "CA", "469": "TX", "480": "AZ",
  "502": "KY", "503": "OR", "504": "LA", "505": "NM", "507": "MN",
  "510": "CA", "512": "TX", "513": "OH", "515": "IA", "516": "NY",
  "520": "AZ", "602": "AZ", "603": "NH", "605": "SD", "608": "WI",
  "610": "PA", "612": "MN", "614": "OH", "615": "TN", "616": "MI",
  "617": "MA", "619": "CA", "623": "AZ", "626": "CA", "630": "IL",
  "650": "CA", "651": "MN", "678": "GA", "702": "NV", "703": "VA",
  "704": "NC", "706": "GA", "707": "CA", "708": "IL", "713": "TX",
  "714": "CA", "718": "NY", "720": "CO", "727": "FL", "732": "NJ",
  "734": "MI", "737": "TX", "740": "OH", "747": "CA", "757": "VA",
  "760": "CA", "763": "MN", "770": "GA", "773": "IL", "775": "NV",
  "801": "UT", "802": "VT", "803": "SC", "804": "VA", "805": "CA",
  "808": "HI", "810": "MI", "812": "IN", "813": "FL", "814": "PA",
  "815": "IL", "816": "MO", "817": "TX", "818": "CA", "828": "NC",
  "830": "TX", "832": "TX", "843": "SC", "845": "NY", "847": "IL",
  "848": "NJ", "850": "FL", "856": "NJ", "858": "CA", "860": "CT",
  "862": "NJ", "863": "FL", "901": "TN", "903": "TX", "904": "FL",
  "907": "AK", "908": "NJ", "909": "CA", "910": "NC", "912": "GA",
  "913": "KS", "914": "NY", "916": "CA", "917": "NY", "918": "OK",
  "919": "NC", "920": "WI", "925": "CA", "928": "AZ", "929": "NY",
  "936": "TX", "937": "OH", "940": "TX", "941": "FL", "949": "CA",
  "951": "CA", "952": "MN", "954": "FL", "956": "TX", "959": "CT",
  "972": "TX", "973": "NJ", "979": "TX", "980": "NC", "984": "NC",
};

// ---------------------------------------------------------------------------
// Heuristic helpers (unchanged)
// ---------------------------------------------------------------------------

function classifyEmailDomain(email: string): {
  domain: string;
  type: LeadEnrichment["email_type"];
} {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";

  if (!domain) return { domain: "", type: "unknown" };
  if (DISPOSABLE_DOMAINS.has(domain)) return { domain, type: "disposable" };
  if (PERSONAL_DOMAINS.has(domain)) return { domain, type: "personal" };

  // Assume anything else is a business email
  return { domain, type: "business" };
}

function inferPhoneInfo(phone: string): {
  type: LeadEnrichment["phone_type"];
  state: string | null;
} {
  const digits = phone.replace(/\D/g, "");
  const last10 = digits.slice(-10);

  if (last10.length < 10) return { type: "unknown", state: null };

  const areaCode = last10.slice(0, 3);
  const state = AREA_CODE_STATE[areaCode] ?? null;

  // Heuristic: we can't reliably detect mobile vs landline without a carrier
  // lookup API, so default to "mobile" for leads from Meta/Google ad forms
  // (which overwhelmingly collect mobile numbers).
  return { type: "mobile", state };
}

function assessNameConfidence(
  firstName: string | null,
  lastName: string | null
): LeadEnrichment["name_confidence"] {
  if (!firstName && !lastName) return "low";
  if (firstName && lastName && firstName.length > 1 && lastName.length > 1) {
    return "high";
  }
  return "medium";
}

function estimateDistance(
  leadState: string | null,
  businessCity: string | null,
  businessState: string | null
): number | null {
  if (!leadState || !businessState) return null;

  // Same state = rough "local" estimate
  if (leadState.toUpperCase() === businessState.toUpperCase()) {
    return 25; // approximate same-state distance
  }

  // Different state = far
  return 200;
}

function detectEngagementSignals(lead: {
  email: string | null;
  phone: string | null;
  custom_answers: Record<string, unknown> | null;
  source: string;
}): string[] {
  const signals: string[] = [];

  if (lead.email && lead.phone) {
    signals.push("provided_both_contacts");
  }

  if (lead.custom_answers && Object.keys(lead.custom_answers).length > 0) {
    signals.push("answered_custom_questions");
    if (Object.keys(lead.custom_answers).length >= 3) {
      signals.push("detailed_form_responses");
    }
  }

  if (lead.source === "meta") signals.push("meta_ad_lead");
  if (lead.source === "google") signals.push("google_ad_lead");

  return signals;
}

// ---------------------------------------------------------------------------
// Third-party enrichment provider types
// ---------------------------------------------------------------------------

interface EnrichmentProviderResult {
  source: "clearbit" | "apollo";
  company_name: string | null;
  company_domain: string | null;
  company_size: string | null;
  job_title: string | null;
  industry: string | null;
  linkedin_url: string | null;
  annual_revenue: string | null;
  social_profiles: Record<string, string>;
  geo_city: string | null;
  geo_state: string | null;
  geo_zip: string | null;
}

interface EnrichmentProvider {
  name: "clearbit" | "apollo";
  enrich(params: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  }): Promise<EnrichmentProviderResult | null>;
}

// ---------------------------------------------------------------------------
// Clearbit enrichment provider
// ---------------------------------------------------------------------------

function formatClearbitRevenue(
  raised: number | null | undefined,
  range: { min: number | null; max: number | null } | null | undefined
): string | null {
  const min = range?.min ?? raised;
  if (min == null) return null;
  if (min < 1_000_000) return "$0-1M";
  if (min < 10_000_000) return "$1-10M";
  if (min < 50_000_000) return "$10-50M";
  if (min < 100_000_000) return "$50-100M";
  if (min < 500_000_000) return "$100-500M";
  return "$500M+";
}

function formatClearbitEmployeeRange(
  range: { min: number | null; max: number | null } | null | undefined,
  count: number | null | undefined
): string | null {
  if (range?.min != null && range?.max != null) {
    return `${range.min}-${range.max}`;
  }
  if (count != null) {
    if (count <= 10) return "1-10";
    if (count <= 50) return "11-50";
    if (count <= 200) return "51-200";
    if (count <= 500) return "201-500";
    if (count <= 1000) return "501-1000";
    return "1000+";
  }
  return null;
}

export const ClearbitEnrichmentProvider: EnrichmentProvider = {
  name: "clearbit",

  async enrich({ email }): Promise<EnrichmentProviderResult | null> {
    const apiKey = process.env.CLEARBIT_API_KEY;
    if (!apiKey) return null;

    const url = `https://person.clearbit.com/v2/people/find?email=${encodeURIComponent(email)}`;

    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
    } catch {
      // Network error — return null to fall back to heuristic
      return null;
    }

    // 404 = person not found, 429 = rate limited — both are non-fatal
    if (response.status === 404 || response.status === 429) {
      return null;
    }

    if (!response.ok) {
      return null;
    }

    let data: Record<string, unknown>;
    try {
      data = (await response.json()) as Record<string, unknown>;
    } catch {
      return null;
    }

    const person = data as Record<string, unknown>;
    const company = (person.company ?? {}) as Record<string, unknown>;
    const geo = (person.geo ?? {}) as Record<string, unknown>;
    const employment = (person.employment ?? {}) as Record<string, unknown>;

    const socialProfiles: Record<string, string> = {};
    const linkedin = (person.linkedin as Record<string, unknown>)?.handle as string | undefined;
    const twitter = (person.twitter as Record<string, unknown>)?.handle as string | undefined;
    if (linkedin) socialProfiles.linkedin = `https://linkedin.com/in/${linkedin}`;
    if (twitter) socialProfiles.twitter = `https://twitter.com/${twitter}`;

    const linkedinUrl = linkedin
      ? `https://linkedin.com/in/${linkedin}`
      : (person.linkedinUrl as string | null) ?? null;

    return {
      source: "clearbit",
      company_name: (company.name as string | null) ?? null,
      company_domain: (company.domain as string | null) ?? null,
      company_size: formatClearbitEmployeeRange(
        company.employeesRange as { min: number | null; max: number | null } | undefined,
        company.employees as number | undefined
      ),
      job_title: (employment.title as string | null) ?? null,
      industry: (company.industry as string | null) ?? (company.sector as string | null) ?? null,
      linkedin_url: linkedinUrl,
      annual_revenue: formatClearbitRevenue(
        company.raised as number | undefined,
        company.revenueRange as { min: number | null; max: number | null } | undefined
      ),
      social_profiles: socialProfiles,
      geo_city: (geo.city as string | null) ?? null,
      geo_state: (geo.state as string | null) ?? null,
      geo_zip: (geo.postalCode as string | null) ?? null,
    };
  },
};

// ---------------------------------------------------------------------------
// Apollo enrichment provider
// ---------------------------------------------------------------------------

export const ApolloEnrichmentProvider: EnrichmentProvider = {
  name: "apollo",

  async enrich({ email, first_name, last_name }): Promise<EnrichmentProviderResult | null> {
    const apiKey = process.env.APOLLO_API_KEY;
    if (!apiKey) return null;

    let response: Response;
    try {
      response = await fetch("https://api.apollo.io/api/v1/people/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKey,
        },
        body: JSON.stringify({
          email,
          first_name: first_name ?? undefined,
          last_name: last_name ?? undefined,
        }),
      });
    } catch {
      return null;
    }

    if (!response.ok) {
      return null;
    }

    let data: Record<string, unknown>;
    try {
      data = (await response.json()) as Record<string, unknown>;
    } catch {
      return null;
    }

    const person = (data.person ?? data) as Record<string, unknown>;
    const org = (person.organization ?? {}) as Record<string, unknown>;

    const socialProfiles: Record<string, string> = {};
    if (person.linkedin_url) socialProfiles.linkedin = person.linkedin_url as string;
    if (person.twitter_url) socialProfiles.twitter = person.twitter_url as string;

    function formatApolloEmployeeRange(count: unknown): string | null {
      if (typeof count !== "number" && typeof count !== "string") return null;
      const n = Number(count);
      if (isNaN(n)) return null;
      if (n <= 10) return "1-10";
      if (n <= 50) return "11-50";
      if (n <= 200) return "51-200";
      if (n <= 500) return "201-500";
      if (n <= 1000) return "501-1000";
      return "1000+";
    }

    function formatApolloRevenue(revenue: unknown): string | null {
      if (typeof revenue !== "number" && typeof revenue !== "string") return null;
      const n = Number(revenue);
      if (isNaN(n)) return null;
      if (n < 1_000_000) return "$0-1M";
      if (n < 10_000_000) return "$1-10M";
      if (n < 50_000_000) return "$10-50M";
      if (n < 100_000_000) return "$50-100M";
      if (n < 500_000_000) return "$100-500M";
      return "$500M+";
    }

    return {
      source: "apollo",
      company_name: (org.name as string | null) ?? null,
      company_domain: (org.primary_domain as string | null) ?? (org.website_url as string | null) ?? null,
      company_size: (org.employee_count_range as string | null) ?? formatApolloEmployeeRange(org.estimated_num_employees),
      job_title: (person.title as string | null) ?? null,
      industry: (org.industry as string | null) ?? null,
      linkedin_url: (person.linkedin_url as string | null) ?? null,
      annual_revenue: (org.annual_revenue_printed as string | null) ?? formatApolloRevenue(org.annual_revenue),
      social_profiles: socialProfiles,
      geo_city: (person.city as string | null) ?? null,
      geo_state: (person.state as string | null) ?? null,
      geo_zip: null, // Apollo does not typically return zip
    };
  },
};

// ---------------------------------------------------------------------------
// Provider selection
// ---------------------------------------------------------------------------

/**
 * Returns the best available enrichment provider based on configured API keys.
 * Priority: Clearbit > Apollo > null (heuristic-only).
 */
export function getEnrichmentProvider(): EnrichmentProvider | null {
  if (process.env.CLEARBIT_API_KEY) return ClearbitEnrichmentProvider;
  if (process.env.APOLLO_API_KEY) return ApolloEnrichmentProvider;
  return null;
}

// ---------------------------------------------------------------------------
// Heuristic enrichment (original logic, preserved intact)
// ---------------------------------------------------------------------------

function heuristicEnrich(
  lead: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    custom_answers: Record<string, unknown> | null;
    source: string;
  },
  business: {
    location_city: string | null;
    location_state: string | null;
  }
): LeadEnrichment {
  const emailInfo = lead.email
    ? classifyEmailDomain(lead.email)
    : { domain: null, type: "unknown" as const };

  const phoneInfo = lead.phone
    ? inferPhoneInfo(lead.phone)
    : { type: "unknown" as const, state: null };

  const nameConfidence = assessNameConfidence(lead.first_name, lead.last_name);
  const distance = estimateDistance(
    phoneInfo.state,
    business.location_city,
    business.location_state
  );

  const signals = detectEngagementSignals(lead);

  return {
    email_domain: emailInfo.domain,
    email_type: emailInfo.type,
    phone_type: phoneInfo.type,
    geo_city: null,
    geo_state: phoneInfo.state,
    geo_zip: null,
    distance_miles: distance,
    name_confidence: nameConfidence,
    engagement_signals: signals,
    enrichment_source: "heuristic",
    company_name: null,
    company_domain: null,
    company_size: null,
    job_title: null,
    industry: null,
    linkedin_url: null,
    annual_revenue: null,
    social_profiles: {},
  };
}

// ---------------------------------------------------------------------------
// Main enrichment function
// ---------------------------------------------------------------------------

/**
 * Enrich a lead with derived data from their contact info and, when available,
 * third-party enrichment APIs (Clearbit, Apollo). Falls back to heuristic-only
 * enrichment when no API key is configured or the API call fails.
 */
export async function enrichLead(
  lead: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    custom_answers: Record<string, unknown> | null;
    source: string;
  },
  business: {
    location_city: string | null;
    location_state: string | null;
  }
): Promise<LeadEnrichment> {
  // Always compute heuristic data — this provides email_type, phone_type,
  // engagement_signals, name_confidence, etc.
  const heuristic = heuristicEnrich(lead, business);

  // Try third-party enrichment if an email is available
  const provider = getEnrichmentProvider();
  if (!provider || !lead.email) {
    return heuristic;
  }

  let apiResult: EnrichmentProviderResult | null = null;
  try {
    apiResult = await provider.enrich({
      email: lead.email,
      first_name: lead.first_name,
      last_name: lead.last_name,
    });
  } catch {
    // API failure — fall back to heuristic silently
    return heuristic;
  }

  if (!apiResult) {
    return heuristic;
  }

  // Merge: API data takes precedence for location and company fields,
  // heuristics still provide email_type, phone_type, engagement_signals, etc.
  return {
    // Heuristic-owned fields
    email_domain: heuristic.email_domain,
    email_type: heuristic.email_type,
    phone_type: heuristic.phone_type,
    name_confidence: heuristic.name_confidence,
    engagement_signals: heuristic.engagement_signals,

    // Location: API takes precedence, fall back to heuristic
    geo_city: apiResult.geo_city ?? heuristic.geo_city,
    geo_state: apiResult.geo_state ?? heuristic.geo_state,
    geo_zip: apiResult.geo_zip ?? heuristic.geo_zip,

    // Distance: re-calculate if API gave us a state
    distance_miles: apiResult.geo_state
      ? estimateDistance(apiResult.geo_state, business.location_city, business.location_state)
      : heuristic.distance_miles,

    // API-provided fields
    enrichment_source: apiResult.source,
    company_name: apiResult.company_name,
    company_domain: apiResult.company_domain,
    company_size: apiResult.company_size,
    job_title: apiResult.job_title,
    industry: apiResult.industry,
    linkedin_url: apiResult.linkedin_url,
    annual_revenue: apiResult.annual_revenue,
    social_profiles: apiResult.social_profiles,
  };
}

/**
 * Format enrichment data into a text block for the AI scoring prompt.
 */
export function formatEnrichmentForScoring(
  enrichment: LeadEnrichment
): string {
  const lines: string[] = [];

  lines.push(`Enrichment source: ${enrichment.enrichment_source}`);

  if (enrichment.email_type !== "unknown") {
    lines.push(`Email type: ${enrichment.email_type} (${enrichment.email_domain ?? "unknown domain"})`);
  }

  if (enrichment.phone_type !== "unknown") {
    lines.push(`Phone type: ${enrichment.phone_type}`);
  }

  if (enrichment.geo_city || enrichment.geo_state) {
    const locationParts: string[] = [];
    if (enrichment.geo_city) locationParts.push(enrichment.geo_city);
    if (enrichment.geo_state) locationParts.push(enrichment.geo_state);
    lines.push(`Estimated location: ${locationParts.join(", ")}`);
  }

  if (enrichment.distance_miles !== null) {
    lines.push(
      `Estimated distance from business: ~${enrichment.distance_miles} miles`
    );
  }

  lines.push(`Name confidence: ${enrichment.name_confidence}`);

  if (enrichment.engagement_signals.length > 0) {
    lines.push(
      `Engagement signals: ${enrichment.engagement_signals.join(", ")}`
    );
  }

  // Third-party enrichment fields
  if (enrichment.company_name) {
    lines.push(`Company: ${enrichment.company_name}`);
  }
  if (enrichment.company_size) {
    lines.push(`Company size: ${enrichment.company_size} employees`);
  }
  if (enrichment.industry) {
    lines.push(`Industry: ${enrichment.industry}`);
  }
  if (enrichment.job_title) {
    lines.push(`Job title: ${enrichment.job_title}`);
  }
  if (enrichment.annual_revenue) {
    lines.push(`Annual revenue: ${enrichment.annual_revenue}`);
  }
  if (enrichment.linkedin_url) {
    lines.push(`LinkedIn: ${enrichment.linkedin_url}`);
  }
  if (Object.keys(enrichment.social_profiles).length > 0) {
    const profiles = Object.entries(enrichment.social_profiles)
      .map(([platform, url]) => `${platform}: ${url}`)
      .join(", ");
    lines.push(`Social profiles: ${profiles}`);
  }

  return lines.join("\n");
}
