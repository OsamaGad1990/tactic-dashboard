import { useCallback, useEffect, useMemo, useState } from "react";
// ⛔️ تم حذف rpcVisitCardsTotals لأننا سنستخدم rpc مباشرة
import { rpcAvailabilityTotals } from "@/services/dashboard-rpc";
import { supabase } from "@/lib/supabaseClient";
import { fetchAllRows } from "@/services/paging";
import { getEffectiveStores, norm } from "@/utils/filters";

/** ===== Types (لو عندك نفس النوع في ملف types استخدمه من هناك) ===== */
export type MarketRow = {
 id: string;
 region?: string | null;
 city?: string | null;
 store?: string | null;
};

type UserFiltersShape = {
 allowed_markets?: string[] | null;
 Team_leader?: string[] | null;
};

type FiltersInput = {
 region?: string;
 city?: string;
 market?: string;
 teamLeader?: string | null;
};

type HookParams = {
 clientId: string | null;
 markets: MarketRow[];
 userFilters: UserFiltersShape | null;
 filters: FiltersInput;
 dateFrom: string;
 dateTo: string;
};

type TotalsState = {
 totalProducts: number;
 totalAvailable: number;
 totalUnavailable: number;
 totalVisits: number;
 finishedVisits: number;
 unfinishedVisits: number;
 finishedPct: number;
 unfinishedPct: number;
 presenceSeconds: number;
 visitSeconds: number;
 transitSeconds: number;
};

type AvTotalsRow = {
 total_items: number | null;
 total_available: number | null;
 total_unavailable: number | null;
};

// ✅ النوع ده مطابق تماماً للي بترجعه دالة get_dashboard_metrics
type VisitCardsRow = {
 total_visits: number | null;
 finished_visits: number | null; // اسم الحقل في الدالة الجديدة
 incomplete_visits: number | null; // اسم الحقل في الدالة الجديدة
 finished_pct?: number | null; // الدالة الجديدة لا ترجع هذا
 unfinished_pct?: number | null; // الدالة الجديدة لا ترجع هذا
};

