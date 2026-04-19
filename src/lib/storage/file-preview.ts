export function isPreviewableMimeType(mimeType: string | null | undefined) {
  if (!mimeType) {
    return false;
  }

  return mimeType.startsWith("image/") || mimeType === "application/pdf";
}
