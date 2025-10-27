"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabaseClient";
import { useLangTheme } from "@/hooks/useLangTheme";
import { useUserFilters } from "@/hooks/useUserFilters";
import SupaImg from "@/components/SupaImg";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

/* ========= Types ========= */
type UUID = string;

type UserRow = {
  id: UUID;
  name: string | null;
  arabic_name: string | null;
  role: string | null;
  team_leader_id: UUID | null;
};

type InventoryReport = {
  id: UUID;
  created_at: string;
  is_available: boolean | null;
  quantity: number[] | null;
  expiry_date: (string | null)[] | null;
  custom_reason: string | null;
  photos: string[] | null;
  user?: { id: UUID; name: string | null; arabic_name: string | null; team_leader_id: UUID | null };
  market?: { id: string; store: string | null; branch: string | null; region: string | null; city: string | null };
  product?: { name: string | null };
  reason?: { reason_en: string | null; reason_ar: string | null };
};

/* ========= Small UI helpers ========= */
const cardBorder = "1px solid var(--divider)";

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ border: cardBorder, background: "var(--card)", borderRadius: 16, padding: 12 }}>
      <h3 style={{ margin: "0 0 12px 0", fontSize: 14, fontWeight: 700, opacity: 0.9 }}>{title}</h3>
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

function OpenPhotosBadge({
  count,
  onClick,
  label = "فتح",
}: {
  count: number;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 56,
        height: 44,
        padding: "6px 10px",
        borderRadius: 10,
        border: "1px solid color-mix(in oklab, var(--accent) 50%, transparent)",
        background: "color-mix(in oklab, var(--accent) 25%, var(--card))",
        color: "var(--text)",
        fontWeight: 800,
        cursor: "pointer",
        boxShadow:
          "inset 0 1px 0 color-mix(in oklab, #fff 15%, transparent), 0 0 0 2px color-mix(in oklab, var(--accent) 15%, transparent)",
      }}
    >
      <span style={{ lineHeight: 1 }}>{label}</span>
      <span style={{ lineHeight: 1, opacity: 0.9 }}>({count})</span>
    </button>
  );
}

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
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}

/* ========= Filters UI ========= */
function Capsule({
  label,
  summary,
  children,
}: {
  label: string;
  summary?: string;
  children: ReactNode;
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
        <div style={{ fontSize: 12, color: "var(--muted)" }}>{label}</div>
        {summary && <div style={{ fontSize: 11, opacity: 0.75 }}>{summary}</div>}
      </div>
      {children}
    </div>
  );
}

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
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid var(--input-border)",
        background: "var(--card)",
        opacity: disabled ? 0.75 : 1,
        overflow: "hidden",
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

function SelectSingle({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  includeEmpty = true,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  includeEmpty?: boolean;
}) {
  const { isArabic } = useLangTheme();

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid var(--input-border)",
        background: "var(--card)",
        opacity: disabled ? 0.75 : 1,
        overflow: "hidden",
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
        {includeEmpty && <option value="">{placeholder || ""}</option>}
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

function DateBox({
  selected,
  onChange,
  placeholder,
}: {
  selected: Date | null;
  onChange: (d: Date | null) => void;
  placeholder: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid var(--input-border)",
        background: "var(--card)",
      }}
    >
      <span aria-hidden>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ display: "block" }}>
          <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M16 3v4M8 3v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
      <div style={{ flex: 1 }}>
        <DatePicker
          selected={selected}
          onChange={onChange}
          dateFormat="yyyy-MM-dd"
          placeholderText={placeholder}
          customInput={
            <input
              readOnly
              style={{
                width: "100%",
                height: 24,
                border: "none",
                outline: "none",
                background: "transparent",
                color: "var(--text)",
                fontWeight: 700,
                cursor: "pointer",
              }}
            />
          }
        />
      </div>
    </div>
  );
}

