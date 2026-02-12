// ============================================================================
// DASHBOARD STATS GRID — Reactive Data Container for StatCards
//
// Architecture:
//   Calls useDashboardData() directly → reactive to GlobalFilter changes.
//   Must be rendered INSIDE a ScopeProvider (e.g. as a child of DynamicDashboard).
//
// Layout:
//   Row 1: Visits     — Total | Completion Ring | In Progress | Cancelled
//   Row 2: Workforce  — Availability Ring | Work Time | Travel Time | Products
//   Row 3: Notifications — Total Sent | Read Rate Ring | Execution Rate Ring
// ============================================================================
'use client';

import {
    BarChart3,
    Bell,
    BellRing,
    Car,
    CheckCircle2,
    Clock,
    Loader2,
    MapPin,
    Package,
    Play,
    Users,
    XCircle,
    AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocale } from 'next-intl';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import { StatCard, StatCardSkeleton } from './stat-card';
import { formatDuration } from '@/utils/format-duration';

// ============================================================================
// SECTION HEADER
// ============================================================================
function SectionHeader({
    icon: Icon,
    title,
    className,
}: {
    icon: React.ElementType;
    title: string;
    className?: string;
}) {
    return (
        <div className={cn('flex items-center gap-2 pb-3', className)}>
            <Icon className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
    );
}

// ============================================================================
// SKELETON GRID (3 rows matching the real layout)
// ============================================================================
function StatsGridSkeleton() {
    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Visits skeleton */}
            <section>
                <div className="h-5 w-32 rounded bg-muted animate-pulse mb-4" />
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <StatCardSkeleton key={`v-${i}`} />
                    ))}
                </div>
            </section>

            {/* Workforce skeleton */}
            <section>
                <div className="h-5 w-36 rounded bg-muted animate-pulse mb-4" />
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <StatCardSkeleton key={`w-${i}`} />
                    ))}
                </div>
            </section>

            {/* Notifications skeleton */}
            <section>
                <div className="h-5 w-28 rounded bg-muted animate-pulse mb-4" />
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <StatCardSkeleton key={`n-${i}`} />
                    ))}
                </div>
            </section>
        </div>
    );
}

// ============================================================================
// ERROR STATE
// ============================================================================
function StatsGridError({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div className="text-center space-y-1">
                <h3 className="text-lg font-semibold text-foreground">
                    Failed to load metrics
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                    {message}
                </p>
            </div>
        </div>
    );
}

// ============================================================================
// MAIN: DashboardStatsGrid
//
// ⚡ Reactive: useDashboardData queryKey includes market IDs + dates.
//    Any GlobalFilter change → ScopeContext update → queryKey change → re-fetch.
// ============================================================================
export function DashboardStatsGrid() {
    const { data, isLoading, isError, error } = useDashboardData();
    const locale = useLocale();
    const isAr = locale === 'ar';

    // ── Loading ──────────────────────────────────────────────
    if (isLoading) return <StatsGridSkeleton />;
    if (isError) return <StatsGridError message={error?.message ?? 'Unknown error'} />;
    if (!data) return <StatsGridSkeleton />;

    // ── Destructure metrics ──────────────────────────────────
    const { visits, workforce, notifications } = data;

    return (
        <div className="space-y-8 animate-in fade-in-50 duration-500">
            {/* ════════════════════════════════════════════════ */}
            {/* ROW 1: VISITS                                   */}
            {/* ════════════════════════════════════════════════ */}
            <section>
                <SectionHeader
                    icon={MapPin}
                    title={isAr ? 'الزيارات' : 'Visits'}
                />
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label={isAr ? 'إجمالي الزيارات' : 'Total Visits'}
                        value={visits.total_visits}
                        icon={BarChart3}
                        variant="gold"
                    />
                    <StatCard
                        mode="ring"
                        label={isAr ? 'نسبة الإنجاز' : 'Completion Rate'}
                        percentage={visits.completion_rate}
                        icon={CheckCircle2}
                        variant="success"
                        subtitle={`${visits.completed_visits} / ${visits.total_visits}`}
                    />
                    <StatCard
                        label={isAr ? 'قيد التنفيذ' : 'In Progress'}
                        value={visits.in_progress}
                        icon={Loader2}
                        variant="info"
                    />
                    <StatCard
                        label={isAr ? 'ملغاة' : 'Cancelled'}
                        value={visits.cancelled_visits}
                        icon={XCircle}
                        variant="danger"
                    />
                </div>
            </section>

            {/* ════════════════════════════════════════════════ */}
            {/* ROW 2: WORKFORCE                                */}
            {/* ════════════════════════════════════════════════ */}
            <section>
                <SectionHeader
                    icon={Users}
                    title={isAr ? 'القوى العاملة' : 'Workforce'}
                />
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        mode="ring"
                        label={isAr ? 'التوفر' : 'Availability'}
                        percentage={workforce.availability_rate}
                        icon={Package}
                        variant="success"
                        subtitle={`${workforce.available_count} / ${workforce.available_count + workforce.unavailable_count}`}
                    />
                    <StatCard
                        label={isAr ? 'وقت العمل' : 'Work Time'}
                        value={formatDuration(workforce.total_work_minutes)}
                        icon={Clock}
                        variant="gold"
                        subtitle={`${isAr ? 'متوسط' : 'Avg'} ${formatDuration(workforce.avg_work_minutes_per_visit)}/${isAr ? 'زيارة' : 'visit'}`}
                    />
                    <StatCard
                        label={isAr ? 'وقت التنقل' : 'Travel Time'}
                        value={formatDuration(workforce.total_travel_minutes)}
                        icon={Car}
                        variant="info"
                        subtitle={`${isAr ? 'التنقل' : 'Commute'}: ${formatDuration(workforce.total_commute_minutes)}`}
                    />
                    <StatCard
                        label={isAr ? 'المنتجات' : 'Total Products'}
                        value={workforce.total_products}
                        icon={Package}
                        variant="default"
                    />
                </div>
            </section>

            {/* ════════════════════════════════════════════════ */}
            {/* ROW 3: NOTIFICATIONS                            */}
            {/* ════════════════════════════════════════════════ */}
            <section>
                <SectionHeader
                    icon={Bell}
                    title={isAr ? 'الإشعارات' : 'Notifications'}
                />
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                    <StatCard
                        label={isAr ? 'إجمالي المرسل' : 'Total Sent'}
                        value={notifications.total}
                        icon={BellRing}
                        variant="gold"
                        subtitle={`${isAr ? 'متوسط الانتظار' : 'Avg wait'}: ${notifications.avg_wait_hours.toFixed(1)}${isAr ? 'س' : 'h'}`}
                    />
                    <StatCard
                        mode="ring"
                        label={isAr ? 'نسبة القراءة' : 'Read Rate'}
                        percentage={notifications.read_rate}
                        icon={Bell}
                        variant="info"
                        subtitle={`${notifications.read_count} ${isAr ? 'مقروءة' : 'read'}`}
                    />
                    <StatCard
                        mode="ring"
                        label={isAr ? 'نسبة التنفيذ' : 'Execution Rate'}
                        percentage={notifications.execution_rate}
                        icon={Play}
                        variant="success"
                        subtitle={`${notifications.acted_count} ${isAr ? 'منفذة' : 'acted'}`}
                    />
                </div>
            </section>
        </div>
    );
}
