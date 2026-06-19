import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { Prisma, UserRole } from "@prisma/client";
import { buildDefaultPasswordFromMobile } from "@/features/auth/server/passwords";
import { createStudentAccountForTrustedActor } from "@/features/auth/server/create-student-account";
import { prisma } from "@/lib/db/prisma";

const ACTION = "CREATE_STUDENT_ACCOUNT";
const SOURCE = "telegram_bot";
const WORKFLOW = "CREATE_STUDENT_ACCOUNT";
const CALLBACK_CONFIRM = "CREATE_STUDENT_CONFIRM";
const STEP_WAITING_CONFIRMATION = "WAITING_CONFIRMATION";
const STEP_WAITING_MOBILE = "WAITING_MOBILE";
const STEP_COMPLETED = "COMPLETED";
const STATUS_ACTIVE = "ACTIVE";
const STATUS_PROCESSING = "PROCESSING";
const STATUS_COMPLETED = "COMPLETED";
const STATUS_EXPIRED = "EXPIRED";
const REQUIRED_PERMISSION = "CREATE_STUDENT_ACCOUNT";
const SESSION_TTL_MINUTES = 30;

type AutomationSessionCallbackResponse = {
  success: boolean;
  message: string;
  data: null | {
    sessionId: string;
    workflow: string;
    step: string;
    status: string;
    replyText: string;
    applicationId?: string;
    studentUserId?: string;
    expiresAt?: string;
  };
  errorCode: string | null;
};

type AutomationSessionCallbackBody = {
  telegramUserId?: unknown;
  chatId?: unknown;
  callbackData?: unknown;
};

type SessionData = {
  chatId?: string;
  initialName?: string | null;
  mobileNumber?: string | null;
  resultStatus?: "SUCCESS" | "FAILED";
  studentUserId?: string;
  applicationId?: string;
  errorCode?: string | null;
  idempotencyKey?: string;
  attemptedMobileNumber?: string | null;
};

type AutomationOperator = {
  telegramUserId: string;
  displayName: string | null;
  linkedAdminUserId: string;
};

function jsonResponse(response: AutomationSessionCallbackResponse, init?: ResponseInit) {
  return NextResponse.json(response, init);
}

