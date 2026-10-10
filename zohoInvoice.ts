import type { Firestore } from "firebase-admin/firestore";

// Zoho Invoice sync: when a proposal payment is confirmed, create the client's
// contact and a full-price invoice from the accepted proposal version, then
// record each Paystack payment against it. Every step stores the Zoho id it
// created, so re-running a sync (retries, the CMS "Retry" button) never
// duplicates anything in Zoho.

const SITE_ORIGIN = "https://noksocial.com";

const config = () => {
  // Zoho data centre: "com" (US), "eu", "in", "com.au", "jp"…, from the
  // address you sign in at (e.g. invoice.zoho.eu → "eu").
  const dc = process.env.ZOHO_DC || "com";
  return {
    clientId: process.env.ZOHO_CLIENT_ID || "",
    clientSecret: process.env.ZOHO_CLIENT_SECRET || "",
    refreshToken: process.env.ZOHO_REFRESH_TOKEN || "",
    orgId: process.env.ZOHO_ORG_ID || "",
    accountsUrl: process.env.ZOHO_ACCOUNTS_URL || `https://accounts.zoho.${dc}`,
    apiBase: process.env.ZOHO_API_BASE || `https://www.zohoapis.${dc}/invoice/v3`,
    paymentMode: process.env.ZOHO_PAYMENT_MODE || "Paystack",
    emailInvoices: process.env.ZOHO_EMAIL_INVOICES !== "false",
  };
};

export const zohoConfigured = () => {
  const c = config();
  return !!(c.clientId && c.clientSecret && c.refreshToken && c.orgId);
};

let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const c = config();
  const resp = await fetch(`${c.accountsUrl}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: c.refreshToken,
      client_id: c.clientId,
      client_secret: c.clientSecret,
      grant_type: "refresh_token",
    }),
  });
  const body: any = await resp.json().catch(() => ({}));
  if (!resp.ok || !body.access_token) {
    throw new Error(`Zoho sign-in failed: ${body.error || resp.status}. Check ZOHO_CLIENT_ID/SECRET/REFRESH_TOKEN and ZOHO_DC.`);
  }
  cachedToken = { value: body.access_token, expiresAt: Date.now() + (Number(body.expires_in) || 3600) * 1000 };
  return cachedToken.value;
}

async function zoho(method: "GET" | "POST", path: string, body?: unknown): Promise<any> {
  const c = config();
  const resp = await fetch(`${c.apiBase}${path}`, {
    method,
    headers: {
      Authorization: `Zoho-oauthtoken ${await accessToken()}`,
      "X-com-zoho-invoice-organizationid": c.orgId,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json: any = await resp.json().catch(() => ({}));
  if (!resp.ok || json.code !== 0) {
    throw new Error(`Zoho ${method} ${path.split("?")[0]} failed: ${json.message || resp.status}`);
  }
  return json;
}

async function findOrCreateContact(p: FirebaseFirestore.DocumentData): Promise<string> {
  const email = String(p.clientEmail || "").toLowerCase();
  const found = await zoho("GET", `/contacts?email=${encodeURIComponent(email)}`);
  const match = (found.contacts || []).find((ct: any) => String(ct.email || "").toLowerCase() === email);
  if (match) return match.contact_id;

  const created = await zoho("POST", "/contacts", {
    contact_name: p.businessName || p.clientName,
    company_name: p.businessName || undefined,
    contact_persons: [{ first_name: p.clientName, email: p.clientEmail, is_primary_contact: true }],
  });
  return created.contact.contact_id;
}

const today = () => new Date().toISOString().slice(0, 10);

// One sync at a time per proposal (webhook, client return and staff retries can overlap).
const inFlight = new Map<string, Promise<SyncResult>>();

export type SyncResult = "synced" | "not_configured" | "not_accepted" | "error";

export function syncProposalToZoho(db: Firestore, proposalId: string): Promise<SyncResult> {
  const running = inFlight.get(proposalId);
  if (running) return running;
  const job = runSync(db, proposalId).finally(() => inFlight.delete(proposalId));
  inFlight.set(proposalId, job);
  return job;
}

async function runSync(db: Firestore, proposalId: string): Promise<SyncResult> {
  if (!zohoConfigured()) return "not_configured";
  const ref = db.collection("proposals").doc(proposalId);
  const prop = (await ref.get()).data();
  if (!prop || prop.status !== "accepted") return "not_accepted";

  try {
    const snap = (await ref.collection("versions").doc(String(prop.acceptedVersion)).get()).data();
    if (!snap) throw new Error(`Accepted version v${prop.acceptedVersion} is missing.`);

    let contactId: string = prop.zohoContactId;
    if (!contactId) {
      contactId = await findOrCreateContact(prop);
      await ref.update({ zohoContactId: contactId });
    }

    let invoiceId: string = prop.zohoInvoiceId;
    if (!invoiceId) {
      const created = await zoho("POST", "/invoices", {
        customer_id: contactId,
        date: (prop.acceptedAt || today()).slice(0, 10),
        reference_number: `Proposal v${prop.acceptedVersion}`,
        line_items: (snap.lineItems || []).map((li: any) => ({
          name: String(li.title || "Item").slice(0, 100),
          description: li.description || "",
          rate: Number(li.amount) || 0,
          quantity: 1,
        })),
        notes: `${snap.title}\nYour proposal: ${SITE_ORIGIN}/proposal/${prop.token}`,
        terms: `${snap.depositPercent}% deposit paid to start. The balance is due on delivery and can be paid from your proposal link.`,
      });
      invoiceId = created.invoice.invoice_id;
      await ref.update({ zohoInvoiceId: invoiceId, zohoInvoiceNumber: created.invoice.invoice_number || null });
    }

    // Record confirmed payments not yet in Zoho. Duplicate deposits are left
    // out: they'd overpay the invoice and are flagged for refund instead.
    const payments = await ref.collection("payments").where("status", "==", "success").get();
    const pending = payments.docs
      .filter((d) => !d.data().zohoPaymentId && !d.data().duplicate)
      .sort((a, b) => String(a.data().paidAt).localeCompare(String(b.data().paidAt)));
    for (const d of pending) {
      const pay = d.data();
      const recorded = await zoho("POST", "/customerpayments", {
        customer_id: contactId,
        payment_mode: config().paymentMode,
        amount: pay.amount,
        date: String(pay.paidAt || today()).slice(0, 10),
        reference_number: pay.reference,
        description: `Paystack ${pay.kind} payment${pay.channel ? ` (${String(pay.channel).replace("_", " ")})` : ""}`,
        invoices: [{ invoice_id: invoiceId, amount_applied: pay.amount }],
      });
      await d.ref.update({ zohoPaymentId: recorded.payment.payment_id });
    }

    // Email the invoice once, after the deposit is on it, so the client's copy
    // shows what's paid and the balance due. Otherwise just mark it sent.
    if (!prop.zohoInvoiceSent) {
      if (config().emailInvoices) {
        await zoho("POST", `/invoices/${invoiceId}/email`, { to_mail_ids: [prop.clientEmail] });
      } else {
        await zoho("POST", `/invoices/${invoiceId}/status/sent`);
      }
      await ref.update({ zohoInvoiceSent: true });
    }

    await ref.update({ zohoSyncError: null, zohoSyncedAt: new Date().toISOString() });
    return "synced";
  } catch (error: any) {
    console.error(`[zoho] sync failed for ${proposalId}:`, error);
    await ref.update({ zohoSyncError: String(error.message || error).slice(0, 500), zohoSyncedAt: new Date().toISOString() });
    return "error";
  }
}
