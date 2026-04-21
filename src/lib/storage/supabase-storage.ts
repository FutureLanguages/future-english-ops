type SupabaseStorageConfig = {
  url: string;
  serviceRoleKey: string;
  bucket: string;
};

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/g, "");
}

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`missing_${name.toLowerCase()}`);
  }

  return value;
}

export function getSupabaseStorageConfig(): SupabaseStorageConfig {
  return {
    url: trimTrailingSlash(requireEnv("SUPABASE_URL")),
    serviceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    bucket: process.env.SUPABASE_STORAGE_BUCKET || "application-files",
  };
}

function storageObjectUrl(config: SupabaseStorageConfig, storageKey: string) {
  const encodedKey = storageKey
    .replaceAll("\\", "/")
    .replace(/^\/+/g, "")
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  return `${config.url}/storage/v1/object/${encodeURIComponent(config.bucket)}/${encodedKey}`;
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
  const response = await fetch(storageObjectUrl(config, storageKey), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${config.serviceRoleKey}`,
      apikey: config.serviceRoleKey,
    },
  });

  if (!response.ok) {
    throw new Error(`supabase_storage_download_failed:${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}
