-- Phase 4: White-labeling, Agency mode, Custom domains

-- White-label branding config (Pro plan only)
create table public.white_label_config (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade not null unique,
  app_name text not null default 'Captivly',
  logo_url text,
  primary_color text not null default '#18181b',
  accent_color text not null default '#3b82f6',
  favicon_url text,
  custom_domain text unique,
  custom_domain_verified boolean default false,
  hide_captivly_branding boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Agency mode: agencies can manage multiple client businesses
create table public.agencies (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.users(id) on delete cascade not null unique,
  name text not null,
  logo_url text,
  created_at timestamptz default now()
);

-- Link businesses to an agency
alter table public.businesses
  add column agency_id uuid references public.agencies(id) on delete set null default null;

-- Agency team members with roles
create table public.agency_members (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid references public.agencies(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  role text check (role in ('owner', 'admin', 'member')) not null default 'member',
  created_at timestamptz default now(),
  unique(agency_id, user_id)
);

-- Custom domain verification records
create table public.custom_domains (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  domain text unique not null,
  verification_token text not null,
  verified boolean default false,
  verified_at timestamptz,
  ssl_provisioned boolean default false,
  created_at timestamptz default now()
);

-- RLS policies

alter table public.white_label_config enable row level security;
create policy "Users can manage their own white-label config"
  on public.white_label_config for all
  using (
    business_id in (
      select id from public.businesses where user_id = auth.uid()
    )
  );

alter table public.agencies enable row level security;
create policy "Agency owners can manage their agency"
  on public.agencies for all
  using (owner_user_id = auth.uid());

alter table public.agency_members enable row level security;
create policy "Agency members can view their agency membership"
  on public.agency_members for all
  using (
    agency_id in (
      select id from public.agencies where owner_user_id = auth.uid()
    )
    or user_id = auth.uid()
  );

alter table public.custom_domains enable row level security;
create policy "Users can manage their own custom domains"
  on public.custom_domains for all
  using (
    business_id in (
      select id from public.businesses where user_id = auth.uid()
    )
  );

-- Indexes
create index idx_agency_members_user on public.agency_members(user_id);
create index idx_agency_members_agency on public.agency_members(agency_id);
create index idx_businesses_agency on public.businesses(agency_id);
create index idx_custom_domains_domain on public.custom_domains(domain);
create index idx_white_label_domain on public.white_label_config(custom_domain);