/** =============================================================== */
/**              THE HOOK               */
/** =============================================================== */
export function useDashboardStats(params: HookParams) {
 const { clientId, markets, userFilters, filters, dateFrom, dateTo } = params;

 // قيم فعّالة للاستعلامات
 const eff = useMemo(() => {
  const from = dateFrom || "1970-01-01";
  const to = dateTo || "2999-12-31";

  const store = (filters.market || "").trim() || null;
  const region = store ? null : (filters.region?.trim() || null);
  const city = store ? null : (filters.city?.trim() || null);

  const teamLeaderId =
   (filters.teamLeader || userFilters?.Team_leader?.[0] || "").trim() || null;

  return { from, to, region, city, store, teamLeaderId };
  // تاريخ من/إلى والفلترز فقط هما اللي لازم في الاعتماد
 }, [dateFrom, dateTo, filters, userFilters]);

 const [totals, setTotals] = useState<TotalsState>({
  totalProducts: 0,
  totalAvailable: 0,
  totalUnavailable: 0,
  totalVisits: 0,
  finishedVisits: 0,
  unfinishedVisits: 0,
  finishedPct: 0,
  unfinishedPct: 0,
  presenceSeconds: 0,
  visitSeconds: 0,
  transitSeconds: 0,
 });

 const run = useCallback(async () => {
  if (!clientId) return;

  // حدد المتاجر الفعّالة (بالأسماء) طبقًا للـ region/city + allowed_markets
  const storeList =
   getEffectiveStores(
    markets,
    { region: filters.region, city: filters.city, market: filters.market },
    userFilters?.allowed_markets || null
   ) || [];

  /** ================== Availability Totals ================== */
  let total_items = 0;
  let total_available = 0;
  let total_unavailable = 0;

  const callAV = async (store: string | null) => {
   // ✅ مهم: مرّر eff.region و eff.city حتى مع وجود store عشان تمنع تطابقات غامضة
   const { data, error } = await rpcAvailabilityTotals<AvTotalsRow>({
    p_client_id: clientId,
    p_from_date: eff.from,
    p_to_date: eff.to,
    p_region: eff.region,
    p_city: eff.city,
    p_store: store,
    p_team_leader_id: eff.teamLeaderId,
   });
   if (error) return;
   const r = data?.[0];
   total_items += Number(r?.total_items ?? 0);
   total_available += Number(r?.total_available ?? 0);
   total_unavailable += Number(r?.total_unavailable ?? 0);
  };

  if (storeList.length) {
   // ملاحظة: هذا اللوجيك صحيح لـ Availability إذا كانت الـ RPC لا تقبل مصفوفة متاجر
   for (const s of storeList) await callAV(s);
  } else {
   await callAV(eff.store);
  }

  //  ======  👇 التعديل بيبدأ هنا (استبدال منطق Visit Cards بالكامل)  ======

  /** ================== Visit Cards Totals (New Logic) ================== */

  // 1. !! هام: حدد أسماء الأعمدة الفعلية من جدول "Visits"
  // تأكد أن هذه الأسماء مطابقة لجدول "Visits" عندك
  const ACTUAL_DATE_COLUMN = "created_at"; // 👈 غيّر هذا لاسم عمود التاريخ الفعلي
  const ACTUAL_STATUS_COLUMN = "status"; // 👈 غيّر هذا لاسم عمود الحالة الفعلي
  const ACTUAL_COMPLETED_VALUE = "completed"; // 👈 غيّر هذا لقيمة الحالة "مكتمل"

  // 2. تجهيز باراميتر المتاجر (مصفوفة أو null)
  // الدالة الجديدة get_dashboard_metrics مصممة لاستقبال مصفوفة متاجر
  // بدلاً من اللف عليها، نرسل المصفوفة مرة واحدة
  let storesParam: string[] | null = storeList.length > 0 ? storeList : null;

  // حالة خاصة: لو storeList فاضية ولكن المستخدم اختار "متجر" محدد بالاسم
  if (!storesParam && eff.store) {
   storesParam = [eff.store];
  }

  // 3. استدعاء الدالة الجديدة المرنة مرة واحدة
  const { data: vcData, error: vcError } = await supabase.rpc<VisitCardsRow>(
   "get_dashboard_metrics",
   {
    // المتغيرات الأصلية (الأسماء مطابقة للدالة الجديدة)
    p_client: clientId,
    p_region: eff.region,
    p_city: eff.city,
    p_stores: storesParam, // 👈 إرسال المصفوفة
    p_date_from: eff.from,
    p_date_to: eff.to,

    // المتغيرات الجديدة من الدالة المرنة
    p_date_col: ACTUAL_DATE_COLUMN,
    p_status_col: ACTUAL_STATUS_COLUMN,
    p_completed_value: ACTUAL_COMPLETED_VALUE,
    
    // ملاحظة: الدالة الجديدة لا تستخدم team_leader_id حالياً
    // إذا أضفت الفلتر في الدالة، أضفه هنا
    // p_team_leader_id: eff.teamLeaderId,
   }
  );

  // 4. تعيين القيم
  const r = !vcError ? vcData?.[0] : null;
 const total_visits = Number(r?.total_visits ?? 0);
 const finished_visits = Number(r?.finished_visits ?? 0);
 const unfinished_visits = Number(r?.incomplete_visits ?? 0);

  //  ======  👆 التعديل بينتهي هنا  ======

  const finished_pct = total_visits ? (finished_visits / total_visits) * 100 : 0;
  const unfinished_pct = total_visits ? (unfinished_visits / total_visits) * 100 : 0;

  /** ================== Presence / Visit Time ================== */
  // (هذا الجزء لم يتغير لأنه يعتمد على views أخرى)
  let presenceSeconds = 0;

  {
   let q = supabase
    .from("v_presence_visit_unified")
    .select("presence_for_sum, store, region, city", { count: "exact", head: false })
    .eq("client_id", clientId)
    .gte("snapshot_date", eff.from)
    .lte("snapshot_date", eff.to);

   if (eff.region) q = q.eq("region", eff.region);
   if (eff.city) q = q.eq("city", eff.city);

   const listNorm = storeList.map(norm);
   if (listNorm.length > 1) {
    q = q.or(listNorm.map((s) => `store.ilike.*${s}*`).join(","));
   } else if (listNorm.length === 1) {
    q = q.ilike("store", `%${listNorm[0]}%`);
   } else if (eff.store) {
    q = q.ilike("store", `%${norm(eff.store)}%`);
   }

   if (eff.teamLeaderId) q = q.eq("team_leader_id", eff.teamLeaderId);

   type PresenceRow = { presence_for_sum: number | null };
   const { data, error } = await q;
   if (!error) {
    const rows = (data ?? []) as PresenceRow[];
    for (const r of rows) presenceSeconds += r.presence_for_sum ?? 0;
   }
  }

  // Visit time: باستخدام DailyVisitSnapshots (مختصرة بدون join مع TL)
  let visitSeconds = 0;

  {
   const needMarketFilter = !!(
    eff.region ||
    eff.city ||
    eff.store ||
    (storeList && storeList.length)
   );

   const marketsById: Record<string, MarketRow> = {};

   if (needMarketFilter) {
    const vIds = await fetchAllRows<{ market_id: string | null }>(
     "Visits",
     { client_id: clientId },
     "market_id"
    );
    const ids = Array.from(
     new Set(vIds.map((v) => v.market_id).filter((x): x is string => !!x))
    );
    if (ids.length) {
     const { data: mData } = await supabase
      .from("Markets")
      .select("id, region, city, store")
      .in("id", ids);
     for (const m of mData ?? []) marketsById[String((m as MarketRow).id)] = m as MarketRow;
    }
   }

   const q = supabase
    .from("DailyVisitSnapshots")
    .select("user_id, market_id, started_at, finished_at", { count: "exact", head: false })
    .eq("client_id", clientId)
    .gte("snapshot_date", eff.from)
    .lte("snapshot_date", eff.to)
    .not("started_at", "is", null)
    .not("finished_at", "is", null);
        
   // ملاحظة: هذا الكود لا يفلتر بـ teamLeaderId
   // إذا كنت بحاجة إليه، ستحتاج إلى join مع جدول Users أو client_users
   // if (eff.teamLeaderId) q = q.eq("user_id", ...); // (هذا يتطلب join)

   const { data, error } = await q;
   if (!error) {
    const rows =
     (data ?? []) as {
      user_id: string | null;
      market_id: string | null;
      started_at: string | null;
      finished_at: string | null;
     }[];

    const wantStoresNorm = storeList.map(norm);
    for (const r of rows) {
     if (needMarketFilter) {
      const m = r.market_id ? marketsById[String(r.market_id)] : undefined;
      if (!m) continue;

      const mRegion = norm(m.region);
      const mCity = norm(m.city);
      const mStore = norm(m.store);

      if (eff.region && mRegion !== norm(eff.region)) continue;
      if (eff.city && mCity !== norm(eff.city)) continue;

      if (wantStoresNorm.length) {
       if (!mStore || !wantStoresNorm.includes(mStore)) continue;
      } else if (eff.store && mStore !== norm(eff.store)) {
       continue;
      }
     }

     const start = r.started_at ? new Date(r.started_at).getTime() : 0;
     const end = r.finished_at ? new Date(r.finished_at).getTime() : 0;
     const diff = Math.max(0, Math.floor((end - start) / 1000));
     visitSeconds += diff;
    }
   }
  }

  const transitSeconds = Math.max(0, presenceSeconds - visitSeconds);

  setTotals({
   totalProducts: total_items,
   totalAvailable: total_available,
   totalUnavailable: total_unavailable,
   totalVisits: total_visits,
   finishedVisits: finished_visits,
   unfinishedVisits: unfinished_visits,
   finishedPct: finished_pct,
   unfinishedPct: unfinished_pct,
   presenceSeconds,
   visitSeconds,
   transitSeconds,
  });
 }, [clientId, markets, userFilters, filters, eff]); // eff يتضمن كل الاعتماديات

 useEffect(() => {
  void run();
 }, [run]);

 return totals;
}