# Integration notes

## SMS gateway (MSG91)

1. Buy a DLT-approved sender ID `PJDKMM` from your TRAI portal.
2. Register a transactional template like:

   ```
   Prajadarbar: Grievance ##VAR1## ##VAR2##.
   Track at ##VAR3##. -KMM Collectorate
   ```

3. Put the auth key, sender id and DLT template id in `config.js` (or
   set them as environment variables in a Supabase Edge Function and
   wipe them from `config.js` for production).
4. The browser code only enqueues SMS into the `notifications` table.
   A small **Edge Function `send-notifications`** should poll/listen for
   `status='pending'`, hit MSG91, and update the row to `delivered_at`.

A reference Edge Function:

```ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const sb = createClient(Deno.env.get("SB_URL"), Deno.env.get("SB_SERVICE_ROLE"));

Deno.serve(async () => {
  const { data: pend } = await sb.from("notifications").select("*").eq("status","pending").limit(50);
  for (const n of pend ?? []) {
    if (n.channel === "sms")      await sendMSG91(n);
    if (n.channel === "whatsapp") await sendWhatsApp(n);
    await sb.from("notifications").update({ status: "delivered", delivered_at: new Date().toISOString() }).eq("id", n.id);
  }
  return new Response("ok");
});
```

## WhatsApp Business Cloud API

- Register a Meta Business account, verify the Khammam Collectorate.
- Approve a template named `prajadarbar_status` with body:

  ```
  Prajadarbar: Your grievance {{1}} status changed to {{2}}.
  Track: {{3}}
  ```

- Save the phone-number-ID and access token in the Edge Function env
  (never in `config.js` for production).

## CM Dashboard / Praja Vani / MeeSeva

The `grievances` table is the single source of truth. Either:

* expose a read-only PostgREST view over the v_*_kpis views as JSON, or
* run a small periodic worker that pushes daily abstracts to the CM
  Dashboard ingestion endpoint in their expected JSON envelope.

## NIC Cloud deployment

* Static front-end is plain HTML/JS — copy to any Apache/Nginx host.
* Supabase can be self-hosted on NIC Cloud (`supabase/postgres` +
  `supabase/realtime` containers). Set the URL/key in `config.js`.
* All Supabase docs are published as open source (MIT) so there is no
  licensing constraint for government deployment.
