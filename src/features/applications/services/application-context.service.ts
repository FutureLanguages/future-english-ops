import type { ApplicationContext, ParentProfileRecord, StudentProfileRecord } from "@/types/application";

function getAgeFromBirthDate(birthDate: Date | null, now = new Date()): number | null {
  if (!birthDate) {
    return null;
  }

  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDifference = now.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && now.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
}

function findParentByType(parentProfiles: ParentProfileRecord[], type: ParentProfileRecord["type"]) {
  return parentProfiles.find((profile) => profile.type === type) ?? null;
}

export function buildApplicationContext(params: {
  studentProfile: StudentProfileRecord | null;
  parentProfiles: ParentProfileRecord[];
  now?: Date;
}): ApplicationContext {
  const studentAge = getAgeFromBirthDate(params.studentProfile?.birthDate ?? null, params.now);
  const fatherProfile = findParentByType(params.parentProfiles, "FATHER");
  const guardianProfile = findParentByType(params.parentProfiles, "GUARDIAN");

  const isUnder16 = studentAge !== null && studentAge < 16;
  const hasDeceasedFather = fatherProfile?.isDeceased ?? false;
  const hasGuardianProfile = guardianProfile !== null;

  return {
    studentAge,
    isUnder16,
    hasDeceasedFather,
    hasGuardianProfile,
    requiresMotherData: isUnder16,
    requiresGuardianDocument: isUnder16 || hasDeceasedFather || hasGuardianProfile,
  };
}
