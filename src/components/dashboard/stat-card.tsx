'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: number | string;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    variant?: 'default' | 'success' | 'warning' | 'danger';
}

const variantStyles = {
    default: {
        iconBg: 'bg-primary/10',
        iconColor: 'text-primary',
        glow: 'shadow-primary/20',
    },
    success: {
        iconBg: 'bg-emerald-500/10',
        iconColor: 'text-emerald-500',
        glow: 'shadow-emerald-500/20',
    },
    warning: {
        iconBg: 'bg-amber-500/10',
        iconColor: 'text-amber-500',
        glow: 'shadow-amber-500/20',
    },
    danger: {
        iconBg: 'bg-red-500/10',
        iconColor: 'text-red-500',
        glow: 'shadow-red-500/20',
    },
};

export function StatCard({ label, value, icon: Icon, trend, variant = 'default' }: StatCardProps) {
    const styles = variantStyles[variant];

    return (
        <div className={cn(
            // Glassmorphism base
            'relative overflow-hidden rounded-xl border p-5',
            'bg-card/30 backdrop-blur-md',
            'border-primary/20',
            // Subtle glow effect
            'shadow-lg',
            styles.glow,
            // Hover animation
            'transition-all duration-300 hover:scale-[1.02] hover:shadow-xl'
        )}>
            {/* Background gradient accent */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />

            {/* Content */}
            <div className="relative flex items-start justify-between">
                {/* Text */}
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                        {label}
                    </p>
                    <p className="text-3xl font-bold tracking-tight text-foreground">
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </p>

                    {/* Trend indicator */}
                    {trend && (
                        <div className={cn(
                            'flex items-center gap-1 text-xs font-medium',
                            trend.isPositive ? 'text-emerald-500' : 'text-red-500'
                        )}>
                            <span>{trend.isPositive ? '↑' : '↓'}</span>
                            <span>{Math.abs(trend.value)}%</span>
                            <span className="text-muted-foreground">vs last week</span>
                        </div>
                    )}
                </div>

                {/* Icon with glow */}
                <div className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-xl',
                    styles.iconBg,
                    // Glow effect
                    'shadow-lg',
                    styles.glow
                )}>
                    <Icon className={cn('h-6 w-6', styles.iconColor)} />
                </div>
            </div>
        </div>
    );
}
