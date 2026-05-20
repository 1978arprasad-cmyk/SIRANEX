// =============================================================================
// CFL Camp Reporter — Submit & verify camp reports with geo-tagged photos
// =============================================================================
(function (root) {
  'use strict';

  const cfg = root.CFL_CONFIG;
  const sb  = () => root.supabaseClient;

  // ─────────────────────────────────────────────────────────────────────────
  // Live Camera capture (mandatory — no gallery)
  // ─────────────────────────────────────────────────────────────────────────

  async function capturePhoto(videoElement, canvasElement) {
    const ctx    = canvasElement.getContext('2d');
    canvasElement.width  = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    ctx.drawImage(videoElement, 0, 0);

    // Embed timestamp watermark
    const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    ctx.font      = 'bold 22px Arial';
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, canvasElement.height - 50, canvasElement.width, 50);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('📍 CFL-KMM  ' + now, 12, canvasElement.height - 16);

    return new Promise(res => {
      canvasElement.toBlob(blob => res(blob), 'image/jpeg', 0.85);
    });
  }

  async function startCamera(videoElement, { facingMode = 'environment' } = {}) {
    const constraints = {
      video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = stream;
    await videoElement.play();
    return stream;
  }

  function stopCamera(stream) {
    if (stream) stream.getTracks().forEach(t => t.stop());
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GPS snapshot at time of photo
  // ─────────────────────────────────────────────────────────────────────────

  async function getPhotoGps() {
    return new Promise((res, rej) => {
      navigator.geolocation.getCurrentPosition(res, rej, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Upload photo to Supabase Storage
  // ─────────────────────────────────────────────────────────────────────────

  async function uploadPhoto(blob, counselorId, reportId, index) {
    const ts   = Date.now();
    const path = `cfl-camps/${counselorId}/${reportId || 'draft'}/${ts}_${index}.jpg`;
    const { data, error } = await sb()
      .storage
      .from(cfg.STORAGE_BUCKET || 'cfl-uploads')
      .upload(path, blob, { contentType: 'image/jpeg', upsert: false });
    if (error) throw error;
    const { data: urlData } = sb().storage.from(cfg.STORAGE_BUCKET || 'cfl-uploads').getPublicUrl(path);
    return { path, url: urlData.publicUrl };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Photo validation
  // ─────────────────────────────────────────────────────────────────────────

  async function validatePhoto(blob, gpsPosition, reportLat, reportLng) {
    const issues = [];

    // Size check
    if (blob.size > cfg.MAX_PHOTO_SIZE_MB * 1024 * 1024) {
      issues.push(`Photo too large: ${(blob.size/1048576).toFixed(1)}MB (max ${cfg.MAX_PHOTO_SIZE_MB}MB)`);
    }

    // GPS location match
    if (gpsPosition) {
      const dist = root.CflGpsEngine?.haversine(
        gpsPosition.coords.latitude, gpsPosition.coords.longitude,
        reportLat, reportLng
      ) || 0;
      if (dist > cfg.CAMP_GPS_TOLERANCE_M) {
        issues.push(`Photo taken ${dist.toFixed(0)}m from reported village (max ${cfg.CAMP_GPS_TOLERANCE_M}m)`);
      }
    }

    return { valid: issues.length === 0, issues };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Duplicate detection using pHash
  // ─────────────────────────────────────────────────────────────────────────

  async function checkDuplicatePhoto(imageBlob, counselorId, canvas) {
    // Compute SHA hash for exact match
    const sha = await root.CflSpoofDetector?.sha256Blob(imageBlob);

    // Check exact hash in DB
    if (sha) {
      const { data: exact } = await sb()
        .from('cfl_camp_photos')
        .select('id, report_id')
        .eq('photo_hash', sha)
        .eq('counselor_id', counselorId)
        .limit(1)
        .single();
      if (exact) return { isDuplicate: true, type: 'exact', originalId: exact.id };
    }

    // Compute perceptual hash for near-duplicate detection
    let pHash = null;
    if (canvas && root.CflSpoofDetector?.computeImagePHash) {
      const img = new Image();
      const url = URL.createObjectURL(imageBlob);
      await new Promise(res => { img.onload = res; img.src = url; });
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width  = img.width;
      tempCanvas.height = img.height;
      tempCanvas.getContext('2d').drawImage(img, 0, 0);
      pHash = root.CflSpoofDetector.computeImagePHash(tempCanvas);
      URL.revokeObjectURL(url);
    }

    if (pHash) {
      const { data: recent } = await sb()
        .from('cfl_camp_photos')
        .select('id, perceptual_hash')
        .eq('counselor_id', counselorId)
        .not('perceptual_hash', 'is', null)
        .order('server_received_at', { ascending: false })
        .limit(50);

      for (const photo of (recent || [])) {
        const dist = root.CflSpoofDetector?.pHashDistance(pHash, photo.perceptual_hash) || 64;
        if (dist <= 8) {
          return { isDuplicate: true, type: 'near_duplicate', distance: dist, originalId: photo.id };
        }
      }
    }

    return { isDuplicate: false, sha, pHash };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Submit complete camp report
  // ─────────────────────────────────────────────────────────────────────────

  async function submitCampReport({ counselorId, villageId, assignmentId, formData, photos, gpsPosition }) {
    const village    = formData.village;
    const reportLat  = gpsPosition?.coords.latitude  || null;
    const reportLng  = gpsPosition?.coords.longitude || null;
    const reportAcc  = gpsPosition?.coords.accuracy  || null;

    // Validate minimum photos
    if (!photos || photos.length < cfg.MIN_PHOTOS_PER_CAMP) {
      throw new Error(`Minimum ${cfg.MIN_PHOTOS_PER_CAMP} photos required`);
    }

    // Validate GPS location vs village
    let distFromVillage = null;
    let gpsMatch = false;
    if (gpsPosition && village) {
      distFromVillage = root.CflGpsEngine?.haversine(
        reportLat, reportLng, parseFloat(village.lat), parseFloat(village.lng)
      );
      gpsMatch = distFromVillage <= cfg.CAMP_GPS_TOLERANCE_M;
    }

    // Validate geofence confirmation
    const { data: geofenceCheck } = await sb()
      .from('cfl_geofence_events')
      .select('id, duration_minutes, is_valid')
      .eq('counselor_id', counselorId)
      .eq('village_id', villageId)
      .eq('event_type', 'checkin')
      .gte('device_ts', formData.camp_date + 'T00:00:00+05:30')
      .limit(1)
      .single();

    const geofenceVerified = !!geofenceCheck;

    // Build suspicious flags
    const suspiciousFlags = [];
    if (!gpsMatch)         suspiciousFlags.push('gps_location_mismatch');
    if (!geofenceVerified) suspiciousFlags.push('no_geofence_entry');

    // Insert camp report
    const reportPayload = {
      counselor_id:            counselorId,
      village_id:              villageId,
      assignment_id:           assignmentId || null,
      geofence_checkin_id:     geofenceCheck?.id || null,
      camp_date:               formData.camp_date,
      start_time:              formData.start_time,
      end_time:                formData.end_time,
      topic:                   formData.topic,
      awareness_category:      formData.awareness_category,
      participant_count:        parseInt(formData.participant_count) || 0,
      male_count:               parseInt(formData.male_count) || 0,
      female_count:             parseInt(formData.female_count) || 0,
      remarks:                  formData.remarks || null,
      report_lat:               reportLat,
      report_lng:               reportLng,
      report_accuracy_m:        reportAcc,
      distance_from_village_m:  distFromVillage ? parseFloat(distFromVillage.toFixed(1)) : null,
      gps_location_match:       gpsMatch,
      geofence_verified:        geofenceVerified,
      suspicious_flags:         suspiciousFlags,
      status:                   suspiciousFlags.length > 1 ? 'suspicious' : 'pending',
    };

    const { data: report, error: rErr } = await sb()
      .from('cfl_camp_reports')
      .insert([reportPayload])
      .select()
      .single();
    if (rErr) throw rErr;

    // Upload and record photos
    const photoResults = [];
    for (let i = 0; i < photos.length; i++) {
      const { blob, gpsPos, canvas } = photos[i];
      const dupCheck = await checkDuplicatePhoto(blob, counselorId, canvas);
      const sha256   = dupCheck.sha;
      const pHash    = dupCheck.pHash;

      const uploadResult = await uploadPhoto(blob, counselorId, report.id, i + 1);
      const capturePos   = gpsPos?.coords;
      const locMatch     = capturePos
        ? (root.CflGpsEngine?.haversine(
            capturePos.latitude, capturePos.longitude,
            parseFloat(village?.lat || reportLat), parseFloat(village?.lng || reportLng)
          ) || 0) <= cfg.CAMP_GPS_TOLERANCE_M
        : null;

      const { error: pErr } = await sb().from('cfl_camp_photos').insert([{
        report_id:            report.id,
        counselor_id:         counselorId,
        photo_url:            uploadResult.url,
        photo_hash:           sha256,
        perceptual_hash:      pHash,
        capture_lat:          capturePos?.latitude  || null,
        capture_lng:          capturePos?.longitude || null,
        capture_accuracy_m:   capturePos?.accuracy  || null,
        captured_at:          new Date(gpsPos?.timestamp || Date.now()).toISOString(),
        is_live_capture:      true,
        is_duplicate:         dupCheck.isDuplicate,
        location_matches_camp: locMatch,
        file_size_bytes:      blob.size,
        flagged:              dupCheck.isDuplicate,
        flag_reason:          dupCheck.isDuplicate ? `${dupCheck.type} duplicate` : null,
      }]);

      if (dupCheck.isDuplicate) {
        if (!report.suspicious_flags.includes('duplicate_photo')) {
          suspiciousFlags.push('duplicate_photo');
          await sb().from('cfl_camp_reports').update({
            suspicious_flags: suspiciousFlags,
            status: 'suspicious',
          }).eq('id', report.id);
          await root.CflAlertEngine?.trigger('duplicate_photo', counselorId, { village: village?.name });
        }
      }

      photoResults.push({ url: uploadResult.url, isDuplicate: dupCheck.isDuplicate });
    }

    // Update assignment status
    if (assignmentId) {
      await sb().from('cfl_assignments').update({
        status:              'completed',
        completed_at:        new Date().toISOString(),
        actual_participants: parseInt(formData.participant_count) || 0,
      }).eq('id', assignmentId);
    }

    // Alert if camp outside field hours
    const hour = new Date().getHours();
    if (hour < cfg.FIELD_START_HOUR || hour >= cfg.FIELD_END_HOUR) {
      await root.CflAlertEngine?.trigger('out_of_field_hours', counselorId, {
        time: new Date().toLocaleTimeString('en-IN'),
      });
    }

    return { report, photoResults, suspiciousFlags };
  }

  // Fetch pending assignments for a counselor today
  async function fetchTodayAssignments(counselorId) {
    const today = new Date().toISOString().slice(0, 10);
    return sb()
      .from('cfl_assignments')
      .select(`
        id, scheduled_date, camp_topic, awareness_category, target_participants, status,
        cfl_villages!village_id(id, name, name_te, mandal, lat, lng, geofence_radius_m)
      `)
      .eq('counselor_id', counselorId)
      .eq('scheduled_date', today)
      .order('status');
  }

  root.CflCampReporter = {
    startCamera,
    stopCamera,
    capturePhoto,
    getPhotoGps,
    validatePhoto,
    checkDuplicatePhoto,
    submitCampReport,
    fetchTodayAssignments,
  };

})(window);
