# Prajadarbar — ప్రజాదర్బార్

**Grievance Redressal & Monitoring System**
Khammam District Administration · Government of Telangana, India

A complete bilingual (Telugu + English), mobile-first, real-time grievance
redressal platform for citizens, departments, HoDs, the District Collector
and field/mandal officers. Citizens lodge grievances against any government
department; the administration must resolve them within a maximum of 90 days.

> Built on a deliberately simple stack — **static HTML/JS PWA + Supabase**
> (Postgres, RLS, Realtime, Auth, Storage). No build step, no backend server,
> drag-and-drop deployable on Vercel/Netlify/NIC Cloud.

---

## What's included

| Area | File / Module |
|---|---|
| Database schema (Postgres) | `db/schema.sql` |
| Row-Level-Security policies | `db/rls.sql` |
| Seed data — 24 Khammam mandals, 18 departments, 48 schemes, 20 sample grievances | `db/seed.sql` |
| Demo-user profiles | `db/setup_demo_users.sql` |
| Citizen home (live KPIs + feed) | `index.html` |
| Lodge grievance (Telugu voice + GPS + uploads) | `register.html` |
| Track grievance (timeline, attachments, feedback) | `track.html` |
| Public transparency dashboard (anonymised) | `transparency.html` |
| Officer / HoD / Field inbox (status update, reassign, GPS proof) | `officer.html`, `hod.html`, `field.html` |
| District Collector dashboard (KPIs, charts, mandal heatmap, Excel + PDF export) | `collector.html` |
| Auth + demo-role login | `login.html` |
| PWA manifest + service worker (offline shell) | `manifest.webmanifest`, `sw.js` |
| SMS / WhatsApp gateway adapter | `js/notifications.js` |
| Bilingual UI strings | `js/i18n.js` |

All status changes propagate **live** through Supabase Realtime — the citizen
tracking page, the officer inbox and the Collector dashboard all update within
a couple of seconds without any reloads.

---

## Quick start (5 minutes, no servers needed)

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Choose region `Mumbai (ap-south-1)` (closest to Telangana).
3. Note **Project URL** and **anon (publishable) key**.

### 2. Run the database scripts

In **SQL editor**, paste and run *in this order*:

```text
db/schema.sql            ← tables, enums, triggers, views
db/rls.sql               ← row-level-security policies + RPC
db/seed.sql              ← Khammam mandals, departments, 20 sample grievances
```

Then create a public storage bucket called **`grievance-uploads`**
(Storage → New bucket → name=`grievance-uploads`, public=ON).

### 3. (Optional) Create demo accounts

Authentication → Users → **Add user** with these emails (password
`Demo@2026` for all of them, or anything you prefer):

```
citizen@prajadarbar.demo
officer.revenue@prajadarbar.demo
officer.housing@prajadarbar.demo
hod.revenue@prajadarbar.demo
collector@prajadarbar.demo
field.tirumalayapalem@prajadarbar.demo
```

Then in SQL editor run **`db/setup_demo_users.sql`** to upgrade each profile
with the right role/department/mandal.

> **Or** skip this step entirely. With `DEMO_MODE = true` (the default),
> the login page lets you act as any role with one click — perfect for
> demoing to the District Collector.

### 4. Configure the front-end

Open **`config.js`** and paste your Supabase URL and anon key:

```js
SUPABASE_URL: "https://xxxxx.supabase.co",
SUPABASE_KEY: "sb_publishable_…",
```

You can also fill in MSG91 / WhatsApp Cloud / email keys (optional). When
they are blank the app simulates outbound messages and writes them to the
`notifications` table — the timeline still updates live.

### 5. Deploy

Drag every file in this folder into a GitHub repo (or push it). On Vercel:

1. **Add new → Project**, import the repo.
2. Framework preset: **Other** · Build command: *(empty)* · Output: *(root)*.
3. **Deploy**.

You're live in ~30 seconds. The app is a PWA — citizens can install it from
the browser to their phone.

---

## Demo script (recommended walk-through)

1. **Citizen** — open `register.html`. Switch language to తెలుగు. Tap
   "🎙️ Speak in Telugu" and dictate a complaint. Capture GPS, attach a
   photo, submit. Note the new `PJD-KMM-2026-…` ID.
2. **Citizen** — open `track.html?gid=…&m=…` — tracking link is sent in
   the simulated SMS/WhatsApp. Watch the timeline update in real time.
3. **Officer (Revenue)** — `login.html` → "Officer · Revenue" → `officer.html`.
   Inbox is filtered to Revenue. Open the new grievance, change status to
   *In Progress*, attach a photo with GPS.
4. **Field officer (Tirumalayapalem)** — open `field.html` from the demo
   role-picker. Inbox is now mandal-scoped. Mark as *Field Verified* with
   GPS-tagged proof.
5. **Collector** — open `collector.html`. The KPI tiles, the
   department-wise stacked bar, the SLA donut, and the **mandal heatmap**
   already reflect the new grievance. Switch the heatmap metric to
   `overdue`. Click **Export to PDF** for a DCC/DLRC-style review document
   or **Export to Excel** for the snapshot + per-department + per-mandal
   sheets.
