-- Create leads table
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  campaign_id uuid references public.campaigns(id),
  meta_lead_id text unique,
  first_name text,
  last_name text,
  email text,
  phone text,
  custom_answers jsonb,
  ai_score int check (ai_score between 1 and 10),
  ai_score_reason text,
  status text check (status in ('new', 'in_sequence', 'replied', 'converted', 'unsubscribed', 'cold')) default 'new',
  source text default 'meta',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index leads_business_id_idx on public.leads(business_id);
create index leads_campaign_id_idx on public.leads(campaign_id);
create index leads_status_idx on public.leads(status);

-- RLS: users can access leads belonging to their businesses
alter table public.leads enable row level security;

create policy "leads_access" on public.leads
  for all using (
    business_id in (select id from public.businesses where user_id = auth.uid())
  );
