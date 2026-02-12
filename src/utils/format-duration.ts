// ============================================================================
// UTILITY: formatDuration — Human-readable time from raw minutes
// ============================================================================

/**
 * Convert raw minutes to a human-readable duration string.
 *
 * Examples:
 *   formatDuration(0)    → "0m"
 *   formatDuration(45)   → "45m"
 *   formatDuration(90)   → "1h 30m"
 *   formatDuration(1196) → "19h 56m"
 *   formatDuration(120)  → "2h"
 */
export function formatDuration(minutes: number): string {
    if (minutes < 0) return '0m';
    const rounded = Math.round(minutes);
    if (rounded < 60) return `${rounded}m`;
    const h = Math.floor(rounded / 60);
    const m = rounded % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
