import type { PlanTier } from "@/types/database";

export const META_API_VERSION = "v21.0";
export const META_API_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

export const GOOGLE_ADS_API_VERSION = "v17";
export const GOOGLE_ADS_API_BASE_URL = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;
export const GOOGLE_OAUTH_BASE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export const TIKTOK_API_BASE_URL = "https://business-api.tiktok.com/open_api/v1.3";
export const TIKTOK_OAUTH_BASE_URL = "https://business-api.tiktok.com/portal/auth";
export const TIKTOK_TOKEN_URL = "https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/";

export const LINKEDIN_API_BASE_URL = "https://api.linkedin.com/rest";
export const LINKEDIN_OAUTH_BASE_URL = "https://www.linkedin.com/oauth/v2/authorization";
export const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";

export const PLAN_LIMITS: Record<
  PlanTier,
  {
    leads_per_month: number;
    sms_per_month: number;
    campaigns: number;
    sequence_steps: number;
  }
> = {
  starter: { leads_per_month: 100, sms_per_month: 0, campaigns: 1, sequence_steps: 3 },
  growth: { leads_per_month: 500, sms_per_month: 500, campaigns: 5, sequence_steps: 5 },
  pro: { leads_per_month: 2000, sms_per_month: 2000, campaigns: Infinity, sequence_steps: 5 },
};

export const PLAN_HIERARCHY: Record<PlanTier, number> = {
  starter: 0,
  growth: 1,
  pro: 2,
};
