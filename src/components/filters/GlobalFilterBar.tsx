// ============================================================================
// GLOBAL FILTER BAR - Premium 2026 Dashboard Filter Component
// ============================================================================
'use client';

import { useCallback, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useFilters } from '@/lib/context/FilterContext';
import { useDashboardFilters, useBranchOptions, ChainFilterOption, RegionFilterOption } from '@/lib/hooks/useHierarchyLogic';
import { Calendar, Building2, MapPin, Store, Users, UserCircle, RotateCcw, Filter, ChevronDown, Zap, ClipboardList } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================
interface GlobalFilterBarProps {
    userAccountId: string;
    clientId: string;
    showHierarchyFilters?: boolean;
    showLocationFilters?: boolean;
    showRequestFilters?: boolean;
    showVisitStatusFilters?: boolean;
    showDateFilters?: boolean;
    /** Only show these user IDs in the field staff dropdown (e.g. complaint requester IDs) */
    allowedFieldStaffIds?: string[];
    className?: string;
}

interface FilterOption {
    value: string;
    label: string;
}

// ============================================================================
// PREMIUM SELECT COMPONENT
// ============================================================================
function PremiumSelect({
    options,
    value,
    onChange,
    placeholder,
    label,
    icon: Icon,
    disabled = false,
}: {
    options: FilterOption[];
    value: string | null;
    onChange: (value: string | null) => void;
    placeholder: string;
    label: string;
    icon: React.ElementType;
    disabled?: boolean;
}) {
    return (
        <div className="relative group">
            <div className="flex items-center gap-2 mb-1.5">
                <Icon className="w-3.5 h-3.5 text-primary" />
                <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                    {label}
                </label>
            </div>
            <div className="relative">
                <select
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value || null)}
                    disabled={disabled}
                    className={`
                        w-full h-10 px-4 pe-10 
                        bg-background dark:bg-zinc-800/90 
                        border-2 border-border dark:border-zinc-600 
                        hover:border-primary/50 dark:hover:border-primary/70
                        rounded-xl
                        text-sm font-medium text-foreground
                        appearance-none cursor-pointer
                        transition-all duration-200
                        focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                        disabled:opacity-50 disabled:cursor-not-allowed
                        shadow-sm hover:shadow-md
                        ${value ? 'text-foreground font-semibold' : 'text-muted-foreground'}
                    `}
                >
                    <option value="" className="bg-background dark:bg-zinc-800">{placeholder}</option>
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-background dark:bg-zinc-800">
                            {opt.label}
                        </option>
                    ))}
                </select>
                <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/60 pointer-events-none transition-transform group-hover:text-primary" />
            </div>
        </div>
    );
}

