import { randomUUID } from "crypto";
import { getSupabaseStorageConfig, uploadObjectToSupabaseStorage } from "@/lib/storage/supabase-storage";

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function normalizeFolder(folder: string) {
  const normalized = folder.replaceAll("\\", "/").replace(/^\/+|\/+$/g, "");

  if (normalized.includes("/receipts")) {
    const applicationId = normalized.split("/")[0] ?? "unknown-application";
    return `applications/${applicationId}/receipts`;
  }

  return `applications/${normalized}/documents`;
}

export async function storeUploadedFile(params: {
  file: File;
  folder: string;
}) {
  const config = getSupabaseStorageConfig();
  const safeName = sanitizeFilename(params.file.name || "upload.bin") || "upload.bin";
  const storageFilename = `${Date.now()}-${randomUUID()}-${safeName}`;
  const storageKey = `${normalizeFolder(params.folder)}/${storageFilename}`;

  const arrayBuffer = await params.file.arrayBuffer();
  await uploadObjectToSupabaseStorage({
    config,
    storageKey,
    body: Buffer.from(arrayBuffer),
    contentType: params.file.type || "application/octet-stream",
  });

  return {
    storageKey,
    originalName: params.file.name || "ملف مرفوع",
    mimeType: params.file.type || "application/octet-stream",
    sizeBytes: params.file.size,
  };
}
