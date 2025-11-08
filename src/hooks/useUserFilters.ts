"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/** ========= Types ========= */
type UUID = string;

type UserRow = {
  id: UUID;
  auth_user_id: UUID | null;
};

type UserSettingsRow = {
  id: UUID;
  user_id: UUID | null;
  default_region: string[] | null;
  default_city: string[] | null;
  allowed_markets: string[] | null;
  Team_leader: UUID[] | null;
  /** الجدول كاتبه "notificatins" بغلط إملائي */
  notificatins: boolean | null;
  requests: boolean | null;
  created_at?: string;
};

type FiltersShape = {
  /** ناخد أول عنصر كقيمة افتراضية (ولو عايز أكتر من قيمة سيبه كمصفوفة) */
  default_region?: string[] | null;
  default_city?: string[] | null;
  allowed_markets?: string[] | null;
  Team_leader?: string[] | null;
  /** نعرّضها باسم صحيح في الكود */
  notifications?: boolean;
  requests?: boolean;
};

type HookReturn = {
  filters: FiltersShape | null;
  loading: boolean;
  /** يحفظ الافتراضات الحالية (Region/City/Market/TL) */
  saveDefaults: (opts: {
    region?: string | null;
    city?: string | null;
    market?: string | null;
    teamLeaderId?: string | null;
  }) => Promise<void>;
  /** يحدّث أعلام الإشعارات والطلبات */
  setNotifications: (val: boolean) => Promise<void>;
  setRequestsFlag: (val: boolean) => Promise<void>;
};

/** ========= helpers ========= */

/** رجّع id من جدول Users انطلاقًا من auth.user.id */
async function getUsersIdForAuth(authUid: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("Users")
    .select("id, auth_user_id")
    .eq("auth_user_id", authUid)
    .limit(1)
    .maybeSingle<UserRow>();

  if (error) {
    console.error("[useUserFilters] Users lookup error:", error);
    return null;
  }
  return data?.id ?? null;
}

/** أنشئ صف user_settings لو مش موجود */
async function ensureSettingsRow(userId: string): Promise<UserSettingsRow | null> {
  // حاول تجيب صف الإعدادات
  const { data: found, error: selErr } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle<UserSettingsRow>();

  if (!selErr && found) return found;

  // لو مش موجود — أنشئ صف افتراضي
  const { data: created, error: insErr } = await supabase
    .from("user_settings")
    .insert({
      user_id: userId,
      default_region: null,
      default_city: null,
      allowed_markets: null,
      Team_leader: null,
      notificatins: true, // افتراضي: يشغّل الإشعارات
      requests: true,     // افتراضي: يظهر الطلبات
    })
    .select("*")
    .single<UserSettingsRow>();

  if (insErr) {
    console.error("[useUserFilters] create user_settings error:", insErr);
    return null;
  }
  return created ?? null;
}

/** ========= hook ========= */
export function useUserFilters(): HookReturn {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [row, setRow] = useState<UserSettingsRow | null>(null);

  // boot: resolve auth -> Users.id -> user_settings row
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const { data: ses } = await supabase.auth.getSession();
        const authUid = ses?.session?.user?.id || null;
        if (!authUid) {
          setUserId(null);
          setRow(null);
          return;
        }
        const uId = await getUsersIdForAuth(authUid);
        if (!uId) {
          setUserId(null);
          setRow(null);
          return;
        }
        const ensured = await ensureSettingsRow(uId);
        if (!cancelled) {
          setUserId(uId);
          setRow(ensured);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /** واجهة أسهل للاستخدام في الصفحة */
  const filters: FiltersShape | null = useMemo(() => {
    if (!row) return null;
    return {
      default_region: row.default_region ?? null,
      default_city: row.default_city ?? null,
      allowed_markets: row.allowed_markets ?? null,
      Team_leader: (row.Team_leader ?? null)?.map(String) ?? null,
      notifications: row.notificatins ?? true, // نعرّضها باسم صحيح
      requests: row.requests ?? true,
    };
  }, [row]);

  const updateRow = useCallback(
    async (patch: Partial<UserSettingsRow>) => {
      if (!userId) return;
      const { data, error } = await supabase
        .from("user_settings")
        .update(patch)
        .eq("user_id", userId)
        .select("*")
        .single<UserSettingsRow>();
      if (error) {
        console.error("[useUserFilters] update error:", error);
        return;
      }
      setRow(data);
    },
    [userId]
  );

  /** حفظ الافتراضات حسب اختيارات المستخدم الحالية في الصفحة */
  const saveDefaults = useCallback(
    async ({
      region,
      city,
      market,
      teamLeaderId,
    }: {
      region?: string | null;
      city?: string | null;
      market?: string | null;
      teamLeaderId?: string | null;
    }) => {
      /** منطق الحفظ:
       *  - لو القيمة فاضية => نخزن NULL (يعني مفيش إجبار).
       *  - لو موجودة => نخزنها كمصفوفة فيها عنصر واحد.
       *  - allowed_markets: لو عايز تجبره على سوق معين، خزّن [market]
       *    ولو عايزه يفضل حر، خزّن NULL.
       */
      await updateRow({
        default_region: region ? [region] : null,
        default_city: city ? [city] : null,
        allowed_markets: market ? [market] : null,
        Team_leader: teamLeaderId ? [teamLeaderId as unknown as UUID] : null,
      });
    },
    [updateRow]
  );

  const setNotifications = useCallback(
    async (val: boolean) => {
      await updateRow({ notificatins: val });
    },
    [updateRow]
  );

  const setRequestsFlag = useCallback(
    async (val: boolean) => {
      await updateRow({ requests: val });
    },
    [updateRow]
  );

  return { filters, loading, saveDefaults, setNotifications, setRequestsFlag };
}
