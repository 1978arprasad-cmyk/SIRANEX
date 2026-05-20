-- ============================================================================
-- CFL COUNSELOR GPS MONITORING & CAMP VERIFICATION SYSTEM
-- Khammam District, Telangana, India
-- Lead District Manager (LDM) Monitoring 6 CFL Centres
-- ============================================================================
-- Run AFTER the main schema.sql and rls.sql.
-- This adds all CFL-specific tables on top of the existing Prajadarbar schema.
-- ============================================================================

-- Required extensions
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- =============================================================================
-- 1. ENUMs — CFL Specific
-- =============================================================================

do $$ begin
  create type cfl_user_role as enum ('ldm', 'cfl_manager', 'counselor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type counselor_status as enum ('active', 'inactive', 'suspended', 'on_leave');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tracking_status as enum ('online', 'offline', 'idle', 'conducting_camp');
exception when duplicate_object then null; end $$;

do $$ begin
  create type camp_status as enum ('pending', 'verified', 'suspicious', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type alert_type as enum (
    'gps_offline', 'no_movement', 'missed_village', 'fake_location',
    'no_camp', 'app_not_opened', 'suspicious_photo', 'geofence_violation',
    'short_camp_duration', 'duplicate_photo', 'out_of_field_hours'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type alert_severity as enum ('info', 'warning', 'critical');
exception when duplicate_object then null; end $$;

do $$ begin
  create type geofence_event_type as enum ('checkin', 'checkout');
exception when duplicate_object then null; end $$;

do $$ begin
  create type assignment_status as enum ('pending', 'in_progress', 'completed', 'missed', 'rescheduled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type awareness_category as enum (
    'savings', 'credit', 'insurance', 'investment', 'digital_payments',
    'pension', 'government_schemes', 'financial_planning', 'debt_management', 'other'
  );
exception when duplicate_object then null; end $$;

-- =============================================================================
-- 2. CFL CENTRES  (6 centres in Khammam District)
-- =============================================================================

create table if not exists cfl_centres (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null,           -- CFL-KMM-01 etc.
  name            text not null,
  mandal          text not null,
  district        text not null default 'Khammam',
  state           text not null default 'Telangana',
  address         text,
  centre_lat      numeric(9,6) not null,
  centre_lng      numeric(9,6) not null,
  manager_name    text,
  manager_mobile  text,
  bank_linkage    text,                           -- sponsoring bank
  is_active       boolean default true,
  established_on  date,
  created_at      timestamptz default now()
);

-- =============================================================================
-- 3. CFL PROFILES  (extends core profiles — LDM + Counselors)
-- =============================================================================

create table if not exists cfl_profiles (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid unique,                    -- maps to Supabase auth.users
  employee_id     text unique not null,
  full_name       text not null,
  mobile          text not null unique,
  email           text,
  role            cfl_user_role not null default 'counselor',
  cfl_centre_id   uuid references cfl_centres(id) on delete set null,
  designation     text,
  joining_date    date,
  status          counselor_status default 'active',
  -- Device binding for anti-spoofing
  bound_device_id text,
  bound_device_model text,
  device_bound_at timestamptz,
  -- Field hours config
  field_start_hour integer default 8,             -- 8 AM
  field_end_hour   integer default 18,            -- 6 PM
  -- WhatsApp / alert preferences
  whatsapp_number text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists idx_cfl_profiles_role   on cfl_profiles(role);
create index if not exists idx_cfl_profiles_centre on cfl_profiles(cfl_centre_id);
create index if not exists idx_cfl_profiles_mobile on cfl_profiles(mobile);

-- =============================================================================
-- 4. VILLAGES  (pre-defined villages with geo-fencing config)
-- =============================================================================

create table if not exists cfl_villages (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  name_te           text,
  mandal            text not null,
  cfl_centre_id     uuid not null references cfl_centres(id) on delete cascade,
  lat               numeric(9,6) not null,
  lng               numeric(9,6) not null,
  geofence_radius_m integer not null default 300,  -- metres
  population        integer,
  households        integer,
  priority          integer default 2,             -- 1=high 2=medium 3=low
  target_camps_monthly integer default 2,
  is_active         boolean default true,
  created_at        timestamptz default now()
);

create index if not exists idx_cfl_villages_centre on cfl_villages(cfl_centre_id);
create index if not exists idx_cfl_villages_mandal on cfl_villages(mandal);

-- =============================================================================
-- 5. ASSIGNMENTS  (LDM assigns villages to counselors)
-- =============================================================================

create table if not exists cfl_assignments (
  id                uuid primary key default gen_random_uuid(),
  counselor_id      uuid not null references cfl_profiles(id) on delete cascade,
  village_id        uuid not null references cfl_villages(id) on delete cascade,
  scheduled_date    date not null,
  camp_topic        text,
  awareness_category awareness_category default 'other',
  target_participants integer default 20,
  special_instructions text,
  status            assignment_status default 'pending',
  created_by        uuid references cfl_profiles(id),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),
  -- Completion tracking
  completed_at      timestamptz,
  actual_participants integer,
  completion_notes  text
);

create index if not exists idx_cfl_assign_counselor on cfl_assignments(counselor_id, scheduled_date);
create index if not exists idx_cfl_assign_village   on cfl_assignments(village_id);
create index if not exists idx_cfl_assign_status    on cfl_assignments(status);
create index if not exists idx_cfl_assign_date      on cfl_assignments(scheduled_date);

-- =============================================================================
-- 6. GPS TRACKING  (continuous location records)
-- =============================================================================

create table if not exists cfl_gps_tracking (
  id                   uuid primary key default gen_random_uuid(),
  counselor_id         uuid not null references cfl_profiles(id) on delete cascade,
  lat                  numeric(9,6) not null,
  lng                  numeric(9,6) not null,
  accuracy_m           numeric(6,2),              -- GPS accuracy in metres
  altitude_m           numeric(8,2),
  speed_kmh            numeric(6,2),
  heading_deg          numeric(5,2),
  is_moving            boolean default false,
  -- Anti-spoofing flags
  mock_location        boolean default false,
  mock_reason          text,
  battery_pct          integer,
  network_type         text,                      -- wifi/4g/3g/offline
  -- Timestamps
  device_ts            timestamptz not null,      -- device local time
  server_ts            timestamptz default now(), -- server receive time
  synced_from_offline  boolean default false,
  -- Current context
  current_village_id   uuid references cfl_villages(id),
  inside_geofence      boolean default false,
  device_id            text,
  app_version          text
);

create index if not exists idx_gps_counselor_ts on cfl_gps_tracking(counselor_id, device_ts desc);
create index if not exists idx_gps_ts           on cfl_gps_tracking(device_ts desc);
create index if not exists idx_gps_mock         on cfl_gps_tracking(mock_location) where mock_location = true;

-- Partition hint: for large deployments, partition by month
-- create index if not exists idx_gps_counselor_date on cfl_gps_tracking(counselor_id, (device_ts::date));

-- =============================================================================
-- 7. GEOFENCE EVENTS  (auto check-in / check-out)
-- =============================================================================

create table if not exists cfl_geofence_events (
  id                uuid primary key default gen_random_uuid(),
  counselor_id      uuid not null references cfl_profiles(id) on delete cascade,
  village_id        uuid not null references cfl_villages(id) on delete cascade,
  assignment_id     uuid references cfl_assignments(id) on delete set null,
  event_type        geofence_event_type not null,
  lat               numeric(9,6) not null,
  lng               numeric(9,6) not null,
  accuracy_m        numeric(6,2),
  distance_from_centre_m numeric(8,2),
  device_ts         timestamptz not null,
  server_ts         timestamptz default now(),
  -- Calculated at checkout
  duration_minutes  integer,
  is_valid          boolean default true,         -- false if stayed < min threshold
  validity_reason   text,
  created_at        timestamptz default now()
);

create index if not exists idx_geofence_counselor on cfl_geofence_events(counselor_id, device_ts desc);
create index if not exists idx_geofence_village   on cfl_geofence_events(village_id);
create index if not exists idx_geofence_assign    on cfl_geofence_events(assignment_id);

-- =============================================================================
-- 8. CAMP REPORTS  (core camp verification)
-- =============================================================================

create table if not exists cfl_camp_reports (
  id                  uuid primary key default gen_random_uuid(),
  report_number       text unique,               -- CFL-KMM-2024-00001
  counselor_id        uuid not null references cfl_profiles(id) on delete cascade,
  village_id          uuid not null references cfl_villages(id) on delete cascade,
  assignment_id       uuid references cfl_assignments(id) on delete set null,
  geofence_checkin_id uuid references cfl_geofence_events(id),
  -- Camp details
  camp_date           date not null,
  start_time          time not null,
  end_time            time,
  duration_minutes    integer,                   -- calculated
  topic               text not null,
  awareness_category  awareness_category default 'other',
  participant_count   integer not null default 0,
  male_count          integer default 0,
  female_count        integer default 0,
  remarks             text,
  -- GPS at time of reporting
  report_lat          numeric(9,6),
  report_lng          numeric(9,6),
  report_accuracy_m   numeric(6,2),
  distance_from_village_m numeric(8,2),
  -- Verification
  status              camp_status default 'pending',
  verification_notes  text,
  verified_by         uuid references cfl_profiles(id),
  verified_at         timestamptz,
  -- Anti-fake flags
  gps_location_match  boolean,                   -- reported from village location?
  geofence_verified   boolean default false,     -- did geofence confirm visit?
  min_duration_met    boolean,                   -- stayed enough time?
  photos_valid        boolean,
  suspicious_flags    jsonb default '[]',
  -- Metadata
  submitted_at        timestamptz default now(),
  updated_at          timestamptz default now()
);

create index if not exists idx_camp_counselor on cfl_camp_reports(counselor_id, camp_date desc);
create index if not exists idx_camp_village   on cfl_camp_reports(village_id);
create index if not exists idx_camp_status    on cfl_camp_reports(status);
create index if not exists idx_camp_date      on cfl_camp_reports(camp_date desc);

create sequence if not exists cfl_report_seq start 1;

create or replace function generate_camp_report_number() returns trigger as $$
begin
  if new.report_number is null then
    new.report_number := 'CFL-KMM-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('cfl_report_seq')::text, 5, '0');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_camp_report_number on cfl_camp_reports;
create trigger trg_camp_report_number
  before insert on cfl_camp_reports
  for each row execute function generate_camp_report_number();

-- =============================================================================
-- 9. CAMP PHOTOS  (geo-tagged, live-only capture)
-- =============================================================================

create table if not exists cfl_camp_photos (
  id                  uuid primary key default gen_random_uuid(),
  report_id           uuid not null references cfl_camp_reports(id) on delete cascade,
  counselor_id        uuid not null references cfl_profiles(id) on delete cascade,
  photo_url           text not null,
  photo_hash          text,                      -- SHA-256 for duplicate detection
  perceptual_hash     text,                      -- pHash for near-duplicate detection
  -- Geo-tag at capture
  capture_lat         numeric(9,6),
  capture_lng         numeric(9,6),
  capture_accuracy_m  numeric(6,2),
  captured_at         timestamptz not null,      -- from device clock
  server_received_at  timestamptz default now(),
  -- Validation
  is_live_capture     boolean default true,      -- false if from gallery
  is_duplicate        boolean default false,
  duplicate_of        uuid references cfl_camp_photos(id),
  location_matches_camp boolean,
  ai_face_count       integer,                   -- estimated participants visible
  file_size_bytes     integer,
  mime_type           text default 'image/jpeg',
  -- Flags
  flagged             boolean default false,
  flag_reason         text
);

create index if not exists idx_photos_report    on cfl_camp_photos(report_id);
create index if not exists idx_photos_counselor on cfl_camp_photos(counselor_id);
create index if not exists idx_photos_hash      on cfl_camp_photos(photo_hash);
create index if not exists idx_photos_phash     on cfl_camp_photos(perceptual_hash);

-- =============================================================================
-- 10. DAILY SUMMARIES  (auto-calculated per counselor per day)
-- =============================================================================

create table if not exists cfl_daily_summaries (
  id                    uuid primary key default gen_random_uuid(),
  counselor_id          uuid not null references cfl_profiles(id) on delete cascade,
  summary_date          date not null,
  -- Movement
  total_km              numeric(8,2) default 0,
  villages_visited      integer default 0,
  villages_assigned     integer default 0,
  -- Time
  first_ping_ts         timestamptz,
  last_ping_ts          timestamptz,
  working_hours         numeric(4,2) default 0,
  field_hours           numeric(4,2) default 0,
  idle_hours            numeric(4,2) default 0,
  -- Camps
  camps_conducted       integer default 0,
  total_participants    integer default 0,
  avg_camp_duration_min integer,
  -- GPS compliance
  gps_pings_expected    integer,
  gps_pings_received    integer,
  gps_compliance_pct    numeric(5,2),
  mock_location_events  integer default 0,
  gps_offline_events    integer default 0,
  -- Scores (0-100)
  field_score           integer,
  camp_score            integer,
  compliance_score      integer,
  daily_score           integer,
  -- Computed at
  computed_at           timestamptz default now(),
  unique (counselor_id, summary_date)
);

create index if not exists idx_daily_counselor_date on cfl_daily_summaries(counselor_id, summary_date desc);

-- =============================================================================
-- 11. ALERTS
-- =============================================================================

create table if not exists cfl_alerts (
  id                uuid primary key default gen_random_uuid(),
  counselor_id      uuid not null references cfl_profiles(id) on delete cascade,
  alert_type        alert_type not null,
  severity          alert_severity default 'warning',
  title             text not null,
  message           text not null,
  context_data      jsonb,                       -- extra structured info
  -- Delivery
  sent_to_ldm       boolean default false,
  sent_via_whatsapp boolean default false,
  sent_via_sms      boolean default false,
  sent_via_email    boolean default false,
  -- Lifecycle
  acknowledged      boolean default false,
  acknowledged_by   uuid references cfl_profiles(id),
  acknowledged_at   timestamptz,
  auto_resolved     boolean default false,
  created_at        timestamptz default now()
);

create index if not exists idx_alerts_counselor on cfl_alerts(counselor_id, created_at desc);
create index if not exists idx_alerts_type      on cfl_alerts(alert_type);
create index if not exists idx_alerts_ack       on cfl_alerts(acknowledged) where acknowledged = false;
create index if not exists idx_alerts_severity  on cfl_alerts(severity);

-- =============================================================================
-- 12. PERFORMANCE SCORES  (monthly)
-- =============================================================================

create table if not exists cfl_performance_scores (
  id                        uuid primary key default gen_random_uuid(),
  counselor_id              uuid not null references cfl_profiles(id) on delete cascade,
  score_year                integer not null,
  score_month               integer not null check (score_month between 1 and 12),
  -- Component scores (each 0-100)
  village_visit_score       numeric(5,2) default 0,  -- villages visited vs assigned
  gps_compliance_score      numeric(5,2) default 0,  -- GPS uptime
  camp_quality_score        numeric(5,2) default 0,  -- duration, participants
  travel_coverage_score     numeric(5,2) default 0,  -- km covered
  reporting_score           numeric(5,2) default 0,  -- timeliness, accuracy
  participant_reach_score   numeric(5,2) default 0,  -- people reached
  -- Weighted total
  total_score               numeric(5,2) default 0,
  performance_grade         text,                    -- A/B/C/D/F
  district_rank             integer,
  centre_rank               integer,
  -- Actuals
  villages_assigned         integer default 0,
  villages_visited          integer default 0,
  camps_conducted           integer default 0,
  total_participants        integer default 0,
  total_km_traveled         numeric(8,2) default 0,
  avg_gps_compliance        numeric(5,2) default 0,
  -- Meta
  computed_at               timestamptz default now(),
  unique (counselor_id, score_year, score_month)
);

create index if not exists idx_perf_counselor  on cfl_performance_scores(counselor_id);
create index if not exists idx_perf_year_month on cfl_performance_scores(score_year, score_month);

-- =============================================================================
-- 13. LIVE COUNSELOR STATUS  (materialised view for fast dashboard queries)
-- =============================================================================

create table if not exists cfl_counselor_live_status (
  counselor_id       uuid primary key references cfl_profiles(id) on delete cascade,
  last_lat           numeric(9,6),
  last_lng           numeric(9,6),
  last_accuracy_m    numeric(6,2),
  last_ping_at       timestamptz,
  tracking_status    tracking_status default 'offline',
  current_village_id uuid references cfl_villages(id),
  current_village    text,
  speed_kmh          numeric(6,2),
  today_km           numeric(8,2) default 0,
  today_villages     integer default 0,
  today_camps        integer default 0,
  battery_pct        integer,
  network_type       text,
  mock_detected      boolean default false,
  updated_at         timestamptz default now()
);

-- =============================================================================
-- 14. FUNCTIONS & TRIGGERS
-- =============================================================================

-- Haversine distance function (returns metres)
create or replace function haversine_m(lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric)
returns numeric as $$
declare
  r  constant numeric := 6371000.0;
  d_lat numeric;
  d_lng numeric;
  a  numeric;
begin
  d_lat := radians(lat2 - lat1);
  d_lng := radians(lng2 - lng1);
  a := sin(d_lat/2)^2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lng/2)^2;
  return r * 2 * asin(sqrt(a));
end;
$$ language plpgsql immutable;

-- Auto-update daily summary when new GPS ping arrives
create or replace function upsert_live_status() returns trigger as $$
begin
  insert into cfl_counselor_live_status
    (counselor_id, last_lat, last_lng, last_accuracy_m, last_ping_at,
     tracking_status, current_village_id, speed_kmh, battery_pct, network_type,
     mock_detected, updated_at)
  values (
    new.counselor_id, new.lat, new.lng, new.accuracy_m, new.device_ts,
    case
      when new.inside_geofence then 'conducting_camp'::tracking_status
      when new.is_moving then 'online'::tracking_status
      else 'idle'::tracking_status
    end,
    new.current_village_id,
    new.speed_kmh, new.battery_pct, new.network_type,
    new.mock_location, now()
  )
  on conflict (counselor_id) do update set
    last_lat           = excluded.last_lat,
    last_lng           = excluded.last_lng,
    last_accuracy_m    = excluded.last_accuracy_m,
    last_ping_at       = excluded.last_ping_at,
    tracking_status    = excluded.tracking_status,
    current_village_id = excluded.current_village_id,
    speed_kmh          = excluded.speed_kmh,
    battery_pct        = excluded.battery_pct,
    network_type       = excluded.network_type,
    mock_detected      = excluded.mock_detected,
    updated_at         = excluded.updated_at;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_upsert_live_status on cfl_gps_tracking;
create trigger trg_upsert_live_status
  after insert on cfl_gps_tracking
  for each row execute function upsert_live_status();

-- Auto-calculate geofence duration at checkout
create or replace function calc_geofence_duration() returns trigger as $$
declare
  checkin_ts timestamptz;
  min_duration integer := 20;   -- minimum valid camp = 20 minutes
begin
  if new.event_type = 'checkout' then
    select device_ts into checkin_ts
    from cfl_geofence_events
    where counselor_id = new.counselor_id
      and village_id   = new.village_id
      and event_type   = 'checkin'
    order by device_ts desc
    limit 1;

    if checkin_ts is not null then
      new.duration_minutes := extract(epoch from (new.device_ts - checkin_ts)) / 60;
      new.is_valid := new.duration_minutes >= min_duration;
      if not new.is_valid then
        new.validity_reason := 'Stayed only ' || new.duration_minutes || ' minutes (minimum ' || min_duration || ')';
      end if;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_geofence_duration on cfl_geofence_events;
create trigger trg_geofence_duration
  before insert on cfl_geofence_events
  for each row execute function calc_geofence_duration();

-- Auto-calculate camp duration
create or replace function calc_camp_duration() returns trigger as $$
begin
  if new.start_time is not null and new.end_time is not null then
    new.duration_minutes := extract(epoch from (new.end_time::interval - new.start_time::interval)) / 60;
    new.min_duration_met  := new.duration_minutes >= 30;
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_camp_duration on cfl_camp_reports;
create trigger trg_camp_duration
  before insert or update on cfl_camp_reports
  for each row execute function calc_camp_duration();

-- =============================================================================
-- 15. VIEWS  (dashboard queries)
-- =============================================================================

create or replace view v_cfl_counselor_today as
select
  p.id                  as counselor_id,
  p.full_name,
  p.mobile,
  p.employee_id,
  c.name                as centre_name,
  c.code                as centre_code,
  ls.last_lat,
  ls.last_lng,
  ls.last_ping_at,
  ls.tracking_status,
  ls.current_village,
  ls.speed_kmh,
  ls.today_km,
  ls.today_villages,
  ls.today_camps,
  ls.battery_pct,
  ls.mock_detected,
  ls.updated_at,
  -- Minutes since last ping
  extract(epoch from (now() - ls.last_ping_at)) / 60 as mins_since_ping,
  -- Active alerts
  (select count(*) from cfl_alerts a
   where a.counselor_id = p.id and not a.acknowledged and a.created_at > now() - interval '24 hours'
  ) as active_alerts
from cfl_profiles p
join cfl_centres c on c.id = p.cfl_centre_id
left join cfl_counselor_live_status ls on ls.counselor_id = p.id
where p.role = 'counselor' and p.status = 'active'
order by ls.last_ping_at desc nulls last;

create or replace view v_cfl_district_kpis as
select
  (select count(*) from cfl_profiles where role = 'counselor' and status = 'active') as total_counselors,
  (select count(*) from cfl_counselor_live_status where tracking_status in ('online','conducting_camp')
     and last_ping_at > now() - interval '10 minutes') as active_now,
  (select count(*) from cfl_counselor_live_status where tracking_status = 'conducting_camp'
     and last_ping_at > now() - interval '10 minutes') as conducting_camp,
  (select count(*) from cfl_counselor_live_status where last_ping_at < now() - interval '30 minutes'
     or last_ping_at is null) as offline_counselors,
  (select count(*) from cfl_camp_reports where camp_date = current_date) as camps_today,
  (select coalesce(sum(participant_count),0) from cfl_camp_reports where camp_date = current_date) as participants_today,
  (select count(*) from cfl_alerts where not acknowledged and created_at > now() - interval '24 hours') as active_alerts,
  (select count(*) from cfl_villages where is_active) as total_villages,
  (select count(distinct village_id) from cfl_geofence_events where device_ts::date = current_date) as villages_visited_today;

-- =============================================================================
-- 16. MONTHLY SCORE COMPUTATION FUNCTION
-- =============================================================================

create or replace function compute_monthly_scores(p_year integer, p_month integer)
returns void as $$
declare
  rec record;
  days_in_month integer;
  v_visit_score numeric;
  v_gps_score   numeric;
  v_camp_score  numeric;
  v_travel_score numeric;
  v_report_score numeric;
  v_reach_score  numeric;
  v_total        numeric;
  v_grade        text;
  v_rank         integer := 0;
begin
  days_in_month := extract(day from (date_trunc('month', make_date(p_year, p_month, 1)) + interval '1 month - 1 day'));

  for rec in
    select p.id as counselor_id,
           count(distinct a.village_id) filter (where a.status = 'completed') as visited,
           count(distinct a.id) as assigned,
           count(distinct cr.id) as camps,
           coalesce(sum(cr.participant_count),0) as participants,
           coalesce(sum(ds.total_km),0) as total_km,
           coalesce(avg(ds.gps_compliance_pct),0) as avg_gps
    from cfl_profiles p
    left join cfl_assignments a  on a.counselor_id = p.id
                                 and extract(year from a.scheduled_date) = p_year
                                 and extract(month from a.scheduled_date) = p_month
    left join cfl_camp_reports cr on cr.counselor_id = p.id
                                 and extract(year from cr.camp_date) = p_year
                                 and extract(month from cr.camp_date) = p_month
                                 and cr.status != 'rejected'
    left join cfl_daily_summaries ds on ds.counselor_id = p.id
                                    and extract(year from ds.summary_date) = p_year
                                    and extract(month from ds.summary_date) = p_month
    where p.role = 'counselor' and p.status = 'active'
    group by p.id
  loop
    v_visit_score  := case when rec.assigned > 0 then least(100, 100.0 * rec.visited / rec.assigned) else 0 end;
    v_gps_score    := least(100, rec.avg_gps);
    v_camp_score   := least(100, 5.0 * rec.camps);  -- 20 camps = 100
    v_travel_score := least(100, rec.total_km / 5.0);  -- 500km = 100
    v_report_score := least(100, 100.0 * rec.camps / greatest(days_in_month * 0.7, 1)); -- reporting discipline
    v_reach_score  := least(100, rec.participants / 5.0);  -- 500 participants = 100

    v_total := 0.25 * v_visit_score + 0.20 * v_gps_score + 0.20 * v_camp_score
             + 0.15 * v_travel_score + 0.10 * v_report_score + 0.10 * v_reach_score;

    v_grade := case
      when v_total >= 90 then 'A+'
      when v_total >= 80 then 'A'
      when v_total >= 70 then 'B'
      when v_total >= 60 then 'C'
      when v_total >= 50 then 'D'
      else 'F'
    end;

    insert into cfl_performance_scores (
      counselor_id, score_year, score_month,
      village_visit_score, gps_compliance_score, camp_quality_score,
      travel_coverage_score, reporting_score, participant_reach_score,
      total_score, performance_grade,
      villages_assigned, villages_visited, camps_conducted, total_participants,
      total_km_traveled, avg_gps_compliance, computed_at
    ) values (
      rec.counselor_id, p_year, p_month,
      v_visit_score, v_gps_score, v_camp_score,
      v_travel_score, v_report_score, v_reach_score,
      v_total, v_grade,
      rec.assigned, rec.visited, rec.camps, rec.participants,
      rec.total_km, rec.avg_gps, now()
    )
    on conflict (counselor_id, score_year, score_month) do update set
      village_visit_score    = excluded.village_visit_score,
      gps_compliance_score   = excluded.gps_compliance_score,
      camp_quality_score     = excluded.camp_quality_score,
      travel_coverage_score  = excluded.travel_coverage_score,
      reporting_score        = excluded.reporting_score,
      participant_reach_score= excluded.participant_reach_score,
      total_score            = excluded.total_score,
      performance_grade      = excluded.performance_grade,
      villages_assigned      = excluded.villages_assigned,
      villages_visited       = excluded.villages_visited,
      camps_conducted        = excluded.camps_conducted,
      total_participants     = excluded.total_participants,
      total_km_traveled      = excluded.total_km_traveled,
      avg_gps_compliance     = excluded.avg_gps_compliance,
      computed_at            = excluded.computed_at;
  end loop;

  -- Update district rank
  update cfl_performance_scores ps
  set district_rank = sub.rn
  from (
    select id, row_number() over (order by total_score desc) as rn
    from cfl_performance_scores
    where score_year = p_year and score_month = p_month
  ) sub
  where ps.id = sub.id;
end;
$$ language plpgsql;

-- =============================================================================
-- 17. REALTIME PUBLICATION
-- =============================================================================

do $$ begin
  perform 1 from pg_publication where pubname = 'supabase_realtime';
  if found then
    execute 'alter publication supabase_realtime add table cfl_gps_tracking';
    execute 'alter publication supabase_realtime add table cfl_counselor_live_status';
    execute 'alter publication supabase_realtime add table cfl_alerts';
    execute 'alter publication supabase_realtime add table cfl_geofence_events';
    execute 'alter publication supabase_realtime add table cfl_camp_reports';
  end if;
exception when others then null; end $$;

-- =============================================================================
-- 18. ROW LEVEL SECURITY
-- =============================================================================

alter table cfl_profiles            enable row level security;
alter table cfl_gps_tracking        enable row level security;
alter table cfl_geofence_events     enable row level security;
alter table cfl_camp_reports        enable row level security;
alter table cfl_camp_photos         enable row level security;
alter table cfl_alerts              enable row level security;
alter table cfl_assignments         enable row level security;

-- Counselor can read/write their own data
create policy cfl_gps_own_insert  on cfl_gps_tracking   for insert with check (true);
create policy cfl_gps_own_select  on cfl_gps_tracking   for select using (true);
create policy cfl_camp_own_insert on cfl_camp_reports   for insert with check (true);
create policy cfl_camp_own_select on cfl_camp_reports   for select using (true);
create policy cfl_photo_insert    on cfl_camp_photos    for insert with check (true);
create policy cfl_photo_select    on cfl_camp_photos    for select using (true);
create policy cfl_profile_select  on cfl_profiles       for select using (true);
create policy cfl_assign_select   on cfl_assignments    for select using (true);
create policy cfl_gf_insert       on cfl_geofence_events for insert with check (true);
create policy cfl_gf_select       on cfl_geofence_events for select using (true);
create policy cfl_alert_select    on cfl_alerts         for select using (true);
create policy cfl_alert_update    on cfl_alerts         for update using (true);
