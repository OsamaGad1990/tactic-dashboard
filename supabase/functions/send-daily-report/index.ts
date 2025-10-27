// Edge Function: send-daily-report
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* ========= Types ========= */
type UUID = string;

type ScheduleRow = {
  id: UUID;
  client_id: UUID | null;
  recipient_email: string;
  filters: unknown | null;
  is_active: boolean;
};

// شكل الجدول في الإيميل
type VisitRow = {
  user_name: string | null;
  team_leader_name: string | null;
  market_store: string | null;
  market_branch: string | null;
  market_region: string | null;
  market_city: string | null;
  started_at: string | null;
  finished_at: string | null;
  status: string | null;
  end_reason: string | null;
  jp_state?: "IN JP" | "OUT OF JP" | null;
};

// صفوف RPC get_yesterday_visits_details
type YestDetailRow = {
  id: UUID;
  status: string | null;
  started_at: string | null;
  finished_at: string | null;
  end_reason: string | null;
  end_reason_ar: string | null;
  end_reason_en: string | null;
  user_id: UUID | null;
  user_name: string | null;
  user_arabic_name: string | null;
  user_username: string | null;
  team_leader_id: UUID | null;
  team_leader_name: string | null;
  team_leader_arabic_name: string | null;
  team_leader_username: string | null;
  market_id: UUID | null;
  market_store: string | null;
  market_branch: string | null;
  market_city: string | null;
  market_region: string | null;
  end_visit_photo: string | null;
  // قد ما يكونش موجود jp_state هنا; لو عندك عمود، ضيفه
  jp_state?: "IN JP" | "OUT OF JP" | null;
};

type Filters = {
  client_id?: string | null;      // ⬅ مهم لنداء RPC اليدوي
  team_leader_id?: string | null;
  user_id?: string | null;
  region?: string | null;
  city?: string | null;
  store?: string | null;
  branch?: string | null;
  jp_state?: ("IN JP" | "OUT OF JP") | null;
  status?: string | null;
  date_from?: string | null;  // اختياري (هنتجاهله ونستخدم snapshot_date أمس)
  date_to?: string | null;    // اختياري
};

/* ========= CORS ========= */
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-key, x-schedule",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/* ========= Utils ========= */
function fmtTime(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleTimeString("ar-EG", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Riyadh",
  });
}

function diffClock(start: string | null, end: string | null): string {
  if (!start || !end) return "-";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms <= 0) return "-";
  const secs = Math.floor(ms / 1000);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return h > 0
    ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function renderTable(rows: VisitRow[], dateLabel: string): string {
  const filtered = rows.filter(
    (r) => !((r.status?.toLowerCase() === "pending") && (r.jp_state === "OUT OF JP"))
  );

  const head = `
    <h2 style="margin:0 0 10px;font-family:Arial">زيارات أمس (${dateLabel})</h2>
    <table border="1" cellspacing="0" cellpadding="6"
           style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
      <thead style="background:#f2f2f2;text-align:center">
        <tr>
          <th>المستخدم</th>
          <th>قائد الفريق</th>
          <th>المنطقه</th>
          <th>المدينه</th>
          <th>السوق</th>
          <th>الفرع</th>
          <th>وقت البدء</th>
          <th>وقت الانتهاء</th>
          <th>مدة الزيارة</th>
          <th>الحالة</th>
          <th>JP حالة</th>
        </tr>
      </thead>
      <tbody>`;

  const body = filtered.length
    ? filtered.map((r) => {
        const jp = (r.jp_state === "IN JP" || r.jp_state === "OUT OF JP") ? r.jp_state : "IN JP";
        return `
          <tr style="text-align:center">
            <td>${r.user_name ?? "-"}</td>
            <td>${r.team_leader_name ?? "-"}</td>
            <td>${r.market_region ?? "-"}</td>
            <td>${r.market_city ?? "-"}</td>
            <td>${r.market_store ?? "-"}</td>
            <td>${r.market_branch ?? "-"}</td>
            <td>${fmtTime(r.started_at)}</td>
            <td>${fmtTime(r.finished_at)}</td>
            <td>${diffClock(r.started_at, r.finished_at)}</td>
            <td>${r.status ?? (r.end_reason ? "ended" : "pending")}</td>
            <td>${jp}</td>
          </tr>`;
      }).join("")
    : `<tr><td colspan="11" style="text-align:center;color:#888">لا توجد زيارات</td></tr>`;

  return `${head}${body}</tbody></table>`;
}

