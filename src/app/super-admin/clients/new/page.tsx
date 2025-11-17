"use client";

import { useMemo, useState, useEffect, FormEvent, ChangeEvent } from "react";
import type React from "react";
import { useRouter } from "next/navigation";
import { useLangTheme } from "@/hooks/useLangTheme";
import UploadClientsButton from "@/components/UploadClientsButton";
import MultiSelect from "@/components/MultiSelect";
import DownloadClientsTemplateButton from "@/components/DownloadClientsTemplateButton";
import { supabase } from "@/lib/supabaseClient";

type YesNo = "yes" | "no";
/* eslint-disable @typescript-eslint/no-explicit-any */

type LocalUser = {
  id: string;
  name?: string;
  arabic_name?: string;
  username?: string;
  email?: string;
  mobile?: string;
  role?: string;
  active?: YesNo;
};
type Setter<T> = React.Dispatch<React.SetStateAction<T>>;

type TableLabels = {
  name: string;
  arabic_name: string;
  username: string;
  email: string;
  mobile: string;
  role: string;
  active: string;
  remove: string;
};

type TDict = {
  title: string;
  steps: string[];
  next: string;
  back: string;
  createMock: string;
  cancel: string;
  requiredHint: string;
  basicInfo: string;
  files: string;
  selections: string;
  toggles: string;
  name: string;
  code: string;
  commercialNumber: string;
  address: string;
  nationalFile: string;
  taxNumber: string;
  taxFile: string;
  commercialFile: string;
  nationalAddress: string;
  agreementFile: string;
  logoFile: string;
  markets: string;
  categories: string;
  linkedUsersPick: string; // مش مستخدم حالياً لكن سيبناه في الدكشنري
  appSteps: string;
  yes: string;
  no: string;
  enableLocation: string;
  requireBio: string;
  activateUsers: string;
  usersTitle: string;
  importExcel: string;
  addUser: string;
  mustHaveOneUser: string;
  reviewTitle?: string;
  clientData: string;
  linkedUsersHeader: string;
  table: TableLabels;
  saveToast: string;
};

type Step1BasicProps = {
  T: TDict;
  name: string;
  setName: Setter<string>;
  code: string;
  setCode: Setter<string>;
  commercialNumber: string;
  setCommercialNumber: Setter<string>;
  address: string;
  setAddress: Setter<string>;
  nationalFile: File | null;
  setNationalFile: Setter<File | null>;
  taxNumber: string;
  setTaxNumber: Setter<string>;
  taxFile: File | null;
  setTaxFile: Setter<File | null>;
  commercialFile: File | null;
  setCommercialFile: Setter<File | null>;
  nationalAddress: string;
  setNationalAddress: Setter<string>;
  agreementFile: File | null;
  setAgreementFile: Setter<File | null>;
  logoFile: File | null;
  setLogoFile: Setter<File | null>;
  markets: string[];
  setMarkets: Setter<string[]>;
  categories: string[];
  setCategories: Setter<string[]>;
  appStepsSelected: string[];
  setAppStepsSelected: Setter<string[]>;
  marketsOptions: string[];
  categoriesOptions: string[];
  stepsOptions: string[];
  isValid: boolean;
  isArabic: boolean;
  enableLocationCheck: YesNo;
  setEnableLocationCheck: Setter<YesNo>;
  requireBiometrics: YesNo;
  setRequireBiometrics: Setter<YesNo>;
  activateUsers: YesNo;
  setActivateUsers: Setter<YesNo>;
};

type Step2UsersProps = {
  T: TDict;
  users: LocalUser[];
  addUserRow: () => void;
  removeUserRow: (id: string) => void;
  updateUserRow: (id: string, patch: Partial<LocalUser>) => void;
  excelFile: File | null;
  handleExcelChange: (e: ChangeEvent<HTMLInputElement>) => void;
  roles: string[];
  isValid: boolean;
  isArabic: boolean;
};

type ReviewData = {
  name: string;
  code: string;
  commercialNumber: string;
  address: string;
  nationalFile: File | null;
  taxNumber: string;
  taxFile: File | null;
  commercialFile: File | null;
  nationalAddress: string;
  agreementFile: File | null;
  logoFile: File | null;
  markets: string[];
  categories: string[];
  appStepsSelected: string[];
  enableLocationCheck: YesNo;
  requireBiometrics: YesNo;
  activateUsers: YesNo;
  users: LocalUser[];
};

