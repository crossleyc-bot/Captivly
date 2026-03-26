-- Webhook dead letter queue for failed webhook deliveries
create table if not exists public.webhook_dead_letters (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  source text not null,
  payload jsonb not null,
  error_message text,
  status text check (status in ('pending', 'processed', 'failed')) default 'pending',
  retry_count int default 0,
  last_retried_at timestamptz,
  processed_at timestamptz,
  created_at timestamptz default now()
);

-- Index for fetching pending entries efficiently
create index if not exists idx_dead_letters_status on public.webhook_dead_letters(status) where status = 'pending';

-- Index for filtering by business
create index if not exists idx_dead_letters_business_id on public.webhook_dead_letters(business_id);

-- Enable RLS
alter table public.webhook_dead_letters enable row level security;

-- Users can view dead letters belonging to their own businesses
create policy "Users can view their own dead letters"
  on public.webhook_dead_letters for select
  using (
    business_id in (
      select id from public.businesses where user_id = auth.uid()
    )
  );

-- Only service role can insert/update (webhook handlers run as service role)
-- No insert/update/delete policies for authenticated users — API routes use service role client
