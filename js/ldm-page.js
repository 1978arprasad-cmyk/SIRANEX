// =============================================================================
// LDM Dashboard Page — Live district command centre
// =============================================================================
(function (root) {
  'use strict';

  const cfg = root.CFL_CONFIG;
  const sb  = () => root.supabaseClient;

  let _map, _counselorLayer, _villageLayer, _pathLayers = {};
  let _selectedCounselor = null;
  let _alertChannel = null;
  let _refreshInterval = null;
  let _markers = {};

  // ─────────────────────────────────────────────────────────────────────────
  // MAP INIT
  // ─────────────────────────────────────────────────────────────────────────

  function initMap() {
    _map = L.map('ldm-map', { center: [cfg.MAP_CENTER_LAT, cfg.MAP_CENTER_LNG], zoom: cfg.MAP_DEFAULT_ZOOM });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(_map);

    _counselorLayer = L.layerGroup().addTo(_map);
    _villageLayer   = L.layerGroup().addTo(_map);

    // Layer control
    L.control.layers({
      'Street Map': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
      'Satellite':  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri'
      }),
    }, {
      'Counselors': _counselorLayer,
      'Villages':   _villageLayer,
    }).addTo(_map);

    loadVillagesOnMap();
  }

  function makeMarkerIcon(status, initials) {
    const colors = cfg.STATUS_COLORS;
    const color  = colors[status] || colors.offline;
    const svg = `<svg width="36" height="42" viewBox="0 0 36 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 0C8.059 0 0 8.059 0 18c0 12.958 18 42 18 42s18-29.042 18-42C36 8.059 27.941 0 18 0z" fill="${color}"/>
      <circle cx="18" cy="18" r="12" fill="white" fill-opacity="0.9"/>
      <text x="18" y="23" font-family="Arial" font-weight="bold" font-size="11" text-anchor="middle" fill="${color}">${initials}</text>
    </svg>`;
    return L.divIcon({
      html: svg,
      iconSize: [36, 42],
      iconAnchor: [18, 42],
      popupAnchor: [0, -42],
      className: '',
    });
  }

  function makeVillageIcon(priority) {
    const size = priority === 1 ? 12 : priority === 2 ? 10 : 8;
    const color = priority === 1 ? '#dc2626' : priority === 2 ? '#d97706' : '#16a34a';
    return L.circleMarker([0,0], { radius: size, color, fillColor: color, fillOpacity: 0.5, weight: 2 });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LOAD VILLAGES
  // ─────────────────────────────────────────────────────────────────────────

  async function loadVillagesOnMap() {
    const { data } = await sb()
      .from('cfl_villages')
      .select('id,name,mandal,lat,lng,geofence_radius_m,priority,population')
      .eq('is_active', true);

    _villageLayer.clearLayers();
    (data || []).forEach(v => {
      // Geofence circle
      L.circle([parseFloat(v.lat), parseFloat(v.lng)], {
        radius:      v.geofence_radius_m || 300,
        color:       '#6366f1',
        fillColor:   '#6366f1',
        fillOpacity: 0.08,
        weight:      1,
        dashArray:   '4 4',
      }).addTo(_villageLayer);

      // Village marker
      const marker = L.circleMarker([parseFloat(v.lat), parseFloat(v.lng)], {
        radius:      v.priority === 1 ? 9 : 7,
        color:       '#4f46e5',
        fillColor:   '#818cf8',
        fillOpacity: 0.9,
        weight:      2,
      }).addTo(_villageLayer);

      marker.bindTooltip(`<b>${v.name}</b><br>${v.mandal} Mandal<br>Pop: ${(v.population || 0).toLocaleString()}`, {
        permanent: false, sticky: true,
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UPDATE COUNSELOR MARKERS
  // ─────────────────────────────────────────────────────────────────────────

  function updateCounselorMarkers(counselors) {
    const seen = new Set();
    counselors.forEach(cs => {
      if (!cs.last_lat || !cs.last_lng) return;
      const cid      = cs.counselor_id;
      const profile  = cs.cfl_profiles;
      const name     = profile?.full_name || 'Unknown';
      const initials = name.split(' ').slice(0,2).map(w => w[0]).join('');
      const status   = cs.tracking_status || 'offline';
      const latlng   = [parseFloat(cs.last_lat), parseFloat(cs.last_lng)];
      seen.add(cid);

      const popup = `
        <div class="map-popup">
          <div class="map-popup__name">${name}</div>
          <div class="map-popup__centre">${profile?.cfl_centres?.name || ''}</div>
          <div class="map-popup__status status-${status}">${statusLabel(status)}</div>
          <div class="map-popup__meta">
            <span>📍 ${cs.current_village || 'In transit'}</span>
            <span>🚗 ${cs.today_km?.toFixed(1) || 0} km</span>
            <span>🏕 ${cs.today_camps || 0} camps</span>
            <span>🔋 ${cs.battery_pct ? cs.battery_pct + '%' : '–'}</span>
          </div>
          <div class="map-popup__time">Last ping: ${formatRelTime(cs.last_ping_at)}</div>
          ${cs.mock_detected ? '<div class="map-popup__alert">⚠ Mock location detected</div>' : ''}
          <div class="map-popup__actions">
            <button onclick="LdmPage.viewRoute('${cid}','${name}')" class="btn btn--xs btn--primary">Route</button>
            <button onclick="LdmPage.callCounselor('${profile?.mobile}')" class="btn btn--xs btn--outline">Call</button>
          </div>
        </div>`;

      if (_markers[cid]) {
        _markers[cid].setLatLng(latlng);
        _markers[cid].setIcon(makeMarkerIcon(status, initials));
        _markers[cid].setPopupContent(popup);
      } else {
        const m = L.marker(latlng, { icon: makeMarkerIcon(status, initials) })
          .bindPopup(popup, { maxWidth: 240 })
          .addTo(_counselorLayer);
        _markers[cid] = m;
      }
    });

    // Remove stale markers
    Object.keys(_markers).forEach(cid => {
      if (!seen.has(cid)) { _markers[cid].remove(); delete _markers[cid]; }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ROUTE REPLAY
  // ─────────────────────────────────────────────────────────────────────────

  async function viewRoute(counselorId, counselorName) {
    _selectedCounselor = counselorId;
    const date = document.getElementById('route-date')?.value || new Date().toISOString().slice(0,10);
    const { data } = await root.CflGpsEngine.fetchDayRoute(counselorId, date);

    // Remove old path
    if (_pathLayers[counselorId]) { _map.removeLayer(_pathLayers[counselorId]); }

    if (!data.length) { showToast('No GPS data for ' + counselorName + ' on ' + date, 'info'); return; }

    const latlngs = data.map(p => [parseFloat(p.lat), parseFloat(p.lng)]);
    const polyline = L.polyline(latlngs, { color: '#2563eb', weight: 3, opacity: 0.8 }).addTo(_map);
    _pathLayers[counselorId] = polyline;
    _map.fitBounds(polyline.getBounds(), { padding: [40, 40] });

    // Mark start/end
    L.marker(latlngs[0], { icon: makeMarkerIcon('online', '▶') }).addTo(_map)
      .bindTooltip('Start: ' + new Date(data[0].device_ts).toLocaleTimeString('en-IN'));
    L.marker(latlngs[latlngs.length-1], { icon: makeMarkerIcon('idle', '■') }).addTo(_map)
      .bindTooltip('End: ' + new Date(data[data.length-1].device_ts).toLocaleTimeString('en-IN'));

    // Update sidebar
    const km  = root.CflGpsEngine?.totalPathKm(data) || 0;
    const mockCount = data.filter(p => p.mock_location).length;
    document.getElementById('route-stats').innerHTML = `
      <div class="route-stat"><span>Total Distance</span><strong>${km} km</strong></div>
      <div class="route-stat"><span>GPS Points</span><strong>${data.length}</strong></div>
      <div class="route-stat"><span>Mock Signals</span><strong class="${mockCount > 0 ? 'text-red' : ''}">${mockCount}</strong></div>
      <div class="route-stat"><span>Date</span><strong>${date}</strong></div>`;
  }

  function callCounselor(mobile) {
    if (mobile) window.location.href = 'tel:+91' + mobile;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN REFRESH
  // ─────────────────────────────────────────────────────────────────────────

  async function refresh() {
    // KPI tiles
    const { data: kpi } = await sb().from('v_cfl_district_kpis').select('*').single();
    if (kpi) updateKpiTiles(kpi);

    // Counselor list + map
    const { data: counselors } = await root.CflGpsEngine.fetchAllCounselorLatest();
    if (counselors) {
      updateCounselorMarkers(counselors);
      updateCounselorTable(counselors);
    }

    // Alerts
    const { data: alerts } = await root.CflAlertEngine.fetchActiveAlerts(20);
    if (alerts) updateAlertPanel(alerts.data || alerts);
  }

  function updateKpiTiles(kpi) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('kpi-total',    kpi.total_counselors);
    set('kpi-active',   kpi.active_now);
    set('kpi-camp',     kpi.conducting_camp);
    set('kpi-offline',  kpi.offline_counselors);
    set('kpi-camps',    kpi.camps_today);
    set('kpi-people',   (kpi.participants_today || 0).toLocaleString('en-IN'));
    set('kpi-alerts',   kpi.active_alerts);
    set('kpi-villages', kpi.villages_visited_today);
  }

  function updateCounselorTable(counselors) {
    const tbody = document.getElementById('counselor-tbody');
    if (!tbody) return;
    tbody.innerHTML = counselors.map(cs => {
      const name    = cs.cfl_profiles?.full_name || '–';
      const centre  = cs.cfl_profiles?.cfl_centres?.code || '–';
      const status  = cs.tracking_status || 'offline';
      const minsAgo = cs.last_ping_at
        ? Math.round((Date.now() - new Date(cs.last_ping_at)) / 60000)
        : null;
      return `<tr class="${cs.mock_detected ? 'tr--suspicious' : ''}">
        <td><span class="dot dot--${status}"></span> ${name}</td>
        <td>${centre}</td>
        <td><span class="badge badge--${status}">${statusLabel(status)}</span></td>
        <td>${cs.current_village || '–'}</td>
        <td>${cs.today_km?.toFixed(1) || 0} km</td>
        <td>${cs.today_villages || 0}</td>
        <td>${cs.today_camps || 0}</td>
        <td>${minsAgo !== null ? minsAgo + ' min ago' : 'Never'}</td>
        <td>${cs.battery_pct ? cs.battery_pct + '%' : '–'}</td>
        <td>${cs.mock_detected ? '<span class="badge badge--critical">⚠ Mock</span>' : '–'}</td>
        <td>
          <button class="btn btn--xs btn--primary" onclick="LdmPage.viewRoute('${cs.counselor_id}','${name}')">Route</button>
          <button class="btn btn--xs btn--outline" onclick="LdmPage.callCounselor('${cs.cfl_profiles?.mobile}')">📞</button>
        </td>
      </tr>`;
    }).join('');
  }

  function updateAlertPanel(alerts) {
    const panel = document.getElementById('alert-list');
    if (!panel) return;
    if (!alerts.length) { panel.innerHTML = '<div class="alert-empty">✓ No active alerts</div>'; return; }
    panel.innerHTML = alerts.map(a => `
      <div class="alert-item alert-item--${a.severity}">
        <div class="alert-item__header">
          <span class="badge badge--${a.severity}">${a.severity.toUpperCase()}</span>
          <span class="alert-item__time">${formatRelTime(a.created_at)}</span>
        </div>
        <div class="alert-item__title">${a.title}</div>
        <div class="alert-item__msg">${a.message}</div>
        <button class="btn btn--xs btn--outline mt-2" onclick="LdmPage.ackAlert('${a.id}')">Acknowledge</button>
      </div>`).join('');
  }

  async function ackAlert(alertId) {
    const ldmProfile = await getLdmProfile();
    await root.CflAlertEngine.acknowledge(alertId, ldmProfile?.id);
    await refresh();
  }

  async function getLdmProfile() {
    const { data } = await sb().from('cfl_profiles').select('id').eq('role', 'ldm').single();
    return data;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REALTIME SUBSCRIPTION
  // ─────────────────────────────────────────────────────────────────────────

  function subscribeRealtime() {
    _alertChannel = sb()
      .channel('cfl-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cfl_alerts' },
          () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cfl_counselor_live_status' },
          payload => {
            // Quick update of single counselor without full refresh
            if (payload.new) refresh();
          })
      .subscribe();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ANALYTICS CHARTS
  // ─────────────────────────────────────────────────────────────────────────

  async function loadAnalyticsCharts() {
    const month = new Date().getMonth() + 1;
    const year  = new Date().getFullYear();

    const { data: scores } = await sb()
      .from('cfl_performance_scores')
      .select(`
        total_score, performance_grade,
        cfl_profiles!counselor_id(full_name)
      `)
      .eq('score_month', month)
      .eq('score_year', year)
      .order('total_score', { ascending: false });

    if (!scores?.length) return;

    const perfCtx = document.getElementById('perf-chart')?.getContext('2d');
    if (perfCtx && root.Chart) {
      new root.Chart(perfCtx, {
        type: 'bar',
        data: {
          labels: scores.map(s => s.cfl_profiles?.full_name?.split(' ')[0] || ''),
          datasets: [{
            label: 'Monthly Score',
            data:  scores.map(s => s.total_score?.toFixed(1)),
            backgroundColor: scores.map(s =>
              s.total_score >= 80 ? '#16a34a' :
              s.total_score >= 60 ? '#d97706' : '#dc2626'
            ),
            borderRadius: 6,
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { min: 0, max: 100, title: { display: true, text: 'Score / 100' } },
          },
        },
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────────────────────────────────

  async function init() {
    initMap();
    await refresh();
    subscribeRealtime();
    root.CflAlertEngine?.runScheduledChecks();

    // Auto-refresh every 2 minutes
    _refreshInterval = setInterval(() => {
      refresh();
      root.CflAlertEngine?.runScheduledChecks();
    }, 120_000);

    // Expose globals for inline onclick handlers
    root.LdmPage = { viewRoute, callCounselor, ackAlert, refresh };

    // Wire up report buttons
    document.getElementById('btn-perf-pdf')?.addEventListener('click', () => {
      const m = new Date().getMonth() + 1, y = new Date().getFullYear();
      root.CflReports?.generatePerformanceReportPDF(m, y);
    });
    document.getElementById('btn-district-pdf')?.addEventListener('click', () => {
      root.CflReports?.generateDistrictDailySummary(new Date().toISOString().slice(0,10));
    });
    document.getElementById('btn-suspicious-xlsx')?.addEventListener('click', () => {
      const today = new Date().toISOString().slice(0,10);
      const ago7  = new Date(Date.now() - 7*86400000).toISOString().slice(0,10);
      root.CflReports?.generateSuspiciousActivityReport(ago7, today);
    });

    loadAnalyticsCharts();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  function statusLabel(s) {
    return { online: '● Active', idle: '◐ Idle', offline: '○ Offline', conducting_camp: '▲ Camp' }[s] || s;
  }

  function formatRelTime(ts) {
    if (!ts) return 'Never';
    const diff = Math.round((Date.now() - new Date(ts)) / 60000);
    if (diff < 1)  return 'Just now';
    if (diff < 60) return `${diff} min ago`;
    return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  function showToast(msg, type = 'info') {
    root.PrajaUtils?.toast?.(msg, type) || console.log('[Toast]', msg);
  }

  document.addEventListener('DOMContentLoaded', init);

})(window);
