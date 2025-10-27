"use client";

import { useEffect, useMemo, useState, useCallback } from "react";

export type MarketRow = {
  id: string;
  region?: string | null;
  city?: string | null;
  store?: string | null; // ← ده هو اسم السوق الحقيقي
};

export type TLUser = { id: string; username: string; arabic_name?: string | null };

type UserFiltersShape = {
  default_region?: string[] | null;
  default_city?: string[] | null;
  allowed_markets?: string[] | null; // أسماء المتاجر (store)
  Team_leader?: string[] | null;
};

type Params = {
  markets: MarketRow[];
  teamLeaders: TLUser[];
  userFilters: UserFiltersShape | null;
  loading: boolean;
};

type FiltersState = {
  region: string;
  city: string;
  market: string; // اسم الـ store
  branch: string | null;
  teamLeader: string | null;
};

export function useHierarchicalFilters(params: Params) {
  const { markets, teamLeaders, userFilters, loading } = params;

  /** ========== Helpers ========== */
  const norm = (s?: string | null) => (s ?? "").trim();
  const toSet = (arr?: (string | null | undefined)[] | null) =>
    new Set((arr ?? []).map((x) => norm(x)).filter(Boolean));

  const defaultRegion = norm(userFilters?.default_region?.[0]);
  const defaultCity = norm(userFilters?.default_city?.[0]);
  const allowedMarketsSet = toSet(userFilters?.allowed_markets);
  const defaultTL = norm(userFilters?.Team_leader?.[0]);

  /** ========== Filters state ========== */
  const [filters, setFilters] = useState<FiltersState>({
    region: defaultRegion,
    city: defaultCity,
    market: "", // هيتم ضبطه حسب allowed_markets أو اختيار المستخدم
    branch: null,
    teamLeader: defaultTL || null,
  });

  /** ========== Build options (distinct) ========== */
  const regionOptionsAll = useMemo(() => {
    const s = new Set<string>();
    for (const m of markets) {
      const r = norm(m.region);
      if (r) s.add(r);
    }
    return Array.from(s).sort();
  }, [markets]);

  const cityOptionsAll = useMemo(() => {
    const s = new Set<string>();
    for (const m of markets) {
      // لو في region محدد: قيد به
      if (filters.region && norm(m.region) !== filters.region) continue;
      const c = norm(m.city);
      if (c) s.add(c);
    }
    return Array.from(s).sort();
  }, [markets, filters.region]);

  const marketOptionsAll = useMemo(() => {
    const s = new Set<string>();
    for (const m of markets) {
      // لو region/city متحددين: قيد بهم
      if (filters.region && norm(m.region) !== filters.region) continue;
      if (filters.city && norm(m.city) !== filters.city) continue;
      const store = norm(m.store);
      // تجاهل أي store فاضي
      if (!store) continue;
      s.add(store);
    }
    // فلترة إضافية حسب allowed_markets (لو متوفرة)
    const raw = Array.from(s);
    const filtered = allowedMarketsSet.size
      ? raw.filter((st) => allowedMarketsSet.has(st))
      : raw;
    return filtered.sort();
  }, [markets, filters.region, filters.city, allowedMarketsSet]);

  /** ========== Locking logic ========== */
  const isRegionLocked = !!defaultRegion;
  const isCityLocked = !!defaultCity;
  // لو عنده allowed_markets محددة نعتبر السوق مقفول (ممكن تبقى قيمة واحدة أو أكتر)
  const isMarketLocked = allowedMarketsSet.size > 0;
  // TL مقفول لو عنده default TL واحد
  const isTeamLeaderLocked = !!defaultTL;

  /** ========== Ensure current selections still valid ========== */
  // نزبط الـ city لما region يتغير
  useEffect(() => {
    if (!filters.region) return;
    if (filters.city && !cityOptionsAll.includes(filters.city)) {
      setFilters((f) => ({ ...f, city: "", market: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.region, cityOptionsAll.join("|")]);

  // نزبط الـ market لما region/city يتغيروا
  useEffect(() => {
    if (filters.market && !marketOptionsAll.includes(filters.market)) {
      setFilters((f) => ({ ...f, market: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.region, filters.city, marketOptionsAll.join("|")]);

  // لو في allowed_markets ومفيش قيمة حالية، حط أول قيمة تلقائيًا
  useEffect(() => {
    if (isMarketLocked && !filters.market && marketOptionsAll.length) {
      setFilters((f) => ({ ...f, market: marketOptionsAll[0] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMarketLocked, marketOptionsAll.join("|")]);

  /** ========== Exposed setters ========== */
  const setRegion = useCallback((v: string) => {
    if (isRegionLocked) return; // احترام القفل
    setFilters((f) => ({
      ...f,
      region: norm(v),
      city: "", // عادة بنفّرغ city لأن الregion اتغير
      market: "",
    }));
  }, [isRegionLocked]);

  const setCity = useCallback((v: string) => {
    if (isCityLocked) return;
    setFilters((f) => ({
      ...f,
      city: norm(v),
      market: "",
    }));
  }, [isCityLocked]);

  const setMarket = useCallback((v: string) => {
    if (isMarketLocked) return;
    const value = norm(v);
    // اسم السوق لازم يكون من options
    if (value && !marketOptionsAll.includes(value)) return;
    setFilters((f) => ({ ...f, market: value }));
  }, [isMarketLocked, marketOptionsAll]);

  const setBranch = useCallback((v: string | null) => {
    setFilters((f) => ({ ...f, branch: v }));
  }, []);

  const setTeamLeader = useCallback((v: string | null) => {
    if (isTeamLeaderLocked) return;
    setFilters((f) => ({ ...f, teamLeader: v || null }));
  }, [isTeamLeaderLocked]);

  const resetFilters = useCallback(() => {
    setFilters({
      region: defaultRegion,
      city: defaultCity,
      market: "", // سيُملأ تلقائيًا لو مقفول بـ allowed_markets
      branch: null,
      teamLeader: defaultTL || null,
    });
  }, [defaultRegion, defaultCity, defaultTL]);

  /** ========== Options exposed ========== */
  const regionOptions = regionOptionsAll;
  const cityOptions = cityOptionsAll;
  const marketOptions = marketOptionsAll;

  // TeamLeader options
  const teamLeaderOptions = useMemo(
    () =>
      teamLeaders.map((tl) => ({
        id: tl.id,
        name: tl.username,
        arabic_name: tl.arabic_name || null,
        username: tl.username,
      })),
    [teamLeaders]
  );

  // Branch options (مش مستخدمة حالياً)
  const branchOptions: Array<{ id: string; label: string }> = [];

  return {
    filters,
    // options
    regionOptions,
    cityOptions,
    marketOptions,
    branchOptions,
    teamLeaderOptions,
    // locks
    isRegionLocked,
    isCityLocked,
    isMarketLocked,
    isTeamLeaderLocked,
    // setters
    setRegion,
    setCity,
    setMarket,
    setBranch,
    setTeamLeader,
    resetFilters,
    // passthrough
    loading,
  };
}