function failureResponse(params: {
  message: string;
  errorCode: string;
  status?: number;
  data?: AutomationSessionCallbackResponse["data"];
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
  sessionId: string;
  workflow: string;
  step: string;
  status: string;
  replyText: string;
  applicationId?: string;
  studentUserId?: string;
  expiresAt?: Date;
}) {
  return jsonResponse({
    success: true,
    message: params.message,
    data: {
      sessionId: params.sessionId,
      workflow: params.workflow,
      step: params.step,
      status: params.status,
      replyText: params.replyText,
      ...(params.applicationId ? { applicationId: params.applicationId } : {}),
      ...(params.studentUserId ? { studentUserId: params.studentUserId } : {}),
      ...(params.expiresAt ? { expiresAt: params.expiresAt.toISOString() } : {}),
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

function getExpiresAt() {
  return new Date(Date.now() + SESSION_TTL_MINUTES * 60 * 1000);
}

function getSessionData(data: Prisma.JsonValue): SessionData {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {};
  }

  return data as SessionData;
}

function toJsonObject(data: SessionData) {
  return data as Prisma.InputJsonObject;
}

function buildSuccessReplyText(params: {
  initialName: string;
  mobileNumber: string;
  temporaryPassword: string;
}) {
  return `تم إنشاء حساب الطالب بنجاح ✅\n\nالاسم: ${params.initialName}\nالجوال: ${params.mobileNumber}\nكلمة المرور المؤقتة: ${params.temporaryPassword}\n\n━━━━━━━━━━━━\n\nرسالة جاهزة للطالب:\n\nمرحباً ${params.initialName}،\n\nتم إنشاء حسابك بنجاح.\n\nاسم المستخدم:\n${params.mobileNumber}\n\nكلمة المرور المؤقتة:\n${params.temporaryPassword}\n\nسيُطلب منك تغيير كلمة المرور عند أول تسجيل دخول.\n\nنتمنى لك التوفيق.`;
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
          role: true,
          isActive: true,
        },
      },
    },
  });

  if (
    !operator ||
    operator.status !== STATUS_ACTIVE ||
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

export async function POST(request: Request) {
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

  const body = (await request.json().catch(() => null)) as AutomationSessionCallbackBody | null;
  const telegramUserId = getString(body?.telegramUserId);
  const chatId = getString(body?.chatId);
  const callbackData = getString(body?.callbackData);

  if (!telegramUserId || !chatId || !callbackData) {
    return failureResponse({
      message: "بيانات callback غير مكتملة.",
      errorCode: "INVALID_INPUT",
      status: 400,
    });
  }

  if (callbackData !== CALLBACK_CONFIRM) {
    return failureResponse({
      message: "هذا الزر غير مدعوم حاليًا.",
      errorCode: "UNSUPPORTED_CALLBACK",
      status: 400,
    });
  }

  const operator = await findAuthorizedOperator(telegramUserId);

  if (!operator) {
    await writeAuditLog({
      request,
      requestPayload: {
        telegramUserId,
        chatId,
        callbackData,
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

  const session = await prisma.botSession.findFirst({
    where: {
      telegramUserId,
      workflow: WORKFLOW,
      status: {
        in: [STATUS_ACTIVE, STATUS_PROCESSING, STATUS_COMPLETED],
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      workflow: true,
      step: true,
      status: true,
      data: true,
      expiresAt: true,
    },
  });

  if (!session) {
    return failureResponse({
      message: "لا توجد جلسة نشطة. ابدأ من القائمة من جديد.",
      errorCode: "SESSION_NOT_FOUND",
      status: 404,
    });
  }

  const sessionData = getSessionData(session.data);
  const initialName = getString(sessionData.initialName);
  const mobileNumber = getString(sessionData.mobileNumber);
  const idempotencyKey = `create-student-confirm:${session.id}`;

  if (session.status === STATUS_COMPLETED) {
    const applicationId = getString(sessionData.applicationId);
    const studentUserId = getString(sessionData.studentUserId);

    if (initialName && mobileNumber && applicationId && studentUserId) {
      return successResponse({
        message: "تم تنفيذ هذا الطلب مسبقًا.",
        sessionId: session.id,
        workflow: session.workflow,
        step: session.step,
        status: session.status,
        replyText: buildSuccessReplyText({
          initialName,
          mobileNumber,
          temporaryPassword: buildDefaultPasswordFromMobile(mobileNumber),
        }),
        applicationId,
        studentUserId,
      });
    }
  }

  if (session.status === STATUS_PROCESSING) {
    return failureResponse({
      message: "طلب إنشاء الطالب قيد المعالجة بالفعل.",
      errorCode: "REQUEST_IN_PROGRESS",
      status: 409,
      data: {
        sessionId: session.id,
        workflow: session.workflow,
        step: session.step,
        status: session.status,
        replyText: "طلب إنشاء الطالب قيد المعالجة بالفعل. انتظر لحظات ثم تحقق من النتيجة.",
      },
    });
  }

  if (session.expiresAt <= new Date()) {
    await prisma.botSession.update({
      where: {
        id: session.id,
      },
      data: {
        status: STATUS_EXPIRED,
      },
    });

    return failureResponse({
      message: "انتهت الجلسة. ابدأ من القائمة من جديد.",
      errorCode: "SESSION_EXPIRED",
      status: 410,
    });
  }

  if (session.step !== STEP_WAITING_CONFIRMATION) {
    return failureResponse({
      message: "هذا الزر لا يناسب خطوة الجلسة الحالية.",
      errorCode: "INVALID_STEP",
      status: 409,
    });
  }

  if (!initialName || !mobileNumber) {
    return failureResponse({
      message: "بيانات الجلسة غير مكتملة. ابدأ من القائمة من جديد.",
      errorCode: "INVALID_SESSION_DATA",
      status: 409,
    });
  }

  const lockResult = await prisma.botSession.updateMany({
    where: {
      id: session.id,
      status: STATUS_ACTIVE,
      step: STEP_WAITING_CONFIRMATION,
    },
    data: {
      status: STATUS_PROCESSING,
      data: toJsonObject({
        ...sessionData,
        chatId,
        idempotencyKey,
      }),
    },
  });

  if (lockResult.count !== 1) {
    return failureResponse({
      message: "طلب إنشاء الطالب قيد المعالجة بالفعل.",
      errorCode: "REQUEST_IN_PROGRESS",
      status: 409,
    });
  }

  const creationResult = await createStudentAccountForTrustedActor({
    mobileNumber,
    initialName,
    actor: {
      type: "AUTOMATION",
      id: operator.linkedAdminUserId,
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

    if (errorCode === "DUPLICATE_MOBILE") {
      const expiresAt = getExpiresAt();
      await prisma.botSession.update({
        where: {
          id: session.id,
        },
        data: {
          status: STATUS_ACTIVE,
          step: STEP_WAITING_MOBILE,
          expiresAt,
          data: toJsonObject({
            ...sessionData,
            chatId,
            mobileNumber: null,
            attemptedMobileNumber: mobileNumber,
            resultStatus: "FAILED",
            errorCode,
            idempotencyKey,
          }),
        },
      });

      await writeAuditLog({
        request,
        operator,
        targetPhone: mobileNumber,
        requestPayload: {
          telegramUserId,
          chatId,
          callbackData,
          sessionId: session.id,
          idempotencyKey,
          mobileNumber,
          initialName,
        },
        responsePayload: {
          errorCode,
        },
        status: "FAILED",
        errorCode,
      }).catch(() => {});

      return failureResponse({
        message: "رقم الجوال مستخدم مسبقًا.",
        errorCode,
        status: 409,
        data: {
          sessionId: session.id,
          workflow: session.workflow,
          step: STEP_WAITING_MOBILE,
          status: STATUS_ACTIVE,
          replyText:
            "رقم الجوال مستخدم مسبقًا. أرسل رقم جوال آخر بصيغة 05XXXXXXXX أو 9665XXXXXXXX.",
          expiresAt: expiresAt.toISOString(),
        },
      });
    }

    await prisma.botSession.update({
      where: {
        id: session.id,
      },
      data: {
        status: "FAILED",
        data: toJsonObject({
          ...sessionData,
          chatId,
          resultStatus: "FAILED",
          errorCode,
          idempotencyKey,
        }),
      },
    });

    await writeAuditLog({
      request,
      operator,
      targetPhone: mobileNumber,
      requestPayload: {
        telegramUserId,
        chatId,
        callbackData,
        sessionId: session.id,
        idempotencyKey,
        mobileNumber,
        initialName,
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
      id: session.id,
    },
    data: {
      status: STATUS_COMPLETED,
      step: STEP_COMPLETED,
      data: toJsonObject({
        ...sessionData,
        chatId,
        mobileNumber: creationResult.mobileNumber,
        resultStatus: "SUCCESS",
        studentUserId: creationResult.studentUserId,
        applicationId: creationResult.applicationId,
        errorCode: null,
        idempotencyKey,
      }),
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
      chatId,
      callbackData,
      sessionId: session.id,
      idempotencyKey,
      mobileNumber: creationResult.mobileNumber,
      initialName,
    },
    responsePayload: {
      mobileNumber: creationResult.mobileNumber,
      applicationId: creationResult.applicationId,
      studentUserId: creationResult.studentUserId,
    },
    status: "SUCCESS",
  }).catch(() => {});

  return successResponse({
    message: "تم إنشاء حساب الطالب.",
    sessionId: session.id,
    workflow: session.workflow,
    step: STEP_COMPLETED,
    status: STATUS_COMPLETED,
    replyText: buildSuccessReplyText({
      initialName,
      mobileNumber: creationResult.mobileNumber,
      temporaryPassword: creationResult.temporaryPassword,
    }),
    applicationId: creationResult.applicationId,
    studentUserId: creationResult.studentUserId,
  });
}
