// src/app/admin/visit-steps/StepDataTable.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useLangTheme } from "@/hooks/useLangTheme";
import SupaImg from "@/components/SupaImg";
import { VISIT_STEPS, type StepKey, type StepConfig } from "@/utils/visitStepsMap";
import BadgePill from "@/components/BadgePill";

/* ========= Types ========= */
type UUID = string;
type ImgRef = { url: string; bucket?: string };

type UserRow = {
  id: UUID;
  auth_user_id?: UUID | null;
  name: string | null;
  username: string | null;
  arabic_name: string | null;
  role: string | null;
  team_leader_id: UUID | null;
};

type Props = {
  step: StepKey;
  visitIds?: string[];
  startDate?: string | null;
  endDate?: string | null;
  userId?: UUID | null;
  pageSize?: number;
  users?: UserRow[];
  jpState?: string | null;
};

type Row = Record<string, unknown>;
type MarketInfoRow = { store: string | null; branch: string | null };

/* ========= Helpers ========= */
const dateColumnFor = (stepKey: StepKey) => {
  switch (stepKey) {
    case "arrival_photos":
      return "arrival_time";
    case "remarks":
    case "promoter_reports":
    case "promoter_plus_reports":
    default:
      return "created_at";
  }
};

const toKsaDayRange = (day: string) => {
  const ymd = day.split("T")[0];
  const fromISO = `${ymd}T00:00:00+03:00`;
  const [Y, M, D] = ymd.split("-").map(Number);
  const d = new Date(Y, (M ?? 1) - 1, D ?? 1);
  d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const toISO = `${yyyy}-${mm}-${dd}T00:00:00+03:00`;
  return { fromISO, toISO };
};
function formatPromoNote(raw: unknown, ar: boolean): string {
  const s = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  if (["instore", "in store", "in-store", "inside store", "عرض داخلي"].includes(s)) {
    return ar ? "عرض داخلي" : "In-store";
  }
  if (["flyer", "brochure", "leaflet", "بروشور"].includes(s)) {
    return ar ? "بروشور" : "Flyer";
  }
  if (["extra visibility", "extra-visibility", "extra display", "extra space", "مساحة اضافية", "مساحة إضافية"].includes(s)) {
    return ar ? "مساحة إضافية" : "Extra visibility";
  }
  // fallback لو جاء نص حر
  return String(raw || "");
}

function Empty({ text }: { text: string }) {
  return (
    <div
      style={{
        border: "1px solid var(--divider)",
        background: "var(--input-bg)",
        borderRadius: 12,
        padding: 16,
        textAlign: "center",
        opacity: 0.85,
      }}
    >
      {text}
    </div>
  );
}

function groupTlDetailsRows(dataArr: Row[], imageCols: string[], dateCol: string): Row[] {
  const byVisit = new Map<string, Row>();
  for (const r of dataArr) {
    const vid = String(r.visit_id ?? "");
    if (!vid) continue;
    if (!byVisit.has(vid)) {
      byVisit.set(vid, {
        visit_id: vid,
        user_id: r.user_id,
        remark: r.remark ?? "",
        [dateCol]: r[dateCol],
        all_photos: [] as string[],
      } as Row);
    }
    const acc = byVisit.get(vid)!;

    const cur = acc[dateCol] ? +new Date(String(acc[dateCol])) : 0;
    const nxt = r[dateCol] ? +new Date(String(r[dateCol])) : 0;
    if (nxt > cur) acc[dateCol] = r[dateCol];

    if (!acc.remark && r.remark) acc.remark = r.remark as string;

    for (const col of imageCols) {
      const urls = parseImageUrls(r[col]);
      if (urls.length) (acc.all_photos as string[]).push(...urls);
    }
  }

  const out: Row[] = Array.from(byVisit.values()).map((x) => {
    const seen = new Set<string>();
    const uniq = (x.all_photos as string[]).filter((u) => {
      if (seen.has(u)) return false;
      seen.add(u);
      return true;
    });
    return { ...(x as Row), all_photos: uniq } as Row;
  });

  out.sort((a, b) => {
    const ta = a[dateCol] ? +new Date(String(a[dateCol])) : 0;
    const tb = b[dateCol] ? +new Date(String(b[dateCol])) : 0;
    return tb - ta;
  });

  return out;
}

