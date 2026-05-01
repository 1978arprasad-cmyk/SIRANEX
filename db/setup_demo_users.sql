-- ============================================================================
-- Setup demo user PROFILES.  Run this AFTER you have created the matching
-- email accounts in Supabase Auth (Dashboard → Authentication → Users → Add).
-- The trigger handle_new_user() created in schema.sql will auto-insert a
-- minimal profiles row; this script upgrades each profile with the correct
-- role / department / mandal so the demo dashboards have meaningful data.
--
--  Suggested demo passwords:  Demo@2026
--
--  Email                                  Role               Demo scope
--  -----------------------------------------------------------------------
--  citizen@prajadarbar.demo               citizen            (default)
--  officer.revenue@prajadarbar.demo       officer            Revenue
--  officer.housing@prajadarbar.demo       officer            Housing
--  hod.revenue@prajadarbar.demo           hod                Revenue
--  collector@prajadarbar.demo             collector          District-wide
--  field.tirumalayapalem@prajadarbar.demo field_officer      Tirumalayapalem
-- ============================================================================

update profiles
   set role          = 'citizen',
       full_name     = coalesce(full_name,'Demo Citizen'),
       language      = 'te'
 where email = 'citizen@prajadarbar.demo';

update profiles
   set role          = 'officer',
       full_name     = 'Tahsildar – Revenue (Demo)',
       department_id = (select id from departments where code='REV'),
       designation   = 'Tahsildar',
       language      = 'en'
 where email = 'officer.revenue@prajadarbar.demo';

update profiles
   set role          = 'officer',
       full_name     = 'Housing AE (Demo)',
       department_id = (select id from departments where code='HOU'),
       designation   = 'Assistant Engineer',
       language      = 'en'
 where email = 'officer.housing@prajadarbar.demo';

update profiles
   set role          = 'hod',
       full_name     = 'Joint Collector – Revenue (Demo)',
       department_id = (select id from departments where code='REV'),
       designation   = 'Joint Collector',
       language      = 'en'
 where email = 'hod.revenue@prajadarbar.demo';

update profiles
   set role          = 'collector',
       full_name     = 'District Collector – Khammam (Demo)',
       designation   = 'District Collector',
       language      = 'en'
 where email = 'collector@prajadarbar.demo';

update profiles
   set role          = 'field_officer',
       full_name     = 'MPDO – Tirumalayapalem (Demo)',
       mandal_id     = (select id from mandals where code='TIR'),
       designation   = 'MPDO',
       language      = 'te'
 where email = 'field.tirumalayapalem@prajadarbar.demo';

-- Show the result
select email, full_name, role,
       (select name_en from departments where id=department_id) as department,
       (select name_en from mandals where id=mandal_id)         as mandal
  from profiles
 where email like '%@prajadarbar.demo';
