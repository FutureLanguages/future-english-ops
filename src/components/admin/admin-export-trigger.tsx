"use client";

import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

type ExportScope = "all" | "selected" | "status";
type ExportFormat = "xlsx" | "pdf";

const dataTypeOptions = {
  student: {
    label: "بيانات الطالب",
    fields: {
      student_name: "الاسم",
      student_mobile: "رقم الجوال",
      student_nationality: "الجنسية",
      student_passport: "رقم الجواز",
      student_city: "المدينة",
      student_school: "المدرسة",
    },
  },
  parent: {
    label: "بيانات ولي الأمر",
    fields: {
      parent_name: "الاسم",
      parent_mobile: "رقم الجوال",
      parent_relation: "نوع العلاقة",
    },
  },
  application: {
    label: "بيانات الطلب",
    fields: {
      application_status: "الحالة",
      application_created_at: "تاريخ الإنشاء",
    },
  },
  documents: {
    label: "بيانات المستندات",
    fields: {
      documents_names: "اسم المستند",
      documents_statuses: "الحالة",
      documents_notes: "ملاحظة الإدارة",
    },
  },
  payments: {
    label: "بيانات الدفع",
    fields: {
      payment_total: "المبلغ الكلي",
      payment_paid: "المدفوع",
      payment_remaining: "المتبقي",
    },
  },
  health: {
    label: "الحالة الصحية والسلوكية",
    fields: {
      health_medical_conditions: "حالات مرضية",
      health_allergies: "الحساسية",
      health_medications: "أدوية مستمرة",
      health_sleep_disorders: "اضطرابات النوم",
      health_bedwetting: "التبول اللاإرادي",
      health_phobias: "رهاب",
      health_special_attention: "متابعة خاصة",
      parent_supervisor_notes: "ملاحظات ولي الأمر للمشرفين",
    },
  },
} as const;

