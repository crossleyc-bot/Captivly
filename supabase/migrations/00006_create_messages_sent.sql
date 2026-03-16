-- Create messages_sent table
create table public.messages_sent (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade not null,
  sequence_step_id uuid references public.sequence_steps(id),
  channel text check (channel in ('email', 'sms')) not null,
  to_address text,
  subject text,
  body text,
  status text check (status in ('queued', 'sent', 'delivered', 'failed', 'replied')) default 'queued',
  sent_at timestamptz,
  delivered_at timestamptz,
  replied_at timestamptz,
  provider_message_id text,
  created_at timestamptz default now()
);

create index messages_sent_lead_id_idx on public.messages_sent(lead_id);
create index messages_sent_status_idx on public.messages_sent(status);
create index messages_sent_sent_at_idx on public.messages_sent(sent_at) where status = 'queued';

-- RLS: users can access messages via lead → business ownership
alter table public.messages_sent enable row level security;

create policy "messages_sent_access" on public.messages_sent
  for all using (
    lead_id in (
      select id from public.leads where business_id in (
        select id from public.businesses where user_id = auth.uid()
      )
    )
  );
