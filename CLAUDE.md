# Captivly.ai — Claude Code Project Brief
## What We're Building
Captivly.ai is a **proactive lead generation SaaS platform** for B2C local businesses (gyms, salons, restaurants, home service providers). It connects to Meta Lead Ads, automatically pulls in new leads, scores them with AI, and fires personalized multi-step email + SMS outreach sequences — all without the business owner needing marketing expertise.
**Core promise:** A gym owner sets up once, and Captivly runs their lead generation automatically while they run their business.
---
## Tech Stack
| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend / DB | Supabase (Postgres + Auth + RLS) |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) |
| Payments | Stripe (subscription billing + customer portal) |
| Email | Resend |
| SMS | Twilio |
| Meta Ads | Meta Marketing API + Webhooks |
| Deployment | AWS Elastic Beanstalk |
---
## Architecture Overview
```
Customer's Facebook Lead Ad
          ↓
    Meta Webhook (real-time)
          ↓
  /api/meta/webhook (Next.js)
          ↓
    Lead saved to Supabase
          ↓
    Claude scores lead (1–10)
          ↓
  Claude generates sequence messages
          ↓
  Sequence scheduler queues steps
          ↓
  Resend (email) + Twilio (SMS) fire automatically
          ↓
  Dashboard updates in real time
```
---
## Subscription Tiers
| Feature | Starter $49/mo | Growth $99/mo | Pro $199/mo |
|---|---|---|---|
| Meta Lead Ads integration | ✅ | ✅ | ✅ |
| AI lead scoring | ✅ | ✅ | ✅ |
| AI outreach sequences (3-step) | ✅ | ✅ | ✅ |
| AI outreach sequences (5-step) | ❌ | ✅ | ✅ |
| SMS outreach | ❌ | ✅ | ✅ |
| SMS messages per month | 0 | 500 | 2,000 |
| Leads per month | 100 | 500 | 2,000 |
| Campaigns | 1 | 5 | Unlimited |
| Multiple campaigns | ❌ | ✅ | ✅ |
| AI monthly report card | ❌ | ❌ | ✅ |
| AI chat widget | ❌ | ❌ | ✅ |
| White-labeling | ❌ | ❌ | ✅ |
### Plan Limits Reference (for feature gating)
```typescript
export const PLAN_LIMITS = {
  starter: { leads_per_month: 100, sms_per_month: 0,   campaigns: 1,         sequence_steps: 3 },
  growth:  { leads_per_month: 500, sms_per_month: 500,  campaigns: 5,         sequence_steps: 5 },
  pro:     { leads_per_month: 2000, sms_per_month: 2000, campaigns: Infinity, sequence_steps: 5 },
};
```
---
## Database Schema
### `users`
```sql
create table users (
  id uuid primary key references auth.users(id),
  email text not null,
  full_name text,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_tier text check (plan_tier in ('starter', 'growth', 'pro')) default 'starter',
  subscription_status text default 'inactive',
  created_at timestamptz default now()
);
```
### `businesses`
```sql
create table businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  type text not null, -- gym, salon, restaurant, etc.
  location_city text,
  location_state text,
  location_zip text,
  target_radius_miles int default 10,
  target_age_min int,
  target_age_max int,
  target_interests text[], -- ['fitness', 'wellness']
  primary_offer text, -- 'Free 7-day trial membership'
  outreach_tone text default 'friendly', -- friendly, professional, casual
  meta_ad_account_id text,
  meta_page_id text,
  meta_access_token text,
  onboarding_completed boolean default false,
  created_at timestamptz default now()
);
```
### `campaigns`
```sql
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  name text not null,
  meta_campaign_id text,
  meta_adset_id text,
  meta_ad_id text,
  meta_form_id text,
  status text check (status in ('draft', 'active', 'paused', 'completed')) default 'draft',
  daily_budget_cents int,
  total_spend_cents int default 0,
  leads_count int default 0,
  conversions_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```
### `leads`
```sql
create table leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  campaign_id uuid references campaigns(id),
  meta_lead_id text unique,
  first_name text,
  last_name text,
  email text,
  phone text,
  custom_answers jsonb, -- answers to custom form questions
  ai_score int check (ai_score between 1 and 10),
  ai_score_reason text,
  status text check (status in ('new', 'in_sequence', 'replied', 'converted', 'unsubscribed', 'cold')) default 'new',
  source text default 'meta',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```
