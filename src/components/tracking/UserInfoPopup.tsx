'use client';

import { BATTERY_THRESHOLDS, MOCK_GPS_WARNING_ENABLED } from '@/lib/constants/tracking-constants';
import { formatRelativeTime } from '@/lib/hooks/useLiveMapData';
import type { LiveMapPin } from '@/lib/types/tracking-types';
import { getFullAvatarUrl } from '@/utils/supabase-images';
import {
    AlertTriangle,
    Battery,
    BatteryFull,
    BatteryLow,
    BatteryMedium,
    Clock,
    Plug,
    User,
    X,
} from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';

interface UserInfoPopupProps {
    pin: LiveMapPin;
    locale: string;
    onClose?: () => void;
}

// ============================================================================
// SMART BATTERY LOGIC: handles emulator edge cases
// ============================================================================
function getBatteryDisplay(level: number | null, isMock: boolean): {
    icon: React.ReactNode;
    text: string;
    colorClass: string;
} {
    // Null or 0 with non-mock → likely emulator/charging
    if (level === null || (level === 0 && !isMock)) {
        return {
            icon: <Plug className="h-4 w-4 text-muted-foreground" />,
            text: 'N/A',
            colorClass: 'text-muted-foreground',
        };
    }

    // Critical: strictly between 1-20%
    if (level > 0 && level < BATTERY_THRESHOLDS.LOW) {
        return {
            icon: <BatteryLow className="h-4 w-4 text-red-500" />,
            text: `${level}%`,
            colorClass: 'text-red-500',
        };
    }

    // Warning: 20-50%
    if (level < BATTERY_THRESHOLDS.MEDIUM) {
        return {
            icon: <BatteryMedium className="h-4 w-4 text-yellow-500" />,
            text: `${level}%`,
            colorClass: 'text-yellow-500',
        };
    }

    // Good: 50%+
    return {
        icon: <BatteryFull className="h-4 w-4 text-green-500" />,
        text: `${level}%`,
        colorClass: 'text-green-500',
    };
}

// ============================================================================
// USER INFO POPUP (Smart Avatar + Smart Battery)
// ============================================================================
export const UserInfoPopup = memo(function UserInfoPopup({ pin, locale, onClose }: UserInfoPopupProps) {
    const isArabic = locale === 'ar';
    const roleLabel = isArabic ? pin.role_label_ar : pin.role_label_en;
    const lastSeenText = formatRelativeTime(pin.last_seen, locale);
    const [avatarError, setAvatarError] = useState(false);

    // Resolve avatar URL
    const resolvedAvatarUrl = useMemo(
        () => getFullAvatarUrl(pin.avatar_url),
        [pin.avatar_url]
    );

    const showAvatar = resolvedAvatarUrl && !avatarError;

    const handleAvatarError = useCallback(() => {
        setAvatarError(true);
    }, []);

    // Smart battery display
    const battery = getBatteryDisplay(pin.battery_level, pin.is_mock);

    return (
        <div
            className="min-w-[260px] rounded-xl bg-card border border-border shadow-xl overflow-hidden"
            dir={isArabic ? 'rtl' : 'ltr'}
        >
            {/* Close Button Header */}
            {onClose && (
                <div className="flex justify-end px-2 pt-2">
                    <button
                        onClick={onClose}
                        className="flex items-center justify-center w-7 h-7 rounded-full 
                            bg-muted/80 hover:bg-destructive/20 
                            text-foreground hover:text-destructive
                            transition-colors duration-150"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Content */}
            <div className="px-4 pb-4 pt-1 space-y-3">
                {/* Header with Avatar */}
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative">
                        {showAvatar ? (
                            <img
                                src={resolvedAvatarUrl}
                                alt={pin.full_name}
                                className={`h-12 w-12 rounded-full object-cover border-2 ${pin.status === 'online' ? 'border-green-500' : 'border-gray-400 grayscale'
                                    }`}
                                loading="eager"
                                referrerPolicy="no-referrer"
                                onError={handleAvatarError}
                            />
                        ) : (
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 border-2 ${pin.status === 'online' ? 'border-green-500' : 'border-gray-400'
                                }`}>
                                <User className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                            </div>
                        )}

                        {/* Status indicator */}
                        <span className={`absolute -bottom-0.5 -${isArabic ? 'left' : 'right'}-0.5 block h-3.5 w-3.5 rounded-full border-2 border-card ${pin.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                            }`} />
                    </div>

                    {/* Name & Role */}
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate">{pin.full_name}</h4>
                        <p className="text-sm text-muted-foreground">{roleLabel || pin.role}</p>
                    </div>
                </div>

                {/* Mock GPS Warning */}
                {MOCK_GPS_WARNING_ENABLED && pin.is_mock && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm font-medium">
                            {isArabic ? 'موقع GPS مزيف!' : 'Fake GPS Detected!'}
                        </span>
                    </div>
                )}

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Battery (Smart Logic) */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                        {battery.icon}
                        <span className={`text-sm font-medium ${battery.colorClass}`}>
                            {battery.text}
                        </span>
                    </div>

                    {/* Last Seen */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{lastSeenText}</span>
                    </div>
                </div>

                {/* Status Badge */}
                <div className={`text-center py-1.5 rounded-lg text-sm font-medium ${pin.status === 'online'
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                    : 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
                    }`}>
                    {pin.status === 'online'
                        ? (isArabic ? 'متصل الآن' : 'Online Now')
                        : (isArabic ? `🔴 ${lastSeenText}` : `🔴 Offline - ${lastSeenText}`)
                    }
                </div>
            </div>
        </div>
    );
});
