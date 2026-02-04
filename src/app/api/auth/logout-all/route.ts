import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json(
            { error: 'Not authenticated' },
            { status: 401 }
        );
    }

    // Sign out from all sessions
    const { error: signOutError } = await supabase.auth.signOut({ scope: 'global' });

    if (signOutError) {
        console.error('Failed to sign out all sessions:', signOutError.message);
        return NextResponse.json(
            { error: 'Failed to sign out' },
            { status: 500 }
        );
    }

    return NextResponse.json({ success: true });
}
