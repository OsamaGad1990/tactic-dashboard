// ============================================================================
// DYNAMIC DASHBOARD — Premium Ops Metrics Dashboard
// Reads: useDashboardData (FilterContext + ScopeContext → RPC)
// Layout: Filter Bar → Ring Charts → Top Performers → Fraud Leaderboard
// Theme:  Dark/Gold Glassmorphism with animated Ring Charts
// ============================================================================
'use client';

import React from 'react';

import {
    Award,
    AlertTriangle,
} from 'lucide-react';
import { GlobalFilterBar } from '@/components/filters/GlobalFilterBar';
import { ScopeProvider } from '@/lib/context/ScopeContext';
import { useFilters } from '@/lib/context/FilterContext';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import { createClient } from '@/lib/supabase/client';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { FraudLeaderboard } from './FraudLeaderboard';
import { cn } from '@/lib/utils';
import { useLocale } from 'next-intl';

// ============================================================================
// TYPES
// ============================================================================
interface DynamicDashboardProps {
    userAccountId: string;
    clientId: string;
    divisionId?: string | null;
    enabledFeatures?: string[];
    hideFilterBar?: boolean;
}

// ============================================================================
// TOP PERFORMERS LIST
// ============================================================================
function TopPerformersCard({
    performers,
    avatarMap = {},
}: {
    performers: Array<{
        user_id: string;
        name_en: string;
        name_ar: string;
        avatar_url: string | null;
        role: string | null;
        completed_visits: number;
        completion_rate: number;
    }>;
    avatarMap?: Record<string, string>;
}) {
    const locale = useLocale();
    const isAr = locale === 'ar';

    if (!performers || performers.length === 0) return null;

    return (
        <div className="relative overflow-hidden rounded-xl border border-amber-400/20 bg-card/30 backdrop-blur-md p-5 shadow-lg shadow-amber-400/10">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 via-transparent to-transparent" />
            <div className="relative">
                <div className="flex items-center gap-2 pb-4">
                    <Award className="h-5 w-5 text-amber-400" />
                    <h3 className="text-lg font-semibold text-foreground">
                        {isAr ? 'أفضل الأداء' : 'Top Performers'}
                    </h3>
                </div>
                <div className="space-y-3">
                    {performers.map((p, i) => {
                        const displayName = isAr ? (p.name_ar || p.name_en) : (p.name_en || p.name_ar);
                        const initials = displayName.charAt(0).toUpperCase();
                        // Use signed URL from avatarMap (RLS-protected bucket)
                        const avatarSrc = avatarMap[p.user_id] || null;

                        return (
                            <div
                                key={p.user_id}
                                className="flex items-center gap-3 rounded-lg bg-muted/20 p-3 transition-colors hover:bg-muted/30"
                            >
                                {/* Rank Badge */}
                                <div
                                    className={cn(
                                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                                        i === 0 && 'bg-amber-400/20 text-amber-400',
                                        i === 1 && 'bg-slate-300/20 text-slate-300',
                                        i === 2 && 'bg-amber-600/20 text-amber-600',
                                        i > 2 && 'bg-muted text-muted-foreground'
                                    )}
                                >
                                    {i + 1}
                                </div>

                                {/* Avatar / Initials */}
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary overflow-hidden">
                                    {avatarSrc ? (
                                        <img
                                            src={avatarSrc}
                                            alt={displayName}
                                            className="h-9 w-9 rounded-full object-cover"
                                            onError={(e) => {
                                                // Fallback to initials if image fails
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                (e.target as HTMLImageElement).parentElement!.textContent = initials;
                                            }}
                                        />
                                    ) : (
                                        initials
                                    )}
                                </div>

                                {/* Name + Role */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                        {displayName}
                                    </p>
                                    {p.role && (
                                        <p className="text-xs text-muted-foreground capitalize">
                                            {p.role}
                                        </p>
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-bold text-primary">
                                        {p.completion_rate}%
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {p.completed_visits} {isAr ? 'زيارة' : 'visits'}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// INNER COMPONENT (uses ScopeContext — must be INSIDE ScopeProvider)
// ============================================================================
function DynamicDashboardInner({
    userAccountId,
    clientId,
    hideFilterBar,
}: {
    userAccountId: string;
    clientId: string;
    hideFilterBar: boolean;
}) {
    const { data, isLoading } = useDashboardData();
    const top_performers = data?.top_performers;
    const fraud_suspects = data?.fraud_suspects;

    // ========================================================================
    // SIGNED AVATAR URLs (bucket has RLS → need createSignedUrl)
    // ========================================================================
    const [avatarMap, setAvatarMap] = React.useState<Record<string, string>>({});
    const supabase = React.useMemo(() => createClient(), []);

    React.useEffect(() => {
        const allUsers = [
            ...(top_performers ?? []),
            ...(fraud_suspects ?? []),
        ];
        if (allUsers.length === 0) return;

        let cancelled = false;

        async function signAvatars() {
            const map: Record<string, string> = {};

            await Promise.allSettled(
                allUsers.map(async (p) => {
                    // Try avatar_url first, then fall back to user_id as the path
                    const rawPath = p.avatar_url || p.user_id;
                    if (!rawPath) return;

                    // Strip bucket prefix if present
                    const cleanPath = rawPath.startsWith('avatars/')
                        ? rawPath.replace('avatars/', '')
                        : rawPath;

                    const { data: signed, error } = await supabase.storage
                        .from('avatars')
                        .createSignedUrl(cleanPath, 3600); // 1 hour

                    if (!error && signed?.signedUrl) {
                        map[p.user_id] = signed.signedUrl;
                    }
                })
            );

            if (!cancelled) {
                setAvatarMap(map);
            }
        }

        signAvatars();
        return () => { cancelled = true; };
    }, [top_performers, fraud_suspects, supabase]);

    return (
        <div className="space-y-6">
            {/* Filter Bar (can be hidden when rendered externally) */}
            {!hideFilterBar && (
                <GlobalFilterBar
                    userAccountId={userAccountId}
                    clientId={clientId}
                />
            )}

            {/* Ring Charts — Self-Contained, reads useDashboardData internally */}
            <AnalyticsDashboard />

            {/* Top Performers */}
            {!isLoading && top_performers && top_performers.length > 0 && (
                <section>
                    <TopPerformersCard performers={top_performers} avatarMap={avatarMap} />
                </section>
            )}

            {/* Fraud Leaderboard (always visible — shows safe/danger state) */}
            {!isLoading && (
                <section>
                    <FraudLeaderboard suspects={fraud_suspects ?? []} avatarMap={avatarMap} />
                </section>
            )}
        </div>
    );
}

// ============================================================================
// EXPORTED COMPONENT (provides ScopeContext, then renders inner)
// ============================================================================
export function DynamicDashboard({
    userAccountId,
    clientId,
    divisionId,
    enabledFeatures = [],
    hideFilterBar = false,
}: DynamicDashboardProps) {
    const { filters } = useFilters();

    return (
        <ScopeProvider
            clientId={clientId}
            divisionId={divisionId}
            managerAccountId={userAccountId}
            dateFrom={filters.dateRange.from}
            dateTo={filters.dateRange.to}
        >
            <DynamicDashboardInner
                userAccountId={userAccountId}
                clientId={clientId}
                hideFilterBar={hideFilterBar}
            />
        </ScopeProvider>
    );
}
