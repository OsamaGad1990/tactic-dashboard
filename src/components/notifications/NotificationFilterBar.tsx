'use client';

import { ChevronDown, Filter, RotateCcw, Send, Users, User, Zap } from 'lucide-react';
import { useLocale } from 'next-intl';

// ============================================================================
// TYPES
// ============================================================================
interface FilterOption {
    value: string;
    label: string;
}

interface NotificationFilterBarProps {
    // Filter values
    dateFrom: string;
    dateTo: string;
    statusFilter: string;
    senderTypeFilter: string;
    senderNameFilter: string;
    recipientRoleFilter: string;
    recipientNameFilter: string;
    // Setters
    onDateFromChange: (v: string) => void;
    onDateToChange: (v: string) => void;
    onStatusChange: (v: string) => void;
    onSenderTypeChange: (v: string) => void;
    onSenderNameChange: (v: string) => void;
    onRecipientRoleChange: (v: string) => void;
    onRecipientNameChange: (v: string) => void;
    onReset: () => void;
    // Data
    senderNameOptions: FilterOption[];
    recipientRoleOptions: FilterOption[];
    recipientNameOptions: FilterOption[];
    hasActiveFilters: boolean;
    filteredCount: number;
    totalCount: number;
}

// ============================================================================
// PREMIUM SELECT COMPONENT (matches GlobalFilterBar pattern)
// ============================================================================
function PremiumSelect({
    options,
    value,
    onChange,
    placeholder,
    label,
    icon: Icon,
}: {
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    label: string;
    icon: React.ElementType;
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
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
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
                        shadow-sm hover:shadow-md
                        ${value && value !== 'all' ? 'text-foreground font-semibold' : 'text-muted-foreground'}
                    `}
                >
                    <option value="all" className="bg-background dark:bg-zinc-800">{placeholder}</option>
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
// PREMIUM DATE INPUT COMPONENT (matches GlobalFilterBar pattern)
// ============================================================================
function PremiumDateInput({
    value,
    onChange,
    label,
}: {
    value: string;
    onChange: (value: string) => void;
    label: string;
}) {
    return (
        <div className="relative">
            <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-1.5 block">
                {label}
            </label>
            <input
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
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
export function NotificationFilterBar({
    dateFrom,
    dateTo,
    statusFilter,
    senderTypeFilter,
    senderNameFilter,
    recipientRoleFilter,
    recipientNameFilter,
    onDateFromChange,
    onDateToChange,
    onStatusChange,
    onSenderTypeChange,
    onSenderNameChange,
    onRecipientRoleChange,
    onRecipientNameChange,
    onReset,
    senderNameOptions,
    recipientRoleOptions,
    recipientNameOptions,
    hasActiveFilters,
    filteredCount,
    totalCount,
}: NotificationFilterBarProps) {
    const locale = useLocale();
    const isArabic = locale === 'ar';

    // Status options
    const statusOptions: FilterOption[] = [
        { value: 'queued', label: isArabic ? 'في الانتظار' : 'Queued' },
        { value: 'read', label: isArabic ? 'مقروء' : 'Read' },
        { value: 'actioned', label: isArabic ? 'تم التنفيذ' : 'Actioned' },
    ];

    // Sender type options
    const senderTypeOptions: FilterOption[] = [
        { value: 'system', label: isArabic ? 'السيستم' : 'System' },
        { value: 'team_leader', label: isArabic ? 'تيم ليدر' : 'Team Leader' },
    ];

    return (
        <div
            className={`
                w-full p-5 mb-4
                bg-gradient-to-br from-card/90 via-card/70 to-card/50
                backdrop-blur-xl
                border border-border/50
                rounded-2xl
                shadow-xl shadow-black/5
                transition-all duration-300
                hover:shadow-2xl hover:shadow-primary/5
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
                            {isArabic ? 'تصفية الإشعارات' : 'Filter Notifications'}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            {filteredCount} / {totalCount}
                        </p>
                    </div>
                </div>

                {/* Reset Button */}
                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={onReset}
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
                    >
                        <RotateCcw className="w-4 h-4" />
                        <span>{isArabic ? 'إعادة ضبط' : 'Reset'}</span>
                    </button>
                )}
            </div>

            {/* Filters Grid — Row 1: Date + Status + Sender */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
                {/* Date From */}
                <PremiumDateInput
                    value={dateFrom}
                    onChange={onDateFromChange}
                    label={isArabic ? 'من' : 'From'}
                />

                {/* Date To */}
                <PremiumDateInput
                    value={dateTo}
                    onChange={onDateToChange}
                    label={isArabic ? 'إلى' : 'To'}
                />

                {/* Status */}
                <PremiumSelect
                    options={statusOptions}
                    value={statusFilter}
                    onChange={onStatusChange}
                    placeholder={isArabic ? 'كل الحالات' : 'All Statuses'}
                    label={isArabic ? 'الحالة' : 'Status'}
                    icon={Zap}
                />

                {/* Sender Type */}
                <PremiumSelect
                    options={senderTypeOptions}
                    value={senderTypeFilter}
                    onChange={onSenderTypeChange}
                    placeholder={isArabic ? 'الكل' : 'All'}
                    label={isArabic ? 'المرسل' : 'Sender'}
                    icon={Send}
                />

                {/* Sender Name */}
                <PremiumSelect
                    options={senderNameOptions}
                    value={senderNameFilter}
                    onChange={onSenderNameChange}
                    placeholder={isArabic ? 'الكل' : 'All'}
                    label={isArabic ? 'المرسل بالاسم' : 'Sender Name'}
                    icon={User}
                />
            </div>

            {/* Filters Grid — Row 2: Recipients */}
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                {/* Recipient Role */}
                <PremiumSelect
                    options={recipientRoleOptions}
                    value={recipientRoleFilter}
                    onChange={onRecipientRoleChange}
                    placeholder={isArabic ? 'الكل' : 'All'}
                    label={isArabic ? 'المستلمين (أدوار)' : 'Recipients (Roles)'}
                    icon={Users}
                />

                {/* Recipient Name */}
                <PremiumSelect
                    options={recipientNameOptions}
                    value={recipientNameFilter}
                    onChange={onRecipientNameChange}
                    placeholder={isArabic ? 'الكل' : 'All'}
                    label={isArabic ? 'المستلمين بالاسم' : 'Recipient Name'}
                    icon={User}
                />
            </div>
        </div>
    );
}
