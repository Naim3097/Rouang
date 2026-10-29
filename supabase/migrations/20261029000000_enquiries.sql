-- Project enquiries from the website.
--
-- Security model: Row Level Security is on and there are NO policies, so the public `anon` and
-- `authenticated` roles can neither read nor write this table. Only the website's server code,
-- using the secret (service role) key, can insert rows. The studio reads enquiries in the
-- Supabase dashboard or through a future authenticated admin.

create table if not exists public.enquiries (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  name          text not null check (char_length(name) between 2 and 120),
  email         text check (email is null or char_length(email) <= 254),
  phone         text check (phone is null or char_length(phone) <= 24),
  category      text not null check (category in ('residential', 'commercial')),
  project_type  text check (project_type is null or char_length(project_type) <= 80),
  location      text check (location is null or char_length(location) <= 120),
  budget        text check (budget is null or char_length(budget) <= 60),
  timeline      text check (timeline is null or char_length(timeline) <= 60),
  message       text not null check (char_length(message) between 10 and 3000),

  -- Attribution: which page and campaign produced the lead.
  source_path   text check (source_path is null or char_length(source_path) <= 300),
  utm           text check (utm is null or char_length(utm) <= 500),

  -- Abuse protection. A salted hash, never the IP address itself.
  ip_hash       text,
  user_agent    text,

  -- Lead quality, updated by the studio so marketing can be judged on real outcomes.
  status        text not null default 'new'
                check (status in ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost', 'spam')),
  notes         text,

  constraint enquiries_contact_present check (email is not null or phone is not null)
);

comment on table public.enquiries is 'Website project enquiries. Insert-only from the server; RLS on with no public policies.';
comment on column public.enquiries.status is 'Updated by the studio: new, contacted, qualified, proposal, won, lost, spam.';

create index if not exists enquiries_created_at_idx on public.enquiries (created_at desc);
create index if not exists enquiries_ip_recent_idx on public.enquiries (ip_hash, created_at desc);
create index if not exists enquiries_status_idx on public.enquiries (status);

alter table public.enquiries enable row level security;
alter table public.enquiries force row level security;

revoke all on table public.enquiries from anon, authenticated;

-- Retention: the privacy notice promises deletion, normally within two years of last contact.
-- Run periodically (e.g. with pg_cron) once the studio confirms the period:
--   delete from public.enquiries where created_at < now() - interval '2 years' and status in ('new','contacted','lost','spam');
