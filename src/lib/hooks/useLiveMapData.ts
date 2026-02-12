'use client';

import {
    AUTO_REFRESH_INTERVAL_MS,
    ONLINE_THRESHOLD_MINUTES,
    POLL_INTERVAL_MS,
    REALTIME_CHANNEL_NAME,
} from '@/lib/constants/tracking-constants';
import { useScope } from '@/lib/context/ScopeContext';
import { createClient } from '@/lib/supabase/client';
import type { LiveMapPin, RealtimeStatusPayload } from '@/lib/types/tracking-types';
import { getFullAvatarUrl } from '@/utils/supabase-images';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/** Signed URL validity in seconds (1 hour). */
const SIGNED_URL_EXPIRY = 3600;

// ============================================================================
// HELPER: Calculate user status based on last_seen
// ============================================================================
function calculateStatus(lastSeen: string): 'online' | 'offline' {
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
    return diffMinutes <= ONLINE_THRESHOLD_MINUTES ? 'online' : 'offline';
}

// ============================================================================
// HELPER: Format relative time
// ============================================================================
export function formatRelativeTime(timestamp: string, locale: string = 'en'): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (locale === 'ar') {
        if (diffMinutes < 1) return 'الآن';
        if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        return `منذ ${diffDays} يوم`;
    }

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

// ============================================================================
// HELPER: Check if pin data changed (for stable object identity)
// ============================================================================
function hasPinChanged(oldPin: LiveMapPin, newData: Partial<LiveMapPin>): boolean {
    return (
        oldPin.latitude !== newData.latitude ||
        oldPin.longitude !== newData.longitude ||
        oldPin.battery_level !== newData.battery_level ||
        oldPin.is_mock !== newData.is_mock ||
        oldPin.last_seen !== newData.last_seen ||
        oldPin.event_type !== newData.event_type
    );
}

