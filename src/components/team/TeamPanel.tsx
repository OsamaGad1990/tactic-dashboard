'use client';

import { useFilters } from '@/lib/context/FilterContext';
import { useScope, type ScopeFieldUser, type ScopeTeamLeader } from '@/lib/context/ScopeContext';
import { useLocale } from 'next-intl';
import { useMemo, useState } from 'react';
import {
    Users,
    Search,
    UserCircle,
    ChevronRight,
    ChevronLeft,
    Loader2,
    AlertCircle,
    Shield,
    Star,
    Briefcase,
} from 'lucide-react';
import Link from 'next/link';

// ── Role Config ──
const ROLE_CONFIG: Record<string, {
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ReactNode;
    labelEn: string;
    labelAr: string;
}> = {
    promoter: {
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-950/40',
        borderColor: 'border-blue-200 dark:border-blue-800/50',
        icon: <UserCircle className="h-4 w-4" />,
        labelEn: 'Promoter',
        labelAr: 'مروّج',
    },
    mch: {
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
        borderColor: 'border-emerald-200 dark:border-emerald-800/50',
        icon: <Briefcase className="h-4 w-4" />,
        labelEn: 'Merchandiser',
        labelAr: 'ميرتشندايزر',
    },
    team_leader: {
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-50 dark:bg-amber-950/40',
        borderColor: 'border-amber-200 dark:border-amber-800/50',
        icon: <Star className="h-4 w-4" />,
        labelEn: 'Team Leader',
        labelAr: 'قائد فريق',
    },
    manager: {
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-50 dark:bg-purple-950/40',
        borderColor: 'border-purple-200 dark:border-purple-800/50',
        icon: <Shield className="h-4 w-4" />,
        labelEn: 'Manager',
        labelAr: 'مدير',
    },
    promoplus: {
        color: 'text-rose-600 dark:text-rose-400',
        bgColor: 'bg-rose-50 dark:bg-rose-950/40',
        borderColor: 'border-rose-200 dark:border-rose-800/50',
        icon: <Star className="h-4 w-4" />,
        labelEn: 'Sales Promoter',
        labelAr: 'مروج بيعي',
    },
};

const DEFAULT_ROLE_CONFIG = {
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-950/40',
    borderColor: 'border-gray-200 dark:border-gray-800/50',
    icon: <UserCircle className="h-4 w-4" />,
    labelEn: 'Field User',
    labelAr: 'مستخدم ميداني',
};

function getRoleConfig(role: string) {
    return ROLE_CONFIG[role] ?? DEFAULT_ROLE_CONFIG;
}

