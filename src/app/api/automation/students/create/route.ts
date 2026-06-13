import { createHash, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { Prisma, UserRole } from "@prisma/client";
import { buildDefaultPasswordFromMobile } from "@/features/auth/server/passwords";
import { createStudentAccountForTrustedActor } from "@/features/auth/server/create-student-account";
import { prisma } from "@/lib/db/prisma";

const ACTION = "CREATE_STUDENT_ACCOUNT";
const SOURCE = "telegram_bot";
const WORKFLOW = "CREATE_STUDENT_ACCOUNT";
const STEP = "API_EXECUTION";
const REQUIRED_PERMISSION = "CREATE_STUDENT_ACCOUNT";
const IDEMPOTENCY_TTL_MINUTES = 30;

type AutomationCreateStudentResponse = {
  success: boolean;
  message: string;
  data: null | {
    mobileNumber?: string;
    temporaryPassword?: string;
    applicationId?: string;
    studentUserId?: string;
  };
  errorCode: string | null;
};

type CreateStudentRequestBody = {
  telegramUserId?: unknown;
  mobileNumber?: unknown;
  initialName?: unknown;
  sessionId?: unknown;
  idempotencyKey?: unknown;
};

type BotSessionData = {
  requestHash?: string;
  mobileNumber?: string;
  initialName?: string | null;
  sessionId?: string | null;
  resultStatus?: "SUCCESS" | "FAILED";
  studentUserId?: string;
  applicationId?: string;
  errorCode?: string | null;
};

type AutomationOperator = {
  telegramUserId: string;
  displayName: string | null;
  linkedAdminUserId: string | null;
};

function jsonResponse(response: AutomationCreateStudentResponse, init?: ResponseInit) {
  return NextResponse.json(response, init);
}

function failureResponse(params: {
  message: string;
  errorCode: string;
  status?: number;
  data?: AutomationCreateStudentResponse["data"];
}) {
  return jsonResponse(
    {
      success: false,
      message: params.message,
      data: params.data ?? null,
      errorCode: params.errorCode,
    },
    { status: params.status ?? 400 },
  );
}

function successResponse(params: {
  message: string;
  mobileNumber: string;
  temporaryPassword: string;
  applicationId: string;
  studentUserId: string;
}) {
  return jsonResponse({
    success: true,
    message: params.message,
    data: {
      mobileNumber: params.mobileNumber,
      temporaryPassword: params.temporaryPassword,
      applicationId: params.applicationId,
      studentUserId: params.studentUserId,
    },
    errorCode: null,
  });
}

function isAuthorized(request: Request) {
  const expectedToken = process.env.AUTOMATION_API_TOKEN;
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");

  if (!expectedToken || scheme !== "Bearer" || !token) {
    return false;
  }

  const expected = Buffer.from(expectedToken);
  const actual = Buffer.from(token);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSaudiMobile(value: unknown) {
  const digits = getString(value).replace(/\D/g, "");

  if (/^05\d{8}$/.test(digits)) {
    return `966${digits.slice(1)}`;
  }

  if (/^9665\d{8}$/.test(digits)) {
    return digits;
  }

  return null;
}

function buildRequestHash(params: {
  telegramUserId: string;
  mobileNumber: string;
  initialName: string | null;
  sessionId: string | null;
}) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        telegramUserId: params.telegramUserId,
        mobileNumber: params.mobileNumber,
        initialName: params.initialName,
        sessionId: params.sessionId,
      }),
    )
    .digest("hex");
}

function getSessionData(data: Prisma.JsonValue): BotSessionData {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {};
  }

  return data as BotSessionData;
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function getExpiresAt() {
  return new Date(Date.now() + IDEMPOTENCY_TTL_MINUTES * 60 * 1000);
}

