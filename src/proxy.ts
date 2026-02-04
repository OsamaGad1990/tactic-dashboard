import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// Locales configuration
const locales = ['ar', 'en'];
const defaultLocale = 'ar';

// Public paths that don't require authentication
const publicPaths = ['/login', '/forgot-password', '/reset-password', '/change-password', '/auth'];

// Role-based route access matrix
type PortalRole = 'super_admin' | 'aggregator_admin' | 'client_admin' | 'reporter' | 'none';

const ROLE_ROUTES: Record<string, PortalRole[]> = {
    '/dashboard/admin': ['super_admin'],
    '/dashboard/operator': ['super_admin', 'aggregator_admin', 'reporter'],
    '/dashboard/company': ['super_admin', 'aggregator_admin', 'client_admin', 'reporter'],
    '/dashboard/reports': ['super_admin', 'reporter'],
};

// Default dashboard per role
const DEFAULT_DASHBOARD: Record<PortalRole, string> = {
    super_admin: '/dashboard/admin',
    aggregator_admin: '/dashboard/operator',
    client_admin: '/dashboard/company',
    reporter: '/dashboard/reports',
    none: '/login',
};

// Create the intl middleware
const intlMiddleware = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
    // Handle Supabase auth code at root level
    const code = request.nextUrl.searchParams.get('code');
    if (code && request.nextUrl.pathname === '/') {
        const callbackUrl = new URL('/auth/callback', request.url);
        callbackUrl.searchParams.set('code', code);
        callbackUrl.searchParams.set('next', '/ar/reset-password');
        return NextResponse.redirect(callbackUrl);
    }

    // Create a response with intl middleware first
    let intlResponse = intlMiddleware(request);

    // Create Supabase client with cookie handling
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    cookiesToSet.forEach(({ name, value, options }) =>
                        intlResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh session
    const { data: { user } } = await supabase.auth.getUser();

    // Get the pathname without locale prefix
    const pathname = request.nextUrl.pathname;
    const pathnameWithoutLocale = locales.reduce(
        (path, locale) => path.replace(new RegExp(`^/${locale}`), ''),
        pathname
    ) || '/';
    const locale = pathname.split('/')[1] || defaultLocale;

    // Check if current path is public
    const isPublicPath = publicPaths.some(path =>
        pathnameWithoutLocale === path || pathnameWithoutLocale.startsWith(`${path}/`)
    );

    // Redirect unauthenticated users to login
    if (!user && !isPublicPath && pathnameWithoutLocale !== '/') {
        const loginUrl = new URL(`/${locale}/login`, request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Fetch account data ONCE for authenticated users (reuse below)
    let account: { portal_role: string | null; account_status: string | null } | null = null;
    if (user) {
        const { data } = await supabase
            .from('accounts')
            .select('portal_role, account_status')
            .eq('auth_user_id', user.id)
            .single();
        account = data;
    }

    // Redirect authenticated users away from login (but allow change-password)
    if (user && isPublicPath && pathnameWithoutLocale !== '/change-password') {
        // Pending users must change password first
        if (account?.account_status === 'pending' || account?.account_status === 'must_change_password') {
            if (pathnameWithoutLocale !== '/change-password') {
                return NextResponse.redirect(new URL(`/${locale}/change-password`, request.url));
            }
            return intlResponse;
        }

        const role = (account?.portal_role as PortalRole) || 'none';
        const dashboardPath = DEFAULT_DASHBOARD[role];
        return NextResponse.redirect(new URL(`/${locale}${dashboardPath}`, request.url));
    }

    // Role-based dashboard access control
    if (user && pathnameWithoutLocale.startsWith('/dashboard')) {
        // Pending users must change password - redirect away from dashboard
        if (account?.account_status === 'pending' || account?.account_status === 'must_change_password') {
            return NextResponse.redirect(new URL(`/${locale}/change-password`, request.url));
        }

        const userRole = (account?.portal_role as PortalRole) || 'none';

        // Check if user is trying to access a specific dashboard
        for (const [routePath, allowedRoles] of Object.entries(ROLE_ROUTES)) {
            if (pathnameWithoutLocale.startsWith(routePath)) {
                if (!allowedRoles.includes(userRole)) {
                    // Redirect to their correct dashboard
                    const correctDashboard = DEFAULT_DASHBOARD[userRole];
                    return NextResponse.redirect(new URL(`/${locale}${correctDashboard}`, request.url));
                }
                break;
            }
        }

        // If accessing /dashboard directly, redirect to role-specific dashboard
        if (pathnameWithoutLocale === '/dashboard' || pathnameWithoutLocale === '/dashboard/') {
            const correctDashboard = DEFAULT_DASHBOARD[userRole];
            return NextResponse.redirect(new URL(`/${locale}${correctDashboard}`, request.url));
        }
    }

    return intlResponse;
}

export const config = {
    matcher: [
        '/((?!api|_next|.*\\..*).*)',
    ],
};
