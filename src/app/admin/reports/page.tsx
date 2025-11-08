"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLangTheme } from "@/hooks/useLangTheme";
import StepsToolbar from "@/app/admin/visit-steps/StepsToolbar";
import StepDataTable from "@/app/admin/visit-steps/StepDataTable";
import { VISIT_STEPS, StepKey } from "@/utils/visitStepsMap";
import SupaImg from "@/components/SupaImg";
import { useAdminCascadingFilters } from "@/hooks/useAdminCascadingFilters";
import type { PostgrestError } from "@supabase/supabase-js";
import { useScopeLock } from "@/hooks/useScopeLock";
import { supabase } from "@/lib/supabaseClient";
/* ========= Types ========= */
type UUID = string;

type AllVisitsCombinedRow = {
  id: UUID | null;
  tl_visit_id: UUID | null;
  user_id: UUID;
  market_id: UUID;
  client_id: UUID | null;
  snapshot_date: string;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  end_reason_en: string | null;
  end_reason_ar: string | null;
  end_visit_photo: string | null;
  source_table?: "Visits" | "TLVisits" | null;
  jp_state: string | null;
};

type UserRow = {
  id: UUID;
  auth_user_id?: UUID | null; 
  name: string | null;
  username: string | null;
  arabic_name: string | null;
  role: string | null;
  team_leader_id: UUID | null;
};

type MarketRow = {
  id: UUID;
  name: string;
  region?: string | null;
  city?: string | null;
  store?: string | null;
  branches?: string | null;
};

type SnapshotRow = {
  id: UUID;
  original_visit_id: UUID | null;
  tl_visit_id: UUID | null;
  coordinator_visit_id: UUID | null;
  user_id: UUID;
  market_id: UUID;
  client_id: UUID | null;
  snapshot_date: string;
  status: string;
  jp_state?: string | null;
  started_at: string | null;
  finished_at: string | null;
  end_reason_en: string | null;
  end_reason_ar: string | null;
  end_visit_photo: string | null;
  source_table?: "Visits" | "TLVisits" | null;
};

type UserSettingsRow = {
  default_region: string[] | null;
  default_city: string[] | null;
  allowed_markets: string[] | null;
  Team_leader: UUID[] | null;
};


/* ========= Helpers ========= */
const isAdminRole = (role?: string | null) => {
  const r = (role || "").toLowerCase().trim();
  return r === "admin" || r === "super_admin" || r === "super admin";
};
const isTLRole = (role?: string | null) => {
  const r = (role || "").toLowerCase();
  return r.includes("team_leader") || r.includes("team leader") || r === "tl" || r === "teamleader";
};

const roleLabel = (role: string | null, ar: boolean) => {
  const r = (role || "").toLowerCase();
  if (r === "mch") return ar ? "منسق" : "Merchandiser";
  if (r === "promoter" || r === "promoplus") return ar ? "مروج" : "Promoter";
  if (r.includes("team_leader")) return ar ? "قائد فريق" : "Team Leader";
  return role || "—";
};

const cardBorder = "1px solid var(--divider)";

const toKsaDayRange = (day: string) => {
  // day هو 'YYYY-MM-DD'
 const ymd = day.split("T")[0];
 const fromISO = `${ymd}T00:00:00+03:00`; // بداية اليوم (بتوقيت السعودية)

  // لإنشاء اليوم التالي بشكل صحيح
  // 1. أنشئ تاريخاً بناءً على YMD (كسلسلة نصية لضمان التوقيت المحلي)
  const dateParts = ymd.split('-').map(Number);
  const year = dateParts[0];
  const month = dateParts[1] - 1; // (الأشهر تبدأ من 0)
  const date = dateParts[2];
  
  // 2. أنشئ التاريخ (سيفترضه كتوقيت محلي، لا يهم)
  const d = new Date(year, month, date);
  
  // 3. أضف يوماً واحداً
  d.setDate(d.getDate() + 1);
  
  // 4. استخرج الأجزاء (الآن 'd' هو اليوم التالي)
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  
  // toISO هو بداية اليوم التالي (بتوقيت السعودية)
 const toISO = `${yyyy}-${mm}-${dd}T00:00:00+03:00`; 
 return { fromISO, toISO };
};

// feature_key (من ClientFeatures) -> steps اللي تتحكم فيها
const FEATURE_TO_STEPS: Record<string, StepKey[]> = {
 COMPACTIVITY: ["competitor_activity"],
 SOS: ["sos_reports"],
 DAMDAGE_COUNT: ["damage_reports"], // ⬅️ تم التصحيح (D-A-G)
 WH_COUNT: ["whcount"],
 PLANOGRAM: [], 
};

// الخطوات الثابتة دايمًا On
const ALWAYS_ON_STEPS: StepKey[] = ["arrival_photos", "availability", "remarks"];
const ROLE_STEPS: Record<string, StepKey[]> = {
  mch: ["arrival_photos", "availability", "whcount", "damage_reports", "sos_reports", "competitor_activity", "remarks"],
  promoter: ["promoter_reports", "remarks"],
  promoplus: ["promoter_plus_reports", "remarks"],
  team_leader: ["tl_details"],
};

const normalizeRole = (r: string | null | undefined) => {
  const v = (r || "").toLowerCase().trim();
  if (v.includes("team_leader")) return "team_leader";
  if (v === "mch") return "mch";
  if (v === "promoterplus" || v === "promoplus" || v === "promoter_plus") return "promoplus";
  if (v === "promoter") return "promoter";
  return v || "unknown";
};
type Option = { value: string; label: string };

