-- ============================================================================
-- Prajadarbar — Seed data for Khammam district, Telangana
-- Run AFTER schema.sql (and rls.sql).  Idempotent: uses ON CONFLICT.
-- ============================================================================

-- ---------- Mandals (real Khammam district mandals after 2016 reorg) --------
insert into mandals (code, name_en, name_te, district, state, constituency, centroid_lat, centroid_lng) values
  ('KHU', 'Khammam (Urban)',     'ఖమ్మం (పట్టణ)',       'Khammam', 'Telangana', 'Khammam',     17.2473, 80.1514),
  ('KHR', 'Khammam (Rural)',     'ఖమ్మం (గ్రామీణ)',     'Khammam', 'Telangana', 'Khammam',     17.2604, 80.1812),
  ('MUD', 'Mudigonda',           'ముదిగొండ',           'Khammam', 'Telangana', 'Khammam',     17.3358, 80.2783),
  ('NEL', 'Nelakondapalli',      'నేలకొండపల్లి',      'Khammam', 'Telangana', 'Madhira',     17.0939, 80.5394),
  ('KSM', 'Kusumanchi',          'కూసుమంచి',           'Khammam', 'Telangana', 'Khammam',     17.3833, 80.3617),
  ('TIR', 'Tirumalayapalem',     'తిరుమలాయపాలెం',      'Khammam', 'Telangana', 'Palair',      17.3528, 80.0942),
  ('BNK', 'Bonakal',             'బోనకల్లు',           'Khammam', 'Telangana', 'Madhira',     16.9242, 80.4658),
  ('MDR', 'Madhira',             'మధిర',              'Khammam', 'Telangana', 'Madhira',     16.9244, 80.3625),
  ('YRP', 'Yerrupalem',          'ఎర్రుపాలెం',         'Khammam', 'Telangana', 'Madhira',     17.0186, 80.6203),
  ('WYR', 'Wyra',                'వైరా',              'Khammam', 'Telangana', 'Wyra',        17.1875, 80.3292),
  ('KNJ', 'Konijerla',           'కోనిజర్ల',           'Khammam', 'Telangana', 'Wyra',        17.0975, 80.2422),
  ('PNB', 'Penuballi',           'పెనుబల్లి',          'Khammam', 'Telangana', 'Sathupalli',  17.2386, 80.7575),
  ('STH', 'Sathupalli',          'సత్తుపల్లి',         'Khammam', 'Telangana', 'Sathupalli',  17.2497, 80.8911),
  ('VEM', 'Vemsoor',             'వేంసూర్',            'Khammam', 'Telangana', 'Sathupalli',  17.0617, 80.8625),
  ('KLR', 'Kallur',              'కల్లూరు',            'Khammam', 'Telangana', 'Khammam',     17.4339, 80.6011),
  ('SGR', 'Singareni',           'సింగరేణి',           'Khammam', 'Telangana', 'Sathupalli',  17.5231, 80.6764),
  ('CHK', 'Chinthakani',         'చింతకాని',          'Khammam', 'Telangana', 'Madhira',     17.0658, 80.2453),
  ('BYR', 'Bayyaram',            'బయ్యారం',            'Khammam', 'Telangana', 'Khammam',     17.6892, 80.4575),
  ('GRL', 'Garla',               'గార్ల',             'Khammam', 'Telangana', 'Khammam',     17.6764, 80.2731),
  ('JLP', 'Julurpad',            'జూలూర్‌పాడ్',        'Khammam', 'Telangana', 'Wyra',        17.4717, 80.0742),
  ('KMP', 'Kamepalli',           'కామేపల్లి',         'Khammam', 'Telangana', 'Khammam',     17.4825, 80.3036),
  ('THL', 'Thallada',            'తల్లాడ',             'Khammam', 'Telangana', 'Sathupalli',  17.3411, 80.6175),
  ('ENK', 'Enkuru',              'ఎంకూరు',            'Khammam', 'Telangana', 'Wyra',        17.0639, 80.1156),
  ('KRP', 'Karepalli',           'కారేపల్లి',         'Khammam', 'Telangana', 'Khammam',     17.5986, 80.5786),
  ('RPM', 'Raghunathapalem',     'రఘునాథపాలెం',       'Khammam', 'Telangana', 'Khammam',     17.2989, 80.1264)
