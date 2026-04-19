import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Client } from "pg";
import { sanitizeDatabaseUrl } from "@/lib/db/runtime-database-url";

type DiagnosticDriver = "pg" | "prisma-engine" | "prisma-adapter-pg";
type DiagnosticTarget = "DATABASE_URL" | "DIRECT_URL";

type DiagnosticSuccess = {
  driver: DiagnosticDriver;
  target: DiagnosticTarget;
  database: string;
  ok: true;
  durationMs: number;
};

type DiagnosticFailure = {
  driver: DiagnosticDriver;
  target: DiagnosticTarget;
  database: string;
  ok: false;
  durationMs: number;
  error: {
    name: string;
    message: string;
    code?: string;
  };
};

export type DatabaseDiagnosticResult = DiagnosticSuccess | DiagnosticFailure;

const DIAGNOSTIC_TIMEOUT_MS = 8_000;
const CLEANUP_TIMEOUT_MS = 1_000;

function getConfiguredTargets() {
  return [
    { target: "DATABASE_URL" as const, url: process.env.DATABASE_URL ?? null },
    { target: "DIRECT_URL" as const, url: process.env.DIRECT_URL ?? null },
  ].filter((entry): entry is { target: DiagnosticTarget; url: string } => Boolean(entry.url));
}

function toFailure(params: {
  driver: DiagnosticDriver;
  target: DiagnosticTarget;
  database: string;
  durationMs: number;
  error: unknown;
}): DiagnosticFailure {
  const error =
    params.error instanceof Error
      ? params.error
      : new Error(typeof params.error === "string" ? params.error : "Unknown error");

  return {
    driver: params.driver,
    target: params.target,
    database: params.database,
    ok: false,
    durationMs: params.durationMs,
    error: {
      name: error.name,
      message: error.message,
      code:
        typeof params.error === "object" &&
        params.error !== null &&
        "code" in params.error &&
        typeof (params.error as { code?: unknown }).code === "string"
          ? (params.error as { code: string }).code
          : undefined,
    },
  };
}

async function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`${label} timed out after ${DIAGNOSTIC_TIMEOUT_MS}ms`));
        }, DIAGNOSTIC_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

async function safeCleanup(promise: Promise<unknown>) {
  await Promise.race([
    promise.catch(() => undefined),
    new Promise((resolve) => {
      setTimeout(resolve, CLEANUP_TIMEOUT_MS);
    }),
  ]);
}

async function runPgDiagnostic(target: DiagnosticTarget, url: string): Promise<DatabaseDiagnosticResult> {
  const startedAt = Date.now();
  const client = new Client({
    connectionString: url,
    connectionTimeoutMillis: DIAGNOSTIC_TIMEOUT_MS,
    query_timeout: DIAGNOSTIC_TIMEOUT_MS,
  });

  try {
    await withTimeout(client.connect(), `pg connect (${target})`);
    await withTimeout(client.query("select 1 as ok"), `pg query (${target})`);

    return {
      driver: "pg",
      target,
      database: sanitizeDatabaseUrl(url),
      ok: true,
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    return toFailure({
      driver: "pg",
      target,
      database: sanitizeDatabaseUrl(url),
      durationMs: Date.now() - startedAt,
      error,
    });
  } finally {
    await safeCleanup(client.end());
  }
}

async function runPrismaEngineDiagnostic(
  target: DiagnosticTarget,
  url: string,
): Promise<DatabaseDiagnosticResult> {
  const startedAt = Date.now();
  const client = new PrismaClient({
    log: ["warn", "error"],
    datasources: {
      db: {
        url,
      },
    },
  });

  try {
    await withTimeout(client.$queryRawUnsafe("select 1 as ok"), `prisma engine query (${target})`);

    return {
      driver: "prisma-engine",
      target,
      database: sanitizeDatabaseUrl(url),
      ok: true,
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    return toFailure({
      driver: "prisma-engine",
      target,
      database: sanitizeDatabaseUrl(url),
      durationMs: Date.now() - startedAt,
      error,
    });
  } finally {
    await safeCleanup(client.$disconnect());
  }
}

async function runPrismaAdapterDiagnostic(
  target: DiagnosticTarget,
  url: string,
): Promise<DatabaseDiagnosticResult> {
  const startedAt = Date.now();
  const client = new PrismaClient({
    log: ["warn", "error"],
    adapter: new PrismaPg({ connectionString: url }),
  });

  try {
    await withTimeout(
      client.$queryRawUnsafe("select 1 as ok"),
      `prisma adapter query (${target})`,
    );

    return {
      driver: "prisma-adapter-pg",
      target,
      database: sanitizeDatabaseUrl(url),
      ok: true,
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    return toFailure({
      driver: "prisma-adapter-pg",
      target,
      database: sanitizeDatabaseUrl(url),
      durationMs: Date.now() - startedAt,
      error,
    });
  } finally {
    await safeCleanup(client.$disconnect());
  }
}

export async function runDatabaseDiagnostics() {
  const targets = getConfiguredTargets();

  const results = await Promise.all(
    targets.flatMap(({ target, url }) => [
      runPgDiagnostic(target, url),
      runPrismaEngineDiagnostic(target, url),
      runPrismaAdapterDiagnostic(target, url),
    ]),
  );

  return {
    environment: process.env.NODE_ENV ?? "unknown",
    results,
  };
}
