-- ============================================================================
-- Row-Level Security policies for Prajadarbar
-- Run AFTER schema.sql.  Run BEFORE seed.sql so the seed inserts work as-is
-- (seed runs with service-role / SQL editor permissions which bypass RLS).
-- ============================================================================

-- Enable RLS ------------------------------------------------------------------
alter table profiles               enable row level security;
alter table mandals                enable row level security;
alter table panchayats             enable row level security;
alter table departments            enable row level security;
alter table subjects               enable row level security;
alter table grievances             enable row level security;
alter table grievance_history      enable row level security;
alter table grievance_attachments  enable row level security;
alter table notifications          enable row level security;

-- ----------------------------------------------------------------------------
-- Reference tables (everyone can read, only admins write)
-- ----------------------------------------------------------------------------
drop policy if exists "ref_read_mandals"     on mandals;
drop policy if exists "ref_read_panchayats"  on panchayats;
drop policy if exists "ref_read_departments" on departments;
drop policy if exists "ref_read_subjects"    on subjects;

create policy "ref_read_mandals"     on mandals     for select using (true);
create policy "ref_read_panchayats"  on panchayats  for select using (true);
create policy "ref_read_departments" on departments for select using (true);
create policy "ref_read_subjects"    on subjects    for select using (true);

-- ----------------------------------------------------------------------------
-- Profiles
--   * a user can read & update their own profile
--   * collectors / admins can read & update any profile
-- ----------------------------------------------------------------------------
drop policy if exists "profile_self_read"   on profiles;
drop policy if exists "profile_self_update" on profiles;
drop policy if exists "profile_admin_all"   on profiles;
drop policy if exists "profile_dept_read"   on profiles;

create policy "profile_self_read"
  on profiles for select
  using (auth.uid() = id);

create policy "profile_self_update"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profile_admin_all"
  on profiles for all
  using (
    exists (select 1 from profiles p
            where p.id = auth.uid()
              and p.role in ('collector','admin','hod'))
  )
  with check (true);

create policy "profile_dept_read"
  on profiles for select
  using (
    exists (select 1 from profiles me
            where me.id = auth.uid()
              and (me.role in ('collector','admin')
                   or me.department_id = profiles.department_id))
  );

-- ----------------------------------------------------------------------------
-- Grievances
--   * Anyone (anon citizen) can INSERT a new grievance
--   * Anyone can SELECT a grievance row (we hide aadhaar in views/ui).
--     For a stricter mode, replace the SELECT policy with an RPC that
--     requires mobile + grievance_id.
--   * UPDATE only by:
--       - the assigned officer or any officer in the same department
--       - the field officer of the same mandal
--       - the HoD of that department, the collector, or admin
-- ----------------------------------------------------------------------------
drop policy if exists "griev_insert_anyone"  on grievances;
drop policy if exists "griev_read_anyone"    on grievances;
drop policy if exists "griev_update_staff"   on grievances;

create policy "griev_insert_anyone"
  on grievances for insert
  with check (true);

create policy "griev_read_anyone"
  on grievances for select
  using (true);

create policy "griev_update_staff"
  on grievances for update
  using (
    exists (
      select 1 from profiles me
      where me.id = auth.uid()
        and (
          me.role in ('collector','admin')
          or (me.role = 'hod' and me.department_id = grievances.department_id)
          or (me.role = 'officer'
              and (me.department_id = grievances.department_id
                   or grievances.assigned_to = me.id))
          or (me.role = 'field_officer'
              and (me.mandal_id = grievances.mandal_id
                   or grievances.assigned_to = me.id))
        )
    )
  );

-- ----------------------------------------------------------------------------
-- Grievance history (read-mostly audit log)
-- ----------------------------------------------------------------------------
drop policy if exists "history_read_anyone"   on grievance_history;
drop policy if exists "history_insert_staff"  on grievance_history;

create policy "history_read_anyone"
  on grievance_history for select
  using (true);

create policy "history_insert_staff"
  on grievance_history for insert
  with check (
    auth.uid() is not null
    or true  -- triggers/anon also permitted; tighten in production
  );

-- ----------------------------------------------------------------------------
-- Attachments (citizen proofs + officer action photos)
-- ----------------------------------------------------------------------------
drop policy if exists "attach_read_anyone"   on grievance_attachments;
drop policy if exists "attach_insert_anyone" on grievance_attachments;

create policy "attach_read_anyone"
  on grievance_attachments for select
  using (true);

create policy "attach_insert_anyone"
  on grievance_attachments for insert
  with check (true);

-- ----------------------------------------------------------------------------
-- Notifications  (only the recipient and staff with right scope can read)
-- ----------------------------------------------------------------------------
drop policy if exists "notif_self_read"   on notifications;
drop policy if exists "notif_insert_any"  on notifications;
drop policy if exists "notif_admin_all"   on notifications;

create policy "notif_self_read"
  on notifications for select
  using (recipient_user_id = auth.uid()
         or recipient_mobile is not null   -- demo: allow anon citizen lookup by their mobile (filtered client-side)
         );

create policy "notif_insert_any"
  on notifications for insert
  with check (true);

create policy "notif_admin_all"
  on notifications for all
  using (
    exists (select 1 from profiles p
            where p.id = auth.uid()
              and p.role in ('collector','admin','hod'))
  );

-- ----------------------------------------------------------------------------
-- Public RPC: get_grievance_for_citizen (mobile + grievance_id lookup)
-- ----------------------------------------------------------------------------
create or replace function get_grievance_for_citizen(p_mobile text, p_gid text)
returns table (
  grievance_id text,
  applicant_name text,
  status grievance_status,
  department_name_en text,
  department_name_te text,
  subject_name_en text,
  subject_name_te text,
  mandal_name_en text,
  panchayat_name_en text,
  description text,
  created_at timestamptz,
  expected_resolution_date date,
  resolved_at timestamptz,
  citizen_rating int
) as $$
  select
    g.grievance_id,
    g.applicant_name,
    g.status,
    d.name_en, d.name_te,
    s.name_en, s.name_te,
    m.name_en,
    p.name_en,
    g.description,
    g.created_at,
    g.expected_resolution_date,
    g.resolved_at,
    g.citizen_rating
  from grievances g
  left join departments d on d.id = g.department_id
  left join subjects    s on s.id = g.subject_id
  left join mandals     m on m.id = g.mandal_id
  left join panchayats  p on p.id = g.panchayat_id
  where g.mobile = p_mobile and g.grievance_id = p_gid
  limit 1;
$$ language sql stable security definer;

grant execute on function get_grievance_for_citizen(text, text) to anon, authenticated;
