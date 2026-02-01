'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { ArrowLeft, Loader2, Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { forgotPasswordSchema } from '@/lib/validations/auth';
import { requestPasswordReset } from '@/lib/actions/auth';
import { z } from 'zod';

type ForgotPasswordFormValues = z.input<typeof forgotPasswordSchema>;

type ValidationKey = 'email_required' | 'email_invalid';
type ErrorKey = 'network_error' | 'too_many_attempts' | 'email_not_found';

export function ForgotPasswordForm() {
    const t = useTranslations('ForgotPassword');
    const tValidation = useTranslations('Validation');
    const tErrors = useTranslations('Errors');
    const locale = useLocale();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: '',
        },
    });

    const onSubmit: SubmitHandler<ForgotPasswordFormValues> = async (data) => {
        setIsLoading(true);
        setServerError(null);

        try {
            const result = await requestPasswordReset(data.email);

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
                    <h3 className="text-lg font-semibold">{t('email_sent')}</h3>
                    <p className="text-sm text-muted-foreground">
                        {t('email_sent_description')}
                    </p>
                </div>
                <Button asChild variant="outline" className="w-full">
                    <Link href={`/${locale}/login`}>
                        <ArrowLeft className="me-2 h-4 w-4" />
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

            <div className="space-y-2">
                <Label htmlFor="email">{t('email_label')}</Label>
                <div className="relative">
                    <Input
                        id="email"
                        type="email"
                        placeholder={t('email_placeholder')}
                        autoComplete="email"
                        disabled={isLoading}
                        className="h-12 ps-12"
                        {...register('email')}
                    />
                    <Mail className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
                {errors.email && (
                    <p className="text-sm text-destructive">
                        {getErrorMessage(errors.email.message)}
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
                        {t('sending')}
                    </>
                ) : (
                    t('send_reset_link')
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
