'use client';

import { fetchComplaintTimeline } from '@/app/[locale]/dashboard/company/complaints/actions';
import type { ComplaintRow, TimelineEntry } from '@/lib/services/complaints-service';
import { cn } from '@/lib/utils';
import {
    AlertTriangle,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    FileText,
    Inbox,
    Loader2,
    MessageSquareWarning,
    Shield,
    Timer,
    User,
    Users,
    X,
    XCircle,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { useMemo, useState } from 'react';

interface ComplaintsPanelProps {
    complaints: ComplaintRow[];
}

// ── Status Config ──
const STATUS_CONFIG: Record<string, { color: string; bgColor: string; dotColor: string; labelEn: string; labelAr: string }> = {
    pending: {
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-50 dark:bg-amber-950/30',
        dotColor: 'bg-amber-500',
        labelEn: 'Pending',
        labelAr: 'قيد الانتظار',
    },
    waiting_approval: {
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-950/30',
        dotColor: 'bg-blue-500',
        labelEn: 'Waiting Approval',
        labelAr: 'بانتظار الموافقة',
    },
    escalated: {
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-950/30',
        dotColor: 'bg-orange-500',
        labelEn: 'Escalated',
        labelAr: 'مُصعّدة',
    },
    breached: {
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-950/30',
        dotColor: 'bg-red-500',
        labelEn: 'Breached',
        labelAr: 'متجاوزة',
    },
    rejected: {
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-50 dark:bg-gray-950/30',
        dotColor: 'bg-gray-400',
        labelEn: 'Rejected',
        labelAr: 'مرفوضة',
    },
    closed: {
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
        dotColor: 'bg-emerald-500',
        labelEn: 'Closed',
        labelAr: 'مغلقة',
    },
};

// ── Action Type Labels ──
const ACTION_LABELS: Record<string, { en: string; ar: string }> = {
    OPENED: { en: 'Opened', ar: 'تم الفتح' },
    ASSIGNED: { en: 'Assigned', ar: 'تم التعيين' },
    COMMENTED: { en: 'Commented', ar: 'تعليق' },
    RESOLVED_BY_ASSIGNEE: { en: 'Resolved', ar: 'تم الحل' },
    APPROVED_BY_MANAGER: { en: 'Approved', ar: 'تمت الموافقة' },
    REJECTED_BY_MANAGER: { en: 'Rejected', ar: 'تم الرفض' },
    MANUAL_ESCALATION: { en: 'Escalated', ar: 'تم التصعيد' },
    AUTO_ESCALATION: { en: 'Auto-Escalated', ar: 'تصعيد تلقائي' },
};

const ACTIVE_STATUSES = new Set(['pending', 'waiting_approval', 'escalated', 'breached']);

function StatusBadge({ status, isArabic }: { status: string; isArabic: boolean }) {
    const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
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
        hour12: true,
    });
    const dateStrFormatted = date.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
    return `${dateStrFormatted} ${timeStr}`;
}

function formatSLARemaining(slaDeadline: string, isArabic: boolean): { text: string; isBreached: boolean } {
    const now = new Date();
    const deadline = new Date(slaDeadline);
    const diffMs = deadline.getTime() - now.getTime();

    if (diffMs <= 0) {
        const hoursAgo = Math.floor(Math.abs(diffMs) / 3600000);
        return {
            text: isArabic ? `متأخر ${hoursAgo} ساعة` : `${hoursAgo}h overdue`,
            isBreached: true,
        };
    }

    const hoursLeft = Math.floor(diffMs / 3600000);
    const minsLeft = Math.floor((diffMs % 3600000) / 60000);

    if (hoursLeft > 24) {
        const daysLeft = Math.floor(hoursLeft / 24);
        return {
            text: isArabic ? `${daysLeft} يوم متبقي` : `${daysLeft}d remaining`,
            isBreached: false,
        };
    }

    return {
        text: isArabic ? `${hoursLeft}س ${minsLeft}د متبقي` : `${hoursLeft}h ${minsLeft}m remaining`,
        isBreached: false,
    };
}

// ── Tab Key ──
type TabKey = 'active' | 'history';