/* ========= Page ========= */
export default function InventoryReportPage() {
  const { isArabic: ar } = useLangTheme();
  const { filters: userFilters, loading: filtersLoading } = useUserFilters();

  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);
  const [allClientUsers, setAllClientUsers] = useState<UserRow[]>([]);
  const [reports, setReports] = useState<InventoryReport[]>([]);

  // تاريخ
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  // فلاتر
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
const [selectedCity, setSelectedCity] = useState<string | null>(null);
const [selectedStore, setSelectedStore] = useState<string | null>(null);
const [selectedTL, setSelectedTL] = useState<string | null>(null);

  const [selectedUsers, setSelectedUsers] = useState<UUID[]>([]);
  const [selectedMarketStore, setSelectedMarketStore] = useState<string | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<UUID | null>(null);

  // Lightbox/Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<InventoryReport[]>([]);
  const [lightboxImages, setLightboxImages] = useState<string[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [imgLoading, setImgLoading] = useState(false);

  // خيارات الفلاتر
  const [regionOptions, setRegionOptions] = useState<string[]>([]);
  const [citiesOptions, setCitiesOptions] = useState<string[]>([]);
  const [storeOptions, setStoreOptions] = useState<string[]>([]);

  // Team Leaders (labels)
  const [tlOptions, setTLOptions] = useState<Array<{ value: string; label: string }>>([]);

  const norm = (s?: string | null) => (s ?? "").trim().toLowerCase();

  // 🔒 حالات الفلاتر المقفولة من الباك
  const lockedRegion = !!userFilters?.default_region?.length;
  const lockedCity = !!userFilters?.default_city?.length;
  const lockedStore = !!userFilters?.allowed_markets?.length;
  const lockedTL = !!userFilters?.Team_leader?.length;

  // متجر فعّال (من الكبسولة أو من Panel)
  const effectiveStore = useMemo(
    () => (selectedStore || selectedMarketStore || "").trim(),
    [selectedStore, selectedMarketStore]
  );

  const openGallery = (arr: string[]) => {
    if (!arr || arr.length === 0) return;
    setLightboxImages(arr);
    setLightboxIndex(0);
    setImgLoading(true);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const cid = localStorage.getItem("client_id");
      setClientId(cid);
    }
  }, []);

  useEffect(() => {
    if (lightboxImages) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [lightboxImages]);

  // 🔒 تطبيق قيم الفلاتر المقفولة كافتراض
  useEffect(() => {
  if (!filtersLoading && userFilters) {
    if (lockedRegion) setSelectedRegion(userFilters.default_region?.[0] ?? null);
    if (lockedCity) setSelectedCity(userFilters.default_city?.[0] ?? null);
    if (lockedStore) setSelectedStore(userFilters.allowed_markets?.[0] ?? null);
    if (lockedTL) setSelectedTL(userFilters.Team_leader?.[0] ?? null);
  }
}, [filtersLoading, userFilters, lockedRegion, lockedCity, lockedStore, lockedTL]);

  /* Initial data: users for that client */
  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const { data: usersData } = await supabase
          .from("client_users")
          .select("Users:Users!inner(id,name,arabic_name,role,team_leader_id)")
          .eq("client_id", clientId)
          .eq("is_active", true)
          .order("user_id", { ascending: true })
          .returns<{ Users: UserRow | null }[]>();
        setAllClientUsers((usersData ?? []).map((r) => r.Users).filter((u): u is UserRow => Boolean(u)));
      } finally {
        setLoading(false);
      }
    })();
  }, [clientId]);

  /* Load all reports for that client (مُقيد بالفلاتر المقفولة) */
  useEffect(() => {
    if (!clientId) return;
    (async () => {
      try {
        setLoading(true);
        let q = supabase
          .from("InventoryReports")
          .select(
            `*, user:Users(id,name,arabic_name,team_leader_id), product:Products(*), reason:reasons(reason_en,reason_ar), market:Markets(*)`
          )
          .eq("client_id", clientId);

        // 🔒 قيود ثابتة من الباك
        if (lockedRegion) q = q.eq("market.region", userFilters!.default_region![0]);
        if (lockedCity) q = q.eq("market.city", userFilters!.default_city![0]);
        if (lockedStore) q = q.in("market.store", userFilters!.allowed_markets!);
        if (lockedTL) q = q.eq("user.team_leader_id", userFilters!.Team_leader![0]);

        const { data } = await q;
        setReports((data ?? []) as InventoryReport[]);
      } finally {
        setLoading(false);
      }
    })();
  }, [clientId, lockedCity, lockedRegion, lockedStore, lockedTL, userFilters]);

  // ===== تحميل قائمة TL من النتائج (ثم fallback عام) =====
  useEffect(() => {
    (async () => {
      // IDs مرئية من النتائج الحالية
      const tlIds = Array.from(
        new Set(
          (reports ?? [])
            .map((r) => (r.user?.team_leader_id ? String(r.user.team_leader_id) : ""))
            .filter(Boolean)
        )
      );

      type TLRow = { id: string; name: string | null; arabic_name: string | null; username: string | null; role: string | null; is_active: boolean };

      let list: TLRow[] = [];
      if (tlIds.length) {
        const { data } = await supabase
          .from("Users")
          .select("id, name, arabic_name, username, role, is_active")
          .in("id", tlIds)
          .eq("is_active", true)
          .throwOnError();
        if (Array.isArray(data)) list = data as unknown as TLRow[];
      }

      if (!list.length) {
        const { data } = await supabase
          .from("Users")
          .select("id, name, arabic_name, username, role, is_active")
          .ilike("role", "%team leader%")
          .eq("is_active", true)
          .throwOnError();
        if (Array.isArray(data)) list = data as unknown as TLRow[];
      }

      const norm2 = (s?: string | null) => {
        const t = (s ?? "").trim();
        return t.length ? t : null;
      };
      const toLabel = (u: TLRow) =>
        norm2(ar ? u.arabic_name : u.name) ?? norm2(u.name) ?? norm2(u.username) ?? (ar ? "بدون اسم" : "No name");

      const baseOptions = list.map((u) => ({ value: String(u.id), label: toLabel(u) }));
      const lockedId = userFilters?.Team_leader?.[0];
      setTLOptions(lockedId ? baseOptions.filter((t) => t.value === lockedId) : baseOptions);
    })();
  }, [reports, ar, userFilters?.Team_leader]);

  // ===== تحميل خيارات الفلاتر من Supabase (مع مراعاة المقفول + Fallback مضمون) =====