type Step3ReviewProps = { T: TDict; data: ReviewData; isArabic: boolean };

export default function AddClientWizardMock() {
  const router = useRouter();
  const { isArabic } = useLangTheme(); // اللغة من الهيدر العالمي

  // ====== حالة الـ Wizard ======
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // ====== الخطوة 1: بيانات العميل ======
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [commercialNumber, setCommercialNumber] = useState("");
  const [address, setAddress] = useState("");

  const [nationalFile, setNationalFile] = useState<File | null>(null);
  const [taxNumber, setTaxNumber] = useState("");
  const [taxFile, setTaxFile] = useState<File | null>(null);
  const [commercialFile, setCommercialFile] = useState<File | null>(null);
  const [nationalAddress, setNationalAddress] = useState("");
  const [agreementFile, setAgreementFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [markets, setMarkets] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [appStepsSelected, setAppStepsSelected] = useState<string[]>([]);

  const [enableLocationCheck, setEnableLocationCheck] = useState<YesNo>("no");
  const [requireBiometrics, setRequireBiometrics] = useState<YesNo>("no");
  const [activateUsers, setActivateUsers] = useState<YesNo>("yes");

  // خيارات ديناميكية من قاعدة البيانات
  const [marketOptions, setMarketOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const STEP_OPTIONS = ["WH_COUNT", "PLANOGRAM", "COMPACTIVITY", "DAMDAGE_COUNT", "SOS"];

  // ====== الخطوة 2: المستخدمون المرتبطون ======
  function makeEmptyUserRow(): LocalUser {
    return { id: crypto.randomUUID(), active: "yes" };
  }
  const [users, setUsers] = useState<LocalUser[]>([makeEmptyUserRow()]);

  function addUserRow() {
    setUsers((prev) => [...prev, makeEmptyUserRow()]);
  }
  function removeUserRow(id: string) {
    setUsers((prev) => (prev.length > 1 ? prev.filter((u) => u.id !== id) : prev));
  }
  function updateUserRow(id: string, patch: Partial<LocalUser>) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }
  const [excelFile, setExcelFile] = useState<File | null>(null);
  function handleExcelChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setExcelFile(f);
  }

  // ====== Toast / Saving ======
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);

  const MOCK_ROLES = ["super_admin", "admin", "team_leader", "mch", "promo", "viewer"];

  // ====== تحميل الأسواق والفئات من Supabase ======
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [{ data: marketsData, error: marketsError }, { data: catsData, error: catsError }] =
          await Promise.all([
            supabase.from("Markets").select("store").order("store", { ascending: true }),
            supabase.from("categories").select("name").order("name", { ascending: true }),
          ]);

        if (marketsError) throw marketsError;
        if (catsError) throw catsError;

        if (marketsData) {
          const stores = Array.from(
            new Set(
              (marketsData as any[])
                .map((m) => m.store as string | null)
                .filter((s): s is string => !!s)
            )
          );
          setMarketOptions(stores);
        }

        if (catsData) {
          const names = (catsData as any[])
            .map((c) => c.name as string | null)
            .filter((n): n is string => !!n);
          setCategoryOptions(names);
        }
      } catch (err) {
        console.error("Error loading lookups", err);
      }
    };

    fetchLookups();
  }, []);

  // ====== النصوص ======
  const T = useMemo<TDict>(() => {
    return isArabic
      ? {
          title: "معالج إضافة عميل جديد",
          steps: ["البيانات الأساسية", "المستخدمون المرتبطون", "المراجعة والتأكيد"],
          next: "التالي",
          back: "السابق",
          createMock: "حفظ العميل",
          cancel: "إلغاء",
          requiredHint: "الحقول الإلزامية مميزة بعلامة *",
          basicInfo: "البيانات الأساسية",
          files: "الملفات",
          selections: "الاختيارات",
          toggles: "إعدادات (Yes/No)",
          name: "اسم العميل",
          code: "كود العميل",
          commercialNumber: "رقم السجل التجاري",
          address: "العنوان",
          nationalFile: "الملف الوطني (صورة/ PDF)",
          taxNumber: "الرقم الضريبي",
          taxFile: "ملف ضريبي",
          commercialFile: "ملف السجل التجاري",
          nationalAddress: "العنوان الوطني",
          agreementFile: "ملف/اتفاقية",
          logoFile: "اللوجو",
          markets: "الأسواق المرتبطة",
          categories: "الفئات المرتبطة",
          linkedUsersPick: "اختيار مستخدمين",
          appSteps: "خطوات التطبيق",
          yes: "Yes",
          no: "No",
          enableLocation: "تفعيل الموقع",
          requireBio: "تفعيل البايومتركس",
          activateUsers: "تفعيل المستخدمين",
          usersTitle: "المستخدمون المرتبطون",
          addUser: "إضافة مستخدم",
          importExcel: "استيراد من Excel",
          table: {
            name: "الاسم",
            arabic_name: "الاسم بالعربية",
            username: "اسم الدخول",
            email: "البريد الإلكتروني",
            mobile: "الجوال",
            role: "الدور",
            active: "نشط؟",
            remove: "حذف",
          },
          mustHaveOneUser: "يجب إضافة مستخدم واحد على الأقل.",
          reviewTitle: "مراجعة وتأكيد",
          clientData: "بيانات العميل",
          linkedUsersHeader: "المستخدمون",
          saveToast: "تم حفظ العميل بنجاح ✅",
        }
      : {
          title: "Add New Client - Wizard",
          steps: ["Basic Info", "Linked Users", "Review & Confirm"],
          next: "Next",
          back: "Back",
          createMock: "Save Client",
          cancel: "Cancel",
          requiredHint: "Required fields marked with *",
          basicInfo: "Basic Info",
          files: "Files",
          selections: "Selections",
          toggles: "Settings (Yes/No)",
          name: "Client Name",
          code: "Client Code",
          commercialNumber: "Commercial Number",
          address: "Address",
          nationalFile: "National File",
          taxNumber: "Tax Number",
          taxFile: "Tax File",
          commercialFile: "Commercial File",
          nationalAddress: "National Address",
          agreementFile: "Agreement File",
          logoFile: "Logo",
          markets: "Markets",
          categories: "Categories",
          linkedUsersPick: "Pick Users",
          appSteps: "App Steps",
          yes: "Yes",
          no: "No",
          enableLocation: "Enable Location Check",
          requireBio: "Require Biometrics",
          activateUsers: "Activate Users",
          usersTitle: "Linked Users",
          addUser: "Add User",
          importExcel: "Import from Excel",
          table: {
            name: "Name",
            arabic_name: "Arabic Name",
            username: "Username",
            email: "Email",
            mobile: "Mobile",
            role: "Role",
            active: "Active?",
            remove: "Remove",
          },
          mustHaveOneUser: "At least one user is required.",
          reviewTitle: "Review & Confirm",
          clientData: "Client Data",
          linkedUsersHeader: "Users",
          saveToast: "Client saved ✅",
        };
  }, [isArabic]);

  // ====== تحقق صحة الخطوات ======
  const isStep1Valid = useMemo(
    () =>
      name.trim().length > 0 &&
      commercialNumber.trim().length > 0 &&
      address.trim().length > 0 &&
      !!nationalFile,
    [name, commercialNumber, address, nationalFile]
  );

  const isStep2Valid = useMemo(() => {
    const validUsers = users.filter(
      (u) => (u.username?.trim()?.length || 0) > 0 && (u.role?.trim()?.length || 0) > 0
    );
    return validUsers.length > 0;
  }, [users]);

  // ====== Toast auto-hide ======
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const nextStep = (s: 1 | 2 | 3): 1 | 2 | 3 => (s === 1 ? 2 : 3);
  const prevStep = (s: 1 | 2 | 3): 1 | 2 | 3 => (s === 3 ? 2 : 1);

  function goNext() {
    if (step === 1 && !isStep1Valid) return;
    if (step === 2 && !isStep2Valid) return;
    setStep((s) => nextStep(s));
  }

  function goBack() {
    setStep((s) => prevStep(s));
  }

   // ====== حفظ في جدول client + ClientFeatures + ملفات ======
  async function onCreateMock(e: FormEvent) {
    e.preventDefault();

    const client_code = (code || "").toString().trim();
    const nameBoth = (name || "").toString().trim();

    if (!client_code || !nameBoth) {
      setToast(isArabic ? "أدخل كود العميل والاسم" : "Enter client code and name");
      return;
    }
    if (!nationalFile) {
      setToast(isArabic ? "أرفِق الملف الوطني" : "Attach national file");
      return;
    }

    try {
      setSaving(true);
      setToast("");

      // 1) تحويل الأسواق / الفئات المختارة إلى UUIDs من الجداول
      let marketIds: string[] = [];
      if (markets.length) {
        const { data: marketRows, error: marketsError } = await supabase
          .from("Markets")
          .select("id, store")
          .in("store", markets);

        if (marketsError) throw marketsError;

        marketIds =
          marketRows?.map((m: { id: string; store: string | null }) => m.id) ?? [];
      }

      let categoryIds: string[] = [];
      if (categories.length) {
        const { data: catRows, error: catsError } = await supabase
          .from("categories")
          .select("id, name")
          .in("name", categories);

        if (catsError) throw catsError;

        categoryIds =
          catRows?.map((c: { id: string; name: string | null }) => c.id) ?? [];
      }

      // 2) إنشاء العميل في جدول client
      const payload = {
        name: nameBoth,
        name_ar: nameBoth,
        code: client_code || null,
        tax_number: taxNumber || null,
        commercial_number: commercialNumber || null,
        national_address: nationalAddress || null,
        address: address || null,

        enable_location_check: enableLocationCheck === "yes",
        require_biometrics: requireBiometrics === "yes",
        activate_users: activateUsers === "yes",

        markets: marketIds,
        categories: categoryIds,
      };

      const { data: inserted, error: insertError } = await supabase
        .from("client")
        .insert(payload)
        .select("id")
        .single();

      if (insertError || !inserted) {
        throw insertError || new Error("Insert failed");
      }

      const clientId: string = inserted.id;

      // 3) رفع الملفات على bucket clients-files
      const [nationalUrl, taxUrl, commercialUrl, agreementUrl, logoUrl] =
        await Promise.all([
          uploadClientFile(clientId, nationalFile, "national"),
          uploadClientFile(clientId, taxFile, "tax"),
          uploadClientFile(clientId, commercialFile, "commercial"),
          uploadClientFile(clientId, agreementFile, "agreement"),
          uploadClientFile(clientId, logoFile, "logo"),
        ]);

      const { error: updateFilesError } = await supabase
        .from("client")
        .update({
          national_file_url: nationalUrl,
          tax_file_url: taxUrl,
          commercial_file_url: commercialUrl,
          agreement_file_url: agreementUrl,
          logo_url: logoUrl,
        })
        .eq("id", clientId);

      if (updateFilesError) throw updateFilesError;

      // 4) تخزين خطوات التطبيق في ClientFeatures
      if (appStepsSelected.length) {
        const featuresPayload = appStepsSelected.map((feature_key) => ({
          client_id: clientId,
          feature_key,
          is_enabled: true,
        }));

        const { error: featError } = await supabase
          .from("ClientFeatures")
          .upsert(featuresPayload, { onConflict: "client_id,feature_key" });

        if (featError) throw featError;
      }

      setToast(T.saveToast);
      // ممكن بعدين تعمل redirect لو حابب
      // router.push("/super-admin/clients");
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Error while saving client";
      setToast(msg);
    } finally {
      setSaving(false);
    }
  }


  // ====== الـ UI ======
  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "24px auto",
        width: "100%",
        padding: "0 20px",
      }}
    >
      <h2 style={{ marginBottom: 8 }}>{T.title}</h2>
      <Stepper labels={T.steps} current={step} />

      <form onSubmit={onCreateMock}>
        {/* Step 1 */}
        {step === 1 && (
          <Step1Basic
            T={T}
            name={name}
            setName={setName}
            code={code}
            setCode={setCode}
            commercialNumber={commercialNumber}
            setCommercialNumber={setCommercialNumber}
            address={address}
            setAddress={setAddress}
            nationalFile={nationalFile}
            setNationalFile={setNationalFile}
            taxNumber={taxNumber}
            setTaxNumber={setTaxNumber}
            taxFile={taxFile}
            setTaxFile={setTaxFile}
            commercialFile={commercialFile}
            setCommercialFile={setCommercialFile}
            nationalAddress={nationalAddress}
            setNationalAddress={setNationalAddress}
            agreementFile={agreementFile}
            setAgreementFile={setAgreementFile}
            logoFile={logoFile}
            setLogoFile={setLogoFile}
            markets={markets}
            setMarkets={setMarkets}
            categories={categories}
            setCategories={setCategories}
            appStepsSelected={appStepsSelected}
            setAppStepsSelected={setAppStepsSelected}
            marketsOptions={marketOptions}
            categoriesOptions={categoryOptions}
            stepsOptions={STEP_OPTIONS}
            isValid={isStep1Valid}
            isArabic={isArabic}
            enableLocationCheck={enableLocationCheck}
            setEnableLocationCheck={setEnableLocationCheck}
            requireBiometrics={requireBiometrics}
            setRequireBiometrics={setRequireBiometrics}
            activateUsers={activateUsers}
            setActivateUsers={setActivateUsers}
          />
        )}

        {/* Step 2 */}
        {step === 2 && (
          <Step2Users
            T={T}
            users={users}
            addUserRow={addUserRow}
            removeUserRow={removeUserRow}
            updateUserRow={updateUserRow}
            excelFile={excelFile}
            handleExcelChange={handleExcelChange}
            roles={MOCK_ROLES}
            isValid={isStep2Valid}
            isArabic={isArabic}
          />
        )}

        {/* Step 3 */}
        {step === 3 && (
          <Step3Review
            T={T}
            data={{
              name,
              code,
              commercialNumber,
              address,
              nationalFile,
              taxNumber,
              taxFile,
              commercialFile,
              nationalAddress,
              agreementFile,
              logoFile,
              markets,
              categories,
              appStepsSelected,
              enableLocationCheck,
              requireBiometrics,
              activateUsers,
              users,
            }}
            isArabic={isArabic}
          />
        )}

        {/* أزرار التحكم */}
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "space-between",
            marginTop: 16,
          }}
        >
          <button type="button" onClick={() => router.back()} style={secondaryBtn}>
            {T.cancel}
          </button>

          <div style={{ display: "flex", gap: 10 }}>
            {step > 1 && (
              <button type="button" onClick={goBack} style={secondaryBtn}>
                {T.back}
              </button>
            )}

            {step < 3 && (
              <button
                type="button"
                onClick={goNext}
                style={{
                  ...primaryBtn,
                  opacity: (step === 1 ? isStep1Valid : isStep2Valid) ? 1 : 0.6,
                  cursor: (step === 1 ? isStep1Valid : isStep2Valid) ? "pointer" : "not-allowed",
                }}
                disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
              >
                {T.next}
              </button>
            )}

            {step === 3 && (
              <button type="submit" style={primaryBtn} disabled={saving}>
                {saving
                  ? isArabic
                    ? "جاري الحفظ..."
                    : "Saving..."
                  : T.createMock}
              </button>
            )}
          </div>
        </div>

        {toast && <div style={toastStyle}>{toast}</div>}
      </form>

      <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
        <DownloadClientsTemplateButton />
        <UploadClientsButton />
      </div>
    </div>
  );
}