on conflict (code) do update
  set name_en = excluded.name_en,
      name_te = excluded.name_te,
      constituency = excluded.constituency,
      centroid_lat = excluded.centroid_lat,
      centroid_lng = excluded.centroid_lng;

-- ---------- Panchayats inside Tirumalayapalem mandal (from real data) ------
insert into panchayats (mandal_id, name_en, name_te, ptype) values
  ((select id from mandals where code='TIR'), 'Sublaid',                'సుబ్లేడ్',              'panchayat'),
  ((select id from mandals where code='TIR'), 'Laxmidevipalli Thanda',  'లక్ష్మీదేవిపల్లి తండా',  'thanda'),
  ((select id from mandals where code='TIR'), 'Raghunathapalem',        'రఘునాథపాలెం',         'panchayat'),
  ((select id from mandals where code='TIR'), 'Hasnabad',               'హస్నాబాద్',             'panchayat'),
  ((select id from mandals where code='TIR'), 'Islavath Thanda',        'ఇస్లావత్ తండా',        'thanda'),
  ((select id from mandals where code='TIR'), 'Mohamadapuram',          'మహ్మదాపురం',           'panchayat'),
  ((select id from mandals where code='TIR'), 'Mekala Thanda',          'మేకల తండా',            'thanda'),
  ((select id from mandals where code='TIR'), 'Medidapalli',            'మేడిదపల్లి',           'panchayat'),
  ((select id from mandals where code='TIR'), 'Chandru Thanda',         'చంద్రు తండా',          'thanda'),
  ((select id from mandals where code='TIR'), 'Jogulapadu',             'జోగులపాడు',            'panchayat'),
  ((select id from mandals where code='TIR'), 'Patharlapadu',           'పాతర్లపాడు',           'panchayat'),
  ((select id from mandals where code='TIR'), 'Gol Thanda',             'గోల్ తండా',            'thanda'),
  ((select id from mandals where code='TIR'), 'Jallepalli',             'జల్లేపల్లి',           'panchayat')
on conflict (mandal_id, name_en) do nothing;

-- A few sample panchayats for other mandals so the dashboard has variety ----
insert into panchayats (mandal_id, name_en, name_te, ptype) values
  ((select id from mandals where code='KHU'), 'Bhaktha Ramdas Nagar',   'భక్త రామదాస్ నగర్',   'urban_ward'),
  ((select id from mandals where code='KHU'), 'Wyra Road',              'వైరా రోడ్',           'urban_ward'),
  ((select id from mandals where code='KHR'), 'Edulapuram',             'ఎదులపురం',             'panchayat'),
  ((select id from mandals where code='MUD'),  'Mudigonda',             'ముదిగొండ',             'panchayat'),
  ((select id from mandals where code='NEL'),  'Nelakondapalli',        'నేలకొండపల్లి',        'panchayat'),
  ((select id from mandals where code='MDR'),  'Madhira Town',          'మధిర పట్టణం',         'panchayat'),
  ((select id from mandals where code='WYR'),  'Wyra',                  'వైరా',                'panchayat'),
  ((select id from mandals where code='STH'),  'Sathupalli',            'సత్తుపల్లి',          'panchayat'),
  ((select id from mandals where code='YRP'),  'Yerrupalem',            'ఎర్రుపాలెం',          'panchayat'),
  ((select id from mandals where code='KSM'),  'Kusumanchi',            'కూసుమంచి',            'panchayat'),
  ((select id from mandals where code='BNK'),  'Bonakal',               'బోనకల్లు',            'panchayat'),
  ((select id from mandals where code='KNJ'),  'Konijerla',             'కోనిజర్ల',           'panchayat')
on conflict (mandal_id, name_en) do nothing;

