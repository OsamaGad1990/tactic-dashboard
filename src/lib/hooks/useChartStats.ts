// ============================================================================
// HOOK: useChartStats
// Purpose: Fetch chart analytics data with filter reactivity + 600ms debounce
// Performance: Debounced to prevent database thrashing during rapid filter changes
// ============================================================================
'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { useFilters } from '@/lib/context/FilterContext';
import { getChartStats, ChartStatsResult } from '@/lib/actions/chart-stats';

// ============================================================================
// DEBOUNCE HOOK (600ms)
// ============================================================================
function useDebouncedValue<T>(value: T, delay: number = 600): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Clear existing timer
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        // Set new timer
        timerRef.current = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Cleanup on unmount
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [value, delay]);

    return debouncedValue;
}

// ============================================================================
// QUERY KEYS
// ============================================================================
const chartKeys = {
    all: ['chart-stats'] as const,
    stats: (params: Record<string, string | null>) => ['chart-stats', params] as const,
};

// ============================================================================
// FILTER PARAMS TYPE
// ============================================================================
interface FilterParams {
    clientId: string | null;
    chainId: string | null;
    regionId: string | null;
    branchId: string | null;
    teamLeaderId: string | null;
    fieldStaffId: string | null;
    fromDate: string | null;
    toDate: string | null;
}

// ============================================================================
// HOOK
// ============================================================================
export function useChartStats(clientId: string | null) {
    const { filters } = useFilters();

    // Build filter params object
    const filterParams: FilterParams = {
        clientId,
        chainId: filters.chainId || null,
        regionId: filters.regionId || null,
        branchId: filters.branchId || null,
        teamLeaderId: filters.teamLeaderId || null,
        fieldStaffId: filters.fieldStaffId || null,
        fromDate: filters.dateRange.from || null,
        toDate: filters.dateRange.to || null,
    };

    // Debounce filter params by 600ms to prevent database thrashing
    const debouncedParams = useDebouncedValue(filterParams, 600);

    // Check if we're waiting for debounce
    const isDebouncing = JSON.stringify(filterParams) !== JSON.stringify(debouncedParams);

    return useQuery<ChartStatsResult>({
        queryKey: chartKeys.stats({
            clientId: debouncedParams.clientId,
            chainId: debouncedParams.chainId,
            regionId: debouncedParams.regionId,
            branchId: debouncedParams.branchId,
            teamLeaderId: debouncedParams.teamLeaderId,
            fieldStaffId: debouncedParams.fieldStaffId,
            fromDate: debouncedParams.fromDate,
            toDate: debouncedParams.toDate,
        }),
        queryFn: async () => {
            if (!debouncedParams.clientId) {
                throw new Error('Client ID is required');
            }

            console.log('📈 Fetching chart stats (debounced)...');

            const result = await getChartStats({
                clientId: debouncedParams.clientId,
                chainId: debouncedParams.chainId,
                regionId: debouncedParams.regionId,
                branchId: debouncedParams.branchId,
                teamLeaderId: debouncedParams.teamLeaderId,
                fieldStaffId: debouncedParams.fieldStaffId,
                fromDate: debouncedParams.fromDate,
                toDate: debouncedParams.toDate,
            });

            console.log('📈 Chart stats received:', result);

            return result;
        },
        enabled: Boolean(debouncedParams.clientId) && !isDebouncing,
        staleTime: 60 * 1000, // 1 minute
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
}