// ── Main Panel ──
export function ComplaintsPanel({ complaints }: ComplaintsPanelProps) {
    const locale = useLocale();
    const isArabic = locale === 'ar';
    const [activeTab, setActiveTab] = useState<TabKey>('active');
    const [timelineModal, setTimelineModal] = useState<{ complaint: ComplaintRow; timeline: TimelineEntry[] } | null>(null);
    const [loadingTimelineId, setLoadingTimelineId] = useState<string | null>(null);

    // Split into active vs history
    const activeComplaints = useMemo(
        () => complaints.filter((c) => c.status !== null && ACTIVE_STATUSES.has(c.status)),
        [complaints]
    );
    const historyComplaints = useMemo(
        () => complaints.filter((c) => c.status === null || !ACTIVE_STATUSES.has(c.status)),
        [complaints]
    );

    const openTimeline = async (complaint: ComplaintRow) => {
        setLoadingTimelineId(complaint.id);
        try {
            const result = await fetchComplaintTimeline(complaint.id);
            setLoadingTimelineId(null);

            if (result.error) {
                console.error('Timeline fetch error:', result.error);
                return;
            }

            setTimelineModal({
                complaint,
                timeline: result.data ?? [],
            });
        } catch (err) {
            setLoadingTimelineId(null);
            console.error('Timeline fetch error:', err);
        }
    };

    const tabs: { key: TabKey; labelEn: string; labelAr: string; count: number; icon: React.ReactNode }[] = [
        {
            key: 'active',
            labelEn: 'Active Complaints',
            labelAr: 'الشكاوى النشطة',
            count: activeComplaints.length,
            icon: <AlertTriangle className="h-4 w-4" />,
        },
        {
            key: 'history',
            labelEn: 'History',
            labelAr: 'السجل',
            count: historyComplaints.length,
            icon: <CheckCircle2 className="h-4 w-4" />,
        },
    ];

    const columns = isArabic
        ? ['الحالة', 'مقدم الشكوى', 'التصنيف', 'الوصف', 'الفرع', 'القسم', 'SLA', 'تاريخ الإنشاء', 'التفاصيل']
        : ['Status', 'Requester', 'Category', 'Description', 'Branch', 'Division', 'SLA', 'Created', 'Details'];

    return (
        <div className="space-y-5">
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
                        {tab.count > 0 && (
                            <span className={cn(
                                'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold',
                                activeTab === tab.key && tab.key === 'active'
                                    ? 'bg-red-600 text-white'
                                    : activeTab === tab.key
                                        ? 'bg-primary/10 text-primary'
                                        : 'bg-muted-foreground/10 text-muted-foreground'
                            )}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Active Tab ── */}
            {activeTab === 'active' && (
                <ComplaintsTable
                    rows={activeComplaints}
                    columns={columns}
                    isArabic={isArabic}
                    loadingTimelineId={loadingTimelineId}
                    onOpenTimeline={openTimeline}
                />
            )}

            {/* ── History Tab ── */}
            {activeTab === 'history' && (
                <ComplaintsTable
                    rows={historyComplaints}
                    columns={columns}
                    isArabic={isArabic}
                    loadingTimelineId={loadingTimelineId}
                    onOpenTimeline={openTimeline}
                />
            )}

            {/* ── Timeline Modal ── */}
            {timelineModal && (
                <TimelineModal
                    complaint={timelineModal.complaint}
                    timeline={timelineModal.timeline}
                    isArabic={isArabic}
                    onClose={() => setTimelineModal(null)}
                />
            )}
        </div>
    );
}

// ── Complaints Table ──
function ComplaintsTable({
    rows,
    columns,
    isArabic,
    loadingTimelineId,
    onOpenTimeline,
}: {
    rows: ComplaintRow[];
    columns: string[];
    isArabic: boolean;
    loadingTimelineId: string | null;
    onOpenTimeline: (complaint: ComplaintRow) => void;
}) {
    return (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
            {rows.length === 0 ? (
                <div className="p-12 text-center">
                    <Inbox className="mx-auto h-12 w-12 text-muted-foreground/40" />
                    <p className="mt-4 text-sm text-muted-foreground">
                        {isArabic ? 'لا توجد شكاوى' : 'No complaints found'}
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
                            {rows.map((row) => {
                                const requester = isArabic
                                    ? (row.requesterArabicName || row.requesterName)
                                    : row.requesterName;
                                const category = isArabic
                                    ? (row.categoryNameAr || row.categoryName || '—')
                                    : (row.categoryName || '—');
                                const market = isArabic
                                    ? (row.marketNameAr || row.marketName || '—')
                                    : (row.marketName || '—');
                                const division = isArabic
                                    ? (row.divisionNameAr || row.divisionName || '—')
                                    : (row.divisionName || '—');
                                const sla = formatSLARemaining(row.slaDeadline, isArabic);
                                const isLoading = loadingTimelineId === row.id;

                                return (
                                    <tr
                                        key={row.id}
                                        className="hover:bg-muted/20 transition-colors duration-100"
                                    >
                                        <td className="px-4 py-3">
                                            <StatusBadge status={row.status ?? 'pending'} isArabic={isArabic} />
                                        </td>
                                        <td className="px-4 py-3 font-medium whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted/50">
                                                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                                                </div>
                                                {requester}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                            {category}
                                        </td>
                                        <td className="px-4 py-3 max-w-[200px] truncate text-muted-foreground" title={row.description}>
                                            {row.description}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                            {market}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                            {division}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={cn(
                                                'inline-flex items-center gap-1 text-xs font-medium',
                                                sla.isBreached
                                                    ? 'text-red-600 dark:text-red-400'
                                                    : 'text-muted-foreground',
                                            )}>
                                                <Timer className="h-3 w-3" />
                                                {sla.text}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs">
                                            {formatDateTime(row.createdAt, isArabic)}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <button
                                                onClick={() => onOpenTimeline(row)}
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
                                                    <FileText className="h-3.5 w-3.5" />
                                                )}
                                                {isArabic ? 'التفاصيل' : 'Details'}
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
    );
}

// ══════════════════════════════════════════════════════════════
// ── Timeline Modal ──
// ══════════════════════════════════════════════════════════════

function TimelineModal({
    complaint,
    timeline,
    isArabic,
    onClose,
}: {
    complaint: ComplaintRow;
    timeline: TimelineEntry[];
    isArabic: boolean;
    onClose: () => void;
}) {
    const requester = isArabic
        ? (complaint.requesterArabicName || complaint.requesterName)
        : complaint.requesterName;
    const assignee = complaint.assigneeName
        ? (isArabic ? (complaint.assigneeArabicName || complaint.assigneeName) : complaint.assigneeName)
        : null;
    const sla = formatSLARemaining(complaint.slaDeadline, isArabic);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative w-full max-w-4xl max-h-[85vh] rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 border-b border-border/60 bg-muted/20 px-6 py-4">
                    <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                <MessageSquareWarning className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h2 className="text-lg font-bold tracking-tight truncate">
                                    {isArabic ? 'تفاصيل الشكوى' : 'Complaint Details'}
                                </h2>
                                <p className="text-xs text-muted-foreground truncate">{complaint.description}</p>
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 py-4 border-b border-border/40">
                    <StatCard
                        icon={<User className="h-4 w-4" />}
                        labelEn="Requester"
                        labelAr="مقدم الشكوى"
                        value={requester}
                        isArabic={isArabic}
                    />
                    <StatCard
                        icon={<Shield className="h-4 w-4" />}
                        labelEn="Assignee"
                        labelAr="المسؤول"
                        value={assignee ?? (isArabic ? 'غير محدد' : 'Unassigned')}
                        isArabic={isArabic}
                    />
                    <StatCard
                        icon={<AlertTriangle className="h-4 w-4" />}
                        labelEn="Status"
                        labelAr="الحالة"
                        value={isArabic
                            ? (STATUS_CONFIG[complaint.status ?? '']?.labelAr ?? complaint.status ?? '—')
                            : (STATUS_CONFIG[complaint.status ?? '']?.labelEn ?? complaint.status ?? '—')}
                        isArabic={isArabic}
                        highlight={complaint.status === 'breached' ? 'red' : complaint.status === 'escalated' ? 'amber' : undefined}
                    />
                    <StatCard
                        icon={<Timer className="h-4 w-4" />}
                        labelEn="SLA"
                        labelAr="المهلة"
                        value={sla.text}
                        isArabic={isArabic}
                        highlight={sla.isBreached ? 'red' : 'green'}
                    />
                </div>

                {/* Timeline */}
                <div className="flex-1 overflow-auto px-6 py-4">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-4">
                        {isArabic ? 'مسار الشكوى' : 'Complaint Timeline'}
                        <span className="ms-2 text-xs font-normal">
                            ({timeline.length} {isArabic ? 'إجراء' : 'actions'})
                        </span>
                    </h3>

                    {timeline.length === 0 ? (
                        <div className="p-8 text-center">
                            <Clock className="mx-auto h-10 w-10 text-muted-foreground/30" />
                            <p className="mt-3 text-sm text-muted-foreground">
                                {isArabic ? 'لا توجد إجراءات بعد' : 'No actions yet'}
                            </p>
                        </div>
                    ) : (
                        <div className="relative space-y-0">
                            {/* Vertical line */}
                            <div className="absolute top-2 bottom-2 start-4 w-px bg-border/60" />

                            {timeline.map((entry, index) => {
                                const actorName = isArabic
                                    ? (entry.actorArabicName || entry.actorName || (isArabic ? 'النظام' : 'System'))
                                    : (entry.actorName || 'System');
                                const actionLabel = ACTION_LABELS[entry.actionType]
                                    ? (isArabic ? ACTION_LABELS[entry.actionType].ar : ACTION_LABELS[entry.actionType].en)
                                    : entry.actionType;
                                const message = isArabic
                                    ? (entry.messageAr || entry.messageEn || '')
                                    : (entry.messageEn || '');

                                return (
                                    <div key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
                                        {/* Dot */}
                                        <div className={cn(
                                            'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2',
                                            index === 0
                                                ? 'bg-primary border-primary text-primary-foreground'
                                                : 'bg-background border-border text-muted-foreground',
                                        )}>
                                            <ArrowUpRight className="h-3.5 w-3.5" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 pt-0.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-sm">{actorName}</span>
                                                <span className={cn(
                                                    'rounded-full px-2 py-0.5 text-[11px] font-medium',
                                                    'bg-muted/50 text-muted-foreground',
                                                )}>
                                                    {actionLabel}
                                                </span>
                                                <span className="text-[11px] text-muted-foreground">
                                                    {formatDateTime(entry.createdAt, isArabic)}
                                                </span>
                                            </div>
                                            {message && (
                                                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{message}</p>
                                            )}
                                            {entry.notes && (
                                                <p className="mt-1 text-xs text-muted-foreground/70 italic">{entry.notes}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
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
            <p className={cn('text-sm font-bold truncate', highlightClasses)}>{value}</p>
        </div>
    );
}