-- ---------- Departments (Telangana district admin standard set) -------------
insert into departments (code, name_en, name_te, icon, default_sla_days) values
  ('REV',  'Revenue',                   'రెవెన్యూ',                  '🏛️', 60),
  ('PR',   'Panchayat Raj & RD',        'పంచాయతీరాజ్ & ఆర్‌డీ',     '🏘️', 60),
  ('HOU',  'Housing',                   'గృహ నిర్మాణం',              '🏠', 90),
  ('PEN',  'Pensions (Aasara)',         'పెన్షన్లు (ఆసరా)',          '👵', 30),
  ('CIV',  'Civil Supplies',            'పౌర సరఫరాలు',                '🛒', 30),
  ('ELE',  'Electricity (TGSPDCL)',     'విద్యుత్',                  '⚡', 15),
  ('AGR',  'Agriculture',               'వ్యవసాయం',                  '🌾', 60),
  ('WCD',  'Women & Child Welfare',     'మహిళా & శిశు సంక్షేమం',     '👩‍🍼', 45),
  ('RNB',  'Roads & Buildings',         'రహదారులు & భవనాలు',         '🛣️', 90),
  ('HLT',  'Medical & Health',          'వైద్య & ఆరోగ్యం',           '🏥', 30),
  ('IRR',  'Irrigation',                'జల వనరులు',                  '💧', 60),
  ('EDU',  'Education',                 'విద్య',                      '📚', 45),
  ('POL',  'Police',                    'పోలీసు',                    '👮', 15),
  ('WTR',  'Water Supply',              'తాగునీటి సరఫరా',             '🚰', 15),
  ('MUN',  'Municipal',                 'మున్సిపల్',                  '🏙️', 30),
  ('WLF',  'Welfare (SC/ST/BC)',        'సంక్షేమం (ఎస్‌సి/ఎస్‌టి/బిసి)','🤝', 45),
  ('FOR',  'Forest',                    'అటవీ శాఖ',                  '🌳', 60),
  ('OTH',  'Others',                    'ఇతరములు',                    '📌', 60)
on conflict (code) do update
  set name_en = excluded.name_en,
      name_te = excluded.name_te,
      icon    = excluded.icon,
      default_sla_days = excluded.default_sla_days;

-- ---------- Subjects / scheme catalogue (mirrors the Excel reference) -------
insert into subjects (department_id, name_en, name_te, sla_days)
select d.id, x.name_en, x.name_te, x.sla
from (values
  ('REV','Bhubharathi',                 'భూ భారతి',                   60),
  ('REV','Pattadar Passbook',           'పట్టాదార్ పాస్‌బుక్',         60),
  ('REV','Sadabainama',                 'సదాబైనామా',                  60),
  ('REV','Missing Survey Number',       'సర్వే నెం. మిస్సింగ్',         60),
  ('REV','Land Extent / Record Correction','భూ విస్తీర్ణం / రికార్డ్ సవరణ',60),
  ('REV','Land Registration',           'భూ నమోదు',                    60),
  ('REV','Other Revenue Issue',         'ఇతర రెవెన్యూ సమస్య',          60),
  ('HOU','Indiramma Indlu',             'ఇందిరమ్మ ఇళ్ళు',              90),
  ('HOU','House Site',                  'ఇంటి స్థలం',                   90),
  ('HOU','Other Housing Issue',         'ఇతర గృహ సమస్య',                90),
  ('PEN','Aasara Pension',              'ఆసరా పెన్షన్',                  30),
  ('PEN','Cheyutha Pension',            'చేయూత పెన్షన్',                 30),
  ('PEN','Widow Pension',               'వితంతు పెన్షన్',                30),
  ('PEN','Disabled Pension',            'వికలాంగుల పెన్షన్',             30),
  ('PEN','Single Women Pension',        'ఒంటరి మహిళా పెన్షన్',           30),
  ('PEN','Weavers / Toddy Pension',     'నేత / గౌడ పెన్షన్',             30),
  ('CIV','Ration Card',                 'రేషన్ కార్డు',                   30),
  ('CIV','Gas Subsidy',                 'గ్యాస్ సబ్సిడీ',                30),
  ('CIV','Food Security Card',          'ఆహార భద్రత కార్డు',             30),
  ('PR', 'MGNREGS Job Card',            'ఎన్‌ఆర్‌ఇజిఎస్ జాబ్ కార్డు',     45),
  ('PR', 'CC Road / Drainage',          'సిసి రోడ్డు / మురుగు నీరు',     90),
  ('PR', 'Sanitation / Toilet',         'పారిశుద్ధ్యం / మరుగుదొడ్డి',    60),
  ('PR', 'Village Building',            'గ్రామ భవనం',                    90),
  ('PR', 'Other PR Issue',              'ఇతర పంచాయతీరాజ్ సమస్య',         60),
  ('ELE','Gruha Jyothi',                'గృహ జ్యోతి',                    30),
  ('ELE','Power / Transformer Issue',   'విద్యుత్ / ట్రాన్స్‌ఫార్మర్ సమస్య',15),
  ('AGR','Rythu Bharosa',               'రైతు భరోసా',                   45),
  ('AGR','Rythu Bheema',                'రైతు భీమా',                    45),
  ('AGR','PM Kisan',                    'పిఎం కిసాన్',                   45),
  ('AGR','Runa Mafi',                   'రుణ మాఫీ',                     60),
  ('AGR','Other Agriculture Issue',     'ఇతర వ్యవసాయ సమస్య',             60),
  ('WCD','Mahalaxmi Pathakam',          'మహాలక్ష్మి పథకం',                45),
  ('WCD','Sree Shakthi Loans',          'శ్రీ శక్తి రుణాలు',              45),
  ('WCD','Kalyana Lakshmi',             'కల్యాణ లక్ష్మి',                  45),
  ('RNB','R&B Road',                    'రహదారి సమస్య',                  90),
  ('RNB','Bridge',                      'వంతెన',                         90),
  ('HLT','Medical / Health Issue',      'వైద్య / ఆరోగ్య సమస్య',          30),
  ('IRR','Irrigation Issue',            'జల వనరుల సమస్య',                60),
  ('EDU','Education Issue',             'విద్య సమస్య',                   45),
  ('POL','Law & Order',                 'శాంతి భద్రత',                   15),
  ('POL','Cyber Crime',                 'సైబర్ నేరం',                    30),
  ('WTR','Drinking Water',              'తాగునీరు',                       15),
  ('WTR','Pipeline Repair',             'పైపులైన్ మరమ్మత్తు',             15),
  ('MUN','Garbage / Sanitation',        'చెత్త / పారిశుద్ధ్యం',           15),
  ('MUN','Street Light',                'వీధి దీపం',                      15),
  ('WLF','SC/ST Sub-plan',              'ఎస్‌సి/ఎస్‌టి సబ్ ప్లాన్',         45),
  ('WLF','BC Welfare',                  'బిసి సంక్షేమం',                   45),
  ('FOR','Forest Land',                 'అటవీ భూమి',                     60),
  ('OTH','Other / Miscellaneous',       'ఇతర / వివిధ',                   60)
) as x(dcode, name_en, name_te, sla)
join departments d on d.code = x.dcode
on conflict (department_id, name_en) do update
  set name_te  = excluded.name_te,
      sla_days = excluded.sla_days;

