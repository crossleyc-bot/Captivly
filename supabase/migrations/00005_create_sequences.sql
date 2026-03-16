-- Create sequences table
create table public.sequences (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  campaign_id uuid references public.campaigns(id),
  name text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

create index sequences_business_id_idx on public.sequences(business_id);
create index sequences_campaign_id_idx on public.sequences(campaign_id);

-- RLS: users can access sequences belonging to their businesses
alter table public.sequences enable row level security;

create policy "sequences_access" on public.sequences
  for all using (
    business_id in (select id from public.businesses where user_id = auth.uid())
  );

-- Create sequence_steps table
create table public.sequence_steps (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid references public.sequences(id) on delete cascade not null,
  step_number int not null,
  channel text check (channel in ('email', 'sms')) not null,
  subject text,
  body text not null,
  delay_days int not null,
  created_at timestamptz default now()
);

create index sequence_steps_sequence_id_idx on public.sequence_steps(sequence_id);

-- RLS: users can access sequence steps via sequence → business ownership
alter table public.sequence_steps enable row level security;

create policy "sequence_steps_access" on public.sequence_steps
  for all using (
    sequence_id in (
      select id from public.sequences where business_id in (
        select id from public.businesses where user_id = auth.uid()
      )
    )
  );
