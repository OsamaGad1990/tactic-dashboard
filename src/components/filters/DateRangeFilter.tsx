// ============================================================================
// DATE RANGE FILTER - Date picker component (String-based for HTML inputs)
// ============================================================================
'use client';

import { useCallback } from 'react';
import type { DateRange } from '@/lib/types/hierarchy';

// ============================================================================
// TYPES
// ============================================================================
interface DateRangeFilterProps {
    value: DateRange;
    onChange: (range: DateRange) => void;
    label?: string;
    className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================
export function DateRangeFilter({
    value,
    onChange,
    label,
    className = '',
}: DateRangeFilterProps) {
    const handleFromChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const dateValue = e.target.value;
            onChange({
                ...value,
                from: dateValue || null,
            });
        },
        [onChange, value]
    );

    const handleToChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const dateValue = e.target.value;
            onChange({
                ...value,
                to: dateValue || null,
            });
        },
        [onChange, value]
    );

    return (
        <div className={`date-range-filter ${className}`}>
            {label && <span className="date-range-filter__label">{label}</span>}
            <div className="date-range-filter__inputs">
                <div className="date-range-filter__field">
                    <label className="date-range-filter__field-label">
                        From
                    </label>
                    <input
                        type="date"
                        value={value.from || ''}
                        onChange={handleFromChange}
                        className="date-range-filter__input"
                    />
                </div>
                <div className="date-range-filter__field">
                    <label className="date-range-filter__field-label">
                        To
                    </label>
                    <input
                        type="date"
                        value={value.to || ''}
                        onChange={handleToChange}
                        min={value.from || undefined}
                        className="date-range-filter__input"
                    />
                </div>
            </div>
        </div>
    );
}
