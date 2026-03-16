-- Create campaigns table
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  name text not null,
  meta_campaign_id text,
  meta_adset_id text,
  meta_ad_id text,
  meta_form_id text,
  status text check (status in ('draft', 'active', 'paused', 'completed')) default 'draft',
  daily_budget_cents int,
  total_spend_cents int default 0,
  leads_count int default 0,
  conversions_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index campaigns_business_id_idx on public.campaigns(business_id);

-- RLS: users can access campaigns belonging to their businesses
alter table public.campaigns enable row level security;

create policy "campaigns_access" on public.campaigns
  for all using (
    business_id in (select id from public.businesses where user_id = auth.uid())
  );
