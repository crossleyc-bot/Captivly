-- Referral tracking tables

-- Referral links: each converted customer can share a unique link
create table public.referral_links (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  lead_id uuid references public.leads(id) on delete set null,
  code text unique not null,
  referrer_name text,
  referrer_email text,
  clicks int default 0,
  conversions int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Referrals: tracks each referred lead
create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  referral_link_id uuid references public.referral_links(id) on delete cascade not null,
  referred_lead_id uuid references public.leads(id) on delete set null,
  status text check (status in ('clicked', 'signed_up', 'converted')) default 'clicked',
  converted_at timestamptz,
  created_at timestamptz default now()
);

-- Add referral_code to leads so we know which leads came from referrals
alter table public.leads
  add column referral_link_id uuid references public.referral_links(id) on delete set null default null;

-- RLS for referral_links
alter table public.referral_links enable row level security;

create policy "Users can manage their own referral links"
  on public.referral_links for all
  using (
    business_id in (
      select id from public.businesses where user_id = auth.uid()
    )
  );

-- RLS for referrals
alter table public.referrals enable row level security;

create policy "Users can view their own referrals"
  on public.referrals for all
  using (
    business_id in (
      select id from public.businesses where user_id = auth.uid()
    )
  );

-- Index for fast referral code lookups
create index idx_referral_links_code on public.referral_links(code);
create index idx_referrals_link_id on public.referrals(referral_link_id);
create index idx_leads_referral_link_id on public.leads(referral_link_id);

-- RPC to atomically increment click count
create or replace function increment_referral_clicks(p_link_id uuid)
returns void language sql as $$
  update public.referral_links
  set clicks = clicks + 1
  where id = p_link_id;
$$;

-- RPC to atomically increment conversion count
create or replace function increment_referral_conversions(p_link_id uuid)
returns void language sql as $$
  update public.referral_links
  set conversions = conversions + 1
  where id = p_link_id;
$$;
