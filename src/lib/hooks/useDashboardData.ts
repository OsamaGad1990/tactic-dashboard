// ============================================================================
// HOOK: useDashboardData — React Query bridge to get_dashboard_ops_metrics
// 
// Architecture:
//   FilterContext  → dates (from/to)
//   ScopeContext   → filteredBranches (market UUIDs, already cascaded)
//   This hook      → derives market_ids, calls RPC, manages cache
//
// Zero-Result Safety (Business Logic):
//   - Filters NOT active + no market selection → p_market_ids = NULL (full scope)
//   - Filters active but 0 matching markets   → p_market_ids = [] (zero results)
//   - Filters active with matching markets    → p_market_ids = [id1, id2, ...]
// ============================================================================
'use client';

import { useMemo } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useFilters } from '@/lib/context/FilterContext';
import { useScope } from '@/lib/context/ScopeContext';
import type { DashboardMetrics } from '@/lib/types/dashboard';

// ============================================================================
// CONSTANTS
// ============================================================================
const QUERY_KEY_PREFIX = 'dashboard-metrics' as const;
const STALE_TIME = 2 * 60 * 1000;   // 2 minutes
const GC_TIME = 15 * 60 * 1000;     // 15 minutes

// ============================================================================
// HELPER: Check if GEOGRAPHIC filters are active (for market scoping)
// Personnel filters (teamLeader/fieldStaff) are handled by p_staff_ids
// ============================================================================
function hasGeographicFilters(filters: {
    chainId: string | null;
    regionId: string | null;
    branchId: string | null;
}): boolean {
    return (
        filters.chainId !== null ||
        filters.regionId !== null ||
        filters.branchId !== null
    );
}

// ============================================================================
// HOOK: useDashboardData
// ============================================================================
export function useDashboardData(): UseQueryResult<DashboardMetrics, Error> {
    const supabase = createClient();
    const { filters } = useFilters();
    const { scope, isLoading: isScopeLoading } = useScope();

    // ========================================================================
    // STEP 1a: Derive market IDs — GEOGRAPHIC filters ONLY
    //
    // ARCHITECTURE (Feb 13 2026):
    //   Place-based filtering → p_market_ids (chain/region/branch)
    //   Person-based filtering → p_staff_ids (teamLeader/fieldStaff)
    //   These are ORTHOGONAL dimensions. Never mix them.
    // ========================================================================
    const marketIds = useMemo(() => {
        if (!scope?.branches) return [];

        let branches = scope.branches;

        // Chain filter
        if (filters.chainId) {
            branches = branches.filter(b => b.chain_id === filters.chainId);
        }

        // Region filter
        if (filters.regionId) {
            branches = branches.filter(b => b.region_id === filters.regionId);
        }

        // Specific branch filter
        if (filters.branchId) {
            branches = branches.filter(b => b.id === filters.branchId);
        }

        return branches.map(b => b.id);
    }, [
        scope?.branches,
        filters.chainId,
        filters.regionId,
        filters.branchId,
    ]);

    // ========================================================================
    // STEP 1b: Derive staff IDs for personnel filtering (v3.6)
    //
    // SQL v3.6 accepts p_staff_ids to filter visits/notifications by user.
    // - fieldStaffId selected → single user
    // - teamLeaderId selected → all field users under that leader
    // - neither → null (full team scope)
    // ========================================================================
    const staffIds = useMemo((): string[] | null => {
        // Specific field user selected
        if (filters.fieldStaffId) {
            return [filters.fieldStaffId];
        }

        // Team leader selected → get all their downline user IDs
        if (filters.teamLeaderId && scope?.field_users) {
            const downline = scope.field_users
                .filter(u => u.team_leader_account_id === filters.teamLeaderId)
                .map(u => u.user_id);
            return downline.length > 0 ? downline : [];
        }

        // No personnel filter
        return null;
    }, [filters.fieldStaffId, filters.teamLeaderId, scope?.field_users]);

    // ========================================================================
    // STEP 2: Zero-Result Safety — determine what to send as p_market_ids
    // ========================================================================
    const geoFiltersActive = hasGeographicFilters(filters);

    const effectiveMarketIds = useMemo((): string[] | null => {
        if (!geoFiltersActive) {
            // No geographic/personnel filters → NULL → full team scope
            return null;
        }

        // Filters ARE active:
        // - If marketIds has items → send them (intersection with team scope)
        // - If marketIds is empty  → send [] (zero results, NOT global leak)
        return marketIds;
    }, [geoFiltersActive, marketIds]);

    // ========================================================================
    // STEP 3: Ensure date range has valid defaults
    // ========================================================================
    const dateFrom = filters.dateRange.from ?? getDefaultDateFrom();
    const dateTo = filters.dateRange.to ?? getDefaultDateTo();

    // ========================================================================
    // STEP 4: React Query — queryKey includes ALL filter dimensions
    // Any filter change → automatic re-fetch
    // ========================================================================
    return useQuery<DashboardMetrics, Error>({
        queryKey: [
            QUERY_KEY_PREFIX,
            dateFrom,
            dateTo,
            // Stable serialization: sort to prevent unnecessary re-fetches
            effectiveMarketIds !== null
                ? [...effectiveMarketIds].sort().join(',')
                : 'full-scope',
            // v3.6: Personnel dimension
            staffIds !== null
                ? [...staffIds].sort().join(',')
                : 'all-staff',
        ],
        queryFn: async (): Promise<DashboardMetrics> => {
            console.log('📊 Dashboard Metrics Fetch:', {
                dateFrom,
                dateTo,
                marketCount: effectiveMarketIds?.length ?? 'full-scope',
                staffCount: staffIds?.length ?? 'all-staff',
                filtersActive: geoFiltersActive,
            });

            // Parallel: Get correct product count (distinct active client_products)
            // The RPC may return a visit-based product sum, so we override with catalog count
            const [rpcResult, productCountResult] = await Promise.all([
                supabase.rpc('get_dashboard_ops_metrics', {
                    p_date_from: dateFrom,
                    p_date_to: dateTo,
                    p_market_ids: effectiveMarketIds,
                    p_staff_ids: staffIds,
                }),
                supabase
                    .from('client_products')
                    .select('id', { count: 'exact', head: true })
                    .eq('is_active', true),
            ]);

            const { data, error } = rpcResult;

            if (error) {
                console.error('❌ Dashboard metrics fetch failed:', {
                    message: error.message,
                    code: error.code,
                    hint: error.hint,
                });
                throw new Error(error.message);
            }

            if (!data) {
                throw new Error('Dashboard metrics returned null');
            }

            // Override total_products with the correct catalog count
            const metrics = data as DashboardMetrics;
            const correctProductCount = productCountResult.count ?? metrics.workforce.total_products;
            metrics.workforce.total_products = correctProductCount;

            return metrics;
        },
        enabled: !isScopeLoading && Boolean(dateFrom) && Boolean(dateTo),
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        // Prevent flashing stale data when filters change
        placeholderData: (previousData) => previousData,
    });
}

// ============================================================================
// HELPERS: Default date range (Maximum Historical View — Investor Demo)
// ============================================================================
function getDefaultDateFrom(): string {
    // Start from Jan 1 2025 to capture ALL historical demo data on first load
    return '2025-01-01';
}

function getDefaultDateTo(): string {
    return new Date().toISOString().split('T')[0];
}