/* ====== رفع ملف للـ bucket ====== */
async function uploadClientFile(
  clientId: string,
  file: File | null,
  kind: "national" | "tax" | "commercial" | "agreement" | "logo"
): Promise<string | null> {
  if (!file) return null;

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${clientId}/${kind}-${Date.now()}-${safeName}`;

  const { error } = await supabase.storage.from("clients-files").upload(path, file, {
    upsert: true,
  });

  if (error) {
    console.error("upload error", error);
    throw error;
  }

  const { data } = supabase.storage.from("clients-files").getPublicUrl(path);
  return data.publicUrl ?? null;
}

/* ======================= المكوّنات المساعدة ======================= */

function Stepper({ labels, current }: { labels: string[]; current: 1 | 2 | 3 }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${labels.length}, 1fr)`,
        gap: 10,
        margin: "12px 0 20px",
      }}
    >
      {labels.map((label, i) => {
        const idx = (i + 1) as 1 | 2 | 3;
        const active = current === idx;
        return (
          <div
            key={label}
            style={{
              background: active ? "#333" : "#1a1a1a",
              border: `2px solid ${active ? "#f5a623" : "#2c2c2c"}`,
              color: "#fff",
              padding: "10px 12px",
              borderRadius: 10,
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
}

/* --- Styles مشتركة --- */
const sectionBox: React.CSSProperties = {
  background: "#0f0f0f",
  border: "1px solid #2c2c2c",
  borderRadius: 10,
  padding: 16,
  marginTop: 16,
};

const sectionTitle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 12,
  fontWeight: 700,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #333",
  background: "#1a1a1a",
  color: "#fff",
  outline: "none",
};

const primaryBtn: React.CSSProperties = {
  backgroundColor: "#f5a623",
  color: "#000",
  padding: "10px 16px",
  border: "none",
  borderRadius: 8,
  fontWeight: 800,
};

const secondaryBtn: React.CSSProperties = {
  backgroundColor: "#333",
  color: "#fff",
  padding: "10px 16px",
  border: "1px solid #444",
  borderRadius: 8,
  fontWeight: 700,
};

const chipBtn = (active: boolean): React.CSSProperties => ({
  padding: "8px 12px",
  borderRadius: 20,
  border: active ? "2px solid #f5a623" : "1px solid #444",
  background: active ? "#303030" : "#1a1a1a",
  color: "#eee",
  fontWeight: 700,
});

const toastStyle: React.CSSProperties = {
  marginTop: 16,
  background: "#1b1b1b",
  border: "1px solid #2c2c2c",
  padding: "10px 12px",
  borderRadius: 8,
  color: "#c7ffc7",
  fontWeight: 600,
};

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", marginBottom: 6, color: "#bbb", fontWeight: 600 }}>
        {label} {required ? <span style={{ color: "#f5a623" }}>*</span> : null}
      </label>
      {children}
    </div>
  );
}

function FileField({
  label,
  file,
  onFile,
  required,
  hint,
}: {
  label: string;
  file: File | null;
  onFile: (f: File | null) => void;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", marginBottom: 6, color: "#bbb", fontWeight: 600 }}>
        {label} {required ? <span style={{ color: "#f5a623" }}>*</span> : null}
      </label>
      <input
        type="file"
        accept="image/*,application/pdf"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        style={{ ...inputStyle, padding: 6 }}
      />
      {file ? (
        <div style={{ marginTop: 6, color: "#aaa", fontSize: 13 }}>
          {file.name} — {(file.size / 1024).toFixed(1)} KB
        </div>
      ) : null}
      {hint ? <div style={{ marginTop: 4, color: "#888", fontSize: 12 }}>{hint}</div> : null}
    </div>
  );
}

function MultiRow({
  label,
  options,
  values,
  onToggle,
}: {
  label: string;
  options: string[];
  values: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ marginBottom: 8, color: "#bbb", fontWeight: 600 }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {options.map((opt) => {
          const active = values.includes(opt);
          return (
            <button key={opt} type="button" onClick={() => onToggle(opt)} style={chipBtn(active)}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ======================= Step 1 ======================= */
function Step1Basic(props: Step1BasicProps) {
  const {
    T,
    name,
    setName,
    code,
    setCode,
    commercialNumber,
    setCommercialNumber,
    address,
    setAddress,
    nationalFile,
    setNationalFile,
    taxNumber,
    setTaxNumber,
    taxFile,
    setTaxFile,
    commercialFile,
    setCommercialFile,
    nationalAddress,
    setNationalAddress,
    agreementFile,
    setAgreementFile,
    logoFile,
    setLogoFile,
    markets,
    setMarkets,
    categories,
    setCategories,
    appStepsSelected,
    setAppStepsSelected,
    marketsOptions,
    categoriesOptions,
    stepsOptions,
    isValid,
    enableLocationCheck,
    setEnableLocationCheck,
    requireBiometrics,
    setRequireBiometrics,
    activateUsers,
    setActivateUsers,
    isArabic,
  } = props;

  return (
    <>
      <p style={{ color: "#bbb", marginTop: 0 }}>{T.requiredHint}</p>

      <section style={sectionBox}>
        <h3 style={sectionTitle}>{T.basicInfo}</h3>
        <Field label={T.name} required>
          <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        </Field>
        <Field label={T.code}>
          <input value={code} onChange={(e) => setCode(e.target.value)} style={inputStyle} />
        </Field>
        <Field label={T.commercialNumber} required>
          <input
            value={commercialNumber}
            onChange={(e) => setCommercialNumber(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label={T.address} required>
          <input value={address} onChange={(e) => setAddress(e.target.value)} style={inputStyle} />
        </Field>
      </section>

      <section style={sectionBox}>
        <h3 style={sectionTitle}>{T.files}</h3>
        <FileField label={T.nationalFile} required file={nationalFile} onFile={setNationalFile} />
        <Field label={T.taxNumber}>
          <input value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} style={inputStyle} />
        </Field>
        <FileField label={T.taxFile} file={taxFile} onFile={setTaxFile} />
        <FileField label={T.commercialFile} file={commercialFile} onFile={setCommercialFile} />
        <Field label={T.nationalAddress}>
          <input
            value={nationalAddress}
            onChange={(e) => setNationalAddress(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <FileField label={T.agreementFile} file={agreementFile} onFile={setAgreementFile} />
        <FileField label={T.logoFile} file={logoFile} onFile={setLogoFile} hint={T.logoFile} />
      </section>

      <section style={sectionBox}>
        <h3 style={sectionTitle}>{T.selections}</h3>

        <MultiSelect
          label={T.markets}
          options={marketsOptions}
          values={markets}
          onChange={setMarkets}
          placeholder={isArabic ? "اختر الأسواق..." : "Select markets..."}
          rtl={isArabic}
        />

        <MultiSelect
          label={T.categories}
          options={categoriesOptions}
          values={categories}
          onChange={setCategories}
          placeholder={isArabic ? "اختر الفئات..." : "Select categories..."}
          rtl={isArabic}
        />

        <MultiRow
          label={T.appSteps}
          options={stepsOptions}
          values={appStepsSelected}
          onToggle={(v) => toggleHelper(appStepsSelected, setAppStepsSelected, v)}
        />
      </section>

      <section style={sectionBox}>
        <h3 style={sectionTitle}>{T.toggles}</h3>

        <YesNoRow
          label={T.enableLocation}
          value={enableLocationCheck}
          onChange={setEnableLocationCheck}
          yes={T.yes}
          no={T.no}
        />
        <YesNoRow
          label={T.requireBio}
          value={requireBiometrics}
          onChange={setRequireBiometrics}
          yes={T.yes}
          no={T.no}
        />
        <YesNoRow
          label={T.activateUsers}
          value={activateUsers}
          onChange={setActivateUsers}
          yes={T.yes}
          no={T.no}
        />
      </section>

      {!isValid && <div style={{ marginTop: 10, color: "#ffb3b3" }} />}
    </>
  );
}

function toggleHelper(list: string[], setList: (v: string[]) => void, value: string) {
  setList(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
}

function YesNoRow({
  label,
  value,
  onChange,
  yes,
  no,
}: {
  label: string;
  value: YesNo;
  onChange: (v: YesNo) => void;
  yes: string;
  no: string;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ marginBottom: 6, color: "#bbb", fontWeight: 600 }}>{label}</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={() => onChange("yes")} style={chipBtn(value === "yes")}>
          {yes}
        </button>
        <button type="button" onClick={() => onChange("no")} style={chipBtn(value === "no")}>
          {no}
        </button>
      </div>
    </div>
  );
}

/* ======================= Step 2 ======================= */
function Step2Users(props: Step2UsersProps) {
  const { T, users, addUserRow, removeUserRow, updateUserRow, excelFile, handleExcelChange, roles, isValid, isArabic } =
    props;
  return (
    <>
      <section style={sectionBox}>
        <h3 style={sectionTitle}>{T.usersTitle}</h3>

        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <button type="button" onClick={addUserRow} style={primaryBtn}>
            {T.addUser}
          </button>

          <label
            style={{
              ...secondaryBtn,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <input type="file" accept=".xlsx,.xls" onChange={handleExcelChange} style={{ display: "none" }} />
            {T.importExcel}
          </label>

          {excelFile && (
            <div style={{ color: "#bbb", alignSelf: "center" }}>
              {(isArabic ? "ملف: " : "File: ") + excelFile.name}
            </div>
          )}
        </div>

        <div style={{ overflowX: "auto", border: "1px solid #2c2c2c", borderRadius: 8 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
            <thead>
              <tr style={{ background: "#151515" }}>
                {["name", "arabic_name", "username", "email", "mobile", "role", "active", "remove"].map((key) => (
                  <th key={key} style={thStyle}>
                    {(T.table as any)[key]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={tdStyle}>
                    <input
                      value={u.name ?? ""}
                      onChange={(e) => updateUserRow(u.id, { name: e.target.value })}
                      style={inputStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      value={u.arabic_name ?? ""}
                      onChange={(e) => updateUserRow(u.id, { arabic_name: e.target.value })}
                      style={inputStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      value={u.username ?? ""}
                      onChange={(e) => updateUserRow(u.id, { username: e.target.value })}
                      style={inputStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      value={u.email ?? ""}
                      onChange={(e) => updateUserRow(u.id, { email: e.target.value })}
                      style={inputStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      value={u.mobile ?? ""}
                      onChange={(e) => updateUserRow(u.id, { mobile: e.target.value })}
                      style={inputStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <select
                      value={u.role ?? ""}
                      onChange={(e) => updateUserRow(u.id, { role: e.target.value })}
                      style={{ ...inputStyle, background: "#1a1a1a" }}
                    >
                      <option value="">{isArabic ? "اختَر" : "Select"}</option>
                      {roles.map((r: string) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <select
                      value={u.active ?? "yes"}
                      onChange={(e) => updateUserRow(u.id, { active: e.target.value as YesNo })}
                      style={{ ...inputStyle, background: "#1a1a1a" }}
                    >
                      <option value="yes">{T.yes}</option>
                      <option value="no">{T.no}</option>
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <button
                      type="button"
                      onClick={() => removeUserRow(u.id)}
                      style={{ ...secondaryBtn, padding: "8px 12px" }}
                    >
                      {T.table.remove}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!isValid && <div style={{ marginTop: 10, color: "#ffb3b3" }}>{T.mustHaveOneUser}</div>}
      </section>
    </>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "start",
  color: "#bbb",
  padding: "10px 8px",
  borderBottom: "1px solid #2c2c2c",
  fontWeight: 700,
};
const tdStyle: React.CSSProperties = {
  padding: "8px",
  borderBottom: "1px solid #2c2c2c",
  verticalAlign: "middle",
};

/* ======================= Step 3 ======================= */
function Step3Review({ T, data, isArabic }: Step3ReviewProps) {
  const {
    name,
    code,
    commercialNumber,
    address,
    nationalFile,
    taxNumber,
    taxFile,
    commercialFile,
    nationalAddress,
    agreementFile,
    logoFile,
    markets,
    categories,
    appStepsSelected,
    enableLocationCheck,
    requireBiometrics,
    activateUsers,
    users,
  } = data;

  return (
    <>
      <section style={sectionBox}>
        <h3 style={sectionTitle}>{T.clientData}</h3>

        <KV label={isArabic ? "اسم العميل" : "Client Name"} value={name} />
        <KV label={isArabic ? "كود العميل" : "Client Code"} value={code || "-"} />
        <KV label={isArabic ? "السجل التجاري" : "Commercial No."} value={commercialNumber} />
        <KV label={isArabic ? "العنوان" : "Address"} value={address} />

        <KV label={T.nationalFile} value={nationalFile?.name || "-"} />
        <KV label={T.taxNumber} value={taxNumber || "-"} />
        <KV label={T.taxFile} value={taxFile?.name || "-"} />
        <KV label={T.commercialFile} value={commercialFile?.name || "-"} />
        <KV label={T.nationalAddress} value={nationalAddress || "-"} />
        <KV label={T.agreementFile} value={agreementFile?.name || "-"} />
        <KV label={T.logoFile} value={logoFile?.name || "-"} />

        <KV label={T.markets} value={markets.join(", ") || "-"} />
        <KV label={T.categories} value={categories.join(", ") || "-"} />
        <KV label={T.appSteps} value={appStepsSelected.join(", ") || "-"} />

        <KV label={T.enableLocation} value={enableLocationCheck === "yes" ? T.yes : T.no} />
        <KV label={T.requireBio} value={requireBiometrics === "yes" ? T.yes : T.no} />
        <KV label={T.activateUsers} value={activateUsers === "yes" ? T.yes : T.no} />
      </section>

      <section style={sectionBox}>
        <h3 style={sectionTitle}>{T.linkedUsersHeader}</h3>

        <div style={{ overflowX: "auto", border: "1px solid #2c2c2c", borderRadius: 8 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
            <thead>
              <tr style={{ background: "#151515" }}>
                {["name", "arabic_name", "username", "email", "mobile", "role", "active"].map((key) => (
                  <th key={key} style={thStyle}>
                    {(T.table as any)[key]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id}>
                  <td style={tdStyle}>{u.name || "-"}</td>
                  <td style={tdStyle}>{u.arabic_name || "-"}</td>
                  <td style={tdStyle}>{u.username || "-"}</td>
                  <td style={tdStyle}>{u.email || "-"}</td>
                  <td style={tdStyle}>{u.mobile || "-"}</td>
                  <td style={tdStyle}>{u.role || "-"}</td>
                  <td style={tdStyle}>{u.active === "yes" ? T.yes : T.no}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function KV({ label, value }: { label: string; value: string | number | boolean }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "6px 0", borderBottom: "1px dashed #2c2c2c" }}>
      <div style={{ minWidth: 220, color: "#bbb", fontWeight: 700 }}>{label}</div>
      <div style={{ color: "#fff" }}>{String(value)}</div>
    </div>
  );
}
