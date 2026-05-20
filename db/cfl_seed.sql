-- ============================================================================
-- CFL SEED DATA — Khammam District, Telangana
-- 6 CFL Centres | 12 Counselors | 72 Villages | 1 LDM
-- ============================================================================

-- =============================================================================
-- CFL CENTRES
-- =============================================================================

insert into cfl_centres (code, name, mandal, district, address, centre_lat, centre_lng,
  manager_name, manager_mobile, bank_linkage, established_on) values

('CFL-KMM-01', 'CFL Khammam Urban',      'Khammam',       'Khammam',
  'Nayabazar, Khammam – 507001',            17.2473,  80.1514,
  'G. Ramakrishna Rao', '9849000001', 'Andhra Bank / UCO Bank', '2018-04-01'),

('CFL-KMM-02', 'CFL Kothagudem',         'Kothagudem',    'Khammam',
  'Main Road, Kothagudem – 507101',         17.5536,  80.6228,
  'K. Sarada Devi',     '9849000002', 'State Bank of India',    '2018-07-01'),

('CFL-KMM-03', 'CFL Bhadrachalam',       'Bhadrachalam',  'Khammam',
  'Temple Road, Bhadrachalam – 507111',     17.6688,  80.8876,
  'B. Venkateswarlu',   '9849000003', 'Canara Bank',            '2019-01-01'),

('CFL-KMM-04', 'CFL Sattupalli',         'Sattupalli',    'Khammam',
  'Bus Stand Road, Sattupalli – 521120',    16.9778,  80.8844,
  'S. Laxmi Prasad',    '9849000004', 'Indian Overseas Bank',   '2019-04-01'),

('CFL-KMM-05', 'CFL Yellandu',           'Yellandu',      'Khammam',
  'Market Road, Yellandu – 507123',         17.5897,  80.3217,
  'Y. Chandrasekhar',   '9849000005', 'Bank of Baroda',         '2020-01-01'),

('CFL-KMM-06', 'CFL Madhira',            'Madhira',       'Khammam',
  'Town Centre, Madhira – 507208',          16.9167,  80.3667,
  'M. Sridevi',         '9849000006', 'Punjab National Bank',   '2020-04-01')

on conflict (code) do nothing;

-- =============================================================================
-- VILLAGES  (12 per CFL centre = 72 total)
-- =============================================================================

-- CFL-KMM-01 Khammam Urban villages
with c as (select id from cfl_centres where code = 'CFL-KMM-01')
insert into cfl_villages (name, name_te, mandal, cfl_centre_id, lat, lng, geofence_radius_m, population, households, priority)
select v.name, v.name_te, v.mandal, c.id, v.lat, v.lng, v.rad, v.pop, v.hh, v.prio
from c, (values
  ('Wyra',          'వైర',          'Wyra',          17.1833, 80.3833, 300, 8500, 1800, 1),
  ('Enkur',         'ఎంకూర్',       'Enkur',         17.2100, 80.2800, 300, 4200, 950,  2),
  ('Nelakondapalli','నేలకొండపల్లి', 'Nelakondapalli',17.0500, 80.1333, 300, 3800, 820,  2),
  ('Vemsoor',       'వేమ్సూర్',     'Vemsoor',       17.3167, 80.0500, 300, 5100, 1100, 1),
  ('Tirumalayapalem','తిరుమలయపాలెం','Tirumalayapalem',17.1667, 80.1167, 250, 2900, 650,  3),
  ('Kallur',        'కల్లూర్',      'Kallur',        17.2000, 80.2000, 250, 3200, 720,  2),
  ('Kusumanchi',    'కుసుమాంచి',   'Kusumanchi',    17.2700, 80.1000, 300, 4400, 980,  2),
  ('Thallada',      'తల్లాడ',       'Thallada',      17.3500, 80.1500, 300, 3600, 800,  3),
  ('Raghunadhapalem','రఘునాధపాలెం', 'Wyra',          17.1400, 80.3200, 250, 2100, 470,  3),
  ('Bonakal',       'బొనకల్',       'Bonakal',       17.4000, 80.2500, 300, 6200, 1380, 1),
  ('Madhira Puram', 'మధిర పురం',   'Madhira',       17.0100, 80.3500, 250, 1800, 400,  3),
  ('Yerrupalem',    'యెర్రుపాలెం',  'Kallur',        17.1900, 80.2300, 250, 2400, 540,  3)
) as v(name, name_te, mandal, lat, lng, rad, pop, hh, prio)
on conflict do nothing;

