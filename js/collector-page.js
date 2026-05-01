// =============================================================================
// Collector / District-wide dashboard
// =============================================================================
(async function () {
  PrajaUtils.buildHeader({ mountTo: document.getElementById("app-root") });
  PrajaI18n.apply(document);

  const sess = await PrajaAuth.requireRole(["collector","admin","hod"]);
  if (!sess) return;
  const profile = sess.profile;
  const lang = PrajaI18n.getLang();

  document.getElementById("who").textContent = profile.full_name || profile.role;
  document.getElementById("logout-btn").addEventListener("click", async function () { await PrajaAuth.signOut(); location.href = "login.html"; });
  document.getElementById("goto-officer").addEventListener("click", function () { location.href = "officer.html"; });

  let lastDistrict, lastDept, lastMandal, lastRecent, lastOverdue;

  async function refresh() {
    const [k, depts, mandals, recent, overdue] = await Promise.all([
      PrajaApi.getDistrictKPIs(),
      PrajaApi.getDeptKPIs(),
      PrajaApi.getMandalKPIs(),
      PrajaApi.getRecentGrievances(50),
      PrajaApi.getOverdue(10),
    ]);
    lastDistrict = k; lastDept = depts; lastMandal = mandals; lastRecent = recent; lastOverdue = overdue;

    // KPI tiles
    const tiles = [
      { k: "kpi_total",            v: k.total || 0,                                     cls: "kpi--saffron" },
      { k: "kpi_pending",          v: k.pending || 0 },
      { k: "kpi_in_progress",      v: k.in_progress || 0,                                cls: "kpi--amber" },
      { k: "kpi_resolved",         v: (k.resolved || 0) + (k.closed || 0),               cls: "kpi--green" },
      { k: "kpi_overdue",          v: k.overdue || 0,                                    cls: "kpi--red" },
      { k: "kpi_resolution_rate",  v: (k.resolution_pct || 0) + "%" },
    ];
    const host = document.getElementById("kpis"); host.innerHTML = "";
    tiles.forEach(function (t) {
      host.appendChild(PrajaUtils.el("div", { class: "kpi " + (t.cls || "") }, [
        PrajaUtils.el("span", { class: "kpi__label", "data-t": t.k }, t.k),
        PrajaUtils.el("span", { class: "kpi__value" }, typeof t.v === "number" ? PrajaUtils.n(t.v) : t.v),
        PrajaUtils.el("span", { class: "kpi__sub" }, t.k === "kpi_resolution_rate" ? ("Avg " + (k.avg_resolution_days || 0) + "d") : ""),
      ]));
    });
    PrajaI18n.apply(host);

    document.getElementById("sla-summary").textContent =
      "Green " + (k.green_zone || 0) + " · Amber " + (k.amber_zone || 0) +
      " · Red " + (k.red_zone || 0) + " · Critical " + Math.max(0, (k.overdue || 0) - (k.red_zone || 0));

    // Dept chart
    const dCtx = document.getElementById("ch-dept").getContext("2d");
    if (window._chDept) window._chDept.destroy();
    const top = depts.slice(0, 12);
    window._chDept = new Chart(dCtx, {
      type: "bar",
      data: {
        labels: top.map(function (d) { return lang === "te" ? (d.department_name_te || d.department_name_en) : d.department_name_en; }),
        datasets: [
          { label: "Pending",  data: top.map(function (d) { return d.pending  || 0; }), backgroundColor: "#f97316" },
          { label: "Resolved", data: top.map(function (d) { return d.resolved || 0; }), backgroundColor: "#16a34a" },
          { label: "Overdue",  data: top.map(function (d) { return d.overdue  || 0; }), backgroundColor: "#dc2626" },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false, indexAxis: "y", scales: { x: { stacked: true }, y: { stacked: true } } },
    });

    // SLA donut
    const sCtx = document.getElementById("ch-sla").getContext("2d");
    if (window._chSla) window._chSla.destroy();
    window._chSla = new Chart(sCtx, {
      type: "doughnut",
      data: {
        labels: ["Green (<30d)", "Amber (30-60d)", "Red (60-90d)", "Critical (>90d)"],
        datasets: [{
          data: [k.green_zone || 0, k.amber_zone || 0, k.red_zone || 0, Math.max(0, (k.overdue||0) - (k.red_zone||0))],
          backgroundColor: ["#16a34a","#eab308","#ea580c","#7f1d1d"]
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }
    });

    // Map
    if (!window._map) {
      window._map = L.map("map").setView([17.45, 80.35], 9);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(window._map);
      window._mapLayer = L.layerGroup().addTo(window._map);
    }
    drawHeat(mandals);

    // Top pending / overdue
    const pendingRows = recent.filter(function (g) { return ["resolved","closed","rejected"].indexOf(g.status) === -1; }).slice(0, 10);
    fillTable("tbl-pending", pendingRows.map(function (g) {
      return [g.grievance_id, g.applicant_name, g.department && g.department.name_en,
              g.mandal && g.mandal.name_en, PrajaUtils.ageDays(g.created_at) + "d"];
    }));
    fillTable("tbl-overdue", overdue.map(function (g) {
      return [g.grievance_id, g.applicant_name, g.department && g.department.name_en,
              g.mandal && g.mandal.name_en, PrajaUtils.ageDays(g.created_at) + "d"];
    }));

    // Department scorecard
    fillTable("tbl-dept", depts.map(function (d) {
      return [
        (lang==="te"?d.department_name_te:d.department_name_en),
        d.total||0, d.pending||0, d.resolved||0, d.overdue||0,
        d.avg_rating==null ? "—" : Number(d.avg_rating).toFixed(2)
      ];
    }));
    fillTable("tbl-mandal", mandals.map(function (m) {
      return [
        (lang==="te"?m.mandal_name_te:m.mandal_name_en),
        m.total||0, m.pending||0, m.resolved||0, m.overdue||0
      ];
    }));

    document.getElementById("last-refresh").textContent = new Date().toLocaleString("en-IN");
  }

  function drawHeat(mandals) {
    const metric = document.getElementById("heat-metric").value;
    window._mapLayer.clearLayers();
    const max = Math.max(1, ...mandals.map(function (m) { return m[metric] || 0; }));
    mandals.forEach(function (m) {
      if (!m.lat || !m.lng) return;
      const v = m[metric] || 0;
      const radius = 8 + Math.sqrt(v / max) * 30;
      let colour;
      if (metric === "overdue") colour = v > 0 ? "#dc2626" : "#94a3b8";
      else if (metric === "resolved") colour = v > 0 ? "#16a34a" : "#94a3b8";
      else colour = v > 0 ? "#1d4ed8" : "#94a3b8";
      const c = L.circleMarker([m.lat, m.lng], { radius: radius, color: colour, fillColor: colour, fillOpacity: 0.5, weight: 2 });
      c.bindTooltip(
        "<b>" + (lang==="te"?(m.mandal_name_te||m.mandal_name_en):m.mandal_name_en) + "</b><br>" +
        "Total: " + (m.total||0) + "<br>Pending: " + (m.pending||0) +
        "<br>Resolved: " + (m.resolved||0) + "<br>Overdue: " + (m.overdue||0)
      );
      c.addTo(window._mapLayer);
    });
  }

  function fillTable(id, rows) {
    const tb = document.querySelector("#" + id + " tbody");
    tb.innerHTML = "";
    rows.forEach(function (r) {
      const tr = document.createElement("tr");
      r.forEach(function (cell, idx) {
        const td = document.createElement("td");
        if (idx >= 1 && typeof cell === "number") td.className = "num";
        td.textContent = cell == null ? "—" : cell;
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
  }

  // Heatmap metric switcher
  document.getElementById("heat-metric").addEventListener("change", function () { drawHeat(lastMandal); });

  // Excel export
  document.getElementById("exp-excel").addEventListener("click", function () {
    const wb = XLSX.utils.book_new();

    // KPI sheet
    XLSX.utils.book_append_sheet(wb,
      XLSX.utils.aoa_to_sheet([
        ["Prajadarbar – Khammam District Snapshot", "", "Generated", new Date().toLocaleString("en-IN")],
        [],
        ["Metric", "Value"],
        ["Total grievances", lastDistrict.total || 0],
        ["Pending", lastDistrict.pending || 0],
        ["In Progress", lastDistrict.in_progress || 0],
        ["Resolved", (lastDistrict.resolved||0) + (lastDistrict.closed||0)],
        ["Overdue", lastDistrict.overdue || 0],
        ["Resolution %", lastDistrict.resolution_pct || 0],
        ["Avg resolution days", lastDistrict.avg_resolution_days || 0],
      ]), "Snapshot"
    );

    // Department sheet
    XLSX.utils.book_append_sheet(wb,
      XLSX.utils.json_to_sheet(lastDept.map(function (d) {
        return {
          Department: d.department_name_en, Total: d.total || 0,
          Pending: d.pending || 0, Resolved: d.resolved || 0, Overdue: d.overdue || 0,
          AvgRating: d.avg_rating || null,
        };
      })), "Departments"
    );

    // Mandal sheet
    XLSX.utils.book_append_sheet(wb,
      XLSX.utils.json_to_sheet(lastMandal.map(function (m) {
        return {
          Mandal: m.mandal_name_en, Total: m.total || 0,
          Pending: m.pending || 0, Resolved: m.resolved || 0, Overdue: m.overdue || 0,
        };
      })), "Mandals"
    );

    // Overdue sheet
    XLSX.utils.book_append_sheet(wb,
      XLSX.utils.json_to_sheet(lastOverdue.map(function (g) {
        return {
          GrievanceID: g.grievance_id, Applicant: g.applicant_name,
          Department: g.department && g.department.name_en, Mandal: g.mandal && g.mandal.name_en,
          Status: g.status, AgeDays: PrajaUtils.ageDays(g.created_at)
        };
      })), "TopOverdue"
    );

    XLSX.writeFile(wb, "prajadarbar-khammam-" + new Date().toISOString().slice(0,10) + ".xlsx");
  });

  // Single-dept CSV
  document.getElementById("exp-dept").addEventListener("click", function () {
    const csv = ["Department,Total,Pending,Resolved,Overdue,AvgRating"]
      .concat(lastDept.map(function (d) {
        return [d.department_name_en, d.total||0, d.pending||0, d.resolved||0, d.overdue||0, d.avg_rating==null?"":d.avg_rating].join(",");
      })).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "departments.csv"; a.click();
  });

  // PDF export (DCC/DLRC style review)
  document.getElementById("exp-pdf").addEventListener("click", function () {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    doc.setFillColor(30, 58, 138); doc.rect(0, 0, W, 60, "F");
    doc.setTextColor(255); doc.setFontSize(18);
    doc.text("PRAJADARBAR — Khammam District", 24, 28);
    doc.setFontSize(11);
    doc.text("Generated " + new Date().toLocaleString("en-IN"), 24, 46);
    doc.setTextColor(0);

    doc.setFontSize(13);
    doc.text("District snapshot", 24, 88);
    doc.autoTable({
      startY: 98,
      head: [["Metric","Value"]],
      body: [
        ["Total grievances", String(lastDistrict.total||0)],
        ["Pending",          String(lastDistrict.pending||0)],
        ["In progress",      String(lastDistrict.in_progress||0)],
        ["Resolved/Closed",  String((lastDistrict.resolved||0)+(lastDistrict.closed||0))],
        ["Overdue",          String(lastDistrict.overdue||0)],
        ["Resolution %",     String(lastDistrict.resolution_pct||0)],
        ["Avg resolution days", String(lastDistrict.avg_resolution_days||0)],
      ],
      theme: "grid", headStyles: { fillColor: [30,58,138] }
    });

    doc.text("Department scorecard", 24, doc.lastAutoTable.finalY + 22);
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 32,
      head: [["Department","Total","Pending","Resolved","Overdue","★"]],
      body: lastDept.map(function (d) { return [
        d.department_name_en, d.total||0, d.pending||0, d.resolved||0, d.overdue||0,
        d.avg_rating==null?"—":Number(d.avg_rating).toFixed(2)
      ]; }),
      theme: "grid", headStyles: { fillColor: [30,58,138] }
    });

    doc.addPage();
    doc.setFontSize(13);
    doc.text("Mandal scorecard", 24, 40);
    doc.autoTable({
      startY: 50,
      head: [["Mandal","Total","Pending","Resolved","Overdue"]],
      body: lastMandal.map(function (m) { return [
        m.mandal_name_en, m.total||0, m.pending||0, m.resolved||0, m.overdue||0
      ]; }),
      theme: "grid", headStyles: { fillColor: [30,58,138] }
    });

    doc.text("Top 10 overdue", 24, doc.lastAutoTable.finalY + 22);
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 32,
      head: [["GID","Applicant","Department","Mandal","Days"]],
      body: lastOverdue.map(function (g) { return [
        g.grievance_id, g.applicant_name,
        g.department && g.department.name_en,
        g.mandal && g.mandal.name_en,
        PrajaUtils.ageDays(g.created_at)
      ]; }),
      theme: "grid", headStyles: { fillColor: [30,58,138] }
    });

    doc.save("prajadarbar-khammam-" + new Date().toISOString().slice(0,10) + ".pdf");
  });

  await refresh();
  PrajaApi.subscribeGrievances({ onInsert: refresh, onUpdate: refresh });
})();
