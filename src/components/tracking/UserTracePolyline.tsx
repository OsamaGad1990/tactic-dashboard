'use client';

import {
    TRACE_COLORS,
    TRACE_OPACITY,
    TRACE_STROKE_WIDTH,
} from '@/lib/constants/tracking-constants';
import type { TraceSegment, TraceSegmentType } from '@/lib/types/tracking-types';
import { useMap } from '@vis.gl/react-google-maps';
import { memo, useEffect, useRef } from 'react';

// ============================================================================
// HELPER: Get stroke options based on segment type
// ============================================================================
function getStrokeOptions(type: TraceSegmentType): {
    color: string;
    opacity: number;
    dashPattern: number[];
} {
    switch (type) {
        case 'valid':
            return {
                color: TRACE_COLORS.VALID,
                opacity: TRACE_OPACITY.VALID,
                dashPattern: [], // solid
            };
        case 'fraud':
            return {
                color: TRACE_COLORS.FRAUD,
                opacity: TRACE_OPACITY.FRAUD,
                dashPattern: [10, 8], // dashed
            };
        case 'teleport':
            return {
                color: TRACE_COLORS.TELEPORT,
                opacity: TRACE_OPACITY.TELEPORT,
                dashPattern: [], // solid (distinct warning)
            };
    }
}

// ============================================================================
// COMPONENT: Renders a single polyline segment on the map
// ============================================================================
function TracePolylineSegment({
    segment,
}: {
    segment: TraceSegment;
}) {
    const map = useMap();
    const polylineRef = useRef<google.maps.Polyline | null>(null);

    useEffect(() => {
        if (!map) return;

        const { color, opacity, dashPattern } = getStrokeOptions(segment.type);

        // Build icon array for dashed lines
        const icons: google.maps.IconSequence[] =
            dashPattern.length > 0
                ? [
                    {
                        icon: {
                            path: 'M 0,-1 0,1',
                            strokeOpacity: opacity,
                            scale: TRACE_STROKE_WIDTH,
                        },
                        offset: '0',
                        repeat: `${dashPattern[0] + dashPattern[1]}px`,
                    },
                ]
                : [];

        const polyline = new google.maps.Polyline({
            path: segment.path,
            strokeColor: color,
            strokeOpacity: dashPattern.length > 0 ? 0 : opacity,
            strokeWeight: TRACE_STROKE_WIDTH,
            icons,
            zIndex: 1, // Below markers
            map,
        });

        polylineRef.current = polyline;

        return () => {
            polyline.setMap(null);
            polylineRef.current = null;
        };
    }, [map, segment]);

    return null; // Rendered via Google Maps API, not React DOM
}

// ============================================================================
// MAIN COMPONENT: Renders all trace segments for a selected user
// ============================================================================
interface UserTracePolylineProps {
    segments: TraceSegment[];
}

export const UserTracePolyline = memo(
    function UserTracePolyline({ segments }: UserTracePolylineProps) {
        if (segments.length === 0) return null;

        return (
            <>
                {segments.map((segment, index) => (
                    <TracePolylineSegment
                        key={`${segment.type}-${index}`}
                        segment={segment}
                    />
                ))}
            </>
        );
    },
    (prevProps, nextProps) => {
        // Only re-render if segments array changed
        return prevProps.segments === nextProps.segments;
    }
);
