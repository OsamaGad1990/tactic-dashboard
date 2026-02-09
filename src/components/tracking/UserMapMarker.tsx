'use client';

import { ANIMATION_DURATIONS, MOCK_GPS_WARNING_ENABLED } from '@/lib/constants/tracking-constants';
import type { LiveMapPin } from '@/lib/types/tracking-types';
import { getFullAvatarUrl } from '@/utils/supabase-images';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { AlertTriangle, User } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';

interface UserMapMarkerProps {
    pin: LiveMapPin;
    isSelected: boolean;
    onClick: (pin: LiveMapPin) => void;
}

// ============================================================================
// MEMOIZED USER MAP MARKER (Prevents re-render if props unchanged)
// ============================================================================
export const UserMapMarker = memo(
    function UserMapMarker({ pin, isSelected, onClick }: UserMapMarkerProps) {
        const FALLBACK_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
        const [imgSrc, setImgSrc] = useState<string | null>(null);

        // Resolve avatar URL (relative path → full Supabase URL)
        const resolvedAvatarUrl = useMemo(
            () => getFullAvatarUrl(pin.avatar_url),
            [pin.avatar_url]
        );

        // Set initial image src
        useMemo(() => {
            setImgSrc(resolvedAvatarUrl);
        }, [resolvedAvatarUrl]);


        // Memoize position to prevent recalculation
        const position = useMemo(() => ({
            lat: pin.latitude,
            lng: pin.longitude,
        }), [pin.latitude, pin.longitude]);

        const isOnline = pin.status === 'online';
        const showMockWarning = MOCK_GPS_WARNING_ENABLED && pin.is_mock;

        // Hard fallback: swap to CDN icon on error
        const handleAvatarError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
            e.currentTarget.src = FALLBACK_AVATAR;
            setImgSrc(FALLBACK_AVATAR);
        }, []);

        return (
            <AdvancedMarker
                position={position}
                onClick={() => onClick(pin)}
                zIndex={isSelected ? 1000 : isOnline ? 100 : 10}
            >
                <div className="relative cursor-pointer transition-transform hover:scale-110">
                    {/* Pulse animation for online users */}
                    {isOnline && (
                        <div
                            className="absolute inset-0 rounded-full bg-green-500/30 animate-ping"
                            style={{ animationDuration: `${ANIMATION_DURATIONS.PULSE}ms` }}
                        />
                    )}

                    {/* Main avatar container */}
                    <div
                        className={`
                            relative w-10 h-10 rounded-full border-3 
                            ${isOnline ? 'border-green-500' : 'border-gray-400'}
                            ${!isOnline ? 'grayscale' : ''}
                            ${isSelected ? 'ring-4 ring-primary/50 scale-125' : ''}
                            transition-all duration-200
                            shadow-lg
                        `}
                    >
                        <img
                            src={imgSrc || FALLBACK_AVATAR}
                            alt={pin.full_name}
                            className="w-full h-full rounded-full object-cover"
                            loading="eager"
                            referrerPolicy="no-referrer"
                            onError={handleAvatarError}
                        />
                    </div>

                    {/* Status dot */}
                    <div
                        className={`
                            absolute -bottom-0.5 -right-0.5 
                            w-3.5 h-3.5 rounded-full border-2 border-white
                            ${isOnline ? 'bg-green-500' : 'bg-gray-400'}
                        `}
                    />

                    {/* Mock GPS Warning Badge */}
                    {showMockWarning && (
                        <div
                            className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center border-2 border-white"
                            title="Fake GPS Detected"
                        >
                            <AlertTriangle className="h-3 w-3 text-white" />
                        </div>
                    )}
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
                className="flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold shadow-lg border-3 border-white cursor-pointer hover:scale-110 transition-transform"
                style={{ width: size, height: size }}
            >
                {count > 99 ? '99+' : count}
            </div>
        </AdvancedMarker>
    );
});
