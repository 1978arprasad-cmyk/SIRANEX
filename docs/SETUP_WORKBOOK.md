# 📘 CFL GPS MONITORING SYSTEM
# COMPLETE SETUP WORKBOOK
## Step-by-Step Guide for First-Time Setup

### Khammam District, Telangana — NABARD

---

> 👶 **This guide is written for someone who has never done this before.**
> Every single step is explained. Follow each step one by one.
> Do NOT skip any step. Tick each checkbox ✅ as you complete it.

---

## 🧰 WHAT YOU NEED BEFORE STARTING

| Item | Details |
|------|---------|
| 💻 Computer | A laptop or desktop. Windows or Mac both work. |
| 🌐 Internet | Stable internet connection |
| 📧 Email ID | Your personal email (Gmail is fine) |
| ⏰ Time | About 1 hour total to complete everything |

**You do NOT need:**
- ❌ Any programming knowledge
- ❌ Any server or hosting machine
- ❌ Any software installation on your computer

---

---

# 📦 PART 1 — SUPABASE (Your Database & Backend)

> 🧠 **What is Supabase?**
> Think of Supabase like a Google Sheet that lives on the internet.
> It stores all the GPS locations, camp reports, counselor data —
> everything. It is FREE for our usage.

---

## STEP 1 — Create Your Supabase Account

- [ ] **1.1** Open your web browser (Chrome recommended)

- [ ] **1.2** Go to this website:
  ```
  https://supabase.com
  ```

- [ ] **1.3** Click the big green button that says **"Start your project"**

- [ ] **1.4** Click **"Sign up"**

- [ ] **1.5** Click **"Continue with GitHub"** OR enter your email + create a password
  > 💡 Using Gmail? Click "Continue with Google" if available

- [ ] **1.6** Check your email inbox — Supabase will send a confirmation email

- [ ] **1.7** Click the link in that email to confirm your account

- [ ] **1.8** You are now logged into Supabase ✅

---

## STEP 2 — Create a New Project

> ⚠️ **IMPORTANT:** The system already has a Supabase project from the
> Prajadarbar system. You will use THE SAME project. Skip to Step 2.5.
> If you are starting fresh, follow all steps.

- [ ] **2.1** After logging in, you will see a page that says "Your Projects"

- [ ] **2.2** Click the green button **"+ New Project"**

- [ ] **2.3** Fill in these details:
  - **Name:** `SIRANEX-Khammam`
  - **Database Password:** Create a strong password (write it down!)
    > Example: `Khammam@GPS2024` — save this somewhere safe!
  - **Region:** Select `Southeast Asia (Singapore)` — closest to India

- [ ] **2.4** Click **"Create new project"**
  > ⏳ Wait 2–3 minutes. You will see a loading screen. This is normal.

- [ ] **2.5** Your project is ready when you see a green checkmark ✅

---

## STEP 3 — Get Your Project Credentials

> 🔑 **What are credentials?**
> Think of these like your project's username and password.
> The app needs these to connect to your database.

- [ ] **3.1** Inside your Supabase project, look at the left sidebar

- [ ] **3.2** Click the **⚙️ Settings** icon (gear icon at the bottom of sidebar)

- [ ] **3.3** Click **"API"** in the settings menu

- [ ] **3.4** You will see two important values. **Copy them and save them:**

  ```
  PROJECT URL:  https://xxxxxxxxx.supabase.co
                (copy this — your URL will be different)

  ANON PUBLIC KEY:  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVC...
                    (copy this long key)
  ```
  > 📝 Open Notepad on your computer and paste both values there.
  > Save the Notepad file as "supabase-credentials.txt"

- [ ] **3.5** Done — you have your credentials ✅

---

## STEP 4 — Run the Database Setup (Part 1 of 3)

> 🧠 **What is this?**
> We are creating all the "tables" (like spreadsheet sheets) that the
> GPS system needs. This is done by running SQL code.
> SQL is just instructions that tell the database what to create.

- [ ] **4.1** In Supabase, click **"SQL Editor"** in the left sidebar
  > It looks like a code/terminal icon — `< >`

- [ ] **4.2** You will see a white text box where you can type

- [ ] **4.3** Now you need to get the first SQL file.
  Open this URL in a new browser tab:
  ```
  https://github.com/1978arprasad-cmyk/SIRANEX/blob/claude/gps-counselor-monitoring-QM3hg/db/cfl_schema.sql
  ```

