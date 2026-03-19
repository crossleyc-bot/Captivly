-- Add enrichment data column to leads for advanced scoring
alter table public.leads
  add column enrichment_data jsonb default null;

-- Add enriched_at timestamp to track when enrichment was last run
alter table public.leads
  add column enriched_at timestamptz default null;