function ksaYesterdayISODate(): string {
  const nowUtc = new Date();
  const ksaNow = new Date(nowUtc.getTime() + 3 * 60 * 60 * 1000); // UTC+3
  const ksaY = new Date(ksaNow);
  ksaY.setUTCDate(ksaNow.getUTCDate() - 1);
  return ksaY.toISOString().slice(0, 10);
}

/* ========= Logging Helpers (to public.email_job_log) ========= */
function safePreview(payload: unknown, max = 500): string {
  try {
    const s = typeof payload === "string" ? payload : JSON.stringify(payload);
    return s.length > max ? s.slice(0, max) : s;
  } catch {
    return "[unserializable]";
  }
}

async function logEmail(
  sbAdmin: ReturnType<typeof createClient>,
  {
    note,
    status_code,
    error_msg,
    resp_preview,
  }: { note: string; status_code: number; error_msg?: string | null; resp_preview?: string | null },
) {
  try {
    const insert = {
      // ran_at لديه default now()
      note,
      status_code,
      error_msg: error_msg ?? null,
      resp_preview: resp_preview ?? null,
    };
    const { error } = await sbAdmin.from("email_job_log").insert(insert);
    if (error) console.warn("[email_job_log] insert failed:", error.message);
  } catch (e) {
    console.warn("[email_job_log] unexpected error:", (e as Error).message);
  }
}