useEffect(() => {
  if (!clientId) return;

  (async () => {
    // 1) استعلام Markets مع مراعاة القيود المقفولة أولاً
    let q = supabase
      .from("Markets")
      .select("store, city, region")
      .eq("client_id", clientId)
      .order("region", { ascending: true })
      .order("city", { ascending: true })
      .order("store", { ascending: true });

    // 🔒 قيود ثابتة من الباك أولاً (لو مقفولة)
    if (lockedRegion) q = q.eq("region", userFilters!.default_region![0]);
    if (lockedCity) q = q.eq("city", userFilters!.default_city![0]);
    if (lockedStore) q = q.in("store", userFilters!.allowed_markets!);

    // ثم الفلاتر الديناميكية (لو مش مقفولة)
    if (selectedRegion && !lockedRegion) q = q.eq("region", selectedRegion);
    if (selectedCity && !lockedCity) q = q.eq("city", selectedCity);
    if (effectiveStore && !lockedStore) q = q.eq("store", effectiveStore);

    let mkts: { store: string | null; city: string | null; region: string | null }[] = [];
    try {
      const { data, error } = await q;
      if (error) throw error;
      mkts = (data ?? []) as typeof mkts;
    } catch {
      // هنستخدم fallback تحت
    }

    // 2) Fallback مضمون من التقارير المعروضة (مراعي كل القيود)
    if (!mkts || mkts.length === 0) {
      const s = new Set<string>();
      const c = new Set<string>();
      const r = new Set<string>();

      for (const it of reports) {
        const m = it.market;
        if (!m) continue;

        // طبّق القيود المقفولة:
        if (lockedRegion && (m.region ?? "").trim() !== (userFilters!.default_region![0] ?? "").trim()) continue;
        if (lockedCity && (m.city ?? "").trim() !== (userFilters!.default_city![0] ?? "").trim()) continue;
        if (lockedStore && !userFilters!.allowed_markets!.map((x) => (x ?? "").trim()).includes((m.store ?? "").trim()))
          continue;

        // طبّق الفلاتر الديناميكية:
        if (!lockedRegion && selectedRegion && (m.region ?? "").trim().toLowerCase() !== selectedRegion.trim().toLowerCase()) continue;
        if (!lockedCity && selectedCity && (m.city ?? "").trim().toLowerCase() !== selectedCity.trim().toLowerCase()) continue;
        if (!lockedStore && effectiveStore && (m.store ?? "").trim().toLowerCase() !== effectiveStore.trim().toLowerCase()) continue;

        if (m.store) s.add(m.store.trim());
        if (m.city) c.add(m.city.trim());
        if (m.region) r.add(m.region.trim());
      }

      mkts = [
        ...Array.from(s).map((x) => ({ store: x, city: null, region: null })),
        ...Array.from(c).map((x) => ({ store: null, city: x, region: null })),
        ...Array.from(r).map((x) => ({ store: null, city: null, region: x })),
      ];
    }

    // 3) بناء القوائم
    const uniq = (arr: (string | null)[]) =>
      Array.from(new Set(arr.filter(Boolean).map((x) => (x as string).trim())));

    const stores = lockedStore
      ? uniq(mkts.map((m) => m.store)) // حتى لو مقفول، اعرض قيمة/قيم السوق للمعلومية
      : effectiveStore
      ? [effectiveStore]
      : uniq(mkts.map((m) => m.store));

    const regions = uniq(mkts.map((m) => m.region));
    const cities = uniq(mkts.map((m) => m.city));

    setStoreOptions(stores);
    setRegionOptions(regions);
    setCitiesOptions(cities);
  })();
}, [
  clientId,
  reports,            // مهم للفول باك
  selectedRegion,
  selectedCity,
  effectiveStore,
  lockedRegion,
  lockedCity,
  lockedStore,
  userFilters,
]);


  // ========== USER LISTS ==========
  const usersForPanel = useMemo(() => {
    const mchUsers = allClientUsers.filter((u) => (u.role ?? "").toLowerCase() === "mch");
    if (lockedTL) {
      return mchUsers.filter((u) => u.team_leader_id === userFilters!.Team_leader![0]);
    }
    if (selectedTL === "ALL") return mchUsers;
    return mchUsers.filter((u) => u.team_leader_id === selectedTL);
  }, [allClientUsers, selectedTL, lockedTL, userFilters]);

  // 2) Reset يراعي الفلاتر الإجبارية
  const resetFilters = () => {
    setDateFrom(null);
    setDateTo(null);
    if (!lockedTL) setSelectedTL("ALL");
    if (!lockedRegion) setSelectedRegion("");
    if (!lockedCity) setSelectedCity("");
    if (!lockedStore) setSelectedStore("");
    setSelectedUsers([]);
    setSelectedMarketStore(null);
    setSelectedBranchId(null);
  };

  const handleDateFromChange = (date: Date | null) => {
    setDateFrom(date);
    if (dateTo && date && date > dateTo) {
      setDateTo(null);
    }
  };

  /* ====== SAFETY: invalidate selections لو خرجت برا القوائم (لو مش مقفولة) ====== */
  useEffect(() => {
    if (!lockedRegion && selectedRegion && !regionOptions.includes(selectedRegion)) {
      setSelectedRegion("");
      setSelectedCity("");
      setSelectedStore("");
    }
  }, [regionOptions, selectedRegion, lockedRegion]);

  useEffect(() => {
    if (!lockedCity && selectedCity && !citiesOptions.includes(selectedCity)) {
      setSelectedCity("");
      setSelectedStore("");
    }
  }, [citiesOptions, selectedCity, lockedCity]);

  useEffect(() => {
    if (!lockedStore && selectedStore && !storeOptions.includes(selectedStore)) {
      setSelectedStore("");
    }
  }, [storeOptions, selectedStore, lockedStore]);

  /* ====== FINAL FILTER for the grid ====== */
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const reportDate = new Date(r.created_at);
      const fromOk = !dateFrom || reportDate >= dateFrom;
      let toOk = true;
      if (dateTo) {
        const toDateEnd = new Date(dateTo);
        toDateEnd.setHours(23, 59, 59, 999);
        toOk = reportDate <= toDateEnd;
      }

      // 🔒 طبّق القيود الثابتة دائمًا
      const lockedRegionOk = !lockedRegion || norm(r.market?.region) === norm(userFilters!.default_region![0]);
      const lockedCityOk = !lockedCity || norm(r.market?.city) === norm(userFilters!.default_city![0]);
      const lockedStoreOk = !lockedStore || userFilters!.allowed_markets!.map(norm).includes(norm(r.market?.store));
      const lockedTLOk = !lockedTL || r.user?.team_leader_id === userFilters!.Team_leader![0];

      const regionOk = !selectedRegion || norm(r.market?.region) === norm(selectedRegion);
      const cityOk = !selectedCity || norm(r.market?.city) === norm(selectedCity);
      const storeOk = !selectedStore || norm(r.market?.store) === norm(selectedStore);

      const userOk = selectedUsers.length === 0 ? true : selectedUsers.includes(r.user?.id || "");

      // TL (لو مش مقفول)
      let tlOk = true;
      if (!lockedTL) {
        const mchId = r.user?.id || "";
        tlOk = selectedTL === "ALL" ? true : usersForPanel.some((u) => u.id === mchId);
      }

      return (
        fromOk &&
        toOk &&
        lockedRegionOk &&
        lockedCityOk &&
        lockedStoreOk &&
        lockedTLOk &&
        regionOk &&
        cityOk &&
        storeOk &&
        userOk &&
        tlOk
      );
    });
  }, [
    reports,
    dateFrom,
    dateTo,
    selectedRegion,
    selectedCity,
    selectedStore,
    selectedUsers,
    selectedTL,
    usersForPanel,
    lockedRegion,
    lockedCity,
    lockedStore,
    lockedTL,
    userFilters,
  ]);

  const reportsFilteredByUsers = useMemo(
    () => filteredReports.filter((r) => (selectedUsers.length ? selectedUsers.includes(r.user?.id || "") : true)),
    [filteredReports, selectedUsers]
  );

  /* ====== Panels derived from filtered-by-users ====== */
  const marketsForPanel = useMemo(() => {
    if (selectedUsers.length === 0) return [];
    if (selectedStore) return [selectedStore]; // لو في متجر مختار (كبسولة/Panel) اقفل القائمة عليه
    const marketStores = new Set<string>();
    for (const r of reportsFilteredByUsers) if (r.market?.store) marketStores.add(r.market.store);
    return Array.from(marketStores).sort();
  }, [reportsFilteredByUsers, selectedUsers.length, selectedStore]);

  const branchesForPanel = useMemo(() => {
    if (!selectedMarketStore && !selectedStore) return [];
    const activeStore = effectiveStore;
    const branches = new Map<UUID, string>();
    for (const r of reportsFilteredByUsers) {
      if (norm(r.market?.store) === norm(activeStore) && r.market?.id && r.market.branch) {
        branches.set(r.market.id as UUID, r.market.branch);
      }
    }
    return Array.from(branches.entries()).map(([id, branch]) => ({ id, branch: branch || "" }));
  }, [reportsFilteredByUsers, effectiveStore, selectedStore, selectedMarketStore]);

  const datesForPanel = useMemo(() => {
    if (!selectedBranchId) return [];
    const dates = new Set<string>();
    for (const r of reportsFilteredByUsers) {
      if (r.market?.id === selectedBranchId) dates.add(new Date(r.created_at).toISOString().split("T")[0]);
    }
    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  }, [reportsFilteredByUsers, selectedBranchId]);

  const openModalWithData = (date: string, branchId: UUID) => {
    const dataForModal = reportsFilteredByUsers.filter(
      (r) => r.market?.id === branchId && new Date(r.created_at).toISOString().split("T")[0] === date
    );
    setModalData(dataForModal);
    setModalOpen(true);
  };

  const T = useMemo(
    () => ({
      back: ar ? "رجوع" : "Back",
      pageTitle: ar ? "تقارير الجرد" : "Inventory Reports",
    }),
    [ar]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setModalOpen(false);
        setLightboxImages(null);
        setLightboxIndex(0);
      }
      if (lightboxImages && lightboxImages.length > 1) {
        if (e.key === "ArrowRight") setLightboxIndex((i) => (i + 1) % lightboxImages.length);
        else if (e.key === "ArrowLeft") setLightboxIndex((i) => (i - 1 + lightboxImages.length) % lightboxImages.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxImages]);

  if (loading || filtersLoading) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(4px)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <GoldenSpinner />
          <div style={{ color: "var(--text)", fontWeight: 700, letterSpacing: 0.3 }}>
            {ar ? "جاري تحميل البيانات..." : "Loading Data..."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: 16 }}>
      <style jsx global>{`
        .react-datepicker__header { background-color: var(--card) !important; }
        .react-datepicker__month-container { background-color: var(--card); border: 1px solid var(--divider); }
        .react-datepicker__current-month,
        .react-datepicker__time__header,
        .react-datepicker__year-header,
        .react-datepicker__day-name,
        .react-datepicker__day,
        .react-datepicker__time-name { color: var(--text) !important; }
        .react-datepicker__day--disabled { opacity: 0.3; }
      `}</style>

      <h1 style={{ textAlign: "center", marginBottom: 16, fontSize: "2.25em", color: "var(--accent)" }}>{T.pageTitle}</h1>

      {/* ===== Filters Bar (Capsules) ===== */}
      <div
        style={{
          position: "sticky",
          top: 8,
          zIndex: 20,
          marginBottom: 16,
          padding: 10,
          borderRadius: 16,
          border: cardBorder,
          background: "color-mix(in oklab, var(--card) 82%, transparent)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(180px, 1fr))", gap: 10, alignItems: "end" }}>
          <Capsule label={ar ? "من تاريخ" : "From"}>
            <DateBox
              selected={dateFrom}
              onChange={(d) => handleDateFromChange(d)}
              placeholder={ar ? "اختر تاريخ البداية" : "Select start date"}
            />
          </Capsule>

          <Capsule label={ar ? "إلى تاريخ" : "To"}>
            <DateBox selected={dateTo} onChange={(d) => setDateTo(d)} placeholder={ar ? "اختر تاريخ النهاية" : "Select end date"} />
          </Capsule>

          <Capsule
            label={ar ? "قائد الفريق" : "Team Leader"}
            summary={
              selectedTL === "ALL"
                ? ar ? "كل الفريق" : "All team"
                : tlOptions.find((t) => t.value === (selectedTL as string))?.label ?? "—"
            }
          >
            <SelectObject
               options={cityOptions}
  value={selectedCity ?? ""}            // ← هنا
  placeholder={ar ? "كل المدن" : "All cities"}
  onChange={(v) => { 
    setSelectedCity(v || null); 
    setSelectedStore(null); 
  }}
  disabled={lockedCity}
