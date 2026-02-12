// ============================================================================
// COMPONENT: AnalyticsDashboard
// Premium 2026 Ring-Chart Grid — Self-Contained Executive View
//
// Architecture:
//   Calls useDashboardData() directly (zero props).
//   Must be rendered INSIDE a ScopeProvider (e.g. as child of DynamicDashboard).
//   Reactive to GlobalFilter changes via ScopeContext → queryKey invalidation.
//
// Layout:
//   Row 1: Visit Statistics      — 5 RadialChart rings
//   Row 2: Products & Time       — 5 RadialChart rings
//   Row 3: Notification Stats    — 5 RadialChart rings
// ============================================================================
'use client';

import { useDashboardData } from '@/lib/hooks/useDashboardData';
import { RadialChart } from '@/components/charts/RadialChart';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
    Loader2,
    TrendingUp,
    Package,
    Bell,
    AlertTriangle,
} from 'lucide-react';

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

// ============================================================================
// ERROR STATE
// ============================================================================
function ChartGridError({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div className="text-center space-y-1">
                <h3 className="text-lg font-semibold text-foreground">
                    Failed to load charts
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                    {message}
                </p>
            </div>
        </div>
    );
}

// ============================================================================
// LOADING SKELETON (3 rows of shimmer circles)
// ============================================================================
function ChartGridSkeleton() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {[5, 5, 5].map((count, rowIdx) => (
                <div key={`row-${rowIdx}`} className="space-y-4">
                    <div className="h-5 w-36 rounded bg-muted animate-pulse" />
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {Array.from({ length: count }).map((_, i) => (
                            <div
                                key={`sk-${rowIdx}-${i}`}
                                className="flex flex-col items-center p-4 bg-card/50 rounded-2xl border border-white/10"
                            >
                                <div className="w-[100px] h-[100px] rounded-full bg-muted/30 animate-pulse" />
                                <div className="mt-3 h-4 w-20 rounded bg-muted/30 animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ============================================================================
// COMPONENT: Self-contained Ring Grid
// ============================================================================
export function AnalyticsDashboard() {
    const t = useTranslations('Dashboard.charts');
    const { data, isLoading, isError, error, isFetching } = useDashboardData();

    // ── Loading ──────────────────────────────────────────────
    if (isLoading) return <ChartGridSkeleton />;
    if (isError) return <ChartGridError message={error?.message ?? 'Unknown error'} />;
    if (!data) return <ChartGridSkeleton />;

    // ── Destructure metrics ─────────────────────────────────
    const { visits, workforce, notifications } = data;

    // Pre-compute derived values
    const incompletePercentage = visits.total_visits > 0
        ? Math.round((visits.incomplete_visits / visits.total_visits) * 1000) / 10
        : 0;

    const unavailablePercentage = workforce.total_products > 0
        ? Math.round((1 - workforce.availability_rate / 100) * 1000) / 10
        : 0;

    const avgWaitMinutes = notifications.avg_wait_hours * 60;

    return (
        <div className="space-y-6">
            {/* Fetching indicator (background re-fetch) */}
            {isFetching && !isLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('updating')}</span>
                </div>
            )}

            {/* ════════════════════════════════════════════════ */}
            {/* ROW 1: Visit Statistics                          */}
            {/* ════════════════════════════════════════════════ */}
            <motion.div
                className="space-y-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">{t('visitStatistics')}</h3>
                </div>

                <motion.div
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
                    variants={containerVariants}
                >
                    <motion.div variants={itemVariants}>
                        <RadialChart
                            label={t('totalVisits')}
                            value={visits.total_visits}
                            percentage={100}
                            color="primary"
                            unit="number"
                        />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <RadialChart
                            label={t('completedVisits')}
                            value={visits.completed_visits}
                            total={visits.total_visits || 1}
                            color="success"
                            unit="number"
                        />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <RadialChart
                            label={t('incompleteVisits')}
                            value={visits.incomplete_visits}
                            total={visits.total_visits || 1}
                            color="warning"
                            unit="number"
                        />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <RadialChart
                            label={t('completedPercentage')}
                            value={visits.completion_rate}
                            percentage={visits.completion_rate}
                            color="success"
                            unit="percentage"
                        />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <RadialChart
                            label={t('incompletePercentage')}
                            value={incompletePercentage}
                            percentage={incompletePercentage}
                            color="danger"
                            unit="percentage"
                        />
                    </motion.div>
                </motion.div>
            </motion.div>

            {/* ════════════════════════════════════════════════ */}
            {/* ROW 2: Products & Time Statistics                */}
            {/* ════════════════════════════════════════════════ */}
            <motion.div
                className="space-y-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">{t('productTimeStatistics')}</h3>
                </div>

                <motion.div
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
                    variants={containerVariants}
                >
                    <motion.div variants={itemVariants}>
                        <RadialChart
                            label={t('totalProducts')}
                            value={workforce.total_products}
                            percentage={100}
                            color="info"
                            unit="number"
                        />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <RadialChart
                            label={t('availablePercentage')}
                            value={workforce.availability_rate}
                            percentage={workforce.availability_rate}
                            color="success"
                            unit="percentage"
                        />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <RadialChart
                            label={t('unavailablePercentage')}
                            value={unavailablePercentage}
                            percentage={unavailablePercentage}
                            color="danger"
                            unit="percentage"
                        />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <RadialChart
                            label={t('workTime')}
                            value={workforce.total_work_minutes}
                            percentage={Math.min((workforce.total_work_minutes / 60) * 100, 100)}
                            color="primary"
                            unit="time"
                        />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <RadialChart
                            label={t('transitTime')}
                            value={workforce.total_travel_minutes}
                            percentage={Math.min((workforce.total_travel_minutes / 60) * 100, 100)}
                            color="warning"
                            unit="time"
                        />
                    </motion.div>
                </motion.div>
            </motion.div>

            {/* ════════════════════════════════════════════════ */}
            {/* ROW 3: Notification Statistics                   */}
            {/* ════════════════════════════════════════════════ */}
            <motion.div
                className="space-y-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">{t('notificationStatistics')}</h3>
                </div>

                <motion.div
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
                    variants={containerVariants}
                >
                    <motion.div variants={itemVariants}>
                        <RadialChart
                            label={t('totalNotifications')}
                            value={notifications.total}
                            percentage={100}
                            color="info"
                            unit="number"
                        />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <RadialChart
                            label={t('readPercentage')}
                            value={notifications.read_rate}
                            percentage={notifications.read_rate}
                            color="success"
                            unit="percentage"
                        />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <RadialChart
                            label={t('actionPercentage')}
                            value={notifications.execution_rate}
                            percentage={notifications.execution_rate}
                            color="primary"
                            unit="percentage"
                        />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <RadialChart
                            label={t('avgActionTime')}
                            value={avgWaitMinutes}
                            percentage={Math.min((notifications.avg_wait_hours / 120) * 100, 100)}
                            color="success"
                            unit="time"
                        />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <RadialChart
                            label={t('avgPendingTime')}
                            value={avgWaitMinutes}
                            percentage={Math.min((notifications.avg_wait_hours / 240) * 100, 100)}
                            color="danger"
                            unit="time"
                        />
                    </motion.div>
                </motion.div>
            </motion.div>
        </div>
    );
}
