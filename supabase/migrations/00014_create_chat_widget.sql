-- Chat widget configuration and conversations (Pro only)

create table public.chat_widget_config (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade not null unique,
  is_enabled boolean default false,
  greeting text default 'Hi there! How can I help you today?',
  accent_color text default '#18181b',
  position text check (position in ('bottom-right', 'bottom-left')) default 'bottom-right',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  visitor_name text,
  visitor_email text,
  messages jsonb not null default '[]',
  lead_id uuid references public.leads(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.chat_widget_config enable row level security;
alter table public.chat_conversations enable row level security;

create policy "Users can manage their own widget config"
  on public.chat_widget_config for all
  using (
    business_id in (
      select id from public.businesses where user_id = auth.uid()
    )
  );

create policy "Users can view their own chat conversations"
  on public.chat_conversations for select
  using (
    business_id in (
      select id from public.businesses where user_id = auth.uid()
    )
  );
