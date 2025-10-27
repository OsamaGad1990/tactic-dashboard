"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ===== Types (مطابقة للصفحة) ===== */
type UUID = string;

type UserLite = { id: UUID; name: string | null; arabic_name: string | null; };
type UserMini = { id: UUID; name: string | null; arabic_name: string | null; role: string | null; team_leader_id: UUID | null; };
type Market = { id: UUID; region: string | null; city: string | null; store: string | null; };
type TL = { id: UUID; name: string | null; arabic_name: string | null };
type UserSettings = {
  id: UUID;
  user_id: UUID | null;
  default_region: string[] | null;
  allowed_markets: string[] | null;
  Team_leader: UUID[] | null;
  default_city: string[] | null;
  notificatins: boolean | null;
  requests: boolean | null;
};

export type Filters = {
  from?: string | null;
  to?: string | null;
  region?: string | null;
  city?: string | null;
  store?: string | null;
  team_leader_id?: UUID | null;
};

type ClientMarketLink = { market_id: UUID };

export function useAdminCascadingFilters() {
  /* ===== User + Client ===== */
  const [user, setUser] = useState<UserLite | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  /* ===== Settings / Data ===== */
  const [userSettings, setUserSettings] = useState<
    Pick<UserSettings, "requests"|"default_region"|"default_city"|"allowed_markets"|"notificatins"|"Team_leader"> | null
  >(null);

  const [clientUsers, setClientUsers] = useState<UserMini[]>([]);
  const [marketsData, setMarketsData] = useState<Market[]>([]);
  const [tls, setTls] = useState<TL[]>([]);

  /* ===== Filters & Options ===== */
  const [filters, setFilters] = useState<Filters>({
    from: null, to: null, region: null, city: null, store: null, team_leader_id: null,
  });
  const [regions, setRegions] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [stores, setStores] = useState<string[]>([]);

  /* ===== bootstrap current user ===== */
  useEffect(() => {
    (async () => {
      const { data: authRes } = await supabase.auth.getUser();
      const authId = authRes?.user?.id || null;

      let userRow: UserLite | null = null;
      if (authId) {
        const { data } = await supabase
          .from("Users")
          .select("id,name,arabic_name")
          .eq("auth_user_id", authId)
          .maybeSingle();
        if (data) userRow = data as unknown as UserLite;
      }
      if (!userRow) {
        const { data } = await supabase.from("Users").select("id,name,arabic_name").limit(1).maybeSingle();
        if (data) userRow = data as unknown as UserLite;
      }
      if (userRow) setUser(userRow);
    })();
  }, []);

  /* ===== clientId ===== */
  useEffect(() => {
    (async () => {
      let cid: string | null = null;
      if (typeof window !== "undefined") cid = localStorage.getItem("client_id");
      if (!cid && user?.id) {
        const { data: clientByUser } = await supabase
          .from("client")
          .select("id")
          .contains("linked_users", [user.id])
          .limit(1)
          .maybeSingle();
        cid = clientByUser?.id || null;
      }
      if (!cid) return;
      setClientId(cid);
    })();
  }, [user?.id]);

  /* ===== user_settings ===== */
 useEffect(() => {
  (async () => {
    if (!user?.id) return;

    const { data } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const settings = (data ?? null) as UserSettings | null;

    if (settings) {
      setUserSettings({
        requests: settings.requests,
        default_region: settings.default_region,
        default_city: settings.default_city,
        allowed_markets: settings.allowed_markets,
        notificatins: settings.notificatins,
        Team_leader: settings.Team_leader,
      });

      setFilters(prev => ({
        ...prev,
        region: prev.region ?? (settings.default_region?.[0] ?? null),
        city:   prev.city   ?? (settings.default_city?.[0]   ?? null),
      }));
    } else {
      setUserSettings(null);
    }
  })();
}, [user?.id]);

  /* ===== markets (scoped by client) ===== */
  useEffect(() => {
    (async () => {
      if (!clientId) return;
      const linksRes = await supabase.from("client_markets").select("market_id").eq("client_id", clientId);
      const links = (linksRes.data ?? []) as ClientMarketLink[];
      const ids = new Set(links.map(r => r.market_id));

      const allRes = await supabase.from("Markets").select("id,region,city,store");
      const all = (allRes.data ?? []) as Market[];
      const markets = all.filter(m => ids.has(m.id));
      setMarketsData(markets);
    })();
  }, [clientId]);

  /* ===== client users + TLs ===== */
  useEffect(() => {
    (async () => {
      if (!clientId) return;
      const { data } = await supabase
        .from("client_users")
        .select("Users!inner(id,name,arabic_name,role,team_leader_id)")
        .eq("client_id", clientId)
        .eq("is_active", true);

      const rows = (data ?? []) as unknown as Array<{ Users: UserMini }>;
      const allUsers = rows.map(r => r.Users);
      setClientUsers(allUsers);

      const listTLs = allUsers.filter(u =>
        (u.role || "").toLowerCase().includes("team") &&
        (u.role || "").toLowerCase().includes("leader")
      );
      setTls(listTLs.map(u => ({ id: u.id, name: u.name, arabic_name: u.arabic_name })));

      if (!listTLs.length) setFilters(prev => ({ ...prev, team_leader_id: null }));
    })();
  }, [clientId]);

  /* ===== masks ===== */
  const permRegions = useMemo<Set<string> | null>(() => {
    const arr = userSettings?.default_region?.filter(Boolean) ?? [];
    return arr.length ? new Set(arr) : null;
  }, [userSettings?.default_region]);

  const permCities = useMemo<Set<string> | null>(() => {
    const arr = userSettings?.default_city?.filter(Boolean) ?? [];
    return arr.length ? new Set(arr) : null;
  }, [userSettings?.default_city]);

  const permStores = useMemo<Set<string> | null>(() => {
    const arr = userSettings?.allowed_markets?.map(s => (s || "").trim()).filter(Boolean) ?? [];
    return arr.length ? new Set(arr) : null;
  }, [userSettings?.allowed_markets]);

  const permTLs = useMemo<Set<UUID> | null>(() => {
    const arr = userSettings?.Team_leader?.filter(Boolean) ?? [];
    return arr.length ? new Set(arr) : null;
  }, [userSettings?.Team_leader]);

  const visibleTLs = useMemo(() => {
    if (!permTLs) return tls;
    return tls.filter(tl => permTLs.has(tl.id));
  }, [tls, permTLs]);

  const tlDisabled = visibleTLs.length === 0;

  useEffect(() => {
    if (!filters.team_leader_id) return;
    if (visibleTLs.every(t => t.id !== filters.team_leader_id)) {
      setFilters(prev => ({ ...prev, team_leader_id: null }));
    }
  }, [visibleTLs, filters.team_leader_id]);

  const tlMaskUserIds = useMemo<UUID[] | null>(() => {
    if (!permTLs) return null;
    const out = new Set<UUID>();
    clientUsers.forEach(u => {
      if (permTLs.has(u.id)) {
        out.add(u.id);
        clientUsers.filter(m => m.team_leader_id === u.id).forEach(m => out.add(m.id));
      }
    });
    return Array.from(out);
  }, [permTLs, clientUsers]);

  const effectiveUserIds = useMemo<UUID[] | null>(() => {
    if (filters.team_leader_id) {
      const tlId = filters.team_leader_id;
      const team = clientUsers.filter(u => u.team_leader_id === tlId).map(u => u.id);
      const ids = [tlId, ...team];
      if (tlMaskUserIds) {
        const mask = new Set(tlMaskUserIds);
        return ids.filter(id => mask.has(id));
      }
      return ids;
    }
    if (tlMaskUserIds) return tlMaskUserIds;
    return null;
  }, [filters.team_leader_id, clientUsers, tlMaskUserIds]);

  /* ===== marketPasses + cascade ===== */
  const marketPasses = useMemo(
    () => (m: Market, omitKey?: keyof Filters) => {
      if (permRegions && m.region && !permRegions.has(m.region)) return false;
      if (permCities && m.city && !permCities.has(m.city)) return false;
      if (permStores && m.store && !permStores.has(m.store)) return false;

      const match = (key: keyof Filters, value: string | null, getter: (mm: Market) => string | null) => {
        if (omitKey === key) return true;
        if (!value) return true;
        return getter(m) === value;
      };

      return (
        match("region", filters.region ?? null, mm => mm.region) &&
        match("city",   filters.city   ?? null, mm => mm.city)   &&
        match("store",  filters.store  ?? null, mm => mm.store)
      );
    },
    [filters.region, filters.city, filters.store, permRegions, permCities, permStores]
  );

  useEffect(() => {
    const nextR = new Set<string>();
    const nextC = new Set<string>();
    const nextS = new Set<string>();

    for (const m of marketsData) {
      if (marketPasses(m, "region") && m.region) nextR.add(m.region);
      if (marketPasses(m, "city")   && m.city)   nextC.add(m.city);
      if (marketPasses(m, "store")  && m.store)  nextS.add(m.store);
    }

    const rArr = Array.from(nextR).sort();
    const cArr = Array.from(nextC).sort();
    const sArr = Array.from(nextS).sort();

    setRegions(rArr); setCities(cArr); setStores(sArr);

    setFilters(prev => {
      const next: Filters = { ...prev };
      if (next.region && !rArr.includes(next.region)) next.region = null;
      if (next.city   && !cArr.includes(next.city))   next.city   = null;
      if (next.store  && !sArr.includes(next.store))  next.store  = null;
      return next;
    });
  }, [marketsData, marketPasses]);

  /* ===== params builders (مطابقة كاملة) ===== */
  const buildParams = useMemo(() => {
    const base = {
      clientId,
      from:  filters.from ?? "1900-01-01",
      to:    filters.to   ?? "9999-12-31",
      filter_region: filters.region ?? null,
      filter_city:   filters.city   ?? null,
      filter_store:  filters.store  ?? null,
      team_leader:   tlDisabled ? null : (filters.team_leader_id ?? null),
      regions: permRegions ? Array.from(permRegions) : null,
      cities:  permCities ? Array.from(permCities)   : null,
      stores:  permStores ? Array.from(permStores)   : null,
      user_ids: (tlDisabled || filters.team_leader_id)
        ? null
        : (effectiveUserIds && effectiveUserIds.length ? effectiveUserIds : null),
    };
    return {
      availabilityParams: base,
      visitsParams: base, // نفس الشكل بالضبط
    };
  }, [clientId, filters, permRegions, permCities, permStores, effectiveUserIds, tlDisabled]);

  /* ===== API surface ===== */
  const updateFilter = (key: keyof Filters, value: string | null) =>
    setFilters(prev => ({ ...prev, [key]: value }));

  const resetFilters = () => setFilters({
    from: null, to: null, region: null, city: null, store: null, team_leader_id: null
  });

  return {
    user, clientId, userSettings,
    filters, updateFilter, resetFilters,
    regions, cities, stores,
    tls: visibleTLs, tlDisabled,
    availabilityParams: buildParams.availabilityParams,
    visitsParams: buildParams.visitsParams,
    /* في الصفحات الهدف: استخدم availabilityParams و visitsParams مباشرة مع الـ RPCs */
  };
}
