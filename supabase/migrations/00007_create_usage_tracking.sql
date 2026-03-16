-- Create usage_tracking table
create table public.usage_tracking (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  month text not null,
  leads_count int default 0,
  sms_count int default 0,
  emails_count int default 0,
  updated_at timestamptz default now(),
  unique(business_id, month)
);

create index usage_tracking_business_month_idx on public.usage_tracking(business_id, month);

-- RLS: users can access usage data for their businesses
alter table public.usage_tracking enable row level security;

create policy "usage_tracking_access" on public.usage_tracking
  for all using (
    business_id in (select id from public.businesses where user_id = auth.uid())
  );
