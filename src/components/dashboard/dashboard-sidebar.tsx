'use client';

import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { PortalRole } from '@/lib/types/user';
import {
    Building2,
    Users,
    Settings,
    Shield,
    Package,
    ClipboardList,
    BarChart3,
    UserCog,
    ChevronLeft,
    ChevronRight,
    LayoutDashboard,
    Factory,
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

// Role-based navigation items
function getNavItems(role: PortalRole, locale: string, t: (key: string) => string): NavItem[] {
    const baseItems: NavItem[] = [];

    // Super Admin - sees everything
    if (role === 'super_admin') {
        baseItems.push(
            { label: t('overview'), href: `/${locale}/dashboard/admin`, icon: <LayoutDashboard className="h-5 w-5" /> },
            { label: t('companies'), href: `/${locale}/dashboard/admin/companies`, icon: <Building2 className="h-5 w-5" /> },
            { label: t('operators'), href: `/${locale}/dashboard/admin/operators`, icon: <Factory className="h-5 w-5" /> },
            { label: t('all_users'), href: `/${locale}/dashboard/admin/users`, icon: <Users className="h-5 w-5" /> },
            { label: t('audit_logs'), href: `/${locale}/dashboard/admin/audit`, icon: <Shield className="h-5 w-5" /> },
            { label: t('settings'), href: `/${locale}/dashboard/admin/settings`, icon: <Settings className="h-5 w-5" /> },
        );
    }

    // Aggregator Admin - operator dashboard
    if (role === 'aggregator_admin') {
        baseItems.push(
            { label: t('overview'), href: `/${locale}/dashboard/operator`, icon: <LayoutDashboard className="h-5 w-5" /> },
            { label: t('my_companies'), href: `/${locale}/dashboard/operator/companies`, icon: <Building2 className="h-5 w-5" /> },
            { label: t('teams'), href: `/${locale}/dashboard/operator/teams`, icon: <Users className="h-5 w-5" /> },
            { label: t('reports'), href: `/${locale}/dashboard/operator/reports`, icon: <BarChart3 className="h-5 w-5" /> },
        );
    }

    // Client Admin - company dashboard
    if (role === 'client_admin') {
        baseItems.push(
            { label: t('overview'), href: `/${locale}/dashboard/company`, icon: <LayoutDashboard className="h-5 w-5" /> },
            { label: t('my_team'), href: `/${locale}/dashboard/company/team`, icon: <Users className="h-5 w-5" /> },
            { label: t('products'), href: `/${locale}/dashboard/company/products`, icon: <Package className="h-5 w-5" /> },
            { label: t('visits'), href: `/${locale}/dashboard/company/visits`, icon: <ClipboardList className="h-5 w-5" /> },
            { label: t('reports'), href: `/${locale}/dashboard/company/reports`, icon: <BarChart3 className="h-5 w-5" /> },
        );
    }

    // Reporter - reports only
    if (role === 'reporter') {
        baseItems.push(
            { label: t('overview'), href: `/${locale}/dashboard/reports`, icon: <LayoutDashboard className="h-5 w-5" /> },
            { label: t('visit_reports'), href: `/${locale}/dashboard/reports/visits`, icon: <ClipboardList className="h-5 w-5" /> },
            { label: t('analytics'), href: `/${locale}/dashboard/reports/analytics`, icon: <BarChart3 className="h-5 w-5" /> },
        );
    }

    return baseItems;
}

interface DashboardSidebarProps {
    portalRole: PortalRole;
}

export function DashboardSidebar({ portalRole }: DashboardSidebarProps) {
    const locale = useLocale();
    const pathname = usePathname();
    const t = useTranslations('Sidebar');
    const [collapsed, setCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);
    const isRTL = locale === 'ar';

    useEffect(() => {
        setMounted(true);
    }, []);

    const navItems = getNavItems(portalRole, locale, t);

    return (
        <aside
            className={cn(
                'fixed top-16 bottom-0 z-40 flex flex-col border-e border-border/40 bg-card/50 backdrop-blur-lg transition-all duration-300',
                collapsed ? 'w-16' : 'w-64',
                isRTL ? 'right-0' : 'left-0'
            )}
        >
            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                                isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                collapsed && 'justify-center'
                            )}
                            title={collapsed ? item.label : undefined}
                        >
                            {item.icon}
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Collapse Toggle */}
            <div className="border-t border-border/40 p-3">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                    {isRTL ? (
                        collapsed ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />
                    ) : (
                        collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />
                    )}
                    {!collapsed && <span>{t('collapse')}</span>}
                </button>
            </div>
        </aside>
    );
}
