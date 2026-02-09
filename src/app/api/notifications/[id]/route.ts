import { NextRequest, NextResponse } from 'next/server';
import { getNotificationDetails } from '@/lib/services/notifications-service';
import { getPortalUser } from '@/lib/supabase/portal-user';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getPortalUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        console.log('[API /notifications/:id] Fetching details for:', id);

        const data = await getNotificationDetails(id);
        console.log('[API /notifications/:id] Result:', data ? 'found' : 'null');

        if (!data) {
            return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('[API /notifications/:id] Error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
