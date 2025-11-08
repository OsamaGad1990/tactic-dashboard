"use client";
import type React from "react";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import RecipientDrawer from "./RecipientDrawer";
import { useLangTheme } from "@/hooks/useLangTheme";


/* ========== Types ========== */
type NotiRow = {
  id: string;
  created_at: string | null;
  client_id: string | null;
  title_ar: string | null;
  title_en: string | null;
  message_ar: string | null;
  message_en: string | null;
  team_leader: string | null;
  for_all: boolean | null;
  for_roles: string[] | null;
  for_user: string[] | null;
  for_user_single: string | null;
  completed_by: string[] | null;
  status: string | null; // PENDING, COMPLETED, NEW, etc.
  completed_at: string | null; // وقت إكمال عام (لو عايز وقت لكل مستخدم يبقى جدول ربط لاحقًا)
};

type UserMini = { id: string; username: string | null; arabic_name: string | null; role?: string | null };

/* ========== Utils ========== */
const normId = (v: unknown) => String(v ?? "").trim().toLowerCase();

function fmtDuration(start?: string | null, end?: string | null): string {
  if (!start || !end) return "—";
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (isNaN(s) || isNaN(e) || e < s) return "—";
  const diff = Math.floor((e - s) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  if (h === 0 && m === 0) return `${diff}s`;
  const parts: string[] = [];
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  return parts.join(" ");
}

export default function TeamNotificationsTab({ clientId }: { clientId: string | null }) {
  const { isArabic } = useLangTheme();

  // فلاتر
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [senderFilter, setSenderFilter] = useState<"" | "TL" | "ADMIN">("");
  const [notiTypeFilter, setNotiTypeFilter] = useState<"" | "ALL" | "ROLES" | "USERS">("");
  const [statusFilter, setStatusFilter] = useState<"" | "COMPLETED" | "PENDING">("");

  // بيانات
  const [loading, setLoading] = useState<boolean>(false);
  const [rows, setRows] = useState<NotiRow[]>([]);
  const [userInfoById, setUserInfoById] = useState<Record<string, { en?: string; ar?: string; role?: string }>>({});
  const [clientUsers, setClientUsers] = useState<UserMini[]>([]); // كل مستخدمي العميل (للأدوار/للجميع)

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [selected, setSelected] = useState<NotiRow | null>(null);

  /* ===== نطاق التاريخ: From ≤ To ===== */
  const onFromChange = (v: string) => {
    setDateFrom(v);
    if (dateTo && v) {
      const from = new Date(v);
      const to = new Date(dateTo);
      if (from > to) setDateTo(v);
    }
  };
  const onToChange = (v: string) => {
    setDateTo(v);
    if (dateFrom && v) {
      const from = new Date(dateFrom);
      const to = new Date(v);
      if (to < from) setDateFrom(v);
    }
  };

  const clearFilters = useCallback(() => {
    setDateFrom("");
    setDateTo("");
    setSenderFilter("");
    setNotiTypeFilter("");
    setStatusFilter("");
  }, []);

  const formatKSA = (iso: string | null) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleString("en-GB", {
        timeZone: "Asia/Riyadh",
        hour12: true,
      });
    } catch {
      return iso ?? "-";
    }
  };

  const displayName = (userId?: string | null) => {
    if (!userId) return "-";
    const info = userInfoById[String(userId)];
    if (!info) return String(userId);
    return isArabic ? info.ar || info.en || String(userId) : info.en || info.ar || String(userId);
  };

  /* ===== تحميل كل مستخدمي العميل (مرة واحدة) ===== */
  useEffect(() => {
    (async () => {
      if (!clientId) {
        setClientUsers([]);
        return;
      }
      const { data: map } = await supabase
        .from("client_users")
        .select("user_id")
        .eq("client_id", clientId)
        .eq("is_active", true);

      const ids = Array.from(new Set((map ?? []).map((r: { user_id: string }) => String(r.user_id))));
      if (ids.length === 0) {
        setClientUsers([]);
        return;
      }

      const { data: users } = await supabase
        .from("Users")
        .select("id,username,arabic_name,role")
        .in("id", ids);

      setClientUsers(((users as UserMini[]) ?? []).map(u => ({ ...u })));
    })();
  }, [clientId]);

  /* ===== تحميل قائمة الإشعارات ===== */
  const load = useCallback(async () => {
    setLoading(true);

    let q = supabase
      .from("Notifications")
      .select(
        "id,created_at,client_id,title_ar,title_en,message_ar,message_en,team_leader,for_all,for_roles,for_user,for_user_single,completed_by,status,completed_at"
      )
      .order("created_at", { ascending: false })
      .limit(500);

    if (clientId) q = q.eq("client_id", clientId);
    if (dateFrom) q = q.gte("created_at", dateFrom);
    if (dateTo) q = q.lte("created_at", dateTo);

    const { data, error } = await q;
    setRows(!error && data ? (data as NotiRow[]) : []);
    setLoading(false);
  }, [clientId, dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  /* ===== تحميل أسماء (المرسل والمستلمين المعرّفين IDs) لعرضها ===== */
  useEffect(() => {
    (async () => {
      const idsSet = new Set<string>();
      for (const r of rows) {
        if (r.team_leader) idsSet.add(String(r.team_leader));
        if (r.for_user_single) idsSet.add(String(r.for_user_single));
        (r.for_user ?? []).forEach((u) => idsSet.add(String(u)));
      }
      const ids = Array.from(idsSet);
      if (ids.length === 0) {
        setUserInfoById({});
        return;
      }
      const { data } = await supabase.from("Users").select("id,username,arabic_name,role").in("id", ids);
      const map: Record<string, { en?: string; ar?: string; role?: string }> = {};
      ((data as (UserMini & { role?: string })[]) || []).forEach((u) => {
        map[String(u.id)] = { en: u.username || undefined, ar: u.arabic_name || undefined, role: u.role || undefined };
      });
      setUserInfoById(map);
    })();
  }, [rows]);

  /* ===== حساب مستلمي الإشعار محليًا (نفس منطق التفاصيل) ===== */
  const computeRecipientsIds = useCallback(
  (n: NotiRow): string[] => {
    // 1) مستلمين مذكورين صراحةً
    const ids: string[] = [];  // ← كانت let، خلّيناها const
    if (n.for_user_single) ids.push(String(n.for_user_single));
    if (Array.isArray(n.for_user) && n.for_user.length > 0) ids.push(...n.for_user.map(String));
    if (ids.length > 0) return Array.from(new Set(ids.map(normId)));

      // 2) بالأدوار
      if (Array.isArray(n.for_roles) && n.for_roles.length > 0) {
        const wanted = new Set(n.for_roles.map((r) => r.toLowerCase()));
        const byRole = clientUsers.filter((u) => {
          const role = (u.role || "").toLowerCase();
          // دعم الأنماط المستخدمة سابقًا
          if (wanted.has("promoter") || wanted.has("promoplus")) {
            if (role.includes("promoter")) return true;
          }
          if (wanted.has("team_leader") || wanted.has("team leader") || wanted.has("teamleader") || wanted.has("teamleader")) {
            if (role.includes("team_leader") || role.includes("team leader")) return true;
          }
          if (wanted.has("mch") || wanted.has("merchandiser")) {
            if (role.includes("mch") || role.includes("merchandiser")) return true;
          }
          // fallback: تطابق مباشر
          return Array.from(wanted).some((w) => role === w);
        });
        return Array.from(new Set(byRole.map((u) => normId(u.id))));
      }

      // 3) للجميع
      if (n.for_all) {
        return Array.from(new Set(clientUsers.map((u) => normId(u.id))));
      }

      return [];
    },
    [clientUsers]
  );

  /* ===== تطبيق الفلاتر وحساب الحالة بنفس المنطق ===== */
  const finalRows = useMemo(() => {
    let filtered = rows;

    // مرسل
    if (senderFilter) {
      filtered = filtered.filter((n) => {
        const senderRole = (userInfoById[String(n.team_leader)]?.role || "").toLowerCase();
        if (!senderRole) return false;
        if (senderFilter === "TL") return senderRole.includes("team_leader");
        if (senderFilter === "ADMIN") return senderRole.includes("admin");
        return false;
      });
    }

    // نوع الإشعار
    if (notiTypeFilter) {
      filtered = filtered.filter((n) => {
        const hint = n.for_all
          ? "ALL"
          : n.for_user_single || (n.for_user && n.for_user.length > 0)
          ? "USERS"
          : n.for_roles && n.for_roles.length > 0
          ? "ROLES"
          : "UNKNOWN";
        return hint === notiTypeFilter;
      });
    }

    // الحالة (مكتمل = كل المستلمين في completed_by)
    if (statusFilter) {
      filtered = filtered.filter((n) => {
        const recIds = computeRecipientsIds(n);
        const completed = new Set((n.completed_by ?? []).map(normId));
        const completedCount = recIds.reduce((acc, id) => acc + (completed.has(id) ? 1 : 0), 0);
        const total = recIds.length;

        // دعم حالة مستلم واحد (لو total=1 يكفي completedCount>=1)
        const isAllDone = total > 0 && completedCount >= total;

        if (statusFilter === "COMPLETED") return isAllDone;
        if (statusFilter === "PENDING") return !isAllDone;
        return true;
      });
    }

    return filtered;
  }, [rows, userInfoById, senderFilter, notiTypeFilter, statusFilter, computeRecipientsIds]);

  /* ===== Render helpers ===== */
  const renderRecipients = (n: NotiRow): string => {
    if (n.for_user_single) {
      return displayName(n.for_user_single);
    }
    if (n.for_user && n.for_user.length > 0) {
      const names = n.for_user.map((id) => displayName(String(id)));
      if (names.length <= 3) return names.join(", ");
      return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
    }
    if (n.for_roles && n.for_roles.length > 0) {
      return (n.for_roles as string[]).join(", ");
    }
    if (n.for_all) {
      return isArabic ? "كل الشركة" : "All company";
    }
    return "-";
  };

  /* ===== UI ===== */
  return (
    <div>
      {/* Filters header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          justifyContent: "flex-start",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex" }}>
          <button onClick={load} style={btnRectPrimary}>
            {isArabic ? "تحديث" : "Refresh"}
          </button>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {/* المرسل */}
          <CapsuleItem label={isArabic ? "المرسل" : "Sender"}>
            <select
              className="capsule-select"
              value={senderFilter}
              onChange={(e) => setSenderFilter(e.target.value as "" | "TL" | "ADMIN")}
              style={capsuleSelectStyle}
            >
              <option value="">{isArabic ? "الكل" : "All"}</option>
              <option value="TL">{isArabic ? "قائد فريق" : "Team Leader"}</option>
              <option value="ADMIN">{isArabic ? "مسؤول" : "Admin"}</option>
            </select>
          </CapsuleItem>

          {/* النوع */}
          <CapsuleItem label={isArabic ? "النوع" : "Type"}>
            <select
              className="capsule-select"
              value={notiTypeFilter}
              onChange={(e) => setNotiTypeFilter(e.target.value as "" | "ALL" | "ROLES" | "USERS")}
              style={capsuleSelectStyle}
            >
              <option value="">{isArabic ? "الكل" : "All"}</option>
              <option value="USERS">{isArabic ? "مستخدم/ون" : "Users"}</option>
              <option value="ROLES">{isArabic ? "أدوار" : "Roles"}</option>
              <option value="ALL">{isArabic ? "كل الشركة" : "All Company"}</option>
            </select>
          </CapsuleItem>

          {/* الحالة */}
          <CapsuleItem label={isArabic ? "الحالة" : "Status"}>
            <select
              className="capsule-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "" | "COMPLETED" | "PENDING")}
              style={capsuleSelectStyle}
            >
              <option value="">{isArabic ? "الكل" : "All"}</option>
              <option value="COMPLETED">{isArabic ? "مكتملة" : "Completed"}</option>
              <option value="PENDING">{isArabic ? "معلقة" : "Pending"}</option>
            </select>
          </CapsuleItem>

          {/* التاريخ من */}
          <CapsuleItem label={isArabic ? "من" : "From"}>
            <DateField value={dateFrom} onChange={onFromChange} placeholder={isArabic ? "اختر تاريخ" : "Select Date"} />
          </CapsuleItem>

          {/* التاريخ إلى */}
          <CapsuleItem label={isArabic ? "إلى" : "To"}>
            <DateField value={dateTo} onChange={onToChange} placeholder={isArabic ? "اختر تاريخ" : "Select Date"} />
          </CapsuleItem>

          {/* إعادة التعيين */}
          <button onClick={clearFilters} style={btnRect}>
            {isArabic ? "إعادة تعيين" : "Reset Filters"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", border: "1px solid var(--divider)", borderRadius: 12 }}>
        <table
          style={{
            width: "100%",
            fontSize: 14,
            borderCollapse: "separate",
            borderSpacing: 0,
          }}
        >
          <thead style={{ background: "var(--header-bg)", color: "var(--header-fg)" }}>
            <tr>
              <Th>{isArabic ? "العنوان" : "Title"}</Th>
              <Th>{isArabic ? "المرسل" : "Sender"}</Th>
              <Th>{isArabic ? "المستلم/ين" : "Recipient(s)"}</Th>
              <Th>{isArabic ? "النطاق" : "Scope"}</Th>
              <Th>{isArabic ? "أُرسلت في" : "Sent At"}</Th>
              <Th>{isArabic ? "أُكملت في" : "Completed At"}</Th>
              <Th>{isArabic ? "مكتمل" : "Completed"}</Th>
              <Th>{isArabic ? "الوقت المستغرق" : "Time Taken"}</Th>
              <Th>{isArabic ? "تفاصيل" : "Details"}</Th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <Td colSpan={9}>{isArabic ? "جارِ التحميل…" : "Loading…"}</Td>
              </tr>
            ) : finalRows.length === 0 ? (
              <tr>
                <Td colSpan={9}>{isArabic ? "لا توجد إشعارات" : "No notifications"}</Td>
              </tr>
            ) : (
              finalRows.map((n) => {
                const scopeHint =
                  n.for_all
                    ? "ALL"
                    : n.for_user_single || (n.for_user && n.for_user.length > 0)
                    ? "USERS"
                    : n.for_roles && n.for_roles.length > 0
                    ? "ROLES"
                    : "UNKNOWN";

                // حساب الحالة بنفس منطق التفاصيل
                const recIds = computeRecipientsIds(n);
                const completed = new Set((n.completed_by ?? []).map(normId));
                const completedCount = recIds.reduce((acc, id) => acc + (completed.has(id) ? 1 : 0), 0);
                const total = recIds.length;
                const isAllDone = total > 0 && completedCount >= total;

                const doneDisplay = isAllDone ? "✓" : "—";
                const timeTaken = isAllDone ? fmtDuration(n.created_at, n.completed_at) : "—";

                const titleEn = (n.title_en ?? "").trim();
                const titleAr = (n.title_ar ?? "").trim();
                const hasAnyTitle = !!(titleEn || titleAr);

                return (
                  <tr key={n.id} style={{ background: "var(--bg)" }}>
                    <Td style={{ maxWidth: 460, padding: "10px 16px" }}>
                      <div style={{ ...titleBox, padding: "10px 12px" }}>
                        {!hasAnyTitle ? (
                          <div style={titleHeading}>-</div>
                        ) : (
                          <>
                            {titleEn && (
                              <div style={{ ...titleHeading, direction: "ltr", textAlign: "left" }}>{titleEn}</div>
                            )}
                            {titleAr && (
                              <div style={{ ...titleHeading, direction: "rtl", textAlign: "right" }}>{titleAr}</div>
                            )}
                          </>
                        )}
                      </div>
                    </Td>

                    <Td>{displayName(n.team_leader)}</Td>
                    <Td>{renderRecipients(n)}</Td>
                    <Td>
                      <span style={badge}>{scopeHint}</span>
                    </Td>
                    <Td>{formatKSA(n.created_at)}</Td>
                    <Td>{formatKSA(n.completed_at)}</Td>

                    <Td style={{ fontWeight: 800, textAlign: "center", color: isAllDone ? "var(--green, #10B981)" : "var(--muted)" }}>
                      {doneDisplay}
                    </Td>

                    <Td>{timeTaken}</Td>

                    <Td>
                      <button
                        style={btnGhost}
                        onClick={() => {
                          setSelected(n);
                          setDrawerOpen(true);
                        }}
                      >
                        {isArabic ? "عرض" : "View"}
                      </button>
                    </Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <RecipientDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          notification={selected}
          clientId={clientId}
        />
      )}

      <GlobalStyles />
    </div>
  );
}

/* ===== DateField ===== */
function DateField({
  value,
  onChange,
  placeholder = "dd - mm - yyyy",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  type HTMLInputWithPicker = HTMLInputElement & { showPicker?: () => void };

  const formatDMY = (v: string) => {
    if (!v) return placeholder;
    return "";
  };
  const openPicker = (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const el = ref.current as HTMLInputWithPicker | null;
    if (!el) return;
    if (typeof el.showPicker === "function") el.showPicker();
    else el.click();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onMouseDown={openPicker}
      onTouchStart={openPicker}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") openPicker(e);
      }}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        minWidth: 180,
        cursor: "pointer",
        height: 38,
      }}
      title={placeholder}
    >
      <input
        ref={ref}
        type="date"
        className="date-dark no-native"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          color: "transparent",
          caretColor: "transparent",
          background: "transparent",
          border: "none",
          borderRadius: 12,
          padding: "0 12px",
          minHeight: 38,
          pointerEvents: "none",
        }}
      />
      <span
        style={{
          position: "absolute",
          insetInlineStart: 12,
          insetInlineEnd: 12,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          color: value ? "var(--text)" : "var(--muted)",
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          fontSize: 13,
        }}
      >
        {formatDMY(value)}
      </span>
    </div>
  );
}