-- CFL-KMM-02 Kothagudem villages
with c as (select id from cfl_centres where code = 'CFL-KMM-02')
insert into cfl_villages (name, name_te, mandal, cfl_centre_id, lat, lng, geofence_radius_m, population, households, priority)
select v.name, v.name_te, v.mandal, c.id, v.lat, v.lng, v.rad, v.pop, v.hh, v.prio
from c, (values
  ('Palvancha',      'పాల్వంచ',      'Palvancha',    17.5333, 80.6500, 350, 32000, 7200, 1),
  ('Sujathanagar',   'సుజాతానగర్',   'Kothagudem',   17.5667, 80.6333, 300, 5600,  1250, 2),
  ('Julurpad',       'జులూర్పాడ్',   'Julurpad',     17.6500, 80.5833, 300, 4800,  1070, 2),
  ('Burgampadu',     'బుర్గంపాడు',   'Burgampadu',   17.7000, 80.6167, 300, 3200,  720,  3),
  ('Mulakalapalli',  'ముళకలపల్లి',   'Mulakalapalli',17.6167, 80.5500, 300, 5900,  1310, 1),
  ('Tekulapalli',    'తేకులపల్లి',   'Tekulapalli',  17.4833, 80.5833, 250, 3100,  690,  3),
  ('Kamepalli',      'కామేపల్లి',    'Kothagudem',   17.5167, 80.6667, 250, 2700,  600,  3),
  ('Aswaraopeta',    'అశ్వారావుపేట', 'Aswaraopeta',  17.2500, 80.6833, 350, 18000, 4000, 1),
  ('Chintoor',       'చింతూర్',      'Chintoor',     17.4500, 81.0000, 300, 6200,  1380, 2),
  ('Dammapeta',      'దమ్మపేట',      'Dammapeta',    17.4000, 80.7167, 300, 4100,  910,  2),
  ('Bhadrachalam Rd','భద్రాచలం రోడ్','Kothagudem',   17.5800, 80.6100, 250, 3400,  760,  3),
  ('Chandrugonda',   'చంద్రుగొండ',  'Chandrugonda', 17.6833, 80.7500, 300, 5100,  1130, 2)
) as v(name, name_te, mandal, lat, lng, rad, pop, hh, prio)
on conflict do nothing;

-- CFL-KMM-03 Bhadrachalam villages
with c as (select id from cfl_centres where code = 'CFL-KMM-03')
insert into cfl_villages (name, name_te, mandal, cfl_centre_id, lat, lng, geofence_radius_m, population, households, priority)
select v.name, v.name_te, v.mandal, c.id, v.lat, v.lng, v.rad, v.pop, v.hh, v.prio
from c, (values
  ('Dummugudem',    'డుమ్ముగూడెం',  'Bhadrachalam', 17.7167, 80.9333, 300, 3200, 710,  2),
  ('Paloncha',      'పాలోంచ',       'Paloncha',     17.6000, 80.7167, 350, 24000,5400, 1),
  ('Kovvada',       'కొవ్వాడ',      'Bhadrachalam', 17.6500, 80.9000, 300, 2800, 620,  3),
  ('Kunavaram',     'కుణవరం',       'Kunavaram',    17.7833, 81.0500, 300, 4100, 910,  2),
  ('V.R.Puram',     'వి.ఆర్.పురం',  'V.R.Puram',    17.9500, 81.2833, 300, 3600, 800,  2),
  ('Cherla',        'చేర్ల',        'Cherla',       18.1833, 81.0833, 300, 5200, 1160, 1),
  ('Charlapadu',    'చర్లపాడు',     'Bhadrachalam', 17.6900, 80.8700, 250, 1900, 420,  3),
  ('Ragampeta',     'రాగంపేట',      'Bhadrachalam', 17.6300, 80.9200, 250, 2300, 510,  3),
  ('Chintalapudi',  'చింతలపూడి',    'Bhadrachalam', 17.7000, 81.0000, 300, 3800, 840,  2),
  ('Kothapalle',    'కొఠపల్లె',     'Bhadrachalam', 17.7500, 80.9700, 250, 2100, 470,  3),
  ('Manugur',       'మాన్గూర్',     'Manugur',      17.5500, 80.7667, 300, 4700, 1040, 2),
  ('Tallada',       'తల్లాడ',       'Bhadrachalam', 17.6700, 80.9500, 250, 1700, 380,  3)
) as v(name, name_te, mandal, lat, lng, rad, pop, hh, prio)
on conflict do nothing;

