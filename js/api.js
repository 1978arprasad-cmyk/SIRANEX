// =============================================================================
// Prajadarbar — Data access layer (built on supabase-js v2)
// =============================================================================
(function (root) {
  "use strict";

  const sb = root.supabaseClient;
  const cfg = root.PRAJA_CONFIG || {};

  // ---- Reference data ----------------------------------------------------
  let _departments, _mandals, _panchayats, _subjects;

  async function getDepartments() {
    if (_departments) return _departments;
    const { data, error } = await sb.from("departments").select("*").order("name_en");
    if (error) throw error;
    _departments = data || [];
    return _departments;
  }
  async function getMandals() {
    if (_mandals) return _mandals;
    const { data, error } = await sb.from("mandals").select("*").order("name_en");
    if (error) throw error;
    _mandals = data || [];
    return _mandals;
  }
  async function getPanchayats(mandalId) {
    const { data, error } = await sb.from("panchayats").select("*").eq("mandal_id", mandalId).order("name_en");
    if (error) throw error;
    return data || [];
  }
  async function getSubjects(deptId) {
    const { data, error } = await sb.from("subjects").select("*").eq("department_id", deptId).order("name_en");
    if (error) throw error;
    return data || [];
  }

  // ---- Grievance create --------------------------------------------------
  async function createGrievance(payload) {
    // payload: { applicant_name, mobile, ..., department_id, subject_id, description, files: [File...] }
    const files = payload.files || [];
    delete payload.files;

    const { data, error } = await sb.from("grievances").insert(payload).select().single();
    if (error) throw error;

    // upload attachments (best effort)
    if (files.length) {
      try {
        await uploadAttachments(data.id, files, "citizen_proof", null);
      } catch (e) {
        console.warn("attachment upload failed", e);
      }
    }

    // queue SMS + WhatsApp via the notifications table (a worker / Edge function
    // can later actually send these.  In demo mode we just write the entries.)
    try {
      const trackUrl = location.origin + location.pathname.replace(/[^/]+$/, "track.html")
        + "?gid=" + encodeURIComponent(data.grievance_id) + "&m=" + encodeURIComponent(data.mobile);
      const msg = "Prajadarbar: Grievance " + data.grievance_id + " registered successfully. "
        + "Track at " + trackUrl;

      await sb.from("notifications").insert([
        { recipient_mobile: data.mobile, channel: "sms",      title: "Prajadarbar registration",
          body: msg, grievance_id: data.id, payload: { url: trackUrl } },
        { recipient_mobile: data.mobile, channel: "whatsapp", title: "Prajadarbar registration",
          body: msg, grievance_id: data.id, payload: { template: cfg.WHATSAPP_TEMPLATE_NAME, url: trackUrl } },
      ]);
    } catch (e) { console.warn("notif insert failed", e); }

    return data;
  }

  // ---- Public tracking ---------------------------------------------------
  async function trackGrievance(mobile, gid) {
    const { data, error } = await sb.rpc("get_grievance_for_citizen", { p_mobile: mobile, p_gid: gid });
    if (error) throw error;
    return data && data.length ? data[0] : null;
  }
  async function getGrievanceFull(grievanceId) {
    const { data, error } = await sb.from("grievances")
      .select(`*,
               department:departments(id,code,name_en,name_te,icon),
               subject:subjects(id,name_en,name_te,sla_days),
               mandal:mandals(id,code,name_en,name_te),
               panchayat:panchayats(id,name_en,name_te),
               assignee:profiles!grievances_assigned_to_fkey(id,full_name,designation)`)
      .eq("grievance_id", grievanceId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }
  async function getHistory(grievanceUuid) {
    const { data, error } = await sb.from("grievance_history")
      .select("*, actor:profiles(full_name, role, designation)")
      .eq("grievance_id", grievanceUuid)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  }
  async function getAttachments(grievanceUuid) {
    const { data, error } = await sb.from("grievance_attachments")
      .select("*").eq("grievance_id", grievanceUuid)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // ---- Officer / staff lists --------------------------------------------
  async function listGrievancesForOfficer(opts) {
    opts = opts || {};
    let q = sb.from("grievances").select(`*,
      department:departments(id,code,name_en,name_te,icon),
      subject:subjects(id,name_en,name_te),
      mandal:mandals(id,name_en,name_te),
      panchayat:panchayats(id,name_en,name_te)`)
      .order("created_at", { ascending: false })
      .limit(opts.limit || 200);

    if (opts.department_id)  q = q.eq("department_id", opts.department_id);
    if (opts.mandal_id)      q = q.eq("mandal_id", opts.mandal_id);
    if (opts.status)         q = q.eq("status", opts.status);
    if (opts.statuses)       q = q.in("status", opts.statuses);
    if (opts.assigned_to)    q = q.eq("assigned_to", opts.assigned_to);

    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }

  async function updateGrievanceStatus(grievanceUuid, newStatus, remarks, actorProfile, files, gps) {
    // Update row
    const upd = { status: newStatus };
    if (remarks)        upd.forwarded_to = upd.forwarded_to;
    const { data, error } = await sb.from("grievances")
      .update(upd).eq("id", grievanceUuid).select().single();
    if (error) throw error;

    // Best-effort: insert a history row with remarks + actor metadata
    // (the trigger also inserts one, but without remarks)
    try {
      const histRow = {
        grievance_id: grievanceUuid,
        from_status: null,                   // unknown here, the trigger has the truth
        to_status: newStatus,
        remarks: remarks || null,
        actor_id:   (actorProfile && actorProfile.id) || null,
        actor_name: (actorProfile && actorProfile.full_name) || null,
        actor_role: (actorProfile && actorProfile.role) || null,
        gps_lat: gps && gps.lat,
        gps_lng: gps && gps.lng,
      };
      const ins = await sb.from("grievance_history").insert(histRow).select().single();
      if (!ins.error && files && files.length) {
        await uploadAttachments(grievanceUuid, files, "action_taken_photo", ins.data.id, gps);
      }
    } catch (e) { console.warn("history insert failed", e); }

    // Notify citizen of status change
    try {
      const { data: g } = await sb.from("grievances").select("mobile, grievance_id").eq("id", grievanceUuid).single();
      if (g) {
        const trackUrl = location.origin + location.pathname.replace(/[^/]+$/, "track.html")
          + "?gid=" + encodeURIComponent(g.grievance_id) + "&m=" + encodeURIComponent(g.mobile);
        const msg = "Prajadarbar: " + g.grievance_id + " status → " + newStatus + ". " + trackUrl;
        await sb.from("notifications").insert([
          { recipient_mobile: g.mobile, channel: "sms",      title: "Status update", body: msg, grievance_id: grievanceUuid, payload: { url: trackUrl } },
          { recipient_mobile: g.mobile, channel: "whatsapp", title: "Status update", body: msg, grievance_id: grievanceUuid, payload: { url: trackUrl } },
        ]);
      }
    } catch (e) { /* non-fatal */ }

    return data;
  }

  async function reassignGrievance(grievanceUuid, newDeptId, remarks, actorProfile) {
    const { data, error } = await sb.from("grievances")
      .update({ department_id: newDeptId, status: "assigned", forwarded_to: remarks || "Reassigned" })
      .eq("id", grievanceUuid).select().single();
    if (error) throw error;
    try {
      await sb.from("grievance_history").insert({
        grievance_id: grievanceUuid,
        to_status: "assigned",
        remarks: "Reassigned to another department: " + (remarks || ""),
        actor_id:   (actorProfile && actorProfile.id) || null,
        actor_name: (actorProfile && actorProfile.full_name) || null,
        actor_role: (actorProfile && actorProfile.role) || null,
      });
    } catch (e) {}
    return data;
  }

  async function submitFeedback(grievanceUuid, rating, comment, reopen) {
    const upd = reopen
      ? { status: "reopened", reopen_count: 1, citizen_rating: rating, citizen_feedback: comment }
      : { status: "closed",                      citizen_rating: rating, citizen_feedback: comment };
    const { data, error } = await sb.from("grievances").update(upd).eq("id", grievanceUuid).select().single();
    if (error) throw error;
    return data;
  }

  // ---- File upload --------------------------------------------------------
  async function uploadAttachments(grievanceUuid, files, attachment_type, history_id, gps) {
    const bucket = (cfg.STORAGE_BUCKET || "grievance-uploads");
    const rows = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const safe = (f.name || "file").replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = grievanceUuid + "/" + Date.now() + "_" + i + "_" + safe;
      const { error: upErr } = await sb.storage.from(bucket).upload(path, f, { upsert: false, contentType: f.type });
      if (upErr) { console.warn("upload error", upErr); continue; }
      const { data: pub } = sb.storage.from(bucket).getPublicUrl(path);
      rows.push({
        grievance_id: grievanceUuid,
        history_id: history_id || null,
        file_url: pub.publicUrl,
        file_name: f.name,
        file_type: f.type,
        attachment_type: attachment_type,
        gps_lat: gps && gps.lat,
        gps_lng: gps && gps.lng,
      });
    }
    if (rows.length) {
      const { error } = await sb.from("grievance_attachments").insert(rows);
      if (error) console.warn("attach row insert", error);
    }
  }

  // ---- Dashboard aggregates ---------------------------------------------
  async function getDistrictKPIs() {
    const { data, error } = await sb.from("v_grievance_kpis").select("*").maybeSingle();
    if (error) throw error;
    return data || {};
  }
  async function getDeptKPIs() {
    const { data, error } = await sb.from("v_dept_kpis").select("*");
    if (error) throw error;
    return data || [];
  }
  async function getMandalKPIs() {
    const { data, error } = await sb.from("v_mandal_kpis").select("*");
    if (error) throw error;
    return data || [];
  }
  async function getRecentGrievances(limit) {
    const { data, error } = await sb.from("grievances")
      .select(`id, grievance_id, applicant_name, status, severity, created_at, mobile, sla_days, expected_resolution_date,
               department:departments(name_en,name_te,icon),
               mandal:mandals(name_en,name_te)`)
      .order("created_at", { ascending: false })
      .limit(limit || 10);
    if (error) throw error;
    return data || [];
  }
  async function getOverdue(limit) {
    // overdue = (now - created_at) > sla_days AND status not in resolved/closed/rejected
    const { data, error } = await sb.from("grievances")
      .select(`id, grievance_id, applicant_name, status, created_at, sla_days,
               department:departments(name_en,icon), mandal:mandals(name_en)`)
      .not("status", "in", "(resolved,closed,rejected)")
      .order("created_at", { ascending: true })
      .limit(50);
    if (error) throw error;
    const today = Date.now();
    const overdue = (data || []).filter(function (g) {
      const days = Math.floor((today - new Date(g.created_at).getTime()) / 86400000);
      return days > (g.sla_days || 90);
    });
    return overdue.slice(0, limit || 10);
  }

  // ---- Realtime ----------------------------------------------------------
  function subscribeGrievances(handlers) {
    const ch = sb.channel("public:grievances");
    if (handlers.onInsert) ch.on("postgres_changes", { event: "INSERT", schema: "public", table: "grievances" }, function (p) { handlers.onInsert(p.new); });
    if (handlers.onUpdate) ch.on("postgres_changes", { event: "UPDATE", schema: "public", table: "grievances" }, function (p) { handlers.onUpdate(p.new, p.old); });
    if (handlers.onDelete) ch.on("postgres_changes", { event: "DELETE", schema: "public", table: "grievances" }, function (p) { handlers.onDelete(p.old); });
    ch.subscribe();
    return ch;
  }
  function subscribeHistory(grievanceUuid, onRow) {
    const ch = sb.channel("history:" + grievanceUuid)
      .on("postgres_changes", { event: "*", schema: "public", table: "grievance_history", filter: "grievance_id=eq." + grievanceUuid },
          function (p) { onRow(p.new || p.old); })
      .subscribe();
    return ch;
  }

  root.PrajaApi = {
    getDepartments, getMandals, getPanchayats, getSubjects,
    createGrievance, trackGrievance, getGrievanceFull, getHistory, getAttachments,
    listGrievancesForOfficer, updateGrievanceStatus, reassignGrievance, submitFeedback,
    uploadAttachments,
    getDistrictKPIs, getDeptKPIs, getMandalKPIs, getRecentGrievances, getOverdue,
    subscribeGrievances, subscribeHistory,
  };
})(window);
