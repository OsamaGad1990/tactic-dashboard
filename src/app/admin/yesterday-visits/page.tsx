"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { useLangTheme } from "@/hooks/useLangTheme";
import { useUserFilters } from "@/hooks/useUserFilters";
import SupaImg from "@/components/SupaImg";



/* ========= Types ========= */
type UUID = string;
type UserLite = {
  id: UUID;
  username: string | null;
  name: string | null;
  arabic_name: string | null;
  team_leader_id: UUID | null;
};
type Market = {
  id: UUID;
  region: string | null;
  city: string | null;
  store: string | null;
  branch: string | null;
};
type SnapshotRow = {
  id: UUID;
  user_id: UUID;
  market_id: UUID;
  client_id: UUID | null;
  status: string | null;
  started_at: string | null;
  finished_at: string | null;
  end_reason: string | null;
  end_reason_ar: string | null;
  end_reason_en: string | null;
  end_visit_photo: string | null;
  jp_state?: string | null;
  user?: UserLite | null;
  team_leader?: UserLite | null;
  market?: Market | null;
};
type VisitDetailsRow = {
  id: string;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  end_reason: string | null;
  end_reason_ar: string | null;
  end_reason_en: string | null;
  end_visit_photo: string | null;
  user_id: string | null;
  user_name: string | null;
  user_arabic_name: string | null;
  user_username: string | null;
  team_leader_id: string | null;
  team_leader_name: string | null;
  team_leader_arabic_name: string | null;
  team_leader_username: string | null;
  market_id: string | null;
  market_store: string | null;
  market_branch: string | null;
  market_city: string | null;
  market_region: string | null;
  jp_state?: "IN JP" | "OUT OF JP" | null;
};
type Stats = {
  total: number;
  finished: number;
  ended: number;
  pending: number;
  finished_pct: number;
  total_visit_ms: number;
  total_transit_ms: number;
};
type CountCard = { key: string; label: string; value: number | string; pct: number; mode: "count" };
type TextCard = { key: string; label: string; value: string; pct: number; mode: "text" };
type Card = CountCard | TextCard;
type JPState = "IN JP" | "OUT OF JP";
type JPStateFilter = "" | JPState;
type UserTLRow = {
  id: string;
  name: string | null;
  arabic_name: string | null;
  username: string | null;
  role: string | null;
};
type TLOption = { value: string; label: string };

function isJPStateFilter(v: string): v is JPStateFilter {
  return v === "" || v === "IN JP" || v === "OUT OF JP";
}

/* ========= Small UI ========= */
function GoldenSpinner({ size = 72, thickness = 6 }: { size?: number; thickness?: number }) {
  const accent = "var(--accent, #F5A623)";
  const bg = "color-mix(in oklab, var(--card) 40%, transparent)";
  return (
    <>
      <div
        role="status"
        aria-label="loading"
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          border: `${thickness}px solid ${bg}`,
          borderTopColor: accent,
          animation: "spin 0.9s linear infinite",
          boxShadow: `0 0 0 2px color-mix(in oklab, ${accent} 20%, transparent), inset 0 0 12px color-mix(in oklab, ${accent} 15%, transparent)`,
        }}
      />
      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

