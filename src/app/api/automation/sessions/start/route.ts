import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

const WORKFLOW = "CREATE_STUDENT_ACCOUNT";
const STEP = "WAITING_STUDENT_NAME";
const STATUS_ACTIVE = "ACTIVE";
const STATUS_CANCELLED = "CANCELLED";
const REQUIRED_PERMISSION = "CREATE_STUDENT_ACCOUNT";
const SOURCE = "telegram_bot";
const STARTED_FROM = "main_menu";
const SESSION_TTL_MINUTES = 30;

type StartAutomationSessionResponse = {
  success: boolean;
  message: string;
  data: null | {
    sessionId: string;
    telegramUserId: string;
    workflow: string;
    step: string;
    status: string;
    expiresAt: string;
  };
  errorCode: string | null;
};

type StartAutomationSessionBody = {
  telegramUserId?: unknown;
  chatId?: unknown;
  workflow?: unknown;
  callbackData?: unknown;
};

function jsonResponse(response: StartAutomationSessionResponse, init?: ResponseInit) {
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

function successResponse(params: {
  sessionId: string;
  telegramUserId: string;
  workflow: string;
  step: string;
  status: string;
  expiresAt: Date;
}) {
  return jsonResponse({
    success: true,
    message: "تم بدء جلسة إنشاء حساب الطالب.",
    data: {
      sessionId: params.sessionId,
      telegramUserId: params.telegramUserId,
      workflow: params.workflow,
      step: params.step,
      status: params.status,
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

function getExpiresAt() {
  return new Date(Date.now() + SESSION_TTL_MINUTES * 60 * 1000);
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

  const body = (await request.json().catch(() => null)) as StartAutomationSessionBody | null;
  const telegramUserId = getString(body?.telegramUserId);
  const chatId = getString(body?.chatId);
  const workflow = getString(body?.workflow);
  const callbackData = getString(body?.callbackData);

  if (!telegramUserId || !chatId || !workflow || !callbackData) {
    return failureResponse({
      message: "بيانات بدء الجلسة غير مكتملة.",
      errorCode: "INVALID_INPUT",
      status: 400,
    });
  }

  if (workflow !== WORKFLOW || callbackData !== WORKFLOW) {
    return failureResponse({
      message: "نوع الجلسة غير مدعوم في هذا المسار.",
      errorCode: "UNSUPPORTED_WORKFLOW",
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

  const expiresAt = getExpiresAt();
  const session = await prisma.$transaction(async (tx) => {
    await tx.botSession.updateMany({
      where: {
        telegramUserId,
        workflow,
        status: STATUS_ACTIVE,
      },
      data: {
        status: STATUS_CANCELLED,
      },
    });

    return tx.botSession.create({
      data: {
        telegramUserId,
        workflow,
        step: STEP,
        status: STATUS_ACTIVE,
        expiresAt,
        data: {
          chatId,
          source: SOURCE,
          startedFrom: STARTED_FROM,
          lastCallbackData: callbackData,
        } satisfies Prisma.InputJsonObject,
      },
      select: {
        id: true,
        telegramUserId: true,
        workflow: true,
        step: true,
        status: true,
        expiresAt: true,
      },
    });
  });

  return successResponse({
    sessionId: session.id,
    telegramUserId: session.telegramUserId,
    workflow: session.workflow,
    step: session.step,
    status: session.status,
    expiresAt: session.expiresAt,
  });
}
