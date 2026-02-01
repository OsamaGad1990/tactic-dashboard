import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getUser, getUserWithProfile } from '@/lib/actions/auth';
import { ChangePasswordForm } from '@/components/auth/change-password-form';
import { LoginBackground } from '@/components/auth/login-background';
import { AppHeader } from '@/components/layout/app-header';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import Image from 'next/image';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'ChangePassword' });

    return {
        title: t('title'),
        description: t('description'),
    };
}

export default async function ChangePasswordPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const user = await getUser();
    const t = await getTranslations({ locale, namespace: 'ChangePassword' });

    // Must be logged in
    if (!user) {
        redirect(`/${locale}/login`);
    }

    return (
        <div className="relative flex min-h-screen flex-col">
            <LoginBackground />
            <AppHeader />

            <main className="relative z-10 flex flex-1 items-center justify-center px-4 pt-16">
                <Card className="glass-card w-full max-w-md">
                    <CardHeader className="space-y-4 text-center">
                        <div className="mx-auto">
                            <Image
                                src="/logo.png"
                                alt="Tactic"
                                width={200}
                                height={70}
                                className="h-16 w-auto"
                                priority
                            />
                        </div>

                        <div className="space-y-1">
                            <CardTitle className="text-2xl font-bold">
                                {t('heading')}
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
                                {t('subtitle')}
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <ChangePasswordForm />
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
