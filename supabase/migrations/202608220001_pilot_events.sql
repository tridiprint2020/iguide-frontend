create table if not exists public.pilot_events (
  event_id text primary key,
  schema_version smallint not null default 1,
  event_type text not null,
  occurred_at timestamptz not null,
  visit_session_id text not null,
  source_code text,
  experience_id text,
  outcome_reason text,
  language text not null,
  app_version text not null,
  received_at timestamptz not null default now(),
  constraint pilot_events_schema_version_check
    check (schema_version = 1),
  constraint pilot_events_event_id_check
    check (char_length(event_id) between 1 and 240),
  constraint pilot_events_event_type_check
    check (event_type in (
      'qr_opened',
      'mission_start_requested',
      'mission_started',
      'mission_start_failed',
      'ar_opened',
      'ar_ready',
      'ar_failed',
      'mission_abandoned',
      'mission_certified'
    )),
  constraint pilot_events_visit_session_check
    check (char_length(visit_session_id) between 1 and 80),
  constraint pilot_events_source_code_check
    check (
      source_code is null or
      source_code ~ '^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$'
    ),
  constraint pilot_events_experience_id_check
    check (
      experience_id is null or
      char_length(experience_id) between 1 and 120
    ),
  constraint pilot_events_outcome_reason_check
    check (
      outcome_reason is null or
      char_length(outcome_reason) between 1 and 64
    ),
  constraint pilot_events_language_check
    check (char_length(language) between 1 and 16),
  constraint pilot_events_app_version_check
    check (char_length(app_version) between 1 and 40)
);

alter table public.pilot_events enable row level security;

revoke all on table public.pilot_events from anon, authenticated;
grant insert on table public.pilot_events to anon;

drop policy if exists
  "pilot anonymous events are insert only"
  on public.pilot_events;

create policy
  "pilot anonymous events are insert only"
  on public.pilot_events
  for insert
  to anon
  with check (schema_version = 1);

create or replace view public.pilot_funnel_by_source as
select
  coalesce(source_code, 'organic') as source_code,
  count(distinct visit_session_id)
    filter (where event_type = 'qr_opened') as qr_sessions,
  count(distinct visit_session_id)
    filter (where event_type = 'mission_started') as mission_sessions,
  count(distinct visit_session_id)
    filter (where event_type = 'ar_ready') as ar_ready_sessions,
  count(distinct visit_session_id)
    filter (where event_type = 'mission_certified') as certified_sessions,
  count(distinct visit_session_id)
    filter (where event_type = 'mission_abandoned') as abandoned_sessions
from public.pilot_events
group by coalesce(source_code, 'organic');

revoke all on table public.pilot_funnel_by_source
  from anon, authenticated;

create or replace view public.pilot_funnel_daily as
select
  (received_at at time zone 'America/Lima')::date as pilot_date,
  coalesce(source_code, 'organic') as source_code,
  count(distinct visit_session_id)
    filter (where event_type = 'qr_opened') as qr_sessions,
  count(distinct visit_session_id)
    filter (where event_type = 'mission_started') as mission_sessions,
  count(distinct visit_session_id)
    filter (where event_type = 'ar_ready') as ar_ready_sessions,
  count(distinct visit_session_id)
    filter (where event_type = 'mission_certified') as certified_sessions,
  count(distinct visit_session_id)
    filter (where event_type = 'mission_abandoned') as abandoned_sessions
from public.pilot_events
group by
  (received_at at time zone 'America/Lima')::date,
  coalesce(source_code, 'organic');

revoke all on table public.pilot_funnel_daily
  from anon, authenticated;
