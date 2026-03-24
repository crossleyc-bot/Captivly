-- Support tickets (authenticated users only)
create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  business_id uuid references public.businesses(id) on delete set null,
  subject text not null,
  message text not null,
  status text check (status in ('open', 'in_progress', 'resolved', 'closed')) default 'open',
  urgency text check (urgency in ('low', 'medium', 'high')) default 'medium',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS: users can only see their own tickets
alter table public.support_tickets enable row level security;

create policy "Users can manage their own support tickets"
  on public.support_tickets for all
  using (user_id = auth.uid());

-- Index for fast lookups by user
create index idx_support_tickets_user_id on public.support_tickets(user_id);

-- Contact form submissions (public, service-role only — no RLS needed)
create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz default now()
);

-- Enable RLS but with no policies — only service role can access
alter table public.contact_submissions enable row level security;
