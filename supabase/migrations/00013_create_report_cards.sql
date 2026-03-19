-- Create report_cards table for storing AI-generated monthly reports (Pro only)
create table public.report_cards (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  month text not null,  -- format: '2026-03'
  summary text not null,
  top_insight text not null,
  recommendation text not null,
  metrics jsonb not null default '{}',
  created_at timestamptz default now(),
  unique(business_id, month)
);

alter table public.report_cards enable row level security;

create policy "Users can view their own report cards"
  on public.report_cards for select
  using (
    business_id in (
      select id from public.businesses where user_id = auth.uid()
    )
  );
