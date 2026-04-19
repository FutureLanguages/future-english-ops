import type {
  ApplicationContext,
  ParentProfileRecord,
  StudentProfileRecord,
} from "@/types/application";

type MissingStudentField = {
  field: "fullNameAr" | "birthDate" | "city" | "passportNumber";
  label: string;
};

type MissingParentField = {
  parentType: "FATHER" | "MOTHER" | "GUARDIAN";
  field: "fullName" | "mobileNumber" | "passportNumber" | "relationToStudent" | "note";
  label: string;
};

export type ProfileCompletenessResult = {
  missingStudentFields: MissingStudentField[];
  missingParentFields: MissingParentField[];
  completionPercent: number;
};

function isPresent(value: string | Date | null | undefined): boolean {
  if (value instanceof Date) {
    return true;
  }

  return typeof value === "string" ? value.trim().length > 0 : false;
}

function findParent(parentProfiles: ParentProfileRecord[], type: ParentProfileRecord["type"]) {
  return parentProfiles.find((profile) => profile.type === type) ?? null;
}

export function getProfileCompleteness(params: {
  context: ApplicationContext;
  studentProfile: StudentProfileRecord | null;
  parentProfiles: ParentProfileRecord[];
}): ProfileCompletenessResult {
  const { context, studentProfile, parentProfiles } = params;
  const missingStudentFields: MissingStudentField[] = [];
  const missingParentFields: MissingParentField[] = [];

  const requiredStudentFields: Array<{
    field: MissingStudentField["field"];
    label: string;
    value: string | Date | null | undefined;
  }> = [
    {
      field: "fullNameAr",
      label: "اسم الطالب بالعربية",
      value: studentProfile?.fullNameAr,
    },
    {
      field: "birthDate",
      label: "تاريخ ميلاد الطالب",
      value: studentProfile?.birthDate,
    },
    {
      field: "city",
      label: "مدينة الطالب",
      value: studentProfile?.city,
    },
    {
      field: "passportNumber",
      label: "رقم جواز الطالب",
      value: studentProfile?.passportNumber,
    },
  ];

  for (const field of requiredStudentFields) {
    if (!isPresent(field.value)) {
      missingStudentFields.push({
        field: field.field,
        label: field.label,
      });
    }
  }

  const father = findParent(parentProfiles, "FATHER");
  const mother = findParent(parentProfiles, "MOTHER");
  const guardian = findParent(parentProfiles, "GUARDIAN");

  if (!context.hasDeceasedFather) {
    const fatherFields: Array<{
      field: MissingParentField["field"];
      label: string;
      value: string | null | undefined;
    }> = [
      { field: "fullName", label: "اسم الأب", value: father?.fullName },
      { field: "mobileNumber", label: "جوال الأب", value: father?.mobileNumber },
      { field: "passportNumber", label: "جواز الأب", value: father?.passportNumber },
    ];

    for (const field of fatherFields) {
      if (!isPresent(field.value)) {
        missingParentFields.push({
          parentType: "FATHER",
          field: field.field,
          label: field.label,
        });
      }
    }
  }

  if (context.requiresMotherData) {
    const motherFields: Array<{
      field: MissingParentField["field"];
      label: string;
      value: string | null | undefined;
    }> = [
      { field: "fullName", label: "اسم الأم", value: mother?.fullName },
      { field: "mobileNumber", label: "جوال الأم", value: mother?.mobileNumber },
      { field: "passportNumber", label: "جواز الأم", value: mother?.passportNumber },
    ];

    for (const field of motherFields) {
      if (!isPresent(field.value)) {
        missingParentFields.push({
          parentType: "MOTHER",
          field: field.field,
          label: field.label,
        });
      }
    }
  }

  const requiresGuardianFields = context.hasDeceasedFather || context.hasGuardianProfile;

  if (requiresGuardianFields) {
    const guardianFields: Array<{
      field: MissingParentField["field"];
      label: string;
      value: string | null | undefined;
    }> = [
      { field: "fullName", label: "اسم الوصي", value: guardian?.fullName },
      {
        field: "relationToStudent",
        label: "صلة الوصي بالطالب",
        value: guardian?.relationToStudent,
      },
      { field: "note", label: "ملاحظة الوصي", value: guardian?.note },
    ];

    for (const field of guardianFields) {
      if (!isPresent(field.value)) {
        missingParentFields.push({
          parentType: "GUARDIAN",
          field: field.field,
          label: field.label,
        });
      }
    }
  }

  const totalRequiredFields =
    requiredStudentFields.length +
    (context.hasDeceasedFather ? 0 : 3) +
    (context.requiresMotherData ? 3 : 0) +
    (requiresGuardianFields ? 3 : 0);
  const totalMissingFields = missingStudentFields.length + missingParentFields.length;
  const filledRequiredFields = Math.max(totalRequiredFields - totalMissingFields, 0);
  const completionPercent =
    totalRequiredFields === 0
      ? 100
      : Math.round((filledRequiredFields / totalRequiredFields) * 100);

  return {
    missingStudentFields,
    missingParentFields,
    completionPercent,
  };
}
