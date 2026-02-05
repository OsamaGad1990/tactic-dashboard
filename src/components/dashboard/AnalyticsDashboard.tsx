// ============================================================================
// COMPONENT: AnalyticsDashboard
// Premium 2026 Circle Charts Dashboard with Filter Reactivity
// ============================================================================
'use client';

import { useChartStats } from '@/lib/hooks/useChartStats';
import { RadialChart } from '@/components/charts/RadialChart';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Loader2, TrendingUp, Clock, Package, CheckCircle, XCircle, Bell } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================
interface AnalyticsDashboardProps {
    clientId: string | null;
}

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
// COMPONENT
// ============================================================================
export function AnalyticsDashboard({ clientId }: AnalyticsDashboardProps) {
    const t = useTranslations('Dashboard.charts');
    const { data, isLoading, isFetching } = useChartStats(clientId);

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Fetching indicator */}
            {isFetching && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('updating')}</span>
                </div>
            )}

            {/* Row 1: Visit Statistics */}
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
                            value={data?.total_visits ?? 0}
                            percentage={100}
                            color="primary"
                            unit="number"
                        />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <RadialChart
                            label={t('completedVisits')}
                            value={data?.completed_visits ?? 0}
                            total={data?.total_visits ?? 1}
                            color="success"
                            unit="number"
                        />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <RadialChart
                            label={t('incompleteVisits')}
                            value={data?.incomplete_visits ?? 0}
                            total={data?.total_visits ?? 1}
                            color="warning"
                            unit="number"
                        />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <RadialChart
                            label={t('completedPercentage')}
                            value={data?.completed_percentage ?? 0}
                            percentage={data?.completed_percentage ?? 0}
                            color="success"
                            unit="percentage"
                        />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <RadialChart
                            label={t('incompletePercentage')}
                            value={data?.incomplete_percentage ?? 0}
                            percentage={data?.incomplete_percentage ?? 0}
                            color="danger"
                            unit="percentage"
                        />
                    </motion.div>
                </motion.div>
            </motion.div>

            {/* Row 2: Product & Time Statistics */}
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
                            value={data?.total_products ?? 0}
                            percentage={100}
                            color="info"
                            unit="number"
                        />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <RadialChart
                            label={t('availablePercentage')}
                            value={data?.available_percentage ?? 0}
                            percentage={data?.available_percentage ?? 0}
                            color="success"
                            unit="percentage"
                        />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <RadialChart
                            label={t('unavailablePercentage')}
                            value={data?.unavailable_percentage ?? 0}
                            percentage={data?.unavailable_percentage ?? 0}
                            color="danger"
                            unit="percentage"
                        />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <RadialChart
                            label={t('workTime')}
                            value={data?.work_time_minutes ?? 0}
                            percentage={Math.min((data?.work_time_minutes ?? 0) / 60 * 100, 100)}
                            color="primary"
                            unit="time"
                        />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <RadialChart
                            label={t('transitTime')}
                            value={data?.transit_time_minutes ?? 0}
                            percentage={Math.min((data?.transit_time_minutes ?? 0) / 60 * 100, 100)}
                            color="warning"
                            unit="time"
                        />
                    </motion.div>
                </motion.div>
            </motion.div>

            {/* Row 3: Notification Statistics */}
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
                            value={data?.total_notifications ?? 0}
                            percentage={100}
                            color="info"
                            unit="number"
                        />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <RadialChart
                            label={t('readPercentage')}
                            value={data?.read_percentage ?? 0}
                            percentage={data?.read_percentage ?? 0}
                            color="success"
                            unit="percentage"
                        />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <RadialChart
                            label={t('actionPercentage')}
                            value={data?.action_percentage ?? 0}
                            percentage={data?.action_percentage ?? 0}
                            color="primary"
                            unit="percentage"
                        />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <RadialChart
                            label={t('avgActionTime')}
                            value={data?.avg_action_time_seconds ?? 0}
                            percentage={Math.min((data?.avg_action_time_seconds ?? 0) / 7200 * 100, 100)}
                            color="success"
                            unit="timeSeconds"
                        />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <RadialChart
                            label={t('avgPendingTime')}
                            value={data?.avg_pending_time_seconds ?? 0}
                            percentage={Math.min((data?.avg_pending_time_seconds ?? 0) / 14400 * 100, 100)}
                            color="danger"
                            unit="timeSeconds"
                        />
                    </motion.div>
                </motion.div>
            </motion.div>
        </div>
    );
}