/>
          </Capsule>

          <Capsule label={ar ? "المنطقة" : "Region"} summary={selectedRegion || (ar ? "الكل" : "All")}>
            <SelectSingle
  options={regionOptions}
  value={selectedRegion ?? ""}          // ← هنا
  placeholder={ar ? "كل المناطق" : "All regions"}
  onChange={(v) => { 
    setSelectedRegion(v || null);       // ← حوّل فاضي لـ null
    setSelectedCity(null);              // ← بدّل "" إلى null
    setSelectedStore(null);             // ← بدّل "" إلى null
  }}
  disabled={lockedRegion}
/>
          </Capsule>

          <Capsule label={ar ? "المدينة" : "City"} summary={selectedCity || (ar ? "الكل" : "All")}>
            <SelectSingle
  options={cityOptions}
  value={selectedCity ?? ""}            // ← هنا
  placeholder={ar ? "كل المدن" : "All cities"}
  onChange={(v) => { 
    setSelectedCity(v || null); 
    setSelectedStore(null); 
  }}
  disabled={lockedCity}
/>
          </Capsule>

          <Capsule label={ar ? "السوق" : "Store"} summary={selectedStore || (ar ? "الكل" : "All")}>
            <SelectSingle
  options={storeOptions}
  value={selectedStore ?? ""}           // ← هنا
  placeholder={ar ? "كل الأسواق" : "All markets"}
  onChange={(v) => setSelectedStore(v || null)}
  disabled={lockedStore}
