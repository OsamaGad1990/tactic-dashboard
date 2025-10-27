// src/hooks/useMarketFilters.ts
import { useEffect, useMemo, useState } from "react";

type UUID = string;

export type UserRow = {
  id: UUID;
  name: string | null;
  arabic_name: string | null;
  role: string | null;
  team_leader_id: UUID | null;
};

export type ReportRow = {
  id: UUID;
  created_at: string;
  user?: { id: UUID };
  market?: { id: string; store: string | null; branch: string | null; region: string | null; city: string | null };
};

export type UserFiltersPayload = {
  default_region?: string[] | null;
  default_city?: string[] | null;
  allowed_markets?: string[] | null;
  Team_leader?: string[] | null;
};

const norm = (s?: string | null) => (s ?? "").trim().toLowerCase();

export function useMarketFilters(opts: {
  reports: ReportRow[];
  allClientUsers: UserRow[];
  userFilters: UserFiltersPayload | null | undefined;
}) {
  const { reports, allClientUsers, userFilters } = opts;

  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [selectedTL, setSelectedTL] = useState<UUID | "ALL">("ALL");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<UUID[]>([]);
  const [selectedMarketStore, setSelectedMarketStore] = useState<string | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<UUID | null>(null);

  // تطبيق الفلاتر المقفولة من Supabase
  useEffect(() => {
    if (!userFilters) return;
    if (userFilters.default_region?.[0]) setSelectedRegion(userFilters.default_region[0]);
    if (userFilters.default_city?.[0]) setSelectedCity(userFilters.default_city[0]);
    if (userFilters.allowed_markets?.[0]) setSelectedStore(userFilters.allowed_markets[0]);
    if (userFilters.Team_leader?.[0]) setSelectedTL(userFilters.Team_leader[0]);
  }, [userFilters]);

  const handleDateFromChange = (date: Date | null) => {
    setDateFrom(date);
    if (dateTo && date && date > dateTo) setDateTo(null);
  };

  const teamLeaders = useMemo(() => {
    const baseTLs = allClientUsers.filter((u) =>
      (u.role ?? "").toLowerCase().replace(/_/g, " ").includes("team leader")
    );
    if (userFilters?.Team_leader?.length) {
      const allowedTLs = new Set(userFilters.Team_leader);
      return baseTLs.filter((tl) => allowedTLs.has(tl.id));
    }
    return baseTLs;
  }, [allClientUsers, userFilters]);

  const usersForPanel = useMemo(() => {
    const mchUsers = allClientUsers.filter((u) => (u.role ?? "").toLowerCase() === "mch");
    if (selectedTL === "ALL") return mchUsers;
    return mchUsers.filter((u) => u.team_leader_id === selectedTL);
  }, [allClientUsers, selectedTL]);

  const effectiveStore = useMemo(
    () => (selectedStore || selectedMarketStore || "").trim(),
    [selectedStore, selectedMarketStore]
  );

  // خطوة وسيطة: فلترة بالتاريخ + الفريق + (اختيارات users إن وُجدت)
  const reportsByDateAndTeam = useMemo(() => {
    return reports.filter((r) => {
      const d = new Date(r.created_at);
      const fromOk = !dateFrom || d >= dateFrom;
      let toOk = true;
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        toOk = d <= end;
      }
      const mchId = r.user?.id || "";
      const tlOk =
        selectedTL === "ALL"
          ? selectedUsers.length
            ? selectedUsers.includes(mchId)
            : true
          : usersForPanel.some((u) => u.id === mchId);

      return fromOk && toOk && tlOk;
    });
  }, [reports, dateFrom, dateTo, selectedTL, selectedUsers, usersForPanel]);

  // توليد الخيارات المترابطة
  const regionOptions = useMemo(() => {
    const s = new Set<string>();
    for (const r of reportsByDateAndTeam) {
      const cityOk = !selectedCity || norm(r.market?.city) === norm(selectedCity);
      const storeOk = !effectiveStore || norm(r.market?.store) === norm(effectiveStore);
      if (!cityOk || !storeOk) continue;
      const val = (r.market?.region ?? "").trim();
      if (val) s.add(val);
    }
    let arr = Array.from(s);
    if (userFilters?.default_region?.length) {
      const allowed = new Set(userFilters.default_region.map((x) => (x ?? "").trim()));
      arr = arr.filter((x) => allowed.has(x));
    }
    return arr.sort((a, b) => a.localeCompare(b, "ar"));
  }, [reportsByDateAndTeam, userFilters, selectedCity, effectiveStore]);

  const citiesOptions = useMemo(() => {
    const s = new Set<string>();
    for (const r of reportsByDateAndTeam) {
      const regionOk = !selectedRegion || norm(r.market?.region) === norm(selectedRegion);
      const storeOk = !effectiveStore || norm(r.market?.store) === norm(effectiveStore);
      if (!regionOk || !storeOk) continue;
      const val = (r.market?.city ?? "").trim();
      if (val) s.add(val);
    }
    let arr = Array.from(s);
    if (userFilters?.default_city?.length) {
      const allowed = new Set(userFilters.default_city.map((x) => (x ?? "").trim()));
      arr = arr.filter((x) => allowed.has(x));
    }
    return arr.sort((a, b) => a.localeCompare(b, "ar"));
  }, [reportsByDateAndTeam, selectedRegion, userFilters, effectiveStore]);

  const storeOptions = useMemo(() => {
    if (effectiveStore) return [effectiveStore];
    const s = new Set<string>();
    for (const r of reportsByDateAndTeam) {
      const regionOk = !selectedRegion || norm(r.market?.region) === norm(selectedRegion);
      const cityOk = !selectedCity || norm(r.market?.city) === norm(selectedCity);
      if (!regionOk || !cityOk) continue;
      const val = (r.market?.store ?? "").trim();
      if (val) s.add(val);
    }
    let arr = Array.from(s);
    if (userFilters?.allowed_markets?.length) {
      const allowed = new Set(userFilters.allowed_markets.map((x) => (x ?? "").trim()));
      arr = arr.filter((x) => allowed.has(x));
    }
    return arr.sort((a, b) => a.localeCompare(b, "ar"));
  }, [reportsByDateAndTeam, selectedRegion, selectedCity, userFilters, effectiveStore]);

  // أمان: إفراغ الاختيارات لو خرجت برّه options (لما ما تكونش مقفولة من Supabase)
  useEffect(() => {
    if (!userFilters?.default_region?.length && selectedRegion && !regionOptions.includes(selectedRegion)) {
      setSelectedRegion("");
      setSelectedCity("");
      setSelectedStore("");
    }
  }, [regionOptions, selectedRegion, userFilters]);

  useEffect(() => {
    if (!userFilters?.default_city?.length && selectedCity && !citiesOptions.includes(selectedCity)) {
      setSelectedCity("");
      setSelectedStore("");
    }
  }, [citiesOptions, selectedCity, userFilters]);

  useEffect(() => {
    if (!userFilters?.allowed_markets?.length && selectedStore && !storeOptions.includes(selectedStore)) {
      setSelectedStore("");
    }
  }, [storeOptions, selectedStore, userFilters]);

  // النتيجة النهائية للجدول
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const d = new Date(r.created_at);
      const fromOk = !dateFrom || d >= dateFrom;
      let toOk = true;
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        toOk = d <= end;
      }
      const regionOk = !selectedRegion || norm(r.market?.region) === norm(selectedRegion);
      const cityOk = !selectedCity || norm(r.market?.city) === norm(selectedCity);
      const storeOk = !selectedStore || norm(r.market?.store) === norm(selectedStore);

      const userOk = selectedUsers.length === 0 ? true : selectedUsers.includes(r.user?.id || "");

      const mchId = r.user?.id || "";
      const tlOk = selectedTL === "ALL" ? true : usersForPanel.some((u) => u.id === mchId);

      return fromOk && toOk && regionOk && cityOk && storeOk && userOk && tlOk;
    });
  }, [reports, dateFrom, dateTo, selectedRegion, selectedCity, selectedStore, selectedUsers, selectedTL, usersForPanel]);

  // Panels
  const marketsForPanel = useMemo(() => {
    if (selectedUsers.length === 0) return [];
    if (selectedStore) return [selectedStore];
    const s = new Set<string>();
    for (const r of filteredReports) if (r.market?.store) s.add(r.market.store);
    return Array.from(s).sort();
  }, [filteredReports, selectedUsers.length, selectedStore]);

  const branchesForPanel = useMemo(() => {
    const activeStore = effectiveStore;
    if (!activeStore) return [];
    const branches = new Map<UUID, string>();
    for (const r of filteredReports) {
      if (norm(r.market?.store) === norm(activeStore) && r.market?.id && r.market.branch) {
        branches.set(r.market.id as UUID, r.market.branch);
      }
    }
    return Array.from(branches.entries()).map(([id, branch]) => ({ id, branch: branch || "" }));
  }, [filteredReports, effectiveStore]);

  const datesForPanel = useMemo(() => {
    if (!selectedBranchId) return [];
    const dates = new Set<string>();
    for (const r of filteredReports) {
      if (r.market?.id === selectedBranchId) dates.add(new Date(r.created_at).toISOString().split("T")[0]);
    }
    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  }, [filteredReports, selectedBranchId]);

  const resetFilters = () => {
    setDateFrom(null);
    setDateTo(null);
    if (!userFilters?.Team_leader?.[0]) setSelectedTL("ALL");
    if (!userFilters?.default_region?.[0]) setSelectedRegion("");
    if (!userFilters?.default_city?.[0]) setSelectedCity("");
    if (!userFilters?.allowed_markets?.[0]) setSelectedStore("");
    setSelectedUsers([]);
    setSelectedMarketStore(null);
    setSelectedBranchId(null);
  };

  return {
    // state
    dateFrom, setDateFrom, dateTo, setDateTo, handleDateFromChange,
    selectedTL, setSelectedTL,
    selectedRegion, setSelectedRegion,
    selectedCity, setSelectedCity,
    selectedStore, setSelectedStore,
    selectedUsers, setSelectedUsers,
    selectedMarketStore, setSelectedMarketStore,
    selectedBranchId, setSelectedBranchId,

    // derived
    teamLeaders, usersForPanel,
    regionOptions, citiesOptions, storeOptions,
    marketsForPanel, branchesForPanel, datesForPanel,
    filteredReports, effectiveStore,

    // helpers
    resetFilters,
  };
}
