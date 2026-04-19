import JSZip from "jszip";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/features/auth/server/admin-session";
import { readStoredFile } from "@/lib/storage/file-access";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  await getAdminSession();

  const { searchParams } = new URL(request.url);
  const fileAssetIds = searchParams.getAll("fileAssetIds");

  if (fileAssetIds.length === 0) {
    return NextResponse.json({ error: "missing_files" }, { status: 400 });
  }

  const assets = await prisma.fileAsset.findMany({
    where: {
      id: {
        in: fileAssetIds,
      },
    },
  });

  const zip = new JSZip();

  for (const asset of assets) {
    const fileBuffer = await readStoredFile(asset.storageKey);
    zip.file(asset.originalName || `${asset.id}.bin`, fileBuffer);
  }

  const archive = await zip.generateAsync({ type: "nodebuffer" });

  return new NextResponse(new Uint8Array(archive), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="documents-bulk-download.zip"',
    },
  });
}
