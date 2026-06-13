import { prisma } from "@/lib/db/prisma";
import { buildDefaultPasswordFromMobile } from "@/features/auth/server/passwords";
import {
  createStudentWithApplication,
  prepareStudentCreation,
} from "@/features/auth/server/account-lifecycle";

export type TrustedStudentAccountActor = {
  type: "ADMIN" | "AUTOMATION";
  id?: string;
  label?: string;
};

export type CreateStudentAccountForTrustedActorResult =
  | {
      success: true;
      status: "CREATED";
      studentUserId: string;
      applicationId: string;
      mobileNumber: string;
      temporaryPassword: string;
    }
  | {
      success: false;
      status: "FAILED";
      errorCode: "missing_mobile" | "duplicate_mobile" | "create_failed";
      mobileNumber: string;
    };

export async function createStudentAccountForTrustedActor(params: {
  mobileNumber: string;
  initialName?: string | null;
  actor?: TrustedStudentAccountActor;
}): Promise<CreateStudentAccountForTrustedActorResult> {
  const mobileNumber = params.mobileNumber.trim();
  const initialName = params.initialName?.trim() ?? "";

  if (!mobileNumber) {
    return {
      success: false,
      status: "FAILED",
      errorCode: "missing_mobile",
      mobileNumber,
    };
  }

  try {
    const preparedStudent = await prepareStudentCreation({
      mobileNumber,
      initialName,
    });

    const created = await prisma.$transaction(async (tx) =>
      createStudentWithApplication({
        tx,
        prepared: preparedStudent,
      }),
    );

    return {
      success: true,
      status: "CREATED",
      studentUserId: created.id,
      applicationId: created.studentApplications.id,
      mobileNumber: preparedStudent.mobileNumber,
      temporaryPassword: buildDefaultPasswordFromMobile(preparedStudent.mobileNumber),
    };
  } catch (error) {
    if (error instanceof Error && error.message === "duplicate_student_mobile") {
      return {
        success: false,
        status: "FAILED",
        errorCode: "duplicate_mobile",
        mobileNumber,
      };
    }

    return {
      success: false,
      status: "FAILED",
      errorCode: "create_failed",
      mobileNumber,
    };
  }
}
