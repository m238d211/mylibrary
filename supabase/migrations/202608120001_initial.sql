create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table if not exists public.categories (slug text primary key, name text not null unique, created_at timestamptz not null default now());
create table if not exists public.tools (
  id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null, description text not null, category text not null references public.categories(name),
  github_url text, npm_url text, homepage_url text, github_stars integer, npm_downloads bigint, latest_version text, score integer not null default 0 check (score between 0 and 100), status text not null, score_breakdown jsonb not null default '{}'::jsonb,
  is_published boolean not null default false, is_featured boolean not null default false, discovered_at timestamptz not null default now(), updated_at timestamptz, last_collected_at timestamptz, search_text text generated always as (lower(name || ' ' || description || ' ' || category)) stored, created_at timestamptz not null default now()
);
create table if not exists public.tool_metrics (id uuid primary key default gen_random_uuid(), tool_id uuid not null references public.tools(id) on delete cascade, collected_at timestamptz not null default now(), github_stars integer, npm_downloads bigint, latest_version text, repository_updated_at timestamptz, unique(tool_id, collected_at));
create table if not exists public.collection_runs (id uuid primary key default gen_random_uuid(), started_at timestamptz not null default now(), completed_at timestamptz, status text not null, new_tools integer not null default 0, updated_tools integer not null default 0, failed_sources jsonb not null default '[]'::jsonb, summary jsonb not null default '{}'::jsonb);
create table if not exists public.weekly_reports (id uuid primary key default gen_random_uuid(), reporting_week date not null unique, sent_at timestamptz not null default now(), recipient text not null, summary jsonb not null default '{}'::jsonb);
insert into public.categories (slug, name) values
  ('state-management', 'State Management'), ('testing', 'Testing'), ('styling-and-ui', 'Styling and UI'), ('data-fetching', 'Data Fetching'), ('forms-and-validation', 'Forms and Validation'), ('authentication', 'Authentication'), ('database-and-orm', 'Database and ORM'), ('build-tools', 'Build Tools'), ('animation', 'Animation'), ('accessibility', 'Accessibility'), ('developer-experience', 'Developer Experience'), ('other', 'Other')
on conflict (name) do nothing;
create index if not exists tools_public_score_idx on public.tools(is_published, score desc);
create index if not exists tools_category_idx on public.tools(category, is_published);
create index if not exists tools_search_idx on public.tools using gin(search_text gin_trgm_ops);
create index if not exists metrics_tool_date_idx on public.tool_metrics(tool_id, collected_at desc);
alter table public.categories enable row level security;
alter table public.tools enable row level security;
alter table public.tool_metrics enable row level security;
alter table public.collection_runs enable row level security;
alter table public.weekly_reports enable row level security;
create policy "public reads categories" on public.categories for select using (true);
create policy "public reads published tools" on public.tools for select using (is_published = true);
create policy "public reads metrics for published tools" on public.tool_metrics for select using (exists (select 1 from public.tools where tools.id = tool_metrics.tool_id and tools.is_published = true));
