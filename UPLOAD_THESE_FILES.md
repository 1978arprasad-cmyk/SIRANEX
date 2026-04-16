# Read me first (60 seconds)

You are one step away from a live, cross-device messaging app.

## Step 1 — Edit ONE file

Open **`config.js`** in any text editor (Notepad, VS Code, even
GitHub's web editor works).

You will see two lines that look like this:

```js
const SUPABASE_URL = "PASTE_YOUR_SUPABASE_URL_HERE";
const SUPABASE_KEY = "PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE";
```

- Replace the first placeholder with your Supabase project URL
  (e.g. `https://tswkudgfmsktqfbfychc.supabase.co`)
- Replace the second placeholder with your publishable key
  (the long string that starts with `sb_publishable_...`)

Keep the quotes around each value. Save the file.

## Step 2 — Drag these files onto GitHub

On GitHub's "Drag files here to add them to your repository" page,
select and drag **these files** from this folder:

- `index.html`
- `app.js`
- `config.js`  *(the one you just edited)*
- `style.css`
- `README.md`

You can skip this `UPLOAD_THESE_FILES.md` file if you want — it is
just instructions for you.

Scroll down, add a commit message like "initial app", and click
**Commit changes**.

## Step 3 — Deploy on Vercel

1. Go to vercel.com -> **Add New -> Project**
2. Import the `SIRANEX` GitHub repo
3. Leave all settings at their defaults and click **Deploy**

You do **not** need to set any environment variables. Your Supabase
URL and key are already inside `config.js`.

## Step 4 — Try it

Open the Vercel URL on two devices (or two browser tabs). Type a
message on one — it should appear instantly on the other.

If something doesn't work, open the browser's developer console
(F12) and look for red error messages — they usually tell you exactly
what to fix (wrong key, missing RLS policy, realtime not enabled,
etc.).
