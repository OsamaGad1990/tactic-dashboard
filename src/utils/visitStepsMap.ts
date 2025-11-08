// utils/visitStepsMap.ts
export type StepKey =
  | "arrival_photos"
  | "availability"
  | "whcount"
  | "damage_reports"
  | "sos_reports"
  | "competitor_activity"
  | "remarks"
  | "promoter_reports"
  | "promoter_plus_reports"
  | "tl_details";

export type StepColumn = {
  key: string;
  labelEn: string;
  labelAr: string;
  type?: string;
  bucketHint?: string;
  lookup?: string;
};

export type StepLookupConfig = {
  table: string;
  select: string;
  labelField: string;
  labelFieldAr?: string;
};

export type StepConfig = {
  titleAr: string;
  titleEn: string;
  table: string;
  select: string;
  defaultOrder?: { column: string; ascending: boolean };
  columns: StepColumn[];
  lookups?: Record<string, StepLookupConfig>;
};

const BUCKETS = {
  arrival: "arrival-photos",
  availability: "availability-photos",
  whcount: "whcount-photos",
  damage: "damage-photos",
  sos: "sos-photos",
  competitor: "competitor-photos",
  promoter: "promoter-reports",
  promoterPlus: "promoter-plus-photos",
  tl: "tlphotos",
} as const;

