// src/app/services/paging.ts

import { supabase } from "@/lib/supabaseClient";

export type FilterPrimitive = string | number | boolean | null;

export async function fetchAllRows<T>(
  table: string,
  filters: Readonly<Record<string, FilterPrimitive>>,
  selectExp = "*"
): Promise<T[]> {
  const pageSize = 1000;
  let from = 0;
  let to = pageSize - 1;
  const out: T[] = [];

  while (true) {
    let q = supabase.from(table).select(selectExp);

    // typing آمن بدل any
    for (const k of Object.keys(filters)) {
      const v = filters[k];
      q = q.eq(k, v as string | number | boolean | null);
    }

    const { data, error } = await q.range(from, to);
    if (error) break;

    const rows = (data ?? []) as unknown as T[];
    if (!rows.length) break;

    out.push(...rows);
    if (rows.length < pageSize) break;

    from += pageSize;
    to += pageSize;
  }
  return out;
}
