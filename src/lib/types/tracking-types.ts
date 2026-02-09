// ============================================================================
// TRACKING TYPES - Live Situation Room
// ============================================================================

/**
 * User status based on last_seen time.
 */
export type UserStatus = 'online' | 'offline';

/**
 * Live map pin data from get_live_map_pins RPC.
 */
export interface LiveMapPin {
    user_id: string;
    full_name: string;
    avatar_url: string | null;
    role: string;
    role_label_en: string;
    role_label_ar: string;
    latitude: number;
    longitude: number;
    battery_level: number | null;
    is_mock: boolean;
    last_seen: string; // ISO timestamp
    status: UserStatus;
}

/**
 * RPC response for get_live_map_pins.
 */
export interface LiveMapPinsResponse {
    pins: LiveMapPin[];
    total_count: number;
    online_count: number;
    offline_count: number;
}

/**
 * Real-time update payload from user_live_status table.
 */
export interface RealtimeStatusPayload {
    new: {
        user_id: string;
        latitude: number;
        longitude: number;
        battery_level: number | null;
        is_mock: boolean;
        last_seen: string;
    };
    old: {
        user_id: string;
    } | null;
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
}

/**
 * Map marker with calculated display properties.
 */
export interface MapMarkerData {
    id: string;
    position: google.maps.LatLngLiteral;
    pin: LiveMapPin;
    isSelected: boolean;
}

/**
 * Cluster marker for grouped pins.
 */
export interface ClusterMarkerData {
    position: google.maps.LatLngLiteral;
    count: number;
    markers: MapMarkerData[];
}

/**
 * Map viewport bounds for filtering.
 */
export interface MapBounds {
    north: number;
    south: number;
    east: number;
    west: number;
}

/**
 * User popup info for display.
 */
export interface UserPopupInfo {
    pin: LiveMapPin;
    lastSeenText: string; // Relative time (e.g., "2 mins ago")
    batteryColor: 'red' | 'yellow' | 'green';
}

// ============================================================================
// ANTI-FRAUD TRACE TYPES
// ============================================================================

/**
 * Segment type for the anti-fraud trace polyline.
 */
export type TraceSegmentType = 'valid' | 'fraud' | 'teleport';

/**
 * Single tracking log entry from the tracking_logs table.
 */
export interface TrackingLogEntry {
    id: string;
    user_id: string;
    client_id: string;
    latitude: number;
    longitude: number;
    speed: number | null;
    battery_level: number | null;
    is_mock: boolean;
    created_at: string; // ISO timestamp
}

/**
 * A segment of the user's trace polyline, color-coded by integrity.
 * - valid: blue solid (real GPS)
 * - fraud: red dashed (mock GPS)
 * - teleport: red solid (impossible speed)
 */
export interface TraceSegment {
    path: google.maps.LatLngLiteral[];
    type: TraceSegmentType;
}
