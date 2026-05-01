// =============================================================================
// Public tracking page — citizens enter mobile + Grievance ID and see status,
// timeline, attachments, and feedback options.
// =============================================================================
(async function () {
  PrajaUtils.buildHeader({ mountTo: document.getElementById("app-root") });
  PrajaI18n.apply(document);

  const $ = PrajaUtils.$;
  const form = $("#track-form");
  const result = $("#result");

  // Pre-fill from query params (used by SMS / WhatsApp links)
  const gidQ = PrajaUtils.qs("gid");
  const mQ   = PrajaUtils.qs("m");
  if (gidQ) $("#t-gid").value = gidQ;
  if (mQ)   $("#t-mobile").value = mQ;

  let realtimeSub = null;
  let currentUuid = null;

  async function render(mobile, gid) {
    result.innerHTML = '<div class="card">'+ PrajaI18n.t("loading") +'</div>';
    result.classList.remove("hidden");

    const summary = await PrajaApi.trackGrievance(mobile, gid);
    if (!summary) {
      result.innerHTML = '<div class="card"><p>'+ PrajaI18n.t("track_not_found") +'</p></div>';
      return;
    }
    const full = await PrajaApi.getGrievanceFull(gid);
    if (!full) { result.innerHTML = ""; return; }
    currentUuid = full.id;

    const lang = PrajaI18n.getLang();
    const dept = full.department; const subj = full.subject; const m = full.mandal; const p = full.panchayat;

    const sla = PrajaUtils.slaBand(full.created_at, full.status);
    const slaPill = PrajaUtils.el("span", { class: PrajaUtils.slaPillClass(sla) },
      PrajaUtils.ageDays(full.created_at) + "d / " + (full.sla_days || 90) + "d SLA");

    const card = PrajaUtils.el("div", { class: "card" }, [
      PrajaUtils.el("div", { class: "card__title" }, [
        PrajaUtils.el("h2", null, [
          PrajaUtils.el("span", { class: "gid" }, full.grievance_id), " ",
          PrajaUtils.el("span", { class: "muted", style: { fontSize:"14px" } }, full.applicant_name),
        ]),
        PrajaUtils.el("div", { class: "row" }, [PrajaUtils.statusPill(full.status), slaPill]),
      ]),
      PrajaUtils.el("div", { class: "grid grid--2" }, [
        info("field_department",  ((dept && dept.icon) || "") + " " + (dept ? (lang==="te"?dept.name_te:dept.name_en) : "—")),
        info("field_subject",     subj ? (lang==="te"?subj.name_te:subj.name_en) : "—"),
        info("field_mandal",      m ? (lang==="te"?m.name_te:m.name_en) : "—"),
        info("field_panchayat",   p ? (lang==="te"?p.name_te:p.name_en) : "—"),
        info("track_assigned_to", full.assignee ? (full.assignee.full_name + (full.assignee.designation ? " (" + full.assignee.designation + ")" : "")) : (full.forwarded_to || "—")),
        info("track_expected",    PrajaUtils.formatDate(full.expected_resolution_date)),
      ]),
      PrajaUtils.el("p", null, full.description),
    ]);
    result.innerHTML = "";
    result.appendChild(card);

    // Timeline
    const hist = await PrajaApi.getHistory(full.id);
    const tl = PrajaUtils.el("div", { class: "card" }, [
      PrajaUtils.el("div", { class: "card__title" }, PrajaUtils.el("h3", { "data-t": "track_timeline" }, "Status timeline")),
      buildTimeline(hist),
    ]);
    result.appendChild(tl);

    // Attachments
    const atts = await PrajaApi.getAttachments(full.id);
    if (atts.length) {
      const attCard = PrajaUtils.el("div", { class: "card" }, [
        PrajaUtils.el("h3", null, "Attachments"),
        buildAttachments(atts),
      ]);
      result.appendChild(attCard);
    }

    // Feedback (only when status resolved/closed)
    if (full.status === "resolved" || full.status === "closed") {
      const fb = PrajaUtils.el("div", { class: "card" }, [
        PrajaUtils.el("h3", { "data-t": "fb_title" }, "Confirm closure & rate the resolution"),
        buildFeedback(full),
      ]);
      result.appendChild(fb);
    }

    PrajaI18n.apply(result);

    // Realtime: re-render on any history change
    if (realtimeSub) { try { realtimeSub.unsubscribe(); } catch (e) {} }
    realtimeSub = PrajaApi.subscribeHistory(full.id, function () { render(mobile, gid); });
  }

  function info(labelKey, value) {
    return PrajaUtils.el("div", { class: "field" }, [
      PrajaUtils.el("label", { "data-t": labelKey }, labelKey),
      PrajaUtils.el("div", null, value || "—"),
    ]);
  }

  function buildTimeline(rows) {
    if (!rows.length) return PrajaUtils.el("p", { class: "muted" }, "No history yet.");
    const wrap = PrajaUtils.el("div", { class: "timeline" });
    rows.forEach(function (h) {
      const item = PrajaUtils.el("div", { class: "timeline__item" }, [
        PrajaUtils.el("div", { class: "timeline__title" }, [
          PrajaUtils.statusPill(h.to_status), " ",
          h.remarks ? PrajaUtils.el("span", null, "— " + h.remarks) : "",
        ]),
        PrajaUtils.el("div", { class: "timeline__meta" },
          PrajaUtils.formatDateTime(h.created_at) +
          (h.actor ? " · " + (h.actor.full_name || h.actor.role || "") : (h.actor_name ? " · " + h.actor_name : "")) +
          (h.gps_lat ? " · 📍 " + Number(h.gps_lat).toFixed(3) + "," + Number(h.gps_lng).toFixed(3) : "")
        ),
      ]);
      wrap.appendChild(item);
    });
    return wrap;
  }

  function buildAttachments(rows) {
    return PrajaUtils.el("div", { class: "grid grid--3" }, rows.map(function (a) {
      const isImg = a.file_type && a.file_type.indexOf("image/") === 0;
      return PrajaUtils.el("a", { href: a.file_url, target: "_blank", class: "list-row" }, [
        PrajaUtils.el("span", { class: "list-row__icon" }, isImg ? "🖼️" : "📄"),
        PrajaUtils.el("div", null, [
          PrajaUtils.el("div", { class: "list-row__title" }, a.file_name || a.attachment_type),
          PrajaUtils.el("div", { class: "list-row__meta" }, (a.attachment_type || "") + " · " + PrajaUtils.formatDate(a.created_at)),
        ]),
      ]);
    }));
  }

  function buildFeedback(g) {
    let rating = g.citizen_rating || 0;
    const stars = PrajaUtils.el("div", { class: "row", style: { fontSize: "26px", cursor: "pointer" } });
    function paint() {
      stars.innerHTML = "";
      for (let i = 1; i <= 5; i++) {
        const s = i <= rating ? "★" : "☆";
        stars.appendChild(PrajaUtils.el("span", { onclick: function(){ rating = i; paint(); } }, s));
      }
    }
    paint();
    const ta = PrajaUtils.el("textarea", { id: "fb-comment", placeholder: PrajaI18n.t("fb_comment"), maxlength: 500 });
    if (g.citizen_feedback) ta.value = g.citizen_feedback;
    return PrajaUtils.el("div", null, [
      stars,
      PrajaUtils.el("div", { class: "field", style: { marginTop: "10px" } }, [ta]),
      PrajaUtils.el("div", { class: "row" }, [
        PrajaUtils.el("button", { class: "btn btn--green", onclick: async function () {
          if (!rating) return PrajaUtils.toast("Please rate before closing", "warn");
          await PrajaApi.submitFeedback(g.id, rating, ta.value || null, false);
          PrajaUtils.toast(PrajaI18n.t("fb_thanks"), "ok");
          render(g.mobile, g.grievance_id);
        }}, PrajaI18n.t("fb_close")),
        PrajaUtils.el("button", { class: "btn btn--saffron", onclick: async function () {
          if (!rating) rating = 1;
          await PrajaApi.submitFeedback(g.id, rating, ta.value || null, true);
          PrajaUtils.toast("Re-opened. Officers will be notified.", "ok");
          render(g.mobile, g.grievance_id);
        }}, PrajaI18n.t("fb_reopen")),
      ]),
    ]);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const m = $("#t-mobile").value.replace(/\D/g, "");
    const g = $("#t-gid").value.trim().toUpperCase();
    render(m, g);
  });

  // Auto-fire if both URL params provided
  if (gidQ && mQ) {
    form.dispatchEvent(new Event("submit", { cancelable: true }));
  }
})();
