'use client';

import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/actions/auth';
import type { PortalRole } from '@/lib/types/user';
import { LogOut, Menu, X, Camera, Loader2, Trash2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface DashboardHeaderProps {
    userName: string;
    userRole: PortalRole;
    avatarUrl?: string | null;
    userId: string;
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

const AVATAR_BUCKET = 'avatars';
const SIGNED_URL_EXPIRY = 3600; // 1 hour

export function DashboardHeader({ userName, userRole, avatarUrl, userId, onMenuToggle }: DashboardHeaderProps) {
    const t = useTranslations('Common');
    const tNav = useTranslations('Navigation');
    const tHeader = useTranslations('Header');
    const locale = useLocale();
    const [mounted, setMounted] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch signed URL for avatar on mount
    useEffect(() => {
        setMounted(true);

        async function fetchSignedUrl() {
            if (!avatarUrl) return;

            // If it's already a signed URL or external URL, use it
            if (avatarUrl.includes('token=') || !avatarUrl.includes('supabase')) {
                setCurrentAvatar(avatarUrl);
                return;
            }

            // Extract path from full URL
            const pathMatch = avatarUrl.match(/avatars\/(.+)/);
            if (!pathMatch) {
                setCurrentAvatar(avatarUrl);
                return;
            }

            const supabase = createClient();
            const { data, error } = await supabase.storage
                .from(AVATAR_BUCKET)
                .createSignedUrl(pathMatch[1], SIGNED_URL_EXPIRY);

            if (!error && data) {
                setCurrentAvatar(data.signedUrl);
            }
        }

        fetchSignedUrl();
    }, [avatarUrl]);

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

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('File size must be less than 2MB');
            return;
        }

        setIsUploading(true);

        try {
            const supabase = createClient();
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/main.${fileExt}`;

            // Upload to storage
            const { error: uploadError } = await supabase.storage
                .from(AVATAR_BUCKET)
                .upload(fileName, file, { upsert: true });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                alert('Failed to upload avatar');
                return;
            }

            // Get signed URL for display
            const { data: signedData } = await supabase.storage
                .from(AVATAR_BUCKET)
                .createSignedUrl(fileName, SIGNED_URL_EXPIRY);

            // Get public URL for storage in DB
            const { data: urlData } = supabase.storage
                .from(AVATAR_BUCKET)
                .getPublicUrl(fileName);

            // Update user profile with public URL path
            const { error: updateError } = await supabase
                .from('accounts')
                .update({ avatar_url: urlData.publicUrl })
                .eq('id', userId);

            if (updateError) {
                console.error('Update error:', updateError);
                alert('Failed to update profile');
                return;
            }

            // Update local state with signed URL
            setCurrentAvatar(signedData?.signedUrl || urlData.publicUrl);
            setIsAvatarModalOpen(false);
        } catch (error) {
            console.error('Avatar upload failed:', error);
            alert('Failed to upload avatar');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteAvatar = async () => {
        const confirmMessage = tHeader('confirm_delete_avatar');
        if (!window.confirm(confirmMessage)) return;

        setIsDeleting(true);

        try {
            const supabase = createClient();

            // List files in user's folder to find the avatar
            const { data: files, error: listError } = await supabase.storage
                .from(AVATAR_BUCKET)
                .list(userId);

            if (listError) {
                console.error('List error:', listError);
            }

            if (files && files.length > 0) {
                // Delete all files in user's folder
                const filesToDelete = files.map(f => `${userId}/${f.name}`);
                const { error: deleteError } = await supabase.storage
                    .from(AVATAR_BUCKET)
                    .remove(filesToDelete);

                if (deleteError) {
                    console.error('Storage delete error:', deleteError);
                    alert('Failed to delete avatar from storage');
                    return;
                }
            }

            // Update user profile
            const { error: updateError } = await supabase
                .from('accounts')
                .update({ avatar_url: null })
                .eq('id', userId);

            if (updateError) {
                console.error('Update error:', updateError);
                alert('Failed to update profile');
                return;
            }

            // Update local state
            setCurrentAvatar(null);
            setIsAvatarModalOpen(false);
        } catch (error) {
            console.error('Avatar delete failed:', error);
            alert('Failed to delete avatar');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
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

                    {mounted ? (
                        <a href={`/${locale}/dashboard`} className="cursor-pointer">
                            <Image
                                src="/logo.png"
                                alt={t('company')}
                                width={120}
                                height={36}
                                priority
                                className="h-8 w-auto object-contain"
                            />
                        </a>
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
                        {/* Clickable Avatar */}
                        <button
                            onClick={() => setIsAvatarModalOpen(true)}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold hover:ring-2 hover:ring-primary/50 transition-all overflow-hidden cursor-pointer"
                        >
                            {currentAvatar ? (
                                <Image
                                    src={currentAvatar}
                                    alt={userName}
                                    width={36}
                                    height={36}
                                    className="rounded-full object-cover w-full h-full"
                                />
                            ) : (
                                userName.charAt(0).toUpperCase()
                            )}
                        </button>

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
                            className="text-muted-foreground hover:text-destructive cursor-pointer"
                            title={tNav('logout')}
                        >
                            <LogOut className={cn('h-5 w-5', isLoggingOut && 'animate-pulse')} />
                        </Button>
                    </div>
                </div>
            </header>

            {/* Avatar Modal */}
            {isAvatarModalOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
                    onClick={() => !isUploading && !isDeleting && setIsAvatarModalOpen(false)}
                >
                    <div
                        className="relative bg-card rounded-3xl p-6 shadow-2xl max-w-sm w-full mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => !isUploading && !isDeleting && setIsAvatarModalOpen(false)}
                            className="absolute top-3 end-3 p-2 rounded-full hover:bg-muted transition-colors"
                            disabled={isUploading || isDeleting}
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Avatar Display */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative w-32 h-32 rounded-full overflow-hidden bg-muted ring-4 ring-primary/20">
                                {currentAvatar ? (
                                    <Image
                                        src={currentAvatar}
                                        alt={userName}
                                        fill
                                        className="object-cover rounded-full"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center w-full h-full text-4xl font-bold text-primary">
                                        {userName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            <div className="text-center">
                                <h3 className="text-lg font-semibold">{userName}</h3>
                                <span className={cn(
                                    'text-xs font-medium px-2 py-1 rounded-md inline-block mt-1',
                                    roleConfig.color
                                )}>
                                    {roleConfig.label}
                                </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-2 w-full">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    className="hidden"
                                />
                                <Button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading || isDeleting}
                                    className="w-full"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 me-2 animate-spin" />
                                            {tHeader('uploading')}
                                        </>
                                    ) : (
                                        <>
                                            <Camera className="w-4 h-4 me-2" />
                                            {tHeader('change_avatar')}
                                        </>
                                    )}
                                </Button>

                                {currentAvatar && (
                                    <Button
                                        variant="outline"
                                        onClick={handleDeleteAvatar}
                                        disabled={isUploading || isDeleting}
                                        className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                        {isDeleting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 me-2 animate-spin" />
                                                {tHeader('deleting')}
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="w-4 h-4 me-2" />
                                                {tHeader('delete_avatar')}
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