/* ===== UI helpers & styles ===== */
function CapsuleItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={capsuleItemShell}>
      <span style={capsuleItemLabel}>{label}</span>
      <span style={capsuleItemChevron}>▾</span>
      {children}
    </div>
  );
}

const capsuleItemShell: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  background: "var(--card)",
  border: "1px solid var(--divider)",
  borderRadius: 9999,
  padding: "6px 10px",
  whiteSpace: "nowrap",
  minHeight: 38,
};
const capsuleItemLabel: React.CSSProperties = { fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" };
const capsuleItemChevron: React.CSSProperties = { fontSize: 10, opacity: 0.7, marginInlineStart: 2 };

const capsuleSelectStyle: React.CSSProperties = {
  border: "none",
  outline: "none",
  backgroundColor: "transparent",
  color: "var(--text)",
  fontSize: 13,
  minWidth: 110,
};

const Th = (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    style={{
      position: "sticky",
      top: 0,
      zIndex: 5,
      background: "var(--header-bg)",
      color: "var(--header-fg)",
      textAlign: "start",
      padding: 10,
      borderBottom: "1px solid var(--divider)",
    }}
    {...props}
  />
);

const Td = (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td style={{ padding: 10, borderBottom: "1px solid var(--divider)", verticalAlign: "top" }} {...props} />
);

const btnPrimary: React.CSSProperties = {
  background: "var(--accent)",
  color: "var(--accent-foreground)",
  border: "none",
  borderRadius: 10,
  padding: "8px 10px",
  fontWeight: 800,
  fontSize: 13,
  cursor: "pointer",
};
const btnGhost: React.CSSProperties = {
  background: "transparent",
  color: "var(--text)",
  border: "1px solid var(--divider)",
  borderRadius: 10,
  padding: "8px 10px",
  fontSize: 13,
  cursor: "pointer",
};
const btnRectPrimary: React.CSSProperties = { ...btnPrimary, padding: "10px 14px", minWidth: 120 };
const btnRect: React.CSSProperties = {
  background: "var(--card)",
  color: "var(--text)",
  border: "1px solid var(--divider)",
  borderRadius: 10,
  padding: "10px 12px",
  minWidth: 130,
  fontWeight: 700,
  cursor: "pointer",
};
const badge: React.CSSProperties = {
  background: "var(--chip-bg)",
  padding: "3px 8px",
  borderRadius: 12,
  border: "1px solid var(--divider)",
  fontSize: 12,
};
const titleBox: React.CSSProperties = {
  padding: "10px 12px",
  border: "1px solid var(--divider)",
  borderRadius: 10,
  background: "color-mix(in oklab, var(--card) 92%, transparent)",
};
const titleHeading: React.CSSProperties = { fontWeight: 700, fontSize: 14, lineHeight: 1.35 };

const GlobalStyles = () => (
  <style jsx global>{`
    .capsule-select {
      appearance: none;
      padding-inline-end: 14px;
    }
    .capsule-select option {
      color: #000;
      background: #fff;
    }
  `}</style>
);
