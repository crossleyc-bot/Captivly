-- Create conversions table
create table public.conversions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade not null,
  business_id uuid references public.businesses(id),
  type text,
  notes text,
  converted_at timestamptz default now()
);

create index conversions_lead_id_idx on public.conversions(lead_id);
create index conversions_business_id_idx on public.conversions(business_id);

-- RLS: users can access conversions for their businesses
alter table public.conversions enable row level security;

create policy "conversions_access" on public.conversions
  for all using (
    business_id in (select id from public.businesses where user_id = auth.uid())
  );
