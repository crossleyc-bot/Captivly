-- API keys for Zapier and external integrations
create table api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  key_hash text not null, -- SHA-256 hash of the API key
  key_prefix text not null, -- First 8 chars for identification (e.g. "captv_ab")
  name text not null default 'Default',
  last_used_at timestamptz,
  created_at timestamptz default now()
);

alter table api_keys enable row level security;

create policy "Users can manage their own API keys"
  on api_keys for all
  using (user_id = auth.uid());
