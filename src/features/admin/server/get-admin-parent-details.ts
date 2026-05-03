import { UserRole } from "@prisma/client";
import type { AdminParentDetailsViewModel } from "@/types/admin";
import { prisma } from "@/lib/db/prisma";
import { getAdminNavItems } from "./nav";

export async function getAdminParentDetailsViewModel(params: {
  adminMobileNumber: string;
  parentId: string;
}): Promise<AdminParentDetailsViewModel | null> {
  const [parentUser, parentUsers] = await Promise.all([
    prisma.user.findUnique({
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
    }),
    prisma.user.findMany({
      where: {
        role: UserRole.PARENT,
        isActive: true,
      },
      select: {
        id: true,
        mobileNumber: true,
        parentApplications: {
          select: {
            parentProfiles: {
              select: {
                fullName: true,
              },
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
  ]);

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
    parentSwitch: {
      items: parentUsers.map((user) => ({
        parentId: user.id,
        fullName:
          user.parentApplications
            .flatMap((application) => application.parentProfiles)
            .find((profile) => Boolean(profile.fullName?.trim()))?.fullName ?? "ولي أمر بدون اسم",
        mobileNumber: user.mobileNumber,
      })),
      positionLabel: (() => {
        const currentIndex = parentUsers.findIndex((user) => user.id === parentUser.id);
        return currentIndex >= 0 ? `${currentIndex + 1} من ${parentUsers.length}` : `${parentUsers.length} ولي أمر`;
      })(),
    },
  };
}
