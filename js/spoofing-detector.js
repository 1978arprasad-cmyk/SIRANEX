// =============================================================================
// CFL Spoofing Detector — Multi-signal GPS fraud detection
// =============================================================================
(function (root) {
  'use strict';

  const cfg = root.CFL_CONFIG;

  // Running state for pattern analysis
  const _history = [];            // last N positions
  const MAX_HISTORY = 20;
  let _suspicionScore = 0;        // cumulative suspicion (resets daily)

  function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SIGNAL 1: Accuracy too perfect (mocked GPS often shows < 5m)
  // ─────────────────────────────────────────────────────────────────────────
  function checkPerfectAccuracy(position) {
    const acc = position.coords.accuracy;
    if (acc !== null && acc < cfg.SUSPICIOUS_ACCURACY_M) {
      return { flag: true, reason: `Suspiciously perfect accuracy: ${acc.toFixed(1)}m` };
    }
    return { flag: false };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SIGNAL 2: Impossible speed (teleportation)
  // ─────────────────────────────────────────────────────────────────────────
  function checkImpossibleSpeed(position, prevPosition) {
    if (!prevPosition) return { flag: false };
    const dist   = haversine(
      position.coords.latitude, position.coords.longitude,
      prevPosition.coords.latitude, prevPosition.coords.longitude
    );
    const dt_sec = (position.timestamp - prevPosition.timestamp) / 1000;
    if (dt_sec <= 0) return { flag: false };
    const speed  = (dist / dt_sec) * 3.6;   // km/h
    if (speed > cfg.IMPOSSIBLE_SPEED_KMH) {
      return {
        flag:   true,
        reason: `Impossible speed: ${speed.toFixed(0)} km/h (${dist.toFixed(0)}m in ${dt_sec.toFixed(0)}s)`,
      };
    }
    return { flag: false };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SIGNAL 3: Speed field claims 0 but location changed significantly
  // ─────────────────────────────────────────────────────────────────────────
  function checkSpeedInconsistency(position, prevPosition) {
    if (!prevPosition) return { flag: false };
    const reportedSpeed = position.coords.speed;
    if (reportedSpeed !== null && reportedSpeed < 0.5) {   // "stationary"
      const dist  = haversine(
        position.coords.latitude, position.coords.longitude,
        prevPosition.coords.latitude, prevPosition.coords.longitude
      );
      const dt    = (position.timestamp - prevPosition.timestamp) / 1000;
      const calcSpeed = dt > 0 ? (dist / dt) * 3.6 : 0;
      if (calcSpeed > 30 && dist > 200) {
        return {
          flag:   true,
          reason: `Speed reported 0 but moved ${dist.toFixed(0)}m (calc: ${calcSpeed.toFixed(0)} km/h)`,
        };
      }
    }
    return { flag: false };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SIGNAL 4: Perfectly round coordinates (mocked apps often use integer values)
  // ─────────────────────────────────────────────────────────────────────────
  function checkRoundCoordinates(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const latDec = (lat.toString().split('.')[1] || '').length;
    const lngDec = (lng.toString().split('.')[1] || '').length;
    if (latDec <= 2 || lngDec <= 2) {
      return { flag: true, reason: `Suspiciously round coordinates: ${lat},${lng}` };
    }
    return { flag: false };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SIGNAL 5: Altitude perfectly 0 or null when at non-sea-level location
  // ─────────────────────────────────────────────────────────────────────────
  function checkAltitude(position) {
    const alt = position.coords.altitude;
    // Khammam district is 150-400m elevation; exactly 0 with altitudeAccuracy=0 is suspicious
    if (alt === 0 && position.coords.altitudeAccuracy === 0) {
      return { flag: true, reason: 'Altitude exactly 0 with 0 accuracy — mock indicator' };
    }
    return { flag: false };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SIGNAL 6: Location frozen — exact same coords repeated multiple times
  // ─────────────────────────────────────────────────────────────────────────
  function checkFrozenLocation(position) {
    if (_history.length < 3) return { flag: false };
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const sameLast = _history.slice(-3).every(p =>
      Math.abs(p.coords.latitude  - lat) < 0.000001 &&
      Math.abs(p.coords.longitude - lng) < 0.000001
    );
    if (sameLast) {
      return { flag: true, reason: 'GPS location frozen — same coordinates for 3+ pings' };
    }
    return { flag: false };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SIGNAL 7: User Agent / Platform mismatch (desktop browser claiming to be field)
  // ─────────────────────────────────────────────────────────────────────────
  function checkUserAgent() {
    const ua = navigator.userAgent.toLowerCase();
    const isAndroid = ua.includes('android');
    const isIOS     = ua.includes('iphone') || ua.includes('ipad');
    const isMobile  = isAndroid || isIOS;
    if (!isMobile) {
      // Allow for demo/testing but flag it
      return { flag: true, reason: 'Non-mobile device detected — field use requires Android' };
    }
    return { flag: false };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SIGNAL 8: Timestamp delta inconsistency
  // ─────────────────────────────────────────────────────────────────────────
  function checkTimestampDrift(position) {
    const posTime  = position.timestamp;
    const sysTime  = Date.now();
    const driftSec = Math.abs((sysTime - posTime) / 1000);
    // If GPS timestamp is > 5 minutes off from device clock → suspicious
    if (driftSec > 300) {
      return { flag: true, reason: `GPS timestamp ${driftSec.toFixed(0)}s off from device clock` };
    }
    return { flag: false };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN: Analyze all signals, compute composite result
  // ─────────────────────────────────────────────────────────────────────────

  function analyze(position, prevPosition) {
    const checks = [
      { weight: 3, ...checkPerfectAccuracy(position) },
      { weight: 5, ...checkImpossibleSpeed(position, prevPosition) },
      { weight: 4, ...checkSpeedInconsistency(position, prevPosition) },
      { weight: 2, ...checkRoundCoordinates(position) },
      { weight: 2, ...checkAltitude(position) },
      { weight: 4, ...checkFrozenLocation(position) },
      { weight: 1, ...checkUserAgent() },
      { weight: 3, ...checkTimestampDrift(position) },
    ];

    const triggered = checks.filter(c => c.flag);
    const totalWeight = triggered.reduce((s, c) => s + c.weight, 0);

    // Update history
    _history.push(position);
    if (_history.length > MAX_HISTORY) _history.shift();

    // Update cumulative score
    _suspicionScore += totalWeight;

    const isMock   = totalWeight >= 5;   // threshold: 5+ weight points = mock
    const reasons  = triggered.map(c => c.reason).join('; ');

    return {
      mock_location: isMock,
      mock_reason:   isMock ? reasons : null,
      suspicion_score: _suspicionScore,
      triggered_checks: triggered.length,
    };
  }

  // Perceptual hash for photo duplicate detection (average hash, 8x8)
  function computeImagePHash(canvas) {
    const ctx  = canvas.getContext('2d');
    const size = 8;
    // Resize to 8x8 in grayscale
    const offscreen = document.createElement('canvas');
    offscreen.width = offscreen.height = size;
    const octx = offscreen.getContext('2d');
    octx.drawImage(canvas, 0, 0, size, size);
    const data = octx.getImageData(0, 0, size, size).data;
    const grays = [];
    for (let i = 0; i < data.length; i += 4) {
      grays.push(0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]);
    }
    const avg = grays.reduce((s, v) => s + v, 0) / grays.length;
    return grays.map(v => v >= avg ? '1' : '0').join('');
  }

  function pHashDistance(hash1, hash2) {
    if (!hash1 || !hash2 || hash1.length !== hash2.length) return 64;
    let d = 0;
    for (let i = 0; i < hash1.length; i++) {
      if (hash1[i] !== hash2[i]) d++;
    }
    return d;
  }

  // SHA-256 of photo blob for exact duplicate detection
  async function sha256Blob(blob) {
    const buffer = await blob.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  root.CflSpoofDetector = {
    analyze,
    computeImagePHash,
    pHashDistance,
    sha256Blob,
    resetScore() { _suspicionScore = 0; },
    get suspicionScore() { return _suspicionScore; },
  };

})(window);