function SelectObject({
  options,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const { isArabic } = useLangTheme();
  return (
    <div style={{ position: "relative", opacity: disabled ? 0.6 : 1 }}>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.currentTarget.value)}
        disabled={disabled}
        style={{
          width: "100%",
          height: 36,
          borderRadius: 8,
          border: "1px solid var(--input-border)",
          background: "var(--card)",
          color: "var(--text)",
          padding: isArabic ? "0 28px 0 8px" : "0 8px 0 28px",
        }}
      >
        <option value="">{placeholder || ""}</option>
        {options.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SelectSingle({
  options,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const mapped: Option[] = options.map((x) => ({ value: x, label: x }));
  return (
    <SelectObject
      options={mapped}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}

function DateField({
  label,
  value,
  onChange,
  locale = "en-GB",
}: {
  label: string;
  value: string | null | undefined;
  onChange: (v: string) => void;
  locale?: string;
}) {
  const pretty = (() => {
    if (!value) return "—";
    const d = new Date(value + "T00:00:00");
    if (Number.isNaN(+d)) return value;
    return d.toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" });
  })();

  return (
    <div style={{ display: "grid", gap: 6 }}>
      {label ? <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div> : null}
      <input
        type="date"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          height: 36,
          borderRadius: 8,
          border: "1px solid var(--input-border)",
          background: "var(--card)",
          color: "var(--text)",
          padding: "0 10px",
        }}
        title={pretty}
      />
    </div>
  );
}
/* ========= Small UI bits ========= */
function PillCount({ n }: { n: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 24,
        padding: "2px 8px",
        borderRadius: 999,
        border: cardBorder,
        background: "var(--card)",
        color: "var(--muted, #aaa)",
        fontSize: 12,
      }}
    >
      {n}
    </span>
  );
}

function Panel({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ border: cardBorder, background: "var(--card)", borderRadius: 16, padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, opacity: 0.9 }}>{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div
      style={{
        border: cardBorder,
        background: "var(--input-bg)",
        borderRadius: 12,
        padding: 24,
        textAlign: "center",
        fontSize: 13,
        opacity: 0.85,
      }}
    >
      {text}
    </div>
  );
}

function Capsule({ label, summary, children }: { label: string; summary?: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        border: "1px solid var(--input-border)",
        borderRadius: 14,
        background: "var(--input-bg)",
        padding: "8px 10px",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 12, color: "var(--muted, #aaa)" }}>{label}</div>
        {summary && <div style={{ fontSize: 11, opacity: 0.75 }}>{summary}</div>}
      </div>
      {children}
    </div>
  );
}

/* ========= Visit IDs helper (مطابق لفكرة SQL) ========= */
type VisitIdsPair = { original: string[]; tl: string[] };

