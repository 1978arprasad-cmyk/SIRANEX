// =============================================================================
// CFL Geofence Engine — Auto check-in / check-out for villages
// =============================================================================
(function (root) {
  'use strict';

  const cfg = root.CFL_CONFIG;
  const sb  = () => root.supabaseClient;

  // In-memory state: which villages the counselor is currently "inside"
  const _insideSet   = new Map();   // villageId → { enteredAt, record }
  let   _villages    = [];          // cached assigned villages
  let   _counselorId = null;
  let   _listeners   = {};

  function on(event, fn) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(fn);
  }
  function emit(event, data) {
    (_listeners[event] || []).forEach(fn => { try { fn(data); } catch(e) {} });
  }

  function haversine(lat1, lng1, lat2, lng2) {
    const R    = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a    = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  // Load assigned villages for a counselor (today's assignments + all active villages for centre)
  async function loadVillages(counselorId) {
    _counselorId = counselorId;

    // Load ALL villages for the counselor's CFL centre (so routing guidance works too)
    const { data: profile } = await sb()
      .from('cfl_profiles')
      .select('cfl_centre_id')
      .eq('id', counselorId)
      .single();

    if (!profile) return;

    const { data: villages } = await sb()
      .from('cfl_villages')
      .select('id,name,lat,lng,geofence_radius_m,mandal')
      .eq('cfl_centre_id', profile.cfl_centre_id)
      .eq('is_active', true);

    _villages = villages || [];
    console.log('[Geofence] Loaded', _villages.length, 'villages');
  }

  // Check if a GPS record is inside any village geofence
  async function check(record, counselorId) {
    if (!_villages.length) await loadVillages(counselorId);

    let anyInside = false;
    const now = record.device_ts || new Date().toISOString();

    for (const village of _villages) {
      const dist = haversine(record.lat, record.lng, parseFloat(village.lat), parseFloat(village.lng));
      const radius = (village.geofence_radius_m || cfg.GEOFENCE_DEFAULT_RADIUS_M) + cfg.GEOFENCE_ENTRY_BUFFER_M;
      const inside = dist <= radius;

      if (inside && !_insideSet.has(village.id)) {
        // ENTRY — auto check-in
        _insideSet.set(village.id, { enteredAt: now, record });
        await _emitCheckin(counselorId, village, record, dist, now);
        anyInside = true;
      } else if (!inside && _insideSet.has(village.id)) {
        // EXIT — auto check-out
        const entry = _insideSet.get(village.id);
        _insideSet.delete(village.id);
        await _emitCheckout(counselorId, village, record, dist, now, entry.enteredAt);
      } else if (inside) {
        anyInside = true;
      }
    }

    // Update the record's geofence flag so it is stored correctly
    record.inside_geofence = anyInside;
    if (anyInside) {
      const activeVillage = _villages.find(v => _insideSet.has(v.id));
      if (activeVillage) record.current_village_id = activeVillage.id;
    } else {
      record.current_village_id = null;
    }
  }

  async function _emitCheckin(counselorId, village, record, dist, ts) {
    const event = {
      counselor_id:           counselorId,
      village_id:             village.id,
      event_type:             'checkin',
      lat:                    record.lat,
      lng:                    record.lng,
      accuracy_m:             record.accuracy_m,
      distance_from_centre_m: parseFloat(dist.toFixed(1)),
      device_ts:              ts,
    };

    // Look up active assignment
    const { data: assign } = await sb()
      .from('cfl_assignments')
      .select('id')
      .eq('counselor_id', counselorId)
      .eq('village_id', village.id)
      .eq('scheduled_date', ts.slice(0, 10))
      .maybeSingle();
    if (assign) event.assignment_id = assign.id;

    await sb().from('cfl_geofence_events').insert([event]);

    emit('checkin', { village, record, dist });
    console.log('[Geofence] CHECK-IN:', village.name, '—', dist.toFixed(0), 'm from centre');
  }

  async function _emitCheckout(counselorId, village, record, dist, ts, enteredAt) {
    const durationMin = Math.round((new Date(ts) - new Date(enteredAt)) / 60000);
    const event = {
      counselor_id:           counselorId,
      village_id:             village.id,
      event_type:             'checkout',
      lat:                    record.lat,
      lng:                    record.lng,
      accuracy_m:             record.accuracy_m,
      distance_from_centre_m: parseFloat(dist.toFixed(1)),
      device_ts:              ts,
      duration_minutes:       durationMin,
      is_valid:               durationMin >= cfg.GEOFENCE_MIN_STAY_MINUTES,
    };

    if (durationMin < cfg.GEOFENCE_MIN_STAY_MINUTES) {
      event.validity_reason = `Only ${durationMin} min stay (min ${cfg.GEOFENCE_MIN_STAY_MINUTES})`;
    }

    await sb().from('cfl_geofence_events').insert([event]);

    emit('checkout', { village, record, dist, durationMin, valid: event.is_valid });
    console.log('[Geofence] CHECK-OUT:', village.name, '—', durationMin, 'min,', event.is_valid ? 'VALID' : 'TOO SHORT');
  }

  // Force a manual check of all villages against a position (for UI preview)
  function getVillagesNearby(lat, lng, radiusM = 5000) {
    return _villages
      .map(v => ({
        ...v,
        distance: haversine(lat, lng, parseFloat(v.lat), parseFloat(v.lng)),
      }))
      .filter(v => v.distance <= radiusM)
      .sort((a, b) => a.distance - b.distance);
  }

  function getCurrentlyInsideVillages() {
    return [..._insideSet.entries()].map(([id, state]) => {
      const village = _villages.find(v => v.id === id);
      return { village, ...state };
    });
  }

  // Load geofence history for a counselor on a given date
  async function fetchDayEvents(counselorId, date) {
    const { data, error } = await sb()
      .from('cfl_geofence_events')
      .select(`
        id, event_type, device_ts, duration_minutes, is_valid, validity_reason,
        distance_from_centre_m,
        cfl_villages!village_id(name, mandal, lat, lng)
      `)
      .eq('counselor_id', counselorId)
      .gte('device_ts', date + 'T00:00:00+05:30')
      .lte('device_ts', date + 'T23:59:59+05:30')
      .order('device_ts', { ascending: true });
    return { data: data || [], error };
  }

  root.CflGeofenceEngine = {
    loadVillages,
    check,
    getVillagesNearby,
    getCurrentlyInsideVillages,
    fetchDayEvents,
    haversine,
    on,
    get villages() { return _villages; },
    get insideCount() { return _insideSet.size; },
  };

})(window);
