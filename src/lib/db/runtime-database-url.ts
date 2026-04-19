function stripWrappingQuotes(value: string) {
  return value.replace(/^"(.*)"$/, "$1");
}

export function sanitizeDatabaseUrl(rawUrl?: string | null) {
  if (!rawUrl) {
    return "missing";
  }

  try {
    const parsed = new URL(stripWrappingQuotes(rawUrl));
    const user = parsed.username || "unknown";
    const host = parsed.host || "unknown-host";
    const db = parsed.pathname?.replace(/^\//, "") || "unknown-db";

    return `${user}@${host}/${db}`;
  } catch {
    return "invalid-url";
  }
}

export function getDatabaseHostPort(rawUrl?: string | null) {
  if (!rawUrl) {
    return "missing";
  }

  try {
    const parsed = new URL(stripWrappingQuotes(rawUrl));
    const host = parsed.hostname || "unknown-host";
    const port = parsed.port || "(default)";
    return `${host}:${port}`;
  } catch {
    return "invalid-url";
  }
}
