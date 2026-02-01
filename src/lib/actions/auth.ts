'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isEmail } from '@/lib/validations/auth';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';

import type { PortalRole } from '@/lib/types/user';

// Session duration constants
const SESSION_DURATION_REMEMBER = 60 * 60 * 24 * 30; // 30 days in seconds
const SESSION_DURATION_DEFAULT = 60 * 60 * 24; // 1 day (browser session)

export type AuthResult = {
    error?: string;
    success?: boolean;
    requirePasswordChange?: boolean;
    portalRole?: PortalRole;
};

export async function signInWithIdentifier(
    identifier: string,
    password: string,
    rememberMe: boolean
): Promise<AuthResult> {
    const supabase = await createClient();

    let email = identifier;

    // If not an email, lookup email by username
    if (!isEmail(identifier)) {
        const { data: userData, error: lookupError } = await supabase
            .from('accounts')
            .select('email')
            .eq('username', identifier.toLowerCase())
            .single();

        if (lookupError || !userData?.email) {
            return { error: 'invalid_credentials' };
        }
        email = userData.email;
    }

    const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        // Map Supabase errors to translation keys
        if (error.message.includes('Invalid login credentials')) {
            return { error: 'invalid_credentials' };
        }
        if (error.message.includes('Email not confirmed')) {
            return { error: 'email_not_confirmed' };
        }
        if (error.message.includes('Too many requests')) {
            return { error: 'too_many_attempts' };
        }
        return { error: 'network_error' };
    }

    // Set remember me preference in cookie for middleware
    if (data.session) {
        const cookieStore = await cookies();
        const sessionDuration = rememberMe ? SESSION_DURATION_REMEMBER : SESSION_DURATION_DEFAULT;

        cookieStore.set('remember_me', rememberMe ? 'true' : 'false', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: sessionDuration,
            path: '/',
        });
    }

    // Check user account status and get portal role
    if (data.user) {
        const { data: account } = await supabase
            .from('accounts')
            .select('account_status, portal_role')
            .eq('auth_user_id', data.user.id)
            .single();

        // Check for pending status (first login - must change password)
        if (account?.account_status === 'pending' || account?.account_status === 'must_change_password') {
            return { success: true, requirePasswordChange: true, portalRole: account.portal_role };
        }

        // Return success with portal role for dashboard redirect
        return { success: true, portalRole: account?.portal_role ?? 'none' };
    }

    return { success: true, portalRole: 'none' };
}

export async function signOut(): Promise<void> {
    const supabase = await createClient();
    const cookieStore = await cookies();

    // Clear remember me cookie
    cookieStore.delete('remember_me');

    await supabase.auth.signOut();
    redirect('/login');
}

export async function getUser() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export async function getUserWithProfile() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { user: null, profile: null };
    }

    // Fetch user profile from accounts table
    const { data: profile, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('Error fetching user profile:', error);
        return { user, profile: null };
    }

    return { user, profile };
}

export async function requestPasswordReset(email: string): Promise<AuthResult> {
    const supabase = await createClient();

    // Use environment variable for consistent redirect URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.tactici.com';

    // Check if email exists using RPC function (bypasses RLS)
    const { data: emailExists, error: lookupError } = await supabase
        .rpc('check_email_exists', { email_to_check: email.toLowerCase() });

    if (lookupError || !emailExists) {
        // Email doesn't exist in our database
        return { error: 'email_not_found' };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/callback?next=/ar/reset-password`,
    });

    if (error) {
        if (error.message.includes('Email rate limit exceeded')) {
            return { error: 'too_many_attempts' };
        }
        return { error: 'network_error' };
    }

    return { success: true };
}

export async function resetPassword(password: string): Promise<AuthResult> {
    const supabase = await createClient();

    const { error } = await supabase.auth.updateUser({
        password,
    });

    if (error) {
        if (error.message.includes('Password should be at least')) {
            return { error: 'password_too_weak' };
        }
        if (error.message.includes('same password')) {
            return { error: 'same_password' };
        }
        return { error: 'network_error' };
    }

    return { success: true };
}

export async function changePassword(newPassword: string): Promise<AuthResult> {
    const supabase = await createClient();

    // Update password in Supabase Auth
    const { error: authError, data } = await supabase.auth.updateUser({
        password: newPassword,
    });

    if (authError) {
        if (authError.message.includes('Password should be at least')) {
            return { error: 'password_too_weak' };
        }
        if (authError.message.includes('same password')) {
            return { error: 'same_password' };
        }
        return { error: 'network_error' };
    }

    // Update user status from 'pending' to 'active'
    if (data.user) {
        await supabase
            .from('accounts')
            .update({ status: 'active' })
            .eq('id', data.user.id);
    }

    return { success: true };
}
