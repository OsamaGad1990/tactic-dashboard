'use client';

import { formatRelativeTime } from '@/lib/hooks/useLiveMapData';
import type { LiveMapPin } from '@/lib/types/tracking-types';
import { useLocale, useTranslations } from 'next-intl';
import { memo, useMemo } from 'react';
import { Users } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================
interface ActiveUsersListProps {
    pins: LiveMapPin[];
    selectedPinId: string | null;
    onUserClick: (userId: string) => void;
}

const FALLBACK_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

// ============================================================================
// SINGLE USER ROW (Memoized)
// ============================================================================
const UserRow = memo(function UserRow({
    pin,
    isSelected,
    onClick,
    locale,
}: {
    pin: LiveMapPin;
    isSelected: boolean;
    onClick: () => void;
    locale: string;
}) {
    const isArabic = locale === 'ar';
    const isCheckedIn = pin.is_checked_in;
    const borderColor = '#22c55e'; // Always green — this list only shows online users
    const lastSeen = formatRelativeTime(pin.last_seen, locale);
    const roleName = isArabic ? pin.role_label_ar : pin.role_label_en;

    return (
        <button
            onClick={onClick}
            dir={isArabic ? 'rtl' : 'ltr'}
            className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                transition-all duration-200 cursor-pointer
                ${isSelected
                    ? 'bg-primary/15 ring-1 ring-primary/40 shadow-sm'
                    : 'hover:bg-muted/60'
                }
            `}
        >
            {/* Avatar with status ring */}
            <div className="relative flex-shrink-0">
                <div
                    className="h-9 w-9 rounded-full overflow-hidden border-2"
                    style={{ borderColor }}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={pin.avatar_url || FALLBACK_AVATAR}
                        alt={pin.full_name}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = FALLBACK_AVATAR;
                        }}
                    />
                </div>
                {/* Pulse dot */}
                <div
                    className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background animate-pulse"
                    style={{ backgroundColor: borderColor }}
                />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 text-start">
                <p className="text-sm font-medium text-foreground truncate">
                    {pin.full_name}
                </p>
                <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground truncate">
                        {roleName}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60">•</span>
                    <span className="text-[10px] text-muted-foreground/60">
                        {lastSeen}
                    </span>
                </div>
            </div>

            {/* Battery indicator */}
            {pin.battery_level !== null && pin.battery_level > 0 && (
                <div className="flex-shrink-0 text-[10px] font-medium text-muted-foreground">
                    {pin.battery_level}%
                </div>
            )}
        </button>
    );
});

// ============================================================================
// ACTIVE USERS LIST
// ============================================================================
export const ActiveUsersList = memo(function ActiveUsersList({
    pins,
    selectedPinId,
    onUserClick,
}: ActiveUsersListProps) {
    const locale = useLocale();
    const t = useTranslations('tracking');
    const isArabic = locale === 'ar';

    // Filter to online users, sorted: checked-in first, then by name
    const onlineUsers = useMemo(() => {
        return pins
            .filter((p) => p.status === 'online')
            .sort((a, b) => {
                // Checked-in first
                if (a.is_checked_in && !b.is_checked_in) return -1;
                if (!a.is_checked_in && b.is_checked_in) return 1;
                // Then alphabetical
                return a.full_name.localeCompare(b.full_name);
            });
    }, [pins]);

    return (
        <div
            className="rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden"
            dir={isArabic ? 'rtl' : 'ltr'}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/80">
                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">
                        {t('activeDrivers')}
                    </h3>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                        {onlineUsers.length}
                    </span>
                </div>
            </div>

            {/* List */}
            {onlineUsers.length > 0 ? (
                <div className="max-h-[280px] overflow-y-auto p-2 space-y-0.5">
                    {onlineUsers.map((pin) => (
                        <UserRow
                            key={pin.user_id}
                            pin={pin}
                            isSelected={pin.user_id === selectedPinId}
                            onClick={() => onUserClick(pin.user_id)}
                            locale={locale}
                        />
                    ))}
                </div>
            ) : (
                <div className="py-8 text-center">
                    <Users className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">
                        {t('noOnlineDrivers')}
                    </p>
                </div>
            )}
        </div>
    );
});
