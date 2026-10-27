import type { Firestore } from "firebase-admin/firestore";

// Every tool call is recorded in mcpAuditLog (staff-only in firestore.rules).
// Logging never blocks or fails the tool call itself.
export function logToolCall(
  db: Firestore,
  entry: { tool: string; brandId?: string; ok: boolean; ms: number; itemCount?: number; error?: string },
) {
  // Firestore rejects undefined values, so drop them.
  const doc = Object.fromEntries(Object.entries(entry).filter(([, v]) => v !== undefined));
  db.collection("mcpAuditLog")
    .add({ ...doc, brandId: entry.brandId ?? null, at: new Date().toISOString() })
    .catch((err) => console.warn("[mcp] audit log write failed:", err?.message || err));
}
