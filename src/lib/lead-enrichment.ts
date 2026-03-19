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

/**
 * Enrich a lead with derived data from their contact info.
 *
 * This uses heuristic/local analysis only. For production, integrate
 * with paid enrichment APIs (Clearbit, Apollo, ZoomInfo) for richer
 * data like job title, company size, social profiles, etc.
 */
export function enrichLead(
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
    geo_city: null, // Would come from a geo API
    geo_state: phoneInfo.state,
    geo_zip: null, // Would come from a geo API
    distance_miles: distance,
    name_confidence: nameConfidence,
    engagement_signals: signals,
  };
}

/**
 * Format enrichment data into a text block for the AI scoring prompt.
 */
export function formatEnrichmentForScoring(
  enrichment: LeadEnrichment
): string {
  const lines: string[] = [];

  if (enrichment.email_type !== "unknown") {
    lines.push(`Email type: ${enrichment.email_type} (${enrichment.email_domain ?? "unknown domain"})`);
  }

  if (enrichment.phone_type !== "unknown") {
    lines.push(`Phone type: ${enrichment.phone_type}`);
  }

  if (enrichment.geo_state) {
    lines.push(`Estimated location: ${enrichment.geo_state}`);
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

  return lines.join("\n");
}