/>
          </Capsule>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <button
            onClick={resetFilters}
            style={{
              height: 40,
              padding: "0 16px",
              fontWeight: 800,
              border: "1px solid var(--divider)",
              borderRadius: 12,
              background: "var(--card)",
              color: "var(--text)",
              cursor: "pointer",
            }}
          >
            {ar ? "إعادة تعيين" : "Reset"}
          </button>
        </div>
      </div>

      {/* ===== Content ===== */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Panel title={ar ? "المنسقون (MCH)" : "Coordinators (MCH)"}>
          {usersForPanel.length === 0 ? (
            <EmptyBox text={ar ? "اختر قائد فريق أو لا يوجد منسقون" : "Select a team leader or no coordinators found"} />
          ) : (
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
              <button
                onClick={() => {
                  const allIds = usersForPanel.map((u) => u.id);
                  setSelectedUsers(allIds.every((id) => selectedUsers.includes(id)) ? [] : allIds);
                }}
                style={btn(undefined, usersForPanel.length > 0 && selectedUsers.length === usersForPanel.length)}
              >
                {ar ? "تحديد الكل" : "Select All"}
              </button>
              {usersForPanel.map((user) => {
                const isSelected = selectedUsers.includes(user.id);
                return (
                  <button
                    key={user.id}
                    onClick={() =>
                      setSelectedUsers((p) => (isSelected ? p.filter((id) => id !== user.id) : [...p, user.id]))
                    }
                    style={btn(48, isSelected)}
                  >
                    <span>{ar ? user.arabic_name || user.name : user.name || user.arabic_name}</span>
                    <span style={{ opacity: 0.6 }}>{isSelected ? "✓" : "＋"}</span>
                  </button>
                );
              })}
            </div>
          )}
        </Panel>

        {selectedUsers.length > 0 && (
          <Panel title={ar ? "الأسواق (Stores)" : "Stores"}>
            {marketsForPanel.length === 0 ? (
              <EmptyBox text={ar ? "لا توجد أسواق لهؤلاء المستخدمين" : "No stores for these users"} />
            ) : (
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
                {marketsForPanel.map((store) => (
                  <button
                    key={store}
                    onClick={() => {
                      setSelectedMarketStore(store);
                      setSelectedBranchId(null);
                      setSelectedStore(store); // مزامنة panel مع الكبسولة العلوية
                    }}
                    style={btn(48, effectiveStore === store)}
                  >
                    <span>{store}</span>
                    <span style={{ opacity: 0.6 }}>{effectiveStore === store ? "✓" : "＋"}</span>
                  </button>
                ))}
              </div>
            )}
          </Panel>
        )}

        {(selectedMarketStore || selectedStore) && (
          <Panel title={ar ? "الفروع" : "Branches"}>
            {branchesForPanel.length === 0 ? (
              <EmptyBox text={ar ? "لا توجد فروع" : "No branches"} />
            ) : (
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
                {branchesForPanel.map((b) => (
                  <button key={b.id} onClick={() => setSelectedBranchId(b.id)} style={btn(48, selectedBranchId === b.id)}>
                    <span>{b.branch}</span>
                    <span style={{ opacity: 0.6 }}>{selectedBranchId === b.id ? "✓" : "＋"}</span>
                  </button>
                ))}
              </div>
            )}
          </Panel>
        )}

        {selectedBranchId && (
          <Panel title={ar ? "تواريخ الجرد" : "Inventory Dates"}>
            {datesForPanel.length === 0 ? (
              <EmptyBox text={ar ? "لا توجد زيارات جرد مسجلة" : "No inventory visits recorded"} />
            ) : (
              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
                {datesForPanel.map((date) => (
                  <button key={date} onClick={() => openModalWithData(date, selectedBranchId)} style={btn(48, false)}>
                    <span>
                      {new Date(date + "T00:00:00").toLocaleDateString(ar ? "ar-EG" : "en-GB", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Panel>
        )}

        <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
          <Link
            href="/admin/reports"
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
            {T.back}
          </Link>
        </div>
      </div>

      {/* ===== Modal ===== */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--card)",
              border: "1px solid var(--divider)",
              borderRadius: 16,
              padding: 24,
              width: "90%",
              maxWidth: 900,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>{ar ? "تفاصيل الجرد" : "Inventory Details"}</h3>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: "none", border: "none", color: "var(--text)", fontSize: 24, cursor: "pointer" }}
              >
                &times;
              </button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--divider)" }}>
                  <th style={{ padding: "8px", textAlign: ar ? "right" : "left" }}>{ar ? "المنتج" : "Product"}</th>
                  <th style={{ padding: "8px", textAlign: "center" }}>{ar ? "الحالة" : "Status"}</th>
                  <th style={{ padding: "8px", textAlign: ar ? "right" : "left" }}>{ar ? "الملاحظات / السبب" : "Notes / Reason"}</th>
                  <th style={{ padding: "8px", textAlign: "center" }}>{ar ? "الصور" : "Photos"}</th>
                </tr>
              </thead>
              <tbody>
                {modalData.map((item) => (
                  <tr key={item.id} style={{ borderTop: "1px solid var(--divider)" }}>
                    <td style={{ padding: "8px" }}>{item.product?.name || "-"}</td>
                    <td style={{ padding: "8px", textAlign: "center" }}>
                      {item.is_available ? (
                        <div style={{ color: "#22c55e" }}>
                          <strong>{ar ? "متوفر" : "Available"}</strong>
                          {item.quantity && item.expiry_date && item.quantity.length > 0 ? (
                            item.quantity.map((qty, index) => (
                              <div key={index} style={{ fontSize: "0.9em", opacity: 0.9, marginTop: 4, direction: "ltr" }}>
                                {qty} →{" "}
                                {item.expiry_date?.[index]
                                  ? new Date(item.expiry_date[index]!).toLocaleDateString("en-CA")
                                  : ar
                                  ? "لا يوجد تاريخ"
                                  : "No Date"}
                              </div>
                            ))
                          ) : (
                            <div style={{ fontSize: "0.9em", opacity: 0.9, marginTop: 4 }}>
                              {ar ? "(لا توجد كميات مسجلة)" : "(No quantities recorded)"}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "#ef4444" }}>{ar ? "غير متوفر" : "Unavailable"}</span>
                      )}
                    </td>
                    <td style={{ padding: "8px" }}>
                      {(ar ? item.reason?.reason_ar : item.reason?.reason_en) || item.custom_reason || "-"}
                    </td>
                    <td style={{ padding: "8px", textAlign: "center" }}>
                      {item.photos && item.photos.length > 0 ? (
                        <OpenPhotosBadge count={item.photos.length} label={ar ? "فتح" : "Open"} onClick={() => openGallery(item.photos!)} />
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== Lightbox ===== */}
      {lightboxImages && (
        <div
          onClick={() => setLightboxImages(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 101,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          {imgLoading && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <GoldenSpinner />
            </div>
          )}
          <SupaImg
            key={lightboxImages[lightboxIndex]}
            src={lightboxImages[lightboxIndex]}
            alt="Inventory"
            onLoad={() => setImgLoading(false)}
            onError={() => setImgLoading(false)}
            priority
            style={{ maxWidth: "90%", maxHeight: "90%", objectFit: "contain", opacity: imgLoading ? 0 : 1, transition: "opacity .2s ease" }}
          />
          <img
            key={"preload-" + lightboxImages[lightboxIndex]}
            src={lightboxImages[lightboxIndex]}
            alt=""
            loading="eager"
            decoding="async"
            onLoad={() => setImgLoading(false)}
            onError={() => setImgLoading(false)}
            style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxImages(null);
              setLightboxIndex(0);
            }}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              background: "none",
              border: "1px solid rgba(255,255,255,0.4)",
              color: "white",
              fontSize: 26,
              cursor: "pointer",
              borderRadius: 8,
              width: 44,
              height: 44,
              lineHeight: "42px",
            }}
            aria-label="Close"
          >
            &times;
          </button>
          {lightboxImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setImgLoading(true);
                  setLightboxIndex((i) => (i - 1 + lightboxImages.length) % lightboxImages.length);
                }}
                style={{
                  position: "absolute",
                  left: 16,
                  background: "none",
                  border: "1px solid rgba(255,255,255,0.4)",
                  color: "white",
                  fontSize: 22,
                  cursor: "pointer",
                  borderRadius: 8,
                  width: 44,
                  height: 44,
                }}
                aria-label="Prev"
              >
                ‹
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setImgLoading(true);
                  setLightboxIndex((i) => (i + 1) % lightboxImages.length);
                }}
                style={{
                  position: "absolute",
                  right: 16,
                  background: "none",
                  border: "1px solid rgba(255,255,255,0.4)",
                  color: "white",
                  fontSize: 22,
                  cursor: "pointer",
                  borderRadius: 8,
                  width: 44,
                  height: 44,
                }}
                aria-label="Next"
              >
                ›
              </button>
              <div
                style={{
                  position: "absolute",
                  bottom: 16,
                  right: 16,
                  background: "rgba(0,0,0,0.5)",
                  color: "white",
                  padding: "6px 10px",
                  borderRadius: 10,
                  fontWeight: 700,
                }}
              >
                {lightboxIndex + 1} / {lightboxImages.length}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
