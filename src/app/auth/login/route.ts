import { NextResponse } from 'next/server';

/**
 * Fallback route for /auth/login
 * Supabase sometimes redirects here instead of /auth/callback
 * This route redirects to the proper callback with all query params
 */
export async function GET(request: Request) {
    const { searchParams, origin, hash } = new URL(request.url);

    // Build callback URL with all params
    const callbackUrl = new URL('/auth/callback', origin);

    // Copy all search params
    searchParams.forEach((value, key) => {
        callbackUrl.searchParams.set(key, value);
    });

    // If there's no code and no error, redirect to login
    if (!searchParams.get('code') && !searchParams.get('error') && !searchParams.get('error_code')) {
        return NextResponse.redirect(`${origin}/ar/login`);
    }

    return NextResponse.redirect(callbackUrl.toString());
}
