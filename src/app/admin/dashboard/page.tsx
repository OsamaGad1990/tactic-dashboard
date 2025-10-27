"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

import { useLangTheme } from "@/hooks/useLangTheme";
import { supabase } from "@/lib/supabaseClient";

/* ---------------- Utilities ---------------- */
const dirStyle = (isArabic: boolean): React.CSSProperties => ({
  direction: isArabic ? "rtl" : "ltr",
  writingDirection: (isArabic ? "rtl" : "ltr") as React.CSSProperties["writingDirection"],
  textAlign: isArabic ? "right" : "left",
});

const formatDuration = (minutesTotal: number) => {
  const m = Math.max(0, Math.floor(minutesTotal));
  const hh = Math.floor(m / 60).toString().padStart(2, "0");
  const mm = (m % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
};

/** عناصر تحكم موحّدة (الالوان من global.css) */
const ctrlClass =
  "h-9 min-w-[110px] shrink-0 rounded-lg px-3 text-sm " +
  "border bg-white text-zinc-900 border-zinc-300 " +
  "focus:outline-none focus:ring-2 focus:ring-blue-500 " +
  "dark:bg-[#0f1115] dark:text-zinc-100 dark:border-[#2a2d31] " +
  "placeholder:text-zinc-400 dark:placeholder:text-zinc-500";

/* ---------------- Types ---------------- */
type UUID = string;

type UserLite = {
  id: UUID;
  name: string | null;
  arabic_name: string | null;
};

type UserMini = {
  id: UUID;
  name: string | null;
  arabic_name: string | null;
  role: string | null;
  team_leader_id: UUID | null;
};

type Market = {
  id: UUID;
  region: string | null;
  city: string | null;
  store: string | null;
};

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

type Filters = {
  from?: string | null; // yyyy-mm-dd
  to?: string | null;
  region?: string | null;
  city?: string | null;
  store?: string | null;
  team_leader_id?: UUID | null;
};

type ClientMarketLink = { market_id: UUID };

type DateInputWithPicker = HTMLInputElement & { showPicker?: () => void };

/* ---------------- UI bits ---------------- */
function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.6)" }}
      onClick={onClose}
    >
      <div className="card" style={{ padding: 16 }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function Capsule({
  label,
  children,
  title,
}: {
  label: string;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div
      title={title}
      style={{
        display: "grid",
        gap: 6,
        border: "1px solid var(--input-border)",
        background: "var(--input-bg)",
        borderRadius: 14,
        padding: "8px 10px",
        minWidth: 180,
        flex: "1 1 220px",
      }}
      className="filtersBar"
    >
      <div style={{ fontSize: 12, color: "var(--muted)" }}>{label}</div>
      {children}
    </div>
  );
}

function KpiCard({
  value,
  label,
  percentageMode = false,
  timeMode = false,
}: {
  value: number;
  label: string;
  percentageMode?: boolean;
  timeMode?: boolean;
}) {
  const pctRaw = percentageMode ? value : value > 0 ? 100 : 0;
  const pct = Math.max(0, Math.min(100, pctRaw));

  const text = percentageMode
    ? `${Math.round(value)}%`
    : timeMode
    ? formatDuration(value)
    : Number.isFinite(value)
    ? Math.round(value).toLocaleString()
    : "--";

  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="kpi-ring" style={{ width: 96, height: 96, margin: "0 auto", color: "var(--accent)" }}>
        <CircularProgressbar
          value={pct}
          text={text}
          styles={buildStyles({
            pathColor: "currentColor",
            trailColor: "color-mix(in oklab, currentColor 18%, transparent)",
            textColor: "currentColor",
          })}
        />
      </div>
      <div style={{ textAlign: "center", marginTop: 12, color: "var(--muted)" }}>{label}</div>
    </div>
  );
}

function DateClickInput({
  value,
  onChange,
  title,
  placeholder = "yyyy-mm-dd",
  className = "",
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  title?: string;
  placeholder?: string;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    const el = ref.current as DateInputWithPicker | null;
    if (!el) return;

    const wasRO = el.readOnly;
    if (wasRO) el.readOnly = false;

    try {
      if (typeof el.showPicker === "function") {
        el.showPicker();
      } else {
        el.focus();
        el.click();
      }
    } finally {
      if (wasRO) setTimeout(() => (el.readOnly = true), 0);
    }
  };

  return (
    <div
      role="button"
      title={title}
      tabIndex={0}
      onClick={openPicker}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " " ? openPicker() : null)}
      className="filtersBar"
      style={{ display: "grid", gap: 6 }}
    >
      <input
        ref={ref}
        type="date"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder={placeholder}
        className={`${className} native-date`}
        readOnly
        style={{ textAlign: "center" }}
      />
    </div>
  );
}

