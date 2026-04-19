import { UserRole } from "@prisma/client";
import { canEditParentInfo, canEditStudentInfo } from "@/features/auth/services";
import { loadPortalApplicationData } from "@/features/portal/server/load-portal-application";
import { buildPortalNavItems } from "@/features/portal/server/nav";
import type { ApplicationUser, ParentProfileRecord } from "@/types/application";
import type { PortalNavItem } from "@/types/portal";

type ProfileSectionView = {
  id: string;
  title: string;
  description: string;
  statusLabel: string;
  statusTone: "editable" | "locked" | "readonly";
  locked: boolean;
  lockLabel: string;
  fields: Array<{
    label: string;
    value: string;
    missing?: boolean;
  }>;
  missingFields: string[];
  actionLabel?: string;
  actionDisabledReason?: string;
};

export type PortalProfileViewModel = {
  role: "STUDENT" | "PARENT";
  mobileNumber: string;
  activeUserLabel: string;
  studentName: string;
  status: "NEW" | "INCOMPLETE" | "UNDER_REVIEW" | "WAITING_PAYMENT" | "COMPLETED";
  overallCompletion: {
    percent: number;
    label: string;
    tone: "complete" | "incomplete";
  };
  navItems: PortalNavItem[];
  applicationOptions: Array<{ id: string; label: string }>;
  selectedApplicationId: string;
  sections: ProfileSectionView[];
  studentEditor: {
    canEdit: boolean;
    applicationId: string;
    values: {
      fullNameAr: string;
      fullNameEn: string;
      birthDate: string;
      gender: string;
      nationality: string;
      nationalIdNumber: string;
      city: string;
      schoolName: string;
      passportNumber: string;
    };
  };
  parentLinkEditor: {
    visible: boolean;
    applicationId: string;
  };
  parentEditors: Array<{
    id: string;
    title: string;
    parentType: ParentProfileRecord["type"];
    canEdit: boolean;
    locked: boolean;
    applicationId: string;
    values: {
      fullName: string;
      mobileNumber: string;
      passportNumber: string;
      nationalIdNumber: string;
      relationToStudent: string;
      note: string;
      isDeceased: boolean;
    };
  }>;
};

