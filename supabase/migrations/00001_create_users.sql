-- Create users table
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_tier text check (plan_tier in ('starter', 'growth', 'pro')) default 'starter',
  subscription_status text default 'inactive',
  created_at timestamptz default now()
);

-- RLS: users can only access their own row
alter table public.users enable row level security;

create policy "users_select_own" on public.users
  for select using (id = auth.uid());

create policy "users_update_own" on public.users
  for update using (id = auth.uid());

create policy "users_insert_own" on public.users
  for insert with check (id = auth.uid());
