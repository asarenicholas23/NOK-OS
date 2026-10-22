import { collection, doc, getDocs, onSnapshot, orderBy, query, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { withCurrentServiceNames } from "../content/services";
import { db, cleanFirestoreData } from "./firebase";
import { SITE_URL } from "./seo";
import {
  Proposal,
  ProposalComment,
  ProposalPayment,
  ProposalSnapshot,
  PROPOSAL_CONTENT_FIELDS,
  DiscoveryRequest,
  ServicePackage,
  isWebsiteBuild,
  DEFAULT_DEPOSIT_PERCENT,
  DEFAULT_PROPOSAL_TERMS
} from "../data/cmsData";

// Proposals are staff-only in Firestore. Clients reach theirs later through the
// private /proposal/:token link, never by reading this collection directly.

export const subscribeToProposals = (onUpdate: (proposals: Proposal[]) => void) => {
  const q = query(collection(db, "proposals"), orderBy("updatedAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    onUpdate(snapshot.docs.map((d) => withCurrentServiceNames({ ...d.data(), id: d.id } as Proposal)));
  }, (err) => {
    console.warn("Firestore subscription error on proposals:", err);
  });
};

// Fields staff edit in the CMS. Saves merge only these, so they never clobber
// what the server records while the editor is open (client comments, status
// changes from change requests, view times).
const STAFF_FIELDS = [
  ...PROPOSAL_CONTENT_FIELDS,
  "id", "token", "requestId", "clientEmail", "serviceTier", "isWebsiteBuild", "createdAt"
] as const;

const staffFields = (p: Proposal) =>
  Object.fromEntries(STAFF_FIELDS.map((k) => [k, p[k]])) as Partial<Proposal>;

// Saving never changes what the client sees; once a proposal has been sent,
// edits are flagged as unsent until staff send an update.
export const saveProposal = async (proposal: Proposal) => {
  await setDoc(
    doc(db, "proposals", proposal.id),
    cleanFirestoreData({
      ...staffFields(proposal),
      // Status is only set by staff while it's an unsent draft; after that the
      // send flow and the client's actions own it.
      ...(proposal.sentVersion ? {} : { status: "draft" }),
      hasUnsentChanges: !!proposal.sentVersion,
      updatedAt: new Date().toISOString()
    }),
    { merge: true }
  );
};

export const nextSendVersion = (p: Proposal) => (p.sentVersion || 0) + 1;

// Freezes the current content as the next version the client sees.
export const sendProposal = async (proposal: Proposal, changeNote?: string): Promise<Proposal> => {
  const version = nextSendVersion(proposal);
  const sentAt = new Date().toISOString();
  const snapshot = Object.fromEntries(
    PROPOSAL_CONTENT_FIELDS.map((k) => [k, proposal[k]])
  ) as unknown as ProposalSnapshot;
  Object.assign(snapshot, { version, sentAt, ...(changeNote?.trim() ? { changeNote: changeNote.trim() } : {}) });

  const sent: Proposal = {
    ...proposal,
    version,
    sentVersion: version,
    hasUnsentChanges: false,
    status: "sent",
    sentAt,
    updatedAt: sentAt
  };
  const batch = writeBatch(db);
  batch.set(doc(db, "proposals", proposal.id, "versions", String(version)), cleanFirestoreData(snapshot));
  batch.set(
    doc(db, "proposals", proposal.id),
    cleanFirestoreData({ ...staffFields(sent), sentVersion: version, hasUnsentChanges: false, status: "sent", sentAt, updatedAt: sentAt }),
    { merge: true }
  );
  await batch.commit();
  return sent;
};

// Always the custom domain, even when staff work from nok-os.web.app: Google
// Safe Browsing has flagged the web.app address, so links there show a warning.
export const proposalLink = (p: Pick<Proposal, "token">) => `${SITE_URL}/proposal/${p.token}`;

export const subscribeToProposalComments = (proposalId: string, onUpdate: (comments: ProposalComment[]) => void) => {
  const q = query(collection(db, "proposals", proposalId, "comments"), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snapshot) => {
    onUpdate(snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as ProposalComment)));
  }, (err) => {
    console.warn("Firestore subscription error on proposal comments:", err);
  });
};

export const addStaffReply = async (proposal: Proposal, name: string, message: string) => {
  const id = "c-" + Date.now();
  const comment: ProposalComment = {
    id,
    author: "staff",
    name,
    message,
    kind: "comment",
    version: proposal.sentVersion || proposal.version,
    createdAt: new Date().toISOString()
  };
  await setDoc(doc(db, "proposals", proposal.id, "comments", id), comment);
};

export const markProposalSeen = async (proposalId: string) => {
  await updateDoc(doc(db, "proposals", proposalId), { staffSeenAt: new Date().toISOString() });
};

// Firestore doesn't delete subcollections with their parent, so clear the
// sent versions and comments too.
export const deleteProposal = async (id: string) => {
  const [versions, comments] = await Promise.all([
    getDocs(collection(db, "proposals", id, "versions")),
    getDocs(collection(db, "proposals", id, "comments"))
  ]);
  const batch = writeBatch(db);
  [...versions.docs, ...comments.docs].forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, "proposals", id));
  await batch.commit();
};

// 32 hex chars from the browser's CSPRNG, so links can't be guessed.
const newToken = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");

export const newRowId = () => Math.random().toString(36).slice(2, 10);

const plusDays = (days: number) => new Date(Date.now() + days * 86400_000).toISOString().slice(0, 10);

export const createDraftProposal = (
  services: ServicePackage[],
  lead?: DiscoveryRequest
): Proposal => {
  const service = services.find((s) => s.title === lead?.serviceTier);
  const now = new Date().toISOString();
  return {
    id: "proposal-" + Date.now(),
    token: newToken(),
    requestId: lead?.id,
    clientName: lead?.name || "",
    clientEmail: lead?.email || "",
    businessName: lead?.businessName || "",
    serviceTier: lead?.serviceTier || services[0]?.title || "",
    isWebsiteBuild: service ? isWebsiteBuild(service) : false,
    title: lead ? `${lead.serviceTier} for ${lead.businessName}` : "",
    overview: lead?.notes ? `**What you told us:** ${lead.notes}\n\n` : "",
    phases: [{ id: newRowId(), title: "Discovery & planning", duration: "Week 1", deliverables: [] }],
    lineItems: [{ id: newRowId(), title: service?.title || "", description: "", amount: 0 }],
    depositPercent: DEFAULT_DEPOSIT_PERCENT,
    terms: DEFAULT_PROPOSAL_TERMS,
    validUntil: plusDays(14),
    status: "draft",
    version: 1,
    createdAt: now,
    updatedAt: now
  };
};

export const subscribeToProposalPayments = (proposalId: string, onUpdate: (payments: ProposalPayment[]) => void) => {
  const q = query(collection(db, "proposals", proposalId, "payments"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    onUpdate(snapshot.docs.map((d) => d.data() as ProposalPayment));
  }, (err) => {
    console.warn("Firestore subscription error on proposal payments:", err);
  });
};

// Shows (or hides) the "Pay balance" button on the client's proposal page.
export const setBalanceRequested = async (proposalId: string, requested: boolean) => {
  await updateDoc(doc(db, "proposals", proposalId), { balanceRequested: requested });
};
