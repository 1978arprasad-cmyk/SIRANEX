// =============================================================================
// Officer / HoD inbox page (also reused by field officer with mandal scope)
// =============================================================================
(async function () {
  PrajaUtils.buildHeader({ mountTo: document.getElementById("app-root") });
  PrajaI18n.apply(document);

  // require staff role
  const sess = await PrajaAuth.requireRole(["officer","hod","collector","admin","field_officer"]);
  if (!sess) return;
  const profile = sess.profile;
  const lang = PrajaI18n.getLang();

  document.getElementById("who").textContent =
    (profile.full_name || profile.role) +
    (profile.department_id ? "" : "");

  document.getElementById("logout-btn").addEventListener("click", async function () {
    await PrajaAuth.signOut(); location.href = "login.html";
  });

  // Filter chips
  const filters = [
    { key: "all",            t: "off_filter_all",         match: function () { return true; } },
    { key: "registered",     t: "status_registered",      match: function (g) { return g.status === "registered"; } },
    { key: "acknowledged",   t: "status_acknowledged",    match: function (g) { return g.status === "acknowledged"; } },
    { key: "assigned",       t: "status_assigned",        match: function (g) { return g.status === "assigned"; } },
    { key: "in_progress",    t: "off_filter_inprogress",  match: function (g) { return g.status === "in_progress"; } },
    { key: "field_verified", t: "off_filter_field",       match: function (g) { return g.status === "field_verified"; } },
    { key: "overdue",        t: "off_filter_overdue",     match: function (g) {
        const days = Math.floor((Date.now() - new Date(g.created_at).getTime()) / 86400000);
        return ["resolved","closed","rejected"].indexOf(g.status) === -1 && days > (g.sla_days || 90);
      } },
    { key: "escalated",      t: "off_filter_escalated",   match: function (g) { return g.status === "escalated"; } },
    { key: "closed",         t: "off_filter_closed",      match: function (g) { return ["resolved","closed"].indexOf(g.status) !== -1; } },
  ];

  let activeFilter = "all";
  let cache = [];

  const fbar = document.getElementById("filters");
  filters.forEach(function (f) {
    const c = PrajaUtils.el("button", { class: "filterbar__chip" + (f.key === activeFilter ? " is-active" : ""),
      onclick: function () { activeFilter = f.key; render(); paintChips(); } }, "");
    c.setAttribute("data-t", f.t);
    fbar.appendChild(c);
  });
  PrajaI18n.apply(fbar);

  function paintChips() {
    Array.from(fbar.children).forEach(function (c, i) {
      c.classList.toggle("is-active", filters[i].key === activeFilter);
    });
  }

  // Build the query scope based on role
  const scope = {};
  if (profile.role === "officer" && profile.department_id) scope.department_id = profile.department_id;
  if (profile.role === "hod"     && profile.department_id) scope.department_id = profile.department_id;
  if (profile.role === "field_officer" && profile.mandal_id) scope.mandal_id = profile.mandal_id;
  // collector / admin: no scope filter

  async function load() {
    cache = await PrajaApi.listGrievancesForOfficer(scope);
    render();
  }

  function render() {
    const filt = filters.find(function (f) { return f.key === activeFilter; });
    const rows = cache.filter(filt.match);

    // KPIs
    const kpis = [
      { k: "kpi_total",     v: cache.length },
      { k: "kpi_pending",   v: cache.filter(function (g) { return ["resolved","closed","rejected"].indexOf(g.status) === -1; }).length },
      { k: "kpi_overdue",   v: cache.filter(filters.find(function (f){return f.key==="overdue";}).match).length, cls: "kpi--red" },
      { k: "kpi_resolved",  v: cache.filter(function (g) { return g.status === "resolved" || g.status === "closed"; }).length, cls: "kpi--green" },
      { k: "kpi_in_progress", v: cache.filter(function (g) { return g.status === "in_progress"; }).length, cls: "kpi--amber" },
      { k: "off_filter_field", v: cache.filter(function (g) { return g.status === "field_verified"; }).length },
    ];
    const host = document.getElementById("kpis"); host.innerHTML = "";
    kpis.forEach(function (t) {
      host.appendChild(PrajaUtils.el("div", { class: "kpi " + (t.cls || "") }, [
        PrajaUtils.el("span", { class: "kpi__label", "data-t": t.k }, t.k),
        PrajaUtils.el("span", { class: "kpi__value" }, PrajaUtils.n(t.v)),
      ]));
    });
    PrajaI18n.apply(host);

    const list = document.getElementById("inbox-list");
    list.innerHTML = "";
    if (!rows.length) {
      list.appendChild(PrajaUtils.el("p", { class: "muted" }, "No grievances in this filter."));
      return;
    }
    rows.forEach(function (g) {
      const row = PrajaUtils.el("div", { class: "list-row", onclick: function () { openModal(g); } }, [
        PrajaUtils.el("div", { class: "list-row__icon" }, (g.department && g.department.icon) || "📌"),
        PrajaUtils.el("div", null, [
          PrajaUtils.el("div", { class: "list-row__title" }, g.grievance_id + " · " + g.applicant_name),
          PrajaUtils.el("div", { class: "list-row__meta" },
            (g.department ? (lang==="te"?g.department.name_te:g.department.name_en) : "") +
            (g.subject    ? " · " + (lang==="te"?g.subject.name_te:g.subject.name_en) : "") +
            (g.mandal     ? " · " + (lang==="te"?g.mandal.name_te:g.mandal.name_en) : "") +
            (g.panchayat  ? " · " + (lang==="te"?g.panchayat.name_te:g.panchayat.name_en) : "") +
            " · " + PrajaUtils.formatDateTime(g.created_at)
          ),
          PrajaUtils.el("div", { class: "list-row__meta" }, PrajaUtils.shorten(g.description, 140)),
        ]),
        PrajaUtils.el("div", { class: "list-row__right" }, [
          PrajaUtils.statusPill(g.status),
          PrajaUtils.el("span", { class: PrajaUtils.slaPillClass(PrajaUtils.slaBand(g.created_at, g.status)) },
            PrajaUtils.ageDays(g.created_at) + "d / " + (g.sla_days || 90) + "d"),
          PrajaUtils.el("span", { class: "muted", style: { fontSize: "11px" } }, "📞 " + PrajaUtils.maskMobile(g.mobile)),
        ]),
      ]);
      list.appendChild(row);
    });
  }

  // Modal: take action on a grievance
  function openModal(g) {
    const host = document.getElementById("modal-host");
    host.innerHTML = "";
    const allStatuses = ["acknowledged","assigned","in_progress","field_verified","resolved","rejected","escalated"];
    const statusSel = PrajaUtils.el("select", { id: "m-status" },
      allStatuses.map(function (s) { return PrajaUtils.el("option", { value: s, selected: s === g.status }, PrajaI18n.statusLabel(s)); }));
    const remarks = PrajaUtils.el("textarea", { id: "m-remarks", placeholder: PrajaI18n.t("off_remarks"), rows: 3 });
    const fileInp = PrajaUtils.el("input", { type: "file", accept: "image/*", multiple: true, capture: "environment", id: "m-files" });
    const gpsBtn  = PrajaUtils.el("button", { type: "button", class: "btn btn--secondary btn--sm" }, "📍 Capture GPS");
    const gpsLab  = PrajaUtils.el("span", { class: "muted" });
    let gps = null;
    gpsBtn.addEventListener("click", async function () { gps = await PrajaUtils.getGPS(); gpsLab.textContent = gps ? ("✅ " + gps.lat.toFixed(4) + "," + gps.lng.toFixed(4)) : "❌"; });

    // Reassign select
    const deptSel = PrajaUtils.el("select", { id: "m-dept" });
    PrajaApi.getDepartments().then(function (ds) {
      deptSel.innerHTML = '<option value="">—</option>' + ds.map(function (d) {
        return '<option value="' + d.id + '">' + (d.icon || "") + " " + (lang==="te"?d.name_te:d.name_en) + (g.department_id === d.id ? " (current)" : "") + "</option>";
      }).join("");
    });

    const modal = PrajaUtils.el("div", { class: "modal" }, [
      PrajaUtils.el("h3", null, [
        PrajaUtils.el("span", { class: "gid" }, g.grievance_id), " · ", g.applicant_name
      ]),
      PrajaUtils.el("p", { class: "muted" },
        (g.department ? (lang==="te"?g.department.name_te:g.department.name_en) : "") +
        (g.subject    ? " · " + (lang==="te"?g.subject.name_te:g.subject.name_en) : "") +
        (g.mandal     ? " · " + (lang==="te"?g.mandal.name_te:g.mandal.name_en) : "")
      ),
      PrajaUtils.el("p", null, g.description),
      PrajaUtils.el("hr"),
      PrajaUtils.el("h4", { "data-t": "off_take_action" }, "Take action"),
      PrajaUtils.el("div", { class: "field" }, [PrajaUtils.el("label", { "data-t": "off_change_status" }, "Change status to…"), statusSel]),
      PrajaUtils.el("div", { class: "field" }, [PrajaUtils.el("label", { "data-t": "off_remarks" }, "Remarks"), remarks]),
      PrajaUtils.el("div", { class: "field" }, [PrajaUtils.el("label", { "data-t": "off_action_photo" }, "Action-taken photo (with GPS)"), fileInp,
        PrajaUtils.el("div", { class: "row", style: { marginTop: "8px" } }, [gpsBtn, gpsLab])]),
      PrajaUtils.el("hr"),
      PrajaUtils.el("h4", { "data-t": "off_reassign" }, "Reassign to another department"),
      PrajaUtils.el("div", { class: "field" }, [deptSel]),
      PrajaUtils.el("div", { class: "row", style: { justifyContent: "flex-end", marginTop: "8px" } }, [
        PrajaUtils.el("button", { class: "btn btn--ghost", onclick: function () { host.innerHTML = ""; } }, "Cancel"),
        PrajaUtils.el("button", { class: "btn btn--saffron", onclick: async function () {
          if (!deptSel.value || deptSel.value === g.department_id) return PrajaUtils.toast("Pick a different dept to reassign", "warn");
          await PrajaApi.reassignGrievance(g.id, deptSel.value, remarks.value || null, profile);
          PrajaUtils.toast("Reassigned", "ok"); host.innerHTML = ""; load();
        } }, "Reassign"),
        PrajaUtils.el("button", { class: "btn btn--primary", onclick: async function () {
          const files = fileInp.files ? Array.from(fileInp.files) : [];
          await PrajaApi.updateGrievanceStatus(g.id, statusSel.value, remarks.value || null, profile, files, gps);
          PrajaUtils.toast("Updated", "ok"); host.innerHTML = ""; load();
        } }, "Update")
      ])
    ]);
    const wrapper = PrajaUtils.el("div", { class: "modal-host", onclick: function (e) { if (e.target === wrapper) host.innerHTML = ""; } }, [modal]);
    host.appendChild(wrapper);
    PrajaI18n.apply(modal);
  }

  await load();

  // Realtime
  PrajaApi.subscribeGrievances({ onInsert: load, onUpdate: load });
})();
