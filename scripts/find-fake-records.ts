// READ-ONLY report of records created by the app's old demo/seed code
// (fake Acme/Global/Horizon brands, sample insights, sample analytics...).
// It never writes or deletes anything. Review the report, then decide.
//
// Run with production credentials, e.g. a service-account key:
//   GOOGLE_APPLICATION_CREDENTIALS=/path/key.json npx tsx scripts/find-fake-records.ts
// or with the FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY
// variables the API server uses (from .env).
import fs from "node:fs";
import dotenv from "dotenv";
import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { fakeReason } from "../mcp/fakeData";

dotenv.config();
const projectId = process.env.FIREBASE_PROJECT_ID || "nok-os-prod";
if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  initializeApp({
    credential: cert({
      projectId,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
} else {
  initializeApp({ credential: applicationDefault(), projectId });
}
const db = getFirestore();

const COLLECTIONS = [
  "brands", "briefs", "strategicInsights", "brandDirections", "rawAnalytics",
  "campaignQueues", "calendarEvents", "metrics", "creativeIdeas",
];

async function main() {
  const found: { collection: string; id: string; brandId: string | null; label: string; reason: string }[] = [];
  for (const col of COLLECTIONS) {
    const snap = await db.collection(col).get();
    snap.forEach((d) => {
      const data = d.data();
      const reason = fakeReason(col, d.id, data);
      if (reason) {
        found.push({
          collection: col, id: d.id, brandId: data.brandId ?? null,
          label: String(data.title ?? data.name ?? data.pillar ?? data.label ?? "").slice(0, 70), reason,
        });
      }
    });
  }

  console.log(`Project: ${projectId}  (read-only: nothing was changed)\n`);
  if (found.length === 0) {
    console.log("No fake records found.");
    return;
  }
  const byCol = new Map<string, number>();
  for (const f of found) byCol.set(f.collection, (byCol.get(f.collection) || 0) + 1);
  console.log("Suspected fake records by collection:");
  for (const [col, n] of byCol) console.log(`  ${col.padEnd(18)} ${n}`);
  console.log("");
  for (const f of found) {
    console.log(`  ${f.collection}/${f.id}  [${f.brandId ?? "-"}]  ${f.label}  <- ${f.reason}`);
  }
  const out = `fake-records-report-${new Date().toISOString().slice(0, 10)}.json`;
  fs.writeFileSync(out, JSON.stringify(found, null, 2));
  console.log(`\n${found.length} records listed. Full report: ${out}`);
}

main().catch((err) => {
  console.error("Report failed:", err?.message || err);
  process.exit(1);
});
