'use client';

import { useTranslations } from 'next-intl';
import { User } from '@supabase/supabase-js';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/actions/auth';
import { LogOut, Shield, Users, BarChart3 } from 'lucide-react';

interface UserProfile {
    id: string;
    email: string;
    username?: string | null;
    full_name?: string | null;
    role?: string | null;
    created_at?: string | null;
}

interface DashboardContentProps {
    user: User;
    profile: UserProfile | null;
}

export function DashboardContent({ user, profile }: DashboardContentProps) {
    const t = useTranslations('Dashboard');
    const tHeader = useTranslations('Header');

    const handleSignOut = async () => {
        await signOut();
    };

    const displayName = profile?.full_name || profile?.username || user.email?.split('@')[0] || t('unknown_user');
    const userRole = profile?.role || 'user';

    return (
        <div className="relative flex min-h-screen flex-col bg-background">
            <AppHeader />

            <main className="container mx-auto flex-1 px-4 py-8">
                {/* Welcome Section */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold title-glow">
                            {t('welcome')}, {displayName}
                        </h1>
                        <p className="text-muted-foreground">
                            {t('role')}: <span className="font-medium capitalize">{userRole}</span>
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={handleSignOut}
                        className="gap-2"
                    >
                        <LogOut className="h-4 w-4" />
                        {tHeader('logout')}
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="glass-card">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                {t('total_users')}
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">--</div>
                            <p className="text-xs text-muted-foreground">
                                {t('coming_soon')}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                {t('active_sessions')}
                            </CardTitle>
                            <Shield className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">1</div>
                            <p className="text-xs text-muted-foreground">
                                {t('your_session')}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                {t('analytics')}
                            </CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">--</div>
                            <p className="text-xs text-muted-foreground">
                                {t('coming_soon')}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* User Info Card */}
                <Card className="glass-card mt-8">
                    <CardHeader>
                        <CardTitle>{t('account_info')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('email')}:</span>
                            <span className="font-medium">{user.email}</span>
                        </div>
                        {profile?.username && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('username')}:</span>
                                <span className="font-medium">{profile.username}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('user_id')}:</span>
                            <span className="font-mono text-sm">{user.id.slice(0, 8)}...</span>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
