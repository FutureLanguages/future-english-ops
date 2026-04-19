import type { AdminParentDetailsViewModel } from "@/types/admin";
import { prisma } from "@/lib/db/prisma";
import { getAdminNavItems } from "./nav";

export async function getAdminParentDetailsViewModel(params: {
  adminMobileNumber: string;
  parentId: string;
}): Promise<AdminParentDetailsViewModel | null> {
  const parentUser = await prisma.user.findUnique({
    where: {
      id: params.parentId,
    },
    select: {
      id: true,
      mobileNumber: true,
      parentApplications: {
        include: {
          studentProfile: {
            select: {
              fullNameAr: true,
            },
          },
          parentProfiles: {
            select: {
              type: true,
              fullName: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      },
    },
  });

  if (!parentUser) {
    return null;
  }

  const fullName =
    parentUser.parentApplications
      .flatMap((application) => application.parentProfiles)
      .find((profile) => Boolean(profile.fullName?.trim()))?.fullName ?? null;

  return {
    adminMobileNumber: params.adminMobileNumber,
    navItems: getAdminNavItems("parents"),
    parent: {
      id: parentUser.id,
      fullName,
      mobileNumber: parentUser.mobileNumber,
    },
    linkedApplications: parentUser.parentApplications.map((application) => ({
      applicationId: application.id,
      studentName: application.studentProfile?.fullNameAr ?? "طالب بدون اسم",
      status: application.status,
      updatedAt: application.updatedAt,
    })),
  };
}
