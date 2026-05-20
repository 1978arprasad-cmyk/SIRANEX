// =============================================================================
// CFL GPS Monitoring System — Configuration
// Extends the existing PRAJA_CONFIG
// =============================================================================

const CFL_CONFIG = {
  // App identity
  APP_NAME:    'CFL GPS Monitor',
  APP_SUBTITLE:'CFL Counselor GPS Monitoring & Camp Verification System',
  DISTRICT:    'Khammam',
  STATE:       'Telangana',
  VERSION:     '1.0.0',

  // Supabase (shared with PRAJA_CONFIG if loaded, else standalone)
  get SUPABASE_URL() { return window.PRAJA_CONFIG?.SUPABASE_URL || ''; },
  get SUPABASE_KEY() { return window.PRAJA_CONFIG?.SUPABASE_KEY || ''; },

  // GPS Tracking
  GPS_INTERVAL_MS:        120_000,   // 2 minute interval (battery-balanced)
  GPS_INTERVAL_FAST_MS:    30_000,   // 30s when actively moving
  GPS_TIMEOUT_MS:          15_000,   // 15s GPS fix timeout
  GPS_HIGH_ACCURACY:       true,
  GPS_MAX_AGE_MS:          60_000,   // accept positions up to 60s old

  // Tracking status thresholds
  PING_OFFLINE_THRESHOLD_MIN:  10,   // > 10 min without ping = offline
  PING_IDLE_THRESHOLD_MIN:      5,   // > 5 min without movement = idle
  MOVEMENT_MIN_SPEED_KMH:       1.5, // < 1.5 km/h = not moving
  IMPOSSIBLE_SPEED_KMH:       200,   // > 200 km/h = spoofing

  // Geofencing
  GEOFENCE_DEFAULT_RADIUS_M:   300,  // default village radius
  GEOFENCE_ENTRY_BUFFER_M:      30,  // smoothing buffer on entry
  GEOFENCE_MIN_STAY_MINUTES:    20,  // min stay to mark visit as valid
  CAMP_MIN_DURATION_MINUTES:    30,  // minimum camp duration

  // Field hours (server validates these; also used client-side for UX)
  FIELD_START_HOUR:             8,   // 8:00 AM
  FIELD_END_HOUR:              18,   // 6:00 PM

  // Anti-spoofing thresholds
  SUSPICIOUS_ACCURACY_M:        5,   // < 5m accuracy is suspicious (mocked)
  MAX_ACCURACY_M:             100,   // > 100m accuracy = low quality
  TELEPORT_THRESHOLD_M:      2000,   // > 2km jump in 2 min = suspicious
  STABLE_LOCATION_RADIUS_M:    10,   // < 10m movement = stationary

  // Camp verification
  MIN_PHOTOS_PER_CAMP:          2,
  MAX_PHOTOS_PER_CAMP:         10,
  MAX_PHOTO_SIZE_MB:            5,
  CAMP_GPS_TOLERANCE_M:       500,   // camp must be within 500m of village

  // Alerts
  ALERT_INACTIVE_MINUTES:      30,
  ALERT_NO_CAMP_HOUR:          15,   // alert if no camp by 3 PM
  ALERT_RETRIGGER_MINUTES:     60,   // don't re-alert same type within 60 min

  // Performance scoring weights (must sum to 1)
  SCORE_WEIGHTS: {
    village_visit:    0.25,
    gps_compliance:   0.20,
    camp_quality:     0.20,
    travel_coverage:  0.15,
    reporting:        0.10,
    participant_reach: 0.10,
  },

  // Map defaults (Khammam district centre)
  MAP_CENTER_LAT:  17.2473,
  MAP_CENTER_LNG:  80.1514,
  MAP_DEFAULT_ZOOM: 9,
  MAP_COUNSELOR_ZOOM: 14,

  // Status colors (used in map markers + dashboard)
  STATUS_COLORS: {
    online:          '#16a34a',   // green
    idle:            '#d97706',   // amber
    offline:         '#dc2626',   // red
    conducting_camp: '#2563eb',   // blue
  },

  // Offline / sync
  OFFLINE_QUEUE_KEY:  'cfl_offline_queue',
  OFFLINE_MAX_ITEMS:  500,
  SYNC_RETRY_MS:     10_000,

  // Demo mode (uses test data, no real GPS required)
  DEMO_MODE: false,
};

window.CFL_CONFIG = CFL_CONFIG;
