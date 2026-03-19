export type PlanTier = "starter" | "growth" | "pro";
export type SubscriptionStatus = "active" | "inactive" | "past_due" | "canceled";
export type CampaignStatus = "draft" | "active" | "paused" | "completed";
export type LeadStatus = "new" | "in_sequence" | "replied" | "converted" | "unsubscribed" | "cold";
export type MessageChannel = "email" | "sms";
export type MessageStatus = "queued" | "sent" | "delivered" | "failed" | "replied";
export type OutreachTone = "friendly" | "professional" | "casual";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_tier: PlanTier;
  subscription_status: SubscriptionStatus;
  created_at: string;
}

export interface Business {
  id: string;
  user_id: string;
  name: string;
  type: string;
  location_city: string | null;
  location_state: string | null;
  location_zip: string | null;
  target_radius_miles: number;
  target_age_min: number | null;
  target_age_max: number | null;
  target_interests: string[];
  primary_offer: string | null;
  outreach_tone: OutreachTone;
  meta_ad_account_id: string | null;
  meta_page_id: string | null;
  meta_access_token: string | null;
  google_customer_id: string | null;
  google_access_token: string | null;
  google_refresh_token: string | null;
  onboarding_completed: boolean;
  created_at: string;
}

export interface Campaign {
  id: string;
  business_id: string;
  name: string;
  meta_campaign_id: string | null;
  meta_adset_id: string | null;
  meta_ad_id: string | null;
  meta_form_id: string | null;
  google_campaign_id: string | null;
  google_form_id: string | null;
  status: CampaignStatus;
  daily_budget_cents: number | null;
  total_spend_cents: number;
  leads_count: number;
  conversions_count: number;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  business_id: string;
  campaign_id: string | null;
  meta_lead_id: string | null;
  google_lead_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  custom_answers: Record<string, unknown> | null;
  ai_score: number | null;
  ai_score_reason: string | null;
  status: LeadStatus;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface Sequence {
  id: string;
  business_id: string;
  campaign_id: string | null;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface SequenceStep {
  id: string;
  sequence_id: string;
  step_number: number;
  channel: MessageChannel;
  subject: string | null;
  body: string;
  delay_days: number;
  created_at: string;
}

export interface MessageSent {
  id: string;
  lead_id: string;
  sequence_step_id: string | null;
  channel: MessageChannel;
  to_address: string | null;
  subject: string | null;
  body: string | null;
  status: MessageStatus;
  sent_at: string | null;
  delivered_at: string | null;
  replied_at: string | null;
  provider_message_id: string | null;
  created_at: string;
}

export interface UsageTracking {
  id: string;
  business_id: string;
  month: string;
  leads_count: number;
  sms_count: number;
  emails_count: number;
  updated_at: string;
}

export interface Conversion {
  id: string;
  lead_id: string;
  business_id: string | null;
  type: string | null;
  notes: string | null;
  converted_at: string;
}
