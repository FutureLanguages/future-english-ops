import { access, readFile } from "fs/promises";
import path from "path";

function normalizeStorageKey(storageKey: string) {
  return storageKey
    .replaceAll("\\", "/")
    .replace(/^\/+/, "")
    .replace(/^public\//, "");
}

export function resolveStoredFilePath(storageKey: string) {
  const publicRoot = path.join(process.cwd(), "public");
  const normalizedStorageKey = normalizeStorageKey(storageKey);
  const candidates = [
    path.resolve(publicRoot, normalizedStorageKey),
    path.resolve(process.cwd(), normalizedStorageKey),
  ];

  for (const absolutePath of candidates) {
    if (absolutePath.startsWith(publicRoot)) {
      return absolutePath;
    }
  }

  throw new Error("invalid_storage_key");
}

export async function readStoredFile(storageKey: string) {
  const absolutePath = resolveStoredFilePath(storageKey);
  await access(absolutePath);
  return readFile(absolutePath);
}
