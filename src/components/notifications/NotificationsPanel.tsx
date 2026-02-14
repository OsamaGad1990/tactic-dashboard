'use client';

import { sendNotification, fetchNotificationDetails } from '@/app/[locale]/dashboard/company/notifications/actions';
import type { NotificationRow, FieldUser, NotificationDetail, RecipientDetail } from '@/lib/services/notifications-service';
import { cn } from '@/lib/utils';
import { NotificationFilterBar } from './NotificationFilterBar';
import {
    Bell,
    CheckCircle2,
    ChevronDown,
    Clock,
    Eye,
    Inbox,
    Loader2,
    Send,
    Users,
    User,
    X,
    Zap,
    BarChart3,
    Timer,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { useToast } from '@/components/providers/toast-provider';

interface NotificationsPanelProps {
    sentNotifications: NotificationRow[];
    fieldUsers: FieldUser[];
}

// ── Status Config ──
const STATUS_CONFIG: Record<string, { color: string; bgColor: string; dotColor: string; labelEn: string; labelAr: string }> = {
    queued: {
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-50 dark:bg-amber-950/30',
        dotColor: 'bg-amber-500',
        labelEn: 'Queued',
        labelAr: 'في الانتظار',
    },
    read: {
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-950/30',
        dotColor: 'bg-blue-500',
        labelEn: 'Read',
        labelAr: 'مقروء',
    },
    actioned: {
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
        dotColor: 'bg-emerald-500',
        labelEn: 'Actioned',
        labelAr: 'تم التنفيذ',
    },
    completed: {
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
        dotColor: 'bg-emerald-500',
        labelEn: 'Delivered',
        labelAr: 'تم التسليم',
    },
    archived: {
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-50 dark:bg-gray-950/30',
        dotColor: 'bg-gray-400',
        labelEn: 'Archived',
        labelAr: 'مؤرشف',
    },
};

const AUDIENCE_LABELS: Record<string, { en: string; ar: string; icon: React.ReactNode }> = {
    all: { en: 'All Users', ar: 'كل المستخدمين', icon: <Users className="h-3.5 w-3.5" /> },
    role: { en: 'By Role', ar: 'حسب الدور', icon: <Users className="h-3.5 w-3.5" /> },
    single_user: { en: 'Single User', ar: 'مستخدم واحد', icon: <User className="h-3.5 w-3.5" /> },
    legacy: { en: 'Legacy', ar: 'قديم', icon: <Bell className="h-3.5 w-3.5" /> },
};

const ROLE_LABELS: Record<string, { en: string; ar: string }> = {
    team_leader: { en: 'Team Leader', ar: 'قائد فريق' },
    mch: { en: 'Merchandiser', ar: 'منسق' },
    promoter: { en: 'Promoter', ar: 'مروّج' },
    promoplus: { en: 'Sales Promoter', ar: 'مروج بيع' },
    pharmacy_user: { en: 'Pharmacy', ar: 'صيدلية' },
};

/** Derive display status from read/action counts */
function deriveStatus(readCount: number, actionCount: number): string {
    if (actionCount > 0) return 'actioned';
    if (readCount > 0) return 'read';
    return 'queued';
}

function StatusBadge({ readCount, actionCount, isArabic }: { readCount: number; actionCount: number; isArabic: boolean }) {
    const status = deriveStatus(readCount, actionCount);
    const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.queued;
    return (
        <span className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
            config.bgColor, config.color,
        )}>
            <span className={cn('h-1.5 w-1.5 rounded-full', config.dotColor)} />
            {isArabic ? config.labelAr : config.labelEn}
        </span>
    );
}

function formatDateTime(dateStr: string, isArabic: boolean): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const timeStr = date.toLocaleTimeString(isArabic ? 'ar-EG' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    });
    const dateStrFormatted = date.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
    return `${dateStrFormatted} ${timeStr}`;
}