export function AdminExportTrigger({
  currentFilters,
  selectedIds = [],
  title = "تصدير البيانات",
}: {
  currentFilters?: {
    q?: string;
    status?: string;
    view?: string;
  };
  selectedIds?: string[];
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<ExportScope>("all");
  const [format, setFormat] = useState<ExportFormat>("xlsx");
  const [scopeStatus, setScopeStatus] = useState(currentFilters?.status ?? "");
  const [types, setTypes] = useState<Array<keyof typeof dataTypeOptions>>([
    "student",
    "parent",
    "application",
  ]);
  const [fields, setFields] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const availableFields = useMemo(() => {
    return types.flatMap((type) =>
      Object.entries(dataTypeOptions[type].fields).map(([key, label]) => ({
        key,
        label,
        type,
      })),
    );
  }, [types]);

  const effectiveFields = fields.length > 0 ? fields : availableFields.map((field) => field.key);

  function toggleType(type: keyof typeof dataTypeOptions) {
    setTypes((current) =>
      current.includes(type) ? current.filter((item) => item !== type) : [...current, type],
    );
  }

  function toggleField(fieldKey: string) {
    setFields((current) =>
      current.includes(fieldKey)
        ? current.filter((item) => item !== fieldKey)
        : [...current, fieldKey],
    );
  }

  function startDownload() {
    if (types.length === 0) {
      setMessage("يرجى اختيار نوع بيانات واحد على الأقل.");
      return;
    }

    if (scope === "selected" && selectedIds.length === 0) {
      setMessage("لا توجد صفوف محددة للتصدير.");
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const params = new URLSearchParams();
      params.set("format", format);
      params.set("scope", scope);

      if (currentFilters?.q) params.set("q", currentFilters.q);
      if (currentFilters?.status) params.set("status", currentFilters.status);
      if (currentFilters?.view) params.set("view", currentFilters.view);
      if (scope === "status" && scopeStatus) params.set("scopeStatus", scopeStatus);
      for (const type of types) params.append("dataTypes", type);
      for (const field of effectiveFields) params.append("fields", field);
      for (const id of selectedIds) params.append("selectedIds", id);

      const response = await fetch(`/admin/exports?${params.toString()}`);

      if (!response.ok) {
        setMessage("تعذر إنشاء ملف التصدير حالياً.");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = format === "pdf" ? "future-english-export.pdf" : "future-english-export.xlsx";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage("تم تجهيز الملف بنجاح.");
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-pine px-4 py-2 text-sm font-semibold text-white"
      >
        <Download className="h-4 w-4" />
        <span>{title}</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/35 p-4">
          <div className="mx-auto my-6 w-full max-w-3xl max-h-[calc(100vh-3rem)] overflow-y-auto rounded-panel bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-ink">تصدير البيانات</h2>
                <p className="mt-1 text-sm text-ink/65">
                  اختر نطاق البيانات ونوعها والحقول المطلوبة ثم نزّل الملف بصيغة Excel أو PDF.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-black/10 px-3 py-1 text-sm font-semibold text-ink"
              >
                إغلاق
              </button>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <section className="rounded-2xl bg-sand p-4">
                <h3 className="text-sm font-bold text-ink">1) نطاق البيانات</h3>
                <div className="mt-3 space-y-2 text-sm text-ink/80">
                  <label className="flex items-center gap-2">
                    <input type="radio" checked={scope === "all"} onChange={() => setScope("all")} />
                    <span>كل الطلاب</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={scope === "selected"}
                      onChange={() => setScope("selected")}
                      disabled={selectedIds.length === 0}
                    />
                    <span>طلاب محددون ({selectedIds.length})</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" checked={scope === "status"} onChange={() => setScope("status")} />
                    <span>حسب الحالة</span>
                  </label>
                  {scope === "status" ? (
                    <select
                      value={scopeStatus}
                      onChange={(event) => setScopeStatus(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm outline-none"
                    >
                      <option value="">اختر الحالة</option>
                      <option value="NEW">جديد</option>
                      <option value="INCOMPLETE">توجد نواقص</option>
                      <option value="UNDER_REVIEW">قيد المراجعة</option>
                      <option value="WAITING_PAYMENT">بانتظار الدفع</option>
                      <option value="COMPLETED">مكتمل</option>
                    </select>
                  ) : null}
                </div>
              </section>

              <section className="rounded-2xl bg-sand p-4">
                <h3 className="text-sm font-bold text-ink">2) نوع البيانات</h3>
                <div className="mt-3 grid gap-2 text-sm text-ink/80">
                  {Object.entries(dataTypeOptions).map(([key, config]) => (
                    <label key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={types.includes(key as keyof typeof dataTypeOptions)}
                        onChange={() => toggleType(key as keyof typeof dataTypeOptions)}
                      />
                      <span>{config.label}</span>
                    </label>
                  ))}
                </div>
              </section>
            </div>

            <section className="mt-5 rounded-2xl bg-sand p-4">
              <h3 className="text-sm font-bold text-ink">3) الحقول</h3>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                {types.map((type) => (
                  <div key={type}>
                    <div className="mb-2 text-sm font-semibold text-ink">{dataTypeOptions[type].label}</div>
                    <div className="space-y-2 text-sm text-ink/80">
                      {Object.entries(dataTypeOptions[type].fields).map(([fieldKey, label]) => (
                        <label key={fieldKey} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={effectiveFields.includes(fieldKey)}
                            onChange={() => toggleField(fieldKey)}
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-5 rounded-2xl bg-sand p-4">
              <h3 className="text-sm font-bold text-ink">4) الصيغة</h3>
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setFormat("xlsx")}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                    format === "xlsx" ? "bg-pine text-white" : "bg-white text-ink"
                  }`}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Excel (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormat("pdf")}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                    format === "pdf" ? "bg-pine text-white" : "bg-white text-ink"
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>PDF</span>
                </button>
              </div>
            </section>

            {message ? (
              <div className="mt-4 rounded-2xl bg-mist px-4 py-3 text-sm font-medium text-ink">
                {message}
              </div>
            ) : null}

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold text-ink"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={startDownload}
                disabled={isPending}
                className="rounded-2xl bg-pine px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
              >
                {isPending ? "جارٍ تجهيز الملف..." : "تنزيل الملف"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
