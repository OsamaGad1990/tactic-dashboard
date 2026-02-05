// ============================================================================
// HOOK: useFilteredStats
// Purpose: Fetch dashboard stats with filter parameters using TanStack Query
// Uses Server Action for reliable database access
// ============================================================================
'use client';

import { useQuery } from '@tanstack/react-query';
import { useFilters } from '@/lib/context/FilterContext';
import { getFilteredStats, FilteredStatsResult } from '@/lib/actions/filtered-stats';

// ============================================================================
// QUERY KEYS
// ============================================================================
export const statsKeys = {
    all: ['filtered-stats'] as const,
    filtered: (params: Record<string, string | null>) =>
        [...statsKeys.all, params] as const,
};

// ============================================================================
// HOOK
// ============================================================================
export function useFilteredStats(clientId: string | null) {
    const { filters } = useFilters();

    // Convert empty strings to null
    const toNullIfEmpty = (val: string | null): string | null =>
        (val && val.trim() !== '') ? val : null;

    // Build query key from all filter values
    const queryParams = {
        clientId,
        chainId: toNullIfEmpty(filters.chainId),
        regionId: toNullIfEmpty(filters.regionId),
        branchId: toNullIfEmpty(filters.branchId),
        teamLeaderId: toNullIfEmpty(filters.teamLeaderId),
        fieldStaffId: toNullIfEmpty(filters.fieldStaffId),
        fromDate: toNullIfEmpty(filters.dateRange.from),
        toDate: toNullIfEmpty(filters.dateRange.to),
    };

    return useQuery({
        queryKey: statsKeys.filtered(queryParams),
        queryFn: async (): Promise<FilteredStatsResult> => {
            if (!clientId) {
                return {
                    team_members: 0,
                    active_markets: 0,
                    products: 0,
                    today_visits: 0,
                };
            }

            // DEBUG: Log params
            console.log('📤 Fetching stats with params:', queryParams);

            const result = await getFilteredStats({
                clientId,
                chainId: queryParams.chainId,
                regionId: queryParams.regionId,
                branchId: queryParams.branchId,
                teamLeaderId: queryParams.teamLeaderId,
                fieldStaffId: queryParams.fieldStaffId,
                fromDate: queryParams.fromDate,
                toDate: queryParams.toDate,
            });

            // DEBUG: Log result
            console.log('📊 Filtered Stats:', result);

            return result;
        },
        enabled: Boolean(clientId),
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes
    });
}
