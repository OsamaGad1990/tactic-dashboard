'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, KeyRound, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { loginSchema, codeLoginSchema } from '@/lib/validations/auth';
import { signInWithIdentifier, signInWithCode } from '@/lib/actions/auth';
import { getDashboardRoute } from '@/lib/types/user';
import { z } from 'zod';
import { cn } from '@/lib/utils';

type LoginFormValues = z.input<typeof loginSchema>;
type CodeLoginFormValues = z.input<typeof codeLoginSchema>;

type ValidationKey = 'identifier_required' | 'identifier_invalid' | 'password_required' | 'password_min' | 'code_required' | 'code_invalid';
type ErrorKey = 'invalid_credentials' | 'network_error' | 'too_many_attempts' | 'invalid_code';

type LoginMode = 'password' | 'code';

export function LoginForm() {
    const t = useTranslations('Auth');
    const tValidation = useTranslations('Validation');
    const tErrors = useTranslations('Errors');
    const locale = useLocale();
    const router = useRouter();
    const [loginMode, setLoginMode] = useState<LoginMode>('password');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const passwordForm = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            identifier: '',
            password: '',
            rememberMe: false,
        },
    });

    const codeForm = useForm<CodeLoginFormValues>({
        resolver: zodResolver(codeLoginSchema),
        defaultValues: {
            identifier: '',
            code: '',
            rememberMe: false,
        },
    });

    const currentForm = loginMode === 'password' ? passwordForm : codeForm;

    const onPasswordSubmit: SubmitHandler<LoginFormValues> = async (data) => {
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
                if (result.requirePasswordChange) {
                    router.push(`/${locale}/change-password`);
                } else {
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

    const onCodeSubmit: SubmitHandler<CodeLoginFormValues> = async (data) => {
        setIsLoading(true);
        setServerError(null);

        try {
            const result = await signInWithCode(data.identifier, data.code, data.rememberMe ?? false);

            if (result.error) {
                setServerError(result.error);
                setIsLoading(false);
                return;
            }

            if (result.success) {
                if (result.requirePasswordChange) {
                    router.push(`/${locale}/change-password`);
                } else {
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

    const switchMode = (mode: LoginMode) => {
        setLoginMode(mode);
        setServerError(null);
    };

    return (
        <div className="space-y-6">
            {/* Login Mode Toggle */}
            <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
                <button
                    type="button"
                    onClick={() => switchMode('password')}
                    className={cn(
                        'flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all',
                        loginMode === 'password'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                    <Lock className="h-4 w-4" />
                    {t('password_mode')}
                </button>
                <button
                    type="button"
                    onClick={() => switchMode('code')}
                    className={cn(
                        'flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all',
                        loginMode === 'code'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                    <KeyRound className="h-4 w-4" />
                    {t('code_mode')}
                </button>
            </div>

            {/* Password Login Form */}
            {loginMode === 'password' && (
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                    {serverError && (
                        <div className="rounded-lg bg-destructive/10 p-3 text-center text-sm text-destructive">
                            {getServerErrorMessage(serverError)}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="identifier">{t('identifier_label')}</Label>
                        <Input
                            id="identifier"
                            type="text"
                            placeholder={t('identifier_placeholder')}
                            autoComplete="username"
                            disabled={isLoading}
                            className="h-12"
                            {...passwordForm.register('identifier')}
                        />
                        {passwordForm.formState.errors.identifier && (
                            <p className="text-sm text-destructive">
                                {getErrorMessage(passwordForm.formState.errors.identifier.message)}
                            </p>
                        )}
                    </div>

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
                                {...passwordForm.register('password')}
                            />
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
                        {passwordForm.formState.errors.password && (
                            <p className="text-sm text-destructive">
                                {getErrorMessage(passwordForm.formState.errors.password.message)}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="rememberMe"
                                checked={passwordForm.watch('rememberMe')}
                                onCheckedChange={(checked) => passwordForm.setValue('rememberMe', !!checked)}
                                disabled={isLoading}
                            />
                            <Label htmlFor="rememberMe" className="cursor-pointer text-sm font-normal">
                                {t('remember_me')}
                            </Label>
                        </div>
                        <Link href={`/${locale}/forgot-password`} className="text-sm text-primary hover:underline">
                            {t('forgot_password')}
                        </Link>
                    </div>

                    <Button type="submit" className="h-12 w-full text-base font-semibold shadow-lg shadow-primary/30" disabled={isLoading}>
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
            )}

            {/* Code Login Form */}
            {loginMode === 'code' && (
                <form onSubmit={codeForm.handleSubmit(onCodeSubmit)} className="space-y-6">
                    {serverError && (
                        <div className="rounded-lg bg-destructive/10 p-3 text-center text-sm text-destructive">
                            {getServerErrorMessage(serverError)}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="code-identifier">{t('identifier_label')}</Label>
                        <Input
                            id="code-identifier"
                            type="text"
                            placeholder={t('identifier_placeholder')}
                            autoComplete="username"
                            disabled={isLoading}
                            className="h-12"
                            {...codeForm.register('identifier')}
                        />
                        {codeForm.formState.errors.identifier && (
                            <p className="text-sm text-destructive">
                                {getErrorMessage(codeForm.formState.errors.identifier.message)}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="code">{t('code_label')}</Label>
                        <Input
                            id="code"
                            type="text"
                            inputMode="numeric"
                            placeholder={t('code_placeholder')}
                            autoComplete="one-time-code"
                            disabled={isLoading}
                            className="h-12 text-center text-xl tracking-[0.5em] font-mono"
                            maxLength={6}
                            {...codeForm.register('code')}
                        />
                        {codeForm.formState.errors.code && (
                            <p className="text-sm text-destructive">
                                {getErrorMessage(codeForm.formState.errors.code.message)}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="code-rememberMe"
                            checked={codeForm.watch('rememberMe')}
                            onCheckedChange={(checked) => codeForm.setValue('rememberMe', !!checked)}
                            disabled={isLoading}
                        />
                        <Label htmlFor="code-rememberMe" className="cursor-pointer text-sm font-normal">
                            {t('remember_me')}
                        </Label>
                    </div>

                    <Button type="submit" className="h-12 w-full text-base font-semibold shadow-lg shadow-primary/30" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                                {t('logging_in')}
                            </>
                        ) : (
                            <span className="title-glow">{t('verify_code')}</span>
                        )}
                    </Button>
                </form>
            )}
        </div>
    );
}
