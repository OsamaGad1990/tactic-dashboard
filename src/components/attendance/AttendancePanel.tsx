'use client';

import { useState, useMemo, useTransition } from 'react';
import { useToast } from '@/components/providers/toast-provider';
import { useLocale } from 'next-intl';
import { useScope } from '@/lib/context/ScopeContext';
import { sendAttendanceNotification } from '@/app/[locale]/dashboard/company/attendance/actions';
import {
    Search,
    Users,
    UserCheck,
    UserX,
    Clock,
    Send,
    Bell,
    Loader2,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Wifi,
    WifiOff,
    X,
} from 'lucide-react';

// ── Role Labels ──
const ROLE_LABELS: Record<string, { en: string; ar: string }> = {
    promoter: { en: 'Promoter', ar: 'مروّج' },
    mch: { en: 'Merchandiser', ar: 'ميرتشندايزر' },
    team_leader: { en: 'Team Leader', ar: 'قائد فريق' },
    manager: { en: 'Manager', ar: 'مدير' },
    promoplus: { en: 'Sales Promoter', ar: 'مروج بيعي' },
};

const ROLE_COLORS: Record<string, string> = {
    promoter: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40',
    mch: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40',
    team_leader: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40',
    manager: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/40',
    promoplus: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/40',
};

// ── Types ──
interface AttendanceUser {
    userId: string;
    name: string;
    role: string;
    teamLeaderName: string | null;
    firstCheckIn: string | null;
    isOnline: boolean;
    lastSeen: string | null;
}

interface AttendanceStats {
    total: number;
    present: number;
    absent: number;
    online: number;
}

// ── Stat Card ──
function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color: string }) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card/50 p-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>{icon}</div>
            <div>
                <p className="text-xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
            </div>
        </div>
    );
}

