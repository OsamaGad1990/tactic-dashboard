'use client';

import { releaseFraudUser, type FraudLockedUser } from '@/lib/actions/fraud-actions';
import {
    ShieldAlert,
    ShieldCheck,
    Unlock,
    AlertTriangle,
    Loader2,
    UserCircle,
    Search,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ── Role Config ──
const ROLE_LABELS: Record<string, { en: string; ar: string; color: string }> = {
    promoter: { en: 'Promoter', ar: 'مروّج', color: 'text-blue-500' },
    mch: { en: 'Merchandiser', ar: 'ميرتشندايزر', color: 'text-emerald-500' },
    team_leader: { en: 'Team Leader', ar: 'قائد فريق', color: 'text-amber-500' },
    promoplus: { en: 'Sales Promoter', ar: 'مروج بيعي', color: 'text-rose-500' },
};

// ── Reason translations ──
const REASON_LABELS: Record<string, { en: string; ar: string }> = {
    mock_location: { en: 'Fake GPS', ar: 'موقع مزيّف' },
    screenshot_detected: { en: 'Screenshot', ar: 'تصوير شاشة' },
    location_disabled: { en: 'Location Off', ar: 'الموقع مغلق' },
    root_detected: { en: 'Rooted Device', ar: 'جهاز مكسور' },
    emulator_detected: { en: 'Emulator', ar: 'محاكي' },
};

interface FraudReleasePanelProps {
    initialUsers: FraudLockedUser[];
}

export function FraudReleasePanel({ initialUsers }: FraudReleasePanelProps) {
    const locale = useLocale();
    const isArabic = locale === 'ar';
    const router = useRouter();
    const [users, setUsers] = useState<FraudLockedUser[]>(initialUsers);
    const [search, setSearch] = useState('');
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [confirmId, setConfirmId] = useState<string | null>(null);

    // Filter by search
    const filteredUsers = useMemo(() => {
        if (!search.trim()) return users;
        const q = search.toLowerCase();
        return users.filter(
            (u) =>
                u.fullName?.toLowerCase().includes(q) ||
                u.arabicName?.toLowerCase().includes(q) ||
                u.email?.toLowerCase().includes(q)
        );
    }, [users, search]);

    // Release handler
    const handleRelease = useCallback(async (userId: string) => {
        setLoadingId(userId);
        const result = await releaseFraudUser(userId);
        if (result.success) {
            setUsers((prev) => prev.filter((u) => u.id !== userId));
            setConfirmId(null);
        } else {
            console.error('Release failed:', result.error);
        }
        setLoadingId(null);
        router.refresh();
    }, [router]);

    const getRoleLabel = (role: string | null) => {
        if (!role) return isArabic ? 'غير محدد' : 'Unknown';
        const config = ROLE_LABELS[role];
        return config ? (isArabic ? config.ar : config.en) : role;
    };

    const getRoleColor = (role: string | null) => {
        return ROLE_LABELS[role ?? '']?.color ?? 'text-gray-500';
    };

    const getReasonLabel = (reason: string) => {
        const config = REASON_LABELS[reason];
        return config ? (isArabic ? config.ar : config.en) : reason;
    };

    // ── Empty State ──
    if (users.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 border-2 border-emerald-500/30">
                        <ShieldCheck className="h-10 w-10 text-emerald-500" />
                    </div>
                </div>
                <h3 className="text-xl font-bold text-emerald-500">
                    {isArabic ? 'النظام آمن' : 'System Secure'}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm text-center">
                    {isArabic
                        ? 'لا يوجد مستخدمين محبوسين حالياً. كل الفريق يعمل بشكل طبيعي.'
                        : 'No locked users at the moment. All team members are operating normally.'}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Stats Bar */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-1.5">
                    <ShieldAlert className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-semibold text-red-500">{users.length}</span>
                    <span className="text-xs text-red-500/70">
                        {isArabic ? 'محبوس' : 'locked'}
                    </span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
                    <span className="text-xs text-muted-foreground">
                        {isArabic ? 'فلتر النتائج' : 'Showing filtered'}
                    </span>
                    <span className="text-sm font-semibold text-foreground">{filteredUsers.length}</span>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={isArabic ? 'ابحث عن مستخدم...' : 'Search users...'}
                    className="w-full rounded-xl border border-border bg-card/50 py-2.5 ps-10 pe-4 text-sm
                        placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20
                        focus:border-primary/40 transition-all"
                />
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredUsers.map((user) => (
                    <div
                        key={user.id}
                        className="relative flex flex-col gap-3 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/20 p-4 transition-all duration-200"
                    >
                        {/* Header: Icon + Name */}
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30">
                                <UserCircle className="h-6 w-6 text-red-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-sm font-semibold text-foreground truncate">
                                    {isArabic
                                        ? (user.arabicName || user.fullName || 'بدون اسم')
                                        : (user.fullName || user.arabicName || 'No Name')}
                                </h3>
                                <span className={`text-xs font-medium ${getRoleColor(user.fieldRole)}`}>
                                    {getRoleLabel(user.fieldRole)}
                                </span>
                            </div>
                        </div>

                        {/* Reasons */}
                        {user.fraudLockReason && user.fraudLockReason.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {user.fraudLockReason.map((reason) => (
                                    <span
                                        key={reason}
                                        className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-600 dark:text-red-400"
                                    >
                                        <AlertTriangle className="h-3 w-3" />
                                        {getReasonLabel(reason)}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Unlock count */}
                        {user.fraudUnlockCount > 0 && (
                            <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                                <Unlock className="h-3 w-3" />
                                {isArabic
                                    ? `اتحرر ${user.fraudUnlockCount} مرة قبل كده`
                                    : `Released ${user.fraudUnlockCount} time(s) before`}
                            </div>
                        )}

                        {/* Release Button */}
                        {confirmId === user.id ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleRelease(user.id)}
                                    disabled={loadingId === user.id}
                                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 
                                        text-white text-xs font-semibold py-2 transition-colors disabled:opacity-50"
                                >
                                    {loadingId === user.id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Unlock className="h-3.5 w-3.5" />
                                    )}
                                    {isArabic ? 'تأكيد التحرير' : 'Confirm Release'}
                                </button>
                                <button
                                    onClick={() => setConfirmId(null)}
                                    className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                                >
                                    {isArabic ? 'إلغاء' : 'Cancel'}
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setConfirmId(user.id)}
                                className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 
                                    bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 
                                    text-xs font-semibold py-2 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition-colors"
                            >
                                <Unlock className="h-3.5 w-3.5" />
                                {isArabic ? 'تحرير' : 'Release'}
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* No results */}
            {filteredUsers.length === 0 && users.length > 0 && (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Search className="h-10 w-10 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                        {isArabic ? 'لا توجد نتائج للبحث' : 'No matching users found'}
                    </p>
                </div>
            )}
        </div>
    );
}
