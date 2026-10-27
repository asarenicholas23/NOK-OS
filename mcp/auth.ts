import crypto from "node:crypto";
import type express from "express";

// The connector's shared secret. Claude sends it on every request in the
// x-api-key header (configured once in Claude's "Add custom connector" dialog).
// Minimum length keeps a weak value from ever being accepted.
const MIN_SECRET_LENGTH = 32;

function configuredSecret(): string | null {
  const secret = process.env.MCP_API_KEY || "";
  return secret.length >= MIN_SECRET_LENGTH ? secret : null;
}

export function mcpConfigured(): boolean {
  return configuredSecret() !== null;
}

// Hash both sides first so the comparison is constant time regardless of length.
function secretMatches(provided: string, expected: string): boolean {
  const a = crypto.createHash("sha256").update(provided).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function clientIp(req: express.Request): string {
  return String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
}

// Fixed-window counters (single Render instance, so in-memory is enough).
const hits = new Map<string, { count: number; resetAt: number }>();
function overLimit(key: string, limit: number, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count++;
  if (hits.size > 10_000) {
    for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k);
  }
  return entry.count > limit;
}

// Failed attempts are limited per IP to slow down guessing; accepted requests
// share one budget, since there is a single key.
const FAILED_PER_IP_PER_MIN = 10;
const ACCEPTED_PER_MIN = 120;

function jsonRpcError(res: express.Response, status: number, message: string) {
  res.status(status).json({ jsonrpc: "2.0", error: { code: -32001, message }, id: null });
}

export function requireMcpKey(req: express.Request, res: express.Response, next: express.NextFunction) {
  const expected = configuredSecret();
  if (!expected) return jsonRpcError(res, 503, "Connector is not configured on the server.");

  // A correct key is never blocked by other callers' failures: Claude's
  // requests come from shared Anthropic IPs, so an IP-wide lockout would let
  // anyone lock the connector out. Only wrong keys are throttled per IP.
  const provided = req.headers["x-api-key"];
  if (typeof provided !== "string" || !secretMatches(provided, expected)) {
    const throttled = overLimit(`fail|${clientIp(req)}`, FAILED_PER_IP_PER_MIN);
    return throttled ? jsonRpcError(res, 429, "Too many requests.") : jsonRpcError(res, 401, "Unauthorized.");
  }

  if (overLimit("ok", ACCEPTED_PER_MIN)) return jsonRpcError(res, 429, "Too many requests.");
  next();
}
