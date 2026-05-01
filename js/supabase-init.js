// =============================================================================
// Prajadarbar — Supabase client bootstrap
// =============================================================================
(function (root) {
  "use strict";

  function abort(msg) {
    console.error("[Prajadarbar]", msg);
    const el = document.getElementById("status");
    if (el) {
      el.textContent = msg;
      el.className = "status status--error";
    }
  }

  if (!root.PRAJA_CONFIG) {
    abort("config.js not loaded");
    return;
  }
  const cfg = root.PRAJA_CONFIG;
  if (
    typeof cfg.SUPABASE_URL !== "string" ||
    typeof cfg.SUPABASE_KEY !== "string" ||
    cfg.SUPABASE_URL.indexOf("PASTE_") === 0 ||
    cfg.SUPABASE_KEY.indexOf("PASTE_") === 0
  ) {
    abort("Open config.js and paste your Supabase URL + key, then reload.");
    return;
  }

  if (!root.supabase || typeof root.supabase.createClient !== "function") {
    abort("Supabase JS client (supabase-js@2 CDN) not loaded.");
    return;
  }

  const client = root.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  });

  root.supabaseClient = client;
})(window);
