'use client';

import { approveRequest, rejectRequest } from '@/app/[locale]/dashboard/company/visit-requests/actions';
import type { VisitRequest, VisitRequestRow } from '@/lib/services/visit-requests-service';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/providers/toast-provider';
import {
    ArrowRight,
    Ban,
    Check,
    CheckCircle2,
    Clock,
    Inbox,
    MessageSquare,
    Timer,
    User,
    X,
    XCircle,
    Zap,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useTransition } from 'react';
import { useFilters } from '@/lib/context/FilterContext';

interface VisitRequestsPanelProps {
    pendingRequests: VisitRequest[];
    allRequests: VisitRequestRow[];
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
    approved: {
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
        dotColor: 'bg-emerald-500',
        labelEn: 'Approved',
        labelAr: 'تمت الموافقة',
    },
    rejected: {
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-950/30',
        dotColor: 'bg-red-500',
        labelEn: 'Rejected',
        labelAr: 'مرفوض',
    },
    cancelled: {
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-50 dark:bg-gray-950/30',
        dotColor: 'bg-gray-400',
        labelEn: 'Cancelled',
        labelAr: 'ملغي',
    },
    auto_approved: {
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-950/30',
        dotColor: 'bg-blue-500',
        labelEn: 'Auto-Approved',
        labelAr: 'موافقة تلقائية',
    },
    expired: {
        color: 'text-gray-500 dark:text-gray-500',
        bgColor: 'bg-gray-50 dark:bg-gray-950/20',
        dotColor: 'bg-gray-400',
        labelEn: 'Expired',
        labelAr: 'منتهي',
    },
};

function formatTimeAgo(dateStr: string, isArabic: boolean): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return isArabic ? 'الآن' : 'Just now';
    if (diffMins < 60) return isArabic ? `منذ ${diffMins} دقيقة` : `${diffMins}m ago`;
    if (diffHours < 24) return isArabic ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
    return isArabic ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
}

