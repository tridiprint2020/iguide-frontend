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
where coalesce(source_code, 'organic') not like 'test-%'
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
where coalesce(source_code, 'organic') not like 'test-%'
group by
  (received_at at time zone 'America/Lima')::date,
  coalesce(source_code, 'organic');

revoke all on table public.pilot_funnel_daily
  from anon, authenticated;
