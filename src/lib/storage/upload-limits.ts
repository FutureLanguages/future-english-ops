const configuredMaxUploadSizeMb = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB ?? "10");

export const MAX_UPLOAD_SIZE_MB =
  Number.isFinite(configuredMaxUploadSizeMb) && configuredMaxUploadSizeMb > 0
    ? configuredMaxUploadSizeMb
    : 10;

export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
export const MAX_UPLOAD_SIZE_LABEL = `${MAX_UPLOAD_SIZE_MB}MB`;

export const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function isAllowedUploadMimeType(mimeType: string) {
  return ALLOWED_UPLOAD_MIME_TYPES.has(mimeType);
}