// ── Team Leader Card ──
function TeamLeaderBadge({
    leader,
    isArabic,
}: {
    leader: ScopeTeamLeader | undefined;
    isArabic: boolean;
}) {
    if (!leader) return null;
    const config = getRoleConfig('team_leader');

    return (
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${config.color} opacity-70`}>
            {config.icon}
            <span className="truncate max-w-[120px]">
                {leader.name || (isArabic ? 'غير معروف' : 'Unknown')}
            </span>
        </span>
    );
}

// ── User Card ──
function UserCard({
    user,
    teamLeader,
    locale,
    isArabic,
}: {
    user: ScopeFieldUser;
    teamLeader: ScopeTeamLeader | undefined;
    locale: string;
    isArabic: boolean;
}) {
    const config = getRoleConfig(user.role);
    const roleLabel = isArabic ? config.labelAr : config.labelEn;

    return (
        <Link
            href={`/${locale}/dashboard/company/team/${user.user_id}`}
            className={`group relative flex flex-col gap-3 rounded-xl border ${config.borderColor} ${config.bgColor} p-4 
                transition-all duration-200 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5
                hover:border-primary/30 cursor-pointer`}
        >
            {/* Role Badge */}
            <div className={`inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-xs font-semibold ${config.color} bg-white/60 dark:bg-black/20 border ${config.borderColor}`}>
                {config.icon}
                {roleLabel}
            </div>

            {/* User Name */}
            <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${config.bgColor} border ${config.borderColor}`}>
                    <UserCircle className={`h-6 w-6 ${config.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {user.name || (isArabic ? 'بدون اسم' : 'No Name')}
                    </h3>
                    <TeamLeaderBadge leader={teamLeader} isArabic={isArabic} />
                </div>
                {isArabic ? (
                    <ChevronLeft className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                )}
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                    🏪 {user.allowed_branches?.length ?? 0} {isArabic ? 'فرع' : 'branches'}
                </span>
                <span className="flex items-center gap-1">
                    🔗 {user.allowed_chains?.length ?? 0} {isArabic ? 'سلسلة' : 'chains'}
                </span>
            </div>
        </Link>
    );
}

// ── Role Group ──
function RoleGroup({
    role,
    users,
    teamLeadersMap,
    locale,
    isArabic,
}: {
    role: string;
    users: ScopeFieldUser[];
    teamLeadersMap: Map<string, ScopeTeamLeader>;
    locale: string;
    isArabic: boolean;
}) {
    const config = getRoleConfig(role);
    const roleLabel = isArabic ? config.labelAr : config.labelEn;

    return (
        <div className="space-y-3">
            {/* Role Header */}
            <div className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${config.bgColor}`}>
                    <span className={config.color}>{config.icon}</span>
                </div>
                <h2 className="text-sm font-semibold text-foreground">{roleLabel}</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {users.length}
                </span>
            </div>

            {/* User Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {users.map((user) => (
                    <UserCard
                        key={user.user_id}
                        user={user}
                        teamLeader={teamLeadersMap.get(user.team_leader_account_id)}
                        locale={locale}
                        isArabic={isArabic}
                    />
                ))}
            </div>
        </div>
    );
}

// ── Main Panel ──
export function TeamPanel() {
    const locale = useLocale();
    const isArabic = locale === 'ar';
    const { scope, isLoading, isError, filteredFieldUsers, filteredTeamLeaders } = useScope();
    const [search, setSearch] = useState('');

    // Build team leader map
    const teamLeadersMap = useMemo(() => {
        const map = new Map<string, ScopeTeamLeader>();
        const leaders = filteredTeamLeaders ?? scope?.team_leaders ?? [];
        for (const tl of leaders) {
            map.set(tl.team_leader_id, tl);
        }
        return map;
    }, [filteredTeamLeaders, scope?.team_leaders]);

    // ── Cascade filters from FilterContext ──
    const { filters } = useFilters();
    const selectedTeamLeaderId = filters.teamLeaderId;
    const selectedFieldUserId = filters.fieldStaffId;

    // Filter users by cascade filters first, then search
    const searchedUsers = useMemo(() => {
        let users = filteredFieldUsers ?? [];

        // Field user filter
        if (selectedFieldUserId) {
            users = users.filter(u => u.user_id === selectedFieldUserId);
        }

        // Team leader filter → show only that team's field users
        if (selectedTeamLeaderId && !selectedFieldUserId) {
            users = users.filter(u => u.team_leader_account_id === selectedTeamLeaderId);
        }

        // Search filter
        if (search.trim()) {
            const q = search.toLowerCase();
            users = users.filter((u) =>
                u.name?.toLowerCase().includes(q) ||
                u.role?.toLowerCase().includes(q)
            );
        }

        return users;
    }, [filteredFieldUsers, selectedFieldUserId, selectedTeamLeaderId, search]);

    // Group by role
    const roleGroups = useMemo(() => {
        const groups = new Map<string, ScopeFieldUser[]>();
        const roleOrder = ['manager', 'team_leader', 'mch', 'promoter', 'promoplus'];

        for (const user of searchedUsers) {
            const role = user.role || 'unknown';
            if (!groups.has(role)) groups.set(role, []);
            groups.get(role)!.push(user);
        }

        // Sort by predefined role order
        const sorted: Array<{ role: string; users: ScopeFieldUser[] }> = [];
        for (const role of roleOrder) {
            if (groups.has(role)) {
                sorted.push({ role, users: groups.get(role)! });
                groups.delete(role);
            }
        }
        // Any remaining roles
        for (const [role, users] of groups) {
            sorted.push({ role, users });
        }

        return sorted;
    }, [searchedUsers]);

    // Stats
    const totalUsers = searchedUsers.length;
    const roleCount = roleGroups.length;

    // Loading State
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                    {isArabic ? 'جاري تحميل بيانات الفريق...' : 'Loading team data...'}
                </p>
            </div>
        );
    }

    // Error State
    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="text-sm text-muted-foreground">
                    {isArabic ? 'حدث خطأ أثناء تحميل بيانات الفريق' : 'Failed to load team data'}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Stats Bar */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">{totalUsers}</span>
                    <span className="text-xs text-primary/70">
                        {isArabic ? 'مستخدم' : 'users'}
                    </span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
                    <span className="text-sm font-semibold text-foreground">{roleCount}</span>
                    <span className="text-xs text-muted-foreground">
                        {isArabic ? 'أدوار' : 'roles'}
                    </span>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={isArabic ? 'ابحث عن مستخدم...' : 'Search users...'}
                    className="w-full rounded-xl border border-border bg-card/50 py-2.5 ps-10 pe-4 text-sm
                        placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20
                        focus:border-primary/40 transition-all"
                />
            </div>

            {/* Role Groups */}
            {roleGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Users className="h-12 w-12 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                        {search
                            ? (isArabic ? 'لا توجد نتائج للبحث' : 'No users match your search')
                            : (isArabic ? 'لا يوجد أعضاء فريق' : 'No team members found')
                        }
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {roleGroups.map(({ role, users }) => (
                        <RoleGroup
                            key={role}
                            role={role}
                            users={users}
                            teamLeadersMap={teamLeadersMap}
                            locale={locale}
                            isArabic={isArabic}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
