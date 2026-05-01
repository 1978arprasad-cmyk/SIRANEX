// =============================================================================
// Citizen registration page
// =============================================================================
(async function () {
  PrajaUtils.buildHeader({ mountTo: document.getElementById("app-root") });
  PrajaI18n.apply(document);

  const $ = PrajaUtils.$;
  const lang = PrajaI18n.getLang();

  // Populate dropdowns
  const [mandals, departments] = await Promise.all([PrajaApi.getMandals(), PrajaApi.getDepartments()]);
  const mSel = $("#r-mandal");
  mSel.innerHTML = '<option value="">—</option>' +
    mandals.map(function (m) {
      return '<option value="' + m.id + '">' + (lang === "te" ? (m.name_te || m.name_en) : m.name_en) + '</option>';
    }).join("");
  const dSel = $("#r-department");
  dSel.innerHTML = '<option value="">—</option>' +
    departments.map(function (d) {
      return '<option value="' + d.id + '">' + (d.icon || "") + " " + (lang === "te" ? (d.name_te || d.name_en) : d.name_en) + '</option>';
    }).join("");

  mSel.addEventListener("change", async function () {
    const pSel = $("#r-panchayat");
    pSel.innerHTML = '<option value="">—</option>';
    if (!mSel.value) return;
    const ps = await PrajaApi.getPanchayats(mSel.value);
    pSel.innerHTML = '<option value="">—</option>' + ps.map(function (p) {
      return '<option value="' + p.id + '">' + (lang === "te" ? (p.name_te || p.name_en) : p.name_en) + '</option>';
    }).join("");
  });

  dSel.addEventListener("change", async function () {
    const sSel = $("#r-subject");
    sSel.innerHTML = '<option value="">—</option>';
    if (!dSel.value) return;
    const subs = await PrajaApi.getSubjects(dSel.value);
    sSel.innerHTML = '<option value="">—</option>' + subs.map(function (s) {
      return '<option value="' + s.id + '">' + (lang === "te" ? (s.name_te || s.name_en) : s.name_en) + '</option>';
    }).join("");
  });

  // GPS capture
  let gps = null;
  $("#gps-btn").addEventListener("click", async function () {
    $("#gps-status").textContent = "…";
    gps = await PrajaUtils.getGPS();
    if (gps) $("#gps-status").textContent = "✅ " + PrajaI18n.t("gps_captured") + " (" + gps.lat.toFixed(4) + ", " + gps.lng.toFixed(4) + ")";
    else     $("#gps-status").textContent = "❌ Location not available";
  });

  // Voice-to-text (Telugu) — uses Web Speech API where supported
  const voiceBtn = $("#voice-btn");
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    voiceBtn.disabled = true;
    voiceBtn.title = "Browser does not support speech recognition";
  } else {
    let rec = null, listening = false;
    voiceBtn.addEventListener("click", function () {
      if (listening) { try { rec.stop(); } catch (e) {} return; }
      rec = new SR();
      rec.lang = (PrajaI18n.getLang() === "te") ? "te-IN" : "en-IN";
      rec.continuous = true;
      rec.interimResults = false;
      rec.onstart = function () { listening = true; voiceBtn.textContent = "🔴 " + PrajaI18n.t("voice_listening"); };
      rec.onend   = function () { listening = false; voiceBtn.textContent = PrajaI18n.t("voice_input"); };
      rec.onerror = function () { listening = false; voiceBtn.textContent = PrajaI18n.t("voice_input"); };
      rec.onresult = function (e) {
        const ta = $("#r-description");
        for (let i = e.resultIndex; i < e.results.length; i++) {
          ta.value = (ta.value + " " + e.results[i][0].transcript).trim();
        }
      };
      try { rec.start(); } catch (e) {}
    });
  }

  // Submit
  $("#reg-form").addEventListener("submit", async function (ev) {
    ev.preventDefault();
    const btn = $("#submit-btn");
    btn.disabled = true;

    const mobile = $("#r-mobile").value.replace(/\D/g, "");
    if (mobile.length !== 10) { PrajaUtils.toast("Mobile must be 10 digits", "error"); btn.disabled = false; return; }

    const filesEl = $("#r-files");
    const files = filesEl.files ? Array.from(filesEl.files) : [];

    const payload = {
      applicant_name:  $("#r-name").value.trim(),
      guardian_name:   $("#r-guardian").value.trim() || null,
      gender:          $("#r-gender").value || null,
      mobile:          mobile,
      aadhaar_last4:   ($("#r-aadhaar4").value || "").replace(/\D/g, "").slice(0, 4) || null,
      language:        PrajaI18n.getLang(),
      mandal_id:       $("#r-mandal").value || null,
      panchayat_id:    $("#r-panchayat").value || null,
      village_address: $("#r-address").value.trim() || null,
      department_id:   $("#r-department").value,
      subject_id:      $("#r-subject").value || null,
      description:     $("#r-description").value.trim(),
      gps_lat:         gps && gps.lat,
      gps_lng:         gps && gps.lng,
      severity:        "medium",
      source:          "web",
      files:           files,
    };

    try {
      const created = await PrajaApi.createGrievance(payload);
      PrajaUtils.toast("Grievance " + created.grievance_id + " registered.", "ok");
      $("#reg-form").classList.add("hidden");
      const success = $("#success");
      success.classList.remove("hidden");
      $("#success-gid").textContent = created.grievance_id;
      $("#success-track").href = "track.html?gid=" + encodeURIComponent(created.grievance_id) + "&m=" + encodeURIComponent(created.mobile);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      console.error(e);
      PrajaUtils.toast("Could not register: " + (e.message || e), "error");
      btn.disabled = false;
    }
  });
})();
