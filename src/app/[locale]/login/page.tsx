import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { LoginForm } from '@/components/auth/login-form';
import { LoginBackground } from '@/components/auth/login-background';
import { AppHeader } from '@/components/layout/app-header';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Metadata' });

    return {
        title: t('title'),
        description: t('description'),
    };
}

export default function LoginPage() {
    const t = useTranslations('Auth');
    const tCommon = useTranslations('Common');

    return (
        <div className="relative flex min-h-screen flex-col">
            {/* Background */}
            <LoginBackground />

            {/* Header */}
            <AppHeader />

            {/* Main Content */}
            <main className="relative z-10 flex flex-1 items-center justify-center px-4 pt-16">
                <Card className="glass-card w-full max-w-md">
                    <CardHeader className="space-y-4 text-center">
                        {/* Logo */}
                        <div className="mx-auto">
                            <Image
                                src="/logo.png"
                                alt="Tactic"
                                width={280}
                                height={100}
                                className="h-24 w-auto"
                                priority
                            />
                        </div>

                        {/* Title */}
                        <div className="space-y-1">
                            <CardTitle className="text-2xl font-bold">
                                {t('welcome_back')}
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
                                {t('login_subtitle')}
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <LoginForm />
                    </CardContent>
                </Card>
            </main>

            {/* Footer */}
            <footer className="relative z-10 py-4 text-center text-sm text-muted-foreground">
                {tCommon('copyright')} © {tCommon('year')} {tCommon('company')}
            </footer>
        </div>
    );
}
