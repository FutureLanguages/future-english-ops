import { NextResponse } from "next/server";
import { runDatabaseDiagnostics } from "@/lib/db/dev-diagnostics";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not Found", { status: 404 });
  }

  try {
    const diagnostics = await runDatabaseDiagnostics();

    return NextResponse.json(diagnostics, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown diagnostics error",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