-- CFL-KMM-04 Sattupalli villages
with c as (select id from cfl_centres where code = 'CFL-KMM-04')
insert into cfl_villages (name, name_te, mandal, cfl_centre_id, lat, lng, geofence_radius_m, population, households, priority)
select v.name, v.name_te, v.mandal, c.id, v.lat, v.lng, v.rad, v.pop, v.hh, v.prio
from c, (values
  ('Wyra South',   'వైర దక్షిణ',   'Wyra',         17.0833, 80.4000, 300, 3200, 720,  2),
  ('Khammam Rural','ఖమ్మం రూరల్',  'Sattupalli',   16.9778, 80.8844, 350, 7800, 1740, 1),
  ('Kodad',        'కొడాడ',        'Sattupalli',   16.9900, 80.9000, 300, 5400, 1200, 1),
  ('Penuballi',    'పెనుబల్లి',    'Penuballi',    17.1167, 81.0500, 300, 4100, 910,  2),
  ('Mothugudem',   'మోతుగూడెం',   'Sattupalli',   17.0167, 80.9000, 300, 2800, 620,  3),
  ('Tallada S',    'తల్లాడ ఎస్',   'Sattupalli',   17.0500, 80.8500, 250, 2200, 490,  3),
  ('Suryapet Rd',  'సూర్యాపేట రోడ్','Sattupalli',  16.9600, 80.8600, 250, 3100, 690,  3),
  ('Chandrugudem', 'చంద్రగూడెం',   'Sattupalli',   16.9400, 80.9200, 300, 3800, 840,  2),
  ('Kondapuram',   'కొండపురం',     'Sattupalli',   17.0000, 80.8000, 300, 4500, 1000, 2),
  ('Pedda Kondur', 'పెద్ద కొందూర్','Sattupalli',   16.9200, 80.9500, 250, 1900, 420,  3),
  ('Gundala',      'గుండల',        'Sattupalli',   17.0300, 80.7800, 250, 2600, 580,  3),
  ('Gujjulapalem', 'గుజ్జులపాలెం', 'Sattupalli',   16.9700, 80.9700, 300, 3300, 740,  2)
) as v(name, name_te, mandal, lat, lng, rad, pop, hh, prio)
on conflict do nothing;

