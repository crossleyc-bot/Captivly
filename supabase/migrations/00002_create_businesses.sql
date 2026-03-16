-- Create businesses table
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  type text not null,
  location_city text,
  location_state text,
  location_zip text,
  target_radius_miles int default 10,
  target_age_min int,
  target_age_max int,
  target_interests text[],
  primary_offer text,
  outreach_tone text default 'friendly',
  meta_ad_account_id text,
  meta_page_id text,
  meta_access_token text,
  onboarding_completed boolean default false,
  created_at timestamptz default now()
);

create index businesses_user_id_idx on public.businesses(user_id);

-- RLS: users can only access their own businesses
alter table public.businesses enable row level security;

create policy "businesses_select_own" on public.businesses
  for select using (user_id = auth.uid());

create policy "businesses_insert_own" on public.businesses
  for insert with check (user_id = auth.uid());

create policy "businesses_update_own" on public.businesses
  for update using (user_id = auth.uid());

create policy "businesses_delete_own" on public.businesses
  for delete using (user_id = auth.uid());
