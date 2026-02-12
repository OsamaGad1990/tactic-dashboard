// ============================================================================
// WIDGET REGISTRY — Maps feature keys to dashboard widgets
// SOS & Damage: "System Active" status cards (MVP)
// ============================================================================
'use client';

import { cn } from '@/lib/utils';
import { AlertTriangle, Package, Clock, ShieldCheck } from 'lucide-react';
import { useLocale } from 'next-intl';

// ============================================================================
// TYPES
// ============================================================================
interface WidgetMeta {
    key: string;
    label: string;
    labelAr: string;
    icon: React.ElementType;
    description: string;
    descriptionAr: string;
    activeLabel: string;
    activeLabelAr: string;
}

// ============================================================================
// REGISTRY — feature_key → widget metadata
// ============================================================================
const WIDGET_CATALOG: Record<string, WidgetMeta> = {
    'visit.sos': {
        key: 'visit.sos',
        label: 'SOS Alerts',
        labelAr: 'تنبيهات الطوارئ',
        icon: AlertTriangle,
        description: 'Emergency visit requests and SOS alerts',
        descriptionAr: 'طلبات الزيارات الطارئة وتنبيهات الطوارئ',
        activeLabel: 'System Active — No Alerts',
        activeLabelAr: 'النظام نشط — لا توجد تنبيهات',
    },
    'visit.damage': {
        key: 'visit.damage',
        label: 'Damage Reports',
        labelAr: 'تقارير الأضرار',
        icon: Package,
        description: 'Product damage reporting and trends',
        descriptionAr: 'تقارير الأضرار وتتبع الاتجاهات',
        activeLabel: 'Monitoring Active — 0 Reports',
        activeLabelAr: 'المراقبة نشطة — ٠ تقرير',
    },
    'visit.expiry': {
        key: 'visit.expiry',
        label: 'Expiry Tracking',
        labelAr: 'تتبع الصلاحية',
        icon: Clock,
        description: 'Product expiry monitoring and alerts',
        descriptionAr: 'مراقبة صلاحية المنتجات والتنبيهات',
        activeLabel: 'Tracking Active — No Alerts',
        activeLabelAr: 'التتبع نشط — لا توجد تنبيهات',
    },
};

// ============================================================================
// ACTIVE WIDGET CARD (Premium "System Active" style)
// ============================================================================
function ActiveWidgetCard({ meta }: { meta: WidgetMeta }) {
    const locale = useLocale();
    const isAr = locale === 'ar';

    const Icon = meta.icon;
    const label = isAr ? meta.labelAr : meta.label;
    const statusText = isAr ? meta.activeLabelAr : meta.activeLabel;

    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-xl border p-5',
                'bg-card/30 backdrop-blur-md border-emerald-500/20',
                'flex items-center gap-4',
                'min-h-[100px]',
                'transition-all duration-300 hover:border-emerald-500/40 hover:bg-card/40'
            )}
        >
            {/* Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent" />

            {/* Icon */}
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 shadow-lg shadow-emerald-500/5">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
            </div>

            {/* Text */}
            <div className="relative flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    {label}
                </h3>
                <p className="mt-0.5 text-xs text-emerald-400/80 font-medium">
                    {statusText}
                </p>
            </div>

            {/* Active Pulse */}
            <div className="relative shrink-0">
                <span className="flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
            </div>
        </div>
    );
}

// ============================================================================
// EXPORTED: Render widgets for enabled features
// ============================================================================
export function WidgetGrid({
    enabledFeatures,
    className,
}: {
    enabledFeatures: string[];
    className?: string;
}) {
    const locale = useLocale();
    const isAr = locale === 'ar';

    // Filter to only features that have registered widgets
    const activeWidgets = enabledFeatures
        .filter(key => key in WIDGET_CATALOG)
        .map(key => WIDGET_CATALOG[key]);

    if (activeWidgets.length === 0) return null;

    return (
        <section className={className}>
            <div className="flex items-center gap-2 pb-3">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h2 className="text-lg font-semibold text-foreground">
                    {isAr ? 'وحدات المراقبة' : 'Monitoring Modules'}
                </h2>
            </div>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {activeWidgets.map(meta => (
                    <ActiveWidgetCard key={meta.key} meta={meta} />
                ))}
            </div>
        </section>
    );
}

/**
 * Check if a feature key has a registered widget
 */
export function hasWidget(featureKey: string): boolean {
    return featureKey in WIDGET_CATALOG;
}

/**
 * Get all registered widget keys
 */
export function getRegisteredWidgetKeys(): string[] {
    return Object.keys(WIDGET_CATALOG);
}
