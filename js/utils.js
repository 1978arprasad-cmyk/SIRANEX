// =============================================================================
// Prajadarbar — utilities (DOM, GPS, formatting, RBAC, sla colour, etc.)
// =============================================================================
(function (root) {
  "use strict";

  // ---- DOM helpers --------------------------------------------------------
  function $(sel, scope)  { return (scope || document).querySelector(sel); }
  function $$(sel, scope) { return Array.from((scope || document).querySelectorAll(sel)); }

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (k === "class") node.className = v;
        else if (k === "style" && typeof v === "object") Object.assign(node.style, v);
        else if (k.indexOf("on") === 0 && typeof v === "function") node.addEventListener(k.slice(2), v);
        else if (v === true) node.setAttribute(k, "");
        else if (v !== false && v != null) node.setAttribute(k, v);
      }
    }
    if (children != null) {
      if (!Array.isArray(children)) children = [children];
      children.forEach(function (c) {
        if (c == null) return;
        if (typeof c === "string" || typeof c === "number") node.appendChild(document.createTextNode(String(c)));
        else node.appendChild(c);
      });
    }
    return node;
  }

  // ---- GPS ----------------------------------------------------------------
  function getGPS(timeoutMs) {
    return new Promise(function (resolve) {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        },
        function () { resolve(null); },
        { enableHighAccuracy: true, timeout: timeoutMs || 8000, maximumAge: 60000 }
      );
    });
  }

  // ---- Date helpers -------------------------------------------------------
  function formatDate(d) {
    if (!d) return "";
    const dt = (d instanceof Date) ? d : new Date(d);
    if (isNaN(dt.getTime())) return "";
    return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }
  function formatDateTime(d) {
    if (!d) return "";
    const dt = (d instanceof Date) ? d : new Date(d);
    if (isNaN(dt.getTime())) return "";
    return dt.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }
  function daysBetween(a, b) {
    const A = (a instanceof Date) ? a : new Date(a);
    const B = (b instanceof Date) ? b : new Date(b);
    return Math.floor((B - A) / 86400000);
  }
  function ageDays(d) { return daysBetween(d, new Date()); }

  // ---- SLA colour band ----------------------------------------------------
  function slaBand(createdAt, status) {
    if (status === "resolved" || status === "closed" || status === "rejected") return "done";
    const d = ageDays(createdAt);
    const cfg = root.PRAJA_CONFIG || {};
    if (d > (cfg.SLA_RED_MAX || 90))   return "critical";
    if (d > (cfg.SLA_AMBER_MAX || 60)) return "red";
    if (d > (cfg.SLA_GREEN_MAX || 30)) return "amber";
    return "green";
  }
  function slaPillClass(band) {
    return "sla sla--" + (band || "green");
  }

  // ---- Status colour pill -------------------------------------------------
  const STATUS_COLOR = {
    registered:     "blue",
    acknowledged:   "blue",
    assigned:       "indigo",
    in_progress:    "amber",
    field_verified: "violet",
    resolved:       "green",
    closed:         "green",
    rejected:       "gray",
    reopened:       "amber",
    escalated:      "red",
  };
  function statusPill(s) {
    const c = STATUS_COLOR[s] || "gray";
    const label = (root.PrajaI18n) ? root.PrajaI18n.statusLabel(s) : s;
    const pill = el("span", { class: "pill pill--" + c }, label);
    return pill;
  }

  // ---- Toast --------------------------------------------------------------
  function toast(msg, kind) {
    let host = document.getElementById("praja-toast-host");
    if (!host) {
      host = el("div", { id: "praja-toast-host", class: "toast-host" });
      document.body.appendChild(host);
    }
    const t = el("div", { class: "toast toast--" + (kind || "ok") }, msg);
    host.appendChild(t);
    setTimeout(function () { t.classList.add("toast--show"); }, 10);
    setTimeout(function () { t.classList.remove("toast--show"); setTimeout(function(){ t.remove(); }, 350); }, 3500);
  }

  // ---- URL state ----------------------------------------------------------
  function qs(k) { return new URL(location.href).searchParams.get(k); }

  // ---- Demo "session" (DEMO_MODE only) -----------------------------------
  function getDemoSession() {
    try { return JSON.parse(localStorage.getItem("praja_demo_session") || "null"); }
    catch (e) { return null; }
  }
  function setDemoSession(obj) {
    if (obj == null) localStorage.removeItem("praja_demo_session");
    else            localStorage.setItem("praja_demo_session", JSON.stringify(obj));
    document.dispatchEvent(new CustomEvent("praja:auth"));
  }

  // ---- Build header ------------------------------------------------------
  function buildHeader(opts) {
    opts = opts || {};
    const lang = (root.PrajaI18n) ? root.PrajaI18n.getLang() : "te";
    const cfg = root.PRAJA_CONFIG || {};
    const header = el("header", { class: "topbar" }, [
      el("a", { href: "index.html", class: "topbar__brand" }, [
        el("span", { class: "topbar__seal" }, "🛡️"),
        el("span", null, [
          el("strong", { class: "topbar__name" }, lang === "te" ? cfg.APP_NAME_TE : cfg.APP_NAME_EN),
          el("small",  { class: "topbar__sub"  }, lang === "te" ? "ఖమ్మం జిల్లా పరిపాలన" : "Khammam District Administration"),
        ]),
      ]),
      el("nav", { class: "topbar__nav" }, [
        el("a", { href: "index.html",         "data-t": "nav_home" }, "Home"),
        el("a", { href: "register.html",      "data-t": "nav_register" }, "Lodge"),
        el("a", { href: "track.html",         "data-t": "nav_track" }, "Track"),
        el("a", { href: "transparency.html",  "data-t": "nav_transparency" }, "Transparency"),
        el("a", { href: "login.html",         "data-t": "nav_login" }, "Officer Login"),
      ]),
      el("div", { class: "topbar__tools" }, [
        buildLangToggle(),
      ]),
    ]);
    if (opts.mountTo) opts.mountTo.prepend(header);
    if (root.PrajaI18n) root.PrajaI18n.apply(header);
    return header;
  }

  function buildLangToggle() {
    const lang = (root.PrajaI18n) ? root.PrajaI18n.getLang() : "te";
    const wrap = el("div", { class: "lang-toggle" });
    ["en","te"].forEach(function (l) {
      const b = el("button", {
        class: "lang-toggle__btn" + (l === lang ? " is-active" : ""),
        onclick: function () { if (root.PrajaI18n) root.PrajaI18n.setLang(l); location.reload(); }
      }, l === "en" ? "EN" : "తె");
      wrap.appendChild(b);
    });
    return wrap;
  }

  // ---- File / number ------------------------------------------------------
  function n(x) { return new Intl.NumberFormat("en-IN").format(x || 0); }
  function pct(x, total) {
    if (!total) return "0%";
    return Math.round(100 * x / total) + "%";
  }
  function shorten(text, max) {
    if (!text) return "";
    text = String(text);
    return text.length <= (max || 100) ? text : text.slice(0, (max || 100) - 1) + "…";
  }
  function maskMobile(m) {
    if (!m) return "";
    m = String(m);
    if (m.length < 10) return m;
    return m.slice(0, 2) + "******" + m.slice(-2);
  }

  // ---- Export -------------------------------------------------------------
  root.PrajaUtils = {
    $: $, $$: $$, el: el, getGPS: getGPS,
    formatDate: formatDate, formatDateTime: formatDateTime,
    ageDays: ageDays, daysBetween: daysBetween,
    slaBand: slaBand, slaPillClass: slaPillClass,
    statusPill: statusPill, statusColor: STATUS_COLOR,
    toast: toast, qs: qs,
    getDemoSession: getDemoSession, setDemoSession: setDemoSession,
    buildHeader: buildHeader,
    n: n, pct: pct, shorten: shorten, maskMobile: maskMobile,
  };
})(window);
