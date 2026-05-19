// HMAC-SHA256 signature verification with timing-safe compare.
// Supports two common formats:
//   1) Raw hex: "abcdef0123..."
//   2) Stripe-style: "t=<unix>,v1=<hex>"
import crypto from "crypto";

export interface VerifyResult {
  ok: boolean;
  reason?: string;
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

export function verifySignature(opts: {
  rawBody: string;
  signatureHeader: string | null;
  secret: string;
  toleranceSeconds?: number;
}): VerifyResult {
  const { rawBody, signatureHeader, secret, toleranceSeconds = 300 } = opts;
  if (!signatureHeader) return { ok: false, reason: "missing_signature" };
  if (!secret) return { ok: false, reason: "missing_secret" };

  // Stripe-style "t=..,v1=.."
  if (signatureHeader.includes("t=") && signatureHeader.includes("v1=")) {
    const parts = Object.fromEntries(
      signatureHeader.split(",").map((p) => {
        const [k, v] = p.split("=");
        return [k.trim(), v?.trim() ?? ""];
      })
    );
    const t = Number(parts["t"]);
    const v1 = parts["v1"];
    if (!t || !v1) return { ok: false, reason: "malformed_signature" };
    const drift = Math.abs(Date.now() / 1000 - t);
    if (drift > toleranceSeconds) return { ok: false, reason: "timestamp_out_of_tolerance" };
    const signed = `${t}.${rawBody}`;
    const expected = crypto.createHmac("sha256", secret).update(signed).digest("hex");
    return timingSafeEqualHex(expected, v1)
      ? { ok: true }
      : { ok: false, reason: "bad_signature" };
  }

  // Raw hex (also accepts "sha256=<hex>" GitHub style)
  const provided = signatureHeader.replace(/^sha256=/i, "").trim();
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return timingSafeEqualHex(expected, provided)
    ? { ok: true }
    : { ok: false, reason: "bad_signature" };
}
