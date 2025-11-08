"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

/** النطاق الذي سنستخدمه لقفل البيانات على المستخدم المختار */
export type EffectiveScope = {
  market_ids: string[];
  region_names: string[];
  city_names: string[];
  store_names: string[];
  branch_names: string[];
};

type Options = {
  /** UUID للمستخدم المختار */
  selectedUserId?: string | null;
  /** يمكنك تمرير supabase مخصّص لو لديك، وإلا سيُستخدم المفعل من lib */
  client?: SupabaseClient;
};

/**
 * يجلب نطاق المستخدم من RPC: public.get_effective_scope
 * ويرجّعه كمصفوفات لاستخدامها في كل الاستعلامات لاحقًا.
 */
export function useScopeLock({ selectedUserId, client }: Options) {
  const sb = client ?? supabase;
  const [scope, setScope] = useState<EffectiveScope | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!selectedUserId) {
        setScope(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await sb.rpc("get_effective_scope", {
          p_user: selectedUserId,
        });

        if (!active) return;

        if (error) {
          setError(error.message ?? "RPC error");
          setScope({
            market_ids: [],
            region_names: [],
            city_names: [],
            store_names: [],
            branch_names: [],
          });
        } else {
          setScope({
            market_ids: data?.market_ids ?? [],
            region_names: data?.region_names ?? [],
            city_names: data?.city_names ?? [],
            store_names: data?.store_names ?? [],
            branch_names: data?.branch_names ?? [],
          });
        }
      } catch (e: unknown) {
  if (!active) return;
  const msg = e instanceof Error ? e.message : String(e);
  setError(msg || "Unknown error");
  setScope({
    market_ids: [],
    region_names: [],
    city_names: [],
    store_names: [],
    branch_names: [],
  });
}
    }

    load();
    return () => {
      active = false;
    };
  }, [selectedUserId, sb]);

  return { scope, loading, error };
}
