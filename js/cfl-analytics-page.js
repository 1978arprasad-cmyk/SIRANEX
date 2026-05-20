// =============================================================================
// CFL Analytics Page — District-wide charts and heatmap
// =============================================================================
(function (root) {
  'use strict';

  const sb = () => root.supabaseClient;

  let _charts = {};

  async function init() {
    if (!root.Chart) return;
    await Promise.all([
      loadPerformanceChart(),
      loadVillageChart(),
      loadCampTrendChart(),
      loadAlertChart(),
      loadCentreComparisonChart(),
    ]);
  }

  // Monthly performance scores
  async function loadPerformanceChart() {
    const month = new Date().getMonth() + 1;
    const year  = new Date().getFullYear();
    const { data } = await sb()
      .from('cfl_performance_scores')
      .select('total_score, cfl_profiles!counselor_id(full_name)')
      .eq('score_month', month)
      .eq('score_year', year)
      .order('total_score', { ascending: false });
    if (!data?.length) return;

    const ctx = document.getElementById('chart-performance')?.getContext('2d');
    if (!ctx) return;
    if (_charts.perf) _charts.perf.destroy();
    _charts.perf = new root.Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.cfl_profiles?.full_name?.split(' ')[0] || ''),
        datasets: [{
          label: 'Score',
          data: data.map(d => parseFloat(d.total_score?.toFixed(1) || 0)),
          backgroundColor: data.map(d =>
            d.total_score >= 80 ? '#16a34a' :
            d.total_score >= 60 ? '#d97706' : '#dc2626'
          ),
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false },
          tooltip: { callbacks: { label: ctx => 'Score: ' + ctx.raw + '/100' } }
        },
        scales: { y: { min: 0, max: 100 } },
      },
    });
  }

  // Villages visited per counselor this month
  async function loadVillageChart() {
    const { data } = await sb()
      .from('cfl_daily_summaries')
      .select('counselor_id, villages_visited, cfl_profiles!counselor_id(full_name)')
      .gte('summary_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10))
      .order('villages_visited', { ascending: false });

    if (!data?.length) return;

    // Aggregate by counselor
    const totals = {};
    data.forEach(d => {
      const name = d.cfl_profiles?.full_name?.split(' ')[0] || 'Unknown';
      totals[name] = (totals[name] || 0) + (d.villages_visited || 0);
    });

    const ctx = document.getElementById('chart-villages')?.getContext('2d');
    if (!ctx) return;
    if (_charts.village) _charts.village.destroy();
    _charts.village = new root.Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(totals),
        datasets: [{
          data: Object.values(totals),
          backgroundColor: ['#1e3a8a','#1d4ed8','#2563eb','#3b82f6','#60a5fa','#93c5fd',
                            '#16a34a','#15803d','#166534','#dc2626','#b91c1c','#991b1b'],
          borderWidth: 2, borderColor: '#fff',
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'right' } },
      },
    });
  }

  // Camp trend (last 30 days)
  async function loadCampTrendChart() {
    const from = new Date(Date.now() - 30 * 86400000).toISOString().slice(0,10);
    const { data } = await sb()
      .from('cfl_camp_reports')
      .select('camp_date, participant_count, status')
      .gte('camp_date', from)
      .neq('status', 'rejected')
      .order('camp_date');

    if (!data?.length) return;

    // Group by date
    const byDate = {};
    const partByDate = {};
    data.forEach(d => {
      byDate[d.camp_date]     = (byDate[d.camp_date] || 0) + 1;
      partByDate[d.camp_date] = (partByDate[d.camp_date] || 0) + (d.participant_count || 0);
    });

    const dates  = Object.keys(byDate).sort();
    const ctx = document.getElementById('chart-camps')?.getContext('2d');
    if (!ctx) return;
    if (_charts.camps) _charts.camps.destroy();
    _charts.camps = new root.Chart(ctx, {
      type: 'line',
      data: {
        labels: dates.map(d => d.slice(5)),  // MM-DD
        datasets: [
          {
            label: 'Camps',
            data: dates.map(d => byDate[d]),
            borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,.1)',
            fill: true, tension: 0.4,
          },
          {
            label: 'Participants',
            data: dates.map(d => partByDate[d]),
            borderColor: '#16a34a', backgroundColor: 'rgba(22,163,74,.05)',
            fill: false, tension: 0.4, yAxisID: 'y2',
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: {
          y:  { title: { display: true, text: 'Camps' } },
          y2: { position: 'right', title: { display: true, text: 'Participants' }, grid: { drawOnChartArea: false } },
        },
      },
    });
  }

  // Alert distribution by type
  async function loadAlertChart() {
    const { data } = await sb()
      .from('cfl_alerts')
      .select('alert_type')
      .gte('created_at', new Date(Date.now() - 30*86400000).toISOString());
    if (!data?.length) return;

    const counts = {};
    data.forEach(a => { counts[a.alert_type] = (counts[a.alert_type] || 0) + 1; });

    const ctx = document.getElementById('chart-alerts')?.getContext('2d');
    if (!ctx) return;
    if (_charts.alerts) _charts.alerts.destroy();
    _charts.alerts = new root.Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(counts).map(k => k.replace(/_/g,' ')),
        datasets: [{
          label: 'Count',
          data: Object.values(counts),
          backgroundColor: '#dc2626',
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true } },
      },
    });
  }

  // Centre comparison
  async function loadCentreComparisonChart() {
    const { data } = await sb()
      .from('cfl_centres')
      .select(`
        name, code,
        cfl_profiles!cfl_centre_id(
          cfl_daily_summaries!counselor_id(villages_visited, camps_conducted, total_km)
        )
      `)
      .eq('is_active', true);
    if (!data?.length) return;

    const centres = data.map(c => {
      const summaries = c.cfl_profiles?.flatMap(p => p.cfl_daily_summaries || []) || [];
      return {
        name: c.code,
        villages: summaries.reduce((s, d) => s + (d.villages_visited || 0), 0),
        camps:    summaries.reduce((s, d) => s + (d.camps_conducted || 0), 0),
        km:       summaries.reduce((s, d) => s + (d.total_km || 0), 0),
      };
    });

    const ctx = document.getElementById('chart-centres')?.getContext('2d');
    if (!ctx) return;
    if (_charts.centres) _charts.centres.destroy();
    _charts.centres = new root.Chart(ctx, {
      type: 'bar',
      data: {
        labels: centres.map(c => c.name),
        datasets: [
          { label: 'Villages', data: centres.map(c => c.villages), backgroundColor: '#3b82f6', borderRadius: 4 },
          { label: 'Camps',    data: centres.map(c => c.camps),    backgroundColor: '#16a34a', borderRadius: 4 },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: { x: { stacked: false }, y: { beginAtZero: true } },
      },
    });
  }

  root.CflAnalyticsPage = { init };
  document.addEventListener('DOMContentLoaded', init);

})(window);
