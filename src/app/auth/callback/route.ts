import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/ar/dashboard';
    const errorCode = searchParams.get('error_code');
    const errorDescription = searchParams.get('error_description');

    // Handle Supabase error redirects (e.g., expired OTP)
    if (errorCode) {
        const errorMessage = errorCode === 'otp_expired'
            ? 'link_expired'
            : 'auth_error';
        return NextResponse.redirect(`${origin}/ar/login?error=${errorMessage}`);
    }

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Check if this is a password reset flow
            const forwardedHost = request.headers.get('x-forwarded-host');
            const isLocalEnv = process.env.NODE_ENV === 'development';

            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${next}`);
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`);
            } else {
                return NextResponse.redirect(`${origin}${next}`);
            }
        } else {
            // Auth exchange failed
            return NextResponse.redirect(`${origin}/ar/login?error=auth_error`);
        }
    }

    // No code provided
    return NextResponse.redirect(`${origin}/ar/login?error=invalid_link`);
}
