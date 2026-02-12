// ============================================================================
// COMPONENT: RadialChart
// Premium 2026 SVG Radial Progress Chart with Framer Motion
// ============================================================================
'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================
export interface RadialChartProps {
    label: string;
    value: number;
    total?: number; // For percentage calculation
    percentage?: number; // Direct percentage (0-100)
    color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
    unit?: 'number' | 'percentage' | 'time' | 'timeSeconds';
    size?: 'sm' | 'md' | 'lg';
}

// ============================================================================
// COLOR SCHEMES
// ============================================================================
const colorSchemes = {
    primary: {
        stroke: '#f59e0b', // Amber
        bg: 'rgba(245, 158, 11, 0.1)',
        glow: 'rgba(245, 158, 11, 0.3)',
    },
    success: {
        stroke: '#10b981', // Emerald
        bg: 'rgba(16, 185, 129, 0.1)',
        glow: 'rgba(16, 185, 129, 0.3)',
    },
    warning: {
        stroke: '#f97316', // Orange
        bg: 'rgba(249, 115, 22, 0.1)',
        glow: 'rgba(249, 115, 22, 0.3)',
    },
    danger: {
        stroke: '#ef4444', // Red
        bg: 'rgba(239, 68, 68, 0.1)',
        glow: 'rgba(239, 68, 68, 0.3)',
    },
    info: {
        stroke: '#3b82f6', // Blue
        bg: 'rgba(59, 130, 246, 0.1)',
        glow: 'rgba(59, 130, 246, 0.3)',
    },
};

// ============================================================================
// SIZE CONFIG
// ============================================================================
const sizeConfig = {
    sm: { size: 80, stroke: 6, fontSize: 'text-lg' },
    md: { size: 100, stroke: 8, fontSize: 'text-2xl' },
    lg: { size: 120, stroke: 10, fontSize: 'text-3xl' },
};

// ============================================================================
// COMPONENT
// ============================================================================
export function RadialChart({
    label,
    value,
    total,
    percentage: directPercentage,
    color = 'primary',
    unit = 'number',
    size = 'md',
}: RadialChartProps) {
    const config = sizeConfig[size];
    const colors = colorSchemes[color];

    // Calculate percentage
    const percentage = useMemo(() => {
        if (directPercentage !== undefined) return Math.min(directPercentage, 100);
        if (total && total > 0) return Math.min((value / total) * 100, 100);
        return 0;
    }, [value, total, directPercentage]);

    // SVG calculations
    const radius = (config.size - config.stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    // Format display value
    const displayValue = useMemo(() => {
        if (unit === 'timeSeconds') {
            // Display as MM:SS (value is in seconds)
            const mins = Math.floor(Math.abs(value) / 60);
            const secs = Math.floor(Math.abs(value) % 60);
            const sign = value < 0 ? '-' : '';
            return `${sign}${mins}:${secs.toString().padStart(2, '0')}`;
        }
        if (unit === 'time') {
            // Display as H:MM or MM (value is in minutes)
            const hours = Math.floor(Math.abs(value) / 60);
            const mins = Math.floor(Math.abs(value) % 60);
            const sign = value < 0 ? '-' : '';
            return hours > 0 ? `${sign}${hours}:${mins.toString().padStart(2, '0')}` : `${sign}${mins}`;
        }
        if (unit === 'percentage') {
            return `${value.toFixed(1)}%`;
        }
        return value.toLocaleString();
    }, [value, unit]);

    // Sleek unit hint for time-based charts
    const unitHint = useMemo(() => {
        if (unit === 'time') {
            const hours = Math.floor(Math.abs(value) / 60);
            return hours > 0 ? 'hrs:min' : 'min';
        }
        if (unit === 'timeSeconds') return 'min:sec';
        return null;
    }, [unit, value]);

    return (
        <div className="
            relative flex flex-col items-center justify-center p-4
            bg-card/50 backdrop-blur-sm rounded-2xl border border-white/10
            hover:border-white/20 hover:bg-card/70
            transition-all duration-300
            group
        ">
            {/* Glow Effect */}
            <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                    background: `radial-gradient(circle at center, ${colors.glow} 0%, transparent 70%)`,
                }}
            />

            {/* SVG Container */}
            <div className="relative" style={{ width: config.size, height: config.size }}>
                {/* Background Circle */}
                <svg
                    className="absolute top-0 left-0 -rotate-90"
                    width={config.size}
                    height={config.size}
                >
                    <circle
                        cx={config.size / 2}
                        cy={config.size / 2}
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={config.stroke}
                        className="text-white/10"
                    />
                </svg>

                {/* Progress Circle */}
                <svg
                    className="absolute top-0 left-0 -rotate-90"
                    width={config.size}
                    height={config.size}
                >
                    <motion.circle
                        cx={config.size / 2}
                        cy={config.size / 2}
                        r={radius}
                        fill="none"
                        stroke={colors.stroke}
                        strokeWidth={config.stroke}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{
                            duration: 1.5,
                            ease: [0.4, 0, 0.2, 1],
                        }}
                        style={{
                            filter: `drop-shadow(0 0 8px ${colors.glow})`,
                        }}
                    />
                </svg>

                {/* Center Value + Unit Hint */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                        className={`${config.fontSize} font-bold leading-none`}
                        style={{ color: colors.stroke }}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                    >
                        {displayValue}
                    </motion.span>
                    {unitHint && (
                        <motion.span
                            className="text-[9px] font-medium tracking-wider uppercase opacity-50 mt-0.5"
                            style={{ color: colors.stroke }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            transition={{ delay: 1, duration: 0.5 }}
                        >
                            {unitHint}
                        </motion.span>
                    )}
                </div>
            </div>

            {/* Label */}
            <motion.p
                className="mt-3 text-sm text-muted-foreground text-center font-medium"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
            >
                {label}
            </motion.p>
        </div>
    );
}