6. Back in **citizen tracking**, mark the grievance closed and rate ★★★★★.
   Watch the rating reflect on the Collector dashboard immediately.

---

## Folder structure

```
.
├── index.html               citizen home
├── register.html            grievance form (voice + GPS + uploads)
├── track.html               public tracker
├── transparency.html        anonymised public stats
├── login.html               OTP / password / demo-role login
├── officer.html             department officer inbox
├── field.html               field/mandal officer inbox
├── hod.html                 head-of-department dashboard
├── collector.html           district-wide dashboard + exports
├── config.js                app + Supabase configuration
├── manifest.webmanifest     PWA manifest
├── sw.js                    offline service worker
│
├── css/
│   └── app.css              global styles (mobile-first)
│
├── js/
│   ├── i18n.js              bilingual strings + helpers
│   ├── supabase-init.js     Supabase client bootstrap
│   ├── utils.js             DOM, GPS, SLA, helpers
│   ├── auth.js              Auth + demo-role login
│   ├── api.js               typed data-access layer
│   ├── notifications.js     SMS / WhatsApp / email adapter
│   ├── register-page.js
│   ├── track-page.js
│   ├── officer-page.js      (also used by hod.html and field.html)
│   ├── transparency-page.js
│   └── collector-page.js
│
├── db/
│   ├── schema.sql
│   ├── rls.sql
│   ├── seed.sql
│   └── setup_demo_users.sql
│
└── assets/
    ├── icon-192.svg
    └── icon-512.svg
```

---

## Architecture

```
+----------------+       +-------------------+        +------------------+
| Citizens (PWA) |  -->  |   Supabase API    |  -->   | Postgres + RLS   |
| Officer / HoD  |  -->  | (REST + Realtime) |  <-->  | + Triggers       |
| Field officer  |  -->  |                   |        | + Views (KPIs)   |
| Collector      |       +-------------------+        +------------------+
+----------------+              |   ^
                                v   |
                       +-------------------+
                       |  Supabase Storage |   ← citizen proofs +
                       |  (grievance-      |     officer field photos
                       |   uploads bucket) |     (GPS-tagged)
                       +-------------------+
                                |
                                v
        +---------------------------------------------+
        |  Notification queue (SMS / WhatsApp / Email)|
        |  → MSG91 / WA Cloud API / Edge Function     |
        +---------------------------------------------+
```

### SLA model

| Age (days) | Colour | Meaning |
|---|---|---|
| 0 – 30  | 🟢 Green     | Healthy |
| 30 – 60 | 🟡 Amber     | Watch |
| 60 – 90 | 🟠 Red       | Critical attention |
| > 90    | 🔴 Breach    | SLA violated, auto-escalates |

`v_grievance_kpis`, `v_dept_kpis`, `v_mandal_kpis` are SQL views that
recompute these bands on every query, so dashboards never go stale.

### Lifecycle

```
Registered → Acknowledged → Assigned → In-Progress → Field-Verified → Resolved → Closed
                                                                    ↘  Re-opened (within 15d)
                                                                    ↘  Rejected
                                                                    ↘  Escalated  (auto at 30/60/90)
```

Every transition writes an immutable row in `grievance_history` (auto-trigger),
so the audit log is tamper-evident.

### Roles & permissions

| Role | Sees | Can change |
|---|---|---|
| Citizen / anon | Public + their own grievance via mobile + GID | Insert grievance, submit feedback |
| Officer | Grievances of their department | Status, remarks, attach action photo |
| Field officer | Grievances of their mandal | Status, mark *field verified* with GPS proof |
| HoD | All grievances of their department | Reassign, escalate |
| Collector / Admin | District-wide | Anything |

Enforced both in JS (UI guard) and in Postgres (RLS in `db/rls.sql`).

---

## Production hardening checklist

- [ ] Switch `DEMO_MODE = false` in `config.js`.
- [ ] Tighten RLS in `db/rls.sql`:
  - Replace `griev_read_anyone` with the RPC
    `get_grievance_for_citizen(mobile, gid)` only.
  - Restrict `attach_insert_anyone` to authenticated users.
- [ ] Move SMS/WhatsApp keys out of `config.js` into a Supabase Edge
  Function and have the queue worker call MSG91 / WhatsApp Cloud API
  with those secrets.
- [ ] Plug in NLP-based auto-classification of grievance descriptions to
  pre-fill `department_id` and `subject_id` (current code keeps that
  hook open in `js/api.js` `createGrievance`).
- [ ] Add Aadhaar e-KYC consent workflow if required by district admin.
- [ ] Wire the existing audit-log triggers into a periodic anomaly /
  recurring-complaint hotspot detector for the Collector dashboard.

---

## Support

For demos to the District Collector or integration with the
Telangana CM Dashboard / Praja Vani / MeeSeva — see `docs/INTEGRATION.md`.