async function writeAuditLog(params: {
  request: Request;
  operator?: AutomationOperator | null;
  targetPhone?: string | null;
  targetId?: string | null;
  requestPayload?: Prisma.InputJsonValue;
  responsePayload?: Prisma.InputJsonValue;
  status: string;
  errorCode?: string | null;
}) {
  await prisma.automationAuditLog.create({
    data: {
      action: ACTION,
      source: SOURCE,
      operatorTelegramUserId: params.operator?.telegramUserId,
      operatorAdminUserId: params.operator?.linkedAdminUserId,
      operatorDisplayName: params.operator?.displayName,
      targetType: "STUDENT",
      targetId: params.targetId,
      targetPhone: params.targetPhone,
      requestPayload: params.requestPayload ?? Prisma.JsonNull,
      responsePayload: params.responsePayload ?? Prisma.JsonNull,
      status: params.status,
      errorCode: params.errorCode,
      ipAddress: params.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: params.request.headers.get("user-agent"),
    },
  });
}

async function findAuthorizedOperator(telegramUserId: string) {
  const operator = await prisma.botOperator.findUnique({
    where: {
      telegramUserId,
    },
    select: {
      telegramUserId: true,
      displayName: true,
      permissions: true,
      status: true,
      linkedAdminUserId: true,
      linkedAdminUser: {
        select: {
          id: true,
          role: true,
          isActive: true,
        },
      },
    },
  });

  if (
    !operator ||
    operator.status !== "ACTIVE" ||
    !operator.permissions.includes(REQUIRED_PERMISSION) ||
    !operator.linkedAdminUserId ||
    !operator.linkedAdminUser ||
    operator.linkedAdminUser.role !== UserRole.ADMIN ||
    !operator.linkedAdminUser.isActive
  ) {
    return null;
  }

  return {
    telegramUserId: operator.telegramUserId,
    displayName: operator.displayName,
    linkedAdminUserId: operator.linkedAdminUserId,
  };
}

async function reserveIdempotencyKey(params: {
  telegramUserId: string;
  idempotencyKey: string;
  requestHash: string;
  mobileNumber: string;
  initialName: string | null;
  sessionId: string | null;
}) {
  const data = {
    requestHash: params.requestHash,
    mobileNumber: params.mobileNumber,
    initialName: params.initialName,
    sessionId: params.sessionId,
    resultStatus: null,
    studentUserId: null,
    applicationId: null,
    errorCode: null,
  } satisfies Prisma.InputJsonObject;

  try {
    const session = await prisma.botSession.create({
      data: {
        telegramUserId: params.telegramUserId,
        workflow: WORKFLOW,
        step: STEP,
        data,
        status: "ACTIVE",
        idempotencyKey: params.idempotencyKey,
        expiresAt: getExpiresAt(),
      },
    });

    return {
      kind: "reserved" as const,
      session,
    };
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    const session = await prisma.botSession.findUnique({
      where: {
        idempotencyKey: params.idempotencyKey,
      },
    });

    return {
      kind: "existing" as const,
      session,
    };
  }
}