// ============================================================================
// PREMIUM DATE INPUT COMPONENT
// ============================================================================
function PremiumDateInput({
    value,
    onChange,
    label,
}: {
    value: string | null;
    onChange: (value: string | null) => void;
    label: string;
}) {
    return (
        <div className="relative">
            <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-1.5 block">
                {label}
            </label>
            <input
                type="date"
                value={value || ''}
                onChange={(e) => onChange(e.target.value || null)}
                className="
                    w-full h-10 px-4
                    bg-background dark:bg-zinc-800/90
                    border-2 border-border dark:border-zinc-600
                    hover:border-primary/50 dark:hover:border-primary/70
                    rounded-xl
                    text-sm font-medium text-foreground
                    transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                    shadow-sm hover:shadow-md
                    cursor-pointer
                    [&::-webkit-calendar-picker-indicator]:opacity-60
                    [&::-webkit-calendar-picker-indicator]:hover:opacity-100
                    [&::-webkit-calendar-picker-indicator]:cursor-pointer
                    [&::-webkit-calendar-picker-indicator]:dark:invert
                "
            />
        </div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function GlobalFilterBar({
    userAccountId,
    clientId,
    showHierarchyFilters = true,
    showLocationFilters = true,
    showRequestFilters = false,
    showVisitStatusFilters = false,
    showDateFilters = true,
    allowedFieldStaffIds,
    className = '',
}: GlobalFilterBarProps) {
    const t = useTranslations('filters');
    const locale = useLocale();
    const isArabic = locale === 'ar';

    const {
        filters,
        setDateRange,
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
    } = useFilters();

    const {
        isLoading: isHierarchyLoading,
        isError: isHierarchyError,
        getFilteredChains,
        getFilteredRegions,
        teamLeaders,
        getFieldStaffByTeamLeader,
        // SQL V8: Smart Hierarchy Display
        shouldShowManagerFilter,
        shouldShowTeamLeaderFilter,
        shouldShowFieldStaffFilter,
    } = useDashboardFilters(); // HULK Pattern: No params needed, uses ScopeContext

    // Server-Side Cascading: Branches fetched dynamically based on chainId/regionId
    const {
        data: branchData,
        isLoading: isBranchLoading
    } = useBranchOptions(clientId, filters.chainId, filters.regionId);

    const isLoading = isHierarchyLoading;
    const isError = isHierarchyError;

    // ========================================================================
    // FILTER OPTIONS (From Server-Side RPCs)
    // ========================================================================
    const chainOptions = useMemo(() => {
        return getFilteredChains(filters.regionId).map((c: ChainFilterOption) => ({
            value: c.id,
            label: isArabic && c.name_ar ? c.name_ar : c.name,
        }));
    }, [getFilteredChains, filters.regionId, isArabic]);

    const regionOptions = useMemo(() => {
        return getFilteredRegions(filters.chainId).map((r: RegionFilterOption) => ({
            value: r.id,
            label: isArabic && r.name_ar ? r.name_ar : r.name,
        }));
    }, [getFilteredRegions, filters.chainId, isArabic]);

    // SQL V7: Branches with locale-based naming
    const branchOptions = useMemo(() => {
        if (!branchData) return [];
        return branchData.map((b) => ({
            value: b.id,
            label: isArabic && b.name_ar ? b.name_ar : b.name,
        }));
    }, [branchData, isArabic]);

    const teamLeaderOptions = useMemo(() => {
        return teamLeaders.map((tl) => ({
            value: tl.account_id,
            label: tl.full_name || tl.account_id,
        }));
    }, [teamLeaders]);

    const fieldStaffOptions = useMemo(() => {
        let staff = getFieldStaffByTeamLeader(filters.teamLeaderId);
        // If allowedFieldStaffIds is specified, only show those users
        if (allowedFieldStaffIds && allowedFieldStaffIds.length > 0) {
            const allowedIds = new Set(allowedFieldStaffIds);
            staff = staff.filter(fs => allowedIds.has(fs.account_id));
        }
        return staff.map((fs) => ({
            value: fs.account_id,
            label: fs.full_name || fs.account_id,
        }));
    }, [getFieldStaffByTeamLeader, filters.teamLeaderId, allowedFieldStaffIds]);

    // ========================================================================
    // HANDLERS
    // ========================================================================
    const handleReset = useCallback(() => {
        resetFilters();
    }, [resetFilters]);

    const handleFromDateChange = useCallback((value: string | null) => {
        setDateRange({ ...filters.dateRange, from: value });
    }, [setDateRange, filters.dateRange]);

    const handleToDateChange = useCallback((value: string | null) => {
        setDateRange({ ...filters.dateRange, to: value });
    }, [setDateRange, filters.dateRange]);

    // ========================================================================
    // RENDER - Loading State
    // ========================================================================
    if (isLoading) {
        return (
            <div className={`
                w-full p-4 mb-6
                bg-gradient-to-r from-card/80 to-card/60
                backdrop-blur-xl
                border border-border/50
                rounded-2xl
                shadow-lg shadow-black/5
                ${className}
            `}>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Filter className="w-5 h-5 animate-pulse" />
                        <span className="text-sm font-medium">{t('loading') || 'Loading filters...'}</span>
                    </div>
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ========================================================================
    // RENDER - Error State
    // ========================================================================
    if (isError) {
        return (
            <div className={`
                w-full p-4 mb-6
                bg-gradient-to-r from-destructive/10 to-destructive/5
                backdrop-blur-xl
                border border-destructive/30
                rounded-2xl
                ${className}
            `}>
                <div className="flex items-center gap-3 text-destructive">
                    <Filter className="w-5 h-5" />
                    <span className="text-sm font-medium">{t('loadError')}</span>
                </div>
            </div>
        );
    }

    // ========================================================================
    // RENDER - Main Filter Bar
    // ========================================================================
    return (
        <div
            className={`
                w-full p-5 mb-6
                bg-gradient-to-br from-card/90 via-card/70 to-card/50
                backdrop-blur-xl
                border border-border/50
                rounded-2xl
                shadow-xl shadow-black/5
                transition-all duration-300
                hover:shadow-2xl hover:shadow-primary/5
                ${className}
            `}
            dir={isArabic ? 'rtl' : 'ltr'}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Filter className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">
                            {t('subtitle') || 'Refine your dashboard data'}
                        </h3>
                    </div>
                </div>

                {/* Reset Button */}
                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={handleReset}
                        className="
                            flex items-center gap-2 px-4 py-2
                            bg-destructive/10 hover:bg-destructive/20
                            text-destructive
                            rounded-xl
                            text-sm font-medium
                            transition-all duration-200
                            hover:scale-105
                            active:scale-95
                        "
                        aria-label={t('resetFilters')}
                    >
                        <RotateCcw className="w-4 h-4" />
                        <span>{t('reset')}</span>
                    </button>
                )}
            </div>

            {/* Filters Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                {/* Date Range - From */}
                {showDateFilters && (
                    <>
                        <PremiumDateInput
                            value={filters.dateRange.from}
                            onChange={handleFromDateChange}
                            label={t('from') || 'From'}
                        />

                        {/* Date Range - To */}
                        <PremiumDateInput
                            value={filters.dateRange.to}
                            onChange={handleToDateChange}
                            label={t('to') || 'To'}
                        />
                    </>
                )}

                {/* Location Filters (Chain / Region / Branch) */}
                {showLocationFilters && (
                    <>
                        {/* Chain Filter */}
                        <PremiumSelect
                            options={chainOptions}
                            value={filters.chainId}
                            onChange={setChainId}
                            placeholder={t('allChains')}
                            label={t('chain')}
                            icon={Building2}
                        />

                        {/* Region Filter */}
                        <PremiumSelect
                            options={regionOptions}
                            value={filters.regionId}
                            onChange={setRegionId}
                            placeholder={t('allRegions')}
                            label={t('region')}
                            icon={MapPin}
                        />

                        {/* Branch Filter */}
                        <PremiumSelect
                            options={branchOptions}
                            value={filters.branchId}
                            onChange={setBranchId}
                            placeholder={t('allBranches')}
                            label={t('branch')}
                            icon={Store}
                        />
                    </>
                )}

                {/* Hierarchy Filters */}
                {showHierarchyFilters && (
                    <>
                        {/* Team Leader Filter - SQL V8: Only show if actual team leaders exist */}
                        {shouldShowTeamLeaderFilter && (
                            <PremiumSelect
                                options={teamLeaderOptions}
                                value={filters.teamLeaderId}
                                onChange={setTeamLeaderId}
                                placeholder={t('allTeamLeaders')}
                                label={t('teamLeader')}
                                icon={Users}
                            />
                        )}

                        {/* Field Staff Filter - Show only if field users exist */}
                        {shouldShowFieldStaffFilter && (
                            <PremiumSelect
                                options={fieldStaffOptions}
                                value={filters.fieldStaffId}
                                onChange={setFieldStaffId}
                                placeholder={t('allFieldStaff')}
                                label={t('fieldStaff')}
                                icon={UserCircle}
                            />
                        )}
                    </>
                )}

                {/* Request-Specific Filters (Status + Completion Speed) */}
                {showRequestFilters && (
                    <>
                        {/* Request Status Filter */}
                        <PremiumSelect
                            options={[
                                { value: 'approved', label: isArabic ? 'تمت الموافقة' : 'Approved' },
                                { value: 'rejected', label: isArabic ? 'مرفوض' : 'Rejected' },
                                { value: 'cancelled', label: isArabic ? 'ملغي' : 'Cancelled' },
                            ]}
                            value={filters.requestStatus}
                            onChange={setRequestStatus}
                            placeholder={isArabic ? 'كل الحالات' : 'All Statuses'}
                            label={isArabic ? 'الحالة' : 'Status'}
                            icon={ClipboardList}
                        />

                        {/* Completion Speed Filter */}
                        <PremiumSelect
                            options={[
                                { value: 'fast', label: isArabic ? '⚡ سريع (1-5 د)' : '⚡ Fast (1-5m)' },
                                { value: 'medium', label: isArabic ? '⏱️ متوسط (5-10 د)' : '⏱️ Medium (5-10m)' },
                                { value: 'slow', label: isArabic ? '🐢 بطيء (+10 د)' : '🐢 Slow (10m+)' },
                            ]}
                            value={filters.completionSpeed}
                            onChange={setCompletionSpeed}
                            placeholder={isArabic ? 'كل الانجاز' : 'All Speeds'}
                            label={isArabic ? 'الانجاز' : 'Speed'}
                            icon={Zap}
                        />
                    </>
                )}

                {/* Visit Status Filters (Yesterday Visits) */}
                {showVisitStatusFilters && (
                    <PremiumSelect
                        options={[
                            { value: 'completed', label: isArabic ? 'مكتمل' : 'Completed' },
                            { value: 'cancelled', label: isArabic ? 'ملغي' : 'Cancelled' },
                            { value: 'pending', label: isArabic ? 'معلّقة' : 'Pending' },
                        ]}
                        value={filters.visitStatus}
                        onChange={setVisitStatus}
                        placeholder={isArabic ? 'كل الحالات' : 'All Statuses'}
                        label={isArabic ? 'الحالة' : 'Status'}
                        icon={ClipboardList}
                    />
                )}
            </div>
        </div>
    );
}