### `sequences`
```sql
create table sequences (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  campaign_id uuid references campaigns(id),
  name text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);
```
### `sequence_steps`
```sql
create table sequence_steps (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid references sequences(id) on delete cascade,
  step_number int not null,
  channel text check (channel in ('email', 'sms')),
  subject text, -- email only
  body text not null,
  delay_days int not null, -- days after lead capture to send
  created_at timestamptz default now()
);
```
### `messages_sent`
```sql
create table messages_sent (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  sequence_step_id uuid references sequence_steps(id),
  channel text check (channel in ('email', 'sms')),
  to_address text,
  subject text,
  body text,
  status text check (status in ('queued', 'sent', 'delivered', 'failed', 'replied')),
  sent_at timestamptz,
  delivered_at timestamptz,
  replied_at timestamptz,
  provider_message_id text,
  created_at timestamptz default now()
);
```
### `usage_tracking`
```sql
create table usage_tracking (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  month text not null, -- format: '2026-03'
  leads_count int default 0,
  sms_count int default 0,
  emails_count int default 0,
  updated_at timestamptz default now(),
  unique(business_id, month)
);
```
> Usage is checked before every lead ingestion and SMS send. If a business is at their plan limit, the action is blocked and the owner is notified with an upgrade prompt. Increment `leads_count` on every new lead saved, `sms_count` on every SMS sent.
### `conversions`
```sql
create table conversions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  business_id uuid references businesses(id),
  type text, -- 'trial_booked', 'appointment_set', 'member_joined'
  notes text,
  converted_at timestamptz default now()
);
```
---
## Row Level Security
All tables must have RLS enabled. Users can only access data belonging to their own business.
```sql
-- Example pattern (apply to all tables)
alter table leads enable row level security;
create policy "Users can only access their own leads"
  on leads for all
  using (
    business_id in (
      select id from businesses where user_id = auth.uid()
    )
  );
```
---
## Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER=
STRIPE_PRICE_GROWTH=
STRIPE_PRICE_PRO=
# Anthropic
ANTHROPIC_API_KEY=
# Meta
META_APP_ID=
META_APP_SECRET=
META_SYSTEM_USER_TOKEN=
META_VERIFY_TOKEN=captivly_webhook_secret
# Google Ads
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
GOOGLE_ADS_DEVELOPER_TOKEN=
# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
# Resend
RESEND_API_KEY=
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
---
## Key API Routes
| Route | Method | Purpose |
|---|---|---|
| `/api/meta/webhook` | GET | Meta webhook verification |
| `/api/meta/webhook` | POST | Receive new leads from Meta in real time |
| `/api/meta/auth` | GET | OAuth redirect to Meta for ad account access |
| `/api/meta/callback` | GET | Meta OAuth callback, store access token |
| `/api/meta/create-campaign` | POST | Create Lead Ad campaign via Meta Marketing API |
| `/api/google/auth` | GET | OAuth redirect to Google for Ads account access |
| `/api/google/callback` | GET | Google OAuth callback, store tokens |
| `/api/google/webhook` | POST | Receive new leads from Google Ads via Pub/Sub |
| `/api/leads/score` | POST | Score a lead using Claude AI |
| `/api/sequences/generate` | POST | Generate sequence messages with Claude AI |
| `/api/sequences/send` | POST | Fire a sequence step (email or SMS) |
| `/api/stripe/webhook` | POST | Handle Stripe subscription events |
| `/api/stripe/create-checkout` | POST | Create Stripe checkout session |
| `/api/stripe/portal` | POST | Open Stripe customer portal |
---
## App Pages & Routes
| Route | Page | Access |
|---|---|---|
| `/` | Marketing landing page | Public |
| `/login` | Login | Public |
| `/signup` | Sign up | Public |
| `/onboarding` | 5-step onboarding wizard | Auth |
| `/dashboard` | Main dashboard | Auth |
| `/campaigns` | Campaign list + create | Auth |
| `/campaigns/[id]` | Campaign detail + leads | Auth |
| `/leads` | All leads across campaigns | Auth |
| `/leads/[id]` | Lead detail + message timeline | Auth |
| `/sequences` | Sequence templates | Auth |
| `/analytics` | Performance analytics | Auth |
| `/settings` | Account, billing, notifications | Auth |
---
## Onboarding Wizard Steps
```
Step 1: Business basics     → name, type, location
Step 2: Target audience     → age range, radius, interests
Step 3: Primary offer       → what you're promoting (free trial, discount, etc.)
Step 4: Connect Meta        → OAuth to link Facebook/Instagram ad account
Step 5: Choose plan         → Stripe checkout
```
After onboarding:
- Claude auto-generates a starter campaign (ad copy + 5-step sequence)
- Campaign is saved as a draft for the owner to review and activate
---
## AI Integration Points
### 1. Lead Scoring
Triggered immediately when a new lead arrives via Meta webhook.
```
System: You are a lead quality analyst for a local business.
Given a lead's info and the business's target profile, score this lead 1-10.
Return JSON: { score: number, reason: string }
User: Business type: {type}. Target: {age_range}, {location}, interested in {interests}.
Lead: {first_name}, {age_if_known}, {location_if_known}, answered "{custom_answer}".
```
### 2. Sequence Generation
Triggered after onboarding when a campaign is created.
```
System: You are an expert local business marketer.
Generate a {n}-step outreach sequence for a {business_type} promoting "{offer}".
Tone: {tone}. Channels: email and SMS alternating.
Return JSON array of steps: [{ step, channel, subject?, body, delay_days }]
```
### 3. Monthly Report Card (Pro)
Triggered on the 1st of each month.
```
System: You are a marketing analyst writing a plain-English performance summary.
User: Here is last month's data: {metrics_json}
Write a 3-paragraph report card with: summary, top insight, one recommendation.
```
---
## Sequence Scheduler
Use a Supabase Edge Function or cron job (via `pg_cron`) to check every hour:
```sql
-- Find sequence steps due to be sent
select ms.*, l.email, l.phone, ss.channel, ss.body, ss.subject
from messages_sent ms
join leads l on l.id = ms.lead_id
join sequence_steps ss on ss.id = ms.sequence_step_id
where ms.status = 'queued'
and ms.sent_at <= now();
```
Then call Resend or Twilio to deliver, update `messages_sent.status` to `sent`.
---
## Feature Gating Middleware
Check plan tier before serving Growth/Pro features:
```typescript
// lib/feature-gate.ts
export const PLAN_LIMITS = {
  starter: { leads_per_month: 100, sms_per_month: 0,    campaigns: 1,        sequence_steps: 3 },
  growth:  { leads_per_month: 500, sms_per_month: 500,   campaigns: 5,        sequence_steps: 5 },
  pro:     { leads_per_month: 2000, sms_per_month: 2000, campaigns: Infinity, sequence_steps: 5 },
};
export function requirePlan(
  userPlan: string,
  requiredPlan: 'starter' | 'growth' | 'pro'
): boolean {
  const hierarchy = { starter: 0, growth: 1, pro: 2 };
  return hierarchy[userPlan] >= hierarchy[requiredPlan];
}
export async function checkUsageLimit(
  businessId: string,
  plan: 'starter' | 'growth' | 'pro',
  type: 'leads' | 'sms'
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const month = new Date().toISOString().slice(0, 7); // '2026-03'
  const { data } = await supabase
    .from('usage_tracking')
    .select('leads_count, sms_count')
    .eq('business_id', businessId)
    .eq('month', month)
    .single();
  const current = type === 'leads' ? (data?.leads_count ?? 0) : (data?.sms_count ?? 0);
  const limit = type === 'leads' ? PLAN_LIMITS[plan].leads_per_month : PLAN_LIMITS[plan].sms_per_month;
  return { allowed: current < limit, current, limit };
}
```
Apply `requirePlan` for feature access checks and `checkUsageLimit` before every lead ingestion and SMS send. When a limit is hit, return a 403 with an upgrade prompt message.
---
## Coding Standards
- **Server components** handle all data fetching from Supabase
- **Client components** handle UI state and user interactions only
- Use `createServerComponentClient` for server-side Supabase calls
- Use `createClientComponentClient` for client-side Supabase calls
- All API routes validate the authenticated user before processing
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or `STRIPE_SECRET_KEY` to the client
- All Claude API calls happen server-side only
- TypeScript strict mode — no `any` types
- Tailwind only for styling — no inline styles or CSS modules
---
## Phase Roadmap
### Phase 1 (Current — MVP)
- [ ] Supabase schema + RLS
- [ ] Auth (login, signup, password reset)
- [ ] Onboarding wizard (5 steps)
- [ ] Stripe subscriptions + feature gating
- [ ] Meta OAuth + Lead Ads campaign creation
- [ ] Meta webhook lead ingestion
- [ ] AI lead scoring
- [ ] AI sequence generation
- [ ] Sequence scheduler (email + SMS)
- [ ] Resend email integration
- [ ] Twilio SMS integration
- [ ] Dashboard (leads, conversions, spend)
- [ ] Lead detail view + message timeline
- [ ] Stripe billing portal
- [ ] Usage tracking (leads + SMS per month enforced per plan tier)
- [ ] Upgrade prompt shown when usage limit is reached
### Phase 2
- Google Lead Ads integration
- Multiple campaigns per business
- A/B testing for sequence messages
- Reply detection + sequence pause
- Zapier integration
### Phase 3
- AI monthly report cards
- AI chat widget (embeddable)
- Advanced lead scoring with enrichment
- Referral tracking
### Phase 4
- White-labeling
- Agency mode (manage multiple client accounts)
- Custom domain support
---
## Definition of Done — Phase 1
- [ ] Business owner can sign up and complete onboarding in under 20 minutes
- [ ] Meta OAuth connects ad account with one click
- [ ] Captivly can create a Lead Ad campaign via Meta Marketing API
- [ ] A new Meta lead appears in Captivly within 60 seconds of form submission
- [ ] Every lead receives an AI quality score (1–10) on arrival
- [ ] A personalized email is sent to the lead within 60 seconds
- [ ] Full 5-step email + SMS sequence fires automatically over 14 days
- [ ] Dashboard shows real-time leads, sequence status, conversions, and spend
- [ ] Stripe billing works end-to-end including upgrade and failed payment handling
- [ ] Growth and Pro features are inaccessible to Starter plan users
- [ ] SMS and lead usage limits are enforced per plan tier monthly
- [ ] Business owner sees an upgrade prompt when approaching or hitting their usage limit
- [ ] All data is isolated per business (RLS enforced)
- [ ] App deploys successfully to AWS Elastic Beanstalk