-- ============================================================================
-- DEMO PROFILES (no auth.users link – illustrative for dashboard scoring)
-- ============================================================================
-- Real demo logins are created by `setup_demo_users.sql` which runs after
-- demo accounts have been created in Supabase Auth.
-- ============================================================================

-- ============================================================================
-- SAMPLE GRIEVANCES (15+ across mandals, departments, statuses)
-- ============================================================================
-- Helper note: triggers will auto-generate grievance_id, expected_resolution_date,
-- and the initial entry in grievance_history.
-- ============================================================================
do $$
declare
  m_tir uuid := (select id from mandals where code='TIR');
  m_mdr uuid := (select id from mandals where code='MDR');
  m_sth uuid := (select id from mandals where code='STH');
  m_wyr uuid := (select id from mandals where code='WYR');
  m_khu uuid := (select id from mandals where code='KHU');
  m_khr uuid := (select id from mandals where code='KHR');
  m_nel uuid := (select id from mandals where code='NEL');
  m_mud uuid := (select id from mandals where code='MUD');
  m_ksm uuid := (select id from mandals where code='KSM');
  m_kmp uuid := (select id from mandals where code='KMP');
  m_yrp uuid := (select id from mandals where code='YRP');
  m_pnb uuid := (select id from mandals where code='PNB');

  d_rev uuid := (select id from departments where code='REV');
  d_hou uuid := (select id from departments where code='HOU');
  d_pen uuid := (select id from departments where code='PEN');
  d_civ uuid := (select id from departments where code='CIV');
  d_ele uuid := (select id from departments where code='ELE');
  d_agr uuid := (select id from departments where code='AGR');
  d_pr  uuid := (select id from departments where code='PR');
  d_wtr uuid := (select id from departments where code='WTR');
  d_hlt uuid := (select id from departments where code='HLT');
  d_pol uuid := (select id from departments where code='POL');
  d_rnb uuid := (select id from departments where code='RNB');
  d_wcd uuid := (select id from departments where code='WCD');
