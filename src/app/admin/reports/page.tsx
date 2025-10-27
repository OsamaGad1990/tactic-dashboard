"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { useLangTheme } from "@/hooks/useLangTheme";
import StepsToolbar from "@/app/admin/visit-steps/StepsToolbar";
import StepDataTable from "@/app/admin/visit-steps/StepDataTable";
import { VISIT_STEPS, StepKey } from "@/utils/visitStepsMap";
import SupaImg from "@/components/SupaImg";
import { useAdminCascadingFilters } from "@/hooks/useAdminCascadingFilters";

/* ========= Supabase ========= */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

/* ========= Types ========= */
type UUID = string;

type AllVisitsCombinedRow = {
  id: UUID | null;                 // aliased: visit_id
  original_visit_id: UUID | null;  // aliased: visit_id
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
};

type UserRow = {
  id: UUID;
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
  started_at: string | null;
  finished_at: string | null;
  end_reason_en: string | null;
  end_reason_ar: string | null;
  end_visit_photo: string | null;
};

type UserIdRow = { id: UUID };
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
const isTLRole = (role?: string | null) =>
  (role || "").toLowerCase().includes("team_leader") ||
  (role || "").toLowerCase().includes("team leader");

const roleLabel = (role: string | null, ar: boolean) => {
  const r = (role || "").toLowerCase();
  if (r === "mch") return ar ? "منسق" : "Merchandiser";
  if (r === "promoter" || r === "promoplus") return ar ? "مروج" : "Promoter";
  if (r.includes("team_leader")) return ar ? "قائد فريق" : "Team Leader";
  return role || "—";
};

const cardBorder = "1px solid var(--divider)";

/* ========= Reusable UI ========= */
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
function Panel({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
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

/* ============ Filters / Capsules ============ */
function Capsule({
  label,
  summary,
  children,
}: {
  label: string;
  summary?: string;
  children: React.ReactNode;
}) {
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

type Option = { value: string; label: string };

/* === Object select (TL) === */
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
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid var(--input-border)",
        background: "var(--card)",
        overflow: "hidden",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.currentTarget.value)}
        disabled={disabled}
        style={{
          width: "100%",
          height: 24,
          padding: isArabic ? "0 34px 0 6px" : "0 6px 0 34px",
          border: "none",
          outline: "none",
          background: "transparent",
          color: "var(--text)",
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
          fontWeight: 700,
        }}
      >
        <option value="">{placeholder || ""}</option>
        {options.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          [isArabic ? "left" : "right"]: 10,
          display: "flex",
          alignItems: "center",
          pointerEvents: "none",
          opacity: 0.8,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
}

/* === Single select (Region/City/Market) — أضفت disabled === */
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
  const { isArabic } = useLangTheme();

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid var(--input-border)",
        background: "var(--card)",
        overflow: "hidden",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.currentTarget.value)}
        disabled={disabled}
        style={{
          width: "100%",
          height: 24,
          padding: isArabic ? "0 34px 0 6px" : "0 6px 0 34px",
          border: "none",
          outline: "none",
          background: "transparent",
          color: "var(--text)",
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
          fontWeight: 700,
        }}
      >
        <option value="">{placeholder || ""}</option>
        {options.map((op) => (
          <option key={op} value={op}>
            {op}
          </option>
        ))}
      </select>

      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          [isArabic ? "left" : "right"]: 10,
          display: "flex",
          alignItems: "center",
          pointerEvents: "none",
          opacity: 0.8,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
  locale = "en-GB",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  locale?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const pretty = useMemo(() => {
    if (!value) return "—";
    const d = new Date(value + "T00:00:00");
    if (Number.isNaN(+d)) return value;
    return d.toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" });
  }, [value, locale]);

  const openPicker = () => {
    const el = inputRef.current;
    if (!el) return;
    if ("showPicker" in el && typeof (el as HTMLInputElement & { showPicker?: () => void }).showPicker === "function") {
      (el as HTMLInputElement & { showPicker: () => void }).showPicker();
    } else {
      el.click();
      el.focus();
    }
  };

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ fontSize: 12, color: "var(--muted, #aaa)" }}>{label}</div>

      <div
        role="button"
        onClick={openPicker}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " " ? openPicker() : null)}
        tabIndex={0}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          padding: "10px 12px",
          borderRadius: 12,
          border: "1px solid var(--input-border)",
          background: "var(--card)",
          cursor: "pointer",
          userSelect: "none",
        }}
        className="datefield"
      >
        <span style={{ fontWeight: 700 }}>{pretty}</span>
        <span aria-hidden>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ display: "block" }}>
            <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M16 3v4M8 3v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
      </div>

      <input
        ref={inputRef}
        type="date"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0 }}
      />
    </div>
  );
}

