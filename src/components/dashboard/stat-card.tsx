// ============================================================================
// STAT CARD v2 — Premium Dashboard Card with Metric + Ring Chart Modes
// Dark/Gold Theme | Glassmorphism | SVG Ring Chart | Animated
// ============================================================================
'use client';

import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================
type CardVariant = 'default' | 'gold' | 'success' | 'warning' | 'danger' | 'info';

interface StatCardBaseProps {
    label: string;
    icon: LucideIcon;
    variant?: CardVariant;
    subtitle?: string;
    className?: string;
}

interface MetricModeProps extends StatCardBaseProps {
    mode?: 'metric';
    value: number | string;
    suffix?: string;
}

interface RingModeProps extends StatCardBaseProps {
    mode: 'ring';
    percentage: number;
    centerLabel?: string;
}

export type StatCardProps = MetricModeProps | RingModeProps;

// ============================================================================
// VARIANT PALETTE
// ============================================================================
const VARIANTS: Record<CardVariant, {
    ring: string;
    ringTrack: string;
    iconBg: string;
    iconColor: string;
    glow: string;
    accentBorder: string;
}> = {
    default: {
        ring: 'stroke-primary',
        ringTrack: 'stroke-primary/15',
        iconBg: 'bg-primary/10',
        iconColor: 'text-primary',
        glow: 'shadow-primary/10',
        accentBorder: 'border-primary/20',
    },
    gold: {
        ring: 'stroke-amber-400',
        ringTrack: 'stroke-amber-400/15',
        iconBg: 'bg-amber-400/10',
        iconColor: 'text-amber-400',
        glow: 'shadow-amber-400/15',
        accentBorder: 'border-amber-400/25',
    },
    success: {
        ring: 'stroke-emerald-400',
        ringTrack: 'stroke-emerald-400/15',
        iconBg: 'bg-emerald-400/10',
        iconColor: 'text-emerald-400',
        glow: 'shadow-emerald-400/15',
        accentBorder: 'border-emerald-400/25',
    },
    danger: {
        ring: 'stroke-red-400',
        ringTrack: 'stroke-red-400/15',
        iconBg: 'bg-red-400/10',
        iconColor: 'text-red-400',
        glow: 'shadow-red-400/15',
        accentBorder: 'border-red-400/25',
    },
    warning: {
        ring: 'stroke-amber-500',
        ringTrack: 'stroke-amber-500/15',
        iconBg: 'bg-amber-500/10',
        iconColor: 'text-amber-500',
        glow: 'shadow-amber-500/15',
        accentBorder: 'border-amber-500/25',
    },
    info: {
        ring: 'stroke-sky-400',
        ringTrack: 'stroke-sky-400/15',
        iconBg: 'bg-sky-400/10',
        iconColor: 'text-sky-400',
        glow: 'shadow-sky-400/15',
        accentBorder: 'border-sky-400/25',
    },
};

// ============================================================================
// SVG RING CHART
// ============================================================================
const RING_SIZE = 80;
const RING_STROKE = 6;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function RingChart({
    percentage,
    centerLabel,
    variant = 'default',
}: {
    percentage: number;
    centerLabel?: string;
    variant?: CardVariant;
}) {
    const styles = VARIANTS[variant];
    const clampedPct = Math.min(Math.max(percentage, 0), 100);
    const offset = RING_CIRCUMFERENCE - (clampedPct / 100) * RING_CIRCUMFERENCE;
    // Max 1 decimal place, strip trailing zeroes (e.g. 100.0 → "100")
    const formattedPct = Number(clampedPct.toFixed(1));
    const displayLabel = centerLabel ?? `${formattedPct}%`;

    return (
        <div className="relative flex items-center justify-center">
            <svg
                width={RING_SIZE}
                height={RING_SIZE}
                viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
                className="transform -rotate-90"
            >
                {/* Track */}
                <circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    fill="none"
                    strokeWidth={RING_STROKE}
                    className={styles.ringTrack}
                />
                {/* Progress */}
                <circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    fill="none"
                    strokeWidth={RING_STROKE}
                    strokeLinecap="round"
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeDashoffset={offset}
                    className={cn(
                        styles.ring,
                        'transition-[stroke-dashoffset] duration-1000 ease-out'
                    )}
                />
            </svg>
            {/* Center Label */}
            <span className="absolute text-sm font-bold text-foreground">
                {displayLabel}
            </span>
        </div>
    );
}

// ============================================================================
// SKELETON LOADER (Dark Shimmer)
// ============================================================================
export function StatCardSkeleton({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-xl border p-5',
                'bg-card/30 backdrop-blur-md border-border/30',
                className
            )}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                    {/* Label shimmer */}
                    <div className="h-3 w-20 rounded-md bg-muted animate-pulse" />
                    {/* Value shimmer */}
                    <div className="h-8 w-28 rounded-md bg-muted animate-pulse" />
                    {/* Subtitle shimmer */}
                    <div className="h-2.5 w-16 rounded-md bg-muted/60 animate-pulse" />
                </div>
                {/* Icon shimmer */}
                <div className="h-11 w-11 rounded-xl bg-muted animate-pulse" />
            </div>
        </div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function StatCard(props: StatCardProps) {
    const { label, icon: Icon, variant = 'default', subtitle, className } = props;
    const styles = VARIANTS[variant];

    return (
        <div
            className={cn(
                // Glassmorphism base
                'relative overflow-hidden rounded-xl border p-5',
                'bg-card/30 backdrop-blur-md',
                styles.accentBorder,
                // Glow
                'shadow-lg',
                styles.glow,
                // Hover
                'transition-all duration-300 hover:scale-[1.02] hover:shadow-xl',
                // Group for inner animations
                'group',
                className
            )}
        >
            {/* Background gradient accent */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Content */}
            <div className="relative flex items-start justify-between gap-4">
                {/* Left: Text */}
                <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-medium text-muted-foreground truncate">
                        {label}
                    </p>

                    {props.mode === 'ring' ? (
                        /* Ring mode: show ring below label */
                        <div className="pt-2">
                            <RingChart
                                percentage={props.percentage}
                                centerLabel={props.centerLabel}
                                variant={variant}
                            />
                        </div>
                    ) : (
                        /* Metric mode: big number */
                        <p className="text-3xl font-bold tracking-tight text-foreground">
                            {typeof props.value === 'number'
                                ? props.value.toLocaleString()
                                : props.value}
                            {props.suffix && (
                                <span className="ml-1 text-lg font-medium text-muted-foreground">
                                    {props.suffix}
                                </span>
                            )}
                        </p>
                    )}

                    {subtitle && (
                        <p className="text-xs text-muted-foreground/70 truncate">
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* Right: Icon */}
                <div
                    className={cn(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                        styles.iconBg,
                        'shadow-lg',
                        styles.glow,
                        'transition-transform duration-300 group-hover:scale-110'
                    )}
                >
                    <Icon className={cn('h-5 w-5', styles.iconColor)} />
                </div>
            </div>
        </div>
    );
}
