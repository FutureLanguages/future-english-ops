import { getAdminSession } from "@/features/auth/server/admin-session";
import { createStudentAccountForTrustedActor } from "@/features/auth/server/create-student-account";

export async function createStudentAccount(params: {
  mobileNumber: string;
  initialName?: string;
}) {
  const admin = await getAdminSession();
  const result = await createStudentAccountForTrustedActor({
    mobileNumber: params.mobileNumber,
    initialName: params.initialName,
    actor: {
      type: "ADMIN",
      id: admin.id,
      label: admin.mobileNumber,
    },
  });

  if (result.success) {
    return {
      ok: true as const,
      applicationId: result.applicationId,
    };
  }

  return {
    ok: false as const,
    error: result.errorCode,
  };
}
