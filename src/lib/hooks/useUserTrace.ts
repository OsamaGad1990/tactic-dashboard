'use client';

import {
    TELEPORTATION_SPEED_THRESHOLD_KPH,
    TRACE_LOG_LIMIT,
} from '@/lib/constants/tracking-constants';
import { createClient } from '@/lib/supabase/client';
import type {
    TraceSegment,
    TraceSegmentType,
    TrackingLogEntry,
} from '@/lib/types/tracking-types';
import { useCallback, useMemo, useRef, useState } from 'react';

// ============================================================================
// HAVERSINE FORMULA: Calculate distance between two GPS points (km)
// ============================================================================
function haversineDistanceKm(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// ============================================================================
// SPEED CALCULATOR: km/h between two log entries
// ============================================================================
function calculateSpeedKph(
    entry1: TrackingLogEntry,
    entry2: TrackingLogEntry
): number {
    const distanceKm = haversineDistanceKm(
        entry1.latitude,
        entry1.longitude,
        entry2.latitude,
        entry2.longitude
    );

    const time1 = new Date(entry1.created_at).getTime();
    const time2 = new Date(entry2.created_at).getTime();
    const timeDiffHours = Math.abs(time2 - time1) / (1000 * 60 * 60);

    // Avoid division by zero (simultaneous entries)
    if (timeDiffHours < 0.0001) return 0;

    return distanceKm / timeDiffHours;
}

// ============================================================================
// SEGMENT BUILDER: Convert log entries to color-coded trace segments
// ============================================================================
function buildTraceSegments(logs: TrackingLogEntry[]): TraceSegment[] {
    if (logs.length < 2) return [];

    const segments: TraceSegment[] = [];
    let currentSegment: TraceSegment | null = null;

    for (let i = 0; i < logs.length - 1; i++) {
        const current = logs[i];
        const next = logs[i + 1];

        // Determine segment type
        let segmentType: TraceSegmentType;

        const speedKph = calculateSpeedKph(current, next);

        if (speedKph > TELEPORTATION_SPEED_THRESHOLD_KPH) {
            segmentType = 'teleport';
        } else if (current.is_mock || next.is_mock) {
            segmentType = 'fraud';
        } else {
            segmentType = 'valid';
        }

        const fromPoint: google.maps.LatLngLiteral = {
            lat: current.latitude,
            lng: current.longitude,
        };
        const toPoint: google.maps.LatLngLiteral = {
            lat: next.latitude,
            lng: next.longitude,
        };

        // Continue existing segment or start a new one
        if (currentSegment && currentSegment.type === segmentType) {
            // Extend current segment
            currentSegment.path.push(toPoint);
        } else {
            // Save previous segment
            if (currentSegment) {
                segments.push(currentSegment);
            }

            // Start new segment (include the "from" point for continuity)
            currentSegment = {
                path: [fromPoint, toPoint],
                type: segmentType,
            };
        }
    }

    // Push the last segment
    if (currentSegment) {
        segments.push(currentSegment);
    }

    return segments;
}

// ============================================================================
// HOOK: useUserTrace - Lazy-fetch tracking logs & build trace segments
// ============================================================================
export function useUserTrace() {
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [logs, setLogs] = useState<TrackingLogEntry[]>([]);

    // Cache: avoid re-fetching same user
    const cacheRef = useRef<Map<string, TrackingLogEntry[]>>(new Map());

    // ========================================================================
    // FETCH: Get today's tracking logs for a specific user
    // ========================================================================
    const fetchTrace = useCallback(
        async (userId: string) => {
            // Check cache first
            const cached = cacheRef.current.get(userId);
            if (cached) {
                setLogs(cached);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                // Today's date range (UTC)
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);

                const { data, error: queryError } = await supabase
                    .from('tracking_logs')
                    .select('id, user_id, client_id, latitude, longitude, speed, battery_level, is_mock, created_at')
                    .eq('user_id', userId)
                    .gte('created_at', todayStart.toISOString())
                    .order('created_at', { ascending: true })
                    .limit(TRACE_LOG_LIMIT);

                if (queryError) {
                    console.error('❌ Trace fetch failed:', JSON.stringify(queryError, null, 2));
                    throw new Error(queryError.message || 'Failed to fetch tracking logs');
                }

                // Coerce data types
                const typedLogs: TrackingLogEntry[] = (data ?? []).map(
                    (row: Record<string, unknown>) => ({
                        id: String(row.id ?? ''),
                        user_id: String(row.user_id ?? ''),
                        client_id: String(row.client_id ?? ''),
                        latitude: Number(row.latitude),
                        longitude: Number(row.longitude),
                        speed: row.speed != null ? Number(row.speed) : null,
                        battery_level: row.battery_level != null ? Number(row.battery_level) : null,
                        is_mock: Boolean(row.is_mock),
                        created_at: String(row.created_at ?? ''),
                    })
                ).filter(
                    (entry) =>
                        !isNaN(entry.latitude) &&
                        !isNaN(entry.longitude) &&
                        entry.latitude !== 0 &&
                        entry.longitude !== 0
                );

                // Cache the result
                cacheRef.current.set(userId, typedLogs);
                setLogs(typedLogs);

                console.log(`🕵️ Trace loaded for ${userId}: ${typedLogs.length} entries`);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Trace fetch failed'));
                setLogs([]);
            } finally {
                setIsLoading(false);
            }
        },
        [supabase]
    );

    // ========================================================================
    // CLEAR: Reset trace when user deselects
    // ========================================================================
    const clearTrace = useCallback(() => {
        setLogs([]);
        setError(null);
    }, []);

    // ========================================================================
    // INVALIDATE CACHE: Force refetch on next click
    // ========================================================================
    const invalidateCache = useCallback((userId?: string) => {
        if (userId) {
            cacheRef.current.delete(userId);
        } else {
            cacheRef.current.clear();
        }
    }, []);

    // ========================================================================
    // MEMOIZED SEGMENTS
    // ========================================================================
    const segments = useMemo(() => buildTraceSegments(logs), [logs]);

    // ========================================================================
    // RETURN
    // ========================================================================
    return {
        segments,
        isLoading,
        error,
        fetchTrace,
        clearTrace,
        invalidateCache,
        logCount: logs.length,
    };
}