/* ========= Shared helpers ========= */
function parseImagePaths(value: unknown): string[] {
  if (!value) return [];
  let data: unknown;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try { data = JSON.parse(trimmed); } catch { return []; }
    } else {
      return trimmed.split(/[\s,]+/).filter(Boolean);
    }
  } else {
    data = value;
  }
  if (Array.isArray(data)) return data.flat(Infinity).filter((x): x is string => typeof x === "string");
  return [];
}
function ksaDate(d = new Date()) {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" });
}
function toKSAClock(iso: string | null, isAr: boolean) {
  if (!iso) return "-";
  const dt = new Date(iso);
  return dt.toLocaleTimeString(isAr ? "ar-EG" : "en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Riyadh",
  });
}
function msToClock(ms: number) {
  if (ms <= 0) return "00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
function userDisplay(u: Pick<UserLite, "username" | "name" | "arabic_name"> | null | undefined, isAr = false) {
  if (!u) return isAr ? "غير معروف" : "Unknown";
  const disp = (isAr ? u.arabic_name : u.name) || u.username;
  return disp || (isAr ? "غير معروف" : "Unknown");
}
function marketKey(r: SnapshotRow) {
  const m = r.market;
  if (m?.id) return `id:${m.id}`;
  return `sbcr:${m?.store ?? ""}|${m?.branch ?? ""}|${m?.city ?? ""}|${m?.region ?? ""}`;
}
function pickBest(list: SnapshotRow[], rowStatus: (r: SnapshotRow) => string, isAr: boolean) {
  const S_FIN = isAr ? "مكتملة" : "Finished";
  const S_END = isAr ? "منتهية" : "Ended";
  const S_PEN = isAr ? "معلقة" : "Pending";
  const withStat = list.map((r) => ({ r, s: rowStatus(r) }));
  const finished = withStat.filter((x) => x.s === S_FIN);
  const ended = withStat.filter((x) => x.s === S_END);
  const pending = withStat.filter((x) => x.s === S_PEN);
  const candidate = finished.length ? finished : ended.length ? ended : pending;
  if (!candidate.length) return null;
  const best = candidate.reduce((a, b) => {
    const ta = new Date(a.r.finished_at ?? a.r.started_at ?? 0).getTime();
    const tb = new Date(b.r.finished_at ?? b.r.started_at ?? 0).getTime();
    return tb > ta ? b : a;
  });
  return best.r;
}

/* ========= Capsules UI ========= */
const cardBorder = "1px solid var(--divider)";
function Capsule({ label, summary, children }: { label: string; summary?: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex", flexDirection: "column", gap: 6,
        border: "1px solid var(--input-border)", borderRadius: 14,
        background: "var(--input-bg)", padding: "8px 10px", overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>{label}</div>
        {summary && <div style={{ fontSize: 11, opacity: 0.75 }}>{summary}</div>}
      </div>
      {children}
    </div>
  );
}
function ksaDayWindow(dateStr: string) {
  const start = new Date(`${dateStr}T00:00:00.000+03:00`).getTime();
  const end = new Date(`${dateStr}T23:59:59.999+03:00`).getTime();
  return { start, end };
}

type Opt = { value: string; label: string };
function SelectBox({
  options, value, onChange, placeholder, disabled = false,
}: {
  options: string[] | Opt[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const { isArabic } = useLangTheme();
  const opts: Opt[] = Array.isArray(options)
    ? (options as unknown[]).every((x) => typeof x === "string")
      ? (options as string[]).map((s) => ({ value: s, label: s }))
      : (options as Opt[])
    : [];
  return (
    <div
      style={{
        position: "relative", display: "flex", alignItems: "center", gap: 10,
        padding: "10px 12px", borderRadius: 12, border: "1px solid var(--input-border)",
        background: "var(--card)", overflow: "hidden", opacity: disabled ? 0.65 : 1, pointerEvents: disabled ? "none" : "auto",
      }}
    >
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.currentTarget.value)}
        disabled={disabled}
        style={{
          width: "100%", height: 24,
          padding: isArabic ? "0 34px 0 6px" : "0 6px 0 34px",
          border: "none", outline: "none", background: "transparent", color: "var(--text)",
          appearance: "none", WebkitAppearance: "none", MozAppearance: "none", fontWeight: 700,
        }}
      >
        <option value="">{placeholder || ""}</option>
        {opts.map((op) => (
          <option key={op.value} value={op.value}>{op.label}</option>
        ))}
      </select>
      <span
        aria-hidden
        style={{
          position: "absolute", top: 0, bottom: 0, ...(isArabic ? { left: 10 } : { right: 10 }),
          display: "flex", alignItems: "center", pointerEvents: "none", opacity: 0.8,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
}

/* ========= Page ========= */
export default function YesterdayVisitsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { isArabic: isAr } = useLangTheme();
  const { filters: userFilters, loading: filtersLoading } = useUserFilters();

  const [tlDict, setTlDict] = useState<Map<string, { name: string | null; arabic_name: string | null; username: string | null }>>(new Map());

  const [booting, setBooting] = useState(true);
  const [clientId, setClientId] = useState<UUID | null>(null);

  // visit/work/transit (sec)
  const [visitSeconds, setVisitSeconds] = useState<number>(0);
  const [workSeconds, setWorkSeconds] = useState<number>(0);

  const [viewer, setViewer] = useState<{ open: boolean; imgs: string[]; index: number; title?: string }>({
    open: false, imgs: [], index: 0, title: "",
  });

  const yesterday = useMemo(() => {
    const y = new Date(); y.setDate(y.getDate() - 1); return ksaDate(y);
  }, []);

  /* ======= Filters state ======= */
  const [selectedRegion, setSelectedRegion] = useState<string>(params.get("region") || "");
  const [selectedCity, setSelectedCity] = useState<string>(params.get("city") || "");
  const [selectedStore, setSelectedStore] = useState<string>((params.get("market") || "").trim());
  const [selectedTL, setSelectedTL] = useState<string>(params.get("tl") || "");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedJP, setSelectedJP] = useState<JPStateFilter>("");

  /* ======= بيانات الزيارات ======= */
  const [rows, setRows] = useState<SnapshotRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);

  /* ======= Options ======= */
  const [regionOptions, setRegionOptions] = useState<string[]>([]);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [storeOptions, setStoreOptions] = useState<string[]>([]);
  const [tlOptions, setTLOptions] = useState<TLOption[]>([]);

  const loadFilterOptions = useCallback(async () => {
    if (!clientId) return;

    // ---------- Markets ----------
    let q = supabase
      .from("Markets")
      .select("store, city, region")
      .eq("client_id", clientId)
      .order("region", { ascending: true })
      .order("city", { ascending: true })
      .order("store", { ascending: true });

    if (userFilters?.allowed_markets?.length) {
      q = q.in("store", userFilters.allowed_markets.map((s) => (s ?? "").trim()));
    }
    if (selectedStore) q = q.eq("store", selectedStore);
    if (selectedRegion) q = q.eq("region", selectedRegion);
    if (selectedCity) q = q.eq("city", selectedCity);

    let mkts: Array<{ store: string | null; city: string | null; region: string | null }> | null = null;
    try {
      const { data, error } = await q;
      if (error) throw error;
      mkts = data ?? [];
    } catch {
      // Fallback من بيانات أمس لو جدول Markets مقفول بسبب RLS
      const getUniq = (arr: (string | null | undefined)[]) =>
        Array.from(new Set(arr.filter(Boolean).map((s) => (s as string).trim())));
      mkts = [];
      const reg = getUniq(rows.map((r) => r.market?.region));
      const cty = getUniq(rows.map((r) => r.market?.city));
      const str = selectedStore ? [selectedStore] : getUniq(rows.map((r) => r.market?.store));
      for (const r of reg) mkts.push({ store: null, city: null, region: r });
      for (const c of cty) mkts.push({ store: null, city: c, region: null });
      for (const s of str) mkts.push({ store: s, city: null, region: null });
    }

    const uniq = <T extends string>(arr: (T | null)[]) =>
      Array.from(new Set(arr.filter(Boolean).map((s) => (s as string).trim()))) as T[];

    const stores = selectedStore ? [selectedStore] : uniq(mkts.map((m) => m.store));
    const regions = uniq(mkts.map((m) => m.region));
    const cities = uniq(mkts.map((m) => m.city));

    const lock = (src: string[], allowed?: string[]) =>
      (allowed?.length ? src.filter((x) => allowed.includes(x)) : src).sort((a, b) => a.localeCompare(b, "ar"));

    setStoreOptions(lock(stores, userFilters?.allowed_markets?.map((s) => (s ?? "").trim())));
    setRegionOptions(lock(regions, userFilters?.default_region?.map((s) => (s ?? "").trim())));
    setCityOptions(lock(cities, userFilters?.default_city?.map((s) => (s ?? "").trim())));

    // ---------- Team Leaders (مربوطة بالصفوف المعروضة) ----------
    const norm = (s?: string | null) => {
      const t = (s ?? "").trim();
      return t.length ? t : null;
    };

    const tlIds = Array.from(
      new Set(rows.map((r) => (r.user?.team_leader_id ? String(r.user.team_leader_id) : "")).filter(Boolean))
    );

    let usersRows: UserTLRow[] = [];
    if (tlIds.length) {
      const { data: uData } = await supabase
        .from("Users")
        .select("id, name, arabic_name, username, role, is_active")
        .in("id", tlIds)
        .eq("is_active", true)
        .throwOnError();
      if (Array.isArray(uData)) usersRows = uData as unknown as UserTLRow[];
    }

    if (!usersRows.length) {
      const { data: uData2 } = await supabase
        .from("Users")
        .select("id, name, arabic_name, username, role, is_active")
        .ilike("role", "%team leader%")
        .eq("is_active", true)
        .throwOnError();
      if (Array.isArray(uData2)) usersRows = uData2 as unknown as UserTLRow[];
    }

    const toLabel = (u: UserTLRow) =>
      norm(isAr ? u.arabic_name : u.name) ?? norm(u.name) ?? norm(u.username) ?? (isAr ? "بدون اسم" : "No name");

    const dict = new Map<string, { name: string | null; arabic_name: string | null; username: string | null }>();
    for (const u of usersRows) {
      dict.set(String(u.id), { name: norm(u.name), arabic_name: norm(u.arabic_name), username: norm(u.username) });
    }
    setTlDict(dict);

    const tls: TLOption[] = usersRows.map((u) => ({ value: String(u.id), label: toLabel(u) }));
    const lockedTL = userFilters?.Team_leader?.[0];
    setTLOptions(lockedTL ? tls.filter((t) => t.value === lockedTL) : tls);
  }, [
    clientId,
    isAr,
    rows,
    selectedStore,
    selectedRegion,
    selectedCity,
    userFilters?.allowed_markets,
    userFilters?.default_city,
    userFilters?.default_region,
    userFilters?.Team_leader,
  ]);

  // تصحيح الاختيارات لو خرجت برّة القوائم الحالية
  useEffect(() => {
    if (!userFilters?.default_region?.length && selectedRegion && !regionOptions.includes(selectedRegion)) setSelectedRegion("");
    if (!userFilters?.default_city?.length && selectedCity && !cityOptions.includes(selectedCity)) setSelectedCity("");
    if (!userFilters?.allowed_markets?.length && selectedStore && !storeOptions.includes(selectedStore)) setSelectedStore("");
    if (!userFilters?.Team_leader?.length && selectedTL && !tlOptions.find((t) => t.value === selectedTL)) setSelectedTL("");
  }, [regionOptions, cityOptions, storeOptions, tlOptions, selectedRegion, selectedCity, selectedStore, selectedTL, userFilters]);

  /* ========= صور الزيارة ========= */
  const openViewer = (imgs: string[], title?: string, index = 0) => { setViewer({ open: true, imgs, index, title }); setImgLoading(true); };
  const closeViewer = () => setViewer((v) => ({ ...v, open: false }));
  const prevImg = () => { setViewer((v) => ({ ...v, index: (v.index - 1 + v.imgs.length) % v.imgs.length })); setImgLoading(true); };
  const nextImg = () => { setViewer((v) => ({ ...v, index: (v.index + 1) % v.imgs.length })); setImgLoading(true); };

  useEffect(() => {
    if (!viewer.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowLeft") prevImg();
      if (e.key === "ArrowRight") nextImg();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer.open]);

  // boot → clientId
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data?.session) { router.replace("/login"); return; }
      
      const authUserId = data.session.user.id; // 1. هذا هو Auth ID

      let cid = localStorage.getItem("client_id");
      
      if (!cid) {
        // [!!!] --- بداية الإصلاح ---
        // 2. نحتاج للـ ID من جدول public.Users أولاً
        const { data: publicUser, error: userError } = await supabase
          .from("Users")
          .select("id")
          .eq("auth_user_id", authUserId) // (البحث بعمود الربط الصحيح)
          .single();

        if (userError || !publicUser) {
          console.error("YesterdayVisits: Could not find public user for auth user:", authUserId, userError);
          router.replace("/no-access"); // (غير مسموح له)
          return;
        }

        const publicUserId = publicUser.id; // 3. هذا هو الـ ID الصحيح لجدول Users

        // 4. الآن نبحث في client_users باستخدام الـ ID الصحيح
        const { data: cu, error: clientUserError } = await supabase
          .from("client_users")
          .select("client_id")
          .eq("user_id", publicUserId) // (استخدام publicUserId)
          .eq("is_active", true)
          .single();

        // هذا هو المكان الذي كان يظهر فيه خطأ 406
        if (clientUserError) {
          console.error("YesterdayVisits: Could not find client_user link:", publicUserId, clientUserError);
          router.replace("/no-access"); 
          return;
        }
        // [!!!] --- نهاية الإصلاح ---
          
        if (cu?.client_id) { 
          cid = String(cu.client_id); 
          localStorage.setItem("client_id", cid); 
        }
      }

      if (!cid) { router.replace("/no-access"); return; } 
      
      setClientId(cid); 
      setBooting(false);
    })();
  }, [router]);

  // helpers to map localized status -> SQL param
  const statusParam = useMemo(() => {
    if (!selectedStatus) return null;
    const mapArToEn: Record<string, "Finished" | "Ended" | "Pending"> = { "مكتملة": "Finished", "منتهية": "Ended", "معلقة": "Pending" };
    if (isAr) return mapArToEn[selectedStatus] ?? null;
    if (["Finished", "Ended", "Pending"].includes(selectedStatus)) return selectedStatus as "Finished" | "Ended" | "Pending";
    return null;
  }, [selectedStatus, isAr]);

  // fetch RPC (passes filters to SQL)
  const fetchTable = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);

    const { data, error } = await supabase.rpc("get_yesterday_visits_details", {
      p_client_id: clientId,
      p_snapshot_date: yesterday,
      p_region: selectedRegion || null,
      p_city: selectedCity || null,
      p_store: selectedStore || null,
      p_team_leader_id: selectedTL || null,
      p_jp_state: (selectedJP as JPState) || null,
      p_status: statusParam,
    });

    if (error) { setRows([]); setLoading(false); return; }

    const hydrated: SnapshotRow[] = (data || []).map((r: VisitDetailsRow) => ({
      id: r.id,
      status: r.status,
      started_at: r.started_at,
      finished_at: r.finished_at,
      end_reason: r.end_reason,
      end_reason_ar: r.end_reason_ar,
      end_reason_en: r.end_reason_en,
      end_visit_photo: r.end_visit_photo,
      jp_state: r.jp_state ?? null,
      user_id: r.user_id || "",
      market_id: r.market_id || "",
      client_id: clientId,
      user: { id: r.user_id || "", name: r.user_name, arabic_name: r.user_arabic_name, username: r.user_username, team_leader_id: r.team_leader_id },
      market: r.market_id ? { id: r.market_id, store: r.market_store, branch: r.market_branch, city: r.market_city, region: r.market_region } : null,
      team_leader: r.team_leader_id ? { id: r.team_leader_id, name: r.team_leader_name, arabic_name: r.team_leader_arabic_name, username: r.team_leader_username, team_leader_id: null } : null,
    }));

    setRows(hydrated);
    setLoading(false);
  }, [clientId, yesterday, selectedRegion, selectedCity, selectedStore, selectedTL, selectedJP, statusParam]);

  // تطبيق الإفتراضيات والقيود من user_settings
  useEffect(() => {
    if (booting || filtersLoading) return;
    if (userFilters?.default_region?.[0] && !selectedRegion) setSelectedRegion(userFilters.default_region[0] || "");
    if (userFilters?.default_city?.[0] && !selectedCity) setSelectedCity(userFilters.default_city[0] || "");
    if (userFilters?.allowed_markets?.[0] && !selectedStore) setSelectedStore((userFilters.allowed_markets[0] || "").trim());
    if (userFilters?.Team_leader?.[0] && !selectedTL) setSelectedTL(userFilters.Team_leader[0] || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booting, filtersLoading, userFilters]);

  // جلب الخيارات عند تغيّر الفلاتر/التراخيص
  useEffect(() => {
    if (!clientId || filtersLoading) return;
    void loadFilterOptions();
  }, [clientId, filtersLoading, selectedStore, selectedRegion, selectedCity, loadFilterOptions]);

  const rowStatus = useCallback((r: SnapshotRow) => {
    const hasEndReason = r.end_reason_ar || r.end_reason_en;
    if (hasEndReason && String(hasEndReason).trim().length > 0) return isAr ? "منتهية" : "Ended";
    if (r.started_at && r.finished_at) return isAr ? "مكتملة" : "Finished";
    return isAr ? "معلقة" : "Pending";
  }, [isAr]);

  const rowJP = useCallback((r: SnapshotRow): "IN JP" | "OUT OF JP" => {
    if (r.jp_state === "IN JP" || r.jp_state === "OUT OF JP") return r.jp_state;
    return "IN JP";
  }, []);

  // ======== حساب مدة الزيارة + العمل من session_snap (بتداخل زمني) ========
  const fetchDurationsFromSessionSnap = useCallback(async () => {
    if (!clientId) { setWorkSeconds(0); setVisitSeconds(0); return; }
    const day = yesterday;
    const { start: dayStart, end: dayEnd } = ksaDayWindow(day);

    // (A) المستخدمون الذين لديهم زيارات أمس بعد الفلاتر
    type MarketLite = { id: string; region?: string | null; city?: string | null; store?: string | null };
    type UserTL = { id: string; team_leader_id: string | null };

    const qVisits = supabase
      .from("DailyVisitSnapshots")
      .select("user_id, market_id, started_at, finished_at")
      .eq("client_id", clientId)
      .eq("snapshot_date", day);

    const visitRows: Array<{ user_id: string | null; market_id: string | null; started_at: string | null; finished_at: string | null }> = [];
    {
      const needMarketFilter = !!(selectedRegion || selectedCity || selectedStore);
      const marketsById: Record<string, MarketLite> = {};
      if (needMarketFilter) {
        const { data: mData } = await supabase.from("Markets").select("id, region, city, store");
        for (const m of (mData ?? []) as MarketLite[]) marketsById[String(m.id)] = m;
      }

      const userTL: Record<string, string | null> = {};
      if (selectedTL) {
        const { data: uData } = await supabase.from("Users").select("id, team_leader_id");
        for (const u of (uData ?? []) as UserTL[]) userTL[String(u.id)] = u.team_leader_id ? String(u.team_leader_id) : null;
      }

      const pageSize = 1000;
      let from = 0, to = pageSize - 1;
      while (true) {
        const { data, error } = await qVisits.range(from, to);
        if (error) break;
        const chunk = (data ?? []) as typeof visitRows;
        for (const r of chunk) {
          if (selectedTL) {
            const tl = userTL[String(r.user_id)] || null;
            if (tl !== selectedTL) continue;
          }
          if (selectedRegion || selectedCity || selectedStore) {
            const m = r.market_id ? marketsById[String(r.market_id)] : undefined;
            if (!m) continue;
            if (selectedRegion && m.region !== selectedRegion) continue;
            if (selectedCity && m.city !== selectedCity) continue;
            if (selectedStore && m.store !== selectedStore) continue;
          }
          visitRows.push(r);
        }
        if (!chunk.length || chunk.length < pageSize) break;
        from += pageSize; to += pageSize;
      }
    }

    const userSet = new Set<string>();
    for (const r of visitRows) if (r.user_id) userSet.add(String(r.user_id));

    // (B) وقت الزيارات
    let visit = 0;
    for (const r of visitRows) {
      if (!r.started_at || !r.finished_at) continue;
      const startTs = new Date(r.started_at).getTime();
      const endTs = new Date(r.finished_at).getTime();
      const clippedStart = Math.max(startTs, dayStart);
      const clippedEnd = Math.min(endTs, dayEnd);
      visit += Math.max(0, Math.floor((clippedEnd - clippedStart) / 1000));
    }
    setVisitSeconds(visit);

    // (C) وقت العمل من session_snap (أي تداخل مع اليوم)
    if (userSet.size === 0) { setWorkSeconds(0); return; }
    const userIds = Array.from(userSet);

    const startISO = new Date(dayStart).toISOString();
    const endISO = new Date(dayEnd).toISOString();

    const { data: sessData, error: sessErr } = await supabase
      .from("session_snap")
      .select("user_uuid, login_at, last_seen_at, logout_at, closed_at, snapshot_at")
      .eq("client_id", clientId)
      .in("user_uuid", userIds)
      .or(
        [
          `snapshot_date.eq.${day}`,
          // login <= dayEnd AND (last_seen|logout|closed|snapshot) >= dayStart
          `and(login_at.lte.${endISO},or(last_seen_at.gte.${startISO},logout_at.gte.${startISO},closed_at.gte.${startISO},snapshot_at.gte.${startISO}))`,
        ].join(",")
      );

    if (sessErr) { setWorkSeconds(0); return; }

    const byUser: Record<string, number> = {};
    for (const s of (sessData ?? []) as Array<{
      user_uuid: string | null; login_at: string | null; last_seen_at: string | null; logout_at: string | null; closed_at: string | null; snapshot_at: string | null;
    }>) {
      const uid = String(s.user_uuid ?? "");
      if (!uid) continue;
      const loginTs = s.login_at ? new Date(s.login_at).getTime() : NaN;
      const rawEnd = s.last_seen_at ?? s.logout_at ?? s.closed_at ?? s.snapshot_at ?? s.login_at;
      const endTs = rawEnd ? new Date(rawEnd).getTime() : NaN;
      if (isNaN(loginTs) || isNaN(endTs)) continue;
      const startClipped = Math.max(loginTs, dayStart);
      const endClipped = Math.min(endTs, dayEnd);
      const secs = Math.max(0, Math.floor((endClipped - startClipped) / 1000));
      byUser[uid] = (byUser[uid] ?? 0) + secs;
    }

    const work = Object.values(byUser).reduce((a, b) => a + Math.min(Math.max(b, 0), 86400), 0);
    setWorkSeconds(work);
  }, [clientId, yesterday, selectedRegion, selectedCity, selectedStore, selectedTL]);

  // أول تحميل + جلب الجدول والـdurations
  useEffect(() => { if (!clientId) return; fetchTable(); }, [clientId, fetchTable]);
  useEffect(() => { if (!clientId) return; void fetchDurationsFromSessionSnap(); }, [clientId, yesterday, selectedRegion, selectedCity, selectedStore, selectedTL, fetchDurationsFromSessionSnap]);

  // collapse by market
  const collapsedRows = useMemo(() => {
    const groups = new Map<string, SnapshotRow[]>();
    for (const r of rows) {
      const k = marketKey(r);
      if (!k) continue;
      const arr = groups.get(k) ?? [];
      arr.push(r);
      groups.set(k, arr);
    }
    const out: SnapshotRow[] = [];
    for (const [, list] of groups) {
      const best = pickBest(list, rowStatus, isAr);
      if (best) out.push(best);
    }
    return out;
  }, [rows, rowStatus, isAr]);

  const filteredRows = useMemo(() => {
    return collapsedRows.filter((r) => {
      const okR = selectedRegion ? r.market?.region === selectedRegion : true;
      const okC = selectedCity ? r.market?.city === selectedCity : true;
      const okS = selectedStore ? r.market?.store === selectedStore : true;
      const okTL = selectedTL ? r.user?.team_leader_id === selectedTL : true;
      const okSt = selectedStatus ? rowStatus(r) === selectedStatus : true;
      const jp = rowJP(r);
      const okJP = selectedJP ? jp === selectedJP : true;
      return okR && okC && okS && okTL && okSt && okJP;
    });
  }, [collapsedRows, selectedRegion, selectedCity, selectedStore, selectedTL, selectedStatus, selectedJP, rowStatus, rowJP]);

  const rowDurationMs = (r: SnapshotRow) => {
    if (!(r.started_at && r.finished_at)) return 0;
    const start = new Date(r.started_at).getTime();
    const end = new Date(r.finished_at).getTime();
    return Math.max(0, end - start);
  };

  const stats: Stats = useMemo(() => {
    const base = filteredRows;
    const total = base.length;
    const ended = base.filter((r) => (r.end_reason_ar || r.end_reason_en)?.toString().trim().length).length;
    const finishedRows = base.filter((r) => !(r.end_reason_ar || r.end_reason_en) && r.started_at && r.finished_at);
    const finished = finishedRows.length;
    const pending = total - ended - finished;
    const travelSeconds = Math.max(0, workSeconds - visitSeconds);
    return {
      total,
      finished,
      ended,
      pending,
      finished_pct: total ? (finished / total) * 100 : 0,
      total_visit_ms: visitSeconds * 1000,
      total_transit_ms: travelSeconds * 1000,
    };
  }, [filteredRows, workSeconds, visitSeconds]);

  const cards: Card[] = useMemo(
    () => [
      { key: "total", label: isAr ? "إجمالي الزيارات" : "Total Visits", value: stats.total, pct: 100, mode: "count" },
      { key: "finished", label: isAr ? "المكتملة" : "Finished", value: stats.finished, pct: stats.total ? (stats.finished / stats.total) * 100 : 0, mode: "count" },
      { key: "ended", label: isAr ? "المنتهية" : "Ended", value: stats.ended, pct: stats.total ? (stats.ended / stats.total) * 100 : 0, mode: "count" },
      { key: "pending", label: isAr ? "غير المكتملة" : "Pending", value: stats.pending, pct: stats.total ? (stats.pending / stats.total) * 100 : 0, mode: "count" },
      { key: "visit_sum", label: isAr ? "إجمالي وقت الزيارة" : "Total Visit Time", value: msToClock(stats.total_visit_ms), pct: 100, mode: "text" },
      { key: "transit_sum", label: isAr ? "إجمالي وقت التنقل" : "Total Travel Time", value: msToClock(stats.total_transit_ms), pct: 100, mode: "text" },
    ],
    [stats, isAr]
  );

  const primaryBtnStyle: React.CSSProperties = {
    backgroundColor: "var(--accent)", color: "var(--accent-foreground)",
    padding: "8px 12px", border: "none", borderRadius: 10, fontWeight: 800, cursor: "pointer",
  };

  if (booting) {
    return (
      <div style={{ minHeight: "60vh", display: "grid", placeItems: "center", color: "var(--text)" }}>
        {isAr ? "جاري التحقق من الجلسة…" : "Checking session…"}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", padding: 16, color: "var(--text)", background: "var(--bg)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
        <div
          style={{
            width: "min(1100px, 94vw)", display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between",
            background: "var(--card)", border: "1px solid var(--divider)", borderRadius: 12, padding: "10px 14px",
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 18 }}>{isAr ? "زيارات أمس" : "Yesterday’s Visits"} — {yesterday}</div>
          <button onClick={() => router.push("/admin/dashboard")} style={primaryBtnStyle}>
            {isAr ? "رجوع" : "Back"}
          </button>
        </div>
      </div>

      {/* Filters (Capsules) */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
        <div
          style={{
            width: "min(1100px, 94vw)",
            border: cardBorder,
            background: "color-mix(in oklab, var(--card) 82%, transparent)",
            borderRadius: 16,
            padding: 10,
          }}
        >
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(6, minmax(160px, 1fr))" }}>
            <Capsule label={isAr ? "الحالة" : "Status"} summary={selectedStatus || (isAr ? "الكل" : "All")}>
              <SelectBox
                options={[isAr ? "مكتملة" : "Finished", isAr ? "منتهية" : "Ended", isAr ? "معلقة" : "Pending"]}
                value={selectedStatus}
                placeholder={isAr ? "الكل" : "All"}
                onChange={(v) => setSelectedStatus(v)}
              />
            </Capsule>

            <Capsule label={isAr ? "رحلة العمل" : "JP State"} summary={selectedJP || (isAr ? "الكل" : "All")}>
              <SelectBox options={["IN JP", "OUT OF JP"]} value={selectedJP} placeholder={isAr ? "الكل" : "All"} onChange={(v) => isJPStateFilter(v) && setSelectedJP(v)} />
            </Capsule>

            {/* Region */}
            <Capsule label={isAr ? "المنطقة" : "Region"} summary={selectedRegion || (isAr ? "الكل" : "All")}>
              <SelectBox
                options={regionOptions}
                value={selectedRegion}
                placeholder={isAr ? "كل المناطق" : "All regions"}
                onChange={(v) => setSelectedRegion(v)}
                disabled={!!userFilters?.default_region?.length}
              />
            </Capsule>

            {/* City */}
            <Capsule label={isAr ? "المدينة" : "City"} summary={selectedCity || (isAr ? "الكل" : "All")}>
              <SelectBox
                options={cityOptions}
                value={selectedCity}
                placeholder={isAr ? "كل المدن" : "All cities"}
                onChange={(v) => setSelectedCity(v)}
                disabled={!!userFilters?.default_city?.length}
              />
            </Capsule>

            {/* Store */}
            <Capsule label={isAr ? "السوق" : "Market"} summary={selectedStore || (isAr ? "الكل" : "All")}>
              <SelectBox
                options={storeOptions}
                value={selectedStore}
                placeholder={isAr ? "كل الأسواق" : "All markets"}
                onChange={(v) => setSelectedStore(v)}
                disabled={!!userFilters?.allowed_markets?.length}
              />
            </Capsule>

            {/* Team Leader */}
            <Capsule
              label={isAr ? "قائد الفريق" : "Team Leader"}
              summary={selectedTL ? tlOptions.find((t) => t.value === selectedTL)?.label ?? (isAr ? "بدون اسم" : "No name") : isAr ? "الكل" : "All"}
            >
              <SelectBox
                options={[{ value: "", label: isAr ? "الكل" : "All" }, ...tlOptions]}
                value={selectedTL}
                onChange={(v) => setSelectedTL(v)}
                placeholder=""
                disabled={!!userFilters?.Team_leader?.length}
              />
            </Capsule>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
            <button onClick={fetchTable} style={{ ...primaryBtnStyle, border: "1px solid var(--divider)" }}>
              {isAr ? "تحديث" : "Refresh"}
            </button>
            <button
              onClick={() => {
                if (!userFilters?.default_region?.[0]) setSelectedRegion("");
                if (!userFilters?.default_city?.[0]) setSelectedCity("");
                if (!userFilters?.allowed_markets?.[0]) setSelectedStore("");
                if (!userFilters?.Team_leader?.[0]) setSelectedTL("");
                setSelectedStatus("");
                setSelectedJP("");
                fetchTable();
              }}
              style={{
                background: "var(--card)", color: "var(--text)",
                border: "1px solid var(--divider)", borderRadius: 10,
                padding: "8px 12px", fontWeight: 800, cursor: "pointer",
              }}
            >
              {isAr ? "تصفير الفلاتر" : "Clear Filters"}
            </button>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
        {(() => {
          const count = cards.length;
          const gap = 12;
          const basis = `calc((100% - ${gap * (count - 1)}px) / ${count})`;
          return (
            <div style={{ width: "min(1100px, 94vw)", display: "flex", gap, flexWrap: "nowrap" }}>
              {cards.map((c) => (
                <div
                  key={c.key}
                  style={{
                    flex: `0 0 ${basis}`, maxWidth: 180, minWidth: 120,
                    background: "var(--card)", border: "1px solid var(--divider)", borderRadius: 10, padding: 10, textAlign: "center",
                  }}
                >
                  <div style={{ width: 90, height: 90, margin: "0 auto", display: "grid", placeItems: "center" }}>
                    {c.mode === "count" ? (
                      <CircularProgressbar
                        value={c.pct}
                        text={`${c.value}`}
                        styles={buildStyles({ textColor: "var(--text)", pathColor: "var(--accent)", trailColor: "var(--chip-bg)" })}
                      />
                    ) : (
                      <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>{c.value}</div>
                    )}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, color: "var(--text)" }}>{c.label}</div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Table */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          style={{
            width: "min(1100px, 94vw)", background: "var(--card)",
            border: "1px solid var(--divider)", borderRadius: 16, overflow: "hidden",
          }}
          className="no-scrollbar"
        >
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
            <thead>
              <tr>
                {[
                  isAr ? "المستخدم" : "User",
                  isAr ? "قائد الفريق" : "Team Leader",
                  isAr ? "السوق / الفرع" : "Market / Branch",
                  isAr ? "وقت البدء" : "Started at",
                  isAr ? "وقت الانتهاء" : "Finished at",
                  isAr ? "مدة الزيارة" : "Duration",
                  isAr ? "الحالة" : "Status",
                  isAr ? "حالة JP" : "JP State",
                  isAr ? "سبب الإنهاء" : "End Reason",
                  isAr ? "الصورة" : "Photo",
                ].map((h) => (
                  <th key={h} style={{ textAlign: "center", padding: "10px 10px", fontWeight: 800, borderBottom: "1px solid var(--divider)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} style={{ textAlign: "center", padding: 20, color: "var(--muted)" }}>{isAr ? "تحميل…" : "Loading…"}</td></tr>
              ) : filteredRows.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: "center", padding: 20, color: "var(--muted)" }}>{isAr ? "لا توجد سجلات" : "No records"}</td></tr>
              ) : (
                filteredRows.map((r) => {
                  const durMs = rowDurationMs(r);
                  const images = parseImagePaths(r.end_visit_photo);
                  const jp = rowJP(r);
                  const jpStyle: React.CSSProperties = {
                    display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px",
                    borderRadius: 999, fontSize: 12, fontWeight: 800, letterSpacing: 0.2,
                    background: jp === "IN JP" ? "rgba(34,197,94,0.14)" : "rgba(239,68,68,0.14)",
                    border: `1px solid ${jp === "IN JP" ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)"}`,
                    color: jp === "IN JP" ? "#16a34a" : "#ef4444", minWidth: 64, justifyContent: "center", textTransform: "uppercase",
                  };

                  const norm = (s?: string | null) => { const t = (s ?? "").trim(); return t.length ? t : null; };

                  return (
                    <tr key={r.id} style={{ borderTop: "1px solid var(--divider)" }}>
                      <td style={{ textAlign: "center", padding: "10px 10px" }}>{userDisplay(r.user, isAr)}</td>
                      <td style={{ textAlign: "center", padding: "10px 10px" }}>
                        {(() => {
                          if (r.team_leader) return userDisplay(r.team_leader, isAr);
                          const tlId = r.user?.team_leader_id ? String(r.user.team_leader_id) : "";
                          if (!tlId) return "-";
                          const u = tlDict.get(tlId);
                          if (!u) return isAr ? "غير معروف" : "Unknown";
                          const label = (isAr ? norm(u.arabic_name) : norm(u.name)) ?? norm(u.name) ?? norm(u.username) ?? (isAr ? "غير معروف" : "Unknown");
                          return label;
                        })()}
                      </td>
                      <td style={{ textAlign: "center", padding: "10px 10px" }}>
                        <div style={{ lineHeight: 1.2 }}>
                          <div style={{ fontWeight: 700 }}>{r.market?.store || "-"}</div>
                          <div style={{ fontSize: 12, color: "var(--muted)" }}>{isAr ? "الفرع" : "Branch"}: {r.market?.branch || "-"}</div>
                        </div>
                      </td>
                      <td style={{ textAlign: "center", padding: "10px 10px" }}>{toKSAClock(r.started_at, isAr)}</td>
                      <td style={{ textAlign: "center", padding: "10px 10px" }}>{toKSAClock(r.finished_at, isAr)}</td>
                      <td style={{ textAlign: "center", padding: "10px 10px" }}>{durMs ? msToClock(durMs) : "-"}</td>
                      <td style={{ textAlign: "center", padding: "10px 10px" }}>{rowStatus(r)}</td>
                      <td style={{ textAlign: "center", padding: "10px 10px" }}><span style={jpStyle}>{jp}</span></td>
                      <td style={{ textAlign: "center", padding: "10px 10px" }}>{(isAr ? r.end_reason_ar : r.end_reason_en) || r.end_reason || "-"}</td>
                      <td style={{ textAlign: "center", padding: "10px 10px" }}>
                        {images.length > 0 ? (
                          <button onClick={() => openViewer(images, isAr ? "صورة نهاية الزيارة" : "End of Visit Photo")} style={{ ...primaryBtnStyle, padding: "6px 10px", fontSize: 12 }}>
                            {isAr ? `فتح (${images.length})` : `Open (${images.length})`}
                          </button>
                        ) : "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lightbox */}
      {viewer.open && (
        <div
          onClick={closeViewer}
          style={{
            position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.75)", display: "flex", justifyContent: "center", alignItems: "center",
            zIndex: 1000, cursor: "zoom-out",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative", maxWidth: "96vw", width: "auto", maxHeight: "90vh",
              backgroundColor: "var(--card)", borderRadius: 16, padding: 12, border: "1px solid var(--divider)", cursor: "default",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <strong style={{ fontSize: 14 }}>{viewer.title || ""}</strong>
              <button
                onClick={closeViewer}
                style={{
                  position: "absolute", top: 10, ...(isAr ? { left: 15 } : { right: 15 }),
                  background: "transparent", border: "none", color: "var(--text)", fontSize: 28, cursor: "pointer", lineHeight: 1, zIndex: 10,
                }}
              >
                &times;
              </button>
            </div>

            <div
              style={{
                position: "relative", width: "100%", minWidth: "min(500px, 80vw)", height: "70vh",
                backgroundColor: "var(--input-bg)", borderRadius: 12, overflow: "hidden",
              }}
            >
              <img
                key={viewer.imgs[viewer.index] + "-preloader"}
                src={viewer.imgs[viewer.index]}
                onLoad={() => setImgLoading(false)}
                onError={() => setImgLoading(false)}
                style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
                alt=""
              />
              {imgLoading && (
                <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", zIndex: 1, background: "var(--input-bg)" }}>
                  <GoldenSpinner />
                </div>
              )}
              {viewer.imgs.length > 1 && (
                <button
                  onClick={prevImg}
                  style={{
                    position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
                    padding: "8px 12px", borderRadius: 99, border: "1px solid var(--divider)",
                    backgroundColor: "rgba(0,0,0,0.4)", color: "white", zIndex: 2,
                  }}
                  title={isAr ? "السابق" : "Prev"}
                >
                  ‹
                </button>
              )}
              <SupaImg
                key={viewer.imgs[viewer.index]}
                src={viewer.imgs[viewer.index]}
                alt="preview"
                style={{ width: "100%", height: "100%", objectFit: "contain", opacity: imgLoading ? 0 : 1, transition: "opacity 0.2s" }}
              />
              {viewer.imgs.length > 1 && (
                <button
                  onClick={nextImg}
                  style={{
                    position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                    padding: "8px 12px", borderRadius: 99, border: "1px solid var(--divider)",
                    backgroundColor: "rgba(0,0,0,0.4)", color: "white", zIndex: 2,
                  }}
                  title={isAr ? "التالي" : "Next"}
                >
                  ›
                </button>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
              <div style={{ opacity: 0.8, fontSize: 12 }}>{viewer.index + 1} / {viewer.imgs.length}</div>
              {viewer.imgs.length > 1 && (
                <div style={{ display: "flex", gap: 8, overflow: "auto", maxWidth: "calc(100% - 50px)" }} className="no-scrollbar">
                  {viewer.imgs.map((u, i) => (
                    <button
                      key={u + i}
                      style={{
                        flexShrink: 0, position: "relative", width: 48, height: 48,
                        borderRadius: 6, border: `2px solid ${i === viewer.index ? "var(--accent)" : "var(--divider)"}`,
                      }}
                      onClick={() => { setViewer((v) => ({ ...v, index: i })); setImgLoading(true); }}
                      title={`${i + 1}`}
                    >
                      <SupaImg src={u} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 4 }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        table tbody tr + tr td { border-top: 1px solid var(--divider); }
        thead th { background: var(--header-bg); position: sticky; top: 0; z-index: 1; }
        td { vertical-align: middle; }
        select option { color: #000; background: #fff; }
      `}</style>

      {filtersLoading && (
        <div style={{ position: "fixed", inset: 0, display: "grid", placeItems: "center", background: "rgba(0,0,0,0.25)", zIndex: 100 }}>
          <GoldenSpinner />
        </div>
      )}
    </div>
  );
}
