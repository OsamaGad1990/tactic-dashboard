// ============================================================================
// TRACKING CONSTANTS - Live Situation Room
// ============================================================================

/**
 * Time threshold (in minutes) to consider a user as "online".
 * If last_seen is within this threshold, user is online.
 */
export const ONLINE_THRESHOLD_MINUTES = 20;

/**
 * Cluster radius in pixels for marker clustering.
 * Markers within this radius will be grouped together.
 */
export const CLUSTER_RADIUS_PX = 50;

/**
 * Minimum zoom level where clusters start to expand.
 */
export const CLUSTER_MAX_ZOOM = 15;

/**
 * Fallback polling interval in milliseconds.
 * Used when Realtime subscription fails.
 */
export const POLL_INTERVAL_MS = 30000;

/**
 * Mandatory auto-refresh interval in milliseconds.
 * Fires regardless of Realtime connection status.
 * Ensures the map stays alive like a live dashboard feed.
 */
export const AUTO_REFRESH_INTERVAL_MS = 60000;

/**
 * Realtime subscription channel name.
 */
export const REALTIME_CHANNEL_NAME = 'live-tracking';

/**
 * Enable/disable mock GPS warning indicator.
 */
export const MOCK_GPS_WARNING_ENABLED = true;
export const LOCATION_DISABLED_WARNING_ENABLED = true;

/**
 * Default map center (Saudi Arabia - Riyadh).
 */
export const DEFAULT_MAP_CENTER = {
    lat: 24.7136,
    lng: 46.6753,
};

/**
 * Default map zoom level.
 */
export const DEFAULT_MAP_ZOOM = 6;

/**
 * Battery level thresholds for color coding.
 */
export const BATTERY_THRESHOLDS = {
    LOW: 20,      // Below this is critical (red)
    MEDIUM: 50,   // Below this is warning (yellow)
};

/**
 * Animation durations in milliseconds.
 */
export const ANIMATION_DURATIONS = {
    PULSE: 2000,
    MARKER_UPDATE: 300,
};

// ============================================================================
// ANTI-FRAUD TRACE CONSTANTS
// ============================================================================

/**
 * Speed threshold (km/h) above which movement is flagged as teleportation.
 */
export const TELEPORTATION_SPEED_THRESHOLD_KPH = 200;

/**
 * Maximum tracking log entries to fetch (performance guard).
 */
export const TRACE_LOG_LIMIT = 1000;

/**
 * Polyline stroke width in pixels.
 */
export const TRACE_STROKE_WIDTH = 4;

/**
 * Trace segment colors.
 */
export const TRACE_COLORS = {
    VALID: '#22c55e',       // Green - valid GPS (matches Situation Room)
    FRAUD: '#EF4444',       // Red - mock GPS
    TELEPORT: '#F59E0B',    // Amber/Yellow - impossible jump (distinct from fraud red)
};

/**
 * Trace segment stroke opacity.
 */
export const TRACE_OPACITY = {
    VALID: 1.0,
    FRAUD: 0.7,
    TELEPORT: 0.8,
};

// ============================================================================
// 3D TACTICAL MODE
// ============================================================================

/**
 * 3D mode tilt angle (degrees).
 */
export const TACTICAL_3D_TILT = 45;

/**
 * 3D mode heading (North = 0).
 */
export const TACTICAL_3D_HEADING = 0;
