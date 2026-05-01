// ============================================================
//  PRAJADARBAR  (ప్రజాదర్బార్)
//  Khammam District Administration, Telangana
// ============================================================
//
//  PASTE YOUR SUPABASE VALUES BELOW.
//
//  1. SUPABASE_URL  -> Project Settings → API → Project URL
//                      e.g. https://xxxx.supabase.co
//
//  2. SUPABASE_KEY  -> Project Settings → API → anon / publishable key
//                      starts with "sb_publishable_..." or "eyJ..."
//
//  3. DEMO_MODE     -> true  : the UI lets you act as any role from a
//                              dropdown – ideal for demoing without
//                              logging in.
//                      false : real OTP / email-password login is
//                              required (production mode).
//
//  4. SMS / WhatsApp gateways are optional.  When the keys below are
//     blank, the app simulates outbound messages and writes them to
//     the `notifications` table so you can still see the full flow on
//     the demo page.
//
// ============================================================

const PRAJA_CONFIG = {
  // ---- Supabase ----------------------------------------------------------
  SUPABASE_URL: "https://tswkudgfmsktqfbfychc.supabase.co",
  SUPABASE_KEY: "sb_publishable_yViaFwkoYkzR8o2OJZCYYg_E7Phb-U8",

  // ---- Branding ----------------------------------------------------------
  APP_NAME_EN: "Prajadarbar",
  APP_NAME_TE: "ప్రజాదర్బార్",
  TAGLINE_EN:  "Grievance Redressal & Monitoring – Khammam District",
  TAGLINE_TE:  "ఫిర్యాదుల పరిష్కారం & పర్యవేక్షణ – ఖమ్మం జిల్లా",

  // ---- Demo / runtime flags ---------------------------------------------
  DEMO_MODE: true,                 // set to false to require real auth
  DEFAULT_LANGUAGE: "te",          // "en" | "te"
  DISTRICT: "Khammam",
  STATE: "Telangana",

  // SLA colour bands (days)
  SLA_GREEN_MAX: 30,
  SLA_AMBER_MAX: 60,
  SLA_RED_MAX:   90,                // > this is "Critical / Breach"

  // ---- Storage -----------------------------------------------------------
  // Public bucket name for citizen proof + officer field photos
  STORAGE_BUCKET: "grievance-uploads",

  // ---- SMS gateway (MSG91 example).  Leave blank to simulate. -----------
  SMS_PROVIDER: "msg91",            // "msg91" | "gupshup" | "nic" | ""
  SMS_AUTH_KEY: "",
  SMS_SENDER_ID: "PJDKMM",
  SMS_DLT_TEMPLATE_ID: "",

  // ---- WhatsApp Business Cloud API.  Leave blank to simulate. -----------
  WHATSAPP_PHONE_ID: "",
  WHATSAPP_TOKEN:    "",
  WHATSAPP_TEMPLATE_NAME: "prajadarbar_status",

  // ---- Email (optional) -------------------------------------------------
  EMAIL_FROM: "no-reply@prajadarbar.kmm.in",
};

// expose under both names so legacy code (and 3rd-party snippets) keep working
window.PRAJA_CONFIG = PRAJA_CONFIG;
window.SUPABASE_URL = PRAJA_CONFIG.SUPABASE_URL;
window.SUPABASE_KEY = PRAJA_CONFIG.SUPABASE_KEY;
