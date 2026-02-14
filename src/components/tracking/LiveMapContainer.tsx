'use client';

import {
    DEFAULT_MAP_CENTER,
    DEFAULT_MAP_ZOOM,
    TACTICAL_3D_HEADING,
    TACTICAL_3D_TILT,
} from '@/lib/constants/tracking-constants';
import { useFilters } from '@/lib/context/FilterContext';
import { useScope } from '@/lib/context/ScopeContext';
import { useLiveMapData } from '@/lib/hooks/useLiveMapData';
import { useUserTrace } from '@/lib/hooks/useUserTrace';
import type { LiveMapPin } from '@/lib/types/tracking-types';
import { APIProvider, Map, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import {
    AlertTriangle,
    Battery,
    Box,
    Loader2,
    MapPin,
    MapPinOff,
    RefreshCw,
    Users,
    Wifi,
    WifiOff,
} from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActiveUsersList } from './ActiveUsersList';
import { UserInfoPopup } from './UserInfoPopup';
import { UserMapMarker } from './UserMapMarker';
import { UserTracePolyline } from './UserTracePolyline';

interface LiveMapContainerProps {
    clientId: string;
}

// ============================================================================
// STATS BAR (Memoized)
// ============================================================================
const StatsBar = memo(function StatsBar({
    stats,
    isConnected,
    onRefresh,
    isLoading,
    locale,
}: {
    stats: { total: number; online: number; offline: number; mockGps: number; locationDisabled: number; lowBattery: number; checkedIn: number; idle: number };
    isConnected: boolean;
    onRefresh: () => void;
    isLoading: boolean;
    locale: string;
}) {
    const isArabic = locale === 'ar';
    const t = useTranslations('tracking');

    return (
        <div
            className="flex flex-wrap items-center justify-between gap-4 p-4 bg-card/80 backdrop-blur-lg rounded-xl border border-border"
            dir={isArabic ? 'rtl' : 'ltr'}
        >
            {/* Stats */}
            <div className="flex flex-wrap items-center gap-4">
                {/* Total */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{stats.total}</span>
                    <span className="text-xs text-muted-foreground">{t('total')}</span>
                </div>

                {/* Online */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">{stats.online}</span>
                    <span className="text-xs text-muted-foreground">{t('online')}</span>
                </div>

                {/* Checked In (active visit) */}
                {stats.checkedIn > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{stats.checkedIn}</span>
                        <span className="text-xs text-muted-foreground">{t('checkedIn')}</span>
                    </div>
                )}

                {/* Idle (online but no active visit) */}
                {stats.idle > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        <span className="text-sm font-medium text-red-600 dark:text-red-400">{stats.idle}</span>
                        <span className="text-xs text-muted-foreground">{t('idle')}</span>
                    </div>
                )}

                {/* Offline */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-500/10">
                    <div className="h-2 w-2 rounded-full bg-gray-400" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{stats.offline}</span>
                    <span className="text-xs text-muted-foreground">{t('offline')}</span>
                </div>

                {/* Mock GPS Warning */}
                {stats.mockGps > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium text-red-600 dark:text-red-400">{stats.mockGps}</span>
                        <span className="text-xs text-muted-foreground">{t('fakeGps')}</span>
                    </div>
                )}

                {/* Low Battery */}
                {stats.lowBattery > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10">
                        <Battery className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">{stats.lowBattery}</span>
                        <span className="text-xs text-muted-foreground">{t('lowBattery')}</span>
                    </div>
                )}

                {/* Location Disabled Warning */}
                {stats.locationDisabled > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10">
                        <MapPinOff className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium text-red-600 dark:text-red-400">{stats.locationDisabled}</span>
                        <span className="text-xs text-muted-foreground">{t('locationOff')}</span>
                    </div>
                )}
            </div>

            {/* Connection Status & Refresh */}
            <div className="flex items-center gap-3">
                {/* Connection indicator */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isConnected ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                    }`}>
                    {isConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                    <span className="text-xs font-medium">
                        {isConnected ? t('live') : t('disconnected')}
                    </span>
                </div>

                {/* Refresh button */}
                <button
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="text-xs font-medium">{t('refresh')}</span>
                </button>
            </div>
        </div>
    );
});

// ============================================================================
// 3D TOGGLE BUTTON (Floating)
// ============================================================================
const TacticalToggle = memo(function TacticalToggle({
    is3DMode,
    onToggle,
}: {
    is3DMode: boolean;
    onToggle: () => void;
}) {
    const t = useTranslations('tracking');

    return (
        <button
            onClick={onToggle}
            className={`
                absolute top-4 right-4 z-20
                flex items-center gap-2 px-4 py-2.5
                rounded-xl shadow-lg border border-border
                backdrop-blur-lg
                font-semibold text-sm
                transition-all duration-300 ease-in-out
                ${is3DMode
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-card/90 text-foreground hover:bg-card'
                }
            `}
        >
            <Box className="h-4 w-4" />
            {is3DMode ? t('mode2D') : t('mode3D')}
        </button>
    );
});

// ============================================================================
// 3D MODE CONTROLLER (uses useMap hook)
// ============================================================================
function TacticalModeController({ is3DMode }: { is3DMode: boolean }) {
    const map = useMap();

    useEffect(() => {
        if (!map) return;

        if (is3DMode) {
            map.setTilt(TACTICAL_3D_TILT);
            map.setHeading(TACTICAL_3D_HEADING);
        } else {
            map.setTilt(0);
            map.setHeading(0);
        }
    }, [map, is3DMode]);

    return null;
}

// ============================================================================
// FLY-TO CONTROLLER (listens for external camera commands)
// ============================================================================
function FlyToController({ target }: { target: { lat: number; lng: number } | null }) {
    const map = useMap();

    useEffect(() => {
        if (!map || !target) return;
        map.panTo(target);
        const currentZoom = map.getZoom() ?? 10;
        if (currentZoom < 15) {
            map.setZoom(17);
        }
    }, [map, target]);

    return null;
}

// ============================================================================
// MAP CONTENT (ZERO-FLICKER + TRACE + 3D)
// ============================================================================
const MapContent = memo(function MapContent({
    pins,
    selectedPinId,
    onPinClick,
    onInfoWindowClose,
    locale,
    is3DMode,
}: {
    pins: LiveMapPin[];
    selectedPinId: string | null;
    onPinClick: (pin: LiveMapPin) => void;
    onInfoWindowClose: () => void;
    locale: string;
    is3DMode: boolean;
}) {
    const map = useMap();
    const hasInitializedRef = useRef(false);

    // Trace hook: lazy-fetch tracking logs for selected user
    const { segments, isLoading: traceLoading, fetchTrace, clearTrace } = useUserTrace();

    // Fit bounds ONLY on initial load (ZERO-FLICKER)
    useEffect(() => {
        if (!map || pins.length === 0 || hasInitializedRef.current) return;

        const bounds = new google.maps.LatLngBounds();
        pins.forEach((pin) => {
            bounds.extend({ lat: pin.latitude, lng: pin.longitude });
        });

        map.fitBounds(bounds, 50);
        hasInitializedRef.current = true;
    }, [map, pins]);

    // Fetch trace when a pin is selected
    useEffect(() => {
        if (selectedPinId) {
            fetchTrace(selectedPinId);
        } else {
            clearTrace();
        }
    }, [selectedPinId, fetchTrace, clearTrace]);

    // Find selected pin
    const selectedPin = useMemo(() => {
        if (!selectedPinId) return null;
        return pins.find((p) => p.user_id === selectedPinId) ?? null;
    }, [pins, selectedPinId]);

    // Wrap onPinClick to add zoom behavior
    const handleMarkerClick = useCallback((pin: LiveMapPin) => {
        onPinClick(pin);

        // Smooth zoom to selected user
        if (map) {
            map.panTo({ lat: pin.latitude, lng: pin.longitude });
            const currentZoom = map.getZoom() ?? 10;
            if (currentZoom < 15) {
                map.setZoom(17);
            }
        }
    }, [onPinClick, map]);

    // Memoize markers
    const markers = useMemo(() => {
        return pins.map((pin) => (
            <UserMapMarker
                key={pin.user_id}
                pin={pin}
                isSelected={pin.user_id === selectedPinId}
                onClick={handleMarkerClick}
            />
        ));
    }, [pins, selectedPinId, handleMarkerClick]);

    return (
        <>
            {/* 3D Mode Controller */}
            <TacticalModeController is3DMode={is3DMode} />

            {/* Anti-Fraud Trace Polyline (below markers, zIndex=1) */}
            <UserTracePolyline segments={segments} />

            {/* User Markers */}
            {markers}

            {/* Trace loading indicator */}
            {traceLoading && selectedPinId && (
                <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 px-3 py-2 rounded-lg bg-card/90 backdrop-blur-sm border border-border shadow-lg">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">
                        Loading trace...
                    </span>
                </div>
            )}

            {/* Info Window for selected pin */}
            {selectedPin && (
                <InfoWindow
                    position={{ lat: selectedPin.latitude, lng: selectedPin.longitude }}
                    onCloseClick={onInfoWindowClose}
                    pixelOffset={[0, -45]}
                >
                    <UserInfoPopup pin={selectedPin} locale={locale} onClose={onInfoWindowClose} />
                </InfoWindow>
            )}
        </>
    );
});

// ============================================================================
// FALLBACK UI
// ============================================================================
function MapFallback({ message }: { message: string }) {
    const t = useTranslations('tracking');

    return (
        <div className="flex flex-col items-center justify-center h-[500px] rounded-xl border border-border bg-card/50">
            <MapPin className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
                {t('mapUnavailable')}
            </h3>
            <p className="text-sm text-muted-foreground">{message}</p>
        </div>
    );
}

// ============================================================================
// MAIN COMPONENT (MILITARY-GRADE)
// ============================================================================
export function LiveMapContainer({ clientId }: LiveMapContainerProps) {
    const locale = useLocale();
    const t = useTranslations('tracking');

    const { pins: allPins, isLoading, error, isConnected, stats: rawStats, refetch } = useLiveMapData(clientId);

    // ── Cascade Filter: scope + selected filters ──
    const { scope } = useScope();
    const { filters } = useFilters();
    const selectedTeamLeaderId = filters.teamLeaderId;
    const selectedFieldUserId = filters.fieldStaffId;

    // Build the set of user IDs visible in the current hierarchy scope
    const scopeUserIds = useMemo(() => {
        const ids = new Set<string>();
        if (scope?.managers) scope.managers.forEach(m => ids.add(m.id));
        if (scope?.team_leaders) scope.team_leaders.forEach(tl => ids.add(tl.team_leader_id));
        if (scope?.field_users) scope.field_users.forEach(fu => ids.add(fu.user_id));
        return ids;
    }, [scope?.managers, scope?.team_leaders, scope?.field_users]);

    // Filter pins by hierarchy scope, then by selected filters
    const pins = useMemo(() => {
        // 1. Scope filter — only users within hierarchy
        let result = scopeUserIds.size > 0
            ? allPins.filter(p => scopeUserIds.has(p.user_id))
            : allPins;

        // 2. Specific field user selected
        if (selectedFieldUserId) {
            result = result.filter(p => p.user_id === selectedFieldUserId);
        }

        // 3. Team leader selected → show TL + their field users
        if (selectedTeamLeaderId && !selectedFieldUserId) {
            const teamUserIds = new Set<string>();
            teamUserIds.add(selectedTeamLeaderId);
            if (scope?.field_users) {
                scope.field_users
                    .filter(fu => fu.team_leader_account_id === selectedTeamLeaderId)
                    .forEach(fu => teamUserIds.add(fu.user_id));
            }
            result = result.filter(p => teamUserIds.has(p.user_id));
        }

        return result;
    }, [allPins, scopeUserIds, selectedFieldUserId, selectedTeamLeaderId, scope?.field_users]);

    // Recalculate stats based on filtered pins
    const stats = useMemo(() => {
        const online = pins.filter(p => p.status === 'online').length;
        const offline = pins.filter(p => p.status === 'offline').length;
        const mockGps = pins.filter(p => p.is_mock).length;
        const locationDisabled = pins.filter(p => p.event_type === 'location_disabled').length;
        const checkedIn = pins.filter(p => p.status === 'online' && p.is_checked_in).length;
        const idle = pins.filter(p => p.status === 'online' && !p.is_checked_in).length;
        const lowBattery = pins.filter(p => {
            const level = p.battery_level;
            return level !== null && level > 0 && level < 20;
        }).length;
        return { total: pins.length, online, offline, mockGps, locationDisabled, lowBattery, checkedIn, idle };
    }, [pins]);

    // 🔍 DIAGNOSTIC: Log pin data for debugging
    useEffect(() => {
        if (pins.length > 0) {
            console.log('🗺️ [DIAGNOSTIC] LiveMap Pins:', pins.map(p => {
                const lastSeenDate = new Date(p.last_seen);
                const now = new Date();
                const diffMin = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
                return {
                    user: p.full_name,
                    lat: p.latitude,
                    lng: p.longitude,
                    status: p.status,
                    last_seen: p.last_seen,
                    last_seen_parsed: lastSeenDate.toISOString(),
                    now: now.toISOString(),
                    diff_minutes: Math.round(diffMin * 10) / 10,
                };
            }));
        }
    }, [pins]);

    // Track selected pin by ID (not object) for stable reference
    const [selectedPinId, setSelectedPinId] = useState<string | null>(null);

    // Fly-to target for external camera control (from ActiveUsersList)
    const [flyToTarget, setFlyToTarget] = useState<{ lat: number; lng: number } | null>(null);

    // 3D Tactical Mode state
    const [is3DMode, setIs3DMode] = useState(false);

    // Get API key & Map ID from environment
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || 'live-tracking-map';

    // Stable callbacks - zoom to user on click
    const handlePinClick = useCallback((pin: LiveMapPin) => {
        setSelectedPinId(pin.user_id);
    }, []);

    const handleInfoWindowClose = useCallback(() => {
        setSelectedPinId(null);
    }, []);

    // Fly to user from ActiveUsersList
    const handleUserListClick = useCallback((userId: string) => {
        const pin = pins.find((p) => p.user_id === userId);
        if (!pin) return;
        setSelectedPinId(userId);
        setFlyToTarget({ lat: pin.latitude, lng: pin.longitude });
    }, [pins]);

    const handleToggle3D = useCallback(() => {
        setIs3DMode((prev) => !prev);
    }, []);

    // Check for API key
    if (!apiKey) {
        return <MapFallback message={t('apiKeyMissing')} />;
    }

    // Check for error
    if (error) {
        return <MapFallback message={error.message} />;
    }

    return (
        <div className="space-y-4">
            {/* Stats Bar */}
            <StatsBar
                stats={stats}
                isConnected={isConnected}
                onRefresh={refetch}
                isLoading={isLoading}
                locale={locale}
            />

            {/* Map Container with smooth 3D transition */}
            <div
                className="relative h-[600px] rounded-xl overflow-hidden border border-border"
                style={{ transition: 'all 0.5s ease-in-out' }}
            >
                {/* Loading overlay */}
                {isLoading && pins.length === 0 && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/80 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground">
                                {t('loadingLocations')}
                            </span>
                        </div>
                    </div>
                )}

                {/* 3D Toggle Button (Floating) */}
                <TacticalToggle is3DMode={is3DMode} onToggle={handleToggle3D} />

                <APIProvider apiKey={apiKey}>
                    <Map
                        defaultCenter={DEFAULT_MAP_CENTER}
                        defaultZoom={DEFAULT_MAP_ZOOM}
                        mapId={mapId}
                        gestureHandling="greedy"
                        disableDefaultUI={false}
                        tilt={is3DMode ? TACTICAL_3D_TILT : 0}
                        heading={is3DMode ? TACTICAL_3D_HEADING : 0}
                        style={{ width: '100%', height: '100%' }}
                    >
                        <MapContent
                            pins={pins}
                            selectedPinId={selectedPinId}
                            onPinClick={handlePinClick}
                            onInfoWindowClose={handleInfoWindowClose}
                            locale={locale}
                            is3DMode={is3DMode}
                        />
                        <FlyToController target={flyToTarget} />
                    </Map>
                </APIProvider>
            </div>

            {/* Active Users List */}
            <ActiveUsersList
                pins={pins}
                selectedPinId={selectedPinId}
                onUserClick={handleUserListClick}
            />

            {/* Empty state */}
            {!isLoading && pins.length === 0 && (
                <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                        {t('noLocations')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {t('noActiveUsers')}
                    </p>
                </div>
            )}
        </div>
    );
}