- [ ] **4.4** On that page, click the button that says **"Raw"**
  > (It's a small button near the top right of the code)

- [ ] **4.5** Press **Ctrl+A** (select all text), then **Ctrl+C** (copy)

- [ ] **4.6** Go back to the Supabase SQL Editor tab

- [ ] **4.7** Click inside the white text box

- [ ] **4.8** Press **Ctrl+A** to select anything there, then press **Delete**

- [ ] **4.9** Press **Ctrl+V** to paste the code you copied

- [ ] **4.10** Click the green **"Run"** button (bottom right of the editor)
  > ⏳ Wait 5–10 seconds

- [ ] **4.11** At the bottom you should see: **"Success. No rows returned"**
  > ✅ If you see this, it worked!
  > ❌ If you see a red error — scroll down to the TROUBLESHOOTING section

---

## STEP 5 — Run the Database Setup (Part 2 of 3) — Security Rules

- [ ] **5.1** Click **"New Query"** button at the top of SQL Editor
  > (It creates a new blank text box)

- [ ] **5.2** Open this URL in a new browser tab:
  ```
  https://github.com/1978arprasad-cmyk/SIRANEX/blob/claude/gps-counselor-monitoring-QM3hg/db/cfl_rls.sql
  ```

- [ ] **5.3** Click **"Raw"**, select all, copy

- [ ] **5.4** Paste into the SQL Editor (new blank query)

- [ ] **5.5** Click **"Run"** — wait for "Success" message ✅

---

## STEP 6 — Run the Database Setup (Part 3 of 3) — Fill with Data

> 🧠 **What is this?**
> This adds the starting data — your 6 CFL centres, 12 counselors,
> 72 villages with GPS coordinates, and the LDM profile.

- [ ] **6.1** Click **"New Query"** again

- [ ] **6.2** Open this URL:
  ```
  https://github.com/1978arprasad-cmyk/SIRANEX/blob/claude/gps-counselor-monitoring-QM3hg/db/cfl_seed.sql
  ```

- [ ] **6.3** Click **"Raw"**, select all, copy, paste into SQL Editor

- [ ] **6.4** Click **"Run"** — wait for "Success" message ✅

- [ ] **6.5** Let's verify the data was added correctly:
  Click **"New Query"** and paste this simple code:
  ```sql
  select count(*) as centres   from cfl_centres;
  select count(*) as counselors from cfl_profiles where role = 'counselor';
  select count(*) as villages   from cfl_villages;
  ```
  Click **Run** — you should see: **6 centres, 12 counselors, 72 villages** ✅

---

## STEP 7 — Create Photo Storage (Bucket)

> 🧠 **What is this?**
> The app saves camp photos. We need a "folder" on the internet
> to store these photos. This folder is called a "bucket".

- [ ] **7.1** In Supabase left sidebar, click **"Storage"**
  > (It looks like a box/bucket icon)

- [ ] **7.2** Click **"+ New bucket"**

- [ ] **7.3** Fill in:
  - **Bucket name:** `cfl-uploads`
    > ⚠️ Type this EXACTLY — small letters, hyphen between words
  - **Public bucket:** Turn this **ON** (toggle to green)

- [ ] **7.4** Click **"Save"**

- [ ] **7.5** You should see `cfl-uploads` in the bucket list ✅

---

## STEP 8 — Enable Real-Time Tracking

> 🧠 **What is this?**
> This makes the LDM dashboard update automatically when a counselor
> moves. Without this, you would have to refresh the page manually.

- [ ] **8.1** In Supabase, click **"Database"** in the left sidebar

- [ ] **8.2** Click **"Replication"**

- [ ] **8.3** You will see a list of tables. Find and turn ON the toggle for:
  - `cfl_gps_tracking` → turn ON ✅
  - `cfl_counselor_live_status` → turn ON ✅
  - `cfl_alerts` → turn ON ✅
  - `cfl_geofence_events` → turn ON ✅
  - `cfl_camp_reports` → turn ON ✅

- [ ] **8.4** Done! Real-time is now enabled ✅

---

---

# 🌐 PART 2 — VERCEL (Your Website Hosting)

> 🧠 **What is Vercel?**
> Think of Vercel like a plot of land on the internet.
> You put your website files there, and anyone in the world
> can access it with a link. It is FREE.

---

## STEP 9 — Create Your Vercel Account

- [ ] **9.1** Open a new browser tab

- [ ] **9.2** Go to:
  ```
  https://vercel.com
  ```

- [ ] **9.3** Click **"Sign Up"**

- [ ] **9.4** Click **"Continue with GitHub"**
  > 🧠 You need a GitHub account for this.
  > If you don't have one, go to github.com and create a free account first.
  > Use the same email as your Supabase account.

- [ ] **9.5** Allow Vercel to access your GitHub account (click "Authorize")

- [ ] **9.6** You are now in Vercel ✅

---

## STEP 10 — Deploy Your Website

- [ ] **10.1** In Vercel, click **"Add New..."** → **"Project"**

- [ ] **10.2** You will see a list of GitHub repositories

- [ ] **10.3** Find **"SIRANEX"** in the list and click **"Import"**
  > If you don't see it, click "Adjust GitHub App Permissions"
  > and give Vercel access to the SIRANEX repository

- [ ] **10.4** On the next screen:
  - **Framework Preset:** Select **"Other"**
  - **Root Directory:** Leave as `.` (dot — means the main folder)
  - Leave everything else as default

- [ ] **10.5** Click **"Deploy"**

- [ ] **10.6** Wait 1–2 minutes. You will see a big checkmark and confetti 🎉

- [ ] **10.7** Vercel gives you a website link like:
  ```
  https://siranex-xxxx.vercel.app
  ```
  **Copy this link and save it in your Notepad file**

- [ ] **10.8** Your website is now live on the internet ✅

---

---

# ⚙️ PART 3 — CONNECT DATABASE TO WEBSITE

> 🧠 **Why is this needed?**
> Right now, the website and database don't know about each other.
> We need to tell the website: "Your database is at THIS address."
> We do this by updating one file called `config.js`.

---

## STEP 11 — Update the Configuration File

- [ ] **11.1** Open a new browser tab and go to:
  ```
  https://github.com/1978arprasad-cmyk/SIRANEX
  ```

- [ ] **11.2** Make sure you are on the correct branch. Look for a dropdown
  near the top that shows the branch name. Click it and select:
  ```
  claude/gps-counselor-monitoring-QM3hg
  ```

- [ ] **11.3** Click on the file named **`config.js`**

- [ ] **11.4** Click the **pencil icon ✏️** (Edit this file) — top right of file

- [ ] **11.5** Find these two lines (they are near the top):
  ```javascript
  SUPABASE_URL: "https://tswkudgfmsktqfbfychc.supabase.co",
  SUPABASE_KEY: "sb_publishable_yViaFwkoYkzR8o2OJZCYYg_E7Phb-U8",
  ```

- [ ] **11.6** Replace the URL and KEY with YOUR values from Step 3.4:
  ```javascript
  SUPABASE_URL: "https://YOUR-PROJECT-ID.supabase.co",
  SUPABASE_KEY: "YOUR-ANON-PUBLIC-KEY-HERE",
  ```
  > ⚠️ Keep the quotes `"..."` around the values. Just replace what's inside.

- [ ] **11.7** Scroll down on GitHub and click **"Commit changes"**

- [ ] **11.8** A small box appears — click **"Commit changes"** again to confirm

- [ ] **11.9** Wait 2 minutes — Vercel will automatically update your website ✅

---

## STEP 12 — Add Your Counselor Mobile Numbers

> 🧠 **Why is this needed?**
> The counselors log in using their mobile numbers.
> We need to add their mobile numbers to the database.

- [ ] **12.1** Go back to Supabase → SQL Editor → New Query

- [ ] **12.2** The seed data already added 12 demo counselors.
  To update their real mobile numbers, run this (one at a time for each counselor):

  ```sql
  -- Update mobile number for a counselor (replace values below)
  UPDATE cfl_profiles
  SET mobile = '9849100001'        -- ← replace with real mobile number
  WHERE employee_id = 'CSL-KMM-0101';  -- ← replace with employee ID
  ```

  > 📋 **Employee ID Reference:**
  > | Employee ID | Centre | Name in System |
  > |------------|--------|---------------|
  > | CSL-KMM-0101 | CFL Khammam | G. Suresh Kumar |
  > | CSL-KMM-0102 | CFL Khammam | T. Hymavathi |
  > | CSL-KMM-0201 | CFL Kothagudem | M. Ravi Shankar |
  > | CSL-KMM-0202 | CFL Kothagudem | B. Sunitha Rani |
  > | CSL-KMM-0301 | CFL Bhadrachalam | K. Nagarjuna Reddy |
  > | CSL-KMM-0302 | CFL Bhadrachalam | P. Vijaya Lakshmi |
  > | CSL-KMM-0401 | CFL Sattupalli | A. Krishna Mohan |
  > | CSL-KMM-0402 | CFL Sattupalli | S. Padmavathi |
  > | CSL-KMM-0501 | CFL Yellandu | V. Srinivas Rao |
  > | CSL-KMM-0502 | CFL Yellandu | D. Kavitha |
  > | CSL-KMM-0601 | CFL Madhira | R. Bhaskar Rao |
  > | CSL-KMM-0602 | CFL Madhira | N. Swapna |

- [ ] **12.3** Also update the LDM mobile number:
  ```sql
  UPDATE cfl_profiles
  SET mobile = '9000000001'    -- ← replace with YOUR mobile number
  WHERE role = 'ldm';
  ```

---

---

# 🖥️ PART 4 — OPEN AND USE THE SYSTEM

---

## STEP 13 — Open the LDM Dashboard (Your Command Centre)

- [ ] **13.1** On your computer, open Chrome browser

- [ ] **13.2** Go to your Vercel link + `/ldm-dashboard.html`
  Example:
  ```
  https://siranex-xxxx.vercel.app/ldm-dashboard.html
  ```

- [ ] **13.3** You should see:
  - 🗺 A map of Khammam district
  - 8 KPI tiles at the top (total counselors, active now, etc.)
  - A list of counselors on the left side
  - An alerts panel on the right side

- [ ] **13.4** If the map loads and you see the data — **SUCCESS!** 🎉

---

## STEP 14 — Install Counselor App on Android Phone

> 📱 **Do this on each counselor's phone**

- [ ] **14.1** On the Android phone, open **Chrome browser**
  > ⚠️ Must be Chrome. Do NOT use Samsung Internet or other browsers.

- [ ] **14.2** Go to:
  ```
  https://siranex-xxxx.vercel.app/counselor-app.html
  ```
  (Use your actual Vercel link)

- [ ] **14.3** Wait for the page to fully load

- [ ] **14.4** Tap the **3 dots menu (⋮)** at the top right of Chrome

- [ ] **14.5** Tap **"Add to Home screen"**

- [ ] **14.6** A box appears — tap **"Add"**

- [ ] **14.7** The app icon now appears on the phone's home screen
  (It will look like a proper app icon)

- [ ] **14.8** Tap the new app icon to open it

- [ ] **14.9** The counselor enters their **10-digit mobile number**

- [ ] **14.10** They tap **"Send OTP"**

- [ ] **14.11** They enter the OTP received on SMS

- [ ] **14.12** They are now logged in and GPS tracking begins ✅

---

## STEP 15 — Allow Location Permission (VERY IMPORTANT)

> ⚠️ **GPS tracking will NOT work without this permission**

- [ ] **15.1** When the counselor app opens for the first time,
  Chrome will ask: **"Allow location access?"**

- [ ] **15.2** Tap **"Allow while using the app"** or **"Always Allow"**
  > Choose "Always Allow" for best results

- [ ] **15.3** Also check Android Settings:
  - Go to phone **Settings**
  - Tap **Apps**
  - Find **Chrome**
  - Tap **Permissions**
  - Tap **Location**
  - Select **"Allow all the time"**

- [ ] **15.4** GPS tracking is now active ✅

---

## STEP 16 — Allow Camera Permission

- [ ] **16.1** When counselor tries to submit a camp report and taps
  **"Open Camera"**, Chrome will ask for camera permission

- [ ] **16.2** Tap **"Allow"**

- [ ] **16.3** Camera is now ready for camp photo capture ✅

---

---

# 📊 PART 5 — DAILY USE INSTRUCTIONS

---

## 🟢 What the Counselor Does Every Day

| Time | Action |
|------|--------|
| **Before 8:00 AM** | Open the CFL app on their phone |
| **Morning** | Check today's assignments in the app |
| **While traveling** | App automatically tracks GPS — no action needed |
| **At the village** | App auto checks-in when they arrive |
| **During camp** | Submit camp report: fill form + take 2 photos with camera |
| **Leaving village** | App auto checks-out |
| **All day** | Keep the app open or minimized — do NOT close it |
| **Evening** | All data is saved and sent to LDM |

---

## 👁️ What the LDM Does Every Day

| Time | Action |
|------|--------|
| **Morning** | Open `ldm-dashboard.html` on computer |
| **Any time** | See which counselors are active on the map |
| **Any time** | Check the alerts panel for warnings |
| **Evening** | Check the counselors tab — who visited which villages |
| **Monthly** | Go to Analytics page → Download Performance Report (PDF) |

---

---

# 🔧 PART 6 — TROUBLESHOOTING

> 😰 **Something went wrong? Read this section.**

---

## ❌ Problem: "Error: No data" or blank dashboard

**Cause:** Database connection issue

**Solution:**
1. Go to Supabase → Settings → API
2. Copy the URL and KEY again
3. Update `config.js` on GitHub (repeat Step 11)
4. Wait 2 minutes and refresh the page

---

## ❌ Problem: SQL Error when running cfl_schema.sql

**Cause:** Schema might already exist (if running a second time)

**Solution:** Run this FIRST in SQL Editor:
```sql
-- This removes old CFL tables so you can start fresh
DROP TABLE IF EXISTS cfl_camp_photos CASCADE;
DROP TABLE IF EXISTS cfl_camp_reports CASCADE;
DROP TABLE IF EXISTS cfl_geofence_events CASCADE;
DROP TABLE IF EXISTS cfl_gps_tracking CASCADE;
DROP TABLE IF EXISTS cfl_alerts CASCADE;
DROP TABLE IF EXISTS cfl_assignments CASCADE;
DROP TABLE IF EXISTS cfl_daily_summaries CASCADE;
DROP TABLE IF EXISTS cfl_performance_scores CASCADE;
DROP TABLE IF EXISTS cfl_counselor_live_status CASCADE;
DROP TABLE IF EXISTS cfl_villages CASCADE;
DROP TABLE IF EXISTS cfl_profiles CASCADE;
DROP TABLE IF EXISTS cfl_centres CASCADE;
```
Then run the SQL files again from Step 4.

---

## ❌ Problem: GPS not tracking / "GPS Unavailable"

**Cause:** Location permission not given OR internet is off

**Solutions:**
1. Check internet connection on the phone
2. Check location permission (Step 15)
3. Go outside — GPS does not work well indoors
4. Restart the Chrome app on the phone
5. Check that Battery Saver mode is OFF
   (Battery Saver kills background apps)

---

## ❌ Problem: Counselor cannot login — "Mobile not registered"

**Cause:** Mobile number is not in the database

**Solution:** Run this in Supabase SQL Editor:
```sql
-- Check if the mobile number exists
SELECT * FROM cfl_profiles WHERE mobile = '9849100001';
-- (replace with the actual mobile number)
```
If no result, add/update the mobile number (follow Step 12).

---

## ❌ Problem: Photos not saving

**Cause:** Storage bucket not created or named wrongly

**Solution:**
1. Go to Supabase → Storage
2. Check if `cfl-uploads` bucket exists
3. If not, create it (repeat Step 7)
4. Make sure it is set to **Public**

---

## ❌ Problem: Vercel page shows "404 Not Found"

**Cause:** Wrong URL path

**Solution:** Make sure you are typing the FULL URL:
```
✅ CORRECT: https://siranex-xxxx.vercel.app/ldm-dashboard.html
❌ WRONG:   https://siranex-xxxx.vercel.app/ldm-dashboard
```
Always include `.html` at the end.

---

---

# 📞 PART 7 — QUICK REFERENCE CARD

> 🖨️ **Print this page and keep it on your desk**

---

## 🔗 Important Links

| What | Link |
|------|------|
| LDM Dashboard | `https://YOUR-VERCEL-LINK/ldm-dashboard.html` |
| Counselor App | `https://YOUR-VERCEL-LINK/counselor-app.html` |
| Assignments | `https://YOUR-VERCEL-LINK/cfl-assignments.html` |
| Analytics | `https://YOUR-VERCEL-LINK/cfl-analytics.html` |
| Login Page | `https://YOUR-VERCEL-LINK/cfl-login.html` |
| Supabase Admin | `https://supabase.com/dashboard` |

---

## 📱 Counselor App Status Meanings

| Color / Status | Meaning |
|----------------|---------|
| 🟢 Green — Active | Counselor is in the field and GPS is working |
| 🟡 Yellow — Idle | GPS is on but counselor not moving for 5+ min |
| 🔴 Red — Offline | GPS is off or app is closed for 10+ min |
| 🔵 Blue — Conducting Camp | Counselor is inside a village geofence |

---

## ⚠️ Alert Meanings

| Alert | What It Means | Action |
|-------|--------------|--------|
| GPS Offline | App closed / GPS off for 30 min | Call the counselor |
| No Movement | Not moving during field hours | Check if stuck or idle |
| Missed Village | Assigned village not visited by 5 PM | Ask for explanation |
| Fake Location | GPS spoofing detected | Serious — investigate |
| No Camp by 3 PM | No camp submitted yet | Check with counselor |
| Duplicate Photo | Same photo used twice | Serious — investigate |

---

## 📊 Monthly Reports — How to Download

| Report | Steps |
|--------|-------|
| **Performance Report (PDF)** | LDM Dashboard → Reports tab → Click "Monthly Performance" |
| **GPS Track (Excel)** | Reports tab → Select counselor + date → Click "GPS Track" |
| **Suspicious Activity (Excel)** | Reports tab → Click "Suspicious Activity" |
| **District Summary (PDF)** | Reports tab → Click "Daily District Summary" |

---

## 🏛 Your 6 CFL Centres — Quick Reference

| Code | Centre Name | Mandal |
|------|------------|--------|
| CFL-KMM-01 | CFL Khammam Urban | Khammam |
| CFL-KMM-02 | CFL Kothagudem | Kothagudem |
| CFL-KMM-03 | CFL Bhadrachalam | Bhadrachalam |
| CFL-KMM-04 | CFL Sattupalli | Sattupalli |
| CFL-KMM-05 | CFL Yellandu | Yellandu |
| CFL-KMM-06 | CFL Madhira | Madhira |

---

## 👤 Your 12 Counselors — Employee IDs

| Employee ID | Name | Centre |
|------------|------|--------|
| CSL-KMM-0101 | G. Suresh Kumar | Khammam |
| CSL-KMM-0102 | T. Hymavathi | Khammam |
| CSL-KMM-0201 | M. Ravi Shankar | Kothagudem |
| CSL-KMM-0202 | B. Sunitha Rani | Kothagudem |
| CSL-KMM-0301 | K. Nagarjuna Reddy | Bhadrachalam |
| CSL-KMM-0302 | P. Vijaya Lakshmi | Bhadrachalam |
| CSL-KMM-0401 | A. Krishna Mohan | Sattupalli |
| CSL-KMM-0402 | S. Padmavathi | Sattupalli |
| CSL-KMM-0501 | V. Srinivas Rao | Yellandu |
| CSL-KMM-0502 | D. Kavitha | Yellandu |
| CSL-KMM-0601 | R. Bhaskar Rao | Madhira |
| CSL-KMM-0602 | N. Swapna | Madhira |

---

## ✅ SETUP COMPLETION CHECKLIST

Use this to confirm everything is done before going live:

```
SUPABASE SETUP
  [ ] Supabase account created
  [ ] New project created
  [ ] cfl_schema.sql executed successfully
  [ ] cfl_rls.sql executed successfully
  [ ] cfl_seed.sql executed successfully
  [ ] 6 centres + 12 counselors + 72 villages verified
  [ ] cfl-uploads storage bucket created (public)
  [ ] Realtime enabled on 5 tables

VERCEL SETUP
  [ ] Vercel account created
  [ ] SIRANEX repository imported
  [ ] Website deployed — got .vercel.app link

CONFIGURATION
  [ ] config.js updated with correct Supabase URL + KEY
  [ ] Vercel redeployed with new config

COUNSELOR ONBOARDING (repeat for each counselor)
  [ ] Real mobile numbers updated in database
  [ ] App installed on Android phone (added to home screen)
  [ ] Location permission set to "Always Allow"
  [ ] Camera permission allowed
  [ ] Test login successful

LDM TESTING
  [ ] LDM dashboard opens on computer
  [ ] Map shows Khammam district
  [ ] Counselors visible in the list
  [ ] Test assignment created for tomorrow
  [ ] Test report downloaded
```

---

*CFL GPS Monitoring System — Khammam District, Telangana*
*NABARD | Built for district administration use*
*For technical help: Share your Vercel URL and describe the issue*
