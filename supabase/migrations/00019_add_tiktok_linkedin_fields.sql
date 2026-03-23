-- Add TikTok Lead Generation fields
alter table businesses
  add column if not exists tiktok_advertiser_id text,
  add column if not exists tiktok_access_token text,
  add column if not exists tiktok_refresh_token text;

alter table campaigns
  add column if not exists tiktok_campaign_id text,
  add column if not exists tiktok_form_id text;

alter table leads
  add column if not exists tiktok_lead_id text unique;

-- Add LinkedIn Lead Gen Forms fields
alter table businesses
  add column if not exists linkedin_ad_account_id text,
  add column if not exists linkedin_access_token text,
  add column if not exists linkedin_refresh_token text;

alter table campaigns
  add column if not exists linkedin_campaign_id text,
  add column if not exists linkedin_form_id text;

alter table leads
  add column if not exists linkedin_lead_id text unique;