-- CFL-KMM-05 Yellandu villages
with c as (select id from cfl_centres where code = 'CFL-KMM-05')
insert into cfl_villages (name, name_te, mandal, cfl_centre_id, lat, lng, geofence_radius_m, population, households, priority)
select v.name, v.name_te, v.mandal, c.id, v.lat, v.lng, v.rad, v.pop, v.hh, v.prio
from c, (values
  ('Bayyaram',      'బయ్యారం',      'Bayyaram',     17.6167, 80.1167, 300, 4200, 940,  2),
  ('Garla',         'గార్ల',        'Garla',        17.5167, 80.3333, 300, 3700, 820,  2),
  ('Chinnur',       'చిన్నూర్',     'Chinnur',      18.8833, 79.5833, 300, 5600, 1250, 1),
  ('Pinapaka',      'పినపాక',       'Pinapaka',     18.2833, 80.9500, 300, 4100, 910,  2),
  ('Burgampadu Y',  'బుర్గంపాడు వై','Yellandu',     17.5667, 80.3100, 250, 2800, 620,  3),
  ('Chandrugonda Y','చంద్రగొండ వై', 'Yellandu',     17.6100, 80.3500, 300, 3200, 710,  2),
  ('Gopalpur',      'గోపాల్‌పూర్',  'Yellandu',     17.5400, 80.2900, 250, 1900, 420,  3),
  ('Narsampet',     'నర్సంపేట',     'Narsampet',    17.9333, 79.8833, 350, 15000,3350, 1),
  ('Ghanpur',       'ఘన్‌పూర్',     'Ghanpur',      17.9333, 79.7500, 300, 4800, 1070, 2),
  ('Mahabubabad',   'మహబూబాబాద్',  'Mahabubabad',  17.6000, 80.0000, 350, 28000,6250, 1),
  ('Thorrur',       'తొర్రూర్',     'Thorrur',      17.9167, 79.9667, 300, 5200, 1160, 2),
  ('Kodakandla',    'కొడకందల',     'Yellandu',     17.5900, 80.3000, 250, 2100, 470,  3)
) as v(name, name_te, mandal, lat, lng, rad, pop, hh, prio)
on conflict do nothing;

-- CFL-KMM-06 Madhira villages
with c as (select id from cfl_centres where code = 'CFL-KMM-06')
insert into cfl_villages (name, name_te, mandal, cfl_centre_id, lat, lng, geofence_radius_m, population, households, priority)
select v.name, v.name_te, v.mandal, c.id, v.lat, v.lng, v.rad, v.pop, v.hh, v.prio
from c, (values
  ('Madhira Town',  'మధిర టౌన్',   'Madhira',      16.9200, 80.3700, 350, 18000,4000, 1),
  ('Khammam Rural S','ఖమ్మం రూరల్ ఎస్','Madhira',  17.0500, 80.2800, 300, 5200, 1160, 2),
  ('Tiruvuru',      'తిరువూరు',     'Tiruvuru',     16.5500, 80.6167, 300, 11000,2450, 1),
  ('Suryapet',      'సూర్యాపేట',   'Suryapet',     17.1400, 79.6167, 350, 42000,9400, 1),
  ('Huzurnagar',    'హుజూర్‌నగర్', 'Huzurnagar',   16.8833, 79.8833, 300, 9200, 2050, 2),
  ('Nakrekal',      'నక్రేకల్',    'Nakrekal',     16.9000, 79.7000, 300, 4100, 910,  2),
  ('Mothkur',       'మోత్కూర్',    'Mothkur',      17.0500, 79.5500, 300, 5800, 1290, 2),
  ('Miryalaguda',   'మిర్యాలగూడ', 'Miryalaguda',  16.8667, 79.5667, 350, 55000,12200,1),
  ('Nalgonda',      'నల్గొండ',     'Nalgonda',     17.0500, 79.2667, 400, 90000,20000,1),
  ('Bhuvanagiri',   'భువనగిరి',    'Bhuvanagiri',  17.5000, 78.8833, 350, 35000,7800, 1),
  ('Yadagirigutta', 'యాదగిరిగుట్ట','Yadagirigutta',17.5767, 78.9300, 300, 9500, 2110, 2),
  ('Nampally',      'నాంపల్లి',    'Madhira',      16.9500, 80.3200, 250, 2800, 620,  3)
) as v(name, name_te, mandal, lat, lng, rad, pop, hh, prio)
on conflict do nothing;

-- =============================================================================
-- LDM PROFILE
-- =============================================================================

insert into cfl_profiles (employee_id, full_name, mobile, email, role, designation, whatsapp_number)
values (
  'LDM-KMM-001',
  'Sri P. Venkata Ramana',
  '9000000001',
  'ldm.khammam@nabard.org',
  'ldm',
  'Lead District Manager – Khammam',
  '9000000001'
) on conflict (employee_id) do nothing;

-- =============================================================================
-- COUNSELORS  (2 per CFL centre = 12 total)
-- =============================================================================

