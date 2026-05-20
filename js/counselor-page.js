// =============================================================================
// CFL Counselor App Page — Mobile field worker interface
// =============================================================================
(function (root) {
  'use strict';

  const cfg   = root.CFL_CONFIG;
  const sb    = () => root.supabaseClient;

  let _counselorId = null;
  let _profile     = null;
  let _assignments = [];
  let _cameraStream = null;
  let _capturedPhotos = [];
  let _currentAssignment = null;
  let _reportingMode = false;
  let _nearbyVillages = [];
  let _miniMap = null;

  // ─────────────────────────────────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────────────────────────────────

  async function init() {
    await loadProfile();
    if (!_profile) { showError('Profile not found. Contact your LDM.'); return; }

    updateProfileUI();
    await loadTodayAssignments();
    setupEventListeners();
    initMiniMap();
    await startLocationServices();
    setupPWAInstall();
  }

  async function loadProfile() {
    // Try from localStorage first (for offline)
    const cached = localStorage.getItem('cfl_profile');
    if (cached) { _profile = JSON.parse(cached); _counselorId = _profile.id; }

    // Fetch from Supabase if online
    if (navigator.onLine) {
      const mobile = localStorage.getItem('cfl_mobile');
      if (!mobile) return;
      const { data } = await sb()
        .from('cfl_profiles')
        .select(`*, cfl_centres!cfl_centre_id(name, code, mandal, centre_lat, centre_lng)`)
        .eq('mobile', mobile)
        .eq('status', 'active')
        .single();
      if (data) {
        _profile = data;
        _counselorId = data.id;
        localStorage.setItem('cfl_profile', JSON.stringify(data));
      }
    }
  }

  function updateProfileUI() {
    if (!_profile) return;
    document.getElementById('p-name').textContent    = _profile.full_name;
    document.getElementById('p-empid').textContent   = _profile.employee_id;
    document.getElementById('p-centre').textContent  = _profile.cfl_centres?.name || '';
    document.getElementById('p-mandal').textContent  = _profile.cfl_centres?.mandal || '';
    document.getElementById('p-date').textContent    =
      new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TODAY'S ASSIGNMENTS
  // ─────────────────────────────────────────────────────────────────────────

  async function loadTodayAssignments() {
    const { data, error } = await root.CflCampReporter.fetchTodayAssignments(_counselorId);
    _assignments = data || [];
    renderAssignments();
  }

  function renderAssignments() {
    const container = document.getElementById('assignments-list');
    if (!container) return;
    if (!_assignments.length) {
      container.innerHTML = '<div class="empty-state">📋 No assignments for today</div>';
      return;
    }
    container.innerHTML = _assignments.map(a => {
      const village  = a.cfl_villages;
      const isDone   = a.status === 'completed';
      const isActive = a.status === 'in_progress';
      return `
        <div class="assignment-card ${isDone ? 'assignment-card--done' : ''} ${isActive ? 'assignment-card--active' : ''}">
          <div class="assignment-card__header">
            <span class="assignment-card__village">📍 ${village.name}</span>
            <span class="badge badge--${isDone ? 'success' : isActive ? 'primary' : 'default'}">${a.status}</span>
          </div>
          <div class="assignment-card__meta">
            <span>🏛 ${village.mandal} Mandal</span>
            <span>👥 Target: ${a.target_participants} persons</span>
          </div>
          <div class="assignment-card__topic">📚 ${a.camp_topic || 'Financial Literacy'}</div>
          ${!isDone ? `
          <div class="assignment-card__actions">
            <button class="btn btn--sm btn--outline" onclick="CounselorPage.showNavigation('${village.id}', ${village.lat}, ${village.lng}, '${village.name}')">
              🗺 Navigate
            </button>
            <button class="btn btn--sm btn--primary" onclick="CounselorPage.openCampReport('${a.id}')">
              📝 Report Camp
            </button>
          </div>` : ''}
        </div>`;
    }).join('');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GPS TRACKING
  // ─────────────────────────────────────────────────────────────────────────

  async function startLocationServices() {
    if (!_counselorId) return;

    // Setup geofence notifications
    root.CflGeofenceEngine?.on('checkin', ({ village }) => {
      showToast(`✅ Checked in: ${village.name}`, 'success');
      updateGeofenceStatus(village, true);
      playBeep();
    });
    root.CflGeofenceEngine?.on('checkout', ({ village, durationMin, valid }) => {
      const msg = valid
        ? `✓ Checked out: ${village.name} (${durationMin} min)`
        : `⚠ Short visit: ${village.name} only ${durationMin} min`;
      showToast(msg, valid ? 'info' : 'warning');
      updateGeofenceStatus(null, false);
    });

    root.CflGpsEngine.on('position', ({ record }) => {
      updateGpsStatusUI(record);
      updateMiniMap(record.lat, record.lng);
      updateNearbyVillages(record.lat, record.lng);
    });
    root.CflGpsEngine.on('gps_error', ({ error }) => {
      updateGpsStatusUI(null, error);
    });

    await root.CflGpsEngine.startTracking(_counselorId);
    root.CflGeofenceEngine?.loadVillages(_counselorId);
  }

  function updateGpsStatusUI(record, error = null) {
    const statusEl = document.getElementById('gps-status');
    const latEl    = document.getElementById('gps-lat');
    const lngEl    = document.getElementById('gps-lng');
    const accEl    = document.getElementById('gps-acc');
    const kmEl     = document.getElementById('gps-km');

    if (error) {
      if (statusEl) statusEl.className = 'gps-status gps-status--error';
      if (statusEl) statusEl.innerHTML = '🔴 GPS Unavailable';
      return;
    }
    if (!record) return;

    if (statusEl) {
      statusEl.className = 'gps-status gps-status--active';
      statusEl.innerHTML = record.mock_location
        ? '⚠ Mock Location Detected'
        : (record.is_moving ? '🟢 GPS Active — Moving' : '🟡 GPS Active — Stationary');
    }
    if (latEl) latEl.textContent = record.lat?.toFixed(5) || '–';
    if (lngEl) lngEl.textContent = record.lng?.toFixed(5) || '–';
    if (accEl) accEl.textContent = record.accuracy_m ? record.accuracy_m.toFixed(0) + 'm' : '–';
  }

  function updateGeofenceStatus(village, inside) {
    const el = document.getElementById('geofence-status');
    if (!el) return;
    el.innerHTML = inside && village
      ? `<div class="geofence-active">✅ Inside: ${village.name}</div>`
      : '<div class="geofence-inactive">📍 No village geofence active</div>';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MINI MAP
  // ─────────────────────────────────────────────────────────────────────────

  function initMiniMap() {
    const el = document.getElementById('mini-map');
    if (!el) return;
    _miniMap = L.map('mini-map', {
      center: [cfg.MAP_CENTER_LAT, cfg.MAP_CENTER_LNG],
      zoom:   12,
      zoomControl: true,
      attributionControl: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(_miniMap);
  }

  let _myMarker = null;
  function updateMiniMap(lat, lng) {
    if (!_miniMap) return;
    const latlng = [parseFloat(lat), parseFloat(lng)];
    if (!_myMarker) {
      _myMarker = L.circleMarker(latlng, {
        radius: 10, color: '#1e3a8a', fillColor: '#3b82f6', fillOpacity: 0.9, weight: 3
      }).addTo(_miniMap);
    } else {
      _myMarker.setLatLng(latlng);
    }
    _miniMap.panTo(latlng, { animate: true });
  }

  function updateNearbyVillages(lat, lng) {
    _nearbyVillages = root.CflGeofenceEngine?.getVillagesNearby(lat, lng, 3000) || [];
    const el = document.getElementById('nearby-villages');
    if (!el) return;
    el.innerHTML = _nearbyVillages.slice(0, 3).map(v =>
      `<div class="nearby-item">
        <span>📍 ${v.name}</span>
        <span class="${v.distance < v.geofence_radius_m ? 'text-green' : ''}">
          ${v.distance < 1000 ? v.distance.toFixed(0) + 'm' : (v.distance/1000).toFixed(1) + 'km'}
          ${v.distance < v.geofence_radius_m ? ' ✅ INSIDE' : ''}
        </span>
      </div>`
    ).join('') || '<div class="nearby-item muted">No villages within 3km</div>';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // NAVIGATION
  // ─────────────────────────────────────────────────────────────────────────

  function showNavigation(villageId, lat, lng, name) {
    // Open Google Maps navigation
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, '_blank');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CAMP REPORTING MODAL
  // ─────────────────────────────────────────────────────────────────────────

  async function openCampReport(assignmentId) {
    _currentAssignment = _assignments.find(a => a.id === assignmentId);
    _capturedPhotos = [];
    _reportingMode = true;
    document.getElementById('camp-modal')?.classList.remove('hidden');

    // Pre-fill form
    const village = _currentAssignment?.cfl_villages;
    if (village) {
      document.getElementById('camp-village-name').textContent = village.name;
      document.getElementById('camp-mandal').textContent = village.mandal;
    }

    // Set today's date and current time
    const now = new Date();
    const pad = n => String(n).padStart(2,'0');
    document.getElementById('camp-date').value      = now.toISOString().slice(0,10);
    document.getElementById('camp-start').value     = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    document.getElementById('camp-category').value  = _currentAssignment?.awareness_category || 'other';
    document.getElementById('camp-topic').value     = _currentAssignment?.camp_topic || '';
    document.getElementById('camp-target').value    = _currentAssignment?.target_participants || 20;

    updatePhotoGrid();
  }

  function closeCampReport() {
    _reportingMode = false;
    stopCameraIfOpen();
    document.getElementById('camp-modal')?.classList.add('hidden');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CAMERA & PHOTO CAPTURE
  // ─────────────────────────────────────────────────────────────────────────

  async function openCamera() {
    const video  = document.getElementById('camp-video');
    const camDiv = document.getElementById('camera-section');
    if (!video || !camDiv) return;
    try {
      _cameraStream = await root.CflCampReporter.startCamera(video);
      camDiv.classList.remove('hidden');
    } catch (err) {
      showToast('Camera error: ' + err.message, 'error');
    }
  }

  async function capturePhoto() {
    const video  = document.getElementById('camp-video');
    const canvas = document.getElementById('camp-canvas');
    if (!video || !canvas) return;

    showToast('Capturing GPS…', 'info');
    let gpsPos = null;
    try { gpsPos = await root.CflCampReporter.getPhotoGps(); } catch {}

    const blob = await root.CflCampReporter.capturePhoto(video, canvas);
    _capturedPhotos.push({ blob, gpsPos, canvas });

    showToast(`Photo ${_capturedPhotos.length} captured ✅`, 'success');
    updatePhotoGrid();

    if (_capturedPhotos.length >= cfg.MAX_PHOTOS_PER_CAMP) stopCameraIfOpen();
  }

  function stopCameraIfOpen() {
    root.CflCampReporter.stopCamera(_cameraStream);
    _cameraStream = null;
    document.getElementById('camera-section')?.classList.add('hidden');
  }

  function updatePhotoGrid() {
    const grid = document.getElementById('photo-grid');
    if (!grid) return;
    grid.innerHTML = _capturedPhotos.map((p, i) =>
      `<div class="photo-thumb">
        <img src="${URL.createObjectURL(p.blob)}" />
        <div class="photo-thumb__num">${i+1}</div>
        ${p.gpsPos ? '<div class="photo-thumb__gps">📍</div>' : ''}
        <button class="photo-thumb__del" onclick="CounselorPage.removePhoto(${i})">✕</button>
      </div>`
    ).join('');
    document.getElementById('photo-count').textContent =
      `${_capturedPhotos.length} / ${cfg.MAX_PHOTOS_PER_CAMP} photos`;

    const submitBtn = document.getElementById('btn-submit-camp');
    if (submitBtn) {
      submitBtn.disabled = _capturedPhotos.length < cfg.MIN_PHOTOS_PER_CAMP;
    }
  }

  function removePhoto(index) {
    _capturedPhotos.splice(index, 1);
    updatePhotoGrid();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SUBMIT CAMP REPORT
  // ─────────────────────────────────────────────────────────────────────────

  async function submitCampReport() {
    const submitBtn = document.getElementById('btn-submit-camp');
    if (submitBtn) submitBtn.disabled = true;
    showToast('Submitting camp report…', 'info');

    const formData = {
      camp_date:          document.getElementById('camp-date').value,
      start_time:         document.getElementById('camp-start').value,
      end_time:           document.getElementById('camp-end').value,
      topic:              document.getElementById('camp-topic').value,
      awareness_category: document.getElementById('camp-category').value,
      participant_count:  document.getElementById('camp-count').value,
      male_count:         document.getElementById('camp-male').value || 0,
      female_count:       document.getElementById('camp-female').value || 0,
      remarks:            document.getElementById('camp-remarks').value,
      village:            _currentAssignment?.cfl_villages,
    };

    // Get current GPS
    let gpsPosition = null;
    try { gpsPosition = await root.CflCampReporter.getPhotoGps(); } catch {}

    try {
      const result = await root.CflCampReporter.submitCampReport({
        counselorId:  _counselorId,
        villageId:    _currentAssignment?.cfl_villages?.id,
        assignmentId: _currentAssignment?.id,
        formData,
        photos:       _capturedPhotos,
        gpsPosition,
      });

      const hasFlags = result.suspiciousFlags.length > 0;
      showToast(
        hasFlags
          ? `⚠ Report submitted but flagged: ${result.suspiciousFlags.join(', ')}`
          : `✅ Camp report submitted! ${result.photoResults.length} photos uploaded.`,
        hasFlags ? 'warning' : 'success'
      );

      closeCampReport();
      await loadTodayAssignments();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EVENT LISTENERS
  // ─────────────────────────────────────────────────────────────────────────

  function setupEventListeners() {
    document.getElementById('btn-open-camera')?.addEventListener('click', openCamera);
    document.getElementById('btn-capture')?.addEventListener('click', capturePhoto);
    document.getElementById('btn-stop-camera')?.addEventListener('click', stopCameraIfOpen);
    document.getElementById('btn-submit-camp')?.addEventListener('click', submitCampReport);
    document.getElementById('btn-close-modal')?.addEventListener('click', closeCampReport);

    // participant total auto-calc
    ['camp-male', 'camp-female'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => {
        const m = parseInt(document.getElementById('camp-male').value) || 0;
        const f = parseInt(document.getElementById('camp-female').value) || 0;
        document.getElementById('camp-count').value = m + f;
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PWA INSTALL PROMPT
  // ─────────────────────────────────────────────────────────────────────────

  let _installPrompt = null;
  function setupPWAInstall() {
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      _installPrompt = e;
      document.getElementById('btn-install')?.classList.remove('hidden');
    });
    document.getElementById('btn-install')?.addEventListener('click', async () => {
      if (!_installPrompt) return;
      _installPrompt.prompt();
      await _installPrompt.userChoice;
      _installPrompt = null;
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) { console.log(msg); return; }
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }

  function showError(msg) {
    document.getElementById('error-banner')?.classList.remove('hidden');
    document.getElementById('error-msg').textContent = msg;
  }

  function playBeep() {
    try {
      const ctx = new (root.AudioContext || root.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }

  // Expose for inline onclick
  root.CounselorPage = {
    openCampReport,
    closeCampReport,
    removePhoto,
    showNavigation,
    capturePhoto,
    submitCampReport,
  };

  document.addEventListener('DOMContentLoaded', init);

})(window);
