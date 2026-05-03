type SupabaseStorageConfig = {
  url: string;
  serviceRoleKey: string;
  bucket: string;
};

export class SupabaseStorageError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "SupabaseStorageError";
    this.status = status;
  }
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/g, "");
}

function requireEnv(name: string, fallbackName?: string) {
  const value = process.env[name] ?? (fallbackName ? process.env[fallbackName] : undefined);

  if (!value) {
    throw new Error(`missing_${name.toLowerCase()}${fallbackName ? `_or_${fallbackName.toLowerCase()}` : ""}`);
  }

  return value;
}

export function getSupabaseStorageConfig(): SupabaseStorageConfig {
  return {
    url: trimTrailingSlash(requireEnv("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL")),
    serviceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_ROLE"),
    bucket: process.env.SUPABASE_STORAGE_BUCKET || "application-files",
  };
}

function normalizeStorageKey(storageKey: string) {
  return storageKey
    .replaceAll("\\", "/")
    .replace(/^\/+/g, "");
}

function encodeStorageKey(storageKey: string) {
  const encodedKey = storageKey
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  return encodedKey;
}

function storageObjectUrl(config: SupabaseStorageConfig, storageKey: string) {
  return `${config.url}/storage/v1/object/${encodeURIComponent(config.bucket)}/${encodeStorageKey(
    normalizeStorageKey(storageKey),
  )}`;
}

function authenticatedStorageObjectUrl(config: SupabaseStorageConfig, storageKey: string) {
  return `${config.url}/storage/v1/object/authenticated/${encodeURIComponent(config.bucket)}/${encodeStorageKey(
    normalizeStorageKey(storageKey),
  )}`;
}

async function fetchStorageObject(config: SupabaseStorageConfig, storageKey: string, authenticated: boolean) {
  return fetch((authenticated ? authenticatedStorageObjectUrl : storageObjectUrl)(config, storageKey), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${config.serviceRoleKey}`,
      apikey: config.serviceRoleKey,
    },
  });
}

function legacyStorageKeyCandidates(storageKey: string) {
  const normalized = normalizeStorageKey(storageKey);
  const parts = normalized.split("/");

  if (parts[0] !== "applications" || parts.length < 4) {
    return [normalized];
  }

  const applicationId = parts[1];
  const section = parts[2];
  const filename = parts.slice(3).join("/");
  const candidates = [normalized];

  if (section === "documents") {
    candidates.push(`uploads/${applicationId}/${filename}`);
  }

  if (section === "receipts") {
    candidates.push(`uploads/${applicationId}/receipts/${filename}`);
  }

  return candidates;
}

export async function uploadObjectToSupabaseStorage(params: {
  config: SupabaseStorageConfig;
  storageKey: string;
  body: Buffer;
  contentType: string;
}) {
  const response = await fetch(storageObjectUrl(params.config, params.storageKey), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.config.serviceRoleKey}`,
      apikey: params.config.serviceRoleKey,
      "Content-Type": params.contentType,
      "x-upsert": "true",
    },
    body: new Uint8Array(params.body),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(`supabase_storage_upload_failed:${response.status}:${message}`);
  }
}

export async function downloadObjectFromSupabaseStorage(storageKey: string) {
  const config = getSupabaseStorageConfig();
  let lastResponse: Response | null = null;

  for (const candidate of legacyStorageKeyCandidates(storageKey)) {
    const authenticatedResponse = await fetchStorageObject(config, candidate, true);
    if (authenticatedResponse.ok) {
      return Buffer.from(await authenticatedResponse.arrayBuffer());
    }

    lastResponse = authenticatedResponse;

    const directResponse = await fetchStorageObject(config, candidate, false);
    if (directResponse.ok) {
      return Buffer.from(await directResponse.arrayBuffer());
    }

    lastResponse = directResponse;

    if (authenticatedResponse.status !== 404 || directResponse.status !== 404) {
      break;
    }
  }

  const status = lastResponse?.status ?? 500;

  throw new SupabaseStorageError(`supabase_storage_download_failed:${status}`, status);
}
