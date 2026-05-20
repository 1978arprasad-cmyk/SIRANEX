// =============================================================================
// CFL Report Generator — Excel & PDF export for LDM
// =============================================================================
(function (root) {
  'use strict';

  const sb = () => root.supabaseClient;

  // ─────────────────────────────────────────────────────────────────────────
  // Data fetchers
  // ─────────────────────────────────────────────────────────────────────────

  async function fetchDailyMovement(counselorId, date) {
    const { data } = await sb()
      .from('cfl_gps_tracking')
      .select('lat,lng,speed_kmh,is_moving,device_ts,accuracy_m,mock_location,battery_pct,network_type')
      .eq('counselor_id', counselorId)
      .gte('device_ts', date + 'T00:00:00+05:30')
      .lte('device_ts', date + 'T23:59:59+05:30')
      .order('device_ts');
    return data || [];
  }

  async function fetchCampReport(counselorId, date) {
    const { data } = await sb()
      .from('cfl_camp_reports')
      .select(`
        report_number, camp_date, start_time, end_time, duration_minutes,
        topic, awareness_category, participant_count, male_count, female_count,
        remarks, status, gps_location_match, geofence_verified, suspicious_flags,
        report_lat, report_lng,
        cfl_villages!village_id(name, mandal)
      `)
      .eq('counselor_id', counselorId)
      .eq('camp_date', date)
      .order('start_time');
    return data || [];
  }

  async function fetchGeofenceHistory(counselorId, date) {
    const { data } = await sb()
      .from('cfl_geofence_events')
      .select(`
        event_type, device_ts, duration_minutes, is_valid, validity_reason,
        distance_from_centre_m,
        cfl_villages!village_id(name, mandal)
      `)
      .eq('counselor_id', counselorId)
      .gte('device_ts', date + 'T00:00:00+05:30')
      .lte('device_ts', date + 'T23:59:59+05:30')
      .order('device_ts');
    return data || [];
  }

  async function fetchSuspiciousActivity(from, to) {
    const { data } = await sb()
      .from('cfl_alerts')
      .select(`
        alert_type, severity, title, message, created_at,
        cfl_profiles!counselor_id(full_name, employee_id,
          cfl_centres!cfl_centre_id(name))
      `)
      .gte('created_at', from + 'T00:00:00+05:30')
      .lte('created_at', to   + 'T23:59:59+05:30')
      .in('severity', ['warning','critical'])
      .order('created_at', { ascending: false });
    return data || [];
  }

  async function fetchPerformance(month, year) {
    const { data } = await sb()
      .from('cfl_performance_scores')
      .select(`
        total_score, performance_grade, district_rank, centre_rank,
        villages_assigned, villages_visited, camps_conducted, total_participants,
        total_km_traveled, avg_gps_compliance,
        village_visit_score, gps_compliance_score, camp_quality_score,
        travel_coverage_score, reporting_score, participant_reach_score,
        cfl_profiles!counselor_id(full_name, employee_id,
          cfl_centres!cfl_centre_id(name, code))
      `)
      .eq('score_month', month)
      .eq('score_year',  year)
      .order('district_rank');
    return data || [];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Excel export using SheetJS (must be loaded in page)
  // ─────────────────────────────────────────────────────────────────────────

  function exportToExcel(sheets, filename) {
    const XLSX = root.XLSX;
    if (!XLSX) { alert('SheetJS not loaded'); return; }
    const wb = XLSX.utils.book_new();
    for (const { name, data } of sheets) {
      const ws = XLSX.utils.json_to_sheet(data);
      // Auto-width columns
      const colWidths = Object.keys(data[0] || {}).map(k => ({
        wch: Math.max(k.length, ...data.map(r => String(r[k] || '').length))
      }));
      ws['!cols'] = colWidths;
      XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
    }
    XLSX.writeFile(wb, filename + '.xlsx');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PDF export using jsPDF
  // ─────────────────────────────────────────────────────────────────────────

  function getPdf() {
    if (root.jspdf?.jsPDF) return new root.jspdf.jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    if (root.jsPDF)        return new root.jsPDF({ orientation: 'landscape' });
    alert('jsPDF not loaded'); return null;
  }

  function pdfHeader(doc, title, subtitle) {
    doc.setFillColor(30, 58, 138); // dark indigo
    doc.rect(0, 0, 297, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Government of Telangana — NABARD CFL Khammam', 148, 8, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(title, 148, 14, { align: 'center' });
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text(subtitle, 148, 19, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    return 24;
  }

  function pdfTable(doc, headers, rows, startY, colWidths) {
    const cellH = 7, padX = 2, padY = 5;
    let y = startY;
    const pageW = 297;
    const totalW = colWidths.reduce((s, w) => s + w, 0);
    const startX = (pageW - totalW) / 2;

    // Header row
    doc.setFillColor(30, 58, 138);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    let x = startX;
    headers.forEach((h, i) => {
      doc.rect(x, y, colWidths[i], cellH, 'F');
      doc.text(h, x + padX, y + padY);
      x += colWidths[i];
    });
    y += cellH;

    // Data rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    rows.forEach((row, ri) => {
      if (y > 190) { doc.addPage(); y = 10; }
      doc.setFillColor(ri % 2 === 0 ? 245 : 255, ri % 2 === 0 ? 247 : 255, ri % 2 === 0 ? 255 : 255);
      doc.setTextColor(30, 30, 30);
      let x = startX;
      row.forEach((cell, i) => {
        doc.rect(x, y, colWidths[i], cellH, 'FD');
        const text = String(cell ?? '');
        doc.text(text.slice(0, 25), x + padX, y + padY);
        x += colWidths[i];
      });
      y += cellH;
    });
    return y + 4;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Report 1 — Daily Movement Report (per counselor)
  // ─────────────────────────────────────────────────────────────────────────

  async function generateDailyMovementReport(counselorId, counselorName, date) {
    const pings    = await fetchDailyMovement(counselorId, date);
    const gfEvents = await fetchGeofenceHistory(counselorId, date);
    const camps    = await fetchCampReport(counselorId, date);

    const totalKm = pings.length > 1 ? parseFloat(
      (root.CflGpsEngine?.totalPathKm(pings) || 0)
    ) : 0;

    const excelData = pings.map((p, i) => ({
      '#':          i + 1,
      Time:         new Date(p.device_ts).toLocaleTimeString('en-IN'),
      Latitude:     p.lat,
      Longitude:    p.lng,
      'Accuracy(m)': p.accuracy_m,
      'Speed(km/h)': p.speed_kmh,
      Moving:       p.is_moving ? 'Yes' : 'No',
      Network:      p.network_type,
      Battery:      p.battery_pct ? p.battery_pct + '%' : '',
      MockLocation: p.mock_location ? '⚠ YES' : 'No',
    }));

    exportToExcel([
      { name: 'GPS Track', data: excelData },
      { name: 'Village Visits', data: gfEvents.map(e => ({
          Time:         new Date(e.device_ts).toLocaleTimeString('en-IN'),
          Village:      e.cfl_villages?.name || '',
          Mandal:       e.cfl_villages?.mandal || '',
          Event:        e.event_type.toUpperCase(),
          Duration_Min: e.duration_minutes ?? '',
          Valid:        e.is_valid ? 'YES' : 'NO',
          Reason:       e.validity_reason || '',
        })},
      },
      { name: 'Camp Reports', data: camps.map(c => ({
          Report_No:     c.report_number,
          Village:       c.cfl_villages?.name || '',
          Topic:         c.topic,
          Start:         c.start_time,
          End:           c.end_time,
          Duration_Min:  c.duration_minutes,
          Participants:  c.participant_count,
          Male:          c.male_count,
          Female:        c.female_count,
          GPS_Match:     c.gps_location_match ? 'Yes' : 'No',
          Geofence:      c.geofence_verified ? 'Verified' : 'Not Verified',
          Status:        c.status,
        })},
      },
    ], `Daily_Movement_${counselorName.replace(/\s/g,'_')}_${date}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Report 2 — Counselor Performance Report (monthly PDF)
  // ─────────────────────────────────────────────────────────────────────────

  async function generatePerformanceReportPDF(month, year) {
    const data = await fetchPerformance(month, year);
    const doc  = getPdf();
    if (!doc) return;

    const monthName = new Date(year, month - 1, 1).toLocaleString('en-IN', { month: 'long' });
    let y = pdfHeader(doc, `Counselor Performance Report — ${monthName} ${year}`,
                      `Generated: ${new Date().toLocaleString('en-IN')} | Khammam District`);

    const headers = ['Rank','Name','Centre','Grade','Score','Villages%','GPS%','Camps','Participants','KMs'];
    const rows    = data.map(d => [
      d.district_rank,
      d.cfl_profiles.full_name,
      d.cfl_profiles.cfl_centres.code,
      d.performance_grade,
      d.total_score?.toFixed(1),
      `${d.villages_visited}/${d.villages_assigned}`,
      d.avg_gps_compliance?.toFixed(0) + '%',
      d.camps_conducted,
      d.total_participants,
      d.total_km_traveled?.toFixed(0),
    ]);
    const widths = [12, 40, 20, 14, 15, 22, 15, 15, 22, 15];

    y = pdfTable(doc, headers, rows, y, widths);

    // Score breakdown sub-table
    y += 5;
    doc.setFontSize(10).setFont('helvetica', 'bold').text('Score Breakdown', 14, y);
    y += 4;
    const h2   = ['Name','Village Visit','GPS Comply','Camp Quality','Travel','Reporting','Reach'];
    const r2   = data.map(d => [
      d.cfl_profiles.full_name,
      d.village_visit_score?.toFixed(1),
      d.gps_compliance_score?.toFixed(1),
      d.camp_quality_score?.toFixed(1),
      d.travel_coverage_score?.toFixed(1),
      d.reporting_score?.toFixed(1),
      d.participant_reach_score?.toFixed(1),
    ]);
    pdfTable(doc, h2, r2, y, [40, 30, 30, 30, 22, 28, 22]);

    doc.save(`CFL_Performance_${monthName}_${year}.pdf`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Report 3 — Suspicious Activity Report
  // ─────────────────────────────────────────────────────────────────────────

  async function generateSuspiciousActivityReport(from, to) {
    const data = await fetchSuspiciousActivity(from, to);
    exportToExcel([{
      name: 'Suspicious Activity',
      data: data.map(a => ({
        Date_Time:  new Date(a.created_at).toLocaleString('en-IN'),
        Counselor:  a.cfl_profiles?.full_name || '',
        Employee_ID: a.cfl_profiles?.employee_id || '',
        Centre:     a.cfl_profiles?.cfl_centres?.name || '',
        Alert_Type: a.alert_type,
        Severity:   a.severity.toUpperCase(),
        Title:      a.title,
        Details:    a.message,
      })),
    }], `Suspicious_Activity_${from}_to_${to}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Report 4 — District Summary (all counselors, single day)
  // ─────────────────────────────────────────────────────────────────────────

  async function generateDistrictDailySummary(date) {
    const { data: summaries } = await sb()
      .from('cfl_daily_summaries')
      .select(`
        summary_date, total_km, villages_visited, villages_assigned, camps_conducted,
        total_participants, working_hours, field_hours, gps_compliance_pct,
        mock_location_events, daily_score,
        cfl_profiles!counselor_id(full_name, employee_id,
          cfl_centres!cfl_centre_id(name))
      `)
      .eq('summary_date', date)
      .order('daily_score', { ascending: false });

    const doc  = getPdf();
    if (!doc) return;

    let y = pdfHeader(doc, `District Daily Summary — ${date}`,
      `Khammam CFL GPS Monitoring System | ${new Date().toLocaleString('en-IN')}`);

    const headers = ['#','Name','Centre','KMs','Villages','Assignments','Camps','Participants','GPS%','Mock Evts','Score'];
    const rows    = (summaries || []).map((s, i) => [
      i + 1,
      s.cfl_profiles.full_name,
      s.cfl_profiles.cfl_centres.name,
      s.total_km?.toFixed(1),
      s.villages_visited,
      s.villages_assigned,
      s.camps_conducted,
      s.total_participants,
      s.gps_compliance_pct?.toFixed(0) + '%',
      s.mock_location_events || 0,
      s.daily_score || 0,
    ]);

    pdfTable(doc, headers, rows, y, [10, 38, 30, 14, 18, 22, 14, 22, 14, 18, 14]);
    doc.save(`District_Summary_${date}.pdf`);
  }

  root.CflReports = {
    generateDailyMovementReport,
    generatePerformanceReportPDF,
    generateSuspiciousActivityReport,
    generateDistrictDailySummary,
    exportToExcel,
  };

})(window);
