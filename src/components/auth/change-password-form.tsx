'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, Lock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { changePasswordSchema } from '@/lib/validations/auth';
import { changePassword } from '@/lib/actions/auth';
import { getDashboardRoute } from '@/lib/types/user';
import { z } from 'zod';

type ChangePasswordFormValues = z.input<typeof changePasswordSchema>;

type ValidationKey = 'password_required' | 'password_min' | 'passwords_not_match';
type ErrorKey = 'network_error' | 'password_too_weak' | 'same_password';

export function ChangePasswordForm() {
    const t = useTranslations('ChangePassword');
    const tValidation = useTranslations('Validation');
    const tErrors = useTranslations('Errors');
    const locale = useLocale();
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ChangePasswordFormValues>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            newPassword: '',
            confirmPassword: '',
        },
    });

    const onSubmit: SubmitHandler<ChangePasswordFormValues> = async (data) => {
        setIsLoading(true);
        setServerError(null);

        try {
            const result = await changePassword(data.newPassword);

            if (result.error) {
                setServerError(result.error);
                setIsLoading(false);
                return;
            }

            if (result.success) {
                // Redirect to role-based dashboard after successful password change
                const dashboardPath = getDashboardRoute(result.portalRole ?? 'none', locale);
                router.push(dashboardPath);
                router.refresh();
            }
        } catch {
            setServerError('network_error');
        } finally {
            setIsLoading(false);
        }
    };

    const getErrorMessage = (errorKey: string | undefined): string => {
        if (!errorKey) return '';
        return tValidation(errorKey as ValidationKey);
    };

    const getServerErrorMessage = (errorKey: string | null): string => {
        if (!errorKey) return '';
        return tErrors(errorKey as ErrorKey);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {serverError && (
                <div className="rounded-lg bg-destructive/10 p-3 text-center text-sm text-destructive">
                    {getServerErrorMessage(serverError)}
                </div>
            )}

            {/* New Password */}
            <div className="space-y-2">
                <Label htmlFor="newPassword">{t('new_password_label')}</Label>
                <div className="relative">
                    <Input
                        id="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('new_password_placeholder')}
                        autoComplete="new-password"
                        disabled={isLoading}
                        className="h-12 ps-12 pe-12"
                        {...register('newPassword')}
                    />
                    <Lock className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute end-1 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                    >
                        {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                    </Button>
                </div>
                {errors.newPassword && (
                    <p className="text-sm text-destructive">
                        {getErrorMessage(errors.newPassword.message)}
                    </p>
                )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('confirm_password_label')}</Label>
                <div className="relative">
                    <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder={t('confirm_password_placeholder')}
                        autoComplete="new-password"
                        disabled={isLoading}
                        className="h-12 ps-12 pe-12"
                        {...register('confirmPassword')}
                    />
                    <Lock className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute end-1 top-1/2 -translate-y-1/2"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isLoading}
                    >
                        {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                    </Button>
                </div>
                {errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                        {getErrorMessage(errors.confirmPassword.message)}
                    </p>
                )}
            </div>

            <Button
                type="submit"
                className="h-12 w-full text-base font-semibold shadow-lg shadow-primary/30"
                disabled={isLoading}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="me-2 h-4 w-4 animate-spin" />
                        {t('changing')}
                    </>
                ) : (
                    <>
                        <CheckCircle className="me-2 h-4 w-4" />
                        {t('change_password_button')}
                    </>
                )}
            </Button>
        </form>
    );
}
