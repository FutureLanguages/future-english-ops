import { getAdminSession } from "@/features/auth/server/admin-session";
import {
  createStudentWithApplication,
  prepareStudentCreation,
} from "@/features/auth/server/account-lifecycle";
import { prisma } from "@/lib/db/prisma";

export async function createStudentAccount(params: {
  mobileNumber: string;
  initialName?: string;
}) {
  await getAdminSession();

  const mobileNumber = params.mobileNumber.trim();
  const initialName = params.initialName?.trim() ?? "";

  if (!mobileNumber) {
    return {
      ok: false as const,
      error: "missing_mobile",
    };
  }

  try {
    const preparedStudent = await prepareStudentCreation({
      mobileNumber,
      initialName,
    });

    const created = await prisma.$transaction(async (tx) => {
      const result = await createStudentWithApplication({
        tx,
        prepared: preparedStudent,
      });

      return result;
    });

    return {
      ok: true as const,
      applicationId: created.studentApplications?.id ?? "",
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "duplicate_student_mobile") {
        return {
          ok: false as const,
          error: "duplicate_mobile",
        };
      }

      if (error.message === "default_agreement_template_missing") {
        return {
          ok: false as const,
          error: "create_failed",
        };
      }
    }

    return {
      ok: false as const,
      error: "create_failed",
    };
  }
}
