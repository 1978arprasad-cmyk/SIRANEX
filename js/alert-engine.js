// =============================================================================
// CFL Alert Engine — Automated alert generation and dispatch
// =============================================================================
(function (root) {
  'use strict';

  const cfg = root.CFL_CONFIG;
  const sb  = () => root.supabaseClient;

  // Track recently sent alerts to prevent spam
  const _recentAlerts = new Map();   // `${counselorId}:${type}` → timestamp

  function _shouldSend(counselorId, type) {
    const key  = `${counselorId}:${type}`;
    const last = _recentAlerts.get(key) || 0;
    const diff = (Date.now() - last) / 60000;
    if (diff < cfg.ALERT_RETRIGGER_MINUTES) return false;
    _recentAlerts.set(key, Date.now());
    return true;
  }

  const ALERT_DEFS = {
    gps_offline: {
      severity: 'critical',
      title: 'GPS Offline',
      msg: (name) => `${name} — GPS tracking offline for more than ${cfg.ALERT_INACTIVE_MINUTES} minutes. Field visit cannot be verified.`,
    },
    no_movement: {
      severity: 'warning',
      title: 'Counselor Not Moving',
      msg: (name) => `${name} has not moved in 45+ minutes during field hours. Possible GPS freeze or idle.`,
    },
    missed_village: {
      severity: 'warning',
      title: 'Assigned Village Not Visited',
      msg: (name, ctx) => `${name} has not visited assigned village "${ctx.village}" scheduled for today.`,
    },
    fake_location: {
      severity: 'critical',
      title: 'Fake GPS Detected',
      msg: (name, ctx) => `${name} — Possible GPS spoofing detected. Reason: ${ctx.reason}`,
    },
    no_camp: {
      severity: 'warning',
      title: 'No Camp Conducted',
      msg: (name) => `${name} — No camp report submitted by 3:00 PM on a working day.`,
    },
    app_not_opened: {
      severity: 'info',
      title: 'App Not Opened',
      msg: (name) => `${name} has not opened the CFL app during field hours today.`,
    },
    suspicious_photo: {
      severity: 'warning',
      title: 'Suspicious Photo Submission',
      msg: (name, ctx) => `${name} submitted a photo flagged for: ${ctx.reason}`,
    },
    short_camp_duration: {
      severity: 'warning',
      title: 'Camp Duration Too Short',
      msg: (name, ctx) => `${name} conducted camp at "${ctx.village}" for only ${ctx.minutes} minutes (minimum: ${cfg.CAMP_MIN_DURATION_MINUTES}).`,
    },
    duplicate_photo: {
      severity: 'critical',
      title: 'Duplicate Photo Detected',
      msg: (name, ctx) => `${name} reused an identical/near-identical photo for camp at "${ctx.village}".`,
    },
    geofence_violation: {
      severity: 'info',
      title: 'Camp Without Geofence Entry',
      msg: (name, ctx) => `${name} submitted a camp report for "${ctx.village}" but GPS never detected entry into that village.`,
    },
    out_of_field_hours: {
      severity: 'info',
      title: 'Activity Outside Field Hours',
      msg: (name, ctx) => `${name} submitted a camp report at ${ctx.time} — outside the ${cfg.FIELD_START_HOUR}:00–${cfg.FIELD_END_HOUR}:00 field window.`,
    },
  };

  async function trigger(type, counselorId, context = {}) {
    if (!_shouldSend(counselorId, type)) return;

    const def = ALERT_DEFS[type];
    if (!def) return;

    // Fetch counselor name
    const { data: profile } = await sb()
      .from('cfl_profiles')
      .select('full_name, mobile, whatsapp_number')
      .eq('id', counselorId)
      .single();

    const name    = profile ? profile.full_name : 'Unknown';
    const message = def.msg(name, context);

    const alert = {
      counselor_id: counselorId,
      alert_type:   type,
      severity:     def.severity,
      title:        def.title,
      message,
      context_data: context,
    };

    const { data, error } = await sb().from('cfl_alerts').insert([alert]).select().single();
    if (error) { console.error('[Alert] Insert failed:', error.message); return; }

    console.log(`[Alert] ${def.severity.toUpperCase()} — ${def.title}: ${message}`);

    // In production: send WhatsApp / SMS via server function
    // For now we log and mark the dispatch fields
    await _dispatchNotification(data, profile, context);

    return data;
  }

  async function _dispatchNotification(alert, profile, context) {
    // Update delivery flags (actual WA/SMS would be done server-side via Edge Function)
    await sb()
      .from('cfl_alerts')
      .update({ sent_to_ldm: true })
      .eq('id', alert.id);

    // Log to in-app notification store
    const { data: ldm } = await sb()
      .from('cfl_profiles')
      .select('id')
      .eq('role', 'ldm')
      .limit(1)
      .single();

    if (ldm) {
      await sb().from('notifications').insert([{
        recipient_user_id: ldm.user_id || null,
        channel:           'in_app',
        title:             alert.title,
        body:              alert.message,
        payload:           { alert_id: alert.id, ...context },
      }]).catch(() => {}); // silently ignore if notifications table not available
    }
  }

  // Scheduled check — run every few minutes from LDM dashboard
  async function runScheduledChecks() {
    const { data: counselors } = await sb()
      .from('cfl_counselor_live_status')
      .select(`
        counselor_id, last_ping_at, tracking_status, mock_detected,
        today_camps,
        cfl_profiles!counselor_id(full_name, status)
      `);

    if (!counselors) return;

    const now  = new Date();
    const hour = now.getHours();

    for (const cs of counselors) {
      const profile = cs.cfl_profiles;
      if (!profile || profile.status !== 'active') continue;
      const cid    = cs.counselor_id;
      const inField = hour >= cfg.FIELD_START_HOUR && hour < cfg.FIELD_END_HOUR;

      // Check GPS offline
      if (inField && cs.last_ping_at) {
        const minsAgo = (Date.now() - new Date(cs.last_ping_at)) / 60000;
        if (minsAgo > cfg.ALERT_INACTIVE_MINUTES) {
          await trigger('gps_offline', cid);
        }
      }

      // App never opened today
      if (inField && !cs.last_ping_at) {
        await trigger('app_not_opened', cid);
      }

      // Mock location detected
      if (cs.mock_detected) {
        await trigger('fake_location', cid, { reason: 'Multiple GPS spoofing signals detected' });
      }

      // No camp by 3 PM
      if (hour >= cfg.ALERT_NO_CAMP_HOUR && inField && (cs.today_camps || 0) === 0) {
        await trigger('no_camp', cid);
      }

      // Check no movement (status = idle for > 45 min during field hours)
      if (inField && cs.tracking_status === 'idle' && cs.last_ping_at) {
        const minsIdle = (Date.now() - new Date(cs.last_ping_at)) / 60000;
        if (minsIdle > 45) {
          await trigger('no_movement', cid);
        }
      }
    }

    // Check missed villages
    await _checkMissedVillages();
  }

  async function _checkMissedVillages() {
    const today = new Date().toISOString().slice(0, 10);
    const hour  = new Date().getHours();
    if (hour < 17) return;  // only check after 5 PM

    const { data: assignments } = await sb()
      .from('cfl_assignments')
      .select(`
        id, counselor_id, village_id, status,
        cfl_villages!village_id(name),
        cfl_profiles!counselor_id(full_name)
      `)
      .eq('scheduled_date', today)
      .eq('status', 'pending');

    if (!assignments) return;

    for (const a of assignments) {
      // Check if geofence checkin happened
      const { data: checkin } = await sb()
        .from('cfl_geofence_events')
        .select('id')
        .eq('counselor_id', a.counselor_id)
        .eq('village_id', a.village_id)
        .eq('event_type', 'checkin')
        .gte('device_ts', today + 'T00:00:00+05:30')
        .limit(1)
        .single();

      if (!checkin) {
        await trigger('missed_village', a.counselor_id, {
          village: a.cfl_villages?.name,
          assignment_id: a.id,
        });
      }
    }
  }

  // Acknowledge an alert
  async function acknowledge(alertId, acknowledgedBy) {
    return sb().from('cfl_alerts').update({
      acknowledged:    true,
      acknowledged_by: acknowledgedBy,
      acknowledged_at: new Date().toISOString(),
    }).eq('id', alertId);
  }

  // Fetch unacknowledged alerts for LDM dashboard
  async function fetchActiveAlerts(limit = 50) {
    return sb()
      .from('cfl_alerts')
      .select(`
        id, alert_type, severity, title, message, created_at,
        cfl_profiles!counselor_id(full_name, employee_id,
          cfl_centres!cfl_centre_id(code, name))
      `)
      .eq('acknowledged', false)
      .order('created_at', { ascending: false })
      .limit(limit);
  }

  root.CflAlertEngine = {
    trigger,
    acknowledge,
    fetchActiveAlerts,
    runScheduledChecks,
  };

})(window);
