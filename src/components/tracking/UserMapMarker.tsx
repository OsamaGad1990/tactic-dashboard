'use client';

import { ANIMATION_DURATIONS, LOCATION_DISABLED_WARNING_ENABLED, MOCK_GPS_WARNING_ENABLED } from '@/lib/constants/tracking-constants';
import type { LiveMapPin } from '@/lib/types/tracking-types';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

interface UserMapMarkerProps {
    pin: LiveMapPin;
    isSelected: boolean;
    onClick: (pin: LiveMapPin) => void;
}

const FALLBACK_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

// ============================================================================
// MEMOIZED USER MAP MARKER (Inline styles for Google Maps overlay compatibility)
// ============================================================================
export const UserMapMarker = memo(
    function UserMapMarker({ pin, isSelected, onClick }: UserMapMarkerProps) {
        // Track image source with fallback
        const [imgSrc, setImgSrc] = useState<string>(
            () => pin.avatar_url || FALLBACK_AVATAR
        );

        // Sync when avatar URL changes
        useEffect(() => {
            setImgSrc(pin.avatar_url || FALLBACK_AVATAR);
        }, [pin.avatar_url]);

        // Memoize position
        const position = useMemo(() => ({
            lat: pin.latitude,
            lng: pin.longitude,
        }), [pin.latitude, pin.longitude]);

        const isOnline = pin.status === 'online';
        const showMockWarning = MOCK_GPS_WARNING_ENABLED && pin.is_mock;
        const showLocationDisabled = LOCATION_DISABLED_WARNING_ENABLED && pin.event_type === 'location_disabled';

        // Situation Room color logic:
        // 🔴 RED: location disabled OR online but idle (no active visit)
        // 🟢 GREEN: checked in (active visit)
        // ⚫ GRAY: offline
        const borderColor = showLocationDisabled
            ? '#ef4444'
            : isOnline
                ? pin.is_checked_in ? '#22c55e' : '#ef4444'
                : '#9ca3af';
        const firstName = pin.full_name?.split(' ')[0] || '?';

        // Hard fallback on error
        const handleAvatarError = useCallback(() => {
            setImgSrc(FALLBACK_AVATAR);
        }, []);

        return (
            <AdvancedMarker
                position={position}
                onClick={() => onClick(pin)}
                zIndex={isSelected ? 1000 : isOnline ? 100 : 10}
            >
                {/* Using inline styles because Tailwind CSS doesn't apply inside Google Maps overlay DOM */}
                <div
                    style={{
                        position: 'relative',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        transform: isSelected ? 'scale(1.25)' : 'scale(1)',
                        transition: 'transform 0.2s ease',
                    }}
                >
                    {/* Pulse ring — matches border color (green=in visit, red=idle) */}
                    {isOnline && (
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                borderRadius: '50%',
                                backgroundColor: borderColor === '#22c55e'
                                    ? 'rgba(34, 197, 94, 0.3)'
                                    : 'rgba(239, 68, 68, 0.35)',
                                animation: `ping ${ANIMATION_DURATIONS.PULSE}ms cubic-bezier(0,0,0.2,1) infinite`,
                                width: 44,
                                height: 44,
                                marginLeft: -2,
                                marginTop: -2,
                            }}
                        />
                    )}

                    {/* Avatar container */}
                    <div
                        style={{
                            position: 'relative',
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            border: `3px solid ${borderColor}`,
                            backgroundColor: '#1e293b',
                            boxShadow: isSelected
                                ? `0 0 0 4px rgba(59,130,246,0.5), 0 4px 12px rgba(0,0,0,0.4)`
                                : '0 2px 8px rgba(0,0,0,0.4)',
                            overflow: 'hidden',
                            filter: !isOnline ? 'grayscale(1)' : 'none',
                        }}
                    >
                        <img
                            src={imgSrc}
                            alt={pin.full_name}
                            style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                display: 'block',
                            }}
                            loading="eager"
                            referrerPolicy="no-referrer"
                            onError={handleAvatarError}
                        />
                    </div>

                    {/* Status dot */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 14,
                            right: -2,
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            border: '2px solid white',
                            backgroundColor: borderColor,
                        }}
                    />

                    {/* Mock GPS Warning */}
                    {showMockWarning && (
                        <div
                            style={{
                                position: 'absolute',
                                top: -2,
                                left: -2,
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                backgroundColor: '#ef4444',
                                border: '2px solid white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: 10,
                                fontWeight: 'bold',
                            }}
                            title="Fake GPS Detected"
                        >
                            ⚠
                        </div>
                    )}

                    {/* Location Disabled Warning — bold red badge */}
                    {showLocationDisabled && (
                        <div
                            style={{
                                position: 'absolute',
                                top: -4,
                                right: showMockWarning ? 14 : -4,
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                backgroundColor: '#ef4444',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                                border: '2px solid white',
                                zIndex: 10,
                                boxShadow: '0 0 6px rgba(239,68,68,0.6)',
                            }}
                            title="Location Services Disabled"
                        >
                            ⛔
                        </div>
                    )}

                    {/* Name label */}
                    <div
                        style={{
                            marginTop: 2,
                            padding: '1px 6px',
                            borderRadius: 4,
                            backgroundColor: 'rgba(0,0,0,0.75)',
                            color: 'white',
                            fontSize: 10,
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            maxWidth: 80,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {firstName}
                    </div>
                </div>
            </AdvancedMarker>
        );
    },
    // Custom comparison: only re-render if relevant pin data changed
    (prevProps, nextProps) => {
        if (prevProps.isSelected !== nextProps.isSelected) return false;
        if (prevProps.pin === nextProps.pin) return true;

        const prev = prevProps.pin;
        const next = nextProps.pin;
        return (
            prev.user_id === next.user_id &&
            prev.latitude === next.latitude &&
            prev.longitude === next.longitude &&
            prev.status === next.status &&
            prev.is_mock === next.is_mock &&
            prev.event_type === next.event_type &&
            prev.is_checked_in === next.is_checked_in &&
            prev.avatar_url === next.avatar_url
        );
    }
);

// ============================================================================
// CLUSTER MARKER
// ============================================================================
interface ClusterMarkerProps {
    count: number;
    position: google.maps.LatLngLiteral;
    onClick: () => void;
}

export const ClusterMarker = memo(function ClusterMarker({ count, position, onClick }: ClusterMarkerProps) {
    const size = count < 10 ? 40 : count < 50 ? 50 : 60;

    return (
        <AdvancedMarker position={position} onClick={onClick}>
            <div
                style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'white',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                    border: '3px solid white',
                    cursor: 'pointer',
                    fontSize: 14,
                }}
            >
                {count > 99 ? '99+' : count}
            </div>
        </AdvancedMarker>
    );
});
