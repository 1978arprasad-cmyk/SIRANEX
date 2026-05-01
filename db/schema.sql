-- ============================================================================
-- PRAJADARBAR (ప్రజాదర్బార్) — Grievance Redressal & Monitoring System
-- Khammam District Administration, Telangana, India
-- ============================================================================
-- This file creates all tables, enums, triggers and indexes.
-- Run this in the Supabase SQL editor (or psql) FIRST, then run rls.sql,
-- then seed.sql.
-- ============================================================================

-- Required extensions ---------------------------------------------------------
create extension if not exists "pgcrypto";

-- =============================================================================
-- 1. ENUMs
-- =============================================================================
do $$ begin
  create type grievance_status as enum (
    'registered', 'acknowledged', 'assigned', 'in_progress',
    'field_verified', 'resolved', 'closed', 'rejected', 'reopened', 'escalated'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role as enum (
    'citizen', 'officer', 'hod', 'collector', 'field_officer', 'admin'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type severity_level as enum ('low', 'medium', 'high', 'critical');
exception when duplicate_object then null; end $$;

do $$ begin
  create type lang_code as enum ('en', 'te');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notif_channel as enum ('sms', 'whatsapp', 'email', 'in_app');
exception when duplicate_object then null; end $$;

-- =============================================================================
-- 2. Reference tables (geography + departments)
-- =============================================================================
create table if not exists mandals (
  id           uuid primary key default gen_random_uuid(),
  code         text unique not null,
  name_en      text not null,
  name_te      text,
  district     text not null default 'Khammam',
  state        text not null default 'Telangana',
  constituency text,
  centroid_lat numeric(9,6),
  centroid_lng numeric(9,6),
  population   integer,
  created_at   timestamptz default now()
);

create table if not exists panchayats (
  id           uuid primary key default gen_random_uuid(),
  mandal_id    uuid not null references mandals(id) on delete cascade,
  name_en      text not null,
  name_te      text,
  ptype        text default 'panchayat',
  centroid_lat numeric(9,6),
  centroid_lng numeric(9,6),
  created_at   timestamptz default now(),
  unique (mandal_id, name_en)
);

create table if not exists departments (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null,
  name_en         text not null,
  name_te         text,
  icon            text,
  description_en  text,
  description_te  text,
  default_sla_days integer not null default 90,
  is_active       boolean default true
);

create table if not exists subjects (
  id            uuid primary key default gen_random_uuid(),
  department_id uuid not null references departments(id) on delete cascade,
  name_en       text not null,
  name_te       text,
  sla_days      integer not null default 90,
  unique (department_id, name_en)
);

-- =============================================================================
-- 3. Profiles  (linked 1:1 to auth.users)
-- =============================================================================
create table if not exists profiles (
  id            uuid primary key,        -- mirrors auth.users.id
  full_name     text not null,
  mobile        text,
  email         text,
  aadhaar_last4 text,
  role          user_role not null default 'citizen',
  language      lang_code not null default 'te',
  department_id uuid references departments(id),
  mandal_id     uuid references mandals(id),
  designation   text,
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_profiles_dept on profiles(department_id);
create index if not exists idx_profiles_mandal on profiles(mandal_id);

-- =============================================================================
-- 4. Grievances
-- =============================================================================
create table if not exists grievances (
  id                       uuid primary key default gen_random_uuid(),
  grievance_id             text unique not null,    -- PJD-KMM-YYYY-NNNNN
  -- Applicant
  applicant_name           text not null,
  guardian_name            text,
  gender                   text,
  mobile                   text not null,
  aadhaar_last4            text,
  language                 lang_code default 'te',
  -- Location
  mandal_id                uuid references mandals(id),
  panchayat_id             uuid references panchayats(id),
  village_address          text,
  gps_lat                  numeric(9,6),
  gps_lng                  numeric(9,6),
  -- Classification
  department_id            uuid not null references departments(id),
  subject_id               uuid references subjects(id),
  description              text not null,
  severity                 severity_level default 'medium',
  source                   text default 'web',
  -- Workflow
  status                   grievance_status not null default 'registered',
  assigned_to              uuid references profiles(id),
  forwarded_to             text,
  expected_resolution_date date,
  sla_days                 integer not null default 90,
  -- Audit / lifecycle timestamps
  created_by               uuid references profiles(id),
  created_at               timestamptz default now(),
  updated_at               timestamptz default now(),
  acknowledged_at          timestamptz,
  assigned_at              timestamptz,
  field_verified_at        timestamptz,
  resolved_at              timestamptz,
  closed_at                timestamptz,
  -- Citizen feedback
  citizen_rating           integer check (citizen_rating between 1 and 5),
  citizen_feedback         text,
  reopen_count             integer default 0
);

create index if not exists idx_griev_status   on grievances(status);
create index if not exists idx_griev_dept     on grievances(department_id);
create index if not exists idx_griev_mandal   on grievances(mandal_id);
create index if not exists idx_griev_created  on grievances(created_at desc);
create index if not exists idx_griev_mobile   on grievances(mobile);
create index if not exists idx_griev_gid      on grievances(grievance_id);
create index if not exists idx_griev_assigned on grievances(assigned_to);

-- =============================================================================
-- 5. History / audit log
-- =============================================================================
create table if not exists grievance_history (
  id              uuid primary key default gen_random_uuid(),
  grievance_id    uuid not null references grievances(id) on delete cascade,
  from_status     grievance_status,
  to_status       grievance_status not null,
  remarks         text,
  actor_id        uuid references profiles(id),
  actor_name      text,
  actor_role      user_role,
  gps_lat         numeric(9,6),
  gps_lng         numeric(9,6),
  created_at      timestamptz default now()
);

create index if not exists idx_history_griev on grievance_history(grievance_id, created_at desc);

-- =============================================================================
-- 6. Attachments
-- =============================================================================
create table if not exists grievance_attachments (
  id               uuid primary key default gen_random_uuid(),
  grievance_id     uuid not null references grievances(id) on delete cascade,
  history_id       uuid references grievance_history(id) on delete set null,
  file_url         text not null,
  file_name        text,
  file_type        text,
  attachment_type  text default 'citizen_proof',  -- citizen_proof | action_taken_photo | document
  uploaded_by      uuid references profiles(id),
  gps_lat          numeric(9,6),
  gps_lng          numeric(9,6),
  created_at       timestamptz default now()
);

create index if not exists idx_attach_griev on grievance_attachments(grievance_id);

-- =============================================================================
-- 7. Notifications queue (SMS, WhatsApp, email, in-app)
-- =============================================================================
create table if not exists notifications (
  id                 uuid primary key default gen_random_uuid(),
  recipient_user_id  uuid references profiles(id),
  recipient_mobile   text,
  recipient_email    text,
  channel            notif_channel not null,
  title              text,
  body               text not null,
  payload            jsonb,
  grievance_id       uuid references grievances(id) on delete cascade,
  status             text default 'pending',
  delivered_at       timestamptz,
  read_at            timestamptz,
  created_at         timestamptz default now()
);

create index if not exists idx_notif_user      on notifications(recipient_user_id);
create index if not exists idx_notif_griev     on notifications(grievance_id);
create index if not exists idx_notif_status    on notifications(status);

-- =============================================================================
-- 8. Sequence + ID generator
-- =============================================================================
create sequence if not exists grievance_seq start 1;

create or replace function generate_grievance_id() returns trigger as $$
declare
  yr text;
  seq_val bigint;
begin
  if new.grievance_id is null or new.grievance_id = '' then
    yr := to_char(coalesce(new.created_at, now()), 'YYYY');
    seq_val := nextval('grievance_seq');
    new.grievance_id := 'PJD-KMM-' || yr || '-' || lpad(seq_val::text, 5, '0');
  end if;

  -- Default expected resolution date based on SLA
  if new.expected_resolution_date is null then
    new.expected_resolution_date := (coalesce(new.created_at, now()))::date + new.sla_days;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_generate_grievance_id on grievances;
create trigger trg_generate_grievance_id
  before insert on grievances
  for each row execute function generate_grievance_id();

-- =============================================================================
-- 9. Auto-history on status change + lifecycle timestamps
-- =============================================================================
create or replace function grievance_on_update() returns trigger as $$
begin
  new.updated_at := now();

  if (tg_op = 'UPDATE' and old.status is distinct from new.status) then
    -- lifecycle timestamps
    if new.status = 'acknowledged'   and new.acknowledged_at   is null then new.acknowledged_at   := now(); end if;
    if new.status = 'assigned'       and new.assigned_at       is null then new.assigned_at       := now(); end if;
    if new.status = 'field_verified' and new.field_verified_at is null then new.field_verified_at := now(); end if;
    if new.status = 'resolved'       and new.resolved_at       is null then new.resolved_at       := now(); end if;
    if new.status = 'closed'         and new.closed_at         is null then new.closed_at         := now(); end if;

    insert into grievance_history(grievance_id, from_status, to_status, actor_id)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_grievance_on_update on grievances;
create trigger trg_grievance_on_update
  before update on grievances
  for each row execute function grievance_on_update();

-- Initial history entry on insert
create or replace function grievance_on_insert() returns trigger as $$
begin
  insert into grievance_history(grievance_id, from_status, to_status, remarks, actor_id, actor_name)
  values (new.id, null, new.status, 'Grievance registered', new.created_by, new.applicant_name);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_grievance_on_insert on grievances;
create trigger trg_grievance_on_insert
  after insert on grievances
  for each row execute function grievance_on_insert();

-- =============================================================================
-- 10. Auto-create profile when a new auth.user is created
-- =============================================================================
create or replace function handle_new_user() returns trigger as $$
begin
  insert into profiles (id, full_name, mobile, email, role, language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'mobile', new.phone),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'citizen'),
    coalesce((new.raw_user_meta_data->>'language')::lang_code, 'te')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =============================================================================
-- 11. Aggregate views for dashboards
-- =============================================================================
create or replace view v_grievance_kpis as
select
  count(*)                                                          as total,
  count(*) filter (where status = 'registered')                      as registered,
  count(*) filter (where status = 'acknowledged')                    as acknowledged,
  count(*) filter (where status = 'assigned')                        as assigned,
  count(*) filter (where status = 'in_progress')                     as in_progress,
  count(*) filter (where status = 'field_verified')                  as field_verified,
  count(*) filter (where status = 'resolved')                        as resolved,
  count(*) filter (where status = 'closed')                          as closed,
  count(*) filter (where status = 'rejected')                        as rejected,
  count(*) filter (where status = 'escalated')                       as escalated,
  count(*) filter (where status not in ('resolved','closed','rejected'))                                   as pending,
  count(*) filter (where status not in ('resolved','closed','rejected') and (now()::date - created_at::date) > sla_days) as overdue,
  count(*) filter (where status not in ('resolved','closed','rejected') and (now()::date - created_at::date) between 60 and 90) as red_zone,
  count(*) filter (where status not in ('resolved','closed','rejected') and (now()::date - created_at::date) between 30 and 59) as amber_zone,
  count(*) filter (where status not in ('resolved','closed','rejected') and (now()::date - created_at::date) < 30) as green_zone,
  round(
    100.0 * count(*) filter (where status in ('resolved','closed'))
        / nullif(count(*),0), 1
  ) as resolution_pct,
  round(
    avg(extract(epoch from (coalesce(resolved_at, now()) - created_at)) / 86400.0)
       filter (where status in ('resolved','closed'))::numeric, 1
  ) as avg_resolution_days
from grievances;

create or replace view v_dept_kpis as
select
  d.id                  as department_id,
  d.code                as department_code,
  d.name_en             as department_name_en,
  d.name_te             as department_name_te,
  count(g.*)            as total,
  count(g.*) filter (where g.status not in ('resolved','closed','rejected')) as pending,
  count(g.*) filter (where g.status in ('resolved','closed'))                 as resolved,
  count(g.*) filter (where g.status not in ('resolved','closed','rejected')
                     and (now()::date - g.created_at::date) > g.sla_days)     as overdue,
  round(avg(g.citizen_rating) filter (where g.citizen_rating is not null)::numeric, 2) as avg_rating
from departments d
left join grievances g on g.department_id = d.id
group by d.id, d.code, d.name_en, d.name_te
order by total desc;

create or replace view v_mandal_kpis as
select
  m.id                  as mandal_id,
  m.code                as mandal_code,
  m.name_en             as mandal_name_en,
  m.name_te             as mandal_name_te,
  m.centroid_lat        as lat,
  m.centroid_lng        as lng,
  count(g.*)            as total,
  count(g.*) filter (where g.status not in ('resolved','closed','rejected')) as pending,
  count(g.*) filter (where g.status in ('resolved','closed'))                 as resolved,
  count(g.*) filter (where g.status not in ('resolved','closed','rejected')
                     and (now()::date - g.created_at::date) > g.sla_days)     as overdue
from mandals m
left join grievances g on g.mandal_id = m.id
group by m.id, m.code, m.name_en, m.name_te, m.centroid_lat, m.centroid_lng
order by total desc;

-- =============================================================================
-- 12. Realtime publication (Supabase)
-- =============================================================================
do $$ begin
  perform 1 from pg_publication where pubname = 'supabase_realtime';
  if found then
    execute 'alter publication supabase_realtime add table grievances';
    execute 'alter publication supabase_realtime add table grievance_history';
    execute 'alter publication supabase_realtime add table grievance_attachments';
    execute 'alter publication supabase_realtime add table notifications';
  end if;
exception when others then null; end $$;