export async function POST(request: Request) {
  let operator: AutomationOperator | null = null;
  let targetPhone: string | null = null;

  if (!isAuthorized(request)) {
    await writeAuditLog({
      request,
      status: "UNAUTHORIZED",
      errorCode: "UNAUTHORIZED",
    }).catch(() => {});

    return failureResponse({
      message: "غير مصرح بتنفيذ هذا الطلب.",
      errorCode: "UNAUTHORIZED",
      status: 401,
    });
  }

  const body = (await request.json().catch(() => null)) as CreateStudentRequestBody | null;
  const telegramUserId = getString(body?.telegramUserId);
  const idempotencyKey = getString(body?.idempotencyKey);
  const initialName = getString(body?.initialName) || null;
  const sessionId = getString(body?.sessionId) || null;
  const mobileNumber = normalizeSaudiMobile(body?.mobileNumber);
  targetPhone = mobileNumber;

  if (!telegramUserId || !idempotencyKey) {
    const errorCode = !telegramUserId ? "MISSING_TELEGRAM_USER_ID" : "MISSING_IDEMPOTENCY_KEY";
    await writeAuditLog({
      request,
      targetPhone,
      requestPayload: {
        telegramUserId: telegramUserId || null,
        mobileNumber,
        initialName,
        sessionId,
        idempotencyKey: idempotencyKey || null,
      },
      status: "FAILED",
      errorCode,
    }).catch(() => {});

    return failureResponse({
      message: "بيانات الطلب غير مكتملة.",
      errorCode,
      status: 400,
    });
  }

  if (!mobileNumber) {
    await writeAuditLog({
      request,
      requestPayload: {
        telegramUserId,
        mobileNumber: getString(body?.mobileNumber) || null,
        initialName,
        sessionId,
        idempotencyKey,
      },
      status: "FAILED",
      errorCode: "INVALID_MOBILE",
    }).catch(() => {});

    return failureResponse({
      message: "رقم الجوال غير صالح. استخدم صيغة 05XXXXXXXX أو 9665XXXXXXXX.",
      errorCode: "INVALID_MOBILE",
      status: 400,
    });
  }

  operator = await findAuthorizedOperator(telegramUserId);

  if (!operator) {
    await writeAuditLog({
      request,
      targetPhone,
      requestPayload: {
        telegramUserId,
        mobileNumber,
        initialName,
        sessionId,
        idempotencyKey,
      },
      status: "FORBIDDEN",
      errorCode: "FORBIDDEN",
    }).catch(() => {});

    return failureResponse({
      message: "لا يملك مشغل البوت صلاحية إنشاء حساب طالب.",
      errorCode: "FORBIDDEN",
      status: 403,
    });
  }

  const requestHash = buildRequestHash({
    telegramUserId,
    mobileNumber,
    initialName,
    sessionId,
  });

  const idempotency = await reserveIdempotencyKey({
    telegramUserId,
    idempotencyKey,
    requestHash,
    mobileNumber,
    initialName,
    sessionId,
  });

  if (idempotency.kind === "existing") {
    const existingSession = idempotency.session;
    const sessionData = existingSession ? getSessionData(existingSession.data) : {};

    if (!existingSession || sessionData.requestHash !== requestHash) {
      await writeAuditLog({
        request,
        operator,
        targetPhone,
        requestPayload: {
          telegramUserId,
          mobileNumber,
          initialName,
          sessionId,
          idempotencyKey,
        },
        status: "FAILED",
        errorCode: "IDEMPOTENCY_CONFLICT",
      }).catch(() => {});

      return failureResponse({
        message: "مفتاح التكرار مستخدم سابقًا لطلب مختلف.",
        errorCode: "IDEMPOTENCY_CONFLICT",
        status: 409,
      });
    }

    if (
      existingSession.status === "COMPLETED" &&
      sessionData.resultStatus === "SUCCESS" &&
      sessionData.mobileNumber &&
      sessionData.applicationId &&
      sessionData.studentUserId
    ) {
      await writeAuditLog({
        request,
        operator,
        targetPhone: sessionData.mobileNumber,
        targetId: sessionData.studentUserId,
        requestPayload: {
          telegramUserId,
          mobileNumber,
          initialName,
          sessionId,
          idempotencyKey,
          replay: true,
        },
        responsePayload: {
          mobileNumber: sessionData.mobileNumber,
          applicationId: sessionData.applicationId,
          studentUserId: sessionData.studentUserId,
          replay: true,
        },
        status: "SUCCESS",
      }).catch(() => {});

      return successResponse({
        message: "تم إنشاء حساب الطالب مسبقًا لهذا الطلب.",
        mobileNumber: sessionData.mobileNumber,
        temporaryPassword: buildDefaultPasswordFromMobile(sessionData.mobileNumber),
        applicationId: sessionData.applicationId,
        studentUserId: sessionData.studentUserId,
      });
    }

    if (existingSession.status === "FAILED" && sessionData.resultStatus === "FAILED") {
      const errorCode = sessionData.errorCode ?? "CREATE_FAILED";
      await writeAuditLog({
        request,
        operator,
        targetPhone,
        requestPayload: {
          telegramUserId,
          mobileNumber,
          initialName,
          sessionId,
          idempotencyKey,
          replay: true,
        },
        responsePayload: {
          errorCode,
          replay: true,
        },
        status: "FAILED",
        errorCode,
      }).catch(() => {});

      return failureResponse({
        message: "سبق تنفيذ هذا الطلب وانتهى بالفشل.",
        errorCode,
        status: 400,
      });
    }

    await writeAuditLog({
      request,
      operator,
      targetPhone,
      requestPayload: {
        telegramUserId,
        mobileNumber,
        initialName,
        sessionId,
        idempotencyKey,
        replay: true,
      },
      status: "FAILED",
      errorCode: "IDEMPOTENCY_IN_PROGRESS",
    }).catch(() => {});

    return failureResponse({
      message: "هذا الطلب قيد المعالجة بالفعل.",
      errorCode: "IDEMPOTENCY_IN_PROGRESS",
      status: 409,
    });
  }

  const creationResult = await createStudentAccountForTrustedActor({
    mobileNumber,
    initialName,
    actor: {
      type: "AUTOMATION",
      id: operator.linkedAdminUserId ?? operator.telegramUserId,
      label: operator.displayName ?? operator.telegramUserId,
    },
  });

  if (!creationResult.success) {
    const errorCode =
      creationResult.errorCode === "duplicate_mobile"
        ? "DUPLICATE_MOBILE"
        : creationResult.errorCode === "missing_mobile"
          ? "INVALID_MOBILE"
          : "CREATE_FAILED";

    await prisma.botSession.update({
      where: {
        id: idempotency.session.id,
      },
      data: {
        status: "FAILED",
        data: {
          requestHash,
          mobileNumber,
          initialName,
          sessionId,
          resultStatus: "FAILED",
          errorCode,
        } satisfies Prisma.InputJsonObject,
      },
    });

    await writeAuditLog({
      request,
      operator,
      targetPhone: mobileNumber,
      requestPayload: {
        telegramUserId,
        mobileNumber,
        initialName,
        sessionId,
        idempotencyKey,
      },
      responsePayload: {
        errorCode,
      },
      status: "FAILED",
      errorCode,
    }).catch(() => {});

    return failureResponse({
      message: "تعذر إنشاء حساب الطالب.",
      errorCode,
      status: 400,
    });
  }

  await prisma.botSession.update({
    where: {
      id: idempotency.session.id,
    },
    data: {
      status: "COMPLETED",
      data: {
        requestHash,
        mobileNumber: creationResult.mobileNumber,
        initialName,
        sessionId,
        resultStatus: "SUCCESS",
        studentUserId: creationResult.studentUserId,
        applicationId: creationResult.applicationId,
        errorCode: null,
      } satisfies Prisma.InputJsonObject,
    },
  });

  await prisma.botOperator.update({
    where: {
      telegramUserId,
    },
    data: {
      lastUsedAt: new Date(),
    },
  });

  await writeAuditLog({
    request,
    operator,
    targetPhone: creationResult.mobileNumber,
    targetId: creationResult.studentUserId,
    requestPayload: {
      telegramUserId,
      mobileNumber,
      initialName,
      sessionId,
      idempotencyKey,
    },
    responsePayload: {
      mobileNumber: creationResult.mobileNumber,
      applicationId: creationResult.applicationId,
      studentUserId: creationResult.studentUserId,
    },
    status: "SUCCESS",
  }).catch(() => {});

  return successResponse({
    message: "تم إنشاء حساب الطالب بنجاح.",
    mobileNumber: creationResult.mobileNumber,
    temporaryPassword: creationResult.temporaryPassword,
    applicationId: creationResult.applicationId,
    studentUserId: creationResult.studentUserId,
  });
}
