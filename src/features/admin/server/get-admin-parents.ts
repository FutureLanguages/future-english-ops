import type { AdminParentsViewModel } from "@/types/admin";
import { prisma } from "@/lib/db/prisma";
import { getAdminNavItems } from "./nav";

export async function getAdminParentsViewModel(params: {
  adminMobileNumber: string;
  q?: string;
}): Promise<AdminParentsViewModel> {
  const q = params.q?.trim() ?? "";

  const applications = await prisma.application.findMany({
    include: {
      parentUser: {
        select: {
          id: true,
          mobileNumber: true,
          isActive: true,
        },
      },
      parentProfiles: {
        select: {
          type: true,
          fullName: true,
        },
      },
      studentProfile: {
        select: {
          fullNameAr: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const grouped = new Map<string, AdminParentsViewModel["rows"][number]>();

  for (const application of applications) {
    if (!application.parentUser.isActive) {
      continue;
    }

    const parentName =
      application.parentProfiles.find(
        (profile) => profile.type === "MOTHER" || profile.type === "FATHER" || profile.type === "GUARDIAN",
      )?.fullName ?? null;
    const existing = grouped.get(application.parentUser.id);

    if (!existing) {
      grouped.set(application.parentUser.id, {
        parentUserId: application.parentUser.id,
        fullName: parentName,
        mobileNumber: application.parentUser.mobileNumber,
        linkedApplicationsCount: 1,
        linkedStudentNames: application.studentProfile?.fullNameAr
          ? [application.studentProfile.fullNameAr]
          : [],
        latestUpdatedAt: application.updatedAt,
      });
      continue;
    }

    existing.linkedApplicationsCount += 1;

    if (!existing.fullName && parentName) {
      existing.fullName = parentName;
    }

    if (
      application.studentProfile?.fullNameAr &&
      !existing.linkedStudentNames.includes(application.studentProfile.fullNameAr)
    ) {
      existing.linkedStudentNames.push(application.studentProfile.fullNameAr);
    }

    if (application.updatedAt > existing.latestUpdatedAt) {
      existing.latestUpdatedAt = application.updatedAt;
    }
  }

  let rows = Array.from(grouped.values());

  if (q) {
    const normalizedQuery = q.toLowerCase();
    rows = rows.filter((row) => {
      return (
        (row.fullName ?? "").toLowerCase().includes(normalizedQuery) ||
        row.mobileNumber.toLowerCase().includes(normalizedQuery) ||
        row.linkedStudentNames.some((name) => name.toLowerCase().includes(normalizedQuery))
      );
    });
  }

  rows.sort((left, right) => {
    if (left.linkedApplicationsCount !== right.linkedApplicationsCount) {
      return right.linkedApplicationsCount - left.linkedApplicationsCount;
    }

    return right.latestUpdatedAt.getTime() - left.latestUpdatedAt.getTime();
  });

  return {
    adminMobileNumber: params.adminMobileNumber,
    navItems: getAdminNavItems("parents"),
    rows,
    filters: {
      q,
    },
  };
}