/* ========= Page ========= */
export default function Page() {
  const { isArabic: ar } = useLangTheme();
  const [loading, setLoading] = useState(false);

  /* ===== user_settings masks ===== */
  const [userSettings, setUserSettings] = useState<
    Pick<UserSettingsRow, "default_region" | "default_city" | "allowed_markets" | "Team_leader"> | null
  >(null);

  useEffect(() => {
    (async () => {
      const { data: authRes } = await supabase.auth.getUser();
      const authId = authRes?.user?.id || null;
      if (!authId) return;

      const { data: u } = await supabase
        .from<UserIdRow>("Users")
        .select("id")
        .eq("auth_user_id", authId)
        .maybeSingle();

      if (!u) return;

      const { data: st } = await supabase
        .from<UserSettingsRow>("user_settings")
        .select("default_region, default_city, allowed_markets, Team_leader")
        .eq("user_id", u.id)
        .maybeSingle();

      if (st) {
        setUserSettings({
          default_region: st.default_region,
          default_city: st.default_city,
          allowed_markets: st.allowed_markets,
          Team_leader: st.Team_leader,
        });
        // ثبّت القيم المقفولة مباشرة
        setFilters((prev) => ({
          ...prev,
          region: st.default_region?.[0] ?? prev.region,
          city: st.default_city?.[0] ?? prev.city,
          market: st.allowed_markets?.[0] ?? prev.market,
        }));
      }
    })();
  }, []);

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

  // فلاتر (Single-select) مثل الداشبورد
  const [filters, setFilters] = useState({
    region: "" as string,
    city: "" as string,
    market: "" as string, // store/chain
  });

  // الهُوك الموحد (from/to/TL)
  const {
    clientId,
    tls,
    tlDisabled,
    filters: gFilters,     // { from, to, team_leader_id }
    updateFilter,          // setter لتحديث from/to/team_leader_id
  } = useAdminCascadingFilters();

  // أقفال TL من user_settings
  const permTLs = useMemo<Set<UUID> | null>(() => {
    const arr = userSettings?.Team_leader?.filter(Boolean) ?? [];
    return arr.length ? new Set(arr) : null;
  }, [userSettings?.Team_leader]);
  const lockedTL = !!permTLs?.size;

  // طبّق قفل TL على قيمة الفلتر
  useEffect(() => {
    if (lockedTL && userSettings?.Team_leader?.[0]) {
      updateFilter("team_leader_id", userSettings.Team_leader[0]); // إجبار القيمة
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockedTL, userSettings?.Team_leader?.[0]]);

  // users/markets
  const [users, setUsers] = useState<UserRow[]>([]);
  const [markets, setMarkets] = useState<MarketRow[]>([]);

  // options (تُعاد حسابها ديناميكيًا حسب الفلاتر + الماسكات)
  const [regionsOpts, setRegionsOpts] = useState<string[]>([]);
  const [citiesOpts, setCitiesOpts] = useState<string[]>([]);
  const [marketsOpts, setMarketsOpts] = useState<string[]>([]);

  // selections
  const [selectedUsers, setSelectedUsers] = useState<UUID[]>([]);
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<UUID[]>([]);
  const [snapshots, setSnapshots] = useState<SnapshotRow[]>([]);
  const [selectedSnapshotIds, setSelectedSnapshotIds] = useState<UUID[]>([]);
  const [incompleteCount, setIncompleteCount] = useState(0);

  const FIRST_STEP: StepKey = useMemo(() => Object.keys(VISIT_STEPS)[0] as StepKey, []);
  const [currentStep, setCurrentStep] = useState<StepKey>(FIRST_STEP);
  const [availableSteps, setAvailableSteps] = useState<StepKey[]>([]);
  const [endReasonViewer, setEndReasonViewer] = useState({ open: false, reasonEn: "", reasonAr: "", photo: "" });

  /* ====== Users (multi-select) ====== */
  useEffect(() => {
    setMarkets([]);
    setSelectedChains([]);
    setSelectedBranches([]);
    setSnapshots([]);
    setSelectedSnapshotIds([]);

    if (!clientId || !gFilters.team_leader_id) return;

    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("client_users")
        .select("user_id, Users!inner(id, name, username, arabic_name, role, team_leader_id)")
        .eq("client_id", clientId)
        .eq("is_active", true);

      const rows = (data ?? []) as unknown as Array<{ user_id: UUID; Users: UserRow }>;
      let list = rows.map((r) => r.Users).filter((u) => !isAdminRole(u.role) && !isTLRole(u.role));

      if (gFilters.team_leader_id !== "ALL") {
        list = list.filter((u) => u.team_leader_id === gFilters.team_leader_id);
      }

      list.sort((a, b) => (a.username || "").localeCompare(b.username || "", "ar"));
      setUsers(list);

      setSelectedUsers((prev) => {
        const allowed = new Set(list.map((u) => u.id));
        return prev.filter((id) => allowed.has(id));
      });
      setLoading(false);
    })();
  }, [clientId, gFilters.team_leader_id]);

  /* ====== Markets for selectedUsers ====== */
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

    if (selectedUsers.length === 0 || !clientId) return;

    const isUUID = (x: unknown): x is string => typeof x === "string" && x.length > 0;

    (async () => {
      setLoading(true);
      const vmRes = await supabase
        .from("Visits")
        .select("market_id, user_id")
        .eq("client_id", clientId)
        .in("user_id", selectedUsers)
        .not("market_id", "is", null);

      let marketIds = Array.from(new Set((vmRes.data ?? []).map((r) => r.market_id as unknown).filter(isUUID)));

      const snapMarketsRes = await supabase
        .from("DailyVisitSnapshots")
        .select("market_id")
        .eq("client_id", clientId)
        .in("user_id", selectedUsers)
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

      const { data } = await supabase.from("Markets").select("id, region, city, store, branch").in("id", marketIds);
      const rows = (data ?? []) as MarketsSelect[];

      const ms: MarketRow[] = rows.map((r) => ({
        id: String(r.id),
        name: r.branch?.trim() || r.store?.trim() || "—",
        region: r.region,
        city: r.city,
        store: r.store,
        branches: r.branch,
      }));

      setMarkets(ms);
      setLoading(false);
    })();
  }, [selectedUsers, clientId]);

  /* ====== marketPasses + إعادة حساب الخيارات ====== */
  const marketPasses = useMemo(
    () => (m: MarketRow, omitKey?: "region" | "city" | "market") => {
      // ماسكات الصلاحيات
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

  // إعادة حساب القوائم المنسدلة + تنظيف الاختيارات غير الصالحة (مع احترام الأقفال)
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

    // قيّد القوائم بالمسموح لو فيه قفل
    const lockList = <T,>(src: T[], allowed: Set<T> | null) => (allowed ? src.filter((x) => allowed.has(x)) : src);

    const rArr = lockList(Array.from(nextRegions).sort((a, b) => a.localeCompare(b, "ar")), permRegions);
    const cArr = lockList(Array.from(nextCities).sort((a, b) => a.localeCompare(b, "ar")), permCities);
    const sArr = lockList(Array.from(nextStores).sort((a, b) => a.localeCompare(b, "ar")), permStores);

    setRegionsOpts(rArr);
    setCitiesOpts(cArr);
    setMarketsOpts(sArr);

    setFilters((prev) => {
      const next = { ...prev };
      if (next.region && !rArr.includes(next.region)) next.region = lockedRegion ? userSettings?.default_region?.[0] ?? "" : "";
      if (next.city && !cArr.includes(next.city)) next.city = lockedCity ? userSettings?.default_city?.[0] ?? "" : "";
      if (next.market && !sArr.includes(next.market)) next.market = lockedStore ? userSettings?.allowed_markets?.[0] ?? "" : "";
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markets, marketPasses, lockedRegion, lockedCity, lockedStore]);

  /* ====== فلترة الأسواق وفق الاختيارات ====== */
  const filteredMarkets = useMemo(() => {
    return markets.filter((m) => marketPasses(m));
  }, [markets, marketPasses]);

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

  // اربط فلاتر Region/City/Market بالاختيارات الفعلية تلقائيًا (وتوليد الفروع)
  useEffect(() => {
    const chain = filters.market?.trim() || "";
    setSelectedChains(chain ? [chain] : []);

    const base = chain
      ? filteredMarkets.filter((m) => ( (m.store || m.name || "").trim() === chain))
      : filteredMarkets;

    const nextBranchIds = base.map((m) => m.id);
    setSelectedBranches(nextBranchIds);

    // تنظيف النتائج السابقة
    setSnapshots([]);
    setSelectedSnapshotIds([]);
    setIncompleteCount(0);
  }, [filters.region, filters.city, filters.market, filteredMarkets]);

  /* ====== Snapshots via all_visits_combined ====== */
  useEffect(() => {
    setSnapshots([]);
    setSelectedSnapshotIds([]);
    setIncompleteCount(0);

    if (!clientId || selectedUsers.length === 0 || selectedBranches.length === 0) return;

    (async () => {
      setLoading(true);

      let query = supabase
        .from("all_visits_combined")
        .select(
          `
          id:visit_id,
          original_visit_id:visit_id,
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
          end_visit_photo
        `
        )
        .eq("client_id", clientId)
        .in("user_id", selectedUsers)
        .in("market_id", selectedBranches)
        .not("status", "is", null);

      if (gFilters.from) query = query.gte("snapshot_date", gFilters.from);
      if (gFilters.to) query = query.lte("snapshot_date", gFilters.to);

      const { data, error } = await query
        .returns<AllVisitsCombinedRow[]>()   // Typed
        .order("started_at", { ascending: false });

      if (error) {
        console.error("Error fetching from all_visits_combined:", error);
        setLoading(false);
        return;
      }

      const collected: SnapshotRow[] = (data ?? []).map((item) => ({
        ...item,
        id: (item.id ?? item.tl_visit_id) as UUID,
        original_visit_id: (item.original_visit_id ?? item.id) as UUID,
      }));

      const incomplete = collected.filter((s) => s.status !== "finished" && s.status !== "ended").length;
      setIncompleteCount(incomplete);

      setSnapshots(collected);
      setLoading(false);
    })();
  }, [clientId, gFilters.from, gFilters.to, selectedUsers, selectedBranches]);

  /* ====== visit steps availability ====== */
  const { activeVisitId, activeDate } = useMemo(() => {
    if (selectedSnapshotIds.length === 0) return { activeVisitId: null, activeDate: null };
    const sid = selectedSnapshotIds[0];
    const s = snapshots.find((x) => x.id === sid);
    if (!s) return { activeVisitId: null, activeDate: null };
    return { activeVisitId: s.original_visit_id || s.tl_visit_id || null, activeDate: s.snapshot_date };
  }, [selectedSnapshotIds, snapshots]);

  useEffect(() => {
    if (!activeVisitId) {
      setAvailableSteps([]);
      return;
    }
    let alive = true;
    (async () => {
      const checks = await Promise.all(
        (Object.keys(VISIT_STEPS) as StepKey[]).map(async (k) => {
          const cfg = VISIT_STEPS[k];
          const { count, error } = await supabase
            .from(cfg.table)
            .select("id", { count: "exact", head: true })
            .eq("visit_id", activeVisitId);
          if (error) return [k, 0] as const;
          return [k, count || 0] as const;
        })
      );
      if (!alive) return;
      const keys = checks.filter(([, c]) => c > 0).map(([k]) => k as StepKey);
      setAvailableSteps(keys);
      setCurrentStep((prev) => (keys.includes(prev) ? prev : keys[0] ?? FIRST_STEP));
    })();
    return () => {
      alive = false;
    };
  }, [activeVisitId, FIRST_STEP]);

  useEffect(() => {
    setCurrentStep(FIRST_STEP);
  }, [FIRST_STEP, selectedSnapshotIds]);

  /* ====== counts + visible list ====== */
  const { completedCount, pendingCount, visibleSnapshots } = useMemo(() => {
    const completed = snapshots.filter((s) => s.status === "finished");
    const ended = snapshots.filter((s) => s.status === "ended");
    const visible = [...completed, ...ended].sort(
      (a, b) =>
        (b.started_at ? +new Date(b.started_at) : 0) - (a.started_at ? +new Date(a.started_at) : 0)
    );
    const uniqueVisible = Array.from(new Map(visible.map((item) => [item.id, item])).values());
    const pending = Math.max(0, incompleteCount - ended.length);
    return {
      completedCount: completed.length,
      pendingCount: pending,
      visibleSnapshots: uniqueVisible,
    };
  }, [snapshots, incompleteCount]);

  /* ========= i18n ========= */
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

  // فلترة قائمة TLs بالمسموح
  const visibleTLs = useMemo(
    () => (permTLs ? tls.filter((tl) => permTLs.has(tl.id)) : tls),
    [tls, permTLs]
  );

  // حالة تعطيل TL
  const tlSelectDisabled = tlDisabled || lockedTL || visibleTLs.length === 0;

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: 16, color: "var(--text)" }}>
      {/* Loading overlay */}
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
            <div style={{ textAlign: "center", color: "var(--text)" }}>
              {ar ? "جاري التحميل..." : "Loading..."}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
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
            <DateField label="" value={gFilters.from} onChange={(v) => updateFilter("from", v)} locale={ar ? "ar-EG" : "en-GB"} />
          </Capsule>
          <Capsule label={ar ? "إلى" : "To"}>
            <DateField label="" value={gFilters.to} onChange={(v) => updateFilter("to", v)} locale={ar ? "ar-EG" : "en-GB"} />
          </Capsule>

          <Capsule label={t.region} summary={filters.region || (ar ? "الكل" : "All")}>
            <SelectSingle
              options={regionsOpts}
              value={filters.region}
              placeholder={t.allRegions}
              onChange={(v) => {
                if (lockedRegion) return; // تجاهل لو مقفول
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

          {/* Team Leader quick toggle */}
          <Capsule label={t.tls} summary={tlSelectDisabled ? (ar ? "غير متاح" : "N/A") : undefined}>
            <SelectObject
              options={[
                ...(lockedTL || tlDisabled ? [] : [{ value: "ALL", label: ar ? "كل الفريق" : "All Team" }]),
                ...visibleTLs.map((u) => ({
                  value: u.id,
                  label: (ar ? u.arabic_name : u.name) || "—",
                })),
              ]}
              value={
                lockedTL && userSettings?.Team_leader?.[0]
                  ? userSettings.Team_leader[0]
                  : (gFilters.team_leader_id || (tlDisabled ? "" : "ALL"))
              }
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
        {/* Right side */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Users */}
          <Panel title={t.users} right={<PillCount n={users.length} />}>
            {users.length === 0 ? (
              <EmptyBox text={t.pickTL} />
            ) : (
              <>
                <div style={{ marginBottom: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = users.map((u) => u.id);
                      const allSelected = allIds.every((id) => selectedUsers.includes(id));
                      setSelectedUsers(allSelected ? [] : allIds);
                    }}
                    style={btn(undefined, users.length > 0 && users.every((u) => selectedUsers.includes(u.id)))}
                  >
                    {ar ? "تحديد/إلغاء كل الفريق" : "Toggle All Team"}
                  </button>
                </div>

                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
                  {users.map((u) => {
                    const sel = selectedUsers.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() =>
                          setSelectedUsers((prev) => (prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id]))
                        }
                        style={btn(64, sel)}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, textAlign: ar ? "right" : "left" }}>
                          <span style={{ fontWeight: 700 }}>{(ar ? u.arabic_name : u.name) || u.username || "—"}</span>
                          <span style={{ opacity: 0.7, fontSize: 12 }}>{roleLabel(u.role, ar)}</span>
                        </div>
                        <span style={{ opacity: 0.6 }}>{sel ? "✓" : "＋"}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </Panel>

          {/* Chains */}
          <Panel title={t.chains} right={<PillCount n={chains.length} />}>
            {selectedUsers.length === 0 ? (
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
                      onClick={() =>
                        setSelectedChains((prev) => (prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]))
                      }
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

          {/* Branches */}
          <Panel title={t.branches} right={<PillCount n={branches.length} />}>
            {selectedUsers.length === 0 ? (
              <EmptyBox text={t.pickUser} />
            ) : branches.length === 0 ? (
              <EmptyBox text={t.pickChain} />
            ) : (
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
                {branches.map((b) => {
                  const sel = selectedBranches.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() =>
                        setSelectedBranches((prev) => (prev.includes(b.id) ? prev.filter((x) => x !== b.id) : [...prev, b.id]))
                      }
                      style={btn(48, sel)}
                    >
                      <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.label}</strong>
                      <span style={{ opacity: 0.6 }}>{sel ? "✓" : "＋"}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </Panel>

          {/* Dates */}
          <Panel
            title={`${t.dates} — ${t.completed}: ${completedCount} | ${t.pending}: ${pendingCount}`}
            right={<PillCount n={visibleSnapshots.length} />}
          >
            {selectedUsers.length === 0 ? (
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
                    const sel = selectedSnapshotIds.includes(s.id);
                    const visitTimestamp = s.started_at || s.finished_at;
                    const started = visitTimestamp
                      ? new Date(visitTimestamp).toLocaleString(ar ? "ar-EG" : "en-GB", { timeZone: "Asia/Riyadh" })
                      : "—";

                    if (s.status === "finished") {
                      return (
                        <button key={s.id} type="button" onClick={() => setSelectedSnapshotIds([s.id])} style={btn(56, sel)}>
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
                          key={s.id}
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
                            <span style={{ opacity: 0.85, fontSize: 12, color: "#f87171", fontWeight: "bold" }}>
                              {t.ended}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              let photoUrl = s.end_visit_photo || "";
                              try {
                                const photos = JSON.parse(photoUrl);
                                if (Array.isArray(photos) && photos.length > 0) photoUrl = photos[0];
                              } catch {
                                // ignore
                              }
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

          {/* Steps */}
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
                  pageSize={25}
                  visitId={activeVisitId}
                  startDate={activeDate}
                  endDate={activeDate}
                />
              </>
            )}
          </Panel>

          {/* Modal to show End Reason */}
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
                onClick={(e) => e.stopPropagation() }
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
                  {(ar ? endReasonViewer.reasonAr : endReasonViewer.reasonEn) ||
                    (ar ? "لا يوجد سبب مسجل." : "No reason recorded.")}
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

          {/* Buttons */}
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

/* ========= styles helpers ========= */
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
