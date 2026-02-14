import { NextRequest, NextResponse } from 'next/server';
import { getNotificationDetails } from '@/lib/services/notifications-service';
import { getPortalUser } from '@/lib/supabase/portal-user';
import { getUserClientId } from '@/lib/services/client';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getPortalUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const clientId = await getUserClientId(user.id);
        if (!clientId) {
            return NextResponse.json({ error: 'No client association' }, { status: 403 });
        }

        const { id } = await params;

        const data = await getNotificationDetails(id, clientId);

        if (!data) {
            return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('[API /notifications/:id] Error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