/* ========= Handler ========= */
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // هنستخدم نفس مشروع Supabase (PROJECT_URL + SERVICE_ROLE_KEY) في التنفيذ وفي التسجيل بالجدول
  const PROJECT_URL = Deno.env.get("PROJECT_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
  const MAIL_FROM = Deno.env.get("MAIL_FROM") || "no-reply@tai.com.sa";
  const CRON_SECRET = Deno.env.get("CRON_SECRET") || "";

  try {
    if (!PROJECT_URL || !SERVICE_ROLE_KEY || !RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing required secrets" }),
        { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } }
      );
    }

    // Flags
    const headerCron = req.headers.get("x-cron-key");
    const isCronKey = !!CRON_SECRET && headerCron === CRON_SECRET;
    const hasBearer = !!req.headers.get("authorization");
    const isScheduler = !!req.headers.get("x-schedule"); // GitHub Action

    if (!(isCronKey || hasBearer || isScheduler)) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    // Body (manual only)
    type ManualBody = {
      report_id?: string;
      recipient_emails?: string[];
      filters?: Filters; // يدوي: فلاتر من الداشبورد
    };

    let bodyJson: ManualBody = {};
    if (!isCronKey && !isScheduler) {
      try {
        const raw = await req.json();
        if (raw && typeof raw === "object") {
          const b = raw as Record<string, unknown>;
          bodyJson = {
            report_id: typeof b.report_id === "string" ? b.report_id : undefined,
            recipient_emails:
              Array.isArray(b.recipient_emails) && b.recipient_emails.every((x) => typeof x === "string")
                ? (b.recipient_emails as string[])
                : undefined,
            filters: typeof b.filters === "object" && b.filters ? (b.filters as Filters) : undefined,
          };
        }
      } catch { /* ignore */ }
    }

    const sb = createClient(PROJECT_URL, SERVICE_ROLE_KEY);
    const dateY = ksaYesterdayISODate();

    // ===== RPCs =====
    const buildVisits = async (reportId: string) => {
      const { data, error } = await sb.rpc("get_report_visits_v4", { report_id: reportId });
      if (error) throw error;
      return (data ?? []) as VisitRow[];
    };

    // يدوي: استخدم get_yesterday_visits_details ثم فلترة بالكود
    const buildVisitsFromFilters = async (filters: Filters) => {
      if (!filters.client_id) throw new Error("filters.client_id is required for manual filters");
      const { data, error } = await sb.rpc("get_yesterday_visits_details", {
        p_client_id: filters.client_id,
        p_snapshot_date: dateY, // أمس بتوقيت الرياض
      });
      if (error) throw error;

      const raw = (data ?? []) as YestDetailRow[];

      // فلترة بالكود حسب بقية الفلاتر الاختيارية
      const f = (v: YestDetailRow) => {
        if (filters.team_leader_id && String(v.team_leader_id) !== String(filters.team_leader_id)) return false;
        if (filters.user_id        && String(v.user_id)        !== String(filters.user_id))        return false;
        if (filters.region         && v.market_region !== filters.region)                           return false;
        if (filters.city           && v.market_city   !== filters.city)                             return false;
        if (filters.store          && v.market_store  !== filters.store)                            return false;
        if (filters.branch         && v.market_branch !== filters.branch)                           return false;
        if (filters.status         && v.status        !== filters.status)                           return false;
        if (filters.jp_state       && v.jp_state      !== filters.jp_state)                         return false;
        return true;
      };

      const filtered = raw.filter(f);

      // تحويل لشكل VisitRow المستخدم في الإيميل
      const mapped: VisitRow[] = filtered.map((r) => ({
        user_name: r.user_name,
        team_leader_name: r.team_leader_name,
        market_store: r.market_store,
        market_branch: r.market_branch,
        market_region: r.market_region,
        market_city: r.market_city,
        started_at: r.started_at,
        finished_at: r.finished_at,
        status: r.status,
        end_reason: r.end_reason,
        jp_state: r.jp_state ?? null,
      }));

      return mapped;
    };

    // ===== Resend =====
    const sendEmail = async (to: string, html: string) => {
      console.log("[MAIL_FROM USING]", MAIL_FROM);
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: MAIL_FROM,
          to,
          subject: "Daily Report",
          html,
        }),
      });

      let json: unknown = null;
      try { json = await res.json(); } catch {}
      console.log("[RESEND STATUS]", res.status, res.statusText);
      if (json) console.log("[RESEND JSON]", JSON.stringify(json));
      if (!res.ok) {
        const j = json as { message?: string; error?: unknown } | null;
        const msg = j?.message ?? (j?.error ? String(j.error) : res.statusText || "RESEND_ERROR");
        throw new Error(msg);
      }
      const j = json as { id?: string } | null;
      if (!j?.id) throw new Error("Resend did not return an id");
      return { ok: true as const, id: j.id, status: 200, json };
    };

    let totalSent = 0;

    /* ========= CRON MODE ========= */
    if (isCronKey || isScheduler) {
      const { data: schedules, error: sErr } = await sb
        .from("scheduled_email_reports")
        .select("id, client_id, recipient_email, filters, is_active")
        .eq("is_active", true);

      if (sErr) throw sErr;
      const list = (schedules ?? []) as ScheduleRow[];

      for (const s of list) {
        const visits = await buildVisits(s.id); // الـ RPC يطبّق فلاتر السطر داخل DB
        const html = renderTable(visits, dateY);
        try {
          const r = await sendEmail(s.recipient_email, html);
          console.log("Email OK (cron):", s.recipient_email, r.id);
          totalSent++;

          // log success
          await logEmail(sb, {
            note: `cron send to ${s.recipient_email} (report_id=${s.id})`,
            status_code: r.status,
            error_msg: null,
            resp_preview: safePreview({ id: r.id, recipient: s.recipient_email, sent: true }),
          });
        } catch (err) {
          const errMsg = (err as Error).message || String(err);
          console.log("Email FAIL (cron):", s.recipient_email, errMsg);

          // log failure
          await logEmail(sb, {
            note: `cron send failed to ${s.recipient_email} (report_id=${s.id})`,
            status_code: 500,
            error_msg: errMsg,
            resp_preview: safePreview({ recipient: s.recipient_email, sent: false }),
          });
        }
      }

      // log summary
      await logEmail(sb, {
        note: `cron summary: sent=${totalSent}`,
        status_code: 200,
        error_msg: null,
        resp_preview: safePreview({ mode: "cron", date: dateY, sent: totalSent }),
      });

      return new Response(JSON.stringify({ ok: true, mode: "cron", sent: totalSent }), {
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    /* ========= MANUAL MODE ========= */
    let visits: VisitRow[] = [];
    if (bodyJson.report_id) {
      visits = await buildVisits(bodyJson.report_id);
    } else if (bodyJson.filters) {
      visits = await buildVisitsFromFilters(bodyJson.filters);
    } else {
      // fallback: أول report فعّال
      const { data: schedules, error: sErr } = await sb
        .from("scheduled_email_reports")
        .select("id")
        .eq("is_active", true)
        .limit(1);
      if (sErr) throw sErr;
      const firstId = schedules?.[0]?.id as string | undefined;
      visits = firstId ? await buildVisits(firstId) : [];
    }

    const html = renderTable(visits, dateY);

    // المستلمون في الوضع اليدوي
    let recipients: string[] = [];
    if (Array.isArray(bodyJson.recipient_emails) && bodyJson.recipient_emails.length > 0) {
      recipients = Array.from(new Set(bodyJson.recipient_emails.map((e) => e.trim()).filter(Boolean)));
    } else {
      const rq = sb
        .from("scheduled_email_reports")
        .select("recipient_email", { distinct: true })
        .eq("is_active", true);
      const { data: rec, error: rErr } = await rq.order("recipient_email", { ascending: true });
      if (rErr) throw rErr;
      recipients = Array.from(new Set((rec ?? []).map((r: { recipient_email: string }) => r.recipient_email).filter(Boolean)));
    }

    for (const to of recipients) {
      try {
        const r = await sendEmail(to, html);
        console.log("Email OK (manual):", to, r.id);
        totalSent++;

        // log success
        await logEmail(sb, {
          note: `manual send to ${to}`,
          status_code: r.status,
          error_msg: null,
          resp_preview: safePreview({ id: r.id, recipient: to, sent: true }),
        });
      } catch (err) {
        const errMsg = (err as Error).message || String(err);
        console.log("Email FAIL (manual):", to, errMsg);

        // log failure
        await logEmail(sb, {
          note: `manual send failed to ${to}`,
          status_code: 500,
          error_msg: errMsg,
          resp_preview: safePreview({ recipient: to, sent: false }),
        });
      }
    }

    // log summary
    await logEmail(sb, {
      note: `manual summary: sent=${totalSent}`,
      status_code: 200,
      error_msg: null,
      resp_preview: safePreview({ mode: "manual", date: dateY, sent: totalSent }),
    });

    return new Response(JSON.stringify({ ok: true, mode: "manual", sent: totalSent }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (e) {
    // لو حصل خطأ قبل ما ننشئ الـ client، هنحاول نسجّل رسالة الخطأ المختصرة
    try {
      if (PROJECT_URL && SERVICE_ROLE_KEY) {
        const sbFallback = createClient(PROJECT_URL, SERVICE_ROLE_KEY);
        await logEmail(sbFallback, {
          note: "fatal error in handler",
          status_code: 500,
          error_msg: (e as Error).message,
          resp_preview: safePreview({ ok: false, error: (e as Error).message }),
        });
      }
    } catch{
      // تجاهل أي فشل في التسجيل حتى لا نعطّل الاستجابة
    }

    console.error(e);
    return new Response(
      JSON.stringify({ ok: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } }
    );
  }
});
