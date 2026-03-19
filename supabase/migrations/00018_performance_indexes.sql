-- Performance indexes for common query patterns

-- Scheduler: find queued messages due for sending
-- (partial index already exists, add composite for lead_id + step lookup)
create index if not exists idx_messages_sent_lead_step
  on public.messages_sent(lead_id, sequence_step_id);

-- Scheduler: find active sequences
create index if not exists idx_sequences_active
  on public.sequences(is_active) where is_active = true;

-- Webhook: deduplicate Meta leads by meta_lead_id
create index if not exists idx_leads_meta_lead_id
  on public.leads(meta_lead_id) where meta_lead_id is not null;

-- Webhook: deduplicate Google leads by google_lead_id
create index if not exists idx_leads_google_lead_id
  on public.leads(google_lead_id) where google_lead_id is not null;

-- Webhook: find business by page_id or google_customer_id
create index if not exists idx_businesses_meta_page_id
  on public.businesses(meta_page_id) where meta_page_id is not null;

create index if not exists idx_businesses_google_customer_id
  on public.businesses(google_customer_id) where google_customer_id is not null;

-- Dashboard: recent leads ordered by creation date per business
create index if not exists idx_leads_business_created
  on public.leads(business_id, created_at desc);

-- Messages: find messages by provider_message_id (for delivery/bounce webhooks)
create index if not exists idx_messages_provider_id
  on public.messages_sent(provider_message_id) where provider_message_id is not null;

-- Reply detection: find lead by email for inbound reply matching
create index if not exists idx_leads_email_status
  on public.leads(email, status) where email is not null;

-- Reply detection: find lead by phone for SMS reply matching
create index if not exists idx_leads_phone_status
  on public.leads(phone, status) where phone is not null;

-- Conversions: by business + date for monthly reports
create index if not exists idx_conversions_business_date
  on public.conversions(business_id, converted_at desc);

-- Campaigns: by business + form_id for webhook lead matching
create index if not exists idx_campaigns_business_form
  on public.campaigns(business_id, meta_form_id) where meta_form_id is not null;

create index if not exists idx_campaigns_business_google_form
  on public.campaigns(business_id, google_form_id) where google_form_id is not null;

-- Report cards: prevent duplicate generation
create unique index if not exists idx_report_cards_business_month
  on public.report_cards(business_id, month);

-- API keys: lookup by hash for auth
create index if not exists idx_api_keys_hash
  on public.api_keys(key_hash);
