'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, Lock, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { changePasswordSchema } from '@/lib/validations/auth';
import { resetPassword } from '@/lib/actions/auth';
import { z } from 'zod';

type ResetPasswordFormValues = z.input<typeof changePasswordSchema>;

type ValidationKey = 'password_required' | 'password_min' | 'passwords_not_match';
type ErrorKey = 'network_error' | 'password_too_weak' | 'same_password';

export function ResetPasswordForm() {
    const t = useTranslations('ResetPassword');
    const tValidation = useTranslations('Validation');
    const tErrors = useTranslations('Errors');
    const locale = useLocale();
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            newPassword: '',
            confirmPassword: '',
        },
    });

    const onSubmit: SubmitHandler<ResetPasswordFormValues> = async (data) => {
        setIsLoading(true);
        setServerError(null);

        try {
            const result = await resetPassword(data.newPassword);

            if (result.error) {
                setServerError(result.error);
                setIsLoading(false);
                return;
            }

            if (result.success) {
                setIsSuccess(true);
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

    if (isSuccess) {
        return (
            <div className="space-y-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{t('success')}</h3>
                    <p className="text-sm text-muted-foreground">
                        {t('success_description')}
                    </p>
                </div>
                <Button asChild className="w-full">
                    <Link href={`/${locale}/login`}>
                        {t('back_to_login')}
                    </Link>
                </Button>
            </div>
        );
    }

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
                        {t('resetting')}
                    </>
                ) : (
                    <>
                        <CheckCircle className="me-2 h-4 w-4" />
                        {t('reset_button')}
                    </>
                )}
            </Button>

            <Button asChild variant="ghost" className="w-full">
                <Link href={`/${locale}/login`}>
                    <ArrowLeft className="me-2 h-4 w-4" />
                    {t('back_to_login')}
                </Link>
            </Button>
        </form>
    );
}
