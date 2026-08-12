alter table public.weekly_reports
  add column if not exists delivery_status text not null default 'pending',
  add column if not exists resend_id text;

create index if not exists weekly_reports_status_idx on public.weekly_reports(delivery_status, reporting_week desc);