begin
  -- Wipe any prior demo rows so re-running seed.sql is safe
  delete from grievances where mobile in (
    '9000000001','9000000002','9000000003','9000000004','9000000005',
    '9000000006','9000000007','9000000008','9000000009','9000000010',
    '9000000011','9000000012','9000000013','9000000014','9000000015',
    '9000000016','9000000017','9000000018','9000000019','9000000020');

  -- 1. Tirumalayapalem / Chandru Thanda — Aasara pension (in_progress, 12 days)
  insert into grievances (applicant_name, guardian_name, gender, mobile, aadhaar_last4, language,
                          mandal_id, panchayat_id, village_address, gps_lat, gps_lng,
                          department_id, subject_id, description, severity, status,
                          created_at, source)
  values ('Lukavath Vijaya','Ravi','Female','9000000001','6592','te',
          m_tir,(select id from panchayats where mandal_id=m_tir and name_en='Chandru Thanda'),
          'CHANDRU THANDA, TIRUMALAYAPALEM',17.349,80.097,
          d_pen,(select id from subjects where name_en='Aasara Pension' and department_id=d_pen),
          'Mother is 67 yrs; Aasara pension was sanctioned but no monthly amount has been credited for 4 months. Please verify and release pending arrears.',
          'medium','in_progress', now() - interval '12 days', 'web');

  -- 2. Tirumalayapalem / Chandru Thanda — Indiramma Indlu (assigned, 8 days)
  insert into grievances (applicant_name, guardian_name, gender, mobile, aadhaar_last4, language,
                          mandal_id, panchayat_id, village_address, gps_lat, gps_lng,
                          department_id, subject_id, description, severity, status,
                          created_at, source)
  values ('Boda Venkanna','Saidulu','Male','9000000002','5268','te',
          m_tir,(select id from panchayats where mandal_id=m_tir and name_en='Chandru Thanda'),
          'CHANDRU THANDA, TIRUMALAYAPALEM',17.350,80.098,
          d_hou,(select id from subjects where name_en='Indiramma Indlu' and department_id=d_hou),
          'Applied for Indiramma Indlu. Site verified by panchayat secretary. Sanction order pending for 3 months.',
          'high','assigned', now() - interval '8 days', 'web');

  -- 3. Tirumalayapalem / Sublaid — Bhubharathi (registered, 1 day)
  insert into grievances (applicant_name, guardian_name, gender, mobile, aadhaar_last4, language,
                          mandal_id, panchayat_id, village_address, gps_lat, gps_lng,
                          department_id, subject_id, description, severity, status,
                          created_at, source)
  values ('Boda Husain','Saidulu','Male','9000000003','7645','te',
          m_tir,(select id from panchayats where mandal_id=m_tir and name_en='Sublaid'),
          'Sublaid, TIRUMALAYAPALEM',17.353,80.094,
          d_rev,(select id from subjects where name_en='Missing Survey Number' and department_id=d_rev),
          'Survey number missing in Bhubharathi for my agricultural land of 2.5 acres. Pattadar passbook also not generated.',
          'medium','registered', now() - interval '1 day', 'web');

  -- 4. Khammam Urban — Drinking water shortage (acknowledged, 2 days)
  insert into grievances (applicant_name, guardian_name, gender, mobile, aadhaar_last4, language,
                          mandal_id, panchayat_id, village_address, gps_lat, gps_lng,
                          department_id, subject_id, description, severity, status,
                          created_at, source)
  values ('K. Lakshmi','Ramana','Female','9000000004','1122','te',
          m_khu,(select id from panchayats where mandal_id=m_khu and name_en='Wyra Road'),
          'Wyra Road, Khammam Urban',17.247,80.151,
          d_wtr,(select id from subjects where name_en='Drinking Water' and department_id=d_wtr),
          'Severe drinking water shortage in our colony for the last 10 days. Water tankers also not coming.',
          'high','acknowledged', now() - interval '2 days', 'whatsapp');

  -- 5. Madhira — Ration card (resolved, citizen rated 5)
  insert into grievances (applicant_name, guardian_name, gender, mobile, aadhaar_last4, language,
                          mandal_id, panchayat_id, village_address, gps_lat, gps_lng,
                          department_id, subject_id, description, severity, status,
                          created_at, resolved_at, citizen_rating, citizen_feedback, source)
  values ('M. Srinu','Mohan','Male','9000000005','3344','te',
          m_mdr,(select id from panchayats where mandal_id=m_mdr and name_en='Madhira Town'),
          'Madhira Town',16.924,80.362,
          d_civ,(select id from subjects where name_en='Ration Card' and department_id=d_civ),
          'Ration card showing 5 members but only 3 receiving rations. Please correct the entitlement.',
          'medium','resolved', now() - interval '21 days', now() - interval '4 days', 5,
          'Issue resolved within 2 weeks. Officer was very helpful.', 'web');

  -- 6. Sathupalli — Indiramma Indlu OVERDUE (in_progress, 95 days, RED ZONE)
  insert into grievances (applicant_name, guardian_name, gender, mobile, aadhaar_last4, language,
                          mandal_id, panchayat_id, village_address, gps_lat, gps_lng,
                          department_id, subject_id, description, severity, status,
                          created_at, source)
  values ('Banoth Ramulu','Bhadrayya','Male','9000000006','5566','te',
          m_sth,(select id from panchayats where mandal_id=m_sth and name_en='Sathupalli'),
          'Sathupalli',17.250,80.891,
          d_hou,(select id from subjects where name_en='Indiramma Indlu' and department_id=d_hou),
          'House sanctioned 8 months back but no work started. Family of 6 living in temporary shed.',
          'critical','in_progress', now() - interval '95 days', 'web');

  -- 7. Wyra — Rythu Bharosa pending (assigned, 45 days, AMBER)
  insert into grievances (applicant_name, guardian_name, gender, mobile, aadhaar_last4, language,
                          mandal_id, panchayat_id, village_address, gps_lat, gps_lng,
                          department_id, subject_id, description, severity, status,
                          created_at, source)
  values ('Banoth Veera Kumar','Lachi Ram','Male','9000000007','8868','te',
          m_wyr,(select id from panchayats where mandal_id=m_wyr and name_en='Wyra'),
          'Wyra',17.187,80.329,
          d_agr,(select id from subjects where name_en='Rythu Bharosa' and department_id=d_agr),
          'Rythu Bharosa amount not credited for last two seasons; my land record is digitised in my name.',
          'medium','assigned', now() - interval '45 days', 'web');

  -- 8. Khammam Rural — Power outage (resolved, 3 days)
  insert into grievances (applicant_name, guardian_name, gender, mobile, aadhaar_last4, language,
                          mandal_id, panchayat_id, village_address, gps_lat, gps_lng,
                          department_id, subject_id, description, severity, status,
                          created_at, resolved_at, citizen_rating, source)
  values ('Edula Naresh','Anjaneyulu','Male','9000000008','9988','te',
          m_khr,(select id from panchayats where mandal_id=m_khr and name_en='Edulapuram'),
          'Edulapuram',17.260,80.181,
          d_ele,(select id from subjects where name_en='Power / Transformer Issue' and department_id=d_ele),
          'Transformer at our agricultural pump-set burnt 4 days ago; crops will be damaged.',
          'high','resolved', now() - interval '3 days', now() - interval '12 hours', 4, 'web');

  -- 9. Nelakondapalli — CC road (field_verified, 18 days)
  insert into grievances (applicant_name, guardian_name, gender, mobile, aadhaar_last4, language,
                          mandal_id, panchayat_id, village_address, gps_lat, gps_lng,
                          department_id, subject_id, description, severity, status,
                          created_at, field_verified_at, source)
  values ('B. Prasad','Madhusudhan','Male','9000000009','4455','en',
          m_nel,(select id from panchayats where mandal_id=m_nel and name_en='Nelakondapalli'),
          'Main road, Nelakondapalli',17.094,80.539,
          d_pr,(select id from subjects where name_en='CC Road / Drainage' and department_id=d_pr),
          'CC road approved and tendered, but execution stuck for 6 weeks. Drainage overflows during rains.',
          'medium','field_verified', now() - interval '18 days', now() - interval '3 days', 'mobile_app');

  -- 10. Mudigonda — Cheyutha pension (closed, citizen 5★)
  insert into grievances (applicant_name, guardian_name, gender, mobile, aadhaar_last4, language,
                          mandal_id, panchayat_id, village_address, gps_lat, gps_lng,
                          department_id, subject_id, description, severity, status,
                          created_at, resolved_at, closed_at, citizen_rating, citizen_feedback, source)
  values ('Sreedevi Kumari','Sambaiah','Female','9000000010','7766','te',
          m_mud,(select id from panchayats where mandal_id=m_mud and name_en='Mudigonda'),
          'Mudigonda',17.336,80.278,
          d_pen,(select id from subjects where name_en='Cheyutha Pension' and department_id=d_pen),
          'Cheyutha pension stopped from January despite valid records. Need restoration.',
          'medium','closed', now() - interval '15 days', now() - interval '7 days', now() - interval '2 days', 5,
          'Pension restored and arrears credited. Thank you Collector sir.','whatsapp');

  -- 11. Kusumanchi — Police law & order (escalated, 22 days)
  insert into grievances (applicant_name, guardian_name, gender, mobile, aadhaar_last4, language,
                          mandal_id, panchayat_id, village_address, gps_lat, gps_lng,
                          department_id, subject_id, description, severity, status,
                          created_at, source)
  values ('S. Rajesh','Gopal','Male','9000000011','2233','en',
          m_ksm,(select id from panchayats where mandal_id=m_ksm and name_en='Kusumanchi'),
          'Kusumanchi',17.383,80.362,
          d_pol,(select id from subjects where name_en='Law & Order' and department_id=d_pol),
          'Repeated nuisance from a few miscreants in the colony at night; FIR filed but no follow-up.',
          'high','escalated', now() - interval '22 days', 'web');

  -- 12. Yerrupalem — Mahalaxmi Pathakam (in_progress, 35 days, AMBER)
  insert into grievances (applicant_name, guardian_name, gender, mobile, aadhaar_last4, language,
                          mandal_id, panchayat_id, village_address, gps_lat, gps_lng,
                          department_id, subject_id, description, severity, status,
                          created_at, source)
  values ('P. Anitha','Ramesh','Female','9000000012','1199','te',
          m_yrp,(select id from panchayats where mandal_id=m_yrp and name_en='Yerrupalem'),
          'Yerrupalem',17.019,80.620,
          d_wcd,(select id from subjects where name_en='Mahalaxmi Pathakam' and department_id=d_wcd),
          'Free bus pass under Mahalaxmi not getting recognised at depot. Need clarification / replacement card.',
          'low','in_progress', now() - interval '35 days', 'mobile_app');

  -- 13. Penuballi — Health centre (registered)
  insert into grievances (applicant_name, guardian_name, gender, mobile, aadhaar_last4, language,
                          mandal_id, panchayat_id, village_address, gps_lat, gps_lng,
                          department_id, subject_id, description, severity, status,
                          created_at, source)
  values ('Bhukya Ramana','Kishan','Male','9000000013','3322','te',
          m_pnb,null,'Penuballi mandal centre',17.239,80.758,
          d_hlt,(select id from subjects where name_en='Medical / Health Issue' and department_id=d_hlt),
          'PHC has no MBBS doctor for the past 3 weeks. Pregnant women being referred to district hospital.',
          'critical','registered', now() - interval '6 hours', 'web');

  -- 14. Kamepalli — R&B road (in_progress, 70 days, RED)
  insert into grievances (applicant_name, guardian_name, gender, mobile, aadhaar_last4, language,
                          mandal_id, panchayat_id, village_address, gps_lat, gps_lng,
                          department_id, subject_id, description, severity, status,
                          created_at, source)
  values ('K. Sudhakar','Rao','Male','9000000014','6677','en',
          m_kmp,null,'Kamepalli',17.482,80.304,
          d_rnb,(select id from subjects where name_en='R&B Road' and department_id=d_rnb),
          'Kamepalli–Khammam main road has severe potholes; bus service has been disrupted.',
          'high','in_progress', now() - interval '70 days', 'web');

  -- 15. Khammam Urban — Street light (resolved fast, 1 day)
  insert into grievances (applicant_name, guardian_name, gender, mobile, aadhaar_last4, language,
                          mandal_id, panchayat_id, village_address, gps_lat, gps_lng,
                          department_id, subject_id, description, severity, status,
                          created_at, resolved_at, citizen_rating, source)
  values ('M. Anjali','Ravi','Female','9000000015','4455','en',
          m_khu,(select id from panchayats where mandal_id=m_khu and name_en='Bhaktha Ramdas Nagar'),
          'BRN colony, Khammam',17.250,80.151,
          (select id from departments where code='MUN'),
          (select id from subjects where name_en='Street Light' and department_id=(select id from departments where code='MUN')),
          'Three street lights not working in our lane for over a week. Safety concern at night.',
          'medium','resolved', now() - interval '1 day', now() - interval '4 hours', 5, 'web');

  -- 16. Tirumalayapalem / Mohamadapuram — Sadabainama (acknowledged, 5 days)
  insert into grievances (applicant_name, guardian_name, gender, mobile, aadhaar_last4, language,
                          mandal_id, panchayat_id, village_address, gps_lat, gps_lng,
                          department_id, subject_id, description, severity, status,
                          created_at, source)
  values ('Boda Devendar','Krishna','Male','9000000016','1636','te',
          m_tir,(select id from panchayats where mandal_id=m_tir and name_en='Mohamadapuram'),
          'MOHAMADAPURAM, TIRUMALAYAPALEM',17.353,80.110,
          d_rev,(select id from subjects where name_en='Sadabainama' and department_id=d_rev),
          'Sadabainama paper purchased land; please regularise as per the GO and update revenue records.',
          'medium','acknowledged', now() - interval '5 days', 'web');

  -- 17. Tirumalayapalem / Gol Thanda — Gruha Jyothi (registered)
  insert into grievances (applicant_name, guardian_name, gender, mobile, aadhaar_last4, language,
                          mandal_id, panchayat_id, village_address, gps_lat, gps_lng,
                          department_id, subject_id, description, severity, status,
                          created_at, source)
  values ('Bhukya Sarada','Malsoor','Female','9000000017','1582','te',
          m_tir,(select id from panchayats where mandal_id=m_tir and name_en='Gol Thanda'),
          'GOL THANDA, TIRUMALAYAPALEM',17.358,80.105,
          d_ele,(select id from subjects where name_en='Gruha Jyothi' and department_id=d_ele),
          'Gruha Jyothi 200-unit free scheme not applied even though my consumption is below threshold.',
          'low','registered', now() - interval '2 hours', 'mobile_app');

  -- 18. Madhira — MGNREGS job card (in_progress, 25 days)
  insert into grievances (applicant_name, guardian_name, gender, mobile, aadhaar_last4, language,
                          mandal_id, panchayat_id, village_address, gps_lat, gps_lng,
                          department_id, subject_id, description, severity, status,
                          created_at, source)
  values ('K. Manga','Anjaiah','Female','9000000018','9911','te',
          m_mdr,(select id from panchayats where mandal_id=m_mdr and name_en='Madhira Town'),
          'Madhira Town',16.925,80.363,
          d_pr,(select id from subjects where name_en='MGNREGS Job Card' and department_id=d_pr),
          'Job card lost; replacement application pending for over 3 weeks. Wages also pending for 12 days.',
          'medium','in_progress', now() - interval '25 days', 'web');

  -- 19. Khammam Urban — Pattadar passbook (resolved, 6 days)
  insert into grievances (applicant_name, guardian_name, gender, mobile, aadhaar_last4, language,
                          mandal_id, panchayat_id, village_address, gps_lat, gps_lng,
                          department_id, subject_id, description, severity, status,
                          created_at, resolved_at, citizen_rating, source)
  values ('G. Subbarao','Veeraiah','Male','9000000019','7711','en',
          m_khu,null,'Khammam Urban',17.244,80.150,
          d_rev,(select id from subjects where name_en='Pattadar Passbook' and department_id=d_rev),
          'Pattadar passbook had wrong father name. Correction request pending.',
          'medium','resolved', now() - interval '6 days', now() - interval '1 day', 4, 'web');

  -- 20. Tirumalayapalem / Hasnabad — Indiramma Indlu (assigned, 4 days)
  insert into grievances (applicant_name, guardian_name, gender, mobile, aadhaar_last4, language,
                          mandal_id, panchayat_id, village_address, gps_lat, gps_lng,
                          department_id, subject_id, description, severity, status,
                          created_at, source)
  values ('Mohammad Shabbir','Akbar','Male','9000000020','5599','te',
          m_tir,(select id from panchayats where mandal_id=m_tir and name_en='Hasnabad'),
          'Hasnabad, TIRUMALAYAPALEM',17.354,80.090,
          d_hou,(select id from subjects where name_en='Indiramma Indlu' and department_id=d_hou),
          'Beneficiary verified; first instalment not released even though sanction is 2 months old.',
          'high','assigned', now() - interval '4 days', 'web');
end $$;
