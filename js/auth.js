// =============================================================================
// Prajadarbar — Auth (Supabase email+OTP) and demo-mode role switcher
// =============================================================================
(function (root) {
  "use strict";

  const sb = root.supabaseClient;

  async function getCurrentUser() {
    if (!sb) return null;
    const { data } = await sb.auth.getUser();
    return data && data.user ? data.user : null;
  }

  async function getProfile(userId) {
    if (!sb) return null;
    const { data } = await sb.from("profiles").select("*").eq("id", userId).maybeSingle();
    return data || null;
  }

  // Returns the effective session: real Supabase session, OR demo session, OR null.
  async function getEffectiveSession() {
    // demo mode override (only if app config allows)
    const cfg = root.PRAJA_CONFIG || {};
    if (cfg.DEMO_MODE) {
      const demo = root.PrajaUtils.getDemoSession();
      if (demo) return { mode: "demo", profile: demo };
    }
    const user = await getCurrentUser();
    if (!user) return null;
    const profile = await getProfile(user.id);
    return { mode: "real", user: user, profile: profile };
  }

  async function signInPassword(email, password) {
    const { data, error } = await sb.auth.signInWithPassword({ email: email, password: password });
    if (error) throw error;
    return data;
  }

  async function sendOtp(emailOrPhone) {
    if (/^\+?\d{8,}$/.test(emailOrPhone)) {
      const { error } = await sb.auth.signInWithOtp({ phone: emailOrPhone });
      if (error) throw error;
      return "phone";
    } else {
      const { error } = await sb.auth.signInWithOtp({ email: emailOrPhone });
      if (error) throw error;
      return "email";
    }
  }

  async function verifyOtp(emailOrPhone, code) {
    const isPhone = /^\+?\d{8,}$/.test(emailOrPhone);
    const params = isPhone
      ? { phone: emailOrPhone, token: code, type: "sms" }
      : { email: emailOrPhone, token: code, type: "email" };
    const { data, error } = await sb.auth.verifyOtp(params);
    if (error) throw error;
    return data;
  }

  async function signOut() {
    if (sb) { try { await sb.auth.signOut(); } catch (e) {} }
    root.PrajaUtils.setDemoSession(null);
  }

  // Demo presets to run the dashboards without Supabase Auth users
  const DEMO_PRESETS = {
    citizen:        { id: "demo-citizen",   role: "citizen",       full_name: "Demo Citizen", language: "te", department_code: null, mandal_code: null },
    officer_revenue:{ id: "demo-off-rev",   role: "officer",       full_name: "Tahsildar – Revenue",     language: "en", department_code: "REV", mandal_code: null },
    officer_housing:{ id: "demo-off-hou",   role: "officer",       full_name: "Housing AE",              language: "en", department_code: "HOU", mandal_code: null },
    hod_revenue:    { id: "demo-hod-rev",   role: "hod",           full_name: "Joint Collector (Revenue)", language: "en", department_code: "REV", mandal_code: null },
    collector:      { id: "demo-collector", role: "collector",     full_name: "District Collector – Khammam", language: "en", department_code: null, mandal_code: null },
    field_tir:      { id: "demo-field-tir", role: "field_officer", full_name: "MPDO – Tirumalayapalem",  language: "te", department_code: null, mandal_code: "TIR" },
  };

  async function loginDemo(presetKey) {
    const preset = DEMO_PRESETS[presetKey];
    if (!preset) throw new Error("Unknown demo role: " + presetKey);
    // resolve dept / mandal ids for friendlier UI
    let deptId = null, mandalId = null;
    if (preset.department_code) {
      const { data } = await sb.from("departments").select("id").eq("code", preset.department_code).maybeSingle();
      deptId = data ? data.id : null;
    }
    if (preset.mandal_code) {
      const { data } = await sb.from("mandals").select("id").eq("code", preset.mandal_code).maybeSingle();
      mandalId = data ? data.id : null;
    }
    const session = Object.assign({}, preset, { department_id: deptId, mandal_id: mandalId });
    root.PrajaUtils.setDemoSession(session);
    return session;
  }

  // Guard helper for protected pages
  async function requireRole(roles) {
    const sess = await getEffectiveSession();
    if (!sess) {
      location.href = "login.html?next=" + encodeURIComponent(location.pathname);
      return null;
    }
    if (roles && roles.length && roles.indexOf(sess.profile.role) === -1) {
      root.PrajaUtils.toast("Access denied for role: " + sess.profile.role, "error");
      setTimeout(function () { location.href = "index.html"; }, 1500);
      return null;
    }
    return sess;
  }

  root.PrajaAuth = {
    getCurrentUser: getCurrentUser,
    getProfile: getProfile,
    getEffectiveSession: getEffectiveSession,
    signInPassword: signInPassword,
    sendOtp: sendOtp,
    verifyOtp: verifyOtp,
    signOut: signOut,
    loginDemo: loginDemo,
    requireRole: requireRole,
    DEMO_PRESETS: DEMO_PRESETS,
  };
})(window);
