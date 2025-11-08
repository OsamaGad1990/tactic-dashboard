// src/types/clients.ts
export type StagedClient = {
  client_code: string;
  name_ar: string;
  name_en?: string;
  tax_number?: string;
  phone?: string;
  email?: string;
  default_language?: 'ar' | 'en';
  active?: boolean;
  start_date?: string; // YYYY-MM-DD
};


export type StagedBranch = {
  client_code: string;
  branch_code: string;
  name_ar: string;
  name_en?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
};

type StagedUser = {
  client_code: string;
  email: string;
  full_name?: string;
  name?: string;
  arabic_name?: string;
  role: 'Promoter' | 'Merchandiser' | 'TeamLeader' | 'Admin';
  phone?: string;
};

type NormalizedNames = {
  name: string | null;         // EN
  arabic_name: string | null;  // AR
  username: string | null;
};

function isArabicLike(s?: string | null): boolean {
  if (!s) return false;
  // وجود أي حرف عربي (نطاق يونيكود العربي)
  return /[\u0600-\u06FF]/.test(s);
}

function cleanOrNull(s?: string | null): string | null {
  const t = (s ?? '').trim();
  return t.length ? t : null;
}

function slugifyBasic(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')      // remove diacritics
    .replace(/[^a-z0-9]+/g, '-')          // non-alnum → dash
    .replace(/^-+|-+$/g, '')              // trim dashes
    .slice(0, 32);
}

export function normalizeStagedUser(u: StagedUser): NormalizedNames {
  const emailLocal = cleanOrNull(u.email?.split('@')[0]);

  const explicitName = cleanOrNull(u.name);
  const explicitArName = cleanOrNull(u.arabic_name);
  const full = cleanOrNull(u.full_name);

  let name: string | null = explicitName;
  let arabic_name: string | null = explicitArName;

  // لو مفيش أي اسم صريح — وزّع من full_name
  if (!name && !arabic_name && full) {
    if (isArabicLike(full)) {
      arabic_name = full;
    } else {
      name = full;
    }
  }

  // username من الإيميل أولًا
  let username: string | null = emailLocal;

  if (!username) {
    // بعدين من EN name
    if (name) username = slugifyBasic(name);
    // أو من full_name (لو إنجليزي)
    else if (full && !isArabicLike(full)) username = slugifyBasic(full);
    // أو من arabic_name (هنحوّله سلاج بسيط)
    else if (arabic_name) username = slugifyBasic(arabic_name);
  }

  // تأكد إن الفارغ = null
  name = cleanOrNull(name);
  arabic_name = cleanOrNull(arabic_name);
  username = cleanOrNull(username);

  return { name, arabic_name, username };
}
