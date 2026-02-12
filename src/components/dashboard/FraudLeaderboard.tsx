// ============================================================================
// FRAUD LEADERBOARD — "المتلاعبين" Dashboard Section
// Always visible: Green "Safe" state when clean, Red "Danger" when suspects exist
// Mirrors TopPerformersCard pattern — lowest trust = #1 suspect
// ============================================================================
'use client';

import { cn } from '@/lib/utils';
import { ShieldAlert, ShieldCheck, AlertTriangle, Unlock, CheckCircle } from 'lucide-react';
import { useLocale } from 'next-intl';
import type { FraudSuspect } from '@/lib/types/dashboard';

// ============================================================================
// SAFE STATE — Green "System Secure" Card
// ============================================================================
function SafeStateCard({ isAr }: { isAr: boolean }) {
    return (
        <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-card/30 backdrop-blur-md p-6 shadow-lg shadow-emerald-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent" />
            <div className="relative flex flex-col items-center justify-center gap-3 py-4">
                {/* Large green shield */}
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 shadow-lg shadow-emerald-500/5">
                    <CheckCircle className="h-8 w-8 text-emerald-400" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-foreground">
                    {isAr ? 'النظام آمن' : 'System Secure'}
                </h3>

                {/* Subtitle */}
                <p className="text-sm text-emerald-400/80 font-medium text-center max-w-xs">
                    {isAr
                        ? 'لا يوجد متلاعبين حالياً — جميع المستخدمين بنسبة ثقة 100%'
                        : 'All active users have a Trust Score of 100%'}
                </p>

                {/* Active pulse */}
                <span className="flex h-2.5 w-2.5 mt-1">
                    <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
            </div>
        </div>
    );
}

// ============================================================================
// COMPONENT: FraudLeaderboard (Always Visible)
// ============================================================================
export function FraudLeaderboard({
    suspects,
    avatarMap = {},
}: {
    suspects: FraudSuspect[];
    avatarMap?: Record<string, string>;
}) {
    const locale = useLocale();
    const isAr = locale === 'ar';

    const hasSuspects = suspects && suspects.length > 0;

    // ── Header (shared between both states) ──────────────────────
    const header = (
        <div className="flex items-center gap-2 pb-4">
            {hasSuspects
                ? <ShieldAlert className="h-5 w-5 text-red-400" />
                : <ShieldCheck className="h-5 w-5 text-emerald-400" />
            }
            <h3 className="text-lg font-semibold text-foreground">
                {isAr ? 'المتلاعبين' : 'Fraud Suspects'}
            </h3>
            {hasSuspects && (
                <span className="ml-auto text-xs text-red-400/60 font-medium">
                    {isAr ? 'أقل ثقة = أعلى ترتيب' : 'Lowest Trust = #1'}
                </span>
            )}
        </div>
    );

    // ── Safe State ───────────────────────────────────────────────
    if (!hasSuspects) {
        return (
            <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-card/30 backdrop-blur-md p-5 shadow-lg shadow-emerald-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent" />
                <div className="relative">
                    {header}
                    <div className="flex flex-col items-center justify-center gap-3 py-6">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 shadow-lg shadow-emerald-500/5">
                            <CheckCircle className="h-8 w-8 text-emerald-400" />
                        </div>
                        <p className="text-base font-semibold text-emerald-400">
                            {isAr ? 'النظام آمن' : 'System Secure'}
                        </p>
                        <p className="text-sm text-muted-foreground text-center max-w-xs">
                            {isAr
                                ? 'لا يوجد متلاعبين حالياً — جميع المستخدمين بنسبة ثقة 100%'
                                : 'All active users have a Trust Score of 100%'}
                        </p>
                        <span className="relative flex h-2.5 w-2.5 mt-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // ── Danger State (existing red list) ─────────────────────────
    return (
        <div className="relative overflow-hidden rounded-xl border border-red-500/20 bg-card/30 backdrop-blur-md p-5 shadow-lg shadow-red-500/10">
            {/* Red gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-transparent" />

            <div className="relative">
                {header}

                {/* List */}
                <div className="space-y-3">
                    {suspects.map((s, i) => {
                        const displayName = isAr
                            ? (s.name_ar || s.name_en)
                            : (s.name_en || s.name_ar);
                        const initials = displayName.charAt(0).toUpperCase();
                        const avatarSrc = avatarMap[s.user_id] || null;

                        // Trust color: < 50% = red, 50-80% = amber, 80-99% = yellow
                        const trustColor =
                            s.avg_trust_score < 50
                                ? 'text-red-400'
                                : s.avg_trust_score < 80
                                    ? 'text-amber-400'
                                    : 'text-yellow-400';

                        return (
                            <div
                                key={s.user_id}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg p-3 transition-colors',
                                    s.is_fraud_locked
                                        ? 'bg-red-500/10 hover:bg-red-500/15 ring-1 ring-red-500/20'
                                        : 'bg-muted/20 hover:bg-muted/30'
                                )}
                            >
                                {/* Rank Badge */}
                                <div
                                    className={cn(
                                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                                        i === 0 && 'bg-red-500/20 text-red-400',
                                        i === 1 && 'bg-red-400/15 text-red-300',
                                        i === 2 && 'bg-orange-500/15 text-orange-400',
                                        i > 2 && 'bg-muted text-muted-foreground'
                                    )}
                                >
                                    {i + 1}
                                </div>

                                {/* Avatar / Initials */}
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-sm font-bold text-red-400 overflow-hidden">
                                    {avatarSrc ? (
                                        <img
                                            src={avatarSrc}
                                            alt={displayName}
                                            className="h-9 w-9 rounded-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                (e.target as HTMLImageElement).parentElement!.textContent = initials;
                                            }}
                                        />
                                    ) : (
                                        initials
                                    )}
                                </div>

                                {/* Name + Role + Fraud Lock Status */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {displayName}
                                        </p>
                                        {s.is_fraud_locked && (
                                            <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {s.role && (
                                            <p className="text-xs text-muted-foreground capitalize">
                                                {s.role}
                                            </p>
                                        )}
                                        {/* Fraud unlock count badge */}
                                        {s.fraud_unlock_count > 0 && (
                                            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                                                <Unlock className="h-2.5 w-2.5" />
                                                {s.fraud_unlock_count}×
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Trust Score + Visit Count */}
                                <div className="text-right shrink-0">
                                    <p className={cn('text-sm font-bold', trustColor)}>
                                        {s.avg_trust_score}%
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {s.total_visits} {isAr ? 'زيارة' : 'visits'}
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