const parseImageUrls = (data: unknown): string[] => {
  if (Array.isArray(data)) return data as string[];
  if (typeof data === "string") {
    try {
      const p: unknown = JSON.parse(data);
      if (Array.isArray(p)) return p as string[];
    } catch {
      return data
        .replace(/[{}]/g, "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
};

const asRowArray = (x: unknown): Row[] => (Array.isArray(x) ? (x as unknown as Row[]) : []);

const formatOnlyDate = (isoOrDateLike: unknown) => {
  if (!isoOrDateLike) return "";
  try {
    const d = new Date(String(isoOrDateLike));
    if (Number.isNaN(+d)) return String(isoOrDateLike);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return String(isoOrDateLike);
  }
};

const normalizeJp = (raw: string | null | undefined) => {
  const s = String(raw || "").trim().toLowerCase();
  const isIn = s === "in" || s === "in jp" || s.includes("in_jp") || s.includes("in-jp") || s.includes("داخل");
  const isOut = s === "out" || s === "out of jp" || s.includes("out_jp") || s.includes("out-jp") || s.includes("خارج");
  if (isIn) return { kind: "IN" as const, labelAr: "داخل", labelEn: "IN" };
  if (isOut) return { kind: "OUT" as const, labelAr: "خارج", labelEn: "OUT" };
  return { kind: "" as const, labelAr: "—", labelEn: "—" };
};

/* ========= Component ========= */
export default function StepDataTable({
  step,
  visitIds = [],
  startDate,
  endDate, // eslint-disable-line @typescript-eslint/no-unused-vars
  userId,
  pageSize = 30,
  users = [],
  jpState,
}: Props) {
  const { isArabic: ar } = useLangTheme();

  const [rows, setRows] = useState<Row[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  // خريطة تربط أي اسم (عربي/إنجليزي) بسجل المنتج لعرض الاسم الصحيح
const [productByAnyName, setProductByAnyName] = useState<Map<string, { name: string | null; arabic_name: string | null }>>(new Map());
const [loadingProducts, setLoadingProducts] = useState(false);

  const [lightbox, setLightbox] = useState<{ open: boolean; images: ImgRef[]; idx: number }>({
    open: false,
    images: [],
    idx: 0,
  });
  
  const [productNames, setProductNames] = useState<Map<UUID, string>>(new Map());
  const [resolvedUsers, setResolvedUsers] = useState<UserRow[]>(users);

  const cfg: StepConfig = VISIT_STEPS[step];
  const dateCol = useMemo(() => dateColumnFor(step), [step]);
  const idsKey = useMemo(() => visitIds.join("|"), [visitIds]);

  const usersMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const u of resolvedUsers) {
      const label = (ar ? u.arabic_name : u.name) || u.username || u.id;
      m.set(u.id, label);
      if (u.auth_user_id) m.set(u.auth_user_id, label);
    }
    return m;
  }, [resolvedUsers, ar]);

  // === Lookup cache (e.g., user_id -> Users.name/arabic_name) ===
  const [lookupMaps, setLookupMaps] = useState<Record<string, Map<string, string>>>({});

 useEffect(() => {
  const entries = cfg.lookups ? Object.entries(cfg.lookups) : [];
  if (!entries.length || !rows.length) {
    setLookupMaps({});
    return;
  }
  let alive = true;

  (async () => {
    type AnyRow = Record<string, unknown>;
    const asRows = (x: unknown): AnyRow[] => (Array.isArray(x) ? (x as unknown as AnyRow[]) : []);
    const next: Record<string, Map<string, string>> = {};

    for (const [colKey, lk] of entries) {
      const ids = Array.from(
        new Set(rows.map((r) => (r[colKey] as string | null) || null).filter((x): x is string => !!x))
      );
      if (!ids.length) continue;

      // الأعمدة المطلوبة لكل جدول
      let selectStr = lk.select;
      if (lk.table === "Users") selectStr = "id, auth_user_id, name, arabic_name, username";
      if (lk.table === "Markets") selectStr = "id, branch, store"; // نجيب store كاحتياط
      if (lk.table === "Products") selectStr = "id, name, arabic_name";
      const { data: byIdRaw } = await supabase.from(lk.table).select(selectStr).in("id", ids);
      const byId = asRows(byIdRaw);

      // دعم auth_user_id لجدول Users فقط
      let byAuth: AnyRow[] = [];
      if (lk.table === "Users") {
        const { data: byAuthRaw } = await supabase.from(lk.table).select(selectStr).in("auth_user_id", ids);
        byAuth = asRows(byAuthRaw);
      }

      const merged = [...byId, ...byAuth];
      const labelKey = ar ? (lk.labelFieldAr || lk.labelField) : lk.labelField;

      const map = new Map<string, string>();
      for (const row of merged) {
        const id = String(row["id"]);
        const auth = lk.table === "Users" && row["auth_user_id"] ? String(row["auth_user_id"]) : null;

        // 👇 هنا العرض للـ branch فقط (ولو فاضي رجّع store، ولو كله فاضي رجّع id)
        let label: string;
        if (lk.table === "Markets") {
          const branch = (row["branch"] as string) || "";
          const store = (row["store"] as string) || "";
          label = branch || store || id;
        } else {
          label =
            (row[labelKey] as string) ||
            (row[lk.labelField] as string) ||
            (row["arabic_name"] as string) ||
            (row["name"] as string) ||
            (row["username"] as string) ||
            id;
        }

        map.set(id, label);
        if (auth) map.set(auth, label);
      }

      next[colKey] = map;
    }

    if (alive) setLookupMaps(next);
  })();

  return () => {
    alive = false;
  };
}, [rows, cfg.lookups, ar]);

// ===== Fetch product names for Damage Reports & WHCount =====
useEffect(() => {
  if (!["damage_reports", "whcount"].includes(step)) {
    setProductByAnyName(new Map());
    return;
  }

  if (!rows || rows.length === 0) return;

  let alive = true;
  (async () => {
    setLoadingProducts(true);

    // ✅ اجمع كل أسماء المنتجات الظاهرة (AR + EN)
    const names = Array.from(
      new Set(
        rows
          .map((r) => String(r["item_name"] || "").trim())
          .filter((x) => x && x !== "null" && x !== "undefined")
      )
    );

    if (names.length === 0) {
      if (alive) setProductByAnyName(new Map());
      setLoadingProducts(false);
      return;
    }

    // ✅ استخدم استعلام مزدوج مستقل بدل .or()
    const [byName, byArName] = await Promise.all([
      supabase.from("Products").select("id, name, arabic_name").in("name", names),
      supabase.from("Products").select("id, name, arabic_name").in("arabic_name", names),
    ]);

    const all = [
      ...(byName.data ?? []),
      ...(byArName.data ?? []),
    ];

    const map = new Map<string, { name: string | null; arabic_name: string | null }>();
    for (const p of all) {
      const name = (p.name || "").trim();
      const arName = (p.arabic_name || "").trim();
      if (name) map.set(name, { name, arabic_name: arName });
      if (arName) map.set(arName, { name, arabic_name: arName });
    }

    if (alive) {
      setProductByAnyName(map);
      setLoadingProducts(false);
    }
  })();

  return () => {
    alive = false;
  };
}, [rows, step]);



 // SELECT: always include user_id & dateCol; NO Markets join
const selectCols = useMemo(() => {
  const base = VISIT_STEPS[step].select || "*";
  const cols = base
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // نضيف user_id فقط لو مش موجود فعلاً
  if (!cols.includes("user_id")) cols.push("user_id");
  // نضيف العمود الزمني فقط لو مش موجود
  if (!cols.includes(dateCol)) cols.push(dateCol);

  return cols.join(", ");
}, [step, dateCol]);

const visitIdsKey = useMemo(() => visitIds.join("|"), [visitIds]);
const dataReady =
  !loading &&
  !loadingProducts &&
  rows.length > 0 &&
  (!cfg.lookups || Object.keys(cfg.lookups).length === 0 || Object.keys(lookupMaps).length > 0);

   /* ===== Fetch step rows ===== */
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);

      const needsVisitIds = step !== "promoter_reports";
      if ((needsVisitIds && !visitIds.length) || !startDate) {
        setRows([]); setCount(0); setLoading(false);
        return;
      }
      // دالة صغيرة تشغّل الاستعلام مع select معيّن
const run = async (sel: string) => {
  // ⚙️ استخدم count = null لتسريع الاستعلام
 let q = supabase.from(cfg.table).select(sel, { count: "exact" as const });

  // ✅ فلترة حسب الزيارة + التاريخ معًا إن وُجدا
if (visitIds?.length) {
  q = q.in("visit_id", visitIds);
}
if (startDate) {
  const { fromISO, toISO } = toKsaDayRange(startDate);
  q = q.gte(dateCol, fromISO).lt(dateCol, toISO);
}

  // ✅ فلترة المستخدم
  if (userId) {
    const authId = resolvedUsers.find((u) => u.id === userId)?.auth_user_id;
    const usesAuthUsers = ["whcount", "sos_reports"];
    if (usesAuthUsers.includes(step)) {
      q = q.eq("user_id", authId || userId);
    } else {
      if (authId) q = q.or(`user_id.eq.${userId},user_id.eq.${authId}`);
      else q = q.eq("user_id", userId);
    }
  }

  // ✅ تخصيص استعلام الخطوات الثقيلة (availability / damage_reports)
  if (["availability", "damage_reports"].includes(step)) {
    q = q.limit(200);
  } else {
    q = q
      .order(cfg.defaultOrder?.column ?? dateCol, {
        ascending: cfg.defaultOrder?.ascending ?? false,
      })
      .limit(pageSize);
  }

  const { data, count: c, error } = await q;
  return { data: asRowArray(data), count: c ?? (data?.length ?? 0), error };
};


      // جرّب أولًا بالـ selectCols، ولو فشل ارجع جرّب بـ *
      let res = await run(selectCols);

if (!res || res.error) {
  console.warn("[StepDataTable] select failed, falling back to '*':", res?.error);
  res = await run("*");
}

if (!alive) return;

if (res?.error) {
  console.warn("[StepDataTable] fetch error (after fallback):", res.error);
  setRows([]); setCount(0); setLoading(false);
  return;
}

// ✅ خليه هنا مرة واحدة فقط
let dataArr = res?.data ?? [];

// ✅ لو كانت الخطوة sos_reports نوحّد الفئة حسب اللغة
if (step === "sos_reports") {
  dataArr = dataArr.map((r) => ({
    ...r,
    category_name: ar ? r.category_name_ar : r.category_name_en,
  }));
}

setRows(dataArr);
setCount(res?.count || dataArr.length);


      if (step === "tl_details") {
        const imageCols = cfg.columns.filter((c) => c.type === "image").map((c) => c.key);
        const grouped = groupTlDetailsRows(dataArr, imageCols, dateCol);
        setRows(grouped);
        setCount(grouped.length);
        setLoading(false);
        return;
      }

      if (step === "promoter_plus_reports") {
        type ItemJson = { product_id: string; available: boolean; quantity: number; [k: string]: unknown };
        const flattened: Row[] = [];
        for (const row of dataArr) {
          const items = row.items as ItemJson[] | null;
          if (items?.length) {
            items.forEach((item, idx) => {
              flattened.push({
                ...row,
                photos: idx === 0 ? row.photos : undefined,
                product_id: item.product_id,
                is_available: item.available,
                quantity: item.quantity,
                items: undefined,
              });
            });
          } else {
            flattened.push({
              ...row,
              photos: row.photos,
              product_id: ar ? "لا توجد عناصر" : "No items",
              is_available: false,
              quantity: 0,
              items: undefined,
            });
          }
        }
        dataArr = flattened;
      }

      setRows(dataArr);
      setCount(res?.count ?? dataArr.length);
      setLoading(false);
    })();

    return () => { alive = false; };
  }, [
    cfg.table, cfg.columns, cfg.defaultOrder?.column, cfg.defaultOrder?.ascending,
    selectCols, dateCol, idsKey, pageSize, step, visitIds, startDate, userId, resolvedUsers, ar, visitIdsKey
  ]);

  /* ===== Fetch Users (fallback) ===== */
  useEffect(() => {
    if (users && users.length) {
      setResolvedUsers(users);
      return;
    }
    const ids = Array.from(
      new Set(rows.map((r) => String(r["user_id"] || "")).filter((x) => x && x !== "null" && x !== "undefined"))
    );
    if (!ids.length) {
      setResolvedUsers([]);
      return;
    }
    let alive = true;
    (async () => {
      const sel = "id, auth_user_id, name, arabic_name, username, role, team_leader_id";
      const [{ data: byId }, { data: byAuth }] = await Promise.all([
        supabase.from("Users").select(sel).in("id", ids),
        supabase.from("Users").select(sel).in("auth_user_id", ids),
      ]);
      if (!alive) return;

      const merged = [...(byId ?? []), ...(byAuth ?? [])] as UserRow[];
      setResolvedUsers(Array.from(new Map(merged.map((u) => [u.id, u])).values()));
    })();
    return () => {
      alive = false;
    };
  }, [rows, users]);

  /* ===== Fetch Product Names (for Promoter Plus) ===== */
  useEffect(() => {
    if (step !== "promoter_plus_reports" || !rows.length) {
      setProductNames(new Map());
      return;
    }
    let alive = true;
    (async () => {
      const productIds = Array.from(new Set(rows.map((r) => r.product_id as string).filter(Boolean)));
      if (!productIds.length) {
        if (alive) setProductNames(new Map());
        return;
      }
      const { data } = await supabase.from("Products").select("id, name, arabic_name").in("id", productIds);
      if (!alive) return;
      const nameMap = new Map<UUID, string>();
      const nameKey = ar ? "arabic_name" : "name";
      for (const p of data ?? []) {
        nameMap.set(p.id, (p[nameKey] || p.name || p.id) as string);
      }
      setProductNames(nameMap);
    })();
    return () => {
      alive = false;
    };
  }, [rows, step, ar]);

  /* ===== Lightbox helpers ===== */
  const allVisitImages = useMemo(() => {
    const acc: { url: string; bucket?: string }[] = [];
    for (const r of rows) {
      for (const [k, v] of Object.entries(r)) {
        const key = k.toLowerCase();
        if (key === "all_photos") {
          const urls = (v as string[]) || [];
          urls.forEach((u) => acc.push({ url: u, bucket: undefined }));
          continue;
        }
        if (key.includes("image") || key.includes("photo") || key === "image_urls") {
          const urls = parseImageUrls(v);
          const colCfg = cfg.columns.find((c) => c.key === k);
          urls.forEach((u) => acc.push({ url: u, bucket: /^https?:\/\//i.test(u) ? undefined : colCfg?.bucketHint }));
        }
      }
    }
    const seen = new Set<string>();
    const out: { url: string; bucket?: string }[] = [];
    for (const it of acc) {
      const key = `${it.bucket ?? ""}::${it.url}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(it);
      }
    }
    return out;
  }, [rows, cfg.columns]);

  const openLightbox = (url: string) => {
    const idx = Math.max(0, allVisitImages.findIndex((x) => x.url === url));
    setLightbox({ open: true, images: allVisitImages, idx });
  };
  const closeLightbox = () => setLightbox((s) => ({ ...s, open: false }));
  const nextImg = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) e.stopPropagation();
    setLightbox((s) => ({ ...s, idx: (s.idx + 1) % (s.images.length || 1) }));
  };
  const prevImg = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) e.stopPropagation();
    setLightbox((s) => ({ ...s, idx: (s.idx - 1 + (s.images.length || 1)) % (s.images.length || 1) }));
  };

  // تنقّل بالكيبورد
  useEffect(() => {
    if (!lightbox.open) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") closeLightbox();
      if (ev.key === "ArrowRight") nextImg();
      if (ev.key === "ArrowLeft") prevImg();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox.open]);
const isLoadingEverything =
  loading || // التحميل الأساسي
  loadingProducts; // تحميل أسماء المنتجات فقط (بدون انتظار الـ lookups)

// ❌ تم حذف هذا الشرط لأنه كان يسبب التعليق
// || ((step === "damage_reports" || step === "whcount") && rows.length > 0 && productByAnyName.size === 0);
// 🕐 نضيف تأخير بسيط قبل عرض الجدول (1 ثانية فقط)
const [delayedReady, setDelayedReady] = useState(false);
useEffect(() => {
  if (!isLoadingEverything) {
    const timer = setTimeout(() => setDelayedReady(true), 1500); // 1 ثانية
    return () => clearTimeout(timer);
  } else {
    setDelayedReady(false);
  }
}, [isLoadingEverything]);

if (!delayedReady) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.03)",
        borderRadius: 12,
      }}
    >
      <div
        style={{
          width: 50,
          height: 50,
          borderRadius: "50%",
          border: "4px solid rgba(255,215,0,0.25)",
          borderTop: "4px solid gold",
          animation: "spin 1s linear infinite",
        }}
      />
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
      <div
        style={{
          position: "absolute",
          bottom: 25,
          fontSize: 14,
          color: "#bbb",
          fontWeight: 500,
        }}
      >
        {ar ? "جارٍ تحميل البيانات..." : "Loading data..."}
      </div>
    </div>
  );
}


const needsVisitIds = step !== "promoter_reports";

if ((needsVisitIds && visitIds.length === 0) || !startDate) {
  return <Empty text={ar ? "الرجاء اختيار زيارة أولاً" : "Please select a visit first"} />;
}
  if (!rows.length) return <Empty text={ar ? "لا توجد بيانات" : "No data"} />;

  // ===== Columns =====
  const rowKeys = Object.keys(rows[0] || {});
 const HIDDEN = new Set([
  "id",
  "visit_id",
  "customer_name",
  "Markets",
  "items",
  "updated_at",
  "client_id",
  "category_name_ar", // 👈 أضف دي
  "category_name_en", // 👈 ودي
   "item_code",
   "item_photo",
  ...((step === "promoter_plus_reports" || step === "availability") ? [] : ["product_id"]),
  ...(step === "promoter_plus_reports" ? ["user_id"] : []),
  ...(step === "remarks" || step === "availability" || step === "arrival_photos" || step === "promoter_reports"
    ? [] : ["user_id"]),
]);


  // 1) الترتيب المفضّل حسب تعريف config
  const preferredOrder = cfg.columns.map((c) => c.key);

  // 2) الأعمدة الظاهرة فعلاً وبنفس الترتيب المفضل
  let visibleColumns = preferredOrder.filter((k) => rowKeys.includes(k) && !HIDDEN.has(k));

  // 3) أي أعمدة إضافية ظهرت في الداتا وغير معرّفة في config نضيفها آخر الجدول
  for (const k of rowKeys) {
    if (!HIDDEN.has(k) && !visibleColumns.includes(k)) visibleColumns.push(k);
  }

  // 4) الحالات الخاصة
  if (step === "tl_details") {
    visibleColumns = ["all_photos", "remark", dateCol, "User", "jp_state_view"];
  } else if (step === "arrival_photos") {
    visibleColumns = visibleColumns.filter((k) => k !== "created_at");
    if (!visibleColumns.includes("arrival_time") && rowKeys.includes("arrival_time")) {
      visibleColumns.unshift("arrival_time");
    }
  }

  if (
    rowKeys.includes("user_id") &&
    !["promoter_reports", "remarks", "availability", "arrival_photos", "promoter_plus_reports"].includes(step)
  ) {
    const idx = visibleColumns.indexOf("market_id");
    const insertAt = idx >= 0 ? idx + 1 : visibleColumns.length;
    if (!visibleColumns.includes("User")) visibleColumns.splice(insertAt, 0, "User");
  }

  if (step === "promoter_reports" && visibleColumns.includes("use_count")) {
    const i = visibleColumns.indexOf("use_count");
    visibleColumns.splice(i, 1);
    const j = visibleColumns.indexOf("visit_count");
    const insertAt = j >= 0 ? j + 1 : visibleColumns.length;
    visibleColumns.splice(insertAt, 0, "use_count");
  }

  if (!visibleColumns.includes("jp_state_view")) {
    visibleColumns.push("jp_state_view");
  }

  // منع أي تكرار في الأعمدة (يحل تحذير مفاتيح React)
  visibleColumns = Array.from(new Set(visibleColumns));

  const getColCfg = (k: string) => cfg.columns.find((c) => c.key === k);
  const isImageCol = (k: string) => getColCfg(k)?.type === "image";

  const headerLabel = (k: string) => {
    const col = cfg.columns.find((c) => c.key === k);
    if (col) return ar ? col.labelAr || col.labelEn || k : col.labelEn || col.labelAr || k;
    const mapAr: Record<string, string> = {
      image_urls: "صور الزيارة",
      best_seller: "الأفضل مبيعاً",
      buy_count: "اشتري المنتج",
      refuse_count: "رفض الاستخدام",
      use_count: "استخدم",
      visit_count: "زيارة",
      created_at: "التاريخ",
      arrival_time: "التاريخ",
      market_id: "الفرع",
      User: "المستخدم",
      jp_state_view: "خط سير الزيارة",
      remark: "ملاحظة",
      photos: "الصور",
      product_id: "المنتجات",
      is_available: "التواجد",
      quantity: "الكميات المباعه",
      photo_url: "الصور",
      all_photos: "الصور",
    };
    const mapEn: Record<string, string> = {
      image_urls: "Visit Images",
      best_seller: "Best Seller",
      buy_count: "Bought",
      refuse_count: "Refused",
      use_count: "Use count",
      visit_count: "Visits",
      created_at: "Date",
      arrival_time: "Date",
      market_id: "Market",
      User: "User",
      jp_state_view: "JP State",
      photos: "Photos",
      product_id: "Products",
      is_available: "Availability",
      quantity: "SOLD QTY",
      photo_url: "Photos",
      all_photos: "Photos",
    };
    const dict = ar ? mapAr : mapEn;
    return dict[k] || k;
  };

  const onPrevClick = (e: React.MouseEvent<HTMLButtonElement>) => prevImg(e);
  const onNextClick = (e: React.MouseEvent<HTMLButtonElement>) => nextImg(e);
  // ===== Loading Overlay أثناء تحميل البيانات أو المنتجات =====
if (!dataReady) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.03)",
        borderRadius: 12,
      }}
    >
      <div
        style={{
          width: 50,
          height: 50,
          borderRadius: "50%",
          border: "4px solid rgba(255,215,0,0.25)",
          borderTop: "4px solid gold",
          animation: "spin 1s linear infinite",
        }}
      />
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
      <div
        style={{
          position: "absolute",
          bottom: 25,
          fontSize: 14,
          color: "#bbb",
          fontWeight: 500,
        }}
      >
        {ar ? "جارٍ تحميل البيانات..." : "Loading data..."}
      </div>
    </div>
  );
}
    return (
  <>
    {/* ✅ أثناء التحميل الجزئي (lookup/products) نعرض سبينر overlay فوق الجدول */}
    <div style={{ position: "relative", overflowX: "auto" }}>
      {(loading || loadingProducts) && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            backdropFilter: "blur(2px)",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              border: "4px solid rgba(255,215,0,0.25)",
              borderTop: "4px solid gold",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <style jsx>{`
            @keyframes spin {
              from {
                transform: rotate(0deg);
              }
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
      )}

      {/* الجدول */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          visibility:
  loading || loadingProducts
    ? "hidden"
    : "visible",
        }}
      >

          <thead>
            <tr>
              {visibleColumns.map((k) => (
                <th
                  key={k}
                  style={{
                    textAlign: ar ? "right" : "left",
                    borderBottom: "1px solid var(--divider)",
                    padding: "8px 6px",
                  }}
                >
                  {headerLabel(k)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
               {visibleColumns.map((k) => {
  // ✅ إخفاء عمود كود الصنف نهائيًا
  if (k === "item_code") {
    return null;
  }

  // ✅ تعديل اسم الصنف في المستودع حسب اللغة
  if (k === "item_name" && step === "whcount") {
    const rawName = String(r[k] ?? "").trim();

    // ✅ ترجمة كلمة __MAIN__
    if (rawName === "__MAIN__") {
      return (
        <td key={k} style={cellStyle}>
          {ar ? "صورة المستودع" : "WH Photo"}
        </td>
      );
    }

    // ✅ لو المنتج موجود في Products نعرض الاسم الصحيح حسب اللغة
    const prod = productByAnyName.get(rawName);
    const localized = prod
      ? ar
        ? prod.arabic_name || prod.name || rawName
        : prod.name || prod.arabic_name || rawName
      : rawName;

    return (
      <td key={k} style={cellStyle}>
        {localized}
      </td>
    );
  }

  // A) User synthetic column
  if (k === "User") {
    const id = r["user_id"] as string;
    const label =
      lookupMaps["user_id"]?.get(id) ||
      usersMap.get(id) ||
      (() => {
        const u = resolvedUsers.find((u) => u.id === id || u.auth_user_id === id);
        if (!u) return undefined;
        return (ar ? u.arabic_name : u.name) || u.username || u.id;
      })() ||
      id;

    return (
      <td key="user-name" style={cellStyle}>
        {label}
      </td>
    );
  }

// Notes mapping (instore / flyer / extra visibility)
if (k === "notes") {
  const value = formatPromoNote(r[k], ar);
  // لون مميز لكل نوع
  const color = "#fff";
let bg = "#444";
  if (value.includes("عرض") || value.toLowerCase().includes("in-store")) bg = "#2b6cb0"; // أزرق
  if (value.includes("بروشور") || value.toLowerCase().includes("flyer")) bg = "#2b6cb0"; // وردي
  if (value.includes("مساحة") || value.toLowerCase().includes("extra")) bg = "#2b6cb0"; // ذهبي

  return (
    <td key={k} style={cellStyle}>
      <span
        style={{
          background: bg,
          color,
          fontWeight: 600,
          fontSize: 13,
          padding: "4px 10px",
          borderRadius: 8,
          display: "inline-block",
          textAlign: "center",
          whiteSpace: "nowrap",
          minWidth: 100,
        }}
      >
        {value}
      </span>
    </td>
  );
}

                  // B) Generic lookup columns
                  const colCfg = getColCfg(k);
                  if (colCfg?.lookup) {
                    const raw = r[k] as string | null;
                    const label = (raw && lookupMaps[colCfg.lookup]?.get(raw)) || raw || "";
                    return (
                      <td key={k} style={cellStyle}>
                        {label}
                      </td>
                    );
                  }

                  // C) Image columns (+ hide duplicates for availability)
                  if (isImageCol(k)) {
                    let shouldHide = false;
                    if (step === "availability" && i > 0) {
                      const prevRow = rows[i - 1];
                      const currRow = r;
                      if (k === "category_photos") {
                        if (prevRow.category_id === currRow.category_id) shouldHide = true;
                      } else if (k === "place_photos") {
                        if (prevRow.category_id === currRow.category_id && prevRow.place_id === currRow.place_id)
                          shouldHide = true;
                      }
                    }
                    if (shouldHide) {
                      return <td key={k} style={cellStyle}></td>;
                    }

                    const urls = parseImageUrls(r[k]);
                    const c = getColCfg(k);
                    const bucket = c?.bucketHint;
                    return (
                      <td key={k} style={{ ...cellStyle, whiteSpace: "nowrap", verticalAlign: "middle" }}>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "nowrap",
                            gap: 6,
                            overflowX: "auto",
                            padding: "2px 0",
                            scrollbarWidth: "thin",
                          }}
                        >
                          {urls.map((url, idx) => (
                            <button
                              key={`${url}-${idx}`}
                              onClick={() => openLightbox(url)}
                              title={ar ? "عرض" : "View"}
                              style={{
                                flex: "0 0 auto",
                                width: 40,
                                height: 40,
                                borderRadius: 4,
                                overflow: "hidden",
                                border: "1px solid var(--divider)",
                                cursor: "pointer",
                                padding: 0,
                                background: "transparent",
                              }}
                            >
                              <SupaImg
                                src={url}
                                bucketHint={/^https?:\/\//i.test(url) ? undefined : bucket}
                                alt={`img-${idx + 1}`}
                                objectFit="cover"
                                width={40}
                                height={40}
                              />
                            </button>
                          ))}
                        </div>
                      </td>
                    );
                  }

                  // D) TL aggregated photos
                  if (k === "all_photos") {
                    const urls = (r.all_photos as string[]) || [];
                    return (
                      <td key={k} style={{ ...cellStyle, whiteSpace: "nowrap", verticalAlign: "middle", maxWidth: 360 }}>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "nowrap",
                            gap: 6,
                            overflowX: "auto",
                            padding: "2px 0",
                            scrollbarWidth: "thin",
                          }}
                        >
                          {urls.map((url, idx) => (
                            <button
                              key={`${url}-${idx}`}
                              onClick={() => openLightbox(url)}
                              title={ar ? "عرض" : "View"}
                              style={{
                                flex: "0 0 auto",
                                width: 40,
                                height: 40,
                                borderRadius: 4,
                                overflow: "hidden",
                                border: "1px solid var(--divider)",
                                cursor: "pointer",
                                padding: 0,
                                background: "transparent",
                              }}
                            >
                              <SupaImg src={url} alt={`img-${idx + 1}`} objectFit="cover" width={40} height={40} />
                            </button>
                          ))}
                        </div>
                      </td>
                    );
                  }

                  // E) Legacy image_urls
                  if (k === "image_urls") {
                    const urls = parseImageUrls(r[k]);
                    const c = cfg.columns.find((c) => c.key === k);
                    const bucket = c?.bucketHint;
                    return (
                      <td key={k} style={{ ...cellStyle, whiteSpace: "nowrap", verticalAlign: "middle" }}>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "nowrap",
                            gap: 6,
                            overflowX: "auto",
                            padding: "2px 0",
                            scrollbarWidth: "thin",
                          }}
                        >
                          {urls.map((url, idx) => (
                            <button
                              key={`${url}-${idx}`}
                              onClick={() => openLightbox(url)}
                              title={ar ? "عرض" : "View"}
                              style={{
                                flex: "0 0 auto",
                                width: 40,
                                height: 40,
                                borderRadius: 4,
                                overflow: "hidden",
                                border: "1px solid var(--divider)",
                                cursor: "pointer",
                                padding: 0,
                                background: "transparent",
                              }}
                            >
                              <SupaImg
                                src={url}
                                bucketHint={/^https?:\/\//i.test(url) ? undefined : bucket}
                                alt={`img-${idx + 1}`}
                                objectFit="cover"
                                width={40}
                                height={40}
                              />
                            </button>
                          ))}
                        </div>
                      </td>
                    );
                  }
// Item name (damage_reports): اعرض حسب اللغة لو وجدنا المنتج
if (k === "item_name" && step === "damage_reports") {
  const rawName = String(r[k] ?? "").trim();
  const prod = productByAnyName.get(rawName);
  const localized = prod ? (ar ? (prod.arabic_name || prod.name || rawName) : (prod.name || prod.arabic_name || rawName)) : rawName;

  return (
    <td key={k} style={cellStyle}>
      {localized}
    </td>
  );
}

                  // F) Product name mapping
                  if (k === "product_id") {
                    const pid = r[k] as string;
                    const productName = productNames.get(pid) || pid;
                    return (
                      <td key={k} style={cellStyle}>
                        {productName}
                      </td>
                    );
                  }

                  // G) Market label
if (k === "market_id") {
  const raw = r[k] as string | null;
  // جرّب من الـ lookup أولاً
  const fromLookup = raw ? lookupMaps["market_id"]?.get(raw) : null;

  if (fromLookup) {
    return <td key={k} style={cellStyle}>{fromLookup}</td>;
  }

  // توافقاً مع الكود القديم لو كان فيه Markets(...) join
  const m = r["Markets"] as MarketInfoRow | undefined;
  const fallback = (m?.store ? `${m.store}${m?.branch ? " - " : ""}` : "") + (m?.branch || "");

  return (
    <td key={k} style={cellStyle}>
      {fallback || (raw ?? "")}
    </td>
  );
}

                  // H) Dates
                  if (k === "created_at" || k === "arrival_time") {
                    return (
                      <td key={k} style={cellStyle}>
                        {formatOnlyDate(r[k])}
                      </td>
                    );
                  }

                  // I) JP state — فضّل قيمة الصف ثم prop
                  if (k === "jp_state_view") {
                    const raw = (r["jp_state"] as string | null | undefined) ?? jpState;
                    const norm = normalizeJp(raw);
                    const variant = norm.kind === "IN" ? "success" : norm.kind === "OUT" ? "danger" : "neutral";
                    return (
                      <td key={k} style={cellStyle}>
                        <BadgePill variant={variant}>{ar ? norm.labelAr : norm.labelEn}</BadgePill>
                      </td>
                    );
                  }

                  // Availability cell style
                  if (k === "is_available") {
                    const val = r[k];
                    const label = val === true ? (ar ? "متوفر" : "Available") : ar ? "غير متوفر" : "Not Available";
                    const color = val === true ? "var(--success-text, #28a745)" : "var(--danger-text, #dc3545)";
                    return (
                      <td key={k} style={{ ...cellStyle, color: color, fontWeight: 500 }}>
                        {label}
                      </td>
                    );
                  }

                  // J) Default
                  return (
                    <td key={k} style={cellStyle}>
                      {String(r[k] ?? "")}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
          {ar ? "العدد:" : "Count:"} {count}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox.open && (
        <div
          onClick={closeLightbox}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            cursor: "pointer",
            padding: 12,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              width: "min(92vw, 1200px)",
              height: "min(88vh, 800px)",
              borderRadius: 8,
              overflow: "hidden",
              border: "2px solid #fff",
              background: "#000",
            }}
          >
            <SupaImg
              src={lightbox.images[lightbox.idx]?.url}
              bucketHint={lightbox.images[lightbox.idx]?.bucket}
              alt={`preview-${lightbox.idx + 1}`}
              objectFit="contain"
              fill
              unoptimized
            />
            {lightbox.images.length > 1 && (
              <>
                <button onClick={onPrevClick} aria-label="previous" title={ar ? "السابق" : "Previous"} style={navBtnStyle("left")}>
                  ‹
                </button>
                <button onClick={onNextClick} aria-label="next" title={ar ? "التالي" : "Next"} style={navBtnStyle("right")}>
                  ›
                </button>
                <div
                  style={{
                    position: "absolute",
                    bottom: 8,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "rgba(0,0,0,.55)",
                    color: "#fff",
                    padding: "4px 10px",
                    borderRadius: 999,
                    fontSize: 12,
                  }}
                >
                  {lightbox.idx + 1} / {lightbox.images.length}
                </div>
              </>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeLightbox();
              }}
              aria-label="close"
              title={ar ? "إغلاق" : "Close"}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,.25)",
                background: "rgba(0,0,0,.5)",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const cellStyle: React.CSSProperties = {
  borderBottom: "1px solid var(--divider)",
  padding: "8px 6px",
  fontSize: 13,
  verticalAlign: "middle",
};

function navBtnStyle(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    top: "50%",
    [side]: 8,
    transform: "translateY(-50%)",
    width: 40,
    height: 40,
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,.25)",
    background: "rgba(0,0,0,.5)",
    color: "#fff",
    fontSize: 24,
    lineHeight: "38px",
    textAlign: "center",
    cursor: "pointer",
    userSelect: "none",
    direction: "ltr",
    unicodeBidi: "isolate",
  } as React.CSSProperties;
}
