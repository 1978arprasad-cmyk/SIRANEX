# CFL Counselor GPS Monitoring & Camp Verification System
## Khammam District, Telangana — NABARD

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   CFL GPS MONITORING SYSTEM                      │
│                   Khammam District, Telangana                    │
├─────────────────┬───────────────────────┬───────────────────────┤
│  LDM DASHBOARD  │    COUNSELOR APP       │    ANALYTICS          │
│ ldm-dashboard   │  counselor-app.html    │  cfl-analytics.html   │
│    .html         │  (PWA / Android)       │                       │
├─────────────────┴───────────────────────┴───────────────────────┤
│                         JAVASCRIPT MODULES                        │
│  gps-engine.js │ geofence-engine.js │ spoofing-detector.js       │
│  alert-engine.js │ camp-reporter.js │ cfl-reports.js             │
│  ldm-page.js │ counselor-page.js │ cfl-analytics-page.js        │
├──────────────────────────────────────────────────────────────────┤
│                     SUPABASE (BACKEND)                            │
│  PostgreSQL DB │ Auth │ Storage │ Realtime WebSockets            │
│  Edge Functions │ Row Level Security │ Triggers                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Setup Instructions

### 1. Database Setup

Run in Supabase SQL Editor in order:

```bash
# 1. Main Prajadarbar schema (existing)
db/schema.sql

# 2. CFL GPS system tables
db/cfl_schema.sql

# 3. Row Level Security
db/cfl_rls.sql

# 4. Seed data (6 CFL centres + 12 counselors + 72 villages)
db/cfl_seed.sql
```

### 2. Supabase Storage Bucket

Create a storage bucket named `cfl-uploads` with:
- Public access: YES (for photo URLs)
- Max file size: 5MB
- Allowed MIME types: image/jpeg, image/png

### 3. Enable Realtime

In Supabase Dashboard → Database → Replication, enable realtime for:
- `cfl_gps_tracking`
- `cfl_counselor_live_status`
- `cfl_alerts`
- `cfl_geofence_events`

### 4. Configure config.js

The system uses the existing `PRAJA_CONFIG.SUPABASE_URL` and `SUPABASE_KEY` from `config.js`. No separate config needed.

---

## Pages

| Page | URL | Role |
|------|-----|------|
| Login | `/cfl-login.html` | All |
| LDM Command Dashboard | `/ldm-dashboard.html` | LDM |
| Counselor Field App | `/counselor-app.html` | Counselor |
| Assignment Management | `/cfl-assignments.html` | LDM |
| Analytics & Reports | `/cfl-analytics.html` | LDM |

---

## Key Features

### GPS Tracking
- Continuous GPS pings every 2 minutes (30s when moving)
- Offline queue via IndexedDB — auto-syncs when online
- Battery-level monitoring
- Screen wake-lock to prevent GPS sleep
- Background sync registration

### Anti-Fake / Anti-Spoofing (8 signals)
1. GPS accuracy too perfect (< 5m suspicious)
2. Impossible speed (> 200 km/h)
3. Speed field claims 0 but position changed
4. Round coordinates (mocked apps use integer lat/lng)
5. Zero altitude with zero altitudeAccuracy
6. Frozen coordinates (same point 3+ pings)
7. Non-mobile device detected
8. GPS timestamp drift from device clock

### Geofencing
- Haversine formula distance calculation
- Auto check-in when counselor enters village (default 300m radius)
- Auto check-out when leaving
- Minimum stay validation (20 minutes)
- Assignment-linked geofence confirmation

### Camp Verification
- Live camera capture only (no gallery upload)
- GPS embedded at time of photo capture
- Timestamp watermark on photo
- SHA-256 exact duplicate detection
- Perceptual hash (8x8) near-duplicate detection
- Location match validation (photo GPS vs village GPS)
- Minimum 2 photos required per camp

### Alert System (11 alert types)
- `gps_offline` — GPS inactive > 30 min during field hours
- `no_movement` — Counselor idle > 45 min
- `missed_village` — Assigned village not visited by 5 PM
- `fake_location` — GPS spoofing detected
- `no_camp` — No camp by 3 PM on working day
- `app_not_opened` — No GPS ping all day
- `suspicious_photo` — Photo validation issues
- `geofence_violation` — Camp report without geofence entry
- `short_camp_duration` — Camp < 30 minutes
- `duplicate_photo` — Same/similar photo reused
- `out_of_field_hours` — Activity outside 8 AM – 6 PM

### Performance Scoring (Monthly)
| Component | Weight |
|-----------|--------|
| Village Visit (visited/assigned) | 25% |
| GPS Compliance | 20% |
| Camp Quality (duration, participants) | 20% |
| Travel Coverage (km) | 15% |
| Reporting Discipline | 10% |
| Participant Reach | 10% |

Grades: A+ (90+), A (80+), B (70+), C (60+), D (50+), F (<50)

---

## District Data

### 6 CFL Centres
| Code | Centre | Mandal | Coordinates |
|------|--------|--------|-------------|
| CFL-KMM-01 | CFL Khammam Urban | Khammam | 17.2473, 80.1514 |
| CFL-KMM-02 | CFL Kothagudem | Kothagudem | 17.5536, 80.6228 |
| CFL-KMM-03 | CFL Bhadrachalam | Bhadrachalam | 17.6688, 80.8876 |
| CFL-KMM-04 | CFL Sattupalli | Sattupalli | 16.9778, 80.8844 |
| CFL-KMM-05 | CFL Yellandu | Yellandu | 17.5897, 80.3217 |
| CFL-KMM-06 | CFL Madhira | Madhira | 16.9167, 80.3667 |

### 12 Counselors (2 per centre)
- Employee IDs: CSL-KMM-0101 through CSL-KMM-0602

### 72 Villages (12 per centre)
- Each with geofence radius (250–400m), population, and priority

---

## Report Types

| Report | Format | Who |
|--------|--------|-----|
| Daily District Summary | PDF | LDM |
| GPS Track per Counselor | Excel | LDM |
| Camp Verification Report | Excel | LDM |
| Suspicious Activity | Excel | LDM |
| Monthly Performance | PDF | LDM |
| Village Visit Report | Excel | LDM |

---

## Mobile App (PWA) Installation

1. Open `counselor-app.html` in Chrome on Android
2. Tap browser menu → "Add to Home Screen"
3. Accept install prompt
4. App appears on home screen with standalone mode
5. GPS tracking continues while app is open
6. Background Sync handles offline data when connection returns

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend (Mobile App) | HTML5 PWA + Vanilla JS |
| Frontend (Dashboard) | HTML5 + Chart.js + Leaflet.js |
| Maps | Leaflet.js + OpenStreetMap |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (OTP + Password) |
| Storage | Supabase Storage |
| Realtime | Supabase Realtime (WebSockets) |
| Offline | IndexedDB + Background Sync |
| Export | SheetJS (Excel) + jsPDF (PDF) |
| GPS | Web Geolocation API |
| Camera | MediaDevices API |

---

## Security Measures

1. **Device binding** — Device ID stored in localStorage, tracked per counselor
2. **IP logging** — All requests logged via Supabase audit
3. **GPS spoofing** — 8-signal composite detection
4. **Photo authenticity** — Live capture enforced, duplicate detection
5. **Location cross-validation** — Photo GPS vs village GPS vs geofence
6. **Timestamp verification** — Server time vs device time comparison
7. **RLS policies** — Row-level data access control in PostgreSQL
8. **Geofence double-verification** — Camp reports cross-checked against geofence events

---

*Built for Khammam District Administration, Telangana. Scalable for all NABARD CFL districts.*
