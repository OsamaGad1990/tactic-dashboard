import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// Locales configuration
const locales = ['ar', 'en'];
const defaultLocale = 'ar';

// Public paths that don't require authentication
const publicPaths = ['/login', '/forgot-password', '/reset-password'];

// Create the intl middleware
const intlMiddleware = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
    // Handle Supabase auth code at root level
    const code = request.nextUrl.searchParams.get('code');
    if (code && request.nextUrl.pathname === '/') {
        // Redirect to auth callback with the code
        const callbackUrl = new URL('/auth/callback', request.url);
        callbackUrl.searchParams.set('code', code);
        callbackUrl.searchParams.set('next', '/ar/reset-password');
        return NextResponse.redirect(callbackUrl);
    }

    // Create a response with intl middleware first
    let intlResponse = intlMiddleware(request);

    // Clone request headers for Supabase
    const supabaseResponse = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

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

                    // Also set cookies on intl response
                    cookiesToSet.forEach(({ name, value, options }) =>
                        intlResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // IMPORTANT: Refresh session before any checks
    // This keeps the session alive and syncs server/client state
    const { data: { user }, error } = await supabase.auth.getUser();

    // Get the pathname without locale prefix
    const pathname = request.nextUrl.pathname;
    const pathnameWithoutLocale = locales.reduce(
        (path, locale) => path.replace(new RegExp(`^/${locale}`), ''),
        pathname
    ) || '/';

    // Check if current path is public
    const isPublicPath = publicPaths.some(path =>
        pathnameWithoutLocale === path || pathnameWithoutLocale.startsWith(`${path}/`)
    );

    // Redirect unauthenticated users to login
    if (!user && !isPublicPath && pathnameWithoutLocale !== '/') {
        const locale = pathname.split('/')[1] || defaultLocale;
        const loginUrl = new URL(`/${locale}/login`, request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Redirect authenticated users away from login
    if (user && isPublicPath) {
        const locale = pathname.split('/')[1] || defaultLocale;
        const dashboardUrl = new URL(`/${locale}/dashboard`, request.url);
        return NextResponse.redirect(dashboardUrl);
    }

    return intlResponse;
}

export const config = {
    matcher: [
        // Match all pathnames except for
        // - api routes
        // - _next (Next.js internals)
        // - static files (assets, images, etc.)
        '/((?!api|_next|.*\\..*).*)',
    ],
};
