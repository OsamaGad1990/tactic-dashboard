// ============================================================================
// FILTER SELECT - Reusable dropdown component
// ============================================================================
'use client';

import { useId, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================
interface SelectOption {
    value: string;
    label: string;
}

interface FilterSelectProps {
    options: SelectOption[];
    value: string | null;
    onChange: (value: string | null) => void;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================
export function FilterSelect({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    label,
    disabled = false,
    className = '',
}: FilterSelectProps) {
    const id = useId();

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLSelectElement>) => {
            const newValue = e.target.value;
            onChange(newValue === '' ? null : newValue);
        },
        [onChange]
    );

    return (
        <div className={`filter-select ${className}`}>
            {label && (
                <label htmlFor={id} className="filter-select__label">
                    {label}
                </label>
            )}
            <select
                id={id}
                value={value ?? ''}
                onChange={handleChange}
                disabled={disabled}
                className="filter-select__input"
            >
                <option value="">{placeholder}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
