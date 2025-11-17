"use client";

import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabaseClient";

type ParsedRow = {
  client_name?: string;
  client_code?: string;
  commercial_number?: string;
  address?: string;
  tax_number?: string;
  national_address?: string;
  enable_location_check?: string | number | boolean;
  require_biometrics?: string | number | boolean;
  activate_users?: string | number | boolean;
  markets?: string;
  categories?: string;
  app_steps?: string;
};

type MarketRow = {
  id: string;
  store: string | null;
};

type CategoryRow = {
  id: string;
  name: string | null;
};

function parseBool(v: unknown): boolean {
  if (v === undefined || v === null) return false;
  const s = String(v).trim().toLowerCase();
  return s === "yes" || s === "true" || s === "1";
}

export default function UploadClientsButton() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = () => {
    inputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setResultMsg(null);

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<ParsedRow>(ws, { defval: "" });

      let successCount = 0;
      let failCount = 0;

      for (const row of rows) {
        const name = row.client_name?.toString().trim();
        if (!name) {
          // صف فاضي
          continue;
        }

        const code = row.client_code?.toString().trim() || null;
        const commercialNumber = row.commercial_number?.toString().trim() || null;
        const address = row.address?.toString().trim() || null;
        const taxNumber = row.tax_number?.toString().trim() || null;
        const nationalAddress = row.national_address?.toString().trim() || null;

        const enableLoc = parseBool(row.enable_location_check);
        const requireBio = parseBool(row.require_biometrics);
        const activateUsers = parseBool(row.activate_users);

        const marketsNames = (row.markets || "")
          .toString()
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        const categoryNames = (row.categories || "")
          .toString()
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        const stepKeys = (row.app_steps || "")
          .toString()
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        // 1) نحول الأسماء لـ IDs من الجداول
        let marketIds: string[] = [];
        if (marketsNames.length) {
          const { data: mData, error: mErr } = await supabase
            .from("Markets")
            .select("id, store");

          if (mErr) throw mErr;

          const typedMarkets = (mData ?? []) as MarketRow[];
          marketIds = typedMarkets
            .filter((m) => m.store && marketsNames.includes(m.store))
            .map((m) => m.id);
        }

        let categoryIds: string[] = [];
        if (categoryNames.length) {
          const { data: cData, error: cErr } = await supabase
            .from("categories")
            .select("id, name");

          if (cErr) throw cErr;

          const typedCats = (cData ?? []) as CategoryRow[];
          categoryIds = typedCats
            .filter((c) => c.name && categoryNames.includes(c.name))
            .map((c) => c.id);
        }

        // 2) إنشاء العميل (من غير ملفات)
        const payload = {
          name,
          name_ar: name,
          code,
          tax_number: taxNumber,
          commercial_number: commercialNumber,
          national_address: nationalAddress,
          address,
          enable_location_check: enableLoc,
          require_biometrics: requireBio,
          activate_users: activateUsers,
          markets: marketIds,
          categories: categoryIds,
        };

        const { data: inserted, error: insertErr } = await supabase
          .from("client")
          .insert(payload)
          .select("id")
          .single();

        if (insertErr || !inserted) {
          console.error("Insert client error", insertErr);
          failCount++;
          continue;
        }

        const clientId: string = inserted.id;

        // 3) خطوات التطبيق في ClientFeatures
        if (stepKeys.length) {
          const featuresPayload = stepKeys.map((feature_key) => ({
            client_id: clientId,
            feature_key,
            is_enabled: true,
          }));

          const { error: featErr } = await supabase
            .from("ClientFeatures")
            .upsert(featuresPayload, { onConflict: "client_id,feature_key" });

          if (featErr) {
            console.error("ClientFeatures error", featErr);
          }
        }

        successCount++;
      }

      setResultMsg(`تم رفع البيانات: ناجحة = ${successCount}, فاشلة = ${failCount}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(err);
      setResultMsg(message || "Error while uploading clients");
    } finally {
      setLoading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        style={{
          backgroundColor: "#059669",
          color: "#fff",
          padding: "8px 16px",
          borderRadius: 8,
          border: "none",
          fontWeight: 600,
        }}
      >
        {loading ? "Uploading..." : "Upload Clients to Supabase"}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {resultMsg && (
        <div
          style={{
            marginTop: 8,
            color: "#ddd",
            fontSize: 13,
          }}
        >
          {resultMsg}
        </div>
      )}
    </>
  );
}
