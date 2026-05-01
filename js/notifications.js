// =============================================================================
// Prajadarbar — SMS / WhatsApp / Email gateway adapter (browser-side stubs)
// =============================================================================
// In a production deployment these calls move to a Supabase Edge Function
// (or a small Node service) so the API keys never leave the server.
// In demo mode we simply enqueue rows in the `notifications` table — that is
// real persistence and survives realtime subscriptions, so the UI feels live.
// =============================================================================
(function (root) {
  "use strict";

  const cfg = root.PRAJA_CONFIG || {};
  const sb  = root.supabaseClient;

  async function queueSms(mobile, body, grievanceId) {
    return sb.from("notifications").insert({
      recipient_mobile: mobile, channel: "sms",
      title: "Prajadarbar", body: body, grievance_id: grievanceId || null
    });
  }
  async function queueWhatsapp(mobile, body, grievanceId, payload) {
    return sb.from("notifications").insert({
      recipient_mobile: mobile, channel: "whatsapp",
      title: "Prajadarbar", body: body, grievance_id: grievanceId || null,
      payload: payload || null,
    });
  }
  async function queueEmail(email, subject, body, grievanceId) {
    return sb.from("notifications").insert({
      recipient_email: email, channel: "email",
      title: subject, body: body, grievance_id: grievanceId || null
    });
  }

  // direct send via MSG91 — only callable from a server context (Edge Func)
  async function sendSmsMSG91(mobile, body) {
    if (!cfg.SMS_AUTH_KEY) {
      console.info("[SMS] simulated:", mobile, body);
      return { simulated: true };
    }
    const r = await fetch("https://api.msg91.com/api/v5/flow", {
      method: "POST",
      headers: { "Content-Type": "application/json", "authkey": cfg.SMS_AUTH_KEY },
      body: JSON.stringify({
        flow_id: cfg.SMS_DLT_TEMPLATE_ID,
        sender:  cfg.SMS_SENDER_ID,
        recipients: [{ mobiles: "91" + String(mobile).replace(/\D/g, "").slice(-10), VAR1: body }]
      })
    });
    return r.json();
  }

  async function sendWhatsappCloud(mobile, templateName, params, langCode) {
    if (!cfg.WHATSAPP_TOKEN || !cfg.WHATSAPP_PHONE_ID) {
      console.info("[WA] simulated:", mobile, templateName, params);
      return { simulated: true };
    }
    const r = await fetch("https://graph.facebook.com/v17.0/" + cfg.WHATSAPP_PHONE_ID + "/messages", {
      method: "POST",
      headers: { "Authorization": "Bearer " + cfg.WHATSAPP_TOKEN, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: "91" + String(mobile).replace(/\D/g, "").slice(-10),
        type: "template",
        template: {
          name: templateName,
          language: { code: langCode || "en" },
          components: [{ type: "body", parameters: (params || []).map(function (v) { return { type: "text", text: String(v) }; }) }],
        }
      })
    });
    return r.json();
  }

  root.PrajaNotify = {
    queueSms, queueWhatsapp, queueEmail,
    sendSmsMSG91, sendWhatsappCloud
  };
})(window);
