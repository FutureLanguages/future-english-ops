import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

const WORKFLOW = "CREATE_STUDENT_ACCOUNT";
const STEP_WAITING_STUDENT_NAME = "WAITING_STUDENT_NAME";
const STEP_WAITING_MOBILE = "WAITING_MOBILE";
const STEP_WAITING_CONFIRMATION = "WAITING_CONFIRMATION";
const STATUS_ACTIVE = "ACTIVE";
const STATUS_EXPIRED = "EXPIRED";
const REQUIRED_PERMISSION = "CREATE_STUDENT_ACCOUNT";
const SESSION_TTL_MINUTES = 30;
const NEXT_REPLY_TEXT =
  "تم حفظ الاسم ✅\n\nأرسل رقم جوال الطالب بصيغة:\n05XXXXXXXX\nأو\n9665XXXXXXXX";
const CONFIRMATION_REPLY_MARKUP = {
  inline_keyboard: [
    [
      {
        text: "✅ تأكيد الإنشاء",
        callback_data: "CREATE_STUDENT_CONFIRM",
      },
    ],
    [
      {
        text: "✏️ تعديل",
        callback_data: "CREATE_STUDENT_EDIT",
      },
      {
        text: "❌ إلغاء",
        callback_data: "CREATE_STUDENT_CANCEL",
      },
    ],
  ],
};

type AutomationReplyMarkup = typeof CONFIRMATION_REPLY_MARKUP;

type AutomationSessionMessageResponse = {
  success: boolean;
  message: string;
  data: null | AutomationSessionMessageData;
  errorCode: string | null;
};

type AutomationSessionMessageData = {
  sessionId?: string;
  workflow?: string;
  step?: string;
  replyText: string;
  replyMarkup?: AutomationReplyMarkup;
  expiresAt?: string;
};

type AutomationSessionMessageBody = {
  telegramUserId?: unknown;
  chatId?: unknown;
  messageText?: unknown;
};

function jsonResponse(response: AutomationSessionMessageResponse, init?: ResponseInit) {
  return NextResponse.json(response, init);
}

function failureResponse(params: { message: string; errorCode: string; status?: number }) {
  return jsonResponse(
    {
      success: false,
      message: params.message,
      data: null,
      errorCode: params.errorCode,
    },
    { status: params.status ?? 400 },
  );
}

function conversationFailureResponse(params: {
  message: string;
  errorCode: string;
  replyText: string;
}) {
  return jsonResponse({
    success: false,
    message: params.message,
    data: {
      replyText: params.replyText,
    },
    errorCode: params.errorCode,
  });
}

