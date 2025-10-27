// src/types.ts
export type UUID = string;

export type MarketRow = {
  id: UUID;
  region?: string | null;
  city?: string | null;
  store?: string | null;
};

export type TLUser = {
  id: UUID;
  username: string;
  arabic_name?: string | null;
};

// لو حابب توسّع لاحقًا: ClientRow / AvTotalsRow / VisitCardsRow ..الخ
