// Seeds the local Firebase emulators with a staff login and sample data for
// testing (npm run dev:local runs this automatically). Refuses to run unless it
// is pointed at the emulators with a "demo-" project, so it can never write to
// production.
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { parseBriefContent, type CreativeBriefV2 } from "../src/lib/briefs";

const PROJECT = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || "";
if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST || !PROJECT.startsWith("demo-")) {
  console.error("[seed] Refusing to run: not pointed at the Firebase emulators with a demo- project.");
  process.exit(1);
}

initializeApp({ projectId: PROJECT });
const db = getFirestore();
const auth = getAuth();

const STAFF = { email: "staff@nok.test", password: "testpass123" };
const BRAND_ID = "test-brand";

async function main() {
  if ((await db.collection("brands").doc(BRAND_ID).get()).exists) {
    console.log("[seed] Sample data already present.");
    return;
  }

  await auth.createUser({ ...STAFF, displayName: "Test Staff" }).catch((e) => {
    if (e?.code !== "auth/email-already-exists") throw e;
  });

  await db.collection("brands").doc(BRAND_ID).set({
    name: "Test Brand",
    domain: "testbrand.example",
    industry: "Streetwear",
    primaryColor: "violet",
    logoText: "TB",
    voiceTone: "Warm, confident, plain-spoken. Short sentences. No hype words.",
    tagline: "Made to be worn",
    brandDescription: "A small streetwear label selling everyday pieces to students and young professionals.",
    campaignObjective: "Awareness",
    contentPillars: "Styling tips; Behind the seams; Community fits",
    audiencePersonas: "Students 18-24 on a budget; Young professionals who want one good outfit for work and weekend",
    competitorContext: "Fast-fashion marketplaces compete on price.",
    platformNotes: "Instagram carousels perform best; Facebook gets little engagement.",
  });

  // A v1 brief, exactly like the ones already in production.
  await db.collection("briefs").doc("sample-v1").set({
    brandId: BRAND_ID,
    title: "Three ways to style one overshirt",
    objective: "Drive saves on Instagram.",
    targetAudience: "Students on a budget",
    keyMessage: "One good piece, three looks.",
    deliverables: "1x Instagram carousel (7 slides)",
    status: "Proposed",
    date: new Date().toISOString().slice(0, 10),
    platform: "Instagram",
    postType: "Carousel",
    contentPillar: "Styling tips",
    topicIdea: "One overshirt, three outfits",
    contentOutline: "## Slide 1 — Hook\n**Copy:** > \"One shirt. Three looks.\"\n**Design:** Flat lay.",
    copywritingCaption: "Buy less, wear more. Which look is yours?",
    cta: "Save this for your next outfit",
    proofPoint: "PLACEHOLDER — needs real data before publishing",
    createdAt: new Date().toISOString(),
  });

  // A v2 brief, validated against the schema so the sample stays correct.
  const content = parseBriefContent({
    title: "Behind the seams: how one hoodie is made",
    pillar: "Behind the seams",
    personas: ["Students 18-24 on a budget"],
    platforms: ["Instagram", "TikTok"],
    keyMessage: "Every hoodie is cut and finished by hand in our studio.",
    rationale: "Carousels showing process got the most saves last month (see analytics). Process content also answers the 'why does it cost more' question.",
    assets: [
      {
        id: "a1", type: "carousel", title: "Hoodie making carousel", platforms: ["Instagram"], spec: "1080x1350, 5 slides", slot: "Tue 6pm",
        slides: [
          { n: 1, background: "Close-up of fabric roll", headline: "How one hoodie is made", body: "", visualNote: "Brand font, white text bottom-left" },
          { n: 2, background: "Pattern pieces on table", headline: "1. Cut", body: "Every piece is cut by hand from one pattern.", visualNote: "" },
          { n: 3, background: "Sewing machine detail", headline: "2. Sew", body: "Double-stitched seams so it lasts.", visualNote: "" },
          { n: 4, background: "Finished hoodie on hanger", headline: "3. Finish", body: "Checked twice before it ships.", visualNote: "" },
          { n: 5, background: "Brand colour", headline: "Made to be worn", body: "Shop the hoodie: link in bio", visualNote: "Logo centred" },
        ],
        captions: [{ platform: "Instagram", text: "Ever wondered what goes into one hoodie? Here's the whole process, start to finish.", hashtags: ["#behindtheseams", "#madetobeworn"] }],
        cta: "Shop the hoodie: link in bio",
      },
      {
        id: "a2", type: "reel", title: "Hoodie in 15 seconds", platforms: ["TikTok", "Instagram"], spec: "9:16, 15s",
        coverText: "One hoodie, start to finish", durationSec: 15, audioNote: "Trending low-key beat (check licence)",
        scenes: [
          { start: 0, end: 3, visual: "Scissors cutting fabric", onScreenText: "Cut", voiceover: "" },
          { start: 3, end: 9, visual: "Sewing machine, fast cuts", onScreenText: "Sew", voiceover: "" },
          { start: 9, end: 15, visual: "Model pulls hoodie on, smiles", onScreenText: "Made to be worn", voiceover: "" },
        ],
        captions: [
          { platform: "TikTok", text: "15 seconds, one hoodie.", hashtags: ["#smallbusiness"] },
          { platform: "Instagram", text: "From fabric roll to your wardrobe.", hashtags: [] },
        ],
        cta: "Follow for more behind the seams",
      },
    ],
    productionNotes: ["Shoot all clips in the studio on Monday morning light."],
    unconfirmed: [{ field: "assets[1].audioNote", note: "Confirm the track is licensed for business accounts." }],
    successMeasures: [{ metric: "Saves", target: ">= 40", source: "Instagram Insights, 7 days after posting" }],
  });
  const v2: Omit<CreativeBriefV2, "id"> = {
    ...content,
    schemaVersion: 2,
    brandId: BRAND_ID,
    status: "Proposed",
    date: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  };
  await db.collection("briefs").doc("sample-v2").set(v2);

  console.log(`[seed] Done. Log in with ${STAFF.email} / ${STAFF.password}`);
}

main().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