// ============================================================================
// HOOK: useLiveMapData (ZERO-FLICKER OPTIMIZED)
// ============================================================================
export function useLiveMapData(clientId: string | null) {
    // Stable supabase reference (createBrowserClient returns singleton, but
    // wrapping in useMemo guarantees stable reference for dependency chains)
    const supabase = useMemo(() => createClient(), []);
    const { scope } = useScope();

    // Use Map for O(1) lookups and stable object identity
    const pinsMapRef = useRef<Map<string, LiveMapPin>>(new Map());
    const [pinsVersion, setPinsVersion] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Track subscription status
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const isConnectedRef = useRef(false);

    // ========================================================================
    // INITIAL FETCH: get_live_map_pins RPC
    // ========================================================================
    const fetchPins = useCallback(async () => {
        if (!clientId) return;

        try {
            setIsLoading(true);
            setError(null);

            const { data, error: rpcError } = await supabase.rpc('get_live_map_pins', {
                p_client_id: clientId,
            });

            if (rpcError) {
                console.error('❌ Live pins fetch failed:', JSON.stringify(rpcError, null, 2));
                throw new Error(rpcError.message || rpcError.code || 'Unknown RPC error');
            }

            // Ensure we have an array
            const pinsArray = Array.isArray(data) ? data : (data?.pins ?? []);

            // Build new map, MERGING with ghosts (Ghost Mode)
            const newMap = new Map<string, LiveMapPin>();

            // Track raw avatar paths for signed URL generation
            const avatarPathsMap = new Map<string, string>();

            // First: process fresh data from RPC
            pinsArray.forEach((rawPin: Record<string, unknown>) => {
                // Coerce lat/lng to numbers (RPC may return strings)
                let lat = Number(rawPin.latitude);
                let lng = Number(rawPin.longitude);
                const eventType = rawPin.event_type === 'location_disabled' ? 'location_disabled' as const : 'normal' as const;

                // For location_disabled events with 0,0 coords: use last known position
                if (eventType === 'location_disabled' && (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0)) {
                    const existingPin = pinsMapRef.current.get(String(rawPin.user_id));
                    if (existingPin && existingPin.latitude !== 0 && existingPin.longitude !== 0) {
                        lat = existingPin.latitude;
                        lng = existingPin.longitude;
                    } else {
                        // No last known position available — skip
                        console.warn('⚠️ Skipping location_disabled pin with no last known position:', rawPin.user_id);
                        return;
                    }
                }

                // Skip pins with invalid coordinates (normal events only)
                if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
                    console.warn('⚠️ Skipping pin with invalid coords:', rawPin.user_id, rawPin.latitude, rawPin.longitude);
                    return;
                }

                const pin: LiveMapPin = {
                    user_id: String(rawPin.user_id ?? ''),
                    full_name: String(rawPin.full_name ?? ''),
                    avatar_url: null, // Will be resolved with signed URLs below
                    role: String(rawPin.role ?? ''),
                    role_label_en: String(rawPin.role_label_en ?? ''),
                    role_label_ar: String(rawPin.role_label_ar ?? ''),
                    latitude: lat,
                    longitude: lng,
                    battery_level: rawPin.battery_level != null ? Number(rawPin.battery_level) : null,
                    is_mock: Boolean(rawPin.is_mock),
                    last_seen: String(rawPin.last_seen ?? new Date().toISOString()),
                    status: calculateStatus(String(rawPin.last_seen ?? new Date().toISOString())),
                    event_type: eventType,
                    is_checked_in: Boolean(rawPin.is_checked_in),
                };

                // Store raw avatar path for signed URL generation
                const rawAvatarPath = rawPin.avatar_url ? String(rawPin.avatar_url) : null;
                if (rawAvatarPath) {
                    avatarPathsMap.set(pin.user_id, rawAvatarPath);
                }

                const existingPin = pinsMapRef.current.get(pin.user_id);

                // Keep same object reference if data unchanged
                if (existingPin && !hasPinChanged(existingPin, pin)) {
                    newMap.set(pin.user_id, existingPin);
                } else {
                    newMap.set(pin.user_id, pin);
                }
            });

            // Second: Merge ghosts - users in old map but NOT in new RPC response
            // Ghost Mode: retain at last known position, mark offline
            pinsMapRef.current.forEach((existingPin, userId) => {
                if (!newMap.has(userId)) {
                    // Ghost: user no longer in RPC response
                    const ghostPin: LiveMapPin = {
                        ...existingPin,
                        status: 'offline',
                    };
                    // Only create new object if status actually changed
                    newMap.set(userId, existingPin.status === 'offline' ? existingPin : ghostPin);
                }
            });

            // ================================================================
            // SIGNED URL GENERATION: Batch-create authenticated avatar URLs
            // ================================================================
            if (avatarPathsMap.size > 0) {
                const paths = Array.from(avatarPathsMap.entries());

                // Generate signed URLs in parallel
                const signedResults = await Promise.allSettled(
                    paths.map(async ([userId, avatarPath]) => {
                        // Strip bucket prefix if already included
                        const cleanPath = avatarPath.startsWith('avatars/')
                            ? avatarPath.replace('avatars/', '')
                            : avatarPath;

                        const { data, error: signError } = await supabase.storage
                            .from('avatars')
                            .createSignedUrl(cleanPath, SIGNED_URL_EXPIRY);

                        if (signError || !data?.signedUrl) {
                            console.warn('⚠️ Signed URL failed for:', userId, cleanPath, signError?.message);
                            return { userId, signedUrl: null };
                        }

                        return { userId, signedUrl: data.signedUrl };
                    })
                );

                // Apply signed URLs to pins
                signedResults.forEach((result) => {
                    if (result.status === 'fulfilled' && result.value.signedUrl) {
                        const pin = newMap.get(result.value.userId);
                        if (pin) {
                            newMap.set(result.value.userId, {
                                ...pin,
                                avatar_url: result.value.signedUrl,
                            });
                        }
                    }
                });

                console.log(`🖼️ Signed URLs generated: ${signedResults.filter(r => r.status === 'fulfilled').length}/${paths.length}`);
            }

            pinsMapRef.current = newMap;
            setPinsVersion((v) => v + 1);
            setLastUpdated(new Date());
            console.log('🗺️ Live pins loaded:', newMap.size);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch live pins'));
        } finally {
            setIsLoading(false);
        }
    }, [clientId, supabase]);

    // Ref to always access the latest fetchPins without adding it to effect deps
    const fetchPinsRef = useRef(fetchPins);
    fetchPinsRef.current = fetchPins;

    // ========================================================================
    // REALTIME SUBSCRIPTION + AUTH-AWARE INITIAL FETCH
    // ========================================================================
    useEffect(() => {
        if (!clientId) return;

        let isMounted = true;
        let retryTimeout: ReturnType<typeof setTimeout> | null = null;

        // Wait for auth session to be ready, THEN fetch
        async function initWithAuth() {
            try {
                // Ensure the browser client has parsed session cookies
                const { data: { session } } = await supabase.auth.getSession();
                console.log('🔐 [AUTH] Session ready:', !!session);

                if (!isMounted) return;

                // Initial fetch
                await fetchPinsRef.current();

                // Auto-retry if first fetch returned 0 pins (session may have been stale)
                if (isMounted && pinsMapRef.current.size === 0 && session) {
                    console.log('🔄 [RETRY] First fetch returned 0 pins, retrying in 2s...');
                    retryTimeout = setTimeout(() => {
                        if (isMounted) fetchPinsRef.current();
                    }, 2000);
                }
            } catch (err) {
                console.error('❌ [INIT] Auth/fetch failed:', err);
            }
        }

        initWithAuth();

        // Set up Realtime channel
        const channel = supabase
            .channel(`${REALTIME_CHANNEL_NAME}:${clientId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'user_live_status',
                },
                (payload) => {
                    console.log('📡 Realtime update:', payload.eventType);

                    const { new: newData, old: oldData, eventType } = payload as unknown as RealtimeStatusPayload;
                    const userId = eventType === 'DELETE' ? oldData?.user_id : newData.user_id;

                    if (!userId) return;

                    if (eventType === 'DELETE') {
                        // GHOST MODE: Mark offline instead of removing
                        const ghostPin = pinsMapRef.current.get(userId);
                        if (ghostPin && ghostPin.status !== 'offline') {
                            const offlineGhost: LiveMapPin = {
                                ...ghostPin,
                                status: 'offline',
                            };
                            pinsMapRef.current.set(userId, offlineGhost);
                            setPinsVersion((v) => v + 1);
                            setLastUpdated(new Date());
                        }
                        return;
                    }

                    const existingPin = pinsMapRef.current.get(userId);

                    if (!existingPin) {
                        // New user - fetch full data (rare case)
                        fetchPinsRef.current();
                        return;
                    }

                    // Check if data actually changed (coerce to numbers for comparison)
                    const coercedData = {
                        latitude: Number(newData.latitude),
                        longitude: Number(newData.longitude),
                        battery_level: newData.battery_level != null ? Number(newData.battery_level) : null,
                        is_mock: Boolean(newData.is_mock),
                        last_seen: String(newData.last_seen),
                        event_type: newData.event_type === 'location_disabled' ? 'location_disabled' as const : 'normal' as const,
                    };

                    if (!hasPinChanged(existingPin, coercedData)) {
                        return; // Skip update - no re-render needed
                    }

                    // Skip if lat/lng are invalid
                    if (isNaN(coercedData.latitude) || isNaN(coercedData.longitude)) {
                        console.warn('⚠️ Realtime update with invalid coords:', userId);
                        return;
                    }

                    // Create new pin object ONLY for changed user
                    const updatedPin: LiveMapPin = {
                        ...existingPin,
                        latitude: coercedData.latitude,
                        longitude: coercedData.longitude,
                        battery_level: coercedData.battery_level,
                        is_mock: coercedData.is_mock,
                        last_seen: coercedData.last_seen,
                        status: calculateStatus(coercedData.last_seen),
                        event_type: coercedData.event_type,
                    };

                    pinsMapRef.current.set(userId, updatedPin);
                    setPinsVersion((v) => v + 1);
                    setLastUpdated(new Date());
                }
            )
            .subscribe((status) => {
                console.log('🔌 Realtime status:', status);
                const connected = status === 'SUBSCRIBED';
                isConnectedRef.current = connected;
                setIsConnected(connected);
            });

        channelRef.current = channel;

        // ================================================================
        // AUTO-REFRESH: Mandatory 60s interval (live dashboard feed)
        // Fires regardless of Realtime status so the map always updates.
        // ================================================================
        const autoRefreshInterval = setInterval(() => {
            console.log('🔄 [AUTO-REFRESH] Refreshing live pins...');
            fetchPinsRef.current();
        }, AUTO_REFRESH_INTERVAL_MS);

        // Fallback polling every 30s (faster safety net when Realtime drops)
        const pollInterval = setInterval(() => {
            if (!isConnectedRef.current) {
                console.log('⏰ Fallback polling (Realtime disconnected)...');
                fetchPinsRef.current();
            }
        }, POLL_INTERVAL_MS);

        // Cleanup
        return () => {
            isMounted = false;
            if (retryTimeout) clearTimeout(retryTimeout);
            clearInterval(autoRefreshInterval);
            clearInterval(pollInterval);
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
        // Only re-subscribe when clientId or supabase changes (stable deps)
    }, [clientId, supabase]);

    // ========================================================================
    // MEMOIZED PINS ARRAY (Stable references)
    // ========================================================================
    const pins = useMemo(() => {
        return Array.from(pinsMapRef.current.values());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pinsVersion]);

    // ========================================================================
    // MEMOIZED STATISTICS
    // ========================================================================
    const stats = useMemo(() => {
        const online = pins.filter((p) => p.status === 'online').length;
        const offline = pins.filter((p) => p.status === 'offline').length;
        const mockGps = pins.filter((p) => p.is_mock).length;
        const locationDisabled = pins.filter((p) => p.event_type === 'location_disabled').length;
        const checkedIn = pins.filter((p) => p.status === 'online' && p.is_checked_in).length;
        const idle = pins.filter((p) => p.status === 'online' && !p.is_checked_in).length;
        // Smart battery: only count as low if strictly 1-19% (not null or 0 = emulator)
        const lowBattery = pins.filter((p) => {
            const level = p.battery_level;
            return level !== null && level > 0 && level < 20;
        }).length;

        return {
            total: pins.length,
            online,
            offline,
            mockGps,
            locationDisabled,
            lowBattery,
            checkedIn,
            idle,
        };
    }, [pins]);

    // ========================================================================
    // RETURN
    // ========================================================================
    return {
        pins,
        isLoading,
        error,
        isConnected,
        lastUpdated,
        stats,
        refetch: fetchPins,
    };
}
