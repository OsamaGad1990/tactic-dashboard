export const LS_KEYS = { currentUser:"currentUser", lang:"lang", clientId:"client_id" } as const;

export type StoredUser = { id: string; username?: string; role?: string; email?: string; auth_user_id?: string; };

export function parseStoredUser(json: string | null): StoredUser | null {
  if (!json) return null;
  try { return JSON.parse(json) as StoredUser; } catch { return null; }
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  try {
    return parseStoredUser(localStorage.getItem(LS_KEYS.currentUser))
        || parseStoredUser(sessionStorage.getItem(LS_KEYS.currentUser));
  } catch { return null; }
}

export function toAvatarPublicUrl(supabaseUrl: string, raw?: string | null) {
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (!supabaseUrl) return "";
  return `${supabaseUrl}/storage/v1/object/public/avatars/${raw}`;
}
