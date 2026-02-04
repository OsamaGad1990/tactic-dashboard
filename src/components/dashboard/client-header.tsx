'use client';

import Image from 'next/image';
import Link from 'next/link';
import { KeyRound, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ClientHeaderProps {
    logoUrl: string | null;
    nameEn: string;
    nameAr: string | null;
    locale: string;
    userName: string;
    userArabicName: string | null;
    roleLabel: string;
    welcomeText: string;
    changePasswordText: string;
}

/**
 * Check if a string is a valid URL
 */
function isValidUrl(url: string | null): url is string {
    if (!url || url.trim() === '') return false;
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

export function ClientHeader({
    logoUrl,
    nameEn,
    nameAr,
    locale,
    userName,
    userArabicName,
    roleLabel,
    welcomeText,
    changePasswordText,
}: ClientHeaderProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Display name based on locale
    const displayName = locale === 'ar' ? (nameAr || nameEn) : nameEn;
    const hasValidLogo = isValidUrl(logoUrl);

    // Localized user name
    const displayUserName = locale === 'ar' ? (userArabicName || userName) : userName;

    return (
        <>
            <div className="relative flex items-center gap-4 p-4 bg-card rounded-2xl border shadow-sm">
                {/* Logo - Rounded & Clickable */}
                <button
                    onClick={() => hasValidLogo && setIsModalOpen(true)}
                    className="relative w-16 h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0 ring-2 ring-primary/20 hover:ring-primary/40 transition-all cursor-pointer"
                    disabled={!hasValidLogo}
                >
                    {hasValidLogo ? (
                        <Image
                            src={logoUrl}
                            alt={displayName}
                            fill
                            className="object-cover"
                            sizes="64px"
                        />
                    ) : (
                        <span className="text-2xl">🏢</span>
                    )}
                </button>

                {/* Company Name */}
                <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-foreground truncate">
                        {displayName}
                    </h2>
                    {/* Show both names if available and different */}
                    {nameAr && nameEn && nameAr !== nameEn && (
                        <p className="text-sm text-muted-foreground truncate">
                            {locale === 'ar' ? nameEn : nameAr}
                        </p>
                    )}
                </div>

                {/* Welcome Message - Absolutely Centered */}
                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5">
                    <span className="text-sm text-muted-foreground">
                        {welcomeText}
                    </span>
                    <span className="text-base font-semibold text-foreground">
                        {displayUserName}
                    </span>
                    <span className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-md',
                        'bg-green-500/10 text-green-600 dark:text-green-400'
                    )}>
                        {roleLabel}
                    </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                    {/* Change Password Button */}
                    <Link
                        href={`/${locale}/change-password`}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                    >
                        <KeyRound className="w-4 h-4" />
                        <span className="text-sm font-medium hidden sm:inline">
                            {changePasswordText}
                        </span>
                    </Link>
                </div>
            </div>

            {/* Logo Modal */}
            {isModalOpen && hasValidLogo && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div className="relative max-w-2xl max-h-[80vh] p-4">
                        {/* Close Button */}
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute -top-2 -right-2 z-10 p-2 rounded-full bg-card border shadow-lg hover:bg-muted transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Large Logo */}
                        <div className="relative w-80 h-80 rounded-[2rem] overflow-hidden bg-card shadow-2xl ring-1 ring-white/10">
                            <Image
                                src={logoUrl}
                                alt={displayName}
                                fill
                                className="object-contain p-4 rounded-3xl"
                                sizes="320px"
                            />
                        </div>

                        {/* Company Name */}
                        <p className="text-center text-white text-lg font-semibold mt-4">
                            {displayName}
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
