# SIRANEX — real-time messages demo

A tiny static web app (plain HTML + JS) that stores messages in
Supabase and syncs them live across every open device using
Supabase Realtime.

## 1. Edit `config.js`
Open `config.js` and paste your Supabase project URL and publishable
(anon) key in place of the two `PASTE_...` placeholders, then save.

## 2. Upload to GitHub
On your GitHub repo's "Drag files here" screen, drop **every file in
this folder** (`index.html`, `app.js`, `config.js`, `style.css`, this
README). Commit.

## 3. Deploy on Vercel
In Vercel, "Import" the GitHub repo and click **Deploy**. No
framework, no build command, no environment variables needed — Vercel
will just serve the static files.

## 4. Use it
Open the deployed URL on two devices (phone + laptop). Type a message
on one — it appears instantly on the other.
