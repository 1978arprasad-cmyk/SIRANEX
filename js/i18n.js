// =============================================================================
// Prajadarbar — Bilingual (Telugu + English) UI strings + helpers
// =============================================================================
(function (root) {
  "use strict";

  const STR = {
    // top-level branding
    app_name:               { en: "Prajadarbar",                          te: "ప్రజాదర్బార్" },
    tagline:                { en: "Grievance Redressal & Monitoring – Khammam District",
                              te: "ఫిర్యాదుల పరిష్కారం & పర్యవేక్షణ – ఖమ్మం జిల్లా" },
    govt_telangana:         { en: "Government of Telangana",              te: "తెలంగాణ ప్రభుత్వం" },

    // generic
    yes:                    { en: "Yes", te: "అవును" },
    no:                     { en: "No",  te: "కాదు" },
    save:                   { en: "Save", te: "సేవ్ చేయండి" },
    cancel:                 { en: "Cancel", te: "రద్దు" },
    submit:                 { en: "Submit", te: "సమర్పించండి" },
    update:                 { en: "Update", te: "నవీకరించండి" },
    close:                  { en: "Close", te: "మూసివేయండి" },
    back:                   { en: "Back", te: "వెనక్కి" },
    search:                 { en: "Search", te: "శోధించండి" },
    loading:                { en: "Loading…", te: "లోడ్ అవుతోంది…" },
    none:                   { en: "None", te: "ఏదీ లేదు" },
    optional:               { en: "Optional", te: "ఐచ్ఛికం" },
    required:               { en: "Required", te: "తప్పనిసరి" },

    // navigation / home
    nav_home:               { en: "Home",            te: "హోమ్" },
    nav_register:           { en: "Lodge Grievance", te: "ఫిర్యాదు నమోదు" },
    nav_track:              { en: "Track",           te: "స్థితి తెలుసుకోండి" },
    nav_transparency:       { en: "Transparency",    te: "పారదర్శకత" },
    nav_login:              { en: "Officer Login",   te: "అధికారి లాగిన్" },
    nav_dashboard:          { en: "Dashboard",       te: "డాష్‌బోర్డ్" },
    nav_logout:             { en: "Sign out",        te: "లాగౌట్" },

    home_hero_title:        { en: "Your voice. Our action. Within 90 days.",
                              te: "మీ గొంతు. మా చర్య. 90 రోజుల్లో." },
    home_hero_sub:          { en: "Lodge any grievance against any government department in Khammam district. Track real-time status, get SMS + WhatsApp updates, and rate the resolution.",
                              te: "ఖమ్మం జిల్లాలోని ఏ ప్రభుత్వ శాఖపై అయినా ఫిర్యాదు నమోదు చేయండి. నిజ-సమయ స్థితిని ట్రాక్ చేయండి, SMS + వాట్సాప్ అప్‌డేట్‌లు పొందండి, మరియు పరిష్కారాన్ని రేట్ చేయండి." },
    home_cta_register:      { en: "Lodge a grievance",  te: "ఫిర్యాదు నమోదు చేయండి" },
    home_cta_track:         { en: "Track my grievance", te: "నా ఫిర్యాదు ట్రాక్ చేయండి" },
    home_steps:             { en: "How it works",       te: "ఇది ఎలా పనిచేస్తుంది" },
    step_1_t:               { en: "Register",   te: "నమోదు చేయండి" },
    step_1_d:               { en: "Fill the form (Telugu / English) with your mobile number.", te: "మీ మొబైల్ నంబర్‌తో ఫారం నింపండి (తెలుగు / ఇంగ్లీష్)." },
    step_2_t:               { en: "Get ID + SMS / WhatsApp", te: "ఐడి + SMS / వాట్సాప్ పొందండి" },
    step_2_d:               { en: "You receive a unique grievance ID and a tracking link.", te: "మీకు ప్రత్యేక ఫిర్యాదు ఐడి మరియు ట్రాకింగ్ లింక్ వస్తాయి." },
    step_3_t:               { en: "Department acts", te: "శాఖ చర్య తీసుకుంటుంది" },
    step_3_d:               { en: "Field officer verifies on ground with GPS-tagged photo.", te: "క్షేత్ర అధికారి GPS-ట్యాగ్ చేసిన ఫోటోతో ధృవీకరిస్తారు." },
    step_4_t:               { en: "Resolved & you rate", te: "పరిష్కారం & మీరు రేట్ చేయండి" },
    step_4_d:               { en: "Within 30/60/90 days based on issue type. You confirm closure.", te: "సమస్య రకాన్ని బట్టి 30/60/90 రోజుల్లో. మీరు మూసివేతను నిర్ధారిస్తారు." },

    // registration form
    reg_title:              { en: "Lodge a grievance",       te: "ఫిర్యాదును నమోదు చేయండి" },
    reg_subtitle:           { en: "All fields marked * are required. Your data is confidential.", te: "* గుర్తు ఉన్న ఫీల్డ్‌లన్నీ తప్పనిసరి. మీ సమాచారం గోప్యంగా ఉంటుంది." },
    field_name:             { en: "Applicant name",          te: "దరఖాస్తుదారు పేరు" },
    field_guardian:         { en: "Father / Husband",        te: "తండ్రి / భర్త పేరు" },
    field_gender:           { en: "Gender",                  te: "లింగం" },
    field_mobile:           { en: "Mobile number",           te: "మొబైల్ నంబర్" },
    field_aadhaar:          { en: "Aadhaar (last 4)",        te: "ఆధార్ (చివరి 4 అంకెలు)" },
    field_mandal:           { en: "Mandal",                  te: "మండలం" },
    field_panchayat:        { en: "Panchayat / Village",     te: "పంచాయతీ / గ్రామం" },
    field_address:          { en: "Address / Village",       te: "చిరునామా / గ్రామం" },
    field_department:       { en: "Department",              te: "శాఖ" },
    field_subject:          { en: "Subject / Scheme",        te: "విషయం / పథకం" },
    field_description:      { en: "Describe your problem",   te: "మీ సమస్యను వివరించండి" },
    field_attachments:      { en: "Photos / documents (optional)", te: "ఫోటోలు / పత్రాలు (ఐచ్ఛికం)" },
    field_gps_capture:      { en: "Capture my GPS location", te: "నా GPS స్థానాన్ని తీసుకోండి" },
    gps_captured:           { en: "Location captured",       te: "స్థానం తీసుకోబడింది" },
    voice_input:            { en: "🎙️ Speak in Telugu",      te: "🎙️ తెలుగులో మాట్లాడండి" },
    voice_listening:        { en: "Listening… speak now",     te: "వింటోంది… మాట్లాడండి" },
    male:                   { en: "Male",   te: "పురుషుడు" },
    female:                 { en: "Female", te: "స్త్రీ" },
    other:                  { en: "Other",  te: "ఇతర" },
    consent:                { en: "I confirm the information is correct.", te: "నేను ఇచ్చిన సమాచారం సరైనదని నిర్ధారిస్తున్నాను." },
    submit_grievance:       { en: "Submit grievance",        te: "ఫిర్యాదును సమర్పించండి" },
    reg_success_title:      { en: "Grievance registered",    te: "ఫిర్యాదు నమోదు అయ్యింది" },
    reg_success_sub:        { en: "Save this Grievance ID. We have also sent it via SMS and WhatsApp.", te: "ఈ ఫిర్యాదు ఐడిని భద్రపరచండి. మేము దీన్ని SMS, వాట్సాప్ ద్వారా కూడా పంపాము." },
    reg_track_btn:          { en: "Track this grievance",    te: "ఈ ఫిర్యాదును ట్రాక్ చేయండి" },
    reg_register_another:   { en: "Lodge another",           te: "మరొక ఫిర్యాదు" },

    // tracking
    track_title:            { en: "Track your grievance",    te: "మీ ఫిర్యాదు స్థితిని తెలుసుకోండి" },
    track_subtitle:         { en: "Enter the mobile number used while registering and the Grievance ID.", te: "నమోదు సమయంలో ఉపయోగించిన మొబైల్ నంబర్ మరియు ఫిర్యాదు ఐడిని ఎంటర్ చేయండి." },
    track_gid:              { en: "Grievance ID",            te: "ఫిర్యాదు ఐడి" },
    track_btn:              { en: "Show status",             te: "స్థితిని చూపించు" },
    track_not_found:        { en: "No grievance found for this combination.", te: "ఈ కలయికకు ఫిర్యాదు కనుగొనబడలేదు." },
    track_timeline:         { en: "Status timeline",         te: "స్థితి కాలరేఖ" },
    track_assigned_to:      { en: "Assigned to",             te: "కేటాయించబడింది" },
    track_expected:         { en: "Expected resolution",     te: "ఆశించిన పరిష్కారం" },

    // status labels (must match enum)
    status_registered:      { en: "Registered",        te: "నమోదు" },
    status_acknowledged:    { en: "Acknowledged",      te: "ఆమోదించబడింది" },
    status_assigned:        { en: "Assigned",          te: "కేటాయించబడింది" },
    status_in_progress:     { en: "In Progress",       te: "ప్రగతిలో" },
    status_field_verified:  { en: "Field Verified",    te: "క్షేత్ర ధృవీకరణ" },
    status_resolved:        { en: "Resolved",          te: "పరిష్కరించబడింది" },
    status_closed:          { en: "Closed",            te: "మూసివేయబడింది" },
    status_rejected:        { en: "Rejected",          te: "తిరస్కరించబడింది" },
    status_reopened:        { en: "Re-opened",         te: "తిరిగి తెరవబడింది" },
    status_escalated:       { en: "Escalated",         te: "ఎస్కలేట్" },

    // KPIs / dashboards
    kpi_total:              { en: "Total grievances",  te: "మొత్తం ఫిర్యాదులు" },
    kpi_pending:            { en: "Pending",           te: "పెండింగ్" },
    kpi_in_progress:        { en: "In Progress",       te: "ప్రగతిలో" },
    kpi_resolved:           { en: "Resolved",          te: "పరిష్కరించబడ్డాయి" },
    kpi_closed:             { en: "Closed",            te: "మూసివేయబడ్డాయి" },
    kpi_overdue:            { en: "Overdue",           te: "గడువు దాటిన" },
    kpi_resolution_rate:    { en: "Resolution rate",   te: "పరిష్కార శాతం" },
    kpi_avg_days:           { en: "Avg. resolution days", te: "సగటు పరిష్కార రోజులు" },
    kpi_red_zone:           { en: "Red zone (60–90d)", te: "రెడ్ జోన్ (60–90 రో.)" },
    kpi_amber_zone:         { en: "Amber (30–60d)",    te: "అంబర్ (30–60 రో.)" },
    kpi_green_zone:         { en: "Green (<30d)",      te: "గ్రీన్ (<30 రో.)" },

    // collector dashboard
    dash_title:             { en: "Collector – District Dashboard", te: "కలెక్టర్ – జిల్లా డాష్‌బోర్డు" },
    dash_dept_breakdown:    { en: "Department-wise",  te: "శాఖల వారీగా" },
    dash_mandal_heatmap:    { en: "Mandal heatmap",   te: "మండల హీట్‌మ్యాప్" },
    dash_top_pending:       { en: "Top 10 pending",   te: "అత్యధిక 10 పెండింగ్" },
    dash_top_overdue:       { en: "Top 10 overdue",   te: "అత్యధిక 10 గడువుదాటిన" },
    dash_officer_score:     { en: "Officer scorecard", te: "అధికారి పనితీరు" },
    dash_export_excel:      { en: "Export to Excel",  te: "ఎక్సెల్‌కి ఎగుమతి" },
    dash_export_pdf:        { en: "Export to PDF",    te: "PDFకి ఎగుమతి" },

    // officer
    off_title:              { en: "Officer Inbox",     te: "అధికారి ఇన్‌బాక్స్" },
    off_filter_new:         { en: "New",               te: "కొత్తవి" },
    off_filter_inprogress:  { en: "In Progress",       te: "ప్రగతిలో" },
    off_filter_field:       { en: "Field-Verified",    te: "క్షేత్ర ధృవీకరణ" },
    off_filter_overdue:     { en: "Overdue",           te: "గడువుదాటిన" },
    off_filter_escalated:   { en: "Escalated",         te: "ఎస్కలేట్" },
    off_filter_closed:      { en: "Closed",            te: "మూసివేయబడ్డాయి" },
    off_filter_all:         { en: "All",               te: "అన్నీ" },
    off_take_action:        { en: "Take action",       te: "చర్య తీసుకోండి" },
    off_change_status:      { en: "Change status to…", te: "స్థితిని మార్చండి…" },
    off_remarks:            { en: "Remarks",           te: "వ్యాఖ్యలు" },
    off_action_photo:       { en: "Action-taken photo (with GPS)", te: "చర్య-తీసుకున్న ఫోటో (GPSతో)" },
    off_reassign:           { en: "Reassign to another department", te: "మరో శాఖకు కేటాయించండి" },

    // login
    login_title:            { en: "Officer / Admin login", te: "అధికారి / అడ్మిన్ లాగిన్" },
    login_email:            { en: "Email",                 te: "ఇమెయిల్" },
    login_password:         { en: "Password",              te: "పాస్‌వర్డ్" },
    login_otp:              { en: "OTP",                   te: "OTP" },
    login_send_otp:         { en: "Send OTP",              te: "OTP పంపండి" },
    login_btn:              { en: "Sign in",               te: "లాగిన్" },
    login_demo_role:        { en: "Demo role (no login)",  te: "డెమో పాత్ర (లాగిన్ లేకుండా)" },

    // feedback
    fb_title:               { en: "Confirm closure & rate the resolution", te: "మూసివేతను నిర్ధారించండి & రేటింగ్ ఇవ్వండి" },
    fb_rate_5:              { en: "Excellent", te: "అత్యుత్తమం" },
    fb_rate_4:              { en: "Good",      te: "మంచిది" },
    fb_rate_3:              { en: "OK",        te: "సరాసరి" },
    fb_rate_2:              { en: "Poor",      te: "బాగాలేదు" },
    fb_rate_1:              { en: "Very poor", te: "చాలా బాగాలేదు" },
    fb_comment:             { en: "Your comments (optional)", te: "మీ వ్యాఖ్యలు (ఐచ్ఛికం)" },
    fb_close:               { en: "Confirm closure", te: "మూసివేత నిర్ధారించండి" },
    fb_reopen:              { en: "Re-open this grievance", te: "ఈ ఫిర్యాదును తిరిగి తెరవండి" },
    fb_thanks:              { en: "Thank you for your feedback.", te: "మీ అభిప్రాయానికి ధన్యవాదాలు." },
  };

  function getLang() {
    return localStorage.getItem("praja_lang")
      || (window.PRAJA_CONFIG && PRAJA_CONFIG.DEFAULT_LANGUAGE)
      || "te";
  }
  function setLang(l) {
    localStorage.setItem("praja_lang", l);
    document.documentElement.setAttribute("lang", l);
    applyTranslations(document);
    document.dispatchEvent(new CustomEvent("praja:lang", { detail: l }));
  }
  function t(key, fallback) {
    const lang = getLang();
    if (STR[key] && STR[key][lang]) return STR[key][lang];
    if (STR[key] && STR[key].en)   return STR[key].en;
    return fallback || key;
  }
  function applyTranslations(scope) {
    scope = scope || document;
    scope.querySelectorAll("[data-t]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-t"));
    });
    scope.querySelectorAll("[data-t-placeholder]").forEach(function (el) {
      el.setAttribute("placeholder", t(el.getAttribute("data-t-placeholder")));
    });
    scope.querySelectorAll("[data-t-title]").forEach(function (el) {
      el.setAttribute("title", t(el.getAttribute("data-t-title")));
    });
  }
  function statusLabel(s) {
    return t("status_" + (s || "").replace(/-/g, "_"));
  }

  root.PrajaI18n = { t: t, getLang: getLang, setLang: setLang,
                    apply: applyTranslations, statusLabel: statusLabel,
                    STR: STR };
  document.documentElement.setAttribute("lang", getLang());
})(window);