with centres as (
  select code, id from cfl_centres
)
insert into cfl_profiles (employee_id, full_name, mobile, email, role, cfl_centre_id, designation, whatsapp_number, joining_date)
select emp.eid, emp.name, emp.mobile, emp.email, 'counselor'::cfl_user_role, c.id, 'CFL Counselor', emp.mobile, emp.jdate::date
from centres c,
lateral (values
  -- CFL-KMM-01
  ('CFL-KMM-01','CSL-KMM-0101','G. Suresh Kumar',      '9849100001','suresh.k@cfl.in','2021-06-01'),
  ('CFL-KMM-01','CSL-KMM-0102','T. Hymavathi',         '9849100002','hymavathi.t@cfl.in','2022-01-15'),
  -- CFL-KMM-02
  ('CFL-KMM-02','CSL-KMM-0201','M. Ravi Shankar',      '9849200001','ravi.m@cfl.in','2020-09-01'),
  ('CFL-KMM-02','CSL-KMM-0202','B. Sunitha Rani',      '9849200002','sunitha.b@cfl.in','2021-03-01'),
  -- CFL-KMM-03
  ('CFL-KMM-03','CSL-KMM-0301','K. Nagarjuna Reddy',   '9849300001','nagarjuna.k@cfl.in','2021-07-01'),
  ('CFL-KMM-03','CSL-KMM-0302','P. Vijaya Lakshmi',    '9849300002','vijaya.p@cfl.in','2022-02-01'),
  -- CFL-KMM-04
  ('CFL-KMM-04','CSL-KMM-0401','A. Krishna Mohan',     '9849400001','krishna.a@cfl.in','2020-04-01'),
  ('CFL-KMM-04','CSL-KMM-0402','S. Padmavathi',        '9849400002','padmavathi.s@cfl.in','2021-08-01'),
  -- CFL-KMM-05
  ('CFL-KMM-05','CSL-KMM-0501','V. Srinivas Rao',      '9849500001','srinivas.v@cfl.in','2022-03-01'),
  ('CFL-KMM-05','CSL-KMM-0502','D. Kavitha',           '9849500002','kavitha.d@cfl.in','2022-06-01'),
  -- CFL-KMM-06
  ('CFL-KMM-06','CSL-KMM-0601','R. Bhaskar Rao',       '9849600001','bhaskar.r@cfl.in','2021-01-01'),
  ('CFL-KMM-06','CSL-KMM-0602','N. Swapna',            '9849600002','swapna.n@cfl.in','2021-11-01')
) as emp(ccode, eid, name, mobile, email, jdate)
where c.code = emp.ccode
on conflict (employee_id) do nothing;

-- =============================================================================
-- SAMPLE ASSIGNMENTS  (today + next 7 days)
-- =============================================================================

with counselors as (
  select id, cfl_centre_id, row_number() over (partition by cfl_centre_id order by employee_id) as rn
  from cfl_profiles where role = 'counselor'
),
villages as (
  select id, cfl_centre_id, row_number() over (partition by cfl_centre_id order by priority, name) as rn
  from cfl_villages where is_active
),
ldm as (select id from cfl_profiles where role = 'ldm' limit 1)
insert into cfl_assignments (counselor_id, village_id, scheduled_date, camp_topic, awareness_category, target_participants, created_by)
select c.id, v.id,
  current_date + (v.rn % 7) as scheduled_date,
  (array['Savings & Deposits','Credit Awareness','Insurance Benefits','Digital Payments',
         'Pension Schemes','Government Schemes','Debt Management','Mutual Funds',
         'SHG Linkage','Jan Dhan Accounts'])[1 + (v.rn % 10)],
  (array['savings','credit','insurance','digital_payments','pension',
         'government_schemes','debt_management','investment','savings','credit'])[(v.rn % 10) + 1]::awareness_category,
  15 + (v.rn * 3 % 25),
  (select id from ldm)
from counselors c
join villages v on v.cfl_centre_id = c.cfl_centre_id and v.rn between 1 and 6
on conflict do nothing;
