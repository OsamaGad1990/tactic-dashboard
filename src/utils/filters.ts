import type { MarketRow } from "@/types";

export const norm = (s?: string | null) => (s ?? "").trim().toLowerCase();

export function getEffectiveStores(
  markets: MarketRow[],
  active: { region?: string; city?: string; market?: string | null },
  allowed_markets: string[] | null
): string[] | null {
  if (active.market) return [active.market];

  const allowedSet =
    allowed_markets && allowed_markets.length
      ? new Set(allowed_markets.map((s) => (s || "").trim().toLowerCase()))
      : null;

  let scoped = markets.filter(
    (m) =>
      (!active.region || m.region === active.region) &&
      (!active.city || m.city === active.city)
  );

  if (allowedSet) {
    scoped = scoped.filter((m) => {
      const s = (m.store || "").trim().toLowerCase();
      return s && allowedSet.has(s);
    });
  }

  const list = Array.from(
    new Set(scoped.map((m) => (m.store || "").trim()).filter(Boolean))
  );
  return list.length ? list : null;
}
