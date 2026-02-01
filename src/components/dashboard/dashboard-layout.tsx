'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { DashboardHeader } from './dashboard-header';
import { DashboardSidebar } from './dashboard-sidebar';
import type { PortalRole } from '@/lib/types/user';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
    children: React.ReactNode;
    userName: string;
    userRole: PortalRole;
    avatarUrl?: string | null;
}

export function DashboardLayout({ children, userName, userRole, avatarUrl }: DashboardLayoutProps) {
    const locale = useLocale();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const isRTL = locale === 'ar';

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <DashboardHeader
                userName={userName}
                userRole={userRole}
                avatarUrl={avatarUrl}
                onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
            />

            {/* Sidebar - Desktop */}
            <div className="hidden md:block">
                <DashboardSidebar portalRole={userRole} />
            </div>

            {/* Sidebar - Mobile Overlay */}
            {mobileMenuOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-30 bg-black/50 md:hidden"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    {/* Sidebar */}
                    <div className={cn(
                        'fixed top-16 bottom-0 z-40 w-64 md:hidden',
                        isRTL ? 'right-0' : 'left-0'
                    )}>
                        <DashboardSidebar portalRole={userRole} />
                    </div>
                </>
            )}

            {/* Main Content */}
            <main className={cn(
                'min-h-[calc(100vh-4rem)] pt-16 transition-all duration-300',
                // Desktop: account for sidebar
                'md:ps-64'
            )}>
                <div className="p-4 md:p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