function successResponse(params: {
  message: string;
  sessionId: string;
  workflow: string;
  step: string;
  replyText: string;
  replyMarkup?: AutomationReplyMarkup;
  expiresAt: Date;
}) {
  return jsonResponse({
    success: true,
    message: params.message,
    data: {
      sessionId: params.sessionId,
      workflow: params.workflow,
      step: params.step,
      replyText: params.replyText,
      ...(params.replyMarkup ? { replyMarkup: params.replyMarkup } : {}),
      expiresAt: params.expiresAt.toISOString(),
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

function normalizeText(value: unknown) {
  return getString(value).replace(/\s+/g, " ");
}

function isInvalidStudentName(value: string) {
  return value.length < 2 || /^\d+$/.test(value);
}

function normalizeSaudiMobile(value: string) {
  const digits = value.replace(/\D/g, "");

  if (/^05\d{8}$/.test(digits)) {
    return `966${digits.slice(1)}`;
  }

  if (/^9665\d{8}$/.test(digits)) {
    return digits;
  }

  return null;
}

function getExpiresAt() {
  return new Date(Date.now() + SESSION_TTL_MINUTES * 60 * 1000);
}

function getSessionData(data: Prisma.JsonValue): Prisma.InputJsonObject {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {};
  }

  return data as Prisma.InputJsonObject;
}

async function findAuthorizedOperator(telegramUserId: string) {
  const operator = await prisma.botOperator.findUnique({
    where: {
      telegramUserId,
    },
    select: {
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

  return Boolean(
    operator &&
      operator.status === STATUS_ACTIVE &&
      operator.permissions.includes(REQUIRED_PERMISSION) &&
      operator.linkedAdminUserId &&
      operator.linkedAdminUser &&
      operator.linkedAdminUser.role === UserRole.ADMIN &&
      operator.linkedAdminUser.isActive,
  );
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return failureResponse({
      message: "غير مصرح بتنفيذ هذا الطلب.",
      errorCode: "UNAUTHORIZED",
      status: 401,
    });
  }

  const body = (await request.json().catch(() => null)) as AutomationSessionMessageBody | null;
  const telegramUserId = getString(body?.telegramUserId);
  const chatId = getString(body?.chatId);
  const messageText = normalizeText(body?.messageText);

  if (!telegramUserId || !chatId || !messageText) {
    return failureResponse({
      message: "بيانات الرسالة غير مكتملة.",
      errorCode: "INVALID_INPUT",
      status: 400,
    });
  }

  const isOperatorAuthorized = await findAuthorizedOperator(telegramUserId);

  if (!isOperatorAuthorized) {
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
      status: STATUS_ACTIVE,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      workflow: true,
      step: true,
      data: true,
      expiresAt: true,
    },
  });

  if (!session) {
    return conversationFailureResponse({
      message: "لا توجد جلسة نشطة. ابدأ من القائمة من جديد.",
      errorCode: "SESSION_NOT_FOUND",
      replyText: "لا توجد جلسة نشطة حاليًا. اختر إجراء من القائمة الرئيسية للبدء.",
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

    return conversationFailureResponse({
      message: "انتهت الجلسة. ابدأ من القائمة من جديد.",
      errorCode: "SESSION_EXPIRED",
      replyText: "انتهت الجلسة. ابدأ من القائمة الرئيسية من جديد.",
    });
  }

  if (session.step === STEP_WAITING_STUDENT_NAME) {
    if (isInvalidStudentName(messageText)) {
      return conversationFailureResponse({
        message: "اسم الطالب غير صالح. أرسل اسمًا لا يقل عن حرفين وليس أرقامًا فقط.",
        errorCode: "INVALID_NAME",
        replyText: "اسم الطالب غير صالح. أرسل اسمًا لا يقل عن حرفين وليس أرقامًا فقط.",
      });
    }

    const expiresAt = getExpiresAt();
    const data = {
      ...getSessionData(session.data),
      chatId,
      initialName: messageText,
    } satisfies Prisma.InputJsonObject;

    const updatedSession = await prisma.botSession.update({
      where: {
        id: session.id,
      },
      data: {
        step: STEP_WAITING_MOBILE,
        expiresAt,
        data,
      },
      select: {
        id: true,
        workflow: true,
        step: true,
        expiresAt: true,
      },
    });

    return successResponse({
      message: "تم حفظ اسم الطالب.",
      sessionId: updatedSession.id,
      workflow: updatedSession.workflow,
      step: updatedSession.step,
      replyText: NEXT_REPLY_TEXT,
      expiresAt: updatedSession.expiresAt,
    });
  }

  if (session.step === STEP_WAITING_MOBILE) {
    const existingData = getSessionData(session.data);
    const initialName = getString(existingData.initialName);

    if (!initialName) {
      return conversationFailureResponse({
        message: "بيانات الجلسة غير مكتملة. ابدأ من القائمة من جديد.",
        errorCode: "INVALID_SESSION_DATA",
        replyText: "بيانات الجلسة غير مكتملة. ابدأ من القائمة الرئيسية من جديد.",
      });
    }

    const normalizedMobile = normalizeSaudiMobile(messageText);

    if (!normalizedMobile) {
      return conversationFailureResponse({
        message: "رقم الجوال غير صحيح. أرسل رقمًا بصيغة 05XXXXXXXX أو 9665XXXXXXXX.",
        errorCode: "INVALID_MOBILE",
        replyText: "رقم الجوال غير صحيح. أرسل رقمًا بصيغة 05XXXXXXXX أو 9665XXXXXXXX.",
      });
    }

    const expiresAt = getExpiresAt();
    const data = {
      ...existingData,
      chatId,
      mobileNumber: normalizedMobile,
    } satisfies Prisma.InputJsonObject;

    const updatedSession = await prisma.botSession.update({
      where: {
        id: session.id,
      },
      data: {
        step: STEP_WAITING_CONFIRMATION,
        expiresAt,
        data,
      },
      select: {
        id: true,
        workflow: true,
        step: true,
        expiresAt: true,
      },
    });

    return successResponse({
      message: "تم حفظ رقم الجوال.",
      sessionId: updatedSession.id,
      workflow: updatedSession.workflow,
      step: updatedSession.step,
      replyText: `راجع بيانات الطالب قبل الإنشاء:\n\nالاسم: ${initialName}\nالجوال: ${normalizedMobile}\n\nهل تريد إنشاء الحساب الآن؟`,
      replyMarkup: CONFIRMATION_REPLY_MARKUP,
      expiresAt: updatedSession.expiresAt,
    });
  }

  return conversationFailureResponse({
    message: "هذه الرسالة لا تناسب خطوة الجلسة الحالية.",
    errorCode: "INVALID_STEP",
    replyText: "هذه الرسالة لا تناسب الخطوة الحالية. استخدم الأزرار أو ابدأ من القائمة من جديد.",
  });
}
