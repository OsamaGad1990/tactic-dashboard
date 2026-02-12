// ============================================================================
// HOOK: useChartStats
// Purpose: Bridge AnalyticsDashboard circle charts → get_dashboard_ops_metrics RPC
//
// Architecture (v2 — RPC-backed):
//   Previously called getChartStats() server action (separate SQL queries).
//   Now bridges to useDashboardData() so a SINGLE RPC call powers BOTH
//   the circle charts AND the stat cards. This eliminates double-fetching
//   and ensures data consistency between the two views.
// ============================================================================
'use client';

import { useMemo } from 'react';
import { useDashboardData } from './useDashboardData';
import type { ChartStatsResult } from '@/lib/actions/chart-stats';

// ============================================================================
// HOOK
// ============================================================================
export function useChartStats(clientId: string | null, divisionId?: string | null) {
    // Reuse the single RPC call from useDashboardData
    const query = useDashboardData();

    // Map DashboardMetrics → ChartStatsResult
    const data = useMemo((): ChartStatsResult | undefined => {
        if (!query.data) return undefined;

        const { visits, workforce, notifications } = query.data;

        return {
            // Row 1: Visit Metrics
            total_visits: visits.total_visits,
            completed_visits: visits.completed_visits,
            incomplete_visits: visits.incomplete_visits,
            completed_percentage: visits.completion_rate,
            incomplete_percentage: visits.total_visits > 0
                ? Math.round((visits.incomplete_visits / visits.total_visits) * 1000) / 10
                : 0,

            // Row 2: Product & Time Metrics
            total_products: workforce.total_products,
            available_percentage: workforce.availability_rate,
            unavailable_percentage: workforce.total_products > 0
                ? Math.round((1 - workforce.availability_rate / 100) * 1000) / 10
                : 0,
            work_time_minutes: workforce.total_work_minutes,
            transit_time_minutes: workforce.total_travel_minutes,

            // Row 3: Notification Metrics
            total_notifications: notifications.total,
            read_percentage: notifications.read_rate,
            action_percentage: notifications.execution_rate,
            avg_action_time_seconds: notifications.avg_wait_hours * 3600,
            avg_pending_time_seconds: notifications.avg_wait_hours * 3600,
        };
    }, [query.data]);

    // Return a compatible shape (data, isLoading, isFetching)
    return {
        ...query,
        data,
    };
}
