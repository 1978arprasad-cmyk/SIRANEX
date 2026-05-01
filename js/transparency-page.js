// Public transparency dashboard (no auth required)
(async function () {
  PrajaUtils.buildHeader({ mountTo: document.getElementById("app-root") });
  PrajaI18n.apply(document);

  const lang = PrajaI18n.getLang();
  const $ = PrajaUtils.$;

  async function refresh() {
    const [k, depts, mandals] = await Promise.all([
      PrajaApi.getDistrictKPIs(), PrajaApi.getDeptKPIs(), PrajaApi.getMandalKPIs()
    ]);

    // KPI tiles
    const tiles = [
      { k: "kpi_total",            v: k.total || 0,                                             cls: "kpi--saffron" },
      { k: "kpi_pending",          v: k.pending || 0 },
      { k: "kpi_resolved",         v: (k.resolved || 0) + (k.closed || 0),                      cls: "kpi--green" },
      { k: "kpi_overdue",          v: k.overdue || 0,                                           cls: "kpi--red" },
      { k: "kpi_resolution_rate",  v: (k.resolution_pct || 0) + "%",                            cls: "kpi--green" },
      { k: "kpi_avg_days",         v: (k.avg_resolution_days || 0) + "d",                       cls: "kpi--gray" },
    ];
    const host = $("#kpis"); host.innerHTML = "";
    tiles.forEach(function (t) {
      host.appendChild(PrajaUtils.el("div", { class: "kpi " + (t.cls || "") }, [
        PrajaUtils.el("span", { class: "kpi__label", "data-t": t.k }, t.k),
        PrajaUtils.el("span", { class: "kpi__value" }, PrajaUtils.n ? (typeof t.v === "number" ? PrajaUtils.n(t.v) : t.v) : t.v),
      ]));
    });
    PrajaI18n.apply(host);

    // Dept chart
    const dCtx = $("#ch-dept").getContext("2d");
    if (window._chDept) window._chDept.destroy();
    const top = depts.slice(0, 10);
    window._chDept = new Chart(dCtx, {
      type: "bar",
      data: {
        labels: top.map(function (d) { return lang === "te" ? (d.department_name_te || d.department_name_en) : d.department_name_en; }),
        datasets: [
          { label: "Pending",  data: top.map(function (d) { return d.pending || 0; }),  backgroundColor: "#f97316" },
          { label: "Resolved", data: top.map(function (d) { return d.resolved || 0; }), backgroundColor: "#16a34a" },
          { label: "Overdue",  data: top.map(function (d) { return d.overdue || 0; }),  backgroundColor: "#dc2626" },
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, indexAxis: "y", scales: { x: { stacked: true }, y: { stacked: true } } }
    });

    // SLA donut
    const sCtx = $("#ch-sla").getContext("2d");
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

    // Heatmap
    if (!window._map) {
      window._map = L.map("map").setView([17.35, 80.30], 9);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(window._map);
      window._mapLayer = L.layerGroup().addTo(window._map);
    }
    window._mapLayer.clearLayers();
    const max = Math.max(1, ...mandals.map(function (m) { return m.total || 0; }));
    mandals.forEach(function (m) {
      if (!m.lat || !m.lng) return;
      const radius = 8 + Math.sqrt((m.total || 0) / max) * 28;
      const colour = (m.overdue || 0) > 0 ? "#dc2626" : ((m.total || 0) > 0 ? "#1d4ed8" : "#94a3b8");
      const c = L.circleMarker([m.lat, m.lng], { radius: radius, color: colour, fillColor: colour, fillOpacity: 0.45, weight: 2 });
      c.bindTooltip(
        "<b>" + (lang==="te"?(m.mandal_name_te||m.mandal_name_en):m.mandal_name_en) + "</b><br>" +
        "Total: " + (m.total||0) + "<br>Pending: " + (m.pending||0) + "<br>Overdue: " + (m.overdue||0)
      );
      c.addTo(window._mapLayer);
    });
  }

  await refresh();
  PrajaApi.subscribeGrievances({ onInsert: refresh, onUpdate: refresh });
})();
