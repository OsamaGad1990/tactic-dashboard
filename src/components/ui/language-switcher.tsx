'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Locale } from '@/i18n/routing';

export function LanguageSwitcher() {
    const t = useTranslations('Language');
    const locale = useLocale() as Locale;
    const router = useRouter();
    const pathname = usePathname();

    const switchLocale = () => {
        const newLocale: Locale = locale === 'ar' ? 'en' : 'ar';

        // Remove current locale from pathname and add new one
        const segments = pathname.split('/');
        segments[1] = newLocale;
        const newPath = segments.join('/');

        router.push(newPath);
        router.refresh();
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={switchLocale}
            className="gap-2"
        >
            <Languages className="h-4 w-4" />
            <span>{t('switch')}</span>
        </Button>
    );
}
