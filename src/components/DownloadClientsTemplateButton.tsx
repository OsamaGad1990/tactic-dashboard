"use client";

import React from "react";
import * as XLSX from "xlsx";

const TEMPLATE_HEADERS = [
  "client_name",            // اسم العميل
  "client_code",            // كود العميل
  "commercial_number",      // رقم السجل التجاري
  "address",                // العنوان
  "tax_number",             // الرقم الضريبي
  "national_address",       // العنوان الوطني
  "enable_location_check",  // Yes/No أو True/False
  "require_biometrics",     // Yes/No أو True/False
  "activate_users",         // Yes/No أو True/False
  "markets",                // أسواق بالأسماء مفصولة بفاصلة: store1,store2
  "categories",             // فئات بالأسماء مفصولة بفاصلة: cat1,cat2
  "app_steps",              // خطوات التطبيق: WH_COUNT,PLANOGRAM,...
];

export default function DownloadClientsTemplateButton() {
  const handleDownload = () => {
    // صف توضيحي (اختياري) يوضح الفورمات
    const exampleRow = [
      "Client A",
      "CLI-001",
      "1234567890",
      "Riyadh - ...",
      "3111111111",
      "Riyadh, Saudi Arabia",
      "Yes",          // enable_location_check
      "No",           // require_biometrics
      "Yes",          // activate_users
      "Store 1,Store 2",
      "Category 1,Category 2",
      "WH_COUNT,PLANOGRAM,SOS",
    ];

    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, exampleRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "clients");

    XLSX.writeFile(wb, "clients-template.xlsx");
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      style={{
        backgroundColor: "#111",
        color: "#fff",
        padding: "8px 16px",
        borderRadius: 8,
        border: "1px solid #666",
        fontWeight: 600,
      }}
    >
      Download Excel Template
    </button>
  );
}
