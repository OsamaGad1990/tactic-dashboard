'use server';

import { getComplaintTimeline } from '@/lib/services/complaints-service';
import type { TimelineEntry } from '@/lib/services/complaints-service';

export async function fetchComplaintTimeline(complaintId: string): Promise<{ data: TimelineEntry[] | null; error: string | null }> {
    try {
        const timeline = await getComplaintTimeline(complaintId);
        return { data: timeline, error: null };
    } catch (error) {
        console.error('Failed to fetch complaint timeline:', error);
        return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}
