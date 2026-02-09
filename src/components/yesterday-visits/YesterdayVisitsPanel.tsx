'use client';

import { useState, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { useScope } from '@/lib/context/ScopeContext';
import {
    Search,
    Clock,
    MapPin,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Timer,
    Users,
    TrendingUp,
    ChevronDown,
    ChevronUp,
    Shield,
    Pause,
} from 'lucide-react';
import type { YesterdayVisit, YesterdayVisitsStats } from '@/lib/types/yesterday-visits';
import { computeYesterdayStats } from '@/lib/types/yesterday-visits';

// ── Status Config ──
const STATUS_CONFIG: Record<string, { icon: React.ReactNode; text: string; textAr: string; color: string }> = {
    finished: { icon: <CheckCircle2 className="h-4 w-4" />, text: 'Completed', textAr: 'مكتملة', color: 'text-emerald-600 dark:text-emerald-400' },
    completed: { icon: <CheckCircle2 className="h-4 w-4" />, text: 'Completed', textAr: 'مكتملة', color: 'text-emerald-600 dark:text-emerald-400' },
    cancelled: { icon: <XCircle className="h-4 w-4" />, text: 'Cancelled', textAr: 'ملغاة', color: 'text-red-500 dark:text-red-400' },
    started: { icon: <Timer className="h-4 w-4" />, text: 'In Progress', textAr: 'قيد التنفيذ', color: 'text-yellow-600 dark:text-yellow-400' },
    in_progress: { icon: <Timer className="h-4 w-4" />, text: 'In Progress', textAr: 'قيد التنفيذ', color: 'text-yellow-600 dark:text-yellow-400' },
    pending: { icon: <Pause className="h-4 w-4" />, text: 'Pending', textAr: 'معلّقة', color: 'text-orange-500 dark:text-orange-400' },
};

const ROLE_LABELS: Record<string, { en: string; ar: string }> = {
    promoter: { en: 'Promoter', ar: 'مروّج' },
    mch: { en: 'Merchandiser', ar: 'ميرتشندايزر' },
    team_leader: { en: 'Team Leader', ar: 'قائد فريق' },
    manager: { en: 'Manager', ar: 'مدير' },
    promoplus: { en: 'Sales Promoter', ar: 'مروج بيعي' },
};

const ROLE_COLORS: Record<string, string> = {
    promoter: 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/40 dark:border-blue-800/50',
    mch: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800/50',
    team_leader: 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-800/50',
    manager: 'text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-950/40 dark:border-purple-800/50',
    promoplus: 'text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950/40 dark:border-rose-800/50',
};

// ── Helpers ──
function formatTime(dateStr: string | null): string {
    if (!dateStr) return '--:--';
    try {
        return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch { return '--:--'; }
}

function formatDuration(minutes: number | null, isArabic: boolean): string {
    if (minutes == null) return isArabic ? 'غير محدد' : 'N/A';
    if (minutes < 1) return isArabic ? 'أقل من دقيقة' : '<1 min';
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ── Stat Card ──
function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: string | number; label: string; color: string }) {
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

// ── Visit Row ──
function VisitRow({ visit, isArabic }: { visit: YesterdayVisit; isArabic: boolean }) {
    const [expanded, setExpanded] = useState(false);
    const statusKey = visit.outcomeStatus || visit.status;
    const sc = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.pending;
    const roleCls = ROLE_COLORS[visit.userRole ?? ''] ?? 'text-gray-500 bg-gray-50 border-gray-200';
    const roleLabel = ROLE_LABELS[visit.userRole ?? ''];

    const userName = isArabic ? (visit.userArabicName || visit.userName || 'بدون اسم') : (visit.userName || 'No Name');
    const branchName = isArabic ? (visit.branchNameAr || visit.branchName || 'غير محدد') : (visit.branchName || 'Unknown');

    return (
        <div className="rounded-xl border border-border bg-card/50 transition-all hover:shadow-md hover:shadow-black/5">
            <button onClick={() => setExpanded(!expanded)} className="flex w-full items-center gap-3 p-4 text-start">
                <div className={`flex-shrink-0 ${sc.color}`}>{sc.icon}</div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">{userName}</span>
                        {roleLabel && (
                            <span className={`hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${roleCls}`}>
                                {isArabic ? roleLabel.ar : roleLabel.en}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{branchName}</span>
                    </div>
                </div>
                <div className="hidden sm:flex flex-col items-end text-xs text-muted-foreground">
                    <span>{formatTime(visit.actualStart)}</span>
                    <span className="text-[10px]">→ {formatTime(visit.actualEnd)}</span>
                </div>
                <div className="hidden md:flex items-center gap-1 text-xs font-medium text-foreground min-w-[60px] justify-end">
                    <Timer className="h-3 w-3 text-muted-foreground" />
                    {formatDuration(visit.durationMinutes, isArabic)}
                </div>
                <span className={`hidden lg:inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${sc.color}`}>
                    {isArabic ? sc.textAr : sc.text}
                </span>
                {visit.isOutOfRange && <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />}
                {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>

            {expanded && (
                <div className="border-t border-border px-4 pb-4 pt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                    <div>
                        <span className="text-muted-foreground">{isArabic ? 'الحالة' : 'Status'}</span>
                        <p className={`font-semibold mt-0.5 ${sc.color}`}>{isArabic ? sc.textAr : sc.text}</p>
                    </div>
                    <div>
                        <span className="text-muted-foreground">{isArabic ? 'بداية فعلية' : 'Actual Start'}</span>
                        <p className="font-medium text-foreground mt-0.5">{formatTime(visit.actualStart)}</p>
                    </div>
                    <div>
                        <span className="text-muted-foreground">{isArabic ? 'نهاية فعلية' : 'Actual End'}</span>
                        <p className="font-medium text-foreground mt-0.5">{formatTime(visit.actualEnd)}</p>
                    </div>
                    <div>
                        <span className="text-muted-foreground">{isArabic ? 'المدة' : 'Duration'}</span>
                        <p className="font-medium text-foreground mt-0.5">{formatDuration(visit.durationMinutes, isArabic)}</p>
                    </div>
                    <div>
                        <span className="text-muted-foreground">{isArabic ? 'المصدر' : 'Source'}</span>
                        <p className="font-medium text-foreground mt-0.5">{visit.source}</p>
                    </div>
                    {visit.trustScore != null && (
                        <div>
                            <span className="text-muted-foreground flex items-center gap-1">
                                <Shield className="h-3 w-3" />{isArabic ? 'درجة الثقة' : 'Trust Score'}
                            </span>
                            <p className={`font-medium mt-0.5 ${visit.trustScore >= 80 ? 'text-emerald-600' : visit.trustScore >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                                {visit.trustScore}%
                            </p>
                        </div>
                    )}
                    {visit.isOutOfRange && (
                        <div>
                            <span className="text-muted-foreground">{isArabic ? 'خارج النطاق' : 'Out of Range'}</span>
                            <p className="font-medium text-amber-500 mt-0.5 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />{isArabic ? 'نعم' : 'Yes'}
                            </p>
                        </div>
                    )}
                    {visit.endReasonCustom && (
                        <div className="col-span-2">
                            <span className="text-muted-foreground">{isArabic ? 'سبب الإنهاء' : 'End Reason'}</span>
                            <p className="font-medium text-foreground mt-0.5">{visit.endReasonCustom}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Status Filter Options ──
const STATUS_FILTERS = [
    { key: 'all', en: 'All', ar: 'الكل' },
    { key: 'completed', en: 'Completed', ar: 'مكتمل' },
    { key: 'cancelled', en: 'Cancelled', ar: 'ملغي' },
    { key: 'in_progress', en: 'In Progress', ar: 'قيد التنفيذ' },
    { key: 'pending', en: 'Pending', ar: 'معلّقة' },
];

// ── Main Panel ──
interface YesterdayVisitsPanelProps {
    visits: YesterdayVisit[];
    stats: YesterdayVisitsStats;
}

export function YesterdayVisitsPanel({ visits, stats: initialStats }: YesterdayVisitsPanelProps) {
    const locale = useLocale();
    const isArabic = locale === 'ar';
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // ── ALL Global Scope Filters ──
    const {
        selectedTeamLeaderId,
        selectedFieldUserId,
        selectedChainId,
        selectedRegionId,
        selectedBranchId,
        filteredFieldUsers,
        filteredBranches,
    } = useScope();

    // ── Filter visits by ALL global filters ──
    const filtered = useMemo(() => {
        let result = visits;

        // 1. Branch filter (direct market_id match)
        if (selectedBranchId) {
            result = result.filter((v) => v.marketId === selectedBranchId);
        }

        // 2. Chain filter → get all branches of this chain → filter by market_id
        if (selectedChainId && !selectedBranchId) {
            const chainBranchIds = new Set(
                filteredBranches.filter((b) => b.chain_id === selectedChainId).map((b) => b.id)
            );
            if (chainBranchIds.size > 0) {
                result = result.filter((v) => chainBranchIds.has(v.marketId));
            }
        }

        // 3. Region filter → get all branches in this region → filter by market_id
        if (selectedRegionId && !selectedBranchId) {
            const regionBranchIds = new Set(
                filteredBranches.filter((b) => b.region_id === selectedRegionId).map((b) => b.id)
            );
            if (regionBranchIds.size > 0) {
                result = result.filter((v) => regionBranchIds.has(v.marketId));
            }
        }

        // 4. Field user filter (direct user_id match)
        if (selectedFieldUserId) {
            result = result.filter((v) => v.userId === selectedFieldUserId);
        }

        // 5. Team leader filter → get their team's field users → filter by user_id
        if (selectedTeamLeaderId && !selectedFieldUserId) {
            const teamUserIds = new Set(
                filteredFieldUsers
                    .filter((u) => u.team_leader_account_id === selectedTeamLeaderId)
                    .map((u) => u.user_id)
            );
            if (teamUserIds.size > 0) {
                result = result.filter((v) => teamUserIds.has(v.userId));
            }
        }

        // 6. Status filter
        if (statusFilter !== 'all') {
            result = result.filter((v) => {
                const s = v.outcomeStatus || v.status;
                if (statusFilter === 'completed') return s === 'completed' || s === 'finished';
                if (statusFilter === 'cancelled') return s === 'cancelled';
                if (statusFilter === 'in_progress') return s === 'in_progress' || s === 'started';
                if (statusFilter === 'pending') return s === 'pending';
                return true;
            });
        }

        // 7. Search
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter((v) =>
                v.userName?.toLowerCase().includes(q) ||
                v.userArabicName?.toLowerCase().includes(q) ||
                v.branchName?.toLowerCase().includes(q) ||
                v.branchNameAr?.toLowerCase().includes(q)
            );
        }

        return result;
    }, [visits, search, statusFilter, selectedFieldUserId, selectedTeamLeaderId, selectedChainId, selectedRegionId, selectedBranchId, filteredFieldUsers, filteredBranches]);

    // Recompute stats based on filtered visits
    const stats = useMemo(() => computeYesterdayStats(filtered), [filtered]);

    return (
        <div className="space-y-5">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <StatCard icon={<Users className="h-5 w-5 text-primary" />} value={stats.total} label={isArabic ? 'إجمالي الزيارات' : 'Total Visits'} color="bg-primary/10" />
                <StatCard icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} value={stats.completed} label={isArabic ? 'مكتملة' : 'Completed'} color="bg-emerald-100 dark:bg-emerald-950/40" />
                <StatCard icon={<XCircle className="h-5 w-5 text-red-500" />} value={stats.cancelled} label={isArabic ? 'ملغاة' : 'Cancelled'} color="bg-red-100 dark:bg-red-950/40" />
                <StatCard icon={<Timer className="h-5 w-5 text-yellow-600" />} value={stats.inProgress} label={isArabic ? 'قيد التنفيذ' : 'In Progress'} color="bg-yellow-100 dark:bg-yellow-950/40" />
                <StatCard icon={<TrendingUp className="h-5 w-5 text-blue-600" />} value={stats.avgDuration ? `${stats.avgDuration}m` : '--'} label={isArabic ? 'متوسط المدة' : 'Avg Duration'} color="bg-blue-100 dark:bg-blue-950/40" />
                <StatCard icon={<AlertTriangle className="h-5 w-5 text-amber-500" />} value={stats.outOfRange} label={isArabic ? 'خارج النطاق' : 'Out of Range'} color="bg-amber-100 dark:bg-amber-950/40" />
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={isArabic ? 'ابحث عن مستخدم أو فرع...' : 'Search user or branch...'}
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

            {/* Visit List */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Clock className="h-12 w-12 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                        {search || statusFilter !== 'all' || selectedTeamLeaderId || selectedFieldUserId || selectedChainId || selectedRegionId || selectedBranchId
                            ? (isArabic ? 'لا توجد نتائج مطابقة' : 'No matching visits found')
                            : (isArabic ? 'لا توجد زيارات لأمس' : 'No visits found for yesterday')}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground px-1">
                        {isArabic
                            ? `عرض ${filtered.length} من ${visits.length} زيارة`
                            : `Showing ${filtered.length} of ${visits.length} visits`}
                    </p>
                    {filtered.map((visit) => (
                        <VisitRow key={visit.visitId} visit={visit} isArabic={isArabic} />
                    ))}
                </div>
            )}
        </div>
    );
}