function formatDate(date: Date | null): string {
  if (!date) {
    return "غير مضاف";
  }

  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function valueOrFallback(value: string | null | undefined): string {
  return value && value.trim().length > 0 ? value : "غير مضاف";
}

function parentByType(parentProfiles: ParentProfileRecord[], type: ParentProfileRecord["type"]) {
  return parentProfiles.find((profile) => profile.type === type) ?? null;
}

function sectionStatus(params: {
  canEdit: boolean;
  locked: boolean;
  roleOwnsSection: boolean;
}): Pick<ProfileSectionView, "statusLabel" | "statusTone" | "actionLabel" | "actionDisabledReason"> {
  if (params.canEdit) {
    return {
      statusLabel: "قابل للتعديل",
      statusTone: "editable",
    };
  }

  if (params.locked && params.roleOwnsSection) {
    return {
      statusLabel: "مقفل",
      statusTone: "locked",
      actionDisabledReason: "القسم مقفل حالياً",
    };
  }

  return {
    statusLabel: "عرض فقط",
    statusTone: "readonly",
    actionDisabledReason: "غير متاح لهذا الحساب",
  };
}

function profileLockPresentation(locked: boolean) {
  return {
    locked,
    lockLabel: locked ? "هذا القسم مقفل" : "القسم متاح للتعديل",
  };
}

export async function getPortalProfileViewModel(params: {
  user: ApplicationUser;
  applicationId?: string;
}): Promise<PortalProfileViewModel | null> {
  const data = await loadPortalApplicationData(params);

  if (!data) {
    return null;
  }

  const studentCanEdit = canEditStudentInfo(data.user, data.applicationRecord);
  const parentCanEdit = canEditParentInfo(data.user, data.applicationRecord);
  const sharedParentCanEdit =
    parentCanEdit ||
    (data.user.role === UserRole.STUDENT &&
      data.applicationRecord.studentUserId === data.user.id &&
      !data.applicationRecord.parentInfoLocked);
  const studentProfile = data.applicationRecord.studentProfile;
  const father = parentByType(data.applicationRecord.parentProfiles, "FATHER");
  const mother = parentByType(data.applicationRecord.parentProfiles, "MOTHER");
  const guardian = parentByType(data.applicationRecord.parentProfiles, "GUARDIAN");

  const studentMissing = new Set(data.profile.missingStudentFields.map((field) => field.field));
  const missingByParentType = data.profile.missingParentFields.reduce<Record<string, string[]>>(
    (accumulator, field) => {
      accumulator[field.parentType] ??= [];
      accumulator[field.parentType].push(field.label);
      return accumulator;
    },
    {},
  );

  const sections: ProfileSectionView[] = [
    {
      id: "student",
      title: "بيانات الطالب",
      description: "البيانات الأساسية للطالب كما تظهر في الطلب.",
      ...profileLockPresentation(
        data.applicationRecord.studentInfoLocked ||
          data.applicationRecord.studentBasicInfoLocked ||
          data.applicationRecord.studentAdditionalInfoLocked,
      ),
      ...sectionStatus({
        canEdit: studentCanEdit,
        locked: data.applicationRecord.studentInfoLocked,
        roleOwnsSection: data.user.role === UserRole.STUDENT || data.user.role === UserRole.PARENT,
      }),
      fields: [
        { label: "الاسم بالعربية", value: valueOrFallback(studentProfile?.fullNameAr), missing: studentMissing.has("fullNameAr") },
        { label: "الاسم بالإنجليزية", value: valueOrFallback(studentProfile?.fullNameEn) },
        { label: "تاريخ الميلاد", value: formatDate(studentProfile?.birthDate ?? null), missing: studentMissing.has("birthDate") },
        { label: "الجنس", value: valueOrFallback(studentProfile?.gender) },
        { label: "الجنسية", value: valueOrFallback(studentProfile?.nationality) },
        { label: "رقم الهوية / الإقامة", value: valueOrFallback(studentProfile?.nationalIdNumber) },
        { label: "المدينة", value: valueOrFallback(studentProfile?.city), missing: studentMissing.has("city") },
        { label: "رقم الجواز", value: valueOrFallback(studentProfile?.passportNumber), missing: studentMissing.has("passportNumber") },
        { label: "المدرسة", value: valueOrFallback(studentProfile?.schoolName) },
      ],
      missingFields: data.profile.missingStudentFields.map((field) => field.label),
    },
    {
      id: "father",
      title: "بيانات الأب",
      description: father?.isDeceased
        ? "تم تسجيل حالة الأب كمتوفي، لذلك لا تعتبر بياناته الأساسية مطلوبة."
        : "بيانات الأب الأساسية المرتبطة بالطلب.",
      ...profileLockPresentation(
        data.applicationRecord.parentInfoLocked || data.applicationRecord.fatherInfoLocked,
      ),
      ...sectionStatus({
        canEdit: sharedParentCanEdit,
        locked: data.applicationRecord.parentInfoLocked,
        roleOwnsSection: data.user.role === UserRole.PARENT || data.user.role === UserRole.STUDENT,
      }),
      fields: [
        { label: "الاسم", value: valueOrFallback(father?.fullName), missing: (missingByParentType.FATHER ?? []).includes("اسم الأب") },
        { label: "الجوال", value: valueOrFallback(father?.mobileNumber), missing: (missingByParentType.FATHER ?? []).includes("جوال الأب") },
        { label: "رقم الجواز", value: valueOrFallback(father?.passportNumber), missing: (missingByParentType.FATHER ?? []).includes("جواز الأب") },
        { label: "الهوية", value: valueOrFallback(father?.nationalIdNumber) },
        { label: "الحالة", value: father?.isDeceased ? "متوفي" : "نشط" },
        { label: "ملاحظة", value: valueOrFallback(father?.note) },
      ],
      missingFields: missingByParentType.FATHER ?? [],
    },
  ];

  if (data.context.requiresMotherData || mother) {
    sections.push({
      id: "mother",
      title: "بيانات الأم",
      description: data.context.requiresMotherData
        ? "هذه البيانات مطلوبة لأن عمر الطالب أقل من 16 سنة."
        : "بيانات الأم المسجلة في الطلب.",
      ...profileLockPresentation(
        data.applicationRecord.parentInfoLocked || data.applicationRecord.motherInfoLocked,
      ),
      ...sectionStatus({
        canEdit: sharedParentCanEdit,
        locked: data.applicationRecord.parentInfoLocked,
        roleOwnsSection: data.user.role === UserRole.PARENT || data.user.role === UserRole.STUDENT,
      }),
      fields: [
        { label: "الاسم", value: valueOrFallback(mother?.fullName), missing: (missingByParentType.MOTHER ?? []).includes("اسم الأم") },
        { label: "الجوال", value: valueOrFallback(mother?.mobileNumber), missing: (missingByParentType.MOTHER ?? []).includes("جوال الأم") },
        { label: "رقم الجواز", value: valueOrFallback(mother?.passportNumber), missing: (missingByParentType.MOTHER ?? []).includes("جواز الأم") },
        { label: "الهوية", value: valueOrFallback(mother?.nationalIdNumber) },
      ],
      missingFields: missingByParentType.MOTHER ?? [],
    });
  }

  if (data.context.hasDeceasedFather || data.context.hasGuardianProfile) {
    sections.push({
      id: "guardian",
      title: "بيانات الوصي",
      description: "يظهر هذا القسم لأن الطلب يتضمن حالة وصاية أو وجود وصي مسجل.",
      ...profileLockPresentation(
        data.applicationRecord.parentInfoLocked || data.applicationRecord.guardianInfoLocked,
      ),
      ...sectionStatus({
        canEdit: sharedParentCanEdit,
        locked: data.applicationRecord.parentInfoLocked,
        roleOwnsSection: data.user.role === UserRole.PARENT || data.user.role === UserRole.STUDENT,
      }),
      fields: [
        { label: "الاسم", value: valueOrFallback(guardian?.fullName), missing: (missingByParentType.GUARDIAN ?? []).includes("اسم الوصي") },
        { label: "صلة القرابة", value: valueOrFallback(guardian?.relationToStudent), missing: (missingByParentType.GUARDIAN ?? []).includes("صلة الوصي بالطالب") },
        { label: "الجوال", value: valueOrFallback(guardian?.mobileNumber) },
        { label: "رقم الجواز", value: valueOrFallback(guardian?.passportNumber) },
        { label: "ملاحظة", value: valueOrFallback(guardian?.note), missing: (missingByParentType.GUARDIAN ?? []).includes("ملاحظة الوصي") },
      ],
      missingFields: missingByParentType.GUARDIAN ?? [],
    });
  }

  return {
    role: data.user.role as "STUDENT" | "PARENT",
    mobileNumber: data.user.mobileNumber,
    activeUserLabel: data.user.role === UserRole.STUDENT ? "طالب" : "ولي أمر",
    studentName: data.applicationRecord.studentProfile?.fullNameAr ?? "طالب بدون اسم",
    status: data.applicationRecord.status,
    overallCompletion: {
      percent: data.overallCompletionPercent,
      label: data.overallCompletionPercent === 100 ? "اكتمال الطلب" : "الطلب غير مكتمل",
      tone: data.overallCompletionPercent === 100 ? "complete" : "incomplete",
    },
    navItems: buildPortalNavItems({
      activeKey: "profile",
      canSeePayments: data.canSeePayments,
      applicationId: data.applicationRecord.id,
      agreements: data.applications.find((application) => application.id === data.applicationRecord.id)?.agreements ?? [],
    }),
    applicationOptions: data.applications.map((application) => ({
      id: application.id,
      label: application.studentProfile?.fullNameAr ?? "طلب بدون اسم",
    })),
    selectedApplicationId: data.applicationRecord.id,
    sections,
    studentEditor: {
      canEdit: studentCanEdit,
      applicationId: data.applicationRecord.id,
      values: {
        fullNameAr: studentProfile?.fullNameAr ?? "",
        fullNameEn: studentProfile?.fullNameEn ?? "",
        birthDate: studentProfile?.birthDate
          ? studentProfile.birthDate.toISOString().slice(0, 10)
          : "",
        gender: studentProfile?.gender ?? "",
        nationality: studentProfile?.nationality ?? "",
        nationalIdNumber: studentProfile?.nationalIdNumber ?? "",
        city: studentProfile?.city ?? "",
        schoolName: studentProfile?.schoolName ?? "",
        passportNumber: studentProfile?.passportNumber ?? "",
      },
    },
    parentLinkEditor: {
      visible: false,
      applicationId: data.applicationRecord.id,
    },
    parentEditors: ([
      {
        id: "father-edit",
        title: "تحديث بيانات الأب",
        parentType: "FATHER",
        canEdit: sharedParentCanEdit,
        locked: data.applicationRecord.parentInfoLocked || data.applicationRecord.fatherInfoLocked,
        applicationId: data.applicationRecord.id,
        values: {
          fullName: father?.fullName ?? "",
          mobileNumber: father?.mobileNumber ?? "",
          passportNumber: father?.passportNumber ?? "",
          nationalIdNumber: father?.nationalIdNumber ?? "",
          relationToStudent: father?.relationToStudent ?? "",
          note: father?.note ?? "",
          isDeceased: father?.isDeceased ?? false,
        },
      },
      {
        id: "mother-edit",
        title: "تحديث بيانات الأم",
        parentType: "MOTHER",
        canEdit: sharedParentCanEdit,
        locked: data.applicationRecord.parentInfoLocked || data.applicationRecord.motherInfoLocked,
        applicationId: data.applicationRecord.id,
        values: {
          fullName: mother?.fullName ?? "",
          mobileNumber: mother?.mobileNumber ?? "",
          passportNumber: mother?.passportNumber ?? "",
          nationalIdNumber: mother?.nationalIdNumber ?? "",
          relationToStudent: mother?.relationToStudent ?? "",
          note: mother?.note ?? "",
          isDeceased: mother?.isDeceased ?? false,
        },
      },
      {
        id: "guardian-edit",
        title: "تحديث بيانات الوصي",
        parentType: "GUARDIAN",
        canEdit: sharedParentCanEdit,
        locked: data.applicationRecord.parentInfoLocked || data.applicationRecord.guardianInfoLocked,
        applicationId: data.applicationRecord.id,
        values: {
          fullName: guardian?.fullName ?? "",
          mobileNumber: guardian?.mobileNumber ?? "",
          passportNumber: guardian?.passportNumber ?? "",
          nationalIdNumber: guardian?.nationalIdNumber ?? "",
          relationToStudent: guardian?.relationToStudent ?? "",
          note: guardian?.note ?? "",
          isDeceased: guardian?.isDeceased ?? false,
        },
      },
    ] as const).filter(
      (editor) =>
        editor.parentType === "FATHER"
          ? true
          : editor.parentType === "MOTHER"
            ? data.context.requiresMotherData || Boolean(mother)
            : data.context.hasDeceasedFather || data.context.hasGuardianProfile || Boolean(guardian),
    ),
  };
}