/* ---------------- Page ---------------- */
export default function AdminDashboardPage() {
  const router = useRouter();
  const { isArabic } = useLangTheme();

  /* User + client logo */
  const [user, setUser] = useState<UserLite | null>(null);
  const [clientLogoUrl, setClientLogoUrl] = useState<string | null>(null);
  const [logoOpen, setLogoOpen] = useState(false);

  /* client + users for TL logic */
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientUsers, setClientUsers] = useState<UserMini[]>([]);

  /* user_settings gates */
  const [userSettings, setUserSettings] = useState<
    Pick<UserSettings, "requests" | "default_region" | "default_city" | "allowed_markets" | "notificatins" | "Team_leader"> | null
  >(null);

  /* Filters */
  const [filters, setFilters] = useState<Filters>({
    from: null,
    to: null,
    region: null,
    city: null,
    store: null,
    team_leader_id: null,
  });

  /* Markets + options */
  const [marketsData, setMarketsData] = useState<Market[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [stores, setStores] = useState<string[]>([]);
  const [tls, setTls] = useState<TL[]>([]);

  /* KPIs (visits + time) */
  const [totalVisits, setTotalVisits] = useState<number>(0);
  const [completedVisits, setCompletedVisits] = useState<number>(0);
  const [incompleteVisits, setIncompleteVisits] = useState<number>(0);
  const [totalWorkMinutes, setTotalWorkMinutes] = useState<number>(0);   // من session_snap
  const [totalVisitMinutes, setTotalVisitMinutes] = useState<number>(0); // من DailyVisitSnapshots

  /* Availability KPIs */
  const [totalItemsAvail, setTotalItemsAvail] = useState<number>(0);
  const [availableItems, setAvailableItems] = useState<number>(0);
  const [notAvailableItems, setNotAvailableItems] = useState<number>(0);

  /* -------- Fetch current user -------- */
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

  /* -------- Fetch clientId + logo -------- */
  useEffect(() => {
    (async () => {
      let cid: string | null = null;
      if (typeof window !== "undefined") {
        cid = localStorage.getItem("client_id");
      }

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

      const { data: clientRow } = await supabase.from("client").select("logo_url").eq("id", cid).maybeSingle();
      const key = clientRow?.logo_url?.trim();
      if (!key) return;

      const { data: publicURL } = supabase.storage.from("avatars").getPublicUrl(key);
      const url = publicURL?.publicUrl || null;
      if (url) setClientLogoUrl(url);
    })();
  }, [user?.id]);

  /* -------- user_settings -------- */
  useEffect(() => {
    (async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from<UserSettings>("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setUserSettings({
          requests: data.requests,
          default_region: data.default_region,
          default_city: data.default_city,
          allowed_markets: data.allowed_markets,
          notificatins: data.notificatins,
          Team_leader: data.Team_leader,
        });
        // قفل القيم الافتراضية مباشرة لو موجودة
        setFilters((prev) => ({
          ...prev,
          region: data.default_region?.[0] ?? prev.region,
          city: data.default_city?.[0] ?? prev.city,
          store: data.allowed_markets?.[0] ?? prev.store,
          team_leader_id: data.Team_leader?.[0] ?? prev.team_leader_id,
        }));
      } else {
        setUserSettings(null);
      }
    })();
  }, [user?.id]);

  /* -------- Load client's markets -------- */
  useEffect(() => {
    (async () => {
      if (!clientId) return;

      const linksRes = await supabase
        .from("client_markets")
        .select("market_id")
        .eq("client_id", clientId);

      const links = (linksRes.data ?? []) as ClientMarketLink[];
      const ids = new Set<string>(links.map((r) => r.market_id));

      const allRes = await supabase.from("Markets").select("id,region,city,store");
      const all = (allRes.data ?? []) as Market[];
      const markets = all.filter((m) => ids.has(m.id));

      setMarketsData(markets);
    })();
  }, [clientId]);

  /* -------- TLs from client_users -------- */
  useEffect(() => {
    (async () => {
      if (!clientId) return;

      const { data } = await supabase
        .from("client_users")
        .select("Users!inner(id,name,arabic_name,role,team_leader_id)")
        .eq("client_id", clientId)
        .eq("is_active", true);

      const rows = (data ?? []) as unknown as Array<{ Users: UserMini }>;
      const allUsers = rows.map((r) => r.Users);
      setClientUsers(allUsers);

      const listTLs = allUsers.filter(
        (u) => (u.role || "").toLowerCase().includes("team") && (u.role || "").toLowerCase().includes("leader")
      );
      setTls(listTLs.map((u) => ({ id: u.id, name: u.name, arabic_name: u.arabic_name })));

      if (!listTLs.length) {
        setFilters((prev) => ({ ...prev, team_leader_id: null }));
      }
    })();
  }, [clientId]);

  /* -------- Permission masks (locks) -------- */
  const permRegions = useMemo<Set<string> | null>(() => {
    const arr = userSettings?.default_region?.filter(Boolean) ?? [];
    return arr.length ? new Set(arr) : null;
  }, [userSettings?.default_region]);

  const permCities = useMemo<Set<string> | null>(() => {
    const arr = userSettings?.default_city?.filter(Boolean) ?? [];
    return arr.length ? new Set(arr) : null;
  }, [userSettings?.default_city]);

  const permStores = useMemo<Set<string> | null>(() => {
    const arr = userSettings?.allowed_markets?.map((s) => (s || "").trim()).filter(Boolean) ?? [];
    return arr.length ? new Set(arr) : null;
  }, [userSettings?.allowed_markets]);

  const permTLs = useMemo<Set<UUID> | null>(() => {
    const arr = userSettings?.Team_leader?.filter(Boolean) ?? [];
    return arr.length ? new Set(arr) : null;
  }, [userSettings?.Team_leader]);

  const lockedRegion = !!permRegions?.size;
  const lockedCity = !!permCities?.size;
  const lockedStore = !!permStores?.size;
  const lockedTL = !!permTLs?.size;

  /* -------- Ensure filters always respect locks -------- */
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      region: lockedRegion ? (userSettings?.default_region?.[0] ?? null) : prev.region,
      city: lockedCity ? (userSettings?.default_city?.[0] ?? null) : prev.city,
      store: lockedStore ? (userSettings?.allowed_markets?.[0] ?? null) : prev.store,
      team_leader_id: lockedTL ? (userSettings?.Team_leader?.[0] ?? null) : prev.team_leader_id,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockedRegion, lockedCity, lockedStore, lockedTL]);

  /* -------- Visible TLs according to lock -------- */
  const visibleTLs = useMemo(() => {
    if (!permTLs) return tls;
    return tls.filter((tl) => permTLs.has(tl.id));
  }, [tls, permTLs]);

  // لو قيمة TL مختارة مش ضمن المسموح → صلحها
  useEffect(() => {
    if (!filters.team_leader_id) return;
    if (visibleTLs.every((t) => t.id !== filters.team_leader_id)) {
      setFilters((prev) => ({ ...prev, team_leader_id: lockedTL ? userSettings?.Team_leader?.[0] ?? null : null }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleTLs]);

  /* -------- Effective allowed users (by TL lock/selection) -------- */
  const tlMaskUserIds = useMemo<UUID[] | null>(() => {
    if (!permTLs) return null;
    const out = new Set<UUID>();
    clientUsers.forEach((u) => {
      if (permTLs.has(u.id)) {
        out.add(u.id);
        clientUsers
          .filter((m) => m.team_leader_id === u.id)
          .forEach((m) => out.add(m.id));
      }
    });
    return Array.from(out);
  }, [permTLs, clientUsers]);

  const effectiveUserIds = useMemo<UUID[] | null>(() => {
    if (filters.team_leader_id) {
      const tlId = filters.team_leader_id;
      const team = clientUsers.filter((u) => u.team_leader_id === tlId).map((u) => u.id);
      const ids = [tlId, ...team];
      if (tlMaskUserIds) {
        const setMask = new Set(tlMaskUserIds);
        return ids.filter((id) => setMask.has(id));
      }
      return ids;
    }
    if (tlMaskUserIds) return tlMaskUserIds;
    return null;
  }, [filters.team_leader_id, clientUsers, tlMaskUserIds]);

  /* -------- Helpers: market passes current filter -------- */
  const marketPasses = useMemo(
    () => (m: Market, omitKey?: keyof Filters) => {
      // أقنعة الصلاحيات (Locks)
      if (permRegions && m.region && !permRegions.has(m.region)) return false;
      if (permCities && m.city && !permCities.has(m.city)) return false;
      if (permStores && m.store && !permStores.has(m.store)) return false;

      // الفلاتر المختارة
      const match = (key: keyof Filters, value: string | null, getter: (mm: Market) => string | null) => {
        if (omitKey === key) return true;
        if (!value) return true;
        return getter(m) === value;
      };

      return (
        match("region", filters.region ?? null, (mm) => mm.region) &&
        match("city", filters.city ?? null, (mm) => mm.city) &&
        match("store", filters.store ?? null, (mm) => mm.store)
      );
    },
    [filters.region, filters.city, filters.store, permRegions, permCities, permStores]
  );

  /* -------- Recompute options (respect locks) -------- */
  useEffect(() => {
    const nextRegions = new Set<string>();
    const nextCities = new Set<string>();
    const nextStores = new Set<string>();

    for (const m of marketsData) {
      if (marketPasses(m, "region") && m.region) nextRegions.add(m.region);
      if (marketPasses(m, "city") && m.city) nextCities.add(m.city);
      if (marketPasses(m, "store") && m.store) nextStores.add(m.store);
    }

    // لو في قفل، اقيد القوائم بالمسوح فقط
    const lockList = <T,>(src: T[], allowed: Set<T> | null) =>
      allowed ? src.filter((x) => allowed.has(x)) : src;

    const rArr = lockList(Array.from(nextRegions).sort(), permRegions);
    const cArr = lockList(Array.from(nextCities).sort(), permCities);
    const sArr = lockList(Array.from(nextStores).sort(), permStores);

    setRegions(rArr);
    setCities(cArr);
    setStores(sArr);

    // صحح أي اختيار خرج برا القوائم
    setFilters((prev) => {
      const next: Filters = { ...prev };
      if (next.region && !rArr.includes(next.region)) next.region = lockedRegion ? userSettings?.default_region?.[0] ?? null : null;
      if (next.city && !cArr.includes(next.city)) next.city = lockedCity ? userSettings?.default_city?.[0] ?? null : null;
      if (next.store && !sArr.includes(next.store)) next.store = lockedStore ? userSettings?.allowed_markets?.[0] ?? null : null;
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketsData, marketPasses, lockedRegion, lockedCity, lockedStore]);

  /* -------- Params memo (availability + visits) -------- */
  const availabilityParams = useMemo(
    () => ({
      clientId,
      from: filters.from ?? "1900-01-01",
      to: filters.to ?? "9999-12-31",
      filter_region: filters.region ?? null,
      filter_city: filters.city ?? null,
      filter_store: filters.store ?? null,
      team_leader: lockedTL ? (filters.team_leader_id ?? userSettings?.Team_leader?.[0] ?? null) : (filters.team_leader_id ?? null),
      regions: permRegions ? Array.from(permRegions) : null,
      cities: permCities ? Array.from(permCities) : null,
      stores: permStores ? Array.from(permStores) : null,
      // لو TL مختار: ما نبعتش user_ids لتجنّب التقاطع
      user_ids:
        lockedTL || filters.team_leader_id
          ? null
          : effectiveUserIds && effectiveUserIds.length
          ? effectiveUserIds
          : null,
    }),
    [clientId, filters, permRegions, permCities, permStores, effectiveUserIds, lockedTL, userSettings?.Team_leader]
  );

  const visitsParams = useMemo(
    () => ({
      clientId,
      from: filters.from ?? "1900-01-01",
      to: filters.to ?? "9999-12-31",
      filter_region: filters.region ?? null,
      filter_city: filters.city ?? null,
      filter_store: filters.store ?? null,
      team_leader: lockedTL ? (filters.team_leader_id ?? userSettings?.Team_leader?.[0] ?? null) : (filters.team_leader_id ?? null),
      regions: permRegions ? Array.from(permRegions) : null,
      cities: permCities ? Array.from(permCities) : null,
      stores: permStores ? Array.from(permStores) : null,
      user_ids:
        lockedTL || filters.team_leader_id
          ? null
          : effectiveUserIds && effectiveUserIds.length
          ? effectiveUserIds
          : null,
    }),
    [clientId, filters, permRegions, permCities, permStores, effectiveUserIds, lockedTL, userSettings?.Team_leader]
  );

  /* -------- Fetch availability KPIs -------- */
  useEffect(() => {
    if (!availabilityParams.clientId) return;
    (async () => {
      const { data: rows, error } = await supabase.rpc("admin_availability_kpis", {
        p_client: availabilityParams.clientId,
        p_from: availabilityParams.from,
        p_to: availabilityParams.to,
        p_regions: availabilityParams.regions,
        p_cities: availabilityParams.cities,
        p_stores: availabilityParams.stores,
        p_filter_region: availabilityParams.filter_region,
        p_filter_city: availabilityParams.filter_city,
        p_filter_store: availabilityParams.filter_store,
        p_team_leader: availabilityParams.team_leader,
        p_user_ids: availabilityParams.user_ids,
      });

      if (error || !rows || !rows[0]) {
        setTotalItemsAvail(0);
        setAvailableItems(0);
        setNotAvailableItems(0);
        return;
      }

      const r = rows[0];
      setTotalItemsAvail(Number(r.total_items) || 0);
      setAvailableItems(Number(r.available_items) || 0);
      setNotAvailableItems(Number(r.not_available_items) || 0);
    })();
  }, [availabilityParams]);

  /* -------- Fetch visit KPIs (visits time + counters) -------- */
  useEffect(() => {
    if (!visitsParams.clientId) return;
    (async () => {
      const { data: rows, error } = await supabase.rpc("admin_kpis", {
        p_client: visitsParams.clientId,
        p_from: visitsParams.from,
        p_to: visitsParams.to,
        p_regions: visitsParams.regions,
        p_cities: visitsParams.cities,
        p_stores: visitsParams.stores,
        p_filter_region: visitsParams.filter_region,
        p_filter_city: visitsParams.filter_city,
        p_filter_store: visitsParams.filter_store,
        p_team_leader: visitsParams.team_leader,
        p_user_ids: visitsParams.user_ids,
      });

      if (error || !rows || !rows[0]) {
        setTotalVisits(0);
        setCompletedVisits(0);
        setIncompleteVisits(0);
        setTotalVisitMinutes(0);
        return;
      }

      const r = rows[0];
      setTotalVisits(Number(r.total_visits) || 0);
      setCompletedVisits(Number(r.completed_visits) || 0);
      setIncompleteVisits(Number(r.incomplete_visits) || 0);
      setTotalVisitMinutes(Number(r.total_visit_minutes) || 0);
    })();
  }, [visitsParams]);

  /* -------- Fetch total work minutes (session_snap) -------- */
  useEffect(() => {
    if (!availabilityParams.clientId) return;
    (async () => {
      const { data: rows, error } = await supabase.rpc("admin_work_minutes", {
        p_client: availabilityParams.clientId,
        p_from: availabilityParams.from,
        p_to: availabilityParams.to,
        p_team_leader: availabilityParams.team_leader,
        p_user_ids: availabilityParams.user_ids,
      });

      const minutes = !error && rows && rows[0] ? Number(rows[0].total_work_minutes) || 0 : 0;
      setTotalWorkMinutes(minutes);
    })();
  }, [availabilityParams]);

  /* -------- Compute travel time (work - visit) -------- */
  const travelMinutes = useMemo(
    () => Math.max(0, totalWorkMinutes - totalVisitMinutes),
    [totalWorkMinutes, totalVisitMinutes]
  );

  /* -------- Update filter helpers -------- */
  const updateFilter = (key: keyof Filters, value: string | null) => {
    // لو الفلتر مقفول تجاهل أي محاولة تغيير
    if ((key === "region" && lockedRegion) ||
        (key === "city" && lockedCity) ||
        (key === "store" && lockedStore) ||
        (key === "team_leader_id" && lockedTL)) {
      return;
    }
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () =>
    setFilters({
      from: null,
      to: null,
      region: lockedRegion ? userSettings?.default_region?.[0] ?? null : null,
      city: lockedCity ? userSettings?.default_city?.[0] ?? null : null,
      store: lockedStore ? userSettings?.allowed_markets?.[0] ?? null : null,
      team_leader_id: lockedTL ? userSettings?.Team_leader?.[0] ?? null : null,
    });

  /* -------- UI computed -------- */
  const greetingName = useMemo(() => {
    if (!user) return isArabic ? "المدير" : "Manager";
    return isArabic ? user.arabic_name || user.name || "المدير" : user.name || user.arabic_name || "Manager";
  }, [user, isArabic]);

  const completedPct = useMemo(
    () => (totalVisits > 0 ? (completedVisits / totalVisits) * 100 : 0),
    [totalVisits, completedVisits]
  );

  const incompletePct = useMemo(
    () => (totalVisits > 0 ? (incompleteVisits / totalVisits) * 100 : 0),
    [totalVisits, incompleteVisits]
  );

  /* ====== Page ====== */
  return (
    <div style={{ ...(dirStyle(isArabic) as React.CSSProperties) }} className="px-5 pb-8 pt-4">
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/change-password")}
              className="btn"
              style={{
                width: "auto",
                padding: "8px 12px",
                borderRadius: 12,
                border: "1px solid var(--divider)",
                background: "var(--card)",
                color: "var(--text)",
              }}
              title={isArabic ? "تغيير كلمة المرور" : "Change password"}
            >
              {isArabic ? "تغيير كلمة المرور" : "Change Password"} 🔒
            </button>
          </div>

          <div className="card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ color: "var(--text)", opacity: 0.9, fontSize: 14 }}>
              {isArabic ? "مرحبًا" : "Welcome"}, <b>{greetingName}</b>
            </div>
          </div>

          <div className="cursor-zoom-in" onClick={() => setLogoOpen(true)} title={isArabic ? "تكبير الشعار" : "Enlarge logo"}>
            {clientLogoUrl ? (
              <Image src={clientLogoUrl} alt="Company Logo" width={64} height={28} className="object-contain" />
            ) : (
              <div style={{ width: 64, height: 28, borderRadius: 6, background: "var(--accent)" }} />
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="card" style={{ padding: 10, marginBottom: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "stretch",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            {/* Region */}
            <Capsule label={isArabic ? "المنطقة" : "Region"}>
              <select
                className={ctrlClass}
                value={filters.region ?? ""}
                onChange={(e) => updateFilter("region", e.target.value || null)}
                disabled={lockedRegion}
                style={lockedRegion ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
              >
                {!lockedRegion && <option value="">{isArabic ? "كل المناطق" : "All regions"}</option>}
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Capsule>

            {/* City */}
            <Capsule label={isArabic ? "المدينة" : "City"}>
              <select
                className={ctrlClass}
                value={filters.city ?? ""}
                onChange={(e) => updateFilter("city", e.target.value || null)}
                disabled={lockedCity}
                style={lockedCity ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
              >
                {!lockedCity && <option value="">{isArabic ? "كل المدن" : "All cities"}</option>}
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Capsule>

            {/* Market / Store */}
            <Capsule label={isArabic ? "السوق" : "Market"}>
              <select
                className={ctrlClass}
                value={filters.store ?? ""}
                onChange={(e) => updateFilter("store", e.target.value || null)}
                disabled={lockedStore}
                style={lockedStore ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
              >
                {!lockedStore && <option value="">{isArabic ? "كل الأسواق" : "All markets"}</option>}
                {stores.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Capsule>

            {/* Team Leader */}
            <Capsule
              label={isArabic ? "قائد الفريق" : "Team Leader"}
              title={
                visibleTLs.length === 0
                  ? isArabic
                    ? "لا يوجد قادة فرق لهذا العميل"
                    : "No Team Leaders for this client"
                  : undefined
              }
            >
              <select
                className={ctrlClass}
                value={filters.team_leader_id ?? ""}
                onChange={(e) => updateFilter("team_leader_id", (e.target.value || null) as UUID | null)}
                disabled={lockedTL || visibleTLs.length === 0}
                style={lockedTL || visibleTLs.length === 0 ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
              >
                {!lockedTL && <option value="">{isArabic ? "كل قادة الفرق" : "All TLs"}</option>}
                {visibleTLs.map((tl) => (
                  <option key={tl.id} value={tl.id}>
                    {isArabic ? tl.arabic_name || tl.name || "—" : tl.name || tl.arabic_name || "—"}
                  </option>
                ))}
              </select>
            </Capsule>

            {/* From */}
            <Capsule label={isArabic ? "من تاريخ" : "From"}>
              <DateClickInput
                value={filters.from ?? null}
                onChange={(v) => updateFilter("from", v)}
                className={ctrlClass}
                title={isArabic ? "من تاريخ" : "From"}
              />
            </Capsule>

            {/* To */}
            <Capsule label={isArabic ? "إلى تاريخ" : "To"}>
              <DateClickInput
                value={filters.to ?? null}
                onChange={(v) => updateFilter("to", v)}
                className={ctrlClass}
                title={isArabic ? "إلى تاريخ" : "To"}
              />
            </Capsule>

            {/* Reset button */}
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button
                type="button"
                onClick={resetFilters}
                className="btn"
                style={{
                  width: "auto",
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: "transparent",
                  color: "var(--text)",
                  border: "1px solid var(--divider)",
                  fontWeight: 800,
                }}
                title={isArabic ? "إعادة تعيين الفلاتر" : "Reset filters"}
              >
                {isArabic ? "إعادة تعيين" : "Reset"}
              </button>
            </div>
          </div>
        </div>

        {/* KPIs row 1 */}
        <div className="mb-8" style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(180px, 1fr))", gap: 16 }}>
          <KpiCard value={totalVisits} label={isArabic ? "إجمالي الزيارات" : "Total Visits"} />
          <KpiCard value={completedVisits} label={isArabic ? "الزيارات المكتملة" : "Completed Visits"} />
          <KpiCard value={completedPct} label={isArabic ? "نسبة المكتمل" : "Completed %"} percentageMode />
          <KpiCard value={incompleteVisits} label={isArabic ? "الزيارات غير المكتملة" : "Incomplete Visits"} />
          <KpiCard value={incompletePct} label={isArabic ? "نسبة غير المكتمل" : "Incomplete %"} percentageMode />
        </div>

        {/* Divider */}
        <div style={{ height: 1, width: "100%", background: "var(--divider)", marginBottom: 24 }} />

        {/* KPIs row 2 */}
        <div className="mb-8" style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(180px, 1fr))", gap: 16 }}>
          <KpiCard value={totalItemsAvail} label={isArabic ? "إجمالي الأصناف" : "Total Items"} />
          <KpiCard value={availableItems} label={isArabic ? "إجمالي الموجود" : "Total Available"} />
          <KpiCard value={notAvailableItems} label={isArabic ? "إجمالي الغير موجود" : "Total Not Available"} />
          <KpiCard value={totalVisitMinutes} label={isArabic ? "إجمالي وقت الزيارة" : "Total Visit Time"} timeMode />
          <KpiCard value={travelMinutes} label={isArabic ? "إجمالي وقت التنقّل" : "Total Travel Time"} timeMode />
        </div>

        {/* Footer actions */}
        <div
          className="mb-6"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          {[
            { to: "/admin/notifications", ar: "الإشعارات", en: "Notifications", hide: userSettings?.notificatins === false },
            { to: "/admin/reports", ar: "تقارير الزيارة", en: "Visit Reports" },
            { to: "/admin/visit-requests", ar: "طلبات الزيارة", en: "Visit Requests", hide: userSettings?.requests === false },
            { to: "/admin/yesterday-visits", ar: "زيارات أمس", en: "Yesterday Visits" },
          ]
            .filter((b) => !b.hide)
            .map((b) => (
              <button
                key={b.to}
                onClick={() => router.push(b.to)}
                className="btn"
                style={{ width: "auto", padding: "10px 14px", borderRadius: 12 }}
              >
                {isArabic ? b.ar : b.en}
              </button>
            ))}
        </div>

        {/* Logo Modal */}
        <Modal open={logoOpen} onClose={() => setLogoOpen(false)}>
          {clientLogoUrl ? (
            <Image src={clientLogoUrl} alt="Company Logo" width={420} height={160} className="object-contain" />
          ) : (
            <div style={{ width: 420, height: 160, borderRadius: 12, background: "var(--accent)" }} />
          )}
        </Modal>
      </div>
    </div>
  );
}