/** Format delta seconds to human-readable "Xm Xs" */
function formatDelta(seconds: number | null, isArabic: boolean): string {
    if (seconds === null || seconds === undefined) return '—';
    if (seconds < 0) seconds = 0;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) {
        return isArabic ? `${secs}ث` : `${secs}s`;
    }
    if (mins < 60) {
        return isArabic ? `${mins}د ${secs}ث` : `${mins}m ${secs}s`;
    }
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return isArabic ? `${hrs}س ${remMins}د` : `${hrs}h ${remMins}m`;
}

// ── Tab Key ──
type TabKey = 'sent' | 'send';

// ── Main Panel ──
export function NotificationsPanel({ sentNotifications, fieldUsers }: NotificationsPanelProps) {
    const locale = useLocale();
    const isArabic = locale === 'ar';
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<TabKey>('sent');
    const [detailModal, setDetailModal] = useState<NotificationDetail | null>(null);
    const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);

    // ── Local filters ──
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [senderTypeFilter, setSenderTypeFilter] = useState<string>('all');
    const [senderNameFilter, setSenderNameFilter] = useState<string>('all');
    const [recipientRoleFilter, setRecipientRoleFilter] = useState<string>('all');
    const [recipientNameFilter, setRecipientNameFilter] = useState<string>('all');

    const hasActiveLocalFilters = dateFrom !== '' || dateTo !== '' || statusFilter !== 'all'
        || senderTypeFilter !== 'all' || senderNameFilter !== 'all'
        || recipientRoleFilter !== 'all' || recipientNameFilter !== 'all';

    const resetLocalFilters = () => {
        setDateFrom('');
        setDateTo('');
        setStatusFilter('all');
        setSenderTypeFilter('all');
        setSenderNameFilter('all');
        setRecipientRoleFilter('all');
        setRecipientNameFilter('all');
    };

    // ── Sender name options: distinct team leaders from notification data ──
    const senderNameOptions = useMemo(() => {
        const seen = new Map<string, { value: string; label: string }>();
        for (const n of sentNotifications) {
            if (n.teamLeader && !seen.has(n.teamLeader)) {
                const label = isArabic
                    ? (n.senderArabicName || n.senderName || n.teamLeader)
                    : (n.senderName || n.teamLeader);
                seen.set(n.teamLeader, { value: n.teamLeader, label });
            }
        }
        return Array.from(seen.values());
    }, [sentNotifications, isArabic]);

    // ── Recipient role options: distinct field roles of users linked to this client ──
    const recipientRoleOptions = useMemo(() => {
        const roleLabels: Record<string, { en: string; ar: string }> = {
            team_leader: { en: 'Team Leaders', ar: 'قادة الفرق' },
            mch: { en: 'Merchandisers', ar: 'منسقين' },
            promoter: { en: 'Promoters', ar: 'مروّجين' },
            promoplus: { en: 'Sales Promoters', ar: 'مروجي بيع' },
            pharmacy_user: { en: 'Pharmacy', ar: 'صيدليات' },
        };
        const rolesFound = new Set<string>();
        for (const u of fieldUsers) {
            if (u.fieldRole) rolesFound.add(u.fieldRole);
        }
        return Array.from(rolesFound).map((role) => ({
            value: role,
            label: roleLabels[role]
                ? (isArabic ? roleLabels[role].ar : roleLabels[role].en)
                : role,
        }));
    }, [fieldUsers, isArabic]);

    // ── Recipient name options: field users linked to this client ──
    const recipientNameOptions = useMemo(() => {
        return fieldUsers.map((u) => ({
            value: u.id,
            label: isArabic ? (u.arabicName || u.fullName || u.id) : (u.fullName || u.id),
        }));
    }, [fieldUsers, isArabic]);


    // ── Apply all 7 filters ──
    const filteredNotifications = useMemo(() => {
        return sentNotifications.filter((n) => {
            // Date range
            if (dateFrom) {
                const nDate = new Date(n.createdAt);
                const from = new Date(dateFrom);
                from.setHours(0, 0, 0, 0);
                if (nDate < from) return false;
            }
            if (dateTo) {
                const nDate = new Date(n.createdAt);
                const to = new Date(dateTo);
                to.setHours(23, 59, 59, 999);
                if (nDate > to) return false;
            }
            // Status
            if (statusFilter !== 'all') {
                const derived = deriveStatus(n.readCount, n.actionCount);
                if (derived !== statusFilter) return false;
            }
            // Sender type: system = teamLeader is null, team_leader = teamLeader is set
            if (senderTypeFilter === 'system' && n.teamLeader !== null) return false;
            if (senderTypeFilter === 'team_leader' && n.teamLeader === null) return false;
            // Sender name: specific TL UUID
            if (senderNameFilter !== 'all' && n.teamLeader !== senderNameFilter) return false;
            // Recipient role: check forRoles array + audienceType + forAll + single_user target role
            if (recipientRoleFilter !== 'all') {
                const sentToAll = n.audienceType === 'all' || n.forAll === true || n.forAll as unknown === 't';
                const roleMatches = Array.isArray(n.forRoles) && n.forRoles.includes(recipientRoleFilter);
                // Also match single_user notifications where the target user has this role
                const singleUserRoleMatch = n.audienceType === 'single_user' && n.forUser
                    && fieldUsers.some(u => u.id === n.forUser && u.fieldRole === recipientRoleFilter);
                if (!sentToAll && !roleMatches && !singleUserRoleMatch) return false;
            }
            // Recipient name: check if this user would have received the notification
            if (recipientNameFilter !== 'all') {
                const targetUser = fieldUsers.find(u => u.id === recipientNameFilter);
                if (targetUser) {
                    const sentToAll = n.audienceType === 'all' || n.forAll === true || n.forAll as unknown === 't';
                    const isForUser = n.forUser === targetUser.id;
                    const isForRole = !!targetUser.fieldRole && Array.isArray(n.forRoles) && n.forRoles.includes(targetUser.fieldRole);
                    if (!sentToAll && !isForUser && !isForRole) return false;
                }
            }
            return true;
        });
    }, [sentNotifications, fieldUsers, dateFrom, dateTo, statusFilter, senderTypeFilter, senderNameFilter, recipientRoleFilter, recipientNameFilter]);

    const openDetail = async (notificationId: string) => {
        setLoadingDetailId(notificationId);
        try {
            const result = await fetchNotificationDetails(notificationId);
            setLoadingDetailId(null);

            if (result.error) {
                toast.error(result.error);
                return;
            }

            if (result.data) {
                setDetailModal(result.data);
            } else {
                toast.error('No data returned');
            }
        } catch (err) {
            setLoadingDetailId(null);
            console.error('openDetail fetch error:', err);
            toast.error(`Fetch error: ${err instanceof Error ? err.message : String(err)}`);
        }
    };

    const tabs: { key: TabKey; labelEn: string; labelAr: string; count?: number; icon: React.ReactNode }[] = [
        {
            key: 'sent',
            labelEn: 'Sent Notifications',
            labelAr: 'الإشعارات المرسلة',
            count: filteredNotifications.length,
            icon: <Inbox className="h-4 w-4" />,
        },
        {
            key: 'send',
            labelEn: 'Send Notification',
            labelAr: 'إرسال إشعار',
            icon: <Send className="h-4 w-4" />,
        },
    ];

    const columns = isArabic
        ? ['الحالة', 'العنوان', 'الرسالة', 'الجمهور', 'القراءات', 'تاريخ الإرسال', 'التفاصيل']
        : ['Status', 'Title', 'Message', 'Audience', 'Reads', 'Sent At', 'Details'];

    return (
        <div className="space-y-5">
            {/* ── Premium Filter Bar ── */}
            <NotificationFilterBar
                dateFrom={dateFrom}
                dateTo={dateTo}
                statusFilter={statusFilter}
                senderTypeFilter={senderTypeFilter}
                senderNameFilter={senderNameFilter}
                recipientRoleFilter={recipientRoleFilter}
                recipientNameFilter={recipientNameFilter}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
                onStatusChange={setStatusFilter}
                onSenderTypeChange={setSenderTypeFilter}
                onSenderNameChange={setSenderNameFilter}
                onRecipientRoleChange={setRecipientRoleFilter}
                onRecipientNameChange={setRecipientNameFilter}
                onReset={resetLocalFilters}
                senderNameOptions={senderNameOptions}
                recipientRoleOptions={recipientRoleOptions}
                recipientNameOptions={recipientNameOptions}
                hasActiveFilters={hasActiveLocalFilters}
                filteredCount={filteredNotifications.length}
                totalCount={sentNotifications.length}
            />
            {/* Tab Bar */}
            <div className="flex gap-1 p-1 rounded-xl bg-muted/50 border border-border/50">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                            'flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium',
                            'transition-all duration-200',
                            activeTab === tab.key
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                        )}
                    >
                        {tab.icon}
                        <span>{isArabic ? tab.labelAr : tab.labelEn}</span>
                        {tab.count !== undefined && tab.count > 0 && (
                            <span className={cn(
                                'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold',
                                activeTab === tab.key
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-muted-foreground/10 text-muted-foreground'
                            )}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Sent Tab (Data Table) ── */}
            {activeTab === 'sent' && (
                <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
                    {sentNotifications.length === 0 ? (
                        <div className="p-12 text-center">
                            <Inbox className="mx-auto h-12 w-12 text-muted-foreground/40" />
                            <p className="mt-4 text-sm text-muted-foreground">
                                {isArabic ? 'لا توجد إشعارات مرسلة بعد' : 'No notifications sent yet'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border/60 bg-muted/30">
                                        {columns.map((col, i) => (
                                            <th
                                                key={i}
                                                className={cn(
                                                    'px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap',
                                                    isArabic ? 'text-right' : 'text-left',
                                                )}
                                            >
                                                {col}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {filteredNotifications.map((row) => {
                                        const title = isArabic
                                            ? (row.titleAr || row.titleEn)
                                            : row.titleEn;
                                        const message = isArabic
                                            ? (row.messageAr || row.messageEn || '—')
                                            : (row.messageEn || '—');
                                        const audience = AUDIENCE_LABELS[row.audienceType ?? 'legacy'] ?? AUDIENCE_LABELS.legacy;
                                        const isLoading = loadingDetailId === row.id;

                                        return (
                                            <tr
                                                key={row.id}
                                                className="hover:bg-muted/20 transition-colors duration-100"
                                            >
                                                <td className="px-4 py-3">
                                                    <StatusBadge
                                                        readCount={row.readCount}
                                                        actionCount={row.actionCount}
                                                        isArabic={isArabic}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 font-medium whitespace-nowrap max-w-[200px] truncate" title={title}>
                                                    {title}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground max-w-[250px] truncate" title={message}>
                                                    {message}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                                                        {audience.icon}
                                                        <span className="text-xs">{isArabic ? audience.ar : audience.en}</span>
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                                                        <Eye className="h-3.5 w-3.5" />
                                                        <span className="text-xs font-medium">{row.readCount}</span>
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs">
                                                    {formatDateTime(row.createdAt, isArabic)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <button
                                                        onClick={() => openDetail(row.id)}
                                                        disabled={isLoading}
                                                        className={cn(
                                                            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium',
                                                            'bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-200',
                                                            'disabled:opacity-50',
                                                        )}
                                                    >
                                                        {isLoading ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <BarChart3 className="h-3.5 w-3.5" />
                                                        )}
                                                        {isArabic ? 'تحليل' : 'Analytics'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Send Tab (Compose Form) ── */}
            {activeTab === 'send' && (
                <SendNotificationForm isArabic={isArabic} fieldUsers={fieldUsers} />
            )}

            {/* ── Detail Modal ── */}
            {detailModal && (
                <NotificationDetailModal
                    detail={detailModal}
                    isArabic={isArabic}
                    onClose={() => setDetailModal(null)}
                />
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
// ── Notification Detail Modal ──
// ══════════════════════════════════════════════════════════════

function NotificationDetailModal({
    detail,
    isArabic,
    onClose,
}: {
    detail: NotificationDetail;
    isArabic: boolean;
    onClose: () => void;
}) {
    const title = isArabic ? (detail.titleAr || detail.titleEn) : detail.titleEn;
    const message = isArabic
        ? (detail.messageAr || detail.messageEn || '—')
        : (detail.messageEn || '—');
    const audience = AUDIENCE_LABELS[detail.audienceType ?? 'legacy'] ?? AUDIENCE_LABELS.legacy;

    // Stats
    const readRate = detail.totalRecipients > 0
        ? Math.round((detail.totalReads / detail.totalRecipients) * 100)
        : 0;
    const actionRate = detail.totalRecipients > 0
        ? Math.round((detail.totalActions / detail.totalRecipients) * 100)
        : 0;

    // Average read time
    const readDeltas = detail.recipients
        .filter((r) => r.readDeltaSeconds !== null)
        .map((r) => r.readDeltaSeconds as number);
    const avgReadDelta = readDeltas.length > 0
        ? Math.round(readDeltas.reduce((a, b) => a + b, 0) / readDeltas.length)
        : null;

    const recipientColumns = isArabic
        ? ['الاسم', 'الدور', 'وقت القراءة', 'مدة الاستجابة', 'نوع الإجراء', 'وقت الإجراء', 'مدة الإجراء']
        : ['Name', 'Role', 'Read At', 'Read Delta', 'Action', 'Action At', 'Action Delta'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative w-full max-w-5xl max-h-[85vh] rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 border-b border-border/60 bg-muted/20 px-6 py-4">
                    <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                <BarChart3 className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h2 className="text-lg font-bold tracking-tight truncate">{title}</h2>
                                <p className="text-xs text-muted-foreground truncate">{message}</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 hover:bg-muted/50 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 px-6 py-4 border-b border-border/40">
                    <StatCard
                        icon={<Send className="h-4 w-4" />}
                        labelEn="Sent"
                        labelAr="أُرسل"
                        value={formatDateTime(detail.createdAt, isArabic)}
                        isArabic={isArabic}
                    />
                    <StatCard
                        icon={<Users className="h-4 w-4" />}
                        labelEn="Recipients"
                        labelAr="المستلمين"
                        value={String(detail.totalRecipients)}
                        isArabic={isArabic}
                    />
                    <StatCard
                        icon={<Eye className="h-4 w-4" />}
                        labelEn="Read Rate"
                        labelAr="نسبة القراءة"
                        value={`${detail.totalReads}/${detail.totalRecipients} (${readRate}%)`}
                        isArabic={isArabic}
                        highlight={readRate >= 80 ? 'green' : readRate >= 50 ? 'amber' : 'red'}
                    />
                    <StatCard
                        icon={<Zap className="h-4 w-4" />}
                        labelEn="Action Rate"
                        labelAr="نسبة التنفيذ"
                        value={`${detail.totalActions}/${detail.totalRecipients} (${actionRate}%)`}
                        isArabic={isArabic}
                        highlight={actionRate >= 80 ? 'green' : actionRate >= 50 ? 'amber' : 'red'}
                    />
                    <StatCard
                        icon={<Timer className="h-4 w-4" />}
                        labelEn="Avg. Read Time"
                        labelAr="متوسط وقت القراءة"
                        value={formatDelta(avgReadDelta, isArabic)}
                        isArabic={isArabic}
                    />
                </div>

                {/* Recipients Table */}
                <div className="flex-1 overflow-auto">
                    {detail.recipients.length === 0 ? (
                        <div className="p-12 text-center">
                            <Eye className="mx-auto h-10 w-10 text-muted-foreground/30" />
                            <p className="mt-3 text-sm text-muted-foreground">
                                {isArabic ? 'لم يقرأ أحد هذا الإشعار بعد' : 'No one has read this notification yet'}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-muted/40 backdrop-blur-sm">
                                <tr className="border-b border-border/40">
                                    {recipientColumns.map((col, i) => (
                                        <th
                                            key={i}
                                            className={cn(
                                                'px-4 py-2.5 font-semibold text-muted-foreground whitespace-nowrap text-xs',
                                                isArabic ? 'text-right' : 'text-left',
                                            )}
                                        >
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {detail.recipients.map((r) => {
                                    const name = isArabic
                                        ? (r.arabicName || r.fullName || 'Unknown')
                                        : (r.fullName || 'Unknown');
                                    const role = ROLE_LABELS[r.fieldRole ?? ''] ?? { en: r.fieldRole ?? '—', ar: r.fieldRole ?? '—' };

                                    return (
                                        <tr
                                            key={r.userId}
                                            className="hover:bg-muted/10 transition-colors"
                                        >
                                            <td className="px-4 py-2.5 whitespace-nowrap font-medium text-xs">
                                                {name}
                                            </td>
                                            <td className="px-4 py-2.5 whitespace-nowrap">
                                                <span className="inline-flex items-center rounded-full bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                                    {isArabic ? role.ar : role.en}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 whitespace-nowrap text-xs text-muted-foreground">
                                                {r.readAt ? formatDateTime(r.readAt, isArabic) : '—'}
                                            </td>
                                            <td className="px-4 py-2.5 whitespace-nowrap">
                                                {r.readDeltaSeconds !== null ? (
                                                    <span className={cn(
                                                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold',
                                                        r.readDeltaSeconds < 300
                                                            ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                                                            : r.readDeltaSeconds < 3600
                                                                ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                                                                : 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400'
                                                    )}>
                                                        <Clock className="h-3 w-3" />
                                                        {formatDelta(r.readDeltaSeconds, isArabic)}
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td className="px-4 py-2.5 whitespace-nowrap text-xs text-muted-foreground">
                                                {r.actionType ? (
                                                    <span className="inline-flex items-center gap-1">
                                                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                                        {r.actionType}
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td className="px-4 py-2.5 whitespace-nowrap text-xs text-muted-foreground">
                                                {r.actionAt ? formatDateTime(r.actionAt, isArabic) : '—'}
                                            </td>
                                            <td className="px-4 py-2.5 whitespace-nowrap">
                                                {r.actionDeltaSeconds !== null ? (
                                                    <span className={cn(
                                                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold',
                                                        r.actionDeltaSeconds < 600
                                                            ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                                                            : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                                                    )}>
                                                        <Zap className="h-3 w-3" />
                                                        {formatDelta(r.actionDeltaSeconds, isArabic)}
                                                    </span>
                                                ) : '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Stat Card ──
function StatCard({
    icon,
    labelEn,
    labelAr,
    value,
    isArabic,
    highlight,
}: {
    icon: React.ReactNode;
    labelEn: string;
    labelAr: string;
    value: string;
    isArabic: boolean;
    highlight?: 'green' | 'amber' | 'red';
}) {
    const highlightClasses = highlight === 'green'
        ? 'text-emerald-600 dark:text-emerald-400'
        : highlight === 'amber'
            ? 'text-amber-600 dark:text-amber-400'
            : highlight === 'red'
                ? 'text-red-600 dark:text-red-400'
                : 'text-foreground';

    return (
        <div className="rounded-lg border border-border/40 bg-background/50 p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
                {icon}
                <span className="text-[11px] font-medium">{isArabic ? labelAr : labelEn}</span>
            </div>
            <p className={cn('text-sm font-bold', highlightClasses)}>{value}</p>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
// ── Send Form Component ──
// ══════════════════════════════════════════════════════════════

function SendNotificationForm({ isArabic, fieldUsers }: { isArabic: boolean; fieldUsers: FieldUser[] }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const toast = useToast();
    const [titleEn, setTitleEn] = useState('');
    const [titleAr, setTitleAr] = useState('');
    const [messageEn, setMessageEn] = useState('');
    const [messageAr, setMessageAr] = useState('');
    const [audienceType, setAudienceType] = useState<'all' | 'role' | 'single_user'>('all');
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Extract unique roles from field users
    const availableRoles = useMemo(() => {
        const roleSet = new Set(fieldUsers.map((u) => u.fieldRole).filter(Boolean));
        return Array.from(roleSet) as string[];
    }, [fieldUsers]);

    const handleSubmit = () => {
        setError(null);
        setSuccess(false);

        if (!titleEn.trim()) {
            setError(isArabic ? 'العنوان بالإنجليزية مطلوب' : 'English title is required');
            return;
        }

        if (audienceType === 'role' && selectedRoles.length === 0) {
            setError(isArabic ? 'اختر دور واحد على الأقل' : 'Select at least one role');
            return;
        }

        if (audienceType === 'single_user' && !selectedUser) {
            setError(isArabic ? 'اختر مستخدم' : 'Select a user');
            return;
        }

        startTransition(async () => {
            const result = await sendNotification({
                titleEn,
                titleAr: titleAr || undefined,
                messageEn: messageEn || undefined,
                messageAr: messageAr || undefined,
                audienceType,
                forRoles: audienceType === 'role' ? selectedRoles : undefined,
                forUser: audienceType === 'single_user' ? selectedUser : undefined,
            });

            if (result.success) {
                setSuccess(true);
                toast.success(isArabic ? 'تم إرسال الإشعار بنجاح' : 'Notification sent successfully');
                setTitleEn('');
                setTitleAr('');
                setMessageEn('');
                setMessageAr('');
                setSelectedRoles([]);
                setSelectedUser('');
                router.refresh();
            } else {
                toast.error(result.error ?? (isArabic ? 'حدث خطأ' : 'An error occurred'));
                setError(result.error ?? (isArabic ? 'حدث خطأ' : 'An error occurred'));
            }
        });
    };

    const toggleRole = (role: string) => {
        setSelectedRoles((prev) =>
            prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
        );
    };

    const audienceOptions: { value: 'all' | 'role' | 'single_user'; labelEn: string; labelAr: string; icon: React.ReactNode }[] = [
        { value: 'all', labelEn: 'All Users', labelAr: 'كل المستخدمين', icon: <Users className="h-4 w-4" /> },
        { value: 'role', labelEn: 'By Role', labelAr: 'حسب الدور', icon: <Users className="h-4 w-4" /> },
        { value: 'single_user', labelEn: 'Single User', labelAr: 'مستخدم واحد', icon: <User className="h-4 w-4" /> },
    ];

    const inputClasses = cn(
        'w-full rounded-lg border border-border/60 bg-background px-4 py-2.5 text-sm',
        'placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50',
        'transition-all duration-200',
    );

    const selectClasses = cn(
        inputClasses,
        'appearance-none cursor-pointer',
    );

    return (
        <div className="rounded-xl border border-border/60 bg-card p-6 space-y-5">
            {/* Title Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">
                        {isArabic ? 'العنوان (إنجليزي)' : 'Title (English)'} <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={titleEn}
                        onChange={(e) => setTitleEn(e.target.value)}
                        placeholder={isArabic ? 'أدخل العنوان بالإنجليزية...' : 'Enter title in English...'}
                        className={inputClasses}
                        dir="ltr"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">
                        {isArabic ? 'العنوان (عربي)' : 'Title (Arabic)'}
                    </label>
                    <input
                        type="text"
                        value={titleAr}
                        onChange={(e) => setTitleAr(e.target.value)}
                        placeholder={isArabic ? 'أدخل العنوان بالعربية...' : 'Enter title in Arabic...'}
                        className={inputClasses}
                        dir="rtl"
                    />
                </div>
            </div>

            {/* Message Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">
                        {isArabic ? 'الرسالة (إنجليزي)' : 'Message (English)'}
                    </label>
                    <textarea
                        value={messageEn}
                        onChange={(e) => setMessageEn(e.target.value)}
                        placeholder={isArabic ? 'أدخل الرسالة بالإنجليزية...' : 'Enter message in English...'}
                        className={cn(inputClasses, 'min-h-[100px] resize-y')}
                        dir="ltr"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">
                        {isArabic ? 'الرسالة (عربي)' : 'Message (Arabic)'}
                    </label>
                    <textarea
                        value={messageAr}
                        onChange={(e) => setMessageAr(e.target.value)}
                        placeholder={isArabic ? 'أدخل الرسالة بالعربية...' : 'Enter message in Arabic...'}
                        className={cn(inputClasses, 'min-h-[100px] resize-y')}
                        dir="rtl"
                    />
                </div>
            </div>

            {/* Audience Type */}
            <div className="space-y-3">
                <label className="text-sm font-medium">
                    {isArabic ? 'الجمهور المستهدف' : 'Target Audience'}
                </label>
                <div className="flex flex-wrap gap-2">
                    {audienceOptions.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => {
                                setAudienceType(opt.value);
                                setSelectedRoles([]);
                                setSelectedUser('');
                            }}
                            className={cn(
                                'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium border',
                                'transition-all duration-200',
                                audienceType === opt.value
                                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                    : 'bg-background text-muted-foreground border-border/60 hover:bg-muted/30'
                            )}
                        >
                            {opt.icon}
                            {isArabic ? opt.labelAr : opt.labelEn}
                        </button>
                    ))}
                </div>

                {/* Role Selector */}
                {audienceType === 'role' && (
                    <div className="space-y-2 pt-2">
                        <label className="text-xs font-medium text-muted-foreground">
                            {isArabic ? 'اختر الأدوار:' : 'Select Roles:'}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {availableRoles.map((role) => {
                                const label = ROLE_LABELS[role] ?? { en: role, ar: role };
                                const isSelected = selectedRoles.includes(role);
                                return (
                                    <button
                                        key={role}
                                        onClick={() => toggleRole(role)}
                                        className={cn(
                                            'rounded-lg px-3 py-2 text-sm font-medium border transition-all duration-200',
                                            isSelected
                                                ? 'bg-primary/10 text-primary border-primary/40'
                                                : 'bg-background text-muted-foreground border-border/40 hover:bg-muted/30'
                                        )}
                                    >
                                        {isArabic ? label.ar : label.en}
                                        {isSelected && <span className="ms-1.5">✓</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* User Selector */}
                {audienceType === 'single_user' && (
                    <div className="space-y-2 pt-2">
                        <label className="text-xs font-medium text-muted-foreground">
                            {isArabic ? 'اختر المستخدم:' : 'Select User:'}
                        </label>
                        <div className="relative">
                            <select
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                                className={selectClasses}
                            >
                                <option value="">
                                    {isArabic ? '— اختر مستخدم —' : '— Select a user —'}
                                </option>
                                {fieldUsers.map((user) => {
                                    const role = ROLE_LABELS[user.fieldRole ?? ''] ?? { en: user.fieldRole, ar: user.fieldRole };
                                    const name = isArabic
                                        ? (user.arabicName || user.fullName || 'Unknown')
                                        : (user.fullName || 'Unknown');
                                    return (
                                        <option key={user.id} value={user.id}>
                                            {name} — {isArabic ? role.ar : role.en}
                                        </option>
                                    );
                                })}
                            </select>
                            <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>
                )}
            </div>

            {/* Error / Success */}
            {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3">
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                </div>
            )}
            {success && (
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-4 py-3">
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        {isArabic ? 'تم إرسال الإشعار بنجاح!' : 'Notification sent successfully!'}
                    </p>
                </div>
            )}

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={isPending || !titleEn.trim()}
                className={cn(
                    'flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold',
                    'bg-primary text-primary-foreground hover:bg-primary/90',
                    'transition-all duration-200 shadow-sm',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'w-full md:w-auto',
                )}
            >
                {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Send className="h-4 w-4" />
                )}
                {isArabic ? 'إرسال الإشعار' : 'Send Notification'}
            </button>
        </div>
    );
}
