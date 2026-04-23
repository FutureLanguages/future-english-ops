import { ApplicationStatus } from "@prisma/client";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import * as XLSX from "xlsx";
import { buildAdminApplicationDerivedData } from "@/features/admin/server/load-admin-applications";
import { prisma } from "@/lib/db/prisma";
import type { DocumentRequirementRecord } from "@/types/application";

export const exportDataTypeOptions = {
  student: {
    label: "بيانات الطالب",
    fields: {
      student_name: "اسم الطالب",
      student_mobile: "رقم جوال الطالب",
      student_nationality: "الجنسية",
      student_passport: "رقم الجواز",
      student_city: "المدينة",
      student_school: "المدرسة",
    },
  },
  parent: {
    label: "بيانات ولي الأمر",
    fields: {
      parent_name: "اسم ولي الأمر",
      parent_mobile: "رقم جوال ولي الأمر",
      parent_relation: "نوع العلاقة",
    },
  },
  application: {
    label: "بيانات الطلب",
    fields: {
      application_status: "حالة الطلب",
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

export type ExportDataTypeKey = keyof typeof exportDataTypeOptions;
export type ExportFieldKey = {
  [K in ExportDataTypeKey]: keyof (typeof exportDataTypeOptions)[K]["fields"];
}[ExportDataTypeKey];

const applicationStatusLabels: Record<ApplicationStatus, string> = {
  NEW: "جديد",
  INCOMPLETE: "توجد نواقص",
  UNDER_REVIEW: "قيد المراجعة",
  WAITING_PAYMENT: "بانتظار الدفع",
  COMPLETED: "مكتمل",
};

const documentStatusLabels: Record<string, string> = {
  MISSING: "مفقود",
  UPLOADED: "مرفوع",
  UNDER_REVIEW: "قيد المراجعة",
  APPROVED: "مقبول",
  REJECTED: "مرفوض",
  REUPLOAD_REQUESTED: "إعادة رفع",
};

const parentTypeLabels: Record<string, string> = {
  FATHER: "الأب",
  MOTHER: "الأم",
  GUARDIAN: "الوصي",
};

const orderedFieldKeys: ExportFieldKey[] = [
  "student_name",
  "student_mobile",
  "student_nationality",
  "student_passport",
  "student_city",
  "student_school",
  "parent_name",
  "parent_mobile",
  "parent_relation",
  "application_status",
  "application_created_at",
  "documents_names",
  "documents_statuses",
  "documents_notes",
  "payment_total",
  "payment_paid",
  "payment_remaining",
  "health_medical_conditions",
  "health_allergies",
  "health_medications",
  "health_sleep_disorders",
  "health_bedwetting",
  "health_phobias",
  "health_special_attention",
  "parent_supervisor_notes",
];

type ExportFilters = {
  q?: string;
  status?: string;
  view?: string;
  scope?: string;
  selectedIds?: string[];
  scopeStatus?: string;
};

function normalizeFieldSelection(dataTypes: string[], fields: string[]): ExportFieldKey[] {
  const allowed = new Set<ExportFieldKey>();

  for (const dataType of dataTypes as ExportDataTypeKey[]) {
    const config = exportDataTypeOptions[dataType];

    if (!config) {
      continue;
    }

    for (const fieldKey of Object.keys(config.fields) as ExportFieldKey[]) {
      allowed.add(fieldKey);
    }
  }

  const requested = fields.filter((field): field is ExportFieldKey =>
    allowed.has(field as ExportFieldKey),
  );

  return requested.length > 0
    ? orderedFieldKeys.filter((field) => requested.includes(field))
    : orderedFieldKeys.filter((field) => allowed.has(field));
}

async function loadApplicationsForExport(filters: ExportFilters) {
  const [applications, requirementRows] = await Promise.all([
    prisma.application.findMany({
      include: {
        studentProfile: true,
        studentHealthProfile: true,
        parentSupervisorNote: true,
        studentUser: {
          select: {
            mobileNumber: true,
          },
        },
        parentProfiles: true,
        documents: {
          include: {
            requirement: true,
          },
        },
        parentUser: {
          select: {
            mobileNumber: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
    prisma.documentRequirement.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        sortOrder: "asc",
      },
    }),
  ]);

  const requirements = requirementRows as unknown as DocumentRequirementRecord[];

  const derived = applications.map((application) => {
    const result = buildAdminApplicationDerivedData({
      application,
      requirements,
    });

    return {
      application,
      derived: result,
      row: result.row,
    };
  });

  let filtered = derived.slice();
  const q = filters.q?.trim().toLowerCase() ?? "";
  const view = filters.view === "all" ? "all" : "needs_action";

  if (view === "needs_action") {
    filtered = filtered.filter((item) => item.row.needsAction);
  }

  if (filters.status) {
    filtered = filtered.filter((item) => item.row.status === filters.status);
  }

  if (q) {
    filtered = filtered.filter((item) => {
      return (
        item.row.studentName.toLowerCase().includes(q) ||
        item.row.parentMobileNumber.toLowerCase().includes(q)
      );
    });
  }

  if (filters.scope === "selected" && (filters.selectedIds?.length ?? 0) > 0) {
    const selected = new Set(filters.selectedIds);
    filtered = filtered.filter((item) => selected.has(item.application.id));
  }

  if (filters.scope === "status" && filters.scopeStatus) {
    filtered = filtered.filter((item) => item.application.status === filters.scopeStatus);
  }

  return filtered;
}

function buildExportRows(
  records: Awaited<ReturnType<typeof loadApplicationsForExport>>,
  fields: ExportFieldKey[],
) {
  return records.map(({ application, derived }) => {
    const studentProfile = application.studentProfile;
    const parentProfiles = application.parentProfiles;
    const parentName =
      parentProfiles.find((profile) => Boolean(profile.fullName?.trim()))?.fullName ??
      "ولي أمر بدون اسم";
    const parentRelations = parentProfiles
      .map((profile) => parentTypeLabels[profile.type] ?? profile.type)
      .filter(Boolean)
      .join("، ");
    const checklist = derived.checklist;

    const documentsNames = checklist.map((item) => item.titleAr).join("\n");
    const documentsStatuses = checklist
      .map((item) => `${item.titleAr}: ${documentStatusLabels[item.status] ?? item.status}`)
      .join("\n");
    const documentsNotes = checklist
      .filter((item) => Boolean(item.adminNote))
      .map((item) => `${item.titleAr}: ${item.adminNote}`)
      .join("\n");

    const fieldValues: Record<ExportFieldKey, string> = {
      student_name: studentProfile?.fullNameAr ?? "طالب بدون اسم",
      student_mobile: application.studentUser.mobileNumber,
      student_nationality: studentProfile?.nationality ?? "",
      student_passport: studentProfile?.passportNumber ?? "",
      student_city: studentProfile?.city ?? "",
      student_school: studentProfile?.schoolName ?? "",
      parent_name: parentName,
      parent_mobile: application.parentUser.mobileNumber,
      parent_relation: parentRelations,
      application_status: applicationStatusLabels[application.status],
      application_created_at: new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(
        application.createdAt,
      ),
      documents_names: documentsNames,
      documents_statuses: documentsStatuses,
      documents_notes: documentsNotes,
      payment_total: `${derived.paymentSummary.totalCostSar}`,
      payment_paid: `${derived.paymentSummary.paidAmountSar}`,
      payment_remaining: `${derived.paymentSummary.remainingAmountSar}`,
      health_medical_conditions: application.studentHealthProfile?.hasMedicalConditions ? "نعم" : "لا",
      health_allergies: application.studentHealthProfile?.hasAllergies ? "نعم" : "لا",
      health_medications: application.studentHealthProfile?.hasContinuousMedication ? "نعم" : "لا",
      health_sleep_disorders: application.studentHealthProfile?.hasSleepDisorders ? "نعم" : "لا",
      health_bedwetting: application.studentHealthProfile?.hasBedwetting ? "نعم" : "لا",
      health_phobias: application.studentHealthProfile?.hasPhobia ? "نعم" : "لا",
      health_special_attention: application.studentHealthProfile?.needsSpecialSupervisorFollowUp ? "نعم" : "لا",
      parent_supervisor_notes: application.parentSupervisorNote?.body ?? "",
    };

    const row: Record<string, string> = {};

    for (const field of fields) {
      const label =
        Object.values(exportDataTypeOptions)
          .map((group) => group.fields)
          .find((groupFields) => field in groupFields)?.[field as never] ?? field;
      row[label as string] = fieldValues[field] ?? "";
    }

    return row;
  });
}

export async function generateExcelExport(params: {
  filters: ExportFilters;
  dataTypes: string[];
  fields: string[];
}) {
  const records = await loadApplicationsForExport(params.filters);
  const selectedFields = normalizeFieldSelection(params.dataTypes, params.fields);
  const rows = buildExportRows(records, selectedFields);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!rtl"] = true;
  const workbook = XLSX.utils.book_new();
  workbook.Workbook = { Views: [{ RTL: true }] };
  XLSX.utils.book_append_sheet(workbook, worksheet, "البيانات");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

function wrapText(text: string, maxChars = 70) {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (next.length > maxChars) {
      if (current) {
        lines.push(current);
      }
      current = word;
    } else {
      current = next;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function getApplicationBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/g, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return null;
}

async function loadBundledFontBytes(filename: string) {
  const baseUrl = getApplicationBaseUrl();

  if (!baseUrl) {
    return null;
  }

  const response = await fetch(`${baseUrl}/fonts/${filename}`);

  if (!response.ok) {
    return null;
  }

  return new Uint8Array(await response.arrayBuffer());
}

export async function generatePdfExport(params: {
  filters: ExportFilters;
  dataTypes: string[];
  fields: string[];
}) {
  const records = await loadApplicationsForExport(params.filters);
  const selectedFields = normalizeFieldSelection(params.dataTypes, params.fields);
  const rows = buildExportRows(records, selectedFields);
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  let font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBytes = await loadBundledFontBytes("tajawal-arabic-400-normal.woff2");

  if (fontBytes) {
    font = await pdf.embedFont(fontBytes);
  }

  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([842, 595]);
  let y = 560;
  const margin = 36;

  const drawLine = (text: string, x: number, size = 10, bold = false) => {
    page.drawText(text, {
      x,
      y,
      size,
      font: bold ? boldFont : font,
      color: rgb(0.07, 0.13, 0.18),
    });
  };

  drawLine("تقرير تصدير البيانات", 650, 16, true);
  y -= 28;
  drawLine(`عدد السجلات: ${rows.length}`, 680, 10);
  y -= 24;

  for (const row of rows) {
    const entries = Object.entries(row);

    for (const [label, value] of entries) {
      if (y < 70) {
        page = pdf.addPage([842, 595]);
        y = 560;
      }

      drawLine(label, 690, 10, true);
      y -= 14;
      const textLines = wrapText(value || "-", 78);

      for (const line of textLines) {
        drawLine(line, margin, 10);
        y -= 14;
      }

      y -= 8;
    }

    page.drawLine({
      start: { x: margin, y },
      end: { x: 806, y },
      thickness: 0.7,
      color: rgb(0.84, 0.76, 0.66),
    });
    y -= 18;
  }

  return Buffer.from(await pdf.save());
}
