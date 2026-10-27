// Review feedback recorded on insights, directions and briefs: what was
// decided, why, by whom and when. Shared by the app, client review and the
// Claude connector (list_recent_feedback). No Firebase imports.

export type ReviewDecision = "approved" | "rejected" | "changes_requested";

export interface ReviewEntry {
  decision: ReviewDecision;
  note?: string;
  // "staff" = NOK OS user, "client" = share-link reviewer.
  role: "staff" | "client";
  by?: string; // staff email or client approver label
  at: string; // ISO timestamp
}

// Fields every reviewable item carries.
export interface Reviewable {
  feedback?: ReviewEntry[]; // full history, oldest first
  lastReview?: ReviewEntry; // latest entry, for quick reads
}

export const REVIEW_STATUS: Record<ReviewDecision, "Approved" | "Rejected" | "Changes Requested"> = {
  approved: "Approved",
  rejected: "Rejected",
  changes_requested: "Changes Requested",
};

export const REVIEW_LABEL: Record<ReviewDecision, string> = {
  approved: "Approved",
  rejected: "Rejected",
  changes_requested: "Needs changes",
};

// Reject and "needs changes" must say why.
export const noteRequired = (d: ReviewDecision) => d !== "approved";

export function makeReviewEntry(decision: ReviewDecision, note: string | undefined, role: ReviewEntry["role"], by?: string): ReviewEntry {
  const trimmed = (note || "").trim().slice(0, 2000);
  if (noteRequired(decision) && !trimmed) throw new Error("Please add a reason.");
  return {
    decision,
    role,
    at: new Date().toISOString(),
    ...(trimmed ? { note: trimmed } : {}),
    ...(by ? { by: by.slice(0, 120) } : {}),
  };
}

// Maps a status change to a review decision (null if it isn't a review).
export function decisionForStatus(status: unknown): ReviewDecision | null {
  if (status === "Approved") return "approved";
  if (status === "Rejected") return "rejected";
  if (status === "Changes Requested") return "changes_requested";
  return null;
}
