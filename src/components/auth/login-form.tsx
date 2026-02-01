'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { loginSchema } from '@/lib/validations/auth';
import { signInWithIdentifier } from '@/lib/actions/auth';
import { getDashboardRoute } from '@/lib/types/user';
import { z } from 'zod';

type LoginFormValues = z.input<typeof loginSchema>;

type ValidationKey = 'identifier_required' | 'identifier_invalid' | 'password_required' | 'password_min';
type ErrorKey = 'invalid_credentials' | 'network_error' | 'too_many_attempts';

export function LoginForm() {
    const t = useTranslations('Auth');
    const tValidation = useTranslations('Validation');
    const tErrors = useTranslations('Errors');
    const locale = useLocale();
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            identifier: '',
            password: '',
            rememberMe: false,
        },
    });

    const rememberMe = watch('rememberMe');

    const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
        setIsLoading(true);
        setServerError(null);

        try {
            const result = await signInWithIdentifier(data.identifier, data.password, data.rememberMe ?? false);

            if (result.error) {
                setServerError(result.error);
                setIsLoading(false);
                return;
            }

            if (result.success) {
                // Check if user needs to change password (first login with pending status)
                if (result.requirePasswordChange) {
                    router.push(`/${locale}/change-password`);
                } else {
                    // Redirect to role-based dashboard
                    const dashboardPath = getDashboardRoute(result.portalRole ?? 'none', locale);
                    router.push(dashboardPath);
                }
                router.refresh();
            }
        } catch {
            setServerError('network_error');
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
            {/* Server Error */}
            {serverError && (
                <div className="rounded-lg bg-destructive/10 p-3 text-center text-sm text-destructive">
                    {getServerErrorMessage(serverError)}
                </div>
            )}

            {/* Email/Username Field */}
            <div className="space-y-2">
                <Label htmlFor="identifier">{t('identifier_label')}</Label>
                <Input
                    id="identifier"
                    type="text"
                    placeholder={t('identifier_placeholder')}
                    autoComplete="username"
                    disabled={isLoading}
                    className="h-12"
                    {...register('identifier')}
                />
                {errors.identifier && (
                    <p className="text-sm text-destructive">
                        {getErrorMessage(errors.identifier.message)}
                    </p>
                )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
                <Label htmlFor="password">{t('password_label')}</Label>
                <div className="relative">
                    <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('password_placeholder')}
                        autoComplete="current-password"
                        disabled={isLoading}
                        className="h-12 pe-12"
                        {...register('password')}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute end-1 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                        aria-label={showPassword ? t('hide_password') : t('show_password')}
                    >
                        {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                    </Button>
                </div>
                {errors.password && (
                    <p className="text-sm text-destructive">
                        {getErrorMessage(errors.password.message)}
                    </p>
                )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Checkbox
                        id="rememberMe"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setValue('rememberMe', !!checked)}
                        disabled={isLoading}
                    />
                    <Label htmlFor="rememberMe" className="cursor-pointer text-sm font-normal">
                        {t('remember_me')}
                    </Label>
                </div>
                <Link
                    href={`/${locale}/forgot-password`}
                    className="text-sm text-primary hover:underline"
                >
                    {t('forgot_password')}
                </Link>
            </div>

            {/* Submit Button */}
            <Button
                type="submit"
                className="h-12 w-full text-base font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300"
                disabled={isLoading}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="me-2 h-4 w-4 animate-spin" />
                        {t('logging_in')}
                    </>
                ) : (
                    <span className="title-glow">{t('login_button')}</span>
                )}
            </Button>
        </form>
    );
}
