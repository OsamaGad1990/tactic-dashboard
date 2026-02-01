'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { useEffect, useState } from 'react';

export function AppHeader() {
    const t = useTranslations('Common');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <header className="fixed top-0 start-0 end-0 z-50 flex h-16 items-center justify-between border-b border-border/40 bg-background/80 px-4 shadow-sm backdrop-blur-lg md:px-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
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
                        <span className="text-lg font-semibold text-foreground">
                            {t('company')}
                        </span>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <ThemeToggle />
            </div>
        </header>
    );
}
