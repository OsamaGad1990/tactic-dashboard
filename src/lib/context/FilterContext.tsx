// ============================================================================
// FILTER CONTEXT - Global filter state management
// ============================================================================
'use client';

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { ActiveFilters, DateRange } from '@/lib/types/hierarchy';

// ============================================================================
// CONTEXT TYPES
// ============================================================================
interface FilterContextValue {
    filters: ActiveFilters;
    setDateRange: (range: DateRange) => void;
    setManagerId: (id: string | null) => void;
    setChainId: (id: string | null) => void;
    setRegionId: (id: string | null) => void;
    setBranchId: (id: string | null) => void;
    setTeamLeaderId: (id: string | null) => void;
    setFieldStaffId: (id: string | null) => void;
    setRequestStatus: (status: string | null) => void;
    setCompletionSpeed: (speed: string | null) => void;
    setVisitStatus: (status: string | null) => void;
    resetFilters: () => void;
    hasActiveFilters: boolean;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================
const DEFAULT_FILTERS: ActiveFilters = {
    dateRange: { from: null, to: null },
    managerId: null,
    chainId: null,
    regionId: null,
    branchId: null,
    teamLeaderId: null,
    fieldStaffId: null,
    requestStatus: null,
    completionSpeed: null,
    visitStatus: null,
};

const FilterContext = createContext<FilterContextValue | null>(null);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================
interface FilterProviderProps {
    children: ReactNode;
    syncWithUrl?: boolean;
}

export function FilterProvider({ children, syncWithUrl = true }: FilterProviderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Initialize from URL params if sync enabled
    const initialFilters = useMemo((): ActiveFilters => {
        if (!syncWithUrl) return DEFAULT_FILTERS;

        const fromDate = searchParams.get('from');
        const toDate = searchParams.get('to');

        return {
            dateRange: {
                from: fromDate || null,
                to: toDate || null,
            },
            managerId: searchParams.get('manager'),
            chainId: searchParams.get('chain'),
            regionId: searchParams.get('region'),
            branchId: searchParams.get('branch'),
            teamLeaderId: searchParams.get('teamLeader'),
            fieldStaffId: searchParams.get('fieldStaff'),
            requestStatus: searchParams.get('requestStatus'),
            completionSpeed: searchParams.get('completionSpeed'),
            visitStatus: searchParams.get('visitStatus'),
        };
    }, [searchParams, syncWithUrl]);

    const [filters, setFilters] = useState<ActiveFilters>(initialFilters);

    // ========================================================================
    // URL SYNC HELPER
    // ========================================================================
    const updateUrl = useCallback(
        (newFilters: ActiveFilters) => {
            if (!syncWithUrl) return;

            const params = new URLSearchParams();

            if (newFilters.dateRange.from) {
                params.set('from', newFilters.dateRange.from);
            }
            if (newFilters.dateRange.to) {
                params.set('to', newFilters.dateRange.to);
            }
            if (newFilters.managerId) params.set('manager', newFilters.managerId);
            if (newFilters.chainId) params.set('chain', newFilters.chainId);
            if (newFilters.regionId) params.set('region', newFilters.regionId);
            if (newFilters.branchId) params.set('branch', newFilters.branchId);
            if (newFilters.teamLeaderId) params.set('teamLeader', newFilters.teamLeaderId);
            if (newFilters.fieldStaffId) params.set('fieldStaff', newFilters.fieldStaffId);
            if (newFilters.requestStatus) params.set('requestStatus', newFilters.requestStatus);
            if (newFilters.completionSpeed) params.set('completionSpeed', newFilters.completionSpeed);
            if (newFilters.visitStatus) params.set('visitStatus', newFilters.visitStatus);

            const queryString = params.toString();
            const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
            router.replace(newUrl, { scroll: false });
        },
        [pathname, router, syncWithUrl]
    );

    // ========================================================================
    // FILTER SETTERS (with cascading reset)
    // ========================================================================
    const setDateRange = useCallback(
        (range: DateRange) => {
            const newFilters = { ...filters, dateRange: range };
            setFilters(newFilters);
            updateUrl(newFilters);
        },
        [filters, updateUrl]
    );

    // Manager change cascades: reset team leader, field staff
    const setManagerId = useCallback(
        (id: string | null) => {
            const newFilters = { ...filters, managerId: id, teamLeaderId: null, fieldStaffId: null };
            setFilters(newFilters);
            updateUrl(newFilters);
        },
        [filters, updateUrl]
    );

    const setChainId = useCallback(
        (id: string | null) => {
            // Reset branch when chain changes
            const newFilters = { ...filters, chainId: id, branchId: null };
            setFilters(newFilters);
            updateUrl(newFilters);
        },
        [filters, updateUrl]
    );

    const setRegionId = useCallback(
        (id: string | null) => {
            // Reset branch when region changes
            const newFilters = { ...filters, regionId: id, branchId: null };
            setFilters(newFilters);
            updateUrl(newFilters);
        },
        [filters, updateUrl]
    );

    const setBranchId = useCallback(
        (id: string | null) => {
            const newFilters = { ...filters, branchId: id };
            setFilters(newFilters);
            updateUrl(newFilters);
        },
        [filters, updateUrl]
    );

    const setTeamLeaderId = useCallback(
        (id: string | null) => {
            // Reset field staff when team leader changes
            const newFilters = { ...filters, teamLeaderId: id, fieldStaffId: null };
            setFilters(newFilters);
            updateUrl(newFilters);
        },
        [filters, updateUrl]
    );

    const setFieldStaffId = useCallback(
        (id: string | null) => {
            const newFilters = { ...filters, fieldStaffId: id };
            setFilters(newFilters);
            updateUrl(newFilters);
        },
        [filters, updateUrl]
    );

    const setRequestStatus = useCallback(
        (status: string | null) => {
            const newFilters = { ...filters, requestStatus: status };
            setFilters(newFilters);
            updateUrl(newFilters);
        },
        [filters, updateUrl]
    );

    const setCompletionSpeed = useCallback(
        (speed: string | null) => {
            const newFilters = { ...filters, completionSpeed: speed };
            setFilters(newFilters);
            updateUrl(newFilters);
        },
        [filters, updateUrl]
    );

    const setVisitStatus = useCallback(
        (status: string | null) => {
            const newFilters = { ...filters, visitStatus: status };
            setFilters(newFilters);
            updateUrl(newFilters);
        },
        [filters, updateUrl]
    );

    const resetFilters = useCallback(() => {
        setFilters(DEFAULT_FILTERS);
        updateUrl(DEFAULT_FILTERS);
    }, [updateUrl]);

    // ========================================================================
    // COMPUTED VALUES
    // ========================================================================
    const hasActiveFilters = useMemo(() => {
        return (
            filters.dateRange.from !== null ||
            filters.dateRange.to !== null ||
            filters.managerId !== null ||
            filters.chainId !== null ||
            filters.regionId !== null ||
            filters.branchId !== null ||
            filters.teamLeaderId !== null ||
            filters.fieldStaffId !== null ||
            filters.requestStatus !== null ||
            filters.completionSpeed !== null ||
            filters.visitStatus !== null
        );
    }, [filters]);

    // ========================================================================
    // CONTEXT VALUE
    // ========================================================================
    const contextValue = useMemo<FilterContextValue>(
        () => ({
            filters,
            setDateRange,
            setManagerId,
            setChainId,
            setRegionId,
            setBranchId,
            setTeamLeaderId,
            setFieldStaffId,
            setRequestStatus,
            setCompletionSpeed,
            setVisitStatus,
            resetFilters,
            hasActiveFilters,
        }),
        [
            filters,
            setDateRange,
            setManagerId,
            setChainId,
            setRegionId,
            setBranchId,
            setTeamLeaderId,
            setFieldStaffId,
            setRequestStatus,
            setCompletionSpeed,
            setVisitStatus,
            resetFilters,
            hasActiveFilters,
        ]
    );

    return <FilterContext.Provider value={contextValue}>{children}</FilterContext.Provider>;
}

// ============================================================================
// HOOK
// ============================================================================
export function useFilters(): FilterContextValue {
    const context = useContext(FilterContext);
    if (!context) {
        throw new Error('useFilters must be used within a FilterProvider');
    }
    return context;
}