/* ========= Main Page ========= */
export default function Page() {
  const { isArabic: ar } = useLangTheme();
  const [loading, setLoading] = useState(false);

  const [userSettings, setUserSettings] = useState<
    Pick<UserSettingsRow, "default_region" | "default_city" | "allowed_markets" | "Team_leader"> | null
  >(null);
  const [showTLsInUsers, setShowTLsInUsers] = useState(true);

  const [users, setUsers] = useState<UserRow[]>([]);
  const [markets, setMarkets] = useState<MarketRow[]>([]);
  const [selectedUser, setSelectedUser] = useState<UUID | "">("");
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<UUID[]>([]);
  const [snapshots, setSnapshots] = useState<SnapshotRow[]>([]);
  const [selectedSnapshotIds, setSelectedSnapshotIds] = useState<string[]>([]);
  const [incompleteCount, setIncompleteCount] = useState(0);
  const [filters, setFilters] = useState({ region: "", city: "", market: "" });

  // [!!!] تم إصلاح السطر التالي
  const [visitIdsPair, setVisitIdsPair] = useState<VisitIdsPair>({ original: [], tl: [] });

  const { clientId, tls, tlDisabled, filters: gFilters, updateFilter } = useAdminCascadingFilters();

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

  const lockedRegion = !!permRegions?.size;
  const lockedCity = !!permCities?.size;
  const lockedStore = !!permStores?.size;

  const permTLs = useMemo<Set<UUID> | null>(() => {
    const arr = userSettings?.Team_leader?.filter(Boolean) ?? [];
    return arr.length ? new Set(arr) : null;
  }, [userSettings?.Team_leader]);
  const lockedTL = !!permTLs?.size;

  useEffect(() => {
    if (lockedTL && userSettings?.Team_leader?.[0]) {
      updateFilter("team_leader_id", userSettings.Team_leader[0]);
    }
  }, [lockedTL, userSettings?.Team_leader, updateFilter]);

  const selectedUserRole = useMemo(() => {
    const role = users.find((u) => u.id === selectedUser)?.role ?? null;
    return normalizeRole(role);
  }, [selectedUser, users]);

  const { scope } = useScopeLock({ selectedUserId: selectedUser || undefined });
  const scopeMarketIds = useMemo(() => scope?.market_ids ?? [], [scope?.market_ids]);

  const [regionsOpts, setRegionsOpts] = useState<string[]>([]);
  const [citiesOpts, setCitiesOpts] = useState<string[]>([]);
  const [marketsOpts, setMarketsOpts] = useState<string[]>([]);

  const FIRST_STEP: StepKey = useMemo(() => Object.keys(VISIT_STEPS)[0] as StepKey, []);
  const [currentStep, setCurrentStep] = useState<StepKey>(FIRST_STEP);
  const [availableSteps, setAvailableSteps] = useState<StepKey[]>([]);
  const [endReasonViewer, setEndReasonViewer] = useState({ open: false, reasonEn: "", reasonAr: "", photo: "" });

  // تحميل إعدادات المستخدم
  useEffect(() => {
    (async () => {
      const { data: authRes } = await supabase.auth.getUser();
      const authId = authRes?.user?.id || null;
      if (!authId) return;

      type UserIdRow = { id: string };
      const { data: u } = await supabase
        .from("Users")
        .select("id")
        .eq("auth_user_id", authId)
        .returns<UserIdRow[]>()
        .maybeSingle();
      if (!u) return;

      type UserSettingsPick = {
        default_region: string[] | null;
        default_city: string[] | null;
        allowed_markets: string[] | null;
        Team_leader: string[] | null;
      };

      const { data: st } = await supabase
        .from("user_settings")
        .select("default_region, default_city, allowed_markets, Team_leader")
        .eq("user_id", u.id)
        .maybeSingle<UserSettingsPick>();

      if (st) {
        setUserSettings({
          default_region: st.default_region,
          default_city: st.default_city,
          allowed_markets: st.allowed_markets,
          Team_leader: st.Team_leader as UUID[] | null,
        });
      }
    })();
  }, []);

  // تحميل المستخدمين
  useEffect(() => {
    setMarkets([]);
    setSnapshots([]);
    setSelectedBranches([]);
    if (!clientId || !gFilters.team_leader_id) return;

    (async () => {
      setLoading(true);

      type ClientUserJoin = { user_id: UUID; Users: UserRow };
      const { data: cu } = await supabase
        .from("client_users")
        .select("user_id, Users!inner(id, auth_user_id, name, username, arabic_name, role, team_leader_id)")
        .eq("client_id", clientId)
        .eq("is_active", true)
        .returns<ClientUserJoin[]>();

      const base = (cu ?? []).map((r) => r.Users);

      const leaderIds = Array.from(new Set(base.map((u) => u.team_leader_id).filter(Boolean))) as string[];
      let leaders: UserRow[] = [];
      if (leaderIds.length) {
        const { data: ls } = await supabase
          .from("Users")
          .select("id, auth_user_id, name, username, arabic_name, role, team_leader_id")
          .in("id", leaderIds)
          .returns<UserRow[]>();
        leaders = (ls ?? []).filter((u) => isTLRole(u.role));
      }

      let list = base;
      if (gFilters.team_leader_id !== "ALL") {
        const sel = gFilters.team_leader_id;
        list = base.filter((u) => u.team_leader_id === sel);
        const { data: tlRow } = await supabase
          .from("Users")
          .select("id, auth_user_id, name, username, arabic_name, role, team_leader_id")
          .eq("id", sel)
          .maybeSingle<UserRow>();
        if (tlRow) leaders = [tlRow];
      }

      const mix = showTLsInUsers ? [...list, ...leaders] : list;
      const all = mix.filter((u) => !isAdminRole(u.role));
      const uniq = Array.from(new Map(all.map((u) => [u.id, u])).values()).sort((a, b) =>
        (a.username || "").localeCompare(b.username || "", "ar")
      );

      setUsers(uniq);
      setSelectedUser((prev) => (prev && uniq.some((u) => u.id === prev) ? prev : uniq[0]?.id ?? ""));
      setLoading(false);
    })();
  }, [clientId, gFilters.team_leader_id, showTLsInUsers]);

  // تحميل الأسواق للفيوزر المختار
  type MarketsSelect = {
    id: string;
    region: string | null;
    city: string | null;
    store: string | null;
    branch: string | null;
  };

  useEffect(() => {
    setMarkets([]);
    setSelectedChains([]);
    setSelectedBranches([]);
    setSnapshots([]);
    setSelectedSnapshotIds([]);
    if (!selectedUser || !clientId) return;

    const isUUID = (x: unknown): x is string => typeof x === "string" && x.length > 0;

    (async () => {
      setLoading(true);

      const vmRes = await supabase
        .from("Visits")
        .select("market_id, user_id")
        .eq("client_id", clientId)
        .eq("user_id", selectedUser)
        .not("market_id", "is", null);

      let marketIds = Array.from(new Set((vmRes.data ?? []).map((r) => r.market_id as unknown).filter(isUUID)));

      const snapMarketsRes = await supabase
        .from("DailyVisitSnapshots")
        .select("market_id")
        .eq("client_id", clientId)
        .in("user_id", selectedUser ? [selectedUser] : [])
        .not("market_id", "is", null);

      if (!snapMarketsRes.error) {
        const snapIds = (snapMarketsRes.data ?? []).map((r) => r.market_id as unknown).filter(isUUID);
        marketIds = Array.from(new Set([...marketIds, ...snapIds]));
      }

      if (marketIds.length === 0) {
        const cmRes = await supabase.from("client_markets").select("market_id").eq("client_id", clientId);
        marketIds = Array.from(new Set((cmRes.data ?? []).map((r) => r.market_id as unknown).filter(isUUID)));
      }

      if (marketIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("Markets")
        .select("id, region, city, store, branch")
        .in("id", marketIds)
        .returns<MarketsSelect[]>();

      let ms: MarketRow[] = (data ?? []).map((r) => ({
        id: String(r.id),
        name: r.branch?.trim() || r.store?.trim() || "—",
        region: r.region,
        city: r.city,
        store: r.store,
        branches: r.branch,
      }));

      if (scopeMarketIds.length) {
        const allowed = new Set(scopeMarketIds.map(String));
        ms = ms.filter((m) => allowed.has(m.id));
      }

      setMarkets(ms);
      setLoading(false);
    })();
  }, [selectedUser, clientId, scopeMarketIds]);

  /* ====== فلاتر المنطقة/المدينة/السوق ====== */
  const marketPasses = useMemo(
    () => (m: MarketRow, omitKey?: "region" | "city" | "market") => {
      if (permRegions && m.region && !permRegions.has(m.region)) return false;
      if (permCities && m.city && !permCities.has(m.city)) return false;
      const storeName = (m.store || m.name || "").trim();
      if (permStores && storeName && !permStores.has(storeName)) return false;

      const match = (key: "region" | "city" | "market", value: string, getter: (mm: MarketRow) => string | null) => {
        if (omitKey === key) return true;
        if (!value) return true;
        return (getter(m) || "") === value;
      };

      return (
        match("region", filters.region, (mm) => mm.region ?? null) &&
        match("city", filters.city, (mm) => mm.city ?? null) &&
        match("market", filters.market, (mm) => (mm.store || mm.name || "").trim() || null)
      );
    },
    [filters.region, filters.city, filters.market, permRegions, permCities, permStores]
  );

  useEffect(() => {
    const nextRegions = new Set<string>();
    const nextCities = new Set<string>();
    const nextStores = new Set<string>();

    for (const m of markets) {
      if (marketPasses(m, "region") && m.region) nextRegions.add(m.region);
      if (marketPasses(m, "city") && m.city) nextCities.add(m.city);
      const nm = (m.store || m.name || "").trim();
      if (marketPasses(m, "market") && nm) nextStores.add(nm);
    }

    const lockList = <T,>(src: T[], allowed: Set<T> | null) => (allowed ? src.filter((x) => allowed.has(x)) : src);

    const rArr = lockList(Array.from(nextRegions).sort((a, b) => a.localeCompare(b, "ar")), permRegions);
    const cArr = lockList(Array.from(nextCities).sort((a, b) => a.localeCompare(b, "ar")), permCities);
    const sArr = lockList(Array.from(nextStores).sort((a, b) => a.localeCompare(b, "ar")), permStores);

    setRegionsOpts(rArr);
    setCitiesOpts(cArr);
    setMarketsOpts(sArr);

    setFilters((prev) => {
      const next = { ...prev };
      if (next.region && !rArr.includes(next.region))
        next.region = lockedRegion && userSettings?.default_region?.[0] ? userSettings.default_region[0] : "";
      if (next.city && !cArr.includes(next.city))
        next.city = lockedCity && userSettings?.default_city?.[0] ? userSettings.default_city[0] : "";
      if (next.market && !sArr.includes(next.market))
        next.market = lockedStore && userSettings?.allowed_markets?.[0] ? userSettings.allowed_markets[0] : "";
      return next;
    });
  }, [markets, marketPasses, lockedRegion, lockedCity, lockedStore, userSettings, permRegions, permCities, permStores]);

  const filteredMarkets = useMemo(() => markets.filter((m) => marketPasses(m)), [markets, marketPasses]);

  const chains = useMemo(() => {
    const S = new Set<string>();
    filteredMarkets.forEach((m) => {
      const name = (m.store || m.name || "").trim();
      if (name) S.add(name);
    });
    return Array.from(S).sort((a, b) => a.localeCompare(b, "ar"));
  }, [filteredMarkets]);

  const branches = useMemo(() => {
    const base = selectedChains.length
      ? filteredMarkets.filter((m) => selectedChains.includes((m.store || m.name || "").trim()))
      : filteredMarkets;

    return base
      .map((m) => ({
        id: m.id,
        label:
          (m.branches && m.branches.trim()) ||
          (m.name && m.name.trim()) ||
          (m.store && m.store.trim()) ||
          (m.city && m.city.trim()) ||
          "—",
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "ar"));
  }, [filteredMarkets, selectedChains]);

  useEffect(() => {
    const chain = filters.market?.trim() || "";
    setSelectedChains(chain ? [chain] : []);

    const allowedIds = new Set(
      (chain ? filteredMarkets.filter((m) => (m.store || m.name || "").trim() === chain) : filteredMarkets).map((m) => m.id)
    );

    setSelectedBranches((prev) => prev.filter((id) => allowedIds.has(id)));

    setSnapshots([]);
    setSelectedSnapshotIds([]);
    setIncompleteCount(0);
  }, [filters.region, filters.city, filters.market, filteredMarkets]);

  // جلب الزيارات للفروع المختارة
  useEffect(() => {
    setSnapshots([]);
    setSelectedSnapshotIds([]);
    setIncompleteCount(0);
    if (!clientId || !selectedUser || selectedBranches.length === 0) return;

    (async () => {
      setLoading(true);

      const selectCols = `
        id:visit_id,
        tl_visit_id,
        user_id,
        market_id,
        client_id,
        snapshot_date,
        status,
        started_at,
        finished_at,
        end_reason_en,
        end_reason_ar,
        end_visit_photo,
        source_table,
        jp_state
      `;

      try {
        let query = supabase
          .from("all_visits_combined")
          .select(selectCols)
          .eq("client_id", clientId)
          .in("user_id", selectedUser ? [selectedUser] : [])
          .in("market_id", selectedBranches)
          .not("status", "is", null);

        // [!!!] تعديل: البحث بـ started_at كما طلبت
        if (gFilters.from) {
          const { fromISO } = toKsaDayRange(gFilters.from);
          query = query.gte("started_at", fromISO);
        }
        if (gFilters.to) {
          // نستخدم toKsaDayRange للحصول على نهاية اليوم (بداية اليوم التالي)
          const { toISO } = toKsaDayRange(gFilters.to); 
          query = query.lt("started_at", toISO);
        }

        const { data } = await query.returns<AllVisitsCombinedRow[]>().order("started_at", { ascending: false });

        const rows = data ?? [];

        const byKey = new Map<string, AllVisitsCombinedRow>();

        const score = (x: AllVisitsCombinedRow) => {
          const statusBoost = x.status === "finished" || x.status === "ended" ? 2 : 1;
          const f = x.finished_at ? Date.parse(x.finished_at) : 0;
          const s = x.started_at ? Date.parse(x.started_at) : 0;
          return statusBoost * 1_000_000_000_000 + Math.max(f, s);
        };

        for (const r of rows) {
          const source = r.source_table ?? (r.tl_visit_id ? "TLVisits" : "Visits");
          const day = (r.snapshot_date || "").slice(0, 10);
          const key = `${source}|${r.user_id}|${r.market_id}|${day}`;
          const prev = byKey.get(key);
          if (!prev) {
            byKey.set(key, r);
          } else if (score(r) > score(prev)) {
            byKey.set(key, r);
          }
        }

        const deduped = Array.from(byKey.values());

        const collected: SnapshotRow[] = deduped.map((item) => {
  const originalId = (item.id as UUID | null) ?? null;          // ← ده دائمًا visit_id من الـ view
  const tlId       = (item.tl_visit_id as UUID | null) ?? null; // ← TL visit لو موجود

  return {
    ...item,
    // خليه ثابت = visit_id علشان كل الاختيارات تعتمد عليه
    id: originalId as UUID,
    original_visit_id: originalId,  // ← لا تخليه null حتى لو المصدر TLVisits
    tl_visit_id: tlId,              // ← TL ID لو موجود
    coordinator_visit_id: null,
    jp_state: item.jp_state,
  };
});

        const incomplete = collected.filter((s) => s.status !== "finished" && s.status !== "ended").length;

        setIncompleteCount(incomplete);
        setSnapshots(collected);
      } catch (e) {
        const err = e as PostgrestError;
        console.error("Error fetching from all_visits_combined:", {
          message: err.message,
          details: err.details,
          hint: err.hint,
          code: err.code,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [clientId, gFilters.from, gFilters.to, selectedUser, selectedBranches]);

 // الاختيار الحالي + اليوم
  const activeSelection = useMemo(() => {
    if (selectedSnapshotIds.length === 0) return { s: null as SnapshotRow | null };
    const sid = selectedSnapshotIds[0];
    const s = snapshots.find((x) => x.id + "__" + x.snapshot_date === sid) || null;
    return { s };
  }, [selectedSnapshotIds, snapshots]);

  // [جديد] احصل على حالة الزيارة من السناب شوت المختار
  const activeJpState: string | null = useMemo(() => {
    // نستخدم jp_state أولاً، وإذا لم يوجد، نستخدم status
    return activeSelection.s?.jp_state ?? activeSelection.s?.status ?? null;
  }, [activeSelection.s]);
  // [!!!] ⬇️⬇️ الكود الجديد المضاف ⬇️⬇️
  // [!!!] منطق جديد: جلب الـ IDs مباشرة من الـ Snapshot المختار
 useEffect(() => {
  const s = activeSelection.s;
  if (!s) { setVisitIdsPair({ original: [], tl: [] }); return; }

  const originals = s.original_visit_id ? [s.original_visit_id] : [];
  const tls = s.tl_visit_id ? [s.tl_visit_id] : [];

  // لو عندنا original خلاص
  if (originals.length) {
    setVisitIdsPair({ original: originals, tl: tls });
    return;
  }

  // 🔁 Fallback: هات visit_id من Visits لنفس (اليوم + الفرع) ولـ "المستخدم المختار"
  (async () => {
  const day = (s.snapshot_date || "").slice(0, 10);
  if (!day) {
    setVisitIdsPair({ original: [], tl: tls });
    return;
  }

  const { fromISO, toISO } = toKsaDayRange(day);
  const authId = users.find(u => u.id === selectedUser)?.auth_user_id || null;

  // 🔹 فلترة صارمة: نفس الفرع + نفس المستخدم + نفس اليوم
  let query = supabase
    .from("all_visits_combined")
    .select("id:visit_id")
    .eq("market_id", s.market_id)
    .eq("source_table", "Visits")
    .gte("started_at", fromISO)
    .lt("started_at", toISO);

  // فلترة المستخدم حسب id أو auth_user_id
  if (authId) {
    query = query.or(`user_id.eq.${selectedUser},user_id.eq.${authId}`);
  } else {
    query = query.eq("user_id", selectedUser);
  }

  const { data, error } = await query
    .order("started_at", { ascending: false })
    .limit(1);

  const vid = (data?.[0]?.id as string) || "";
  setVisitIdsPair({ original: vid ? [vid] : [], tl: tls });

  if (!vid && error) {
    console.warn("[fallback visit_id from Visits] error:", error);
  }
})();

}, [activeSelection.s, selectedUser, users]);


  // ✅ استبدله بهذا السطر

// [!!!] هذا هو الإصلاح النهائي
 const activeDate: string | null = useMemo(() => {
  const s = activeSelection.s;
  
  // المصدر الأساسي للتاريخ هو 'started_at' (الذي تضغط عليه)
  // إذا لم يوجد، نستخدم 'snapshot_date' كحل احتياطي
  const dateSource = s?.started_at ?? s?.snapshot_date ?? null;
  
  if (!dateSource) {
   return null;
  }
  
  try {
   // s.started_at هو تايمستامب كامل: "2025-10-15T14:19:05+00:00"
   // نحتاج فقط لجزء التاريخ "2025-10-15"
   // .substring(0, 10) هي الطريقة الأضمن لقطع التاريخ (YYYY-MM-DD)
   return dateSource.substring(0, 10);
  } catch (e) {
   console.error("Error parsing activeDate:", e);
   return null; // إرجاع null في حالة حدوث خطأ
  }
 }, [activeSelection.s]);
const visitIdsForStep = useMemo(() => {
  const role = selectedUserRole;
  const ids = role === "team_leader" ? visitIdsPair.tl : visitIdsPair.original;

  // 🔹 خليك دايمًا تختار زيارة واحدة بس (من نفس snapshot المختار)
  // لأن كل snapshot هو combo واحد من visit_id + date
  return ids.length > 0 ? [ids[0]] : [];
}, [selectedUserRole, visitIdsPair]);


 const [disabledSteps, setDisabledSteps] = useState<Set<StepKey>>(new Set());
const normKey = (s: string) => (s || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); 
// يشيل أي شيء غير حروف/أرقام (مسافات، أندرسكور، شرطات...)

useEffect(() => {
  let alive = true;
  (async () => {
    if (!clientId) {
      if (alive) setDisabledSteps(new Set());
      return;
    }

    type CFRow = { feature_key: string; is_enabled: boolean | null };
    const { data, error } = await supabase
      .from("ClientFeatures")
      .select("feature_key, is_enabled")
      .eq("client_id", clientId);

    if (!alive) return;

    if (error) {
      console.warn("[ClientFeatures] fetch error:", error);
      setDisabledSteps(new Set());
      return;
    }

    // ابني خريطة المزايا بعد التطبيع
    const enabledMap = new Map<string, boolean>();
    for (const r of (data ?? []) as CFRow[]) {
      enabledMap.set(normKey(r.feature_key), !!r.is_enabled);
    }

    // اعتبر الميزة ON لو مفيش صف لها (افتراضيًا مفعّلة)
    const isFeatureOn = (key: string) => {
      const k = normKey(key);
      return enabledMap.has(k) ? enabledMap.get(k) === true : true;
    };

    // ابنِ مجموعة الخطوات المعطّلة
    const disabled = new Set<StepKey>();
    for (const [featureKey, steps] of Object.entries(FEATURE_TO_STEPS)) {
      if (!isFeatureOn(featureKey)) {
        steps.forEach((s) => disabled.add(s));
      }
    }

    // لا تلمس الخطوات الدائمة
    ALWAYS_ON_STEPS.forEach((s) => disabled.delete(s));

    setDisabledSteps(disabled);
    console.debug("[ClientFeatures] disabledSteps:", disabled);
  })();

  return () => { alive = false; };
}, [clientId]);


  // ⬇️ ضع هذا بدل الكود الحالي (الذي فيه .eq("id", userId))
// ⬇️ هذا هو الـ useEffect الذي يجب إصلاحه
useEffect(() => {
  let alive = true;
  (async () => {
    if (!selectedUser) return; // مهم: تجنّب الاستعلام لو مفيش مستخدم مختار
    
    // 🔽 تأكد أن جملة select تطلب الأعمدة الموجودة فعلاً
    const { data, error } = await supabase
      .from("Users")
      .select("name, arabic_name, username") // ⬅️ استخدم هذه الأعمدة
      .eq("id", selectedUser) // ⬅️ بدل userId بـ selectedUser
      .maybeSingle();

    if (!alive) return;
    if (error) {
      console.warn("[Users fetch]", error);
      return;
    }
    // TODO: استخدم البيانات زي ما تحب (مثلاً setState لعرض الاسم)
    console.debug("[Users fetch] selectedUser name:", data);
  })();
  return () => {
    alive = false;
  };
}, [selectedUser]); // ⬅️ هذا الـ hook الذي يعتمد على [selectedUser]


  const isStepDisabledByFeatures = useCallback(
  (step: StepKey) => {
    if (ALWAYS_ON_STEPS.includes(step)) return false;
    return disabledSteps.has(step);
  },
  [disabledSteps]
);

useEffect(() => {
  // لو مفيش مستخدم أو الدور لسه unknown؛ متعملش حاجة علشان تمنع الوميض
  if (!selectedUser || selectedUserRole === "unknown") return;

  // 1) خطوات الدور فقط
  const roleStepsRaw = ROLE_STEPS[selectedUserRole] ?? [];

  // 2) فلترة حسب ClientFeatures
  const finalKeys = roleStepsRaw.filter((k) => !isStepDisabledByFeatures(k));

  // 3) حدّث القائمة
  setAvailableSteps(finalKeys);

  // 4) حدّث currentStep بدون الاعتماد على قيمته الحالية خارجياً (functional update)
  setCurrentStep(prev => {
    if (finalKeys.length === 0) return prev;                     // لو مافيش خطوات، سيب القديم
    return finalKeys.includes(prev) ? prev : finalKeys[0];       // لو القديم مش موجود، اختار أول واحدة
  });
}, [selectedUser, selectedUserRole, isStepDisabledByFeatures]);

  const t = useMemo(
    () => ({
      back: ar ? "رجوع" : "Back",
      inventoryReports: ar ? "تقارير الجرد" : "Inventory Reports",
      tls: ar ? "قادة الفريق" : "Team Leaders",
      users: ar ? "المستخدمون" : "Users",
      chains: ar ? "الأسواق" : "Chains",
      branches: ar ? "الفروع" : "Branches",
      dates: ar ? "التواريخ" : "Dates",
      steps: ar ? "خطوات الزيارة" : "Visit Steps",
      pickTL: ar ? "اختر قائد فريق أو كل الفريق أولاً" : "Select a Team Leader or All Team first",
      pickUser: ar ? "اختر مستخدمًا أولاً" : "Pick users first",
      noMarkets: ar ? "لا توجد أسواق" : "No markets",
      pickChain: ar ? "اختر سلسلة" : "Pick a chain",
      pickBranch: ar ? "اختر فرعًا" : "Pick a branch",
      noDates: ar ? "لا توجد تواريخ" : "No dates",
      completed: ar ? "مكتملة" : "Completed",
      pending: ar ? "معلقة" : "Pending",
      pickDate: ar ? "اختر تاريخًا واحدًا" : "Pick a single date",
      ended: ar ? "تم إنهاؤها" : "Ended",
      showEndReason: ar ? "عرض سبب الإنهاء" : "Show End Reason",
      close: ar ? "إغلاق" : "Close",
      region: ar ? "المنطقة" : "Region",
      city: ar ? "المدينة" : "City",
      market: ar ? "السوق" : "Market",
      allRegions: ar ? "كل المناطق" : "All regions",
      allCities: ar ? "كل المدن" : "All cities",
      allMarkets: ar ? "كل الأسواق" : "All markets",
    }),
    [ar]
  );

  const visibleTLs = useMemo(() => (permTLs ? tls.filter((tl) => permTLs.has(tl.id)) : tls), [tls, permTLs]);

  const tlSelectDisabled = tlDisabled || lockedTL || visibleTLs.length === 0;

  const { completedCount, pendingCount, visibleSnapshots } = useMemo(() => {
const completed = snapshots.filter((s) => s.status === "finished");
const ended = snapshots.filter((s) => s.status === "ended");
const visible = [...completed, ...ended].sort(
(a, b) => (b.started_at ? +new Date(b.started_at) : 0) - (a.started_at ? +new Date(a.started_at) : 0)
);
    
    // [!!!] هذا هو الإصلاح
const pending = incompleteCount; // ⬅️ تم التعديل هنا
    
return { completedCount: completed.length, pendingCount: pending, visibleSnapshots: visible };
}, [snapshots, incompleteCount]);
  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: 16, color: "var(--text)" }}>
      {loading && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(2px)",
          }}
        >
          <div
            style={{
              padding: 18,
              borderRadius: 14,
              border: "1px solid var(--accent)",
              background: "color-mix(in oklab, var(--card) 85%, rgba(0,0,0,.2))",
              boxShadow: "0 8px 30px rgba(0,0,0,.35)",
              color: "#222",
              fontWeight: 800,
            }}
          >
            <div
              className="spin"
              style={{
                width: 36,
                height: 36,
                margin: "0 auto 8px",
                borderRadius: "50%",
                border: "4px solid #d4af37",
                borderTopColor: "transparent",
                animation: "rt 0.9s linear infinite",
              }}
            />
            <div style={{ textAlign: "center", color: "var(--text)" }}>{ar ? "جاري التحميل..." : "Loading..."}</div>
          </div>
        </div>
      )}

      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          marginBottom: 16,
          padding: 10,
          borderRadius: 16,
          border: cardBorder,
          background: "color-mix(in oklab, var(--card) 82%, transparent)",
        }}
      >
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }}>
          <Capsule label={ar ? "من" : "From"}>
            <DateField label="" value={gFilters.from ?? ""} onChange={(v) => updateFilter("from", v)} locale={ar ? "ar-EG" : "en-GB"} />
          </Capsule>

          <Capsule label={ar ? "إلى" : "To"}>
            <DateField label="" value={gFilters.to ?? ""} onChange={(v) => updateFilter("to", v)} locale={ar ? "ar-EG" : "en-GB"} />
          </Capsule>

          <Capsule label={t.region} summary={filters.region || (ar ? "الكل" : "All")}>
            <SelectSingle
              options={regionsOpts}
              value={filters.region}
              placeholder={t.allRegions}
              onChange={(v) => {
                if (lockedRegion) return;
                setFilters((s) => ({ ...s, region: v, city: "", market: "" }));
              }}
              disabled={lockedRegion}
            />
          </Capsule>

          <Capsule label={t.city} summary={filters.city || (ar ? "الكل" : "All")}>
            <SelectSingle
              options={citiesOpts}
              value={filters.city}
              placeholder={t.allCities}
              onChange={(v) => {
                if (lockedCity) return;
                setFilters((s) => ({ ...s, city: v, market: "" }));
              }}
              disabled={lockedCity}
            />
          </Capsule>

          <Capsule label={t.market} summary={filters.market || (ar ? "الكل" : "All")}>
            <SelectSingle
              options={marketsOpts}
              value={filters.market}
              placeholder={t.allMarkets}
              onChange={(v) => {
                if (lockedStore) return;
                setFilters((s) => ({ ...s, market: v }));
              }}
              disabled={lockedStore}
            />
          </Capsule>

          <Capsule label={t.tls} summary={tlSelectDisabled ? (ar ? "غير متاح" : "N/A") : undefined}>
            <SelectObject
              options={[
                ...(lockedTL || tlDisabled ? [] : [{ value: "ALL", label: ar ? "كل الفريق" : "All Team" }]),
                ...visibleTLs.map((u) => ({
                  value: u.id,
                  label: (ar ? u.arabic_name : u.name) || "—",
                })),
              ]}
              value={lockedTL && userSettings?.Team_leader?.[0] ? userSettings.Team_leader[0] : gFilters.team_leader_id || (tlDisabled ? "" : "ALL")}
              onChange={(v) => {
                if (lockedTL) return;
                updateFilter("team_leader_id", v || (tlDisabled ? "" : "ALL"));
              }}
              placeholder={ar ? "اختر قائد فريق" : "Select a TL"}
              disabled={tlSelectDisabled}
            />
          </Capsule>
        </div>
      </div>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title={t.users} right={<PillCount n={users.length} />}>
            {users.length === 0 ? (
              <EmptyBox text={t.pickTL} />
            ) : (
              <>
                <div style={{ marginBottom: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => setShowTLsInUsers((v) => !v)}
                    style={btnSm(showTLsInUsers)}
                    title={ar ? "إظهار/إخفاء قادة الفريق في القائمة" : "Toggle showing TLs in list"}
                  >
                    {showTLsInUsers ? (ar ? "إخفاء القادة" : "Hide TLs") : ar ? "إظهار القادة" : "Show TLs"}
                  </button>
                </div>

                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
                  {users.map((u) => (
                    <button key={u.id} type="button" onClick={() => setSelectedUser(u.id)} style={btn(64, selectedUser === u.id)}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, textAlign: ar ? "right" : "left" }}>
                        <span style={{ fontWeight: 700 }}>{(ar ? u.arabic_name : u.name) || u.username || "—"}</span>
                        <span style={{ opacity: 0.7, fontSize: 12 }}>{roleLabel(u.role, ar)}</span>
                      </div>
                      <span style={{ opacity: 0.6 }}>{selectedUser === u.id ? "●" : "○"}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </Panel>

          <Panel title={t.chains} right={<PillCount n={chains.length} />}>
            {!selectedUser ? (
              <EmptyBox text={t.pickUser} />
            ) : chains.length === 0 ? (
              <EmptyBox text={t.noMarkets} />
            ) : (
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
                {chains.map((name) => {
                  const sel = selectedChains.includes(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setSelectedChains((prev) => (prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]))}
                      style={btn(48, sel)}
                    >
                      <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</strong>
                      <span style={{ opacity: 0.6 }}>{sel ? "✓" : "＋"}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </Panel>

          <Panel title={t.branches} right={<PillCount n={branches.length} />}>
            {!selectedUser ? (
              <EmptyBox text={t.pickUser} />
            ) : branches.length === 0 ? (
              <EmptyBox text={t.pickChain} />
            ) : (
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
                {branches.map((b) => {
                  const sel = selectedBranches.includes(b.id);
                  return (
                    <button key={b.id} type="button" onClick={() => setSelectedBranches((prev) => (prev.includes(b.id) ? prev.filter((x) => x !== b.id) : [...prev, b.id]))} style={btn(48, sel)}>
                      <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.label}</strong>
                      <span style={{ opacity: 0.6 }}>{sel ? "✓" : "＋"}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </Panel>

          <Panel title={`${t.dates} — ${t.completed}: ${completedCount} | ${t.pending}: ${pendingCount}`} right={<PillCount n={visibleSnapshots.length} />}>
            {!selectedUser ? (
              <EmptyBox text={t.pickUser} />
            ) : selectedBranches.length === 0 ? (
              <EmptyBox text={t.pickChain} />
            ) : visibleSnapshots.length === 0 ? (
              <EmptyBox text={t.noDates} />
            ) : (
              <>
                <div style={{ marginBottom: 8, fontSize: 12, opacity: 0.8 }}>{t.pickDate}</div>
                <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
                  {visibleSnapshots.map((s) => {
                    const key = s.id + "__" + s.snapshot_date;
                    const sel = selectedSnapshotIds.includes(key);

                    const visitTimestamp = s.started_at || s.finished_at;
                    const started = visitTimestamp ? new Date(visitTimestamp).toLocaleString(ar ? "ar-EG" : "en-GB", { timeZone: "Asia/Riyadh" }) : "—";

                    if (s.status === "finished") {
                      return (
                        <button key={key} type="button" onClick={() => setSelectedSnapshotIds([key])} style={btn(56, sel)}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4, textAlign: ar ? "right" : "left" }}>
                            <strong>{started}</strong>
                            <span style={{ opacity: 0.75, fontSize: 12 }}>{ar ? "مكتملة" : "Finished"}</span>
                          </div>
                          <span style={{ opacity: 0.6 }}>{sel ? "✓" : "＋"}</span>
                        </button>
                      );
                    }

                    if (s.status === "ended") {
                      return (
                        <div
                          key={key}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 12,
                            border: "1px solid var(--input-border)",
                            background: "var(--input-bg)",
                            textAlign: ar ? "right" : "left",
                          }}
                        >
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <strong>{started}</strong>
                            <span style={{ opacity: 0.85, fontSize: 12, color: "#f87171", fontWeight: "bold" }}>{t.ended}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              let photoUrl = s.end_visit_photo || "";
                              try {
                                const photos = JSON.parse(photoUrl);
                                if (Array.isArray(photos) && photos.length > 0) photoUrl = photos[0];
                              } catch {}
                              setEndReasonViewer({
                                open: true,
                                reasonEn: s.end_reason_en || "",
                                reasonAr: s.end_reason_ar || "",
                                photo: photoUrl,
                              });
                            }}
                            style={{ ...btnSm(false), width: "100%" }}
                          >
                            {t.showEndReason}
                          </button>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              </>
            )}
          </Panel>

          <Panel title={t.steps}>
            {selectedSnapshotIds.length === 0 ? (
              <div
                style={{
                  border: "1px solid var(--divider)",
                  borderRadius: 12,
                  padding: 16,
                  background: "var(--input-bg)",
                  textAlign: "center",
                }}
              >
                {t.pickDate}
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <StepsToolbar value={currentStep} onChange={setCurrentStep} onlyKeys={availableSteps} />
                </div>

                <StepDataTable
  step={currentStep}
  visitIds={visitIdsForStep}
  startDate={activeDate}
  endDate={activeDate}
  userId={selectedUser}       // ✅ أضفها
  users={users}
  jpState={activeJpState}
/>

              </>
            )}
          </Panel>

          {endReasonViewer.open && (
            <div
              onClick={() => setEndReasonViewer({ open: false, reasonEn: "", reasonAr: "", photo: "" })}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 10000,
                background: "rgba(0,0,0,0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "relative",
                  maxWidth: 400,
                  width: "100%",
                  background: "var(--card)",
                  borderRadius: 16,
                  padding: 24,
                  border: "1px solid var(--divider)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                <h3 style={{ margin: 0 }}>{ar ? "سبب إنهاء الزيارة" : "Visit End Reason"}</h3>
                <p style={{ margin: 0, background: "var(--input-bg)", padding: 12, borderRadius: 8 }}>
                  {(ar ? endReasonViewer.reasonAr : endReasonViewer.reasonEn) || (ar ? "لا يوجد سبب مسجل." : "No reason recorded.")}
                </p>
                {endReasonViewer.photo && (
                  <div>
                    <h4 style={{ margin: "0 0 8px 0" }}>{ar ? "الصورة المرفقة" : "Attached Photo"}</h4>
                    <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", borderRadius: 8, overflow: "hidden" }}>
                      <SupaImg src={endReasonViewer.photo} alt="End visit photo" unoptimized fill style={{ objectFit: "cover" }} />
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setEndReasonViewer({ open: false, reasonEn: "", reasonAr: "", photo: "" })}
                  style={{ ...btnSm(true), alignSelf: "flex-end", minWidth: 100 }}
                >
                  {t.close}
                </button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: ar ? "flex-end" : "flex-start", gap: 12, gridColumn: "1 / -1" }}>
            <Link
              href="/admin/inventory"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                borderRadius: 12,
                border: "1px solid var(--accent)",
                background: "var(--accent)",
                color: "var(--accent-foreground)",
                textDecoration: "none",
                fontWeight: 800,
              }}
            >
              {t.inventoryReports}
            </Link>

            <Link
              href="/admin/dashboard"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                borderRadius: 12,
                border: "1px solid var(--divider)",
                background: "var(--card)",
                color: "var(--text)",
                textDecoration: "none",
                fontWeight: 800,
              }}
            >
              {t.back}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// [!!!] تم إصلاح الخطأ هنا
function btn(h?: number, selected = false): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    width: "100%",
    height: h || 44,
    padding: "10px 12px",
    borderRadius: 12,
    border: selected ? "1px solid var(--accent)" : "1px solid var(--input-border)",
    background: selected ? "color-mix(in oklab, var(--accent) 10%, var(--input-bg))" : "var(--input-bg)",
    color: "var(--text)",
    cursor: "pointer",
    boxShadow: selected ? "0 0 0 2px color-mix(in oklab, var(--accent) 25%, transparent)" : "none",
    fontWeight: 700,
    transition: "all 0.15s ease",
  };
} 

// [!!!] وتم إصلاح الخطأ هنا
function btnSm(selected = false): React.CSSProperties {
  return {
    padding: "6px 10px",
    borderRadius: 10,
    border: selected ? "1px solid var(--accent)" : "1px solid var(--divider)",
    background: selected ? "color-mix(in oklab, var(--accent) 16%, var(--card))" : "var(--card)",
    color: "var(--text)",
    cursor: "pointer",
    fontWeight: 800,
    transition: "all 0.15s ease",
  };
}