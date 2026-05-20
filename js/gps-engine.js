// =============================================================================
// CFL GPS Engine — Continuous location tracking, offline queuing, sync
// =============================================================================
(function (root) {
  'use strict';

  const cfg = root.CFL_CONFIG;
  const sb  = () => root.supabaseClient;

  // IndexedDB for offline queue
  let _db = null;
  const DB_NAME    = 'cfl_offline';
  const STORE_NAME = 'gps_queue';

  async function openDB() {
    if (_db) return _db;
    return new Promise((res, rej) => {
      const req = indexedDB.open(DB_NAME, 2);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME))
          db.createObjectStore(STORE_NAME, { keyPath: 'local_id', autoIncrement: true });
        if (!db.objectStoreNames.contains('camp_queue'))
          db.createObjectStore('camp_queue', { keyPath: 'local_id', autoIncrement: true });
      };
      req.onsuccess  = e => { _db = e.target.result; res(_db); };
      req.onerror    = e => rej(e.target.error);
    });
  }

  async function queueOffline(record) {
    const db  = await openDB();
    const tx  = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).add(record);
  }

  async function flushOfflineQueue() {
    const db    = await openDB();
    const tx    = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const all   = await new Promise((res, rej) => {
      const req = store.getAll();
      req.onsuccess = () => res(req.result);
      req.onerror   = () => rej(req.error);
    });
    if (!all.length) return;
    const clean = all.map(r => { const c = { ...r }; delete c.local_id; return c; });
    const { error } = await sb().from('cfl_gps_tracking').insert(clean);
    if (!error) {
      const delTx = db.transaction(STORE_NAME, 'readwrite');
      all.forEach(r => delTx.objectStore(STORE_NAME).delete(r.local_id));
      console.log('[GPS] Flushed', all.length, 'offline records');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Tracking state
  // ─────────────────────────────────────────────────────────────────────────

  let _counselorId    = null;
  let _deviceId       = null;
  let _watchId        = null;
  let _intervalId     = null;
  let _lastPosition   = null;
  let _lastPingTime   = null;
  let _trackingActive = false;
  let _listeners      = {};

  function on(event, fn) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(fn);
    return () => { _listeners[event] = _listeners[event].filter(f => f !== fn); };
  }

  function emit(event, data) {
    (_listeners[event] || []).forEach(fn => { try { fn(data); } catch(e) {} });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Device ID binding (persist across sessions)
  // ─────────────────────────────────────────────────────────────────────────

  function getOrCreateDeviceId() {
    let did = localStorage.getItem('cfl_device_id');
    if (!did) {
      did = 'DVC-' + Date.now().toString(36).toUpperCase() + '-' +
            Math.random().toString(36).slice(2, 6).toUpperCase();
      localStorage.setItem('cfl_device_id', did);
    }
    return did;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Core GPS fix
  // ─────────────────────────────────────────────────────────────────────────

  function getCurrentPosition() {
    return new Promise((res, rej) => {
      if (!navigator.geolocation) { rej(new Error('Geolocation not supported')); return; }
      navigator.geolocation.getCurrentPosition(res, rej, {
        enableHighAccuracy: cfg.GPS_HIGH_ACCURACY,
        timeout:            cfg.GPS_TIMEOUT_MS,
        maximumAge:         cfg.GPS_MAX_AGE_MS,
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Build tracking record from position
  // ─────────────────────────────────────────────────────────────────────────

  function buildRecord(position, extra = {}) {
    const c = position.coords;
    const speedKmh = c.speed != null ? c.speed * 3.6 : null;
    const isMoving = speedKmh != null ? speedKmh > cfg.MOVEMENT_MIN_SPEED_KMH : false;

    // Spoofing signals collected here; full analysis in SpoofDetector
    const mockSigs = root.CflSpoofDetector
      ? root.CflSpoofDetector.analyze(position, _lastPosition)
      : { mock_location: false, mock_reason: null };

    return {
      counselor_id:        _counselorId,
      lat:                 parseFloat(c.latitude.toFixed(6)),
      lng:                 parseFloat(c.longitude.toFixed(6)),
      accuracy_m:          c.accuracy ? parseFloat(c.accuracy.toFixed(2)) : null,
      altitude_m:          c.altitude ? parseFloat(c.altitude.toFixed(2)) : null,
      speed_kmh:           speedKmh   ? parseFloat(speedKmh.toFixed(2))  : null,
      heading_deg:         c.heading  ? parseFloat(c.heading.toFixed(2)) : null,
      is_moving:           isMoving,
      mock_location:       mockSigs.mock_location,
      mock_reason:         mockSigs.mock_reason,
      battery_pct:         extra.battery_pct || null,
      network_type:        getNetworkType(),
      device_ts:           new Date(position.timestamp).toISOString(),
      device_id:           _deviceId,
      app_version:         cfg.VERSION,
      synced_from_offline: false,
    };
  }

  function getNetworkType() {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn) return null;
    return conn.effectiveType || conn.type || null;
  }

  async function getBatteryPct() {
    if (!navigator.getBattery) return null;
    try {
      const bat = await navigator.getBattery();
      return Math.round(bat.level * 100);
    } catch { return null; }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Ping — take a fix and submit it
  // ─────────────────────────────────────────────────────────────────────────

  async function ping() {
    if (!_counselorId) return;
    let position;
    try {
      position = await getCurrentPosition();
    } catch (err) {
      emit('gps_error', { error: err.message, code: err.code });
      // emit offline event
      _trackGpsDown();
      return;
    }

    const batt   = await getBatteryPct();
    const record = buildRecord(position, { battery_pct: batt });

    // Check geofence for all assigned villages
    if (root.CflGeofenceEngine) {
      await root.CflGeofenceEngine.check(record, _counselorId);
    }

    _lastPosition = position;
    _lastPingTime = Date.now();

    emit('position', { record, position });

    // Try to send to Supabase; queue offline if no network
    const online = navigator.onLine;
    if (online) {
      await flushOfflineQueue(); // drain backlog first
      const { error } = await sb().from('cfl_gps_tracking').insert([record]);
      if (error) {
        console.warn('[GPS] Insert failed, queuing:', error.message);
        record.synced_from_offline = true;
        await queueOffline(record);
      }
    } else {
      record.synced_from_offline = true;
      await queueOffline(record);
      emit('offline_queued', { queued: true });
    }

    // Adjust next interval: faster when moving
    const moving = record.is_moving;
    if (_intervalId) {
      clearInterval(_intervalId);
      _intervalId = setInterval(ping, moving ? cfg.GPS_INTERVAL_FAST_MS : cfg.GPS_INTERVAL_MS);
    }
  }

  function _trackGpsDown() {
    // notify alert engine
    if (root.CflAlertEngine) root.CflAlertEngine.trigger('gps_offline', _counselorId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Start / Stop tracking
  // ─────────────────────────────────────────────────────────────────────────

  async function startTracking(counselorId) {
    if (_trackingActive) return;
    _counselorId    = counselorId;
    _deviceId       = getOrCreateDeviceId();
    _trackingActive = true;

    emit('tracking_started', { counselorId });

    // Immediate first ping
    await ping();

    // Scheduled pings
    _intervalId = setInterval(ping, cfg.GPS_INTERVAL_MS);

    // Background sync on reconnect
    window.addEventListener('online', async () => {
      await flushOfflineQueue();
    });

    // Wake-lock to prevent screen sleep on Android PWA
    _requestWakeLock();
  }

  function stopTracking() {
    _trackingActive = false;
    if (_watchId   !== null) { navigator.geolocation.clearWatch(_watchId); _watchId = null; }
    if (_intervalId !== null) { clearInterval(_intervalId); _intervalId = null; }
    _releaseWakeLock();
    emit('tracking_stopped', {});
  }

  let _wakeLock = null;
  async function _requestWakeLock() {
    if (!('wakeLock' in navigator)) return;
    try { _wakeLock = await navigator.wakeLock.request('screen'); } catch {}
  }
  function _releaseWakeLock() {
    if (_wakeLock) { _wakeLock.release().catch(() => {}); _wakeLock = null; }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Distance & path utilities
  // ─────────────────────────────────────────────────────────────────────────

  function haversine(lat1, lng1, lat2, lng2) {
    const R     = 6371000;
    const dLat  = (lat2 - lat1) * Math.PI / 180;
    const dLng  = (lng2 - lng1) * Math.PI / 180;
    const a     = Math.sin(dLat / 2) ** 2 +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function totalPathKm(pings) {
    let km = 0;
    for (let i = 1; i < pings.length; i++) {
      km += haversine(pings[i-1].lat, pings[i-1].lng, pings[i].lat, pings[i].lng);
    }
    return (km / 1000).toFixed(2);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch route history for replay
  // ─────────────────────────────────────────────────────────────────────────

  async function fetchDayRoute(counselorId, date) {
    const start = date + 'T00:00:00+05:30';
    const end   = date + 'T23:59:59+05:30';
    const { data, error } = await sb()
      .from('cfl_gps_tracking')
      .select('lat,lng,speed_kmh,is_moving,device_ts,inside_geofence,mock_location')
      .eq('counselor_id', counselorId)
      .gte('device_ts', start)
      .lte('device_ts', end)
      .order('device_ts', { ascending: true });
    return { data: data || [], error };
  }

  async function fetchAllCounselorLatest() {
    const { data, error } = await sb()
      .from('cfl_counselor_live_status')
      .select(`
        counselor_id, last_lat, last_lng, last_ping_at, tracking_status,
        current_village, speed_kmh, today_km, today_villages, today_camps,
        battery_pct, mock_detected,
        cfl_profiles!counselor_id(full_name, mobile, employee_id,
          cfl_centres!cfl_centre_id(code, name))
      `);
    return { data: data || [], error };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────────────────

  root.CflGpsEngine = {
    startTracking,
    stopTracking,
    ping,
    on,
    haversine,
    totalPathKm,
    fetchDayRoute,
    fetchAllCounselorLatest,
    flushOfflineQueue,
    getDeviceId: getOrCreateDeviceId,
    get isActive() { return _trackingActive; },
    get lastPosition() { return _lastPosition; },
    get lastPingTime() { return _lastPingTime; },
  };

})(window);
