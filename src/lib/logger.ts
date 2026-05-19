// Tiny structured JSON logger. No deps, Render-friendly (writes to stdout).
import { env } from "./env";

type Level = "debug" | "info" | "warn" | "error";
const order: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function shouldLog(level: Level) {
  return order[level] >= order[env.logLevel];
}

function emit(level: Level, msg: string, meta?: Record<string, unknown>) {
  if (!shouldLog(level)) return;
  const line = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...meta,
  };
  const out = JSON.stringify(line);
  if (level === "error") console.error(out);
  else if (level === "warn") console.warn(out);
  else console.log(out);
}

export const log = {
  debug: (msg: string, meta?: Record<string, unknown>) => emit("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => emit("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => emit("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => emit("error", msg, meta),
};
