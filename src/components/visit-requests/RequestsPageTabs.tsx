'use client';

import { cn } from '@/lib/utils';
import { CalendarClock, Coffee } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useState } from 'react';

type OuterTabKey = 'offroute' | 'breaks';

interface RequestsPageTabsProps {
    offroutePanel: React.ReactNode;
    breaksPanel: React.ReactNode;
    pendingOffrouteCount: number;
    pendingBreaksCount: number;
}

export function RequestsPageTabs({
    offroutePanel,
    breaksPanel,
    pendingOffrouteCount,
    pendingBreaksCount,
}: RequestsPageTabsProps) {
    const locale = useLocale();
    const isArabic = locale === 'ar';
    const [activeTab, setActiveTab] = useState<OuterTabKey>('offroute');

    const tabs: { key: OuterTabKey; labelEn: string; labelAr: string; icon: React.ReactNode; count: number }[] = [
        {
            key: 'offroute',
            labelEn: 'Off-Route Requests',
            labelAr: 'طلبات خارج الخط',
            icon: <CalendarClock className="h-4 w-4" />,
            count: pendingOffrouteCount,
        },
        {
            key: 'breaks',
            labelEn: 'Break Requests',
            labelAr: 'طلبات الاستراحة',
            icon: <Coffee className="h-4 w-4" />,
            count: pendingBreaksCount,
        },
    ];

    return (
        <div className="space-y-4">
            {/* Outer Segment Tabs */}
            <div className="flex gap-2 border-b border-border">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all duration-200',
                            activeTab === tab.key
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted',
                        )}
                    >
                        {tab.icon}
                        <span>{isArabic ? tab.labelAr : tab.labelEn}</span>
                        {tab.count > 0 && (
                            <span className={cn(
                                'rounded-full px-2 py-0.5 text-xs font-bold',
                                activeTab === tab.key
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
                            )}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Panel Content */}
            <div className={activeTab === 'offroute' ? 'block' : 'hidden'}>
                {offroutePanel}
            </div>
            <div className={activeTab === 'breaks' ? 'block' : 'hidden'}>
                {breaksPanel}
            </div>
        </div>
    );
}
