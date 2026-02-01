'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export type AuthResult = {
    error?: string;
    success?: boolean;
};

export async function signInWithEmail(
    email: string,
    password: string,
    rememberMe: boolean
): Promise<AuthResult> {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
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

    return { success: true };
}

export async function signOut(): Promise<void> {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
}

export async function getUser() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}