function formatWaitTime(seconds: number | null, isArabic: boolean): string {
    if (!seconds || seconds <= 0) return '—';
    if (seconds < 60) return isArabic ? `${seconds} ث` : `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) return isArabic ? `${mins} د ${secs > 0 ? `${secs} ث` : ''}`.trim() : `${mins}m ${secs > 0 ? `${secs}s` : ''}`.trim();
    const hours = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return isArabic ? `${hours} س ${remainMins} د` : `${hours}h ${remainMins}m`;
}

function formatDateTime(dateStr: string, isArabic: boolean): string {
    const date = new Date(dateStr);
    const timeStr = date.toLocaleTimeString(isArabic ? 'ar-EG' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
    const dateStrFormatted = date.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric',
    });
    return `${dateStrFormatted} ${timeStr}`;
}

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

// ── Pending Request Card ──
function PendingRequestCard({ request, isArabic }: { request: VisitRequest; isArabic: boolean }) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const toast = useToast();

    const handleApprove = () => {
        setError(null);
        startTransition(async () => {
            const result = await approveRequest(request.id);
            if (result.success) {
                toast.success(isArabic ? 'تم قبول الطلب' : 'Request approved');
                router.refresh();
            } else if (result.error === 'APPROVAL_EXPIRED_12H') {
                const msg = isArabic
                    ? 'لا يمكن قبول طلب مرّ عليه أكثر من 12 ساعة. يرجى الرفض أو التجاهل.'
                    : 'Cannot approve request older than 12 hours. Please reject or ignore.';
                setError(msg);
                toast.warning(msg);
            } else {
                const msg = result.error ?? (isArabic ? 'حدث خطأ' : 'An error occurred');
                setError(msg);
                toast.error(msg);
            }
        });
    };

    const handleReject = () => {
        setError(null);
        startTransition(async () => {
            const result = await rejectRequest(request.id);
            if (result.success) {
                toast.info(isArabic ? 'تم رفض الطلب' : 'Request rejected');
                router.refresh();
            }
        });
    };

    const requesterName = isArabic
        ? (request.requesterArabicName || request.requesterName)
        : request.requesterName;

    return (
        <div className={cn(
            'group relative rounded-xl border p-4 transition-all duration-200',
            'bg-card hover:bg-card/80 hover:shadow-md',
            'border-amber-200/50 dark:border-amber-800/30',
            isPending && 'opacity-60 pointer-events-none'
        )}>
            <div className="flex items-start gap-3 mb-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/50">
                    <User className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{requesterName}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTimeAgo(request.requestedAt, isArabic)}
                </span>
            </div>

            {request.reasonCustom && (
                <div className="flex items-start gap-2 mb-3 px-1">
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">{request.reasonCustom}</p>
                </div>
            )}

            <div className="flex gap-2">
                <button
                    onClick={handleApprove}
                    disabled={isPending}
                    className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium',
                        'bg-emerald-600 hover:bg-emerald-700 text-white transition-colors duration-150 disabled:opacity-50'
                    )}
                >
                    <Check className="h-4 w-4" />
                    {isArabic ? 'موافقة' : 'Approve'}
                </button>
                <button
                    onClick={handleReject}
                    disabled={isPending}
                    className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium',
                        'bg-red-600 hover:bg-red-700 text-white transition-colors duration-150 disabled:opacity-50'
                    )}
                >
                    <X className="h-4 w-4" />
                    {isArabic ? 'رفض' : 'Reject'}
                </button>
            </div>

            {/* ⏰ Error display (e.g. 12-hour expiry) */}
            {error && (
                <div className="mt-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2">
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
                </div>
            )}

            {isPending && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/50 backdrop-blur-sm">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
            )}
        </div>
    );
}

// ── Tab Key ──
type TabKey = 'pending' | 'history';

// ── Main Panel ──
export function VisitRequestsPanel({ pendingRequests, allRequests }: VisitRequestsPanelProps) {
    const locale = useLocale();
    const isArabic = locale === 'ar';
    const [activeTab, setActiveTab] = useState<TabKey>('pending');
    const { filters } = useFilters();

    // ── Apply global filters (date range + field staff) ──
    const filterByDateAndStaff = useMemo(() => {
        return <T extends { requestedAt: string; requesterAccountId: string }>(items: T[]) => {
            return items.filter((item) => {
                // Date range filter
                if (filters.dateRange.from) {
                    const d = new Date(item.requestedAt);
                    const from = new Date(filters.dateRange.from);
                    from.setHours(0, 0, 0, 0);
                    if (d < from) return false;
                }
                if (filters.dateRange.to) {
                    const d = new Date(item.requestedAt);
                    const to = new Date(filters.dateRange.to);
                    to.setHours(23, 59, 59, 999);
                    if (d > to) return false;
                }
                // Field staff filter
                if (filters.fieldStaffId && item.requesterAccountId !== filters.fieldStaffId) {
                    return false;
                }
                return true;
            });
        };
    }, [filters.dateRange.from, filters.dateRange.to, filters.fieldStaffId]);

    const filteredPending = useMemo(() => filterByDateAndStaff(pendingRequests), [filterByDateAndStaff, pendingRequests]);
    const filteredAll = useMemo(() => filterByDateAndStaff(allRequests), [filterByDateAndStaff, allRequests]);

    const tabs: { key: TabKey; labelEn: string; labelAr: string; count: number; icon: React.ReactNode }[] = [
        {
            key: 'pending',
            labelEn: 'Pending Requests',
            labelAr: 'الطلبات المعلقة',
            count: filteredPending.length,
            icon: <Clock className="h-4 w-4" />,
        },
        {
            key: 'history',
            labelEn: 'Decision History',
            labelAr: 'سجل القرارات',
            count: filteredAll.filter(r => r.status !== 'pending').length,
            icon: <CheckCircle2 className="h-4 w-4" />,
        },
    ];

    // History = all non-pending requests
    const historyRows = filteredAll.filter(r => r.status !== 'pending');

    // Table column headers
    const columns = isArabic
        ? ['الحالة', 'مقدم الطلب', 'المُعتمد', 'الفرع', 'السبب', 'وقت الانتظار', 'وقت الطلب', 'وقت القرار']
        : ['Status', 'Requester', 'Approver', 'Branch', 'Reason', 'Wait Time', 'Requested', 'Decided'];

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
                                activeTab === tab.key && tab.key === 'pending'
                                    ? 'bg-amber-600 text-white'
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

            {/* ── Pending Tab ── */}
            {activeTab === 'pending' && (
                <div className="space-y-3">
                    {filteredPending.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
                            <Inbox className="mx-auto h-12 w-12 text-muted-foreground/40" />
                            <p className="mt-4 text-sm text-muted-foreground">
                                {isArabic ? 'لا توجد طلبات معلقة' : 'No pending requests'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                            {filteredPending.map((request) => (
                                <PendingRequestCard
                                    key={request.id}
                                    request={request}
                                    isArabic={isArabic}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── History Tab (Data Table) ── */}
            {activeTab === 'history' && (
                <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
                    {historyRows.length === 0 ? (
                        <div className="p-12 text-center">
                            <Inbox className="mx-auto h-12 w-12 text-muted-foreground/40" />
                            <p className="mt-4 text-sm text-muted-foreground">
                                {isArabic ? 'لا يوجد سجل قرارات بعد' : 'No decisions yet'}
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
                                    {historyRows.map((row) => {
                                        const requester = isArabic
                                            ? (row.requesterArabicName || row.requesterName)
                                            : row.requesterName;
                                        const approver = row.approverName
                                            ? (isArabic ? (row.approverArabicName || row.approverName) : row.approverName)
                                            : (row.autoApproved
                                                ? (isArabic ? 'النظام' : 'System')
                                                : '—');

                                        return (
                                            <tr
                                                key={row.id}
                                                className="hover:bg-muted/20 transition-colors duration-100"
                                            >
                                                <td className="px-4 py-3">
                                                    <StatusBadge
                                                        status={row.autoApproved ? 'auto_approved' : row.status}
                                                        isArabic={isArabic}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 font-medium whitespace-nowrap">
                                                    {requester}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                                    {approver}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                                    {isArabic
                                                        ? (row.marketNameAr || row.marketName || '—')
                                                        : (row.marketName || '—')}
                                                </td>
                                                <td className="px-4 py-3 max-w-[200px] truncate text-muted-foreground" title={row.reasonCustom ?? ''}>
                                                    {row.reasonCustom || '—'}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {row.waitSeconds && row.waitSeconds > 0 ? (
                                                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                                                            <Timer className="h-3 w-3" />
                                                            {formatWaitTime(row.waitSeconds, isArabic)}
                                                        </span>
                                                    ) : '—'}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs">
                                                    {formatDateTime(row.requestedAt, isArabic)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs">
                                                    {row.decidedAt ? formatDateTime(row.decidedAt, isArabic) : '—'}
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
        </div>
    );
}
