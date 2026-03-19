-- Add Google Ads fields to businesses table
alter table businesses
  add column google_customer_id text,
  add column google_access_token text,
  add column google_refresh_token text;

-- Add google_lead_id to leads table for deduplication
alter table leads
  add column google_lead_id text;

-- Add Google campaign fields to campaigns table
alter table campaigns
  add column google_campaign_id text,
  add column google_form_id text;

-- Unique index for Google lead deduplication (matching meta_lead_id pattern)
create unique index leads_google_lead_id_unique on leads (google_lead_id) where google_lead_id is not null;