// ── Custom Notification Modal ──
function CustomNotificationModal({
    user,
    isArabic,
    onClose,
}: {
    user: AttendanceUser;
    isArabic: boolean;
    onClose: () => void;
}) {
    const [titleEn, setTitleEn] = useState('');
    const [titleAr, setTitleAr] = useState('');
    const [messageEn, setMessageEn] = useState('');
    const [messageAr, setMessageAr] = useState('');
    const [isPending, startTransition] = useTransition();
    const [sent, setSent] = useState(false);
    const toast = useToast();

    const handleSend = () => {
        if (!titleEn.trim() && !titleAr.trim()) return;
        startTransition(async () => {
            const result = await sendAttendanceNotification({
                targetUserId: user.userId,
                titleEn: titleEn.trim() || titleAr.trim(),
                titleAr: titleAr.trim() || titleEn.trim(),
                messageEn: messageEn.trim(),
                messageAr: messageAr.trim(),
            });
            if (result.success) {
                setSent(true);
                toast.success(isArabic ? 'تم إرسال الإشعار بنجاح' : 'Notification sent successfully');
                setTimeout(onClose, 1500);
            } else {
                toast.error(isArabic ? 'فشل إرسال الإشعار' : 'Failed to send notification');
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-border bg-card p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-foreground">
                        {isArabic ? 'إشعار مخصص' : 'Custom Notification'}
                    </h3>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-muted transition-colors">
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                <p className="text-sm text-muted-foreground">
                    {isArabic ? `إرسال إلى: ${user.name}` : `Send to: ${user.name}`}
                </p>

                {sent ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                        <p className="text-sm font-medium text-emerald-600">
                            {isArabic ? 'تم الإرسال بنجاح!' : 'Sent successfully!'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                    {isArabic ? 'العنوان (إنجليزي)' : 'Title (English)'}
                                </label>
                                <input
                                    value={titleEn}
                                    onChange={(e) => setTitleEn(e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="Notification title..."
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                    {isArabic ? 'العنوان (عربي)' : 'Title (Arabic)'}
                                </label>
                                <input
                                    value={titleAr}
                                    onChange={(e) => setTitleAr(e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    dir="rtl"
                                    placeholder="عنوان الإشعار..."
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                    {isArabic ? 'الرسالة (إنجليزي)' : 'Message (English)'}
                                </label>
                                <textarea
                                    value={messageEn}
                                    onChange={(e) => setMessageEn(e.target.value)}
                                    rows={2}
                                    className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                    placeholder="Optional message..."
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                    {isArabic ? 'الرسالة (عربي)' : 'Message (Arabic)'}
                                </label>
                                <textarea
                                    value={messageAr}
                                    onChange={(e) => setMessageAr(e.target.value)}
                                    rows={2}
                                    dir="rtl"
                                    className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                    placeholder="رسالة اختيارية..."
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleSend}
                            disabled={isPending || (!titleEn.trim() && !titleAr.trim())}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
                        >
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            {isArabic ? 'إرسال' : 'Send'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

// ── User Row ──
function UserRow({ user, isArabic }: { user: AttendanceUser; isArabic: boolean }) {
    const [expanded, setExpanded] = useState(false);
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [readySending, startReadyTransition] = useTransition();
    const [readySent, setReadySent] = useState(false);
    const toast = useToast();

    const roleLabel = ROLE_LABELS[user.role];
    const roleColor = ROLE_COLORS[user.role] ?? 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-950/40';
    const isPresent = !!user.firstCheckIn;

    const formatTime = (iso: string | null) => {
        if (!iso) return '--:--';
        try { return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }); }
        catch { return '--:--'; }
    };

    const timeSince = (iso: string | null) => {
        if (!iso) return isArabic ? 'غير معروف' : 'Unknown';
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return isArabic ? 'الآن' : 'Just now';
        if (mins < 60) return isArabic ? `منذ ${mins} دقيقة` : `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        return isArabic ? `منذ ${hours} ساعة` : `${hours}h ago`;
    };

    const sendReadyNotification = () => {
        startReadyTransition(async () => {
            const result = await sendAttendanceNotification({
                targetUserId: user.userId,
                titleEn: 'Start Your Day',
                titleAr: 'ابدأ يومك',
                messageEn: 'Please start your scheduled visits for today.',
                messageAr: 'يرجى البدء بالزيارات المجدولة لهذا اليوم.',
            });
            if (result.success) {
                setReadySent(true);
                toast.success(isArabic ? 'تم إرسال التنبيه' : 'Reminder sent');
                setTimeout(() => setReadySent(false), 3000);
            } else {
                toast.error(isArabic ? 'فشل إرسال التنبيه' : 'Failed to send reminder');
            }
        });
    };

    return (
        <>
            <div className="rounded-xl border border-border bg-card/50 transition-all hover:shadow-md hover:shadow-black/5">
                <button onClick={() => setExpanded(!expanded)} className="flex w-full items-center gap-3 p-4 text-start">
                    {/* Online Indicator */}
                    <div className="flex-shrink-0">
                        {user.isOnline ? (
                            <div className="relative">
                                <Wifi className="h-5 w-5 text-emerald-500" />
                                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse border-2 border-card" />
                            </div>
                        ) : (
                            <WifiOff className="h-5 w-5 text-muted-foreground/40" />
                        )}
                    </div>

                    {/* User Info */}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground truncate">{user.name}</span>
                            {roleLabel && (
                                <span className={`hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${roleColor}`}>
                                    {isArabic ? roleLabel.ar : roleLabel.en}
                                </span>
                            )}
                        </div>
                        {user.teamLeaderName && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {isArabic ? `المدير: ${user.teamLeaderName}` : `Manager: ${user.teamLeaderName}`}
                            </p>
                        )}
                    </div>

                    {/* Check-in Time */}
                    <div className="hidden sm:flex items-center gap-1.5 text-xs">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className={isPresent ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                            {isPresent ? formatTime(user.firstCheckIn) : (isArabic ? 'لم يحضر' : 'Absent')}
                        </span>
                    </div>

                    {/* Status Badge */}
                    <span className={`hidden md:inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${user.isOnline
                        ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40'
                        : isPresent
                            ? 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40'
                            : 'text-red-500 bg-red-50 dark:text-red-400 dark:bg-red-950/40'
                        }`}>
                        {user.isOnline
                            ? (isArabic ? 'نشط' : 'Active')
                            : isPresent
                                ? (isArabic ? 'غير نشط' : 'Inactive')
                                : (isArabic ? 'غائب' : 'Absent')}
                    </span>

                    {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>

                {expanded && (
                    <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div>
                                <span className="text-muted-foreground">{isArabic ? 'الحضور' : 'Check-in'}</span>
                                <p className="font-medium text-foreground mt-0.5">{formatTime(user.firstCheckIn)}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">{isArabic ? 'حالة الاتصال' : 'Status'}</span>
                                <p className={`font-medium mt-0.5 ${user.isOnline ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                                    {user.isOnline ? (isArabic ? 'متصل الآن' : 'Online') : (isArabic ? 'غير متصل' : 'Offline')}
                                </p>
                            </div>
                            {!user.isOnline && user.lastSeen && (
                                <div>
                                    <span className="text-muted-foreground">{isArabic ? 'آخر نشاط' : 'Last Seen'}</span>
                                    <p className="font-medium text-foreground mt-0.5">{timeSince(user.lastSeen)}</p>
                                </div>
                            )}
                            <div>
                                <span className="text-muted-foreground">{isArabic ? 'المدير المباشر' : 'Direct Manager'}</span>
                                <p className="font-medium text-foreground mt-0.5">{user.teamLeaderName || (isArabic ? 'غير محدد' : 'N/A')}</p>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-1">
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowCustomModal(true); }}
                                className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/20 transition-all"
                            >
                                <Send className="h-3.5 w-3.5" />
                                {isArabic ? 'إشعار مخصص' : 'Custom Notification'}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); sendReadyNotification(); }}
                                disabled={readySending || readySent}
                                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${readySent
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                    : 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:hover:bg-amber-950/60'
                                    }`}
                            >
                                {readySending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : readySent ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
                                {readySent
                                    ? (isArabic ? 'تم الإرسال!' : 'Sent!')
                                    : (isArabic ? 'ابدأ يومك' : 'Start Your Day')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {showCustomModal && (
                <CustomNotificationModal
                    user={user}
                    isArabic={isArabic}
                    onClose={() => setShowCustomModal(false)}
                />
            )}
        </>
    );
}

// ── Filter Options ──
const STATUS_FILTERS = [
    { key: 'all', en: 'All', ar: 'الكل' },
    { key: 'present', en: 'Present', ar: 'حاضر' },
    { key: 'absent', en: 'Absent', ar: 'غائب' },
    { key: 'online', en: 'Online', ar: 'نشط' },
    { key: 'offline', en: 'Offline', ar: 'غير نشط' },
];

const ONLINE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

// ── Main Panel ──
interface AttendancePanelProps {
    checkInMap: Record<string, string>;     // userId → firstCheckIn ISO
    liveStatusMap: Record<string, string>;  // userId → lastSeen ISO
}

export function AttendancePanel({ checkInMap, liveStatusMap }: AttendancePanelProps) {
    const locale = useLocale();
    const isArabic = locale === 'ar';
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // ── Get user data from Scope Context ──
    const {
        scope,
        isLoading,
        selectedTeamLeaderId,
        selectedFieldUserId,
        filteredFieldUsers,
        filteredTeamLeaders,
    } = useScope();

    // Build team leader name lookup
    const teamLeaderNameMap = useMemo(() => {
        const map = new Map<string, string>();
        if (scope?.team_leaders) {
            for (const tl of scope.team_leaders) {
                map.set(tl.team_leader_id, tl.name);
            }
        }
        return map;
    }, [scope?.team_leaders]);

    // Build attendance user list from scope field users + server-side data
    const allUsers = useMemo<AttendanceUser[]>(() => {
        if (!scope?.field_users) return [];

        return scope.field_users.map((fu) => {
            const lastSeen = liveStatusMap[fu.user_id] ?? null;
            const isOnline = lastSeen
                ? (Date.now() - new Date(lastSeen).getTime()) < ONLINE_THRESHOLD_MS
                : false;

            return {
                userId: fu.user_id,
                name: fu.name || 'Unknown',
                role: fu.role || 'promoter',
                teamLeaderName: teamLeaderNameMap.get(fu.team_leader_account_id) ?? null,
                firstCheckIn: checkInMap[fu.user_id] ?? null,
                isOnline,
                lastSeen,
            };
        });
    }, [scope?.field_users, checkInMap, liveStatusMap, teamLeaderNameMap]);

    // ── Filter by global filters + local filters ──
    const filtered = useMemo(() => {
        let result = allUsers;

        // Field user filter
        if (selectedFieldUserId) {
            result = result.filter((u) => u.userId === selectedFieldUserId);
        }

        // Team leader filter
        if (selectedTeamLeaderId && !selectedFieldUserId) {
            const teamUserIds = new Set(
                filteredFieldUsers
                    .filter((u) => u.team_leader_account_id === selectedTeamLeaderId)
                    .map((u) => u.user_id)
            );
            if (teamUserIds.size > 0) {
                result = result.filter((u) => teamUserIds.has(u.userId));
            }
        }

        // Status filter
        if (statusFilter === 'present') result = result.filter((u) => !!u.firstCheckIn);
        if (statusFilter === 'absent') result = result.filter((u) => !u.firstCheckIn);
        if (statusFilter === 'online') result = result.filter((u) => u.isOnline);
        if (statusFilter === 'offline') result = result.filter((u) => !u.isOnline);

        // Search
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter((u) =>
                u.name?.toLowerCase().includes(q) ||
                u.teamLeaderName?.toLowerCase().includes(q) ||
                u.role?.toLowerCase().includes(q)
            );
        }

        return result;
    }, [allUsers, search, statusFilter, selectedFieldUserId, selectedTeamLeaderId, filteredFieldUsers]);

    const stats = useMemo<AttendanceStats>(() => ({
        total: filtered.length,
        present: filtered.filter((u) => !!u.firstCheckIn).length,
        absent: filtered.filter((u) => !u.firstCheckIn).length,
        online: filtered.filter((u) => u.isOnline).length,
    }), [filtered]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16 gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">{isArabic ? 'جاري التحميل...' : 'Loading...'}</span>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard icon={<Users className="h-5 w-5 text-primary" />} value={stats.total} label={isArabic ? 'إجمالي الفريق' : 'Total Team'} color="bg-primary/10" />
                <StatCard icon={<UserCheck className="h-5 w-5 text-emerald-600" />} value={stats.present} label={isArabic ? 'حاضر' : 'Present'} color="bg-emerald-100 dark:bg-emerald-950/40" />
                <StatCard icon={<UserX className="h-5 w-5 text-red-500" />} value={stats.absent} label={isArabic ? 'غائب' : 'Absent'} color="bg-red-100 dark:bg-red-950/40" />
                <StatCard icon={<Wifi className="h-5 w-5 text-blue-600" />} value={stats.online} label={isArabic ? 'نشط الآن' : 'Online Now'} color="bg-blue-100 dark:bg-blue-950/40" />
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={isArabic ? 'ابحث عن مستخدم...' : 'Search user...'}
                        className="w-full rounded-xl border border-border bg-card/50 py-2.5 ps-10 pe-4 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                    />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                    {STATUS_FILTERS.map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setStatusFilter(f.key)}
                            className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${statusFilter === f.key
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                }`}
                        >
                            {isArabic ? f.ar : f.en}
                        </button>
                    ))}
                </div>
            </div>

            {/* User List */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Users className="h-12 w-12 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                        {search || statusFilter !== 'all'
                            ? (isArabic ? 'لا توجد نتائج مطابقة' : 'No matching users found')
                            : (isArabic ? 'لا يوجد أعضاء فريق' : 'No team members found')}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground px-1">
                        {isArabic
                            ? `عرض ${filtered.length} من ${allUsers.length} مستخدم`
                            : `Showing ${filtered.length} of ${allUsers.length} users`}
                    </p>
                    {filtered.map((user) => (
                        <UserRow key={user.userId} user={user} isArabic={isArabic} />
                    ))}
                </div>
            )}
        </div>
    );
}
