'use client';

import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/actions/auth';
import type { PortalRole } from '@/lib/types/user';
import { LogOut, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
    userName: string;
    userRole: PortalRole;
    avatarUrl?: string | null;
    onMenuToggle?: () => void;
}

// Role display names and colors
const ROLE_CONFIG: Record<PortalRole, { label: string; color: string }> = {
    super_admin: { label: 'Super Admin', color: 'bg-red-500/10 text-red-600 dark:text-red-400' },
    aggregator_admin: { label: 'Operator', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    client_admin: { label: 'Admin', color: 'bg-green-500/10 text-green-600 dark:text-green-400' },
    reporter: { label: 'Reporter', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
    none: { label: 'User', color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400' },
};

export function DashboardHeader({ userName, userRole, avatarUrl, onMenuToggle }: DashboardHeaderProps) {
    const t = useTranslations('Common');
    const tNav = useTranslations('Navigation');
    const locale = useLocale();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const isRTL = locale === 'ar';

    useEffect(() => {
        setMounted(true);
    }, []);

    const roleConfig = ROLE_CONFIG[userRole];

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await signOut();
        } catch (error) {
            console.error('Logout failed:', error);
            setIsLoggingOut(false);
        }
    };

    return (
        <header className="fixed top-0 start-0 end-0 z-50 flex h-16 items-center justify-between border-b border-border/40 bg-background/80 px-4 shadow-sm backdrop-blur-lg">
            {/* Left Section: Logo + Mobile Menu */}
            <div className="flex items-center gap-3">
                {/* Mobile menu toggle */}
                <button
                    onClick={onMenuToggle}
                    className="inline-flex md:hidden items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                    <Menu className="h-5 w-5" />
                </button>

                {/* Logo */}
                {mounted ? (
                    <Image
                        src="/logo.png"
                        alt={t('company')}
                        width={140}
                        height={40}
                        priority
                        className="h-9 w-auto"
                    />
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                            <span className="text-lg font-bold text-primary-foreground">T</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Section: User Info + Actions */}
            <div className="flex items-center gap-3">
                {/* User Info */}
                <div className="hidden sm:flex items-center gap-3">
                    {/* Avatar */}
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                        {avatarUrl ? (
                            <Image
                                src={avatarUrl}
                                alt={userName}
                                width={32}
                                height={32}
                                className="rounded-full"
                            />
                        ) : (
                            userName.charAt(0).toUpperCase()
                        )}
                    </div>

                    {/* Name + Role Badge */}
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground leading-tight">
                            {userName}
                        </span>
                        <span className={cn(
                            'text-xs font-medium px-1.5 py-0.5 rounded-sm w-fit',
                            roleConfig.color
                        )}>
                            {roleConfig.label}
                        </span>
                    </div>
                </div>

                {/* Divider */}
                <div className="hidden sm:block h-8 w-px bg-border/50" />

                {/* Actions */}
                <div className="flex items-center gap-1">
                    <LanguageSwitcher />
                    <ThemeToggle />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="text-muted-foreground hover:text-destructive"
                        title={tNav('logout')}
                    >
                        <LogOut className={cn('h-5 w-5', isLoggingOut && 'animate-pulse')} />
                    </Button>
                </div>
            </div>
        </header>
    );
}
