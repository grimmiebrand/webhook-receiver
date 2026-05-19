// Centralized, validated env access. Read this file to understand every env var the app uses.

function required(name: string): string {
  const v = process.env[name];
  if (!v || v.length === 0) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

function parseList(v: string): string[] {
  return v
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export const env = {
  databaseUrl: optional("DATABASE_URL"),
  allowedSources: parseList(optional("ALLOWED_SOURCES", "generic")),
  rateLimitPerMinute: Number(optional("RATE_LIMIT_PER_MINUTE", "120")),
  logLevel: (optional("LOG_LEVEL", "info") as "debug" | "info" | "warn" | "error"),
  dashboardToken: optional("DASHBOARD_TOKEN", ""),
  nodeEnv: optional("NODE_ENV", "development"),
};

export function secretForSource(source: string): string | null {
  const key = `${source.toUpperCase()}_SECRET`;
  const v = process.env[key];
  return v && v.length > 0 ? v : null;
}

export function isSourceAllowed(source: string): boolean {
  return env.allowedSources.includes(source.toLowerCase());
}
