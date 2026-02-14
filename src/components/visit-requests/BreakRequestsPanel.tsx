'use client';

import { approveBreakRequest, rejectBreakRequest } from '@/app/[locale]/dashboard/company/visit-requests/actions';
import type { BreakRequest, BreakRequestRow } from '@/lib/services/break-requests-service';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/providers/toast-provider';
import {
    Check,
    CheckCircle2,
    Clock,
    Coffee,
    Inbox,
    Timer,
    User,
    X,
    XCircle,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useTransition } from 'react';
import { useFilters } from '@/lib/context/FilterContext';
import { useScope } from '@/lib/context/ScopeContext';

interface BreakRequestsPanelProps {
    pendingRequests: BreakRequest[];
    allRequests: BreakRequestRow[];
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
function PendingBreakCard({ request, isArabic }: { request: BreakRequest; isArabic: boolean }) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const toast = useToast();

    const handleApprove = () => {
        setError(null);
        startTransition(async () => {
            const result = await approveBreakRequest(request.id);
            if (result.success) {
                toast.success(isArabic ? 'تم قبول طلب الاستراحة' : 'Break request approved');
                router.refresh();
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
            const result = await rejectBreakRequest(request.id);
            if (result.success) {
                toast.info(isArabic ? 'تم رفض طلب الاستراحة' : 'Break request rejected');
                router.refresh();
            } else {
                const msg = result.error ?? (isArabic ? 'حدث خطأ' : 'An error occurred');
                setError(msg);
                toast.error(msg);
            }
        });
    };

    const userName = isArabic
        ? (request.userArabicName || request.userName)
        : request.userName;

    return (
        <div className={cn(
            'group relative rounded-xl border p-4 transition-all duration-200',
            'bg-card hover:bg-card/80 hover:shadow-md',
            'border-amber-200/50 dark:border-amber-800/30',
            isPending && 'opacity-60 pointer-events-none'
        )}>
            <div className="flex items-start gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 shrink-0">
                    <Coffee className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm truncate">{userName}</p>
                        <StatusBadge status="pending" isArabic={isArabic} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {formatTimeAgo(request.createdAt, isArabic)}
                    </p>
                </div>
            </div>

            {/* Duration info */}
            <div className="flex items-center gap-2 mb-2 text-sm">
                <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">
                    {isArabic ? 'المدة المطلوبة:' : 'Duration:'}
                </span>
                <span className="font-semibold text-foreground">
                    {request.requestedMinutes} {isArabic ? 'دقيقة' : 'min'}
                </span>
            </div>


            {/* Error */}
            {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/30 p-2.5 mb-3">
                    <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={handleApprove}
                    disabled={isPending}
                    className={cn(
                        'flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2',
                        'text-xs font-semibold transition-all duration-200',
                        'bg-emerald-500 hover:bg-emerald-600 text-white',
                        'shadow-sm hover:shadow-md',
                        isPending && 'opacity-50 cursor-not-allowed',
                    )}
                >
                    <Check className="h-3.5 w-3.5" />
                    {isArabic ? 'قبول' : 'Approve'}
                </button>
                <button
                    onClick={handleReject}
                    disabled={isPending}
                    className={cn(
                        'flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2',
                        'text-xs font-semibold transition-all duration-200',
                        'bg-red-500 hover:bg-red-600 text-white',
                        'shadow-sm hover:shadow-md',
                        isPending && 'opacity-50 cursor-not-allowed',
                    )}
                >
                    <X className="h-3.5 w-3.5" />
                    {isArabic ? 'رفض' : 'Reject'}
                </button>
            </div>
        </div>
    );
}

// ── Tab Key ──
type TabKey = 'pending' | 'history';

// ── Main Panel ──
export function BreakRequestsPanel({ pendingRequests, allRequests }: BreakRequestsPanelProps) {
    const locale = useLocale();
    const isArabic = locale === 'ar';
    const [activeTab, setActiveTab] = useState<TabKey>('pending');

    // ── Cascade Filters ──
    const { filters } = useFilters();
    const { scope } = useScope();

    // Build user → TL mapping for team leader filtering
    const fieldUserToTL = useMemo(() => {
        const map = new Map<string, string | null>();
        if (scope?.field_users) {
            for (const fu of scope.field_users) {
                map.set(fu.user_id, fu.team_leader_account_id);
            }
        }
        return map;
    }, [scope?.field_users]);

    // ── Apply global filters ──
    const filterItems = useMemo(() => {
        return <T extends { createdAt: string; userId: string }>(items: T[]) => {
            return items.filter((item) => {
                // Date range filter
                if (filters.dateRange.from) {
                    const d = new Date(item.createdAt);
                    const from = new Date(filters.dateRange.from);
                    from.setHours(0, 0, 0, 0);
                    if (d < from) return false;
                }
                if (filters.dateRange.to) {
                    const d = new Date(item.createdAt);
                    const to = new Date(filters.dateRange.to);
                    to.setHours(23, 59, 59, 999);
                    if (d > to) return false;
                }
                // Field staff filter
                if (filters.fieldStaffId && item.userId !== filters.fieldStaffId) {
                    return false;
                }
                // Team leader filter
                if (filters.teamLeaderId) {
                    const userTL = fieldUserToTL.get(item.userId);
                    if (userTL !== filters.teamLeaderId) return false;
                }
                return true;
            });
        };
    }, [filters.dateRange.from, filters.dateRange.to, filters.fieldStaffId, filters.teamLeaderId, fieldUserToTL]);

    const filteredPending = useMemo(() => filterItems(pendingRequests), [filterItems, pendingRequests]);
    const filteredHistory = useMemo(
        () => filterItems(allRequests).filter(r => r.status !== 'pending'),
        [filterItems, allRequests]
    );

    const tabs: { key: TabKey; labelEn: string; labelAr: string; count: number; icon: React.ReactNode }[] = [
        {
            key: 'pending',
            labelEn: 'Pending',
            labelAr: 'المعلقة',
            count: filteredPending.length,
            icon: <Clock className="h-4 w-4" />,
        },
        {
            key: 'history',
            labelEn: 'History',
            labelAr: 'السجل',
            count: filteredHistory.length,
            icon: <CheckCircle2 className="h-4 w-4" />,
        },
    ];

    return (
        <div className="space-y-4">
            {/* Inner Tabs */}
            <div className="flex gap-1 rounded-xl bg-muted/50 p-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                            'flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200',
                            activeTab === tab.key
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-card/50',
                        )}
                    >
                        {tab.icon}
                        <span>{isArabic ? tab.labelAr : tab.labelEn}</span>
                        <span className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-bold',
                            activeTab === tab.key
                                ? 'bg-primary/10 text-primary'
                                : 'bg-muted text-muted-foreground',
                        )}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'pending' && (
                <div>
                    {filteredPending.length === 0 ? (
                        <div className="rounded-xl border border-border bg-card/50 p-12 text-center">
                            <Inbox className="mx-auto h-12 w-12 text-muted-foreground/30" />
                            <h3 className="mt-4 text-lg font-medium text-muted-foreground">
                                {isArabic ? 'لا توجد طلبات استراحة معلقة' : 'No pending break requests'}
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground/70">
                                {isArabic
                                    ? 'ستظهر الطلبات الجديدة هنا تلقائياً'
                                    : 'New requests will appear here automatically'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredPending.map((request) => (
                                <PendingBreakCard key={request.id} request={request} isArabic={isArabic} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'history' && (
                <div>
                    {filteredHistory.length === 0 ? (
                        <div className="rounded-xl border border-border bg-card/50 p-12 text-center">
                            <Inbox className="mx-auto h-12 w-12 text-muted-foreground/30" />
                            <h3 className="mt-4 text-lg font-medium text-muted-foreground">
                                {isArabic ? 'لا يوجد سجل' : 'No history'}
                            </h3>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-border overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/30">
                                            <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <User className="h-3.5 w-3.5" />
                                                    {isArabic ? 'الموظف' : 'Agent'}
                                                </div>
                                            </th>
                                            <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <Timer className="h-3.5 w-3.5" />
                                                    {isArabic ? 'المدة' : 'Duration'}
                                                </div>
                                            </th>
                                            <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                                                {isArabic ? 'الحالة' : 'Status'}
                                            </th>
                                            <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                                                {isArabic ? 'بواسطة' : 'Decided By'}
                                            </th>
                                            <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                                                {isArabic ? 'التاريخ' : 'Date'}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredHistory.map((row) => {
                                            const name = isArabic
                                                ? (row.userArabicName || row.userName)
                                                : row.userName;
                                            const approver = isArabic
                                                ? (row.approverArabicName || row.approverName)
                                                : row.approverName;
                                            return (
                                                <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                                                    <td className="px-4 py-3 font-medium">{name}</td>
                                                    <td className="px-4 py-3">
                                                        {row.requestedMinutes} {isArabic ? 'دقيقة' : 'min'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <StatusBadge status={row.status} isArabic={isArabic} />
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {approver ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground text-xs">
                                                        {formatDateTime(row.createdAt, isArabic)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
