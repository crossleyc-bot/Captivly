-- A/B testing: allow multiple message variants per sequence step
create table sequence_step_variants (
  id uuid primary key default gen_random_uuid(),
  sequence_step_id uuid references sequence_steps(id) on delete cascade,
  variant_label text not null default 'A', -- 'A', 'B', 'C', etc.
  subject text, -- email only
  body text not null,
  sends_count int default 0,
  opens_count int default 0,
  clicks_count int default 0,
  replies_count int default 0,
  created_at timestamptz default now()
);

-- Track which variant was used for each message
alter table messages_sent
  add column variant_id uuid references sequence_step_variants(id);

-- RLS
alter table sequence_step_variants enable row level security;

create policy "Users can access variants for their own sequences"
  on sequence_step_variants for all
  using (
    sequence_step_id in (
      select ss.id from sequence_steps ss
      join sequences s on s.id = ss.sequence_id
      join businesses b on b.id = s.business_id
      where b.user_id = auth.uid()
    )
  );

-- RPC to increment variant send count
create or replace function increment_variant_sends(p_variant_id uuid)
returns void as $$
begin
  update sequence_step_variants
  set sends_count = sends_count + 1
  where id = p_variant_id;
end;
$$ language plpgsql security definer;

-- RPC to increment variant reply count (called from reply handler)
create or replace function increment_variant_replies(p_variant_id uuid)
returns void as $$
begin
  update sequence_step_variants
  set replies_count = replies_count + 1
  where id = p_variant_id;
end;
$$ language plpgsql security definer;