export const VISIT_STEPS: Record<StepKey, StepConfig> = {
  arrival_photos: {
    titleAr: "صور الوصول",
    titleEn: "Arrival Photos",
    table: "arrivalphotos",
    select: "id, visit_id, user_id, photos, arrival_time, created_at",
    defaultOrder: { column: "created_at", ascending: false },
    columns: [
      { key: "jp_state_view", labelAr: "خط سير الزيارة", labelEn: "JP Status", type: "pill" },
      { key: "photos", labelAr: "الصور", labelEn: "Photos", type: "image", bucketHint: BUCKETS.arrival },
      { key: "arrival_time", labelAr: "التاريخ", labelEn: "Arrival Time", type: "datetime" },
      { key: "user_id", labelAr: "المستخدم", labelEn: "User", lookup: "user_id" },
      { key: "visit_id", labelAr: "الزيارة", labelEn: "Visit" },
    ],
    lookups: {
      user_id: {
        table: "Users",
        select: "id, auth_user_id, name, arabic_name, username",
        labelField: "name",
        labelFieldAr: "arabic_name",
      },
    },
  },

  availability: {
    titleAr: "التوافر",
    titleEn: "Availability",
    table: "availabilitydata",
    select: [
      "id",
      "visit_id",
      "user_id",
      "place_id",
      "category_id",
      "product_id",
      "is_available",
      "quantity",
      "reason_id",
      "custom_reason",
      "category_photos",
      "reason_photos",
      "place_photos",
      "created_at",
    ].join(", "),
    defaultOrder: { column: "created_at", ascending: false },
    columns: [
      { key: "jp_state_view", labelAr: "خط سير الزيارة", labelEn: "JP Status", type: "pill" },
      { key: "category_id", labelAr: "الفئة", labelEn: "Category", lookup: "category_id" },
      { key: "place_id", labelAr: "المكان", labelEn: "Place", lookup: "place_id" },
      { key: "product_id", labelAr: "المنتج", labelEn: "Product", lookup: "product_id" },
      { key: "is_available", labelAr: "حالة التوافر", labelEn: "Availability", type: "boolean" },
      { key: "quantity", labelAr: "الكمية", labelEn: "Qty", type: "number" },
      { key: "reason_id", labelAr: "السبب", labelEn: "Reason", lookup: "reason_id" },
      { key: "custom_reason", labelAr: "سبب مخصص", labelEn: "Custom Reason" },
      { key: "category_photos", labelAr: "صور الفئة", labelEn: "Category Photos", type: "image", bucketHint: BUCKETS.availability },
      { key: "reason_photos", labelAr: "صور السبب", labelEn: "Reason Photos", type: "image", bucketHint: BUCKETS.availability },
      { key: "place_photos", labelAr: "صور المكان", labelEn: "Place Photos", type: "image", bucketHint: BUCKETS.availability },
      { key: "user_id", labelAr: "المستخدم", labelEn: "User", lookup: "user_id" },
      { key: "created_at", labelAr: "التاريخ", labelEn: "Created At", type: "datetime" },
      { key: "visit_id", labelAr: "الزيارة", labelEn: "Visit" },
    ],
    lookups: {
      user_id: {
        table: "Users",
        select: "id, auth_user_id, name, arabic_name, username",
        labelField: "name",
        labelFieldAr: "arabic_name",
      },
      category_id: {
        table: "categories",
        select: "id, name, name_en, name_ar",
        labelField: "name_en",
        labelFieldAr: "name_ar",
      },
      place_id: {
        table: "availability_places",
        select: "id, name_en, name_ar",
        labelField: "name_en",
        labelFieldAr: "name_ar",
      },
      reason_id: {
        table: "reasons",
        select: "id, reason_en, reason_ar",
        labelField: "reason_en",
        labelFieldAr: "reason_ar",
      },
      product_id: {
        table: '"Products"',
        select: "id, name, arabic_name",
        labelField: "name",
        labelFieldAr: "arabic_name",
      },
    },
  },

  whcount: {
    titleAr: "المستودع",
    titleEn: "Warehouse",
    table: "whcount",
    select: [
      "id",
      "visit_id",
      "user_id",
      "market_id",
      "created_at",
      "item_name",
      "item_code",
      "is_available",
      "quantity",
      "warehouse_photos",
      "reason_photos",
      "not_available_reason",
      "custom_reason",
      "item_photo",
    ].join(", "),
    defaultOrder: { column: "created_at", ascending: false },
    columns: [
      { key: "created_at", labelAr: "التاريخ", labelEn: "Date", type: "datetime" },
      { key: "market_id", labelAr: "الفرع", labelEn: "Market", lookup: "market_id" },
      { key: "user_id", labelAr: "المستخدم", labelEn: "User" },
      { key: "item_name", labelAr: "اسم الصنف", labelEn: "Item Name" },
      { key: "item_code", labelAr: "كود الصنف", labelEn: "Item Code" },
      { key: "is_available", labelAr: "التواجد", labelEn: "Availability", type: "boolean" },
      { key: "quantity", labelAr: "الكمية", labelEn: "Quantity", type: "number" },
      { key: "warehouse_photos", labelAr: "صور المستودع", labelEn: "Warehouse Photos", type: "image", bucketHint: BUCKETS.whcount },
      { key: "item_photo", labelAr: "صورة الصنف", labelEn: "Item Photo", type: "image", bucketHint: BUCKETS.whcount },
      { key: "reason_photos", labelAr: "صور السبب", labelEn: "Reason Photos", type: "image", bucketHint: BUCKETS.whcount },
      { key: "not_available_reason", labelAr: "سبب عدم التواجد", labelEn: "Not available reason", lookup: "not_available_reason" },
      { key: "custom_reason", labelAr: "سبب مخصص", labelEn: "Custom Reason" },
      { key: "jp_state_view", labelAr: "خط سير الزيارة", labelEn: "JP State" },
    ],
    lookups: {
      not_available_reason: {
        table: "reasons",
        select: "id, reason_en, reason_ar",
        labelField: "reason_en",
        labelFieldAr: "reason_ar",
      },
      user_id: {
        table: "Users",
        select: "id, auth_user_id, name, arabic_name, username",
        labelField: "name",
        labelFieldAr: "arabic_name",
      },
      // 👇 لإظهار اسم الفرع
      market_id: {
        table: "Markets",
        select: "id, branch, store",
        labelField: "branch",
        labelFieldAr: "branch",
      },
    },
  },

  damage_reports: {
    titleAr: "التوالف",
    titleEn: "Damage Reports",
    table: "damagereports",
     select: [
    "id",
    "visit_id",
    "user_id",
    "market_id",
    "item_name",
    "main_photo",       
    "photos",
    "expire_date",
    "damaged_qty",
    "near_expire_date",
    "near_expire_qty",
    "expire_qty",
    "created_at",
    "jp_state"
    ].join(", "),
    defaultOrder: { column: "created_at", ascending: false },
    columns: [
      { key: "jp_state", labelAr: "JP حالة", labelEn: "JP Status", type: "pill" },
      { key: "main_photo",  labelAr: "الصور العامة", labelEn: "Main Photo", type: "image", bucketHint: BUCKETS.damage },
    { key: "photos",      labelAr: "صور التوالف",          labelEn: "Photos",      type: "image", bucketHint: BUCKETS.damage },
      { key: "item_name", labelAr: "العنصر", labelEn: "Item" },
      { key: "damaged_qty", labelAr: "تالف", labelEn: "Damaged", type: "number" },
      { key: "near_expire_qty", labelAr: "كمية قريب انتهاء", labelEn: "Near Exp. Qty", type: "number" },
      { key: "near_expire_date", labelAr: "تاريخ قريب انتهاء", labelEn: "Near Exp.", type: "datetime" },
      { key: "expire_qty", labelAr: "منتهي", labelEn: "Expired Qty", type: "number" },
      { key: "expire_date", labelAr: "تاريخ الانتهاء", labelEn: "Expire Date", type: "datetime" },
      { key: "user_id", labelAr: "المستخدم", labelEn: "User", lookup: "user_id" },
      { key: "market_id", labelAr: "الفرع", labelEn: "Market", lookup: "market_id" },
      { key: "created_at", labelAr: "التاريخ", labelEn: "Created At", type: "datetime" },
      { key: "visit_id", labelAr: "الزيارة", labelEn: "Visit" },
    ],
    lookups: {
      user_id: {
        table: "Users",
        select: "id, auth_user_id, name, arabic_name, username",
        labelField: "name",
        labelFieldAr: "arabic_name",
      },
 product_id: {
  table: '"Products"',
  select: "id, name, arabic_name",
  labelField: "name",
  labelFieldAr: "arabic_name",
},
      market_id: {
        table: "Markets",
        select: "id, branch, store",
        labelField: "branch",
        labelFieldAr: "branch",
      },
    },
  },

sos_reports: {
  titleAr: "حصة الرف",
  titleEn: "Share of Shelf",
  table: "sos_reports",
  select: [
    "id",
    "visit_id",
    "user_id",
    "market_id",
    "category_name_ar",
    "category_name_en",
    "percentage",
    "photos",
    "created_at"
  ].join(", "),
  defaultOrder: { column: "created_at", ascending: false },
  columns: [
    { key: "photos", labelAr: "الصور", labelEn: "Photos", type: "image", bucketHint: BUCKETS.sos },
    { key: "category_name", labelAr: "الفئة", labelEn: "Category" }, // ✅ هنا بدل الاتنين
    { key: "percentage", labelAr: "النسبة %", labelEn: "Percent %", type: "number" },
    { key: "user_id", labelAr: "المستخدم", labelEn: "User", lookup: "user_id" },
    { key: "market_id", labelAr: "الفرع", labelEn: "Market", lookup: "market_id" },
    { key: "created_at", labelAr: "التاريخ", labelEn: "Created At", type: "datetime" },
    { key: "visit_id", labelAr: "الزيارة", labelEn: "Visit" },
  ],
    lookups: {
      user_id: {
        table: "Users",
        select: "id, auth_user_id, name, arabic_name, username",
        labelField: "name",
        labelFieldAr: "arabic_name",
      },
      market_id: {
        table: "Markets",
        select: "id, branch, store",
        labelField: "branch",
        labelFieldAr: "branch",
      },
    },
  },

  competitor_activity: {
  titleAr: "نشاط المنافسين",
  titleEn: "Competitor Activity",
  table: "competitoractivities",
  select: [
    "id","visit_id","user_id","market_id","product_name","old_price","new_price",
    "notes","photos_before","created_at","jp_state","client_id" // لو عندك الحقل ده
  ].join(", "),
  defaultOrder: { column: "created_at", ascending: false },
  columns: [
    { key: "jp_state",       labelAr: "JP حالة", labelEn: "JP Status", type: "pill" },
    { key: "photos_before",  labelAr: "صور النشاط",     labelEn: "Before",    type: "image", bucketHint: BUCKETS.competitor },
    { key: "product_name",   labelAr: "المنتج",  labelEn: "Product" },
    { key: "old_price",      labelAr: "سعر قبل العرض",labelEn: "Old Price", type: "number" },
    { key: "new_price",      labelAr: "سعر بعد العرض",labelEn: "New Price", type: "number" },
    { key: "notes",          labelAr: "النشاط", labelEn: "activity" },
    { key: "user_id",        labelAr: "المستخدم",labelEn: "User", lookup: "user_id" },
    { key: "market_id",      labelAr: "الفرع",   labelEn: "Market", lookup: "market_id" }, // ✅
    { key: "created_at",     labelAr: "التاريخ", labelEn: "Created At", type: "datetime" },
    { key: "visit_id",       labelAr: "الزيارة", labelEn: "Visit" },
  ],
  lookups: {
    user_id: {
      table: "Users",
      select: "id, auth_user_id, name, arabic_name, username",
      labelField: "name",
      labelFieldAr: "arabic_name",
    },
    market_id: { // ✅
      table: "Markets",
      select: "id, branch, store",
      labelField: "branch",
      labelFieldAr: "branch",
    },
  },
},

  remarks: {
    titleAr: "ملاحظات",
    titleEn: "Remarks",
    table: "visitremarks",
    select: "id, visit_id, user_id, created_at, remark:remarks",
    defaultOrder: { column: "created_at", ascending: false },
    columns: [
      { key: "jp_state_view", labelAr: "JP حالة", labelEn: "JP Status", type: "pill" },
      { key: "remark", labelAr: "الملاحظة", labelEn: "Remark" },
      { key: "user_id", labelAr: "المستخدم", labelEn: "User", lookup: "user_id" },
      { key: "created_at", labelAr: "التاريخ", labelEn: "Created At", type: "datetime" },
      { key: "visit_id", labelAr: "الزيارة", labelEn: "Visit" },
    ],
    lookups: {
      user_id: {
        table: "Users",
        select: "id, auth_user_id, name, arabic_name, username",
        labelField: "name",
        labelFieldAr: "arabic_name",
      },
    },
  },

  promoter_reports: {
    titleAr: "تقارير المروج",
    titleEn: "Promoter Reports",
    table: "promoter_reports",
    select: [
      "id",
      "created_at",
      "user_id",
      "market_id",
      "visit_count",
      "use_count",
      "refuse_count",
      "buy_count",
      "best_seller",
      "image_urls",
    ].join(", "),
    columns: [
      { key: "created_at", labelEn: "Date", labelAr: "التاريخ", type: "datetime" },
      { key: "user_id", labelEn: "User", labelAr: "المستخدم", type: "text", lookup: "user_id" },
      { key: "visit_count", labelEn: "Visits", labelAr: "الزيارات", type: "number" },
      { key: "use_count", labelEn: "Use count", labelAr: "استخدم", type: "number" },
      { key: "refuse_count", labelEn: "Refused", labelAr: "رفض الاستخدام", type: "number" },
      { key: "buy_count", labelEn: "Bought", labelAr: "تم الشراء", type: "number" },
      { key: "best_seller", labelEn: "Best Seller", labelAr: "الأكثر مبيعًا", type: "text" },
      { key: "image_urls", labelEn: "Photos", labelAr: "الصور", type: "image", bucketHint: BUCKETS.promoter },
      { key: "market_id", labelEn: "Market", labelAr: "الفرع", lookup: "market_id" },
    ],
    lookups: {
      user_id: {
        table: "Users",
        select: "id, name, arabic_name, username",
        labelField: "name",
        labelFieldAr: "arabic_name",
      },
      // 👇 لعرض الفرع فقط
      market_id: {
        table: "Markets",
        select: "id, branch, store",
        labelField: "branch",
        labelFieldAr: "branch",
      },
    },
  },

  promoter_plus_reports: {
    titleAr: "تفاصيل المروج",
    titleEn: "Promoter Details",
    table: "promoter_plus_reports",
    select: "id, visit_id, user_id, items, photos, created_at",
    defaultOrder: { column: "created_at", ascending: false },
    columns: [
      { key: "jp_state_view", labelAr: "خط سير الزيارة", labelEn: "JP Status", type: "pill" },
      { key: "product_id", labelAr: "اسم المنتج", labelEn: "Product Name" },
      { key: "is_available", labelAr: "الحالة", labelEn: "Status" },
      { key: "quantity", labelAr: "العدد المباع", labelEn: "Sold Qty" },
      { key: "photos", labelAr: "الصور", labelEn: "Photos", type: "image", bucketHint: BUCKETS.promoterPlus },
      { key: "created_at", labelAr: "التاريخ", labelEn: "Created At", type: "datetime" },
    ],
  },

  tl_details: {
    titleAr: "تفاصيل قائد الفريق",
    titleEn: "TL Details",
    table: "tlvisitdetails",
    select: "id, visit_id, user_id, photo_url, remark, created_at",
    defaultOrder: { column: "created_at", ascending: false },
    columns: [
      { key: "jp_state_view", labelAr: "خط سير الزيارة", labelEn: "JP Status", type: "pill" },
      { key: "photo_url", labelAr: "الصورة", labelEn: "Photo", type: "image", bucketHint: BUCKETS.tl },
      { key: "remark", labelAr: "ملاحظة", labelEn: "Remark" },
      { key: "user_id", labelEn: "User", labelAr: "المستخدم", type: "text", lookup: "user_id" },
      { key: "created_at", labelAr: "التاريخ", labelEn: "Created At", type: "datetime" },
    ],
    lookups: {
      user_id: {
        table: "Users",
        select: "id, name, arabic_name, username",
        labelField: "name",
        labelFieldAr: "arabic_name",
      },
    },
  },
};
