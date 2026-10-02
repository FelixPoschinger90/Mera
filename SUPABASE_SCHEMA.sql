-- MERA study-session storage
-- One database row contains the complete, unedited study record for one session.

create table if not exists public.mera_sessions (
  session_id uuid primary key,
  study_version text not null,
  schema_version integer not null,
  counterbalance_condition integer not null check (counterbalance_condition between 1 and 6),
  completed_at timestamptz not null,
  received_at timestamptz not null default now(),
  payload jsonb not null
);

alter table public.mera_sessions enable row level security;

revoke all on table public.mera_sessions from anon, authenticated;
grant insert on table public.mera_sessions to anon;

drop policy if exists "MERA anonymous insert only" on public.mera_sessions;
create policy "MERA anonymous insert only"
on public.mera_sessions
for insert
to anon
with check (
  payload->>'sessionId' = session_id::text
  and payload->>'build' = study_version
  and (payload->>'schemaVersion')::integer = schema_version
  and payload->'consent'->>'accepted' = 'true'
  and counterbalance_condition between 1 and 6
);

comment on table public.mera_sessions is
'MERA study records. Public study clients have INSERT permission only; SELECT, UPDATE and DELETE are not granted.';
