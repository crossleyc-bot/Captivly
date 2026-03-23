-- Pipeline stages: customizable per business
create table public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  name text not null,
  position int not null default 0,
  color text not null default '#64748b', -- hex color for the stage
  is_won boolean not null default false,
  is_lost boolean not null default false,
  created_at timestamptz default now()
);

alter table public.pipeline_stages enable row level security;

create policy "Users can manage their own pipeline stages"
  on public.pipeline_stages for all
  using (
    business_id in (select id from public.businesses where user_id = auth.uid())
  );

-- Deals: track opportunities through pipeline stages
create table public.deals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  lead_id uuid references public.leads(id) on delete set null,
  stage_id uuid references public.pipeline_stages(id) on delete set null,
  title text not null,
  value_cents int default 0,
  expected_close_date date,
  notes text,
  closed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.deals enable row level security;

create policy "Users can manage their own deals"
  on public.deals for all
  using (
    business_id in (select id from public.businesses where user_id = auth.uid())
  );

-- Deal activity log: tracks stage changes and notes
create table public.deal_activities (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references public.deals(id) on delete cascade not null,
  type text not null check (type in ('stage_change', 'note', 'created', 'closed')),
  from_stage_id uuid references public.pipeline_stages(id) on delete set null,
  to_stage_id uuid references public.pipeline_stages(id) on delete set null,
  content text,
  created_at timestamptz default now()
);

alter table public.deal_activities enable row level security;

create policy "Users can view their own deal activities"
  on public.deal_activities for all
  using (
    deal_id in (
      select id from public.deals where business_id in (
        select id from public.businesses where user_id = auth.uid()
      )
    )
  );

-- Insert default pipeline stages for new businesses via a function
create or replace function create_default_pipeline_stages(p_business_id uuid)
returns void language plpgsql security definer as $$
begin
  insert into public.pipeline_stages (business_id, name, position, color, is_won, is_lost) values
    (p_business_id, 'New Lead',       0, '#3b82f6', false, false),
    (p_business_id, 'Contacted',      1, '#8b5cf6', false, false),
    (p_business_id, 'Qualified',      2, '#f59e0b', false, false),
    (p_business_id, 'Proposal Sent',  3, '#06b6d4', false, false),
    (p_business_id, 'Negotiation',    4, '#ec4899', false, false),
    (p_business_id, 'Won',            5, '#16a34a', true,  false),
    (p_business_id, 'Lost',           6, '#ef4444', false, true);
end;
$$;

-- Index for fast lookups
create index idx_deals_business_stage on public.deals (business_id, stage_id);
create index idx_deals_lead on public.deals (lead_id);
create index idx_deal_activities_deal on public.deal_activities (deal_id);
create index idx_pipeline_stages_business on public.pipeline_stages (business_id, position);
