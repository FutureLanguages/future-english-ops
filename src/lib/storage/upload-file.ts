import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export async function storeUploadedFile(params: {
  file: File;
  folder: string;
}) {
  const safeName = sanitizeFilename(params.file.name || "upload.bin") || "upload.bin";
  const storageFilename = `${Date.now()}-${randomUUID()}-${safeName}`;
  const relativeFolder = path.join("uploads", params.folder);
  const absoluteFolder = path.join(process.cwd(), "public", relativeFolder);
  const absolutePath = path.join(absoluteFolder, storageFilename);

  await mkdir(absoluteFolder, { recursive: true });

  const arrayBuffer = await params.file.arrayBuffer();
  await writeFile(absolutePath, Buffer.from(arrayBuffer));

  return {
    storageKey: path.join(relativeFolder, storageFilename).replaceAll("\\", "/"),
    originalName: params.file.name || "ملف مرفوع",
    mimeType: params.file.type || "application/octet-stream",
    sizeBytes: params.file.size,
  };
}
