// ── Types (shared between server service and client components) ──

export interface YesterdayVisit {
    visitId: string;
    clientId: string;
    divisionId: string | null;
    userId: string;
    marketId: string;
    visitDate: string;
    status: string;
    actualStart: string | null;
    actualEnd: string | null;
    plannedStart: string | null;
    plannedEnd: string | null;
    source: string;
    isOutOfRange: boolean | null;
    trustScore: number | null;
    durationMinutes: number | null;
    userName: string | null;
    userArabicName: string | null;
    userRole: string | null;
    branchName: string | null;
    branchNameAr: string | null;
    outcomeStatus: string | null;
    endReasonCustom: string | null;
    endedAt: string | null;
}

export interface YesterdayVisitsStats {
    total: number;
    completed: number;
    cancelled: number;
    inProgress: number;
    pending: number;
    avgDuration: number | null;
    outOfRange: number;
}

// ── Pure computation (safe for client components) ──

export function computeYesterdayStats(visits: YesterdayVisit[]): YesterdayVisitsStats {
    const total = visits.length;
    const completed = visits.filter((v) => v.outcomeStatus === 'completed' || v.status === 'finished').length;
    const cancelled = visits.filter((v) => v.outcomeStatus === 'cancelled' || v.status === 'cancelled').length;
    const inProgress = visits.filter((v) => v.status === 'in_progress' || v.status === 'started').length;
    const pending = visits.filter((v) => v.status === 'pending').length;
    const outOfRange = visits.filter((v) => v.isOutOfRange === true).length;

    const durations = visits
        .map((v) => v.durationMinutes)
        .filter((d): d is number => d != null && d > 0);
    const avgDuration = durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length * 10) / 10
        : null;

    return { total, completed, cancelled, inProgress, pending, avgDuration, outOfRange };
}
