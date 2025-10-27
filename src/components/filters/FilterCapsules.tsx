// src/components/filters/FilterCapsules.tsx
import { ReactNode } from "react";
import DatePicker from "react-datepicker";
import { useLangTheme } from "@/hooks/useLangTheme";

export function Capsule({ label, summary, children }: { label: string; summary?: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, border: "1px solid var(--input-border)", borderRadius: 14, background: "var(--input-bg)", padding: "8px 10px", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>{label}</div>
        {summary && <div style={{ fontSize: 11, opacity: 0.75 }}>{summary}</div>}
      </div>
      {children}
    </div>
  );
}

export function SelectSingle({
  options, value, onChange, placeholder, disabled, includeEmpty = true,
}: {
  options: string[]; value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean; includeEmpty?: boolean;
}) {
  const { isArabic } = useLangTheme();
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, border: "1px solid var(--input-border)", background: "var(--card)", opacity: disabled ? 0.75 : 1, overflow: "hidden" }}>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.currentTarget.value)}
        disabled={disabled}
        style={{ width: "100%", height: 24, padding: isArabic ? "0 34px 0 6px" : "0 6px 0 34px", border: "none", outline: "none", background: "transparent", color: "var(--text)", appearance: "none", WebkitAppearance: "none", MozAppearance: "none", fontWeight: 700 }}
      >
        {includeEmpty && <option value="">{placeholder || ""}</option>}
        {options.map((op) => <option key={op} value={op}>{op}</option>)}
      </select>
      <span aria-hidden style={{ position: "absolute", top: 0, bottom: 0, [isArabic ? "left" : "right"]: 10, display: "flex", alignItems: "center", pointerEvents: "none", opacity: 0.8 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
    </div>
  );
}

export function SelectObject({
  options, value, onChange, placeholder, disabled,
}: {
  options: { value: string; label: string }[]; value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean;
}) {
  const { isArabic } = useLangTheme();
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, border: "1px solid var(--input-border)", background: "var(--card)", opacity: disabled ? 0.75 : 1, overflow: "hidden" }}>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.currentTarget.value)}
        disabled={disabled}
        style={{ width: "100%", height: 24, padding: isArabic ? "0 34px 0 6px" : "0 6px 0 34px", border: "none", outline: "none", background: "transparent", color: "var(--text)", appearance: "none", WebkitAppearance: "none", MozAppearance: "none", fontWeight: 700 }}
      >
        <option value="">{placeholder || ""}</option>
        {options.map((op) => <option key={op.value} value={op.value}>{op.label}</option>)}
      </select>
      <span aria-hidden style={{ position: "absolute", top: 0, bottom: 0, [isArabic ? "left" : "right"]: 10, display: "flex", alignItems: "center", pointerEvents: "none", opacity: 0.8 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
    </div>
  );
}

export function DateBox({ selected, onChange, placeholder }: { selected: Date | null; onChange: (d: Date | null) => void; placeholder: string; }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, border: "1px solid var(--input-border)", background: "var(--card)" }}>
      <span aria-hidden>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ display: "block" }}>
          <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M16 3v4M8 3v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
      <div style={{ flex: 1 }}>
        <DatePicker
          selected={selected}
          onChange={onChange}
          dateFormat="yyyy-MM-dd"
          placeholderText={placeholder}
          customInput={
            <input readOnly style={{ width: "100%", height: 24, border: "none", outline: "none", background: "transparent", color: "var(--text)", fontWeight: 700, cursor: "pointer" }} />
          }
        />
      </div>
    </div>
  );
}
