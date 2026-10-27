import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import dotenv from "dotenv";
import crypto from "node:crypto";
import { proposalTotals, selectedLineItems } from "./src/data/cmsData";
import { syncProposalToZoho, zohoConfigured } from "./zohoInvoice";
import { mountMcp } from "./mcp/index";
import { generateV2Briefs, GenerationError, BRIEF_WRITING_RULES } from "./server/briefGeneration";
import { loadBrandContext, compactAnalytics, brandBlock, HONESTY_RULES, ContextError, sanitizeInsights } from "./server/aiContext";
import { knowledgePackPrompt } from "./src/lib/knowledgePack";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Origins allowed to call this API. Firebase Hosting serves the frontend on a
// different origin than this server, so CORS must be explicit. The production
// web origins are always allowed; ALLOWED_ORIGINS adds any extras (local dev,
// preview channels) on top.
const DEFAULT_ALLOWED_ORIGINS = [
  "https://noksocial.com",
  "https://www.noksocial.com",
  "https://nok-os.web.app",
  "https://nok-os.firebaseapp.com",
  "http://localhost:5173",
  "http://localhost:3000",
];
const allowedOrigins = Array.from(
  new Set([
    ...DEFAULT_ALLOWED_ORIGINS,
    ...(process.env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean),
  ]),
);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
}));

// Keep the raw body too: the Paystack webhook signature is an HMAC of the exact bytes.
app.use(express.json({
  limit: "50mb",
  verify: (req, _res, buf) => {
    (req as any).rawBody = buf;
  },
}));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini client on the server
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Initialize Firebase Admin (service account credentials) so this server can
// verify staff ID tokens and validate calendar-review share tokens with trusted access.
// When the service-account env vars are absent (common for local frontend-only
// dev), skip cert init so the Vite dev middleware can still boot and serve the
// SPA — the Admin-backed API routes below will 500 until real creds are set.
const hasAdminCreds =
  !!process.env.FIREBASE_PROJECT_ID &&
  !!process.env.FIREBASE_CLIENT_EMAIL &&
  !!process.env.FIREBASE_PRIVATE_KEY;

if (hasAdminCreds) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    }),
  });
} else {
  console.warn(
    "[server] Firebase Admin service-account env vars not set — starting without " +
      "Admin SDK. Frontend/dev server works; Admin-backed API routes will fail until " +
      "FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY are provided."
  );
  initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || "nok-os-prod" });
}
const adminDb = getFirestore();
const adminAuth = getAuth();

// Gate: only signed-in staff (real Firebase email/password accounts) may call
// the Gemini-backed endpoints below, so a stranger can't burn the API quota.
async function requireStaffAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization || "";
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) {
    return res.status(401).json({ error: "Missing Authorization header." });
  }
  try {
    const decoded = await adminAuth.verifyIdToken(match[1]);
    if (decoded.firebase?.sign_in_provider !== "password") {
      return res.status(403).json({ error: "Not authorized." });
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session." });
  }
}

// Helper function to handle generation with model fallbacks to survive 503 service unavailable spikes
async function generateContentWithFallback(contents: string, config: any) {
  const models = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
  let lastError = null;
  for (const model of models) {
    try {
      console.log(`[AI fallback] Attempting content generation using model: ${model}`);
      const response = await ai.models.generateContent({
        model,
        contents,
        config,
      });
      console.log(`[AI fallback] Successfully generated content using model: ${model}`);
      return response;
    } catch (error: any) {
      console.warn(`[AI fallback] Generation failed with ${model}, trying next... Error:`, error.message || error);
      lastError = error;
    }
  }
  throw lastError || new Error("All models failed to generate content.");
}

// API endpoint to generate strategic insights. "data" mode works from the
// analytics summary computed in code (the same one the Claude connector uses);
// "guides" mode gives qualitative ideas from the brand guide with no numbers.
app.post("/api/generate-insights", requireStaffAuth, async (req, res) => {
  try {
    const { brandId, rows, count = 5, sourceType = "data" } = req.body || {};
    const n = Math.min(Math.max(Number(count) || 5, 1), 10);
    const fromData = sourceType !== "guides";
    const { brand, summary, knowledge } = await loadBrandContext(adminDb, brandId, fromData ? rows : undefined);
    if (fromData && !summary) {
      return res.status(400).json({ error: "No analytics have been imported for this brand yet." });
    }

    const prompt = `You are a senior marketing strategist reviewing a brand's social media performance.

${brandBlock(brand, knowledge)}

${fromData ? `ANALYTICS SUMMARY (computed from imported data; the only numbers you may cite)
${compactAnalytics(summary)}` : "There is no analytics data for this request. Work only from the brand context."}
${HONESTY_RULES}

Write up to ${n} strategic insights. Return fewer if the ${fromData ? "data" : "brand context"} only supports fewer;
never pad the list. Each insight:
- "title": short and action-oriented.
- "desc": the finding and one concrete action.
- "standpoint": ${fromData
      ? `"analytics" when the finding is backed by numbers in the summary; otherwise "pattern", "observation", "lesson" or "opportunity".`
      : `"opportunity" or "observation" (never "analytics": there is no data).`}
- "metric": the KPI it concerns (e.g. "Engagement rate").
- "change": ${fromData
      ? `the difference actually shown in the summary (e.g. "+4.0 pts vs previous period", "9.6% vs 5.1%"), or "insufficient data". Never a target or forecast.`
      : `exactly "insufficient data".`}
- "type": "positive", "warning" or "neutral".
- "evidence": ${fromData
      ? `the exact figures from the summary that support it (with platform/format/period), e.g. "Carousels: 9.63% ER on 9 posts vs images 5.07% on 16 posts, Sep 2026".`
      : `"No analytics data: based on the brand guide only."`}
- "confidence": "high", "medium" or "low". High only for a clear pattern across enough posts; ${fromData ? "low when dataNotes flag weak data" : `always "low" here`}.
- "confidenceReason": one short sentence explaining the confidence level.`;

    const response = await generateContentWithFallback(prompt, {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            desc: { type: Type.STRING },
            standpoint: { type: Type.STRING, enum: ["analytics", "observation", "opportunity", "pattern", "lesson"] },
            metric: { type: Type.STRING },
            change: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["positive", "warning", "neutral"] },
            evidence: { type: Type.STRING },
            confidence: { type: Type.STRING, enum: ["high", "medium", "low"] },
            confidenceReason: { type: Type.STRING },
          },
          required: ["title", "desc", "standpoint", "metric", "change", "type", "evidence", "confidence", "confidenceReason"],
        },
      },
    });

    const raw = JSON.parse(response.text || "[]");
    const insights = sanitizeInsights(raw, fromData, n, summary?.scope.posts ?? 0);
    res.json(insights);
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    if (error instanceof ContextError) return res.status(400).json({ error: error.message });
    res.status(500).json({ error: "Failed to generate insights." });
  }
});

// API endpoint to generate brand content direction pillars from approved insights
app.post("/api/generate-directions", requireStaffAuth, async (req, res) => {
  try {
    const { tagline, voiceTone, brandGuide, approvedInsights, count = 5 } = req.body;

    const guidePrompt = brandGuide && (brandGuide.contentPillars || brandGuide.audiencePersonas || brandGuide.competitorContext || brandGuide.platformNotes) ? `
Brand Guide Guidelines to obey:
- Content Pillars: ${brandGuide.contentPillars || "Not specified"}
- Target Audience Personas: ${brandGuide.audiencePersonas || "Not specified"}
- Competitor Context: ${brandGuide.competitorContext || "Not specified"}
- Platform Notes: ${brandGuide.platformNotes || "Not specified"}

Please construct your content directions to directly enforce and align with these guidelines.
` : "";

    const dataPrompt = `You are a visionary brand architect and creative director. Use the brand tagline "${tagline || ""}" and voice tone "${voiceTone || ""}" along with these strategic insights:
${guidePrompt}
${JSON.stringify(approvedInsights, null, 2)}

Synthesize up to ${count} brand positioning content pillars/directions that translate these insights into actionable content themes.
Return fewer if the insights only support fewer. Build only on the insights and guidelines above.
${HONESTY_RULES}

For each brand direction, provide:
1. "pillar": A bold, inspiring name for this content theme (e.g. "Authority-Led Case Studies").
2. "strategy": A detailed content marketing strategy explaining why and how to construct campaigns under this pillar.
3. "focus": Channel or format focus areas (e.g., "LinkedIn deep-dive articles, partner newsletters").
4. "checklist": An array of exactly 3 or 4 actionable checklist items for creators executing campaigns under this direction.`;

    const response = await generateContentWithFallback(dataPrompt, {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            pillar: { type: Type.STRING },
            strategy: { type: Type.STRING },
            focus: { type: Type.STRING },
            checklist: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["pillar", "strategy", "focus", "checklist"]
        }
      }
    });

    const text = response.text || "[]";
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Gemini Directions Generation Error:", error);
    res.status(500).send(error.message || "Failed to generate directions.");
  }
});

// API endpoint to generate v2 creative briefs (finished assets) from approved
// brand directions. The server reads the brand guide and analytics itself.
app.post("/api/generate-briefs", requireStaffAuth, async (req, res) => {
  try {
    const { brandId, approvedDirections, count = 3 } = req.body || {};
    if (typeof brandId !== "string" || !brandId) {
      return res.status(400).json({ error: "brandId is required." });
    }
    const directions = Array.isArray(approvedDirections)
      ? approvedDirections.slice(0, 10).map((d: any) => ({
          pillar: d?.pillar, strategy: d?.strategy, focus: d?.focus,
          checklist: Array.isArray(d?.checklist) ? d.checklist.slice(0, 8) : undefined,
        }))
      : [];
    const result = await generateV2Briefs({ db: adminDb, generate: generateContentWithFallback, brandId, directions, count });
    if (result.briefs.length === 0) {
      return res.status(502).json({ error: "No valid briefs were generated.", failed: result.failed });
    }
    res.json(result);
  } catch (error: any) {
    console.error("Gemini Briefs Generation Error:", error);
    const message = error instanceof GenerationError ? error.message : "Failed to generate briefs.";
    res.status(500).json({ error: message });
  }
});

// API endpoint to suggest brand guide fields. Uses the brand record (with the
// description/objective currently being edited) and the computed analytics.
app.post("/api/suggest-brand-guide", requireStaffAuth, async (req, res) => {
  try {
    const { brandId, brandDescription, campaignObjective } = req.body || {};
    const { brand, summary, knowledge } = await loadBrandContext(adminDb, brandId);
    const working = {
      ...brand,
      ...(typeof brandDescription === "string" ? { brandDescription } : {}),
      ...(typeof campaignObjective === "string" ? { campaignObjective } : {}),
    };

    const prompt = `You are a senior marketing strategist helping fill in a brand guide.

${brandBlock(working, knowledge)}

ANALYTICS SUMMARY (computed from imported data; the only numbers you may cite)
${compactAnalytics(summary)}
${HONESTY_RULES}

Suggest these four brand guide fields as plain text a strategist can edit:
1. contentPillars: 3-5 pillars the brand should post about, each with what it covers and why it serves the objective.
   Where the analytics show what performs, say so with the exact figures; otherwise base them on the brand context.
2. audiencePersonas: 2-3 personas written as HYPOTHESES to validate (who, needs, objections, where they spend time).
   Label anything not supported by the brand context as an assumption.
3. competitorContext: how the brand can differentiate. Do NOT name specific competitors or state facts about them
   unless they appear in the brand context; instead list what to research ("check how competitors price X").
4. platformNotes: per-platform guidance. Cite the analytics by platform where they exist; otherwise say
   "no data yet for <platform>" and give general guidance.`;

    const response = await generateContentWithFallback(prompt, {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          contentPillars: { type: Type.STRING },
          audiencePersonas: { type: Type.STRING },
          competitorContext: { type: Type.STRING },
          platformNotes: { type: Type.STRING }
        },
        required: ["contentPillars", "audiencePersonas", "competitorContext", "platformNotes"]
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Error generating brand guide suggestions:", error);
    if (error instanceof ContextError) return res.status(400).json({ error: error.message });
    res.status(500).json({ error: "Failed to generate suggestions." });
  }
});

// API endpoint to generate creative sandbox ideas (dump/sandbox of copy drafts, concepts, hashtags)
app.post("/api/generate-sandbox-ideas", requireStaffAuth, async (req, res) => {
  try {
    const { brandContext, topic } = req.body;

    if (!topic) {
      return res.status(400).send("Topic is required.");
    }

    const brandName = brandContext?.name || "Active Brand";
    const tagline = brandContext?.tagline || "";
    const voiceTone = brandContext?.voiceTone || "Professional, Objective";
    const description = brandContext?.brandDescription || "A scaling modern business";
    const pillars = brandContext?.contentPillars || "Not specified yet";
    const audience = brandContext?.audiencePersonas || "Not specified yet";

    const prompt = `You are an elite creative copywriter and content strategist.
Active Brand: "${brandName}"
Tagline: "${tagline}"
Voice & Tone: "${voiceTone}"
Brand Description: "${description}"
Content Pillars: "${pillars}"
Target Audience: "${audience}"

Your task is to generate exactly 3 creative ideas or copy snippets related to the user's requested topic: "${topic}".
Each of the 3 items should fall into one of these distinct categories:
1. "caption" - A social media caption draft (e.g. LinkedIn, Twitter, Instagram copy with hooks).
2. "concept" - A strategic creative visual layout concept, scene brief, or storyboard idea.
3. "hashtag" - A highly targeted, hand-curated hashtag block or category combination.

Ensure the copy drafts and concepts are extremely specific, of the highest visual/copy standard, aligned perfectly with the brand's voice and tone.
${HONESTY_RULES}
If copy needs a fact you don't have (a result, price, date or quote), write a bracketed placeholder like "[confirm figure]".

Return a JSON object with this exact schema:
{
  "ideas": [
    {
      "title": "Concise headline describing this sandbox element",
      "category": "caption" | "concept" | "hashtag",
      "content": "The actual text body (exact copy with quotes for captions; detailed description for concept; space-separated hashtags for hashtag category)",
      "tags": ["ShortTag1", "ShortTag2"]
    }
  ]
}
Make sure all JSON keys are correct, and return exactly 3 ideas.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ideas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  category: { type: Type.STRING },
                  content: { type: Type.STRING },
                  tags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["title", "category", "content", "tags"]
              }
            }
          },
          required: ["ideas"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Error generating sandbox ideas:", error);
    res.status(500).send(error.message || "Failed to generate sandbox ideas.");
  }
});

// API endpoint for conversational AI Chatbot with Brand and Performance Context
app.post("/api/chat", requireStaffAuth, async (req, res) => {
  try {
    const { messages, brandContext, performanceContext, brandId, includeAnalytics } = req.body;

    // Analytics computed in code, so the chat can cite real numbers.
    let analyticsBlock = "";
    if (typeof brandId === "string") {
      try {
        const { summary, knowledge } = await loadBrandContext(adminDb, brandId);
        analyticsBlock = `\n${knowledgePackPrompt(knowledge)}\n`;
        if (includeAnalytics) {
          analyticsBlock += `\nANALYTICS SUMMARY (computed from imported data; the only numbers you may cite)\n${compactAnalytics(summary)}\n`;
        }
      } catch {
        analyticsBlock = "";
      }
    }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).send("Messages array is required.");
    }

    const tagline = brandContext?.tagline || "";
    const voiceTone = brandContext?.voiceTone || "Professional, Objective";
    const brandName = brandContext?.name || "Active Client Brand";
    const description = brandContext?.brandDescription || "A scaling modern business";
    const objectives = brandContext?.campaignObjective || "General Brand Growth";
    const pillars = brandContext?.contentPillars || "Not specified yet";
    const targetPersonas = brandContext?.audiencePersonas || "Not specified yet";
    const competitors = brandContext?.competitorContext || "Not specified yet";
    const platformNotes = brandContext?.platformNotes || "Not specified yet";

    const systemPrompt = `You are a world-class CMO (Chief Marketing Officer) and Creative Director for the active brand.
Your name is "N.O.K AI Partner".
You have deep expertise in content strategy, campaign orchestration, copywriting, and analytics auditing.

Your personality is highly collaborative, strategic, articulate, and sharp. Avoid corporate fluff; focus on high-impact, actionable brand actions.

Active Brand Profile:
- Name: "${brandName}"
- Tagline: "${tagline}"
- Voice & Tone: "${voiceTone}"
- Description: "${description}"
- Campaign Objectives: "${objectives}"
- Content Pillars: "${pillars}"
- Target Audience Personas: "${targetPersonas}"
- Competitor Context: "${competitors}"
- Platform Distribution Notes: "${platformNotes}"

Active Strategic Insights & Performance Context:
${JSON.stringify(performanceContext || [], null, 2)}

${analyticsBlock}
${HONESTY_RULES}

You are talking to the workspace manager. You can help them:
1. Brainstorm creative ideas, content pillars, or slide outlines.
2. Refine existing campaign copy (LinkedIn posts, carousels, videos).
3. Draft Creative Briefs. When the user asks you to write, draft or generate a creative brief, write it out
readably, then add one structured JSON block at the very end of your response enclosed in \`\`\`json_brief ... \`\`\`
markers, so the user can save it with one click. The JSON has exactly these keys:
{ "title", "pillar", "personas": [string], "platforms": [string], "keyMessage", "rationale",
  "assets": [ { "type": "carousel"|"reel"|"video"|"blog"|"static"|"text", "title", "platforms": [string], "spec", "slot"?, "cta",
               "captions": [ { "platform", "text", "hashtags": [string], "firstComment"? } ],
               carousel: "slides": [ { "n", "background", "headline", "body", "visualNote" } ]
               reel/video: "coverText", "durationSec", "audioNote"?, "scenes": [ { "start", "end", "visual", "onScreenText", "voiceover" } ]
               blog: "slug", "metaDescription", "body" (markdown)
               static: "headline", "body", "visualNote"
               text: "body" } ],
  "productionNotes": [string], "unconfirmed": [ { "field", "note" } ], "successMeasures": [ { "metric", "target", "source" } ] }
Keep the JSON valid.
${BRIEF_WRITING_RULES}`;

    // Convert messages to Gemini format (role must be 'user' or 'model')
    const formattedMessages = messages.map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: Array.isArray(msg.parts) ? msg.parts : [{ text: msg.text || msg.content }]
    }));

    const response = await generateContentWithFallback(
      formattedMessages[formattedMessages.length - 1]?.parts?.[0]?.text || "Hello",
      {
        systemInstruction: systemPrompt,
        contents: formattedMessages.slice(0, -1)
      }
    );

    res.json({
      text: response.text || "I was unable to process your request.",
      role: "model"
    });
  } catch (error: any) {
    console.error("Error in AI Chat API:", error);
    res.status(500).json({ error: error.message || "Failed to generate chat response." });
  }
});

// API endpoint to scrape and parse full Substack, Blogger, or medium blog posts into clean Markdown
app.post("/api/import-blog-post", requireStaffAuth, async (req, res) => {
  try {
    const { url, rawText } = req.body;

    if (!url && !rawText) {
      return res.status(400).send("Please provide a URL or article text to import.");
    }

    let scrapedHtml = "";
    let sourceUrl = url || "";

    if (url) {
      try {
        console.log(`[Blog Import] Fetching article from URL: ${url}`);
        const response = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
          }
        });
        if (response.ok) {
          scrapedHtml = await response.text();
          if (scrapedHtml.length > 80000) {
            scrapedHtml = scrapedHtml.slice(0, 80000);
          }
        }
      } catch (fetchErr) {
        console.warn("[Blog Import] Server fetch failed, falling back to prompt parsing", fetchErr);
      }
    }

    const contentToParse = scrapedHtml || rawText || url;

    const prompt = `You are an expert digital publisher and article migration specialist.
Analyze the following article source (HTML or text) from Substack, Blogger, or a web post (${sourceUrl || "Pasted text"}):

${contentToParse.slice(0, 50000)}

Your goal is to extract the ENTIRE full article and convert it into rich, beautifully structured Markdown format.

Instructions:
1. "title": Extract the exact article title.
2. "category": Identify the post category or platform (e.g. "Substack Series", "Blogger Archive", "Growth Strategy").
3. "readTime": Return an empty string (reading time is calculated from the text).
4. "coverImage": The main header/featured image URL if it is present in the HTML/meta tags. If there is none, return an empty string. Never make up an image URL.
5. "authorName": Author name (default to "Osei Kofi" if not specified).
6. "authorRole": Author role (default to "Lead Strategist, N.O.K Social").
7. "excerpt": A compelling 1-2 sentence summary hook (150-200 characters).
8. "contentMarkdown": The COMPLETE article body text, formatted cleanly in Markdown. Include all section headings (## Heading), subheadings (### Subheading), key callout boxes (> Callout quote), bulleted lists (- Item), bold text (**bold**), and any image URLs (![Alt](url)) present in the article. DO NOT summarize or truncate the article body — extract all paragraphs from beginning to end.

Return JSON in this exact structure:
{
  "title": "Article Title",
  "category": "Substack Series",
  "readTime": "5 min read",
  "coverImage": "https://...",
  "authorName": "Osei Kofi",
  "authorRole": "Lead Strategist, N.O.K Social",
  "excerpt": "Compelling summary...",
  "contentMarkdown": "## Section Title\\n\\nFull paragraph text..."
}`;

    const aiResponse = await generateContentWithFallback(prompt, {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          category: { type: Type.STRING },
          readTime: { type: Type.STRING },
          coverImage: { type: Type.STRING },
          authorName: { type: Type.STRING },
          authorRole: { type: Type.STRING },
          excerpt: { type: Type.STRING },
          contentMarkdown: { type: Type.STRING }
        },
        required: ["title", "category", "readTime", "coverImage", "authorName", "authorRole", "excerpt", "contentMarkdown"]
      }
    });

    const parsed = JSON.parse(aiResponse.text || "{}");
    // Reading time from the actual word count (~200 words a minute), not a guess.
    const words = String(parsed.contentMarkdown || "").split(/\s+/).filter(Boolean).length;
    parsed.readTime = `${Math.max(1, Math.round(words / 200))} min read`;
    // Keep only a real http(s) cover URL that came from the source.
    if (typeof parsed.coverImage !== "string" || !/^https?:\/\//.test(parsed.coverImage)
        || (scrapedHtml && !scrapedHtml.replace(/&amp;/g, "&").includes(parsed.coverImage.replace(/&amp;/g, "&")))) {
      parsed.coverImage = "";
    }
    res.json(parsed);
  } catch (error: any) {
    console.error("Error importing blog post:", error);
    res.status(500).send(error.message || "Failed to import article.");
  }
});

// ==========================================
// CALENDAR REVIEW TOKEN EXCHANGE
// ==========================================
// The public client-approval page (/review/:token) needs to read and update
// briefs for one brand without being a logged-in staff member. Rather than
// opening Firestore rules to unauthenticated queries (which can't be safely
// scoped to "the caller who actually holds this token"), the raw share token
// is validated here with trusted Admin SDK access, and exchanged for a
// short-lived Firebase custom auth token carrying the resolved brandId /
// shareLinkId as custom claims. The client then signs in with that token, and
// Firestore rules grant it read/update access scoped to exactly that brand
// and that link (see firestore.rules).
app.post("/api/calendar-review/exchange", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== "string") {
      return res.status(400).json({ error: "missing_token" });
    }

    const snap = await adminDb
      .collection("calendarShareLinks")
      .where("token", "==", token)
      .limit(1)
      .get();

    if (snap.empty) {
      return res.status(404).json({ error: "not_found" });
    }

    const linkDoc = snap.docs[0];
    const linkData = linkDoc.data();

    if (linkData.revoked) {
      return res.status(403).json({
        error: "revoked",
        shareLink: { id: linkDoc.id, ...linkData },
      });
    }

    const customToken = await adminAuth.createCustomToken(`client-${linkDoc.id}`, {
      shareLinkId: linkDoc.id,
      brandId: linkData.brandId,
    });

    res.json({
      customToken,
      shareLink: { id: linkDoc.id, ...linkData },
    });
  } catch (error: any) {
    console.error("Calendar review token exchange error:", error);
    res.status(500).json({ error: "Failed to validate review link." });
  }
});

// ── Client proposals ─────────────────────────────────────────────────────────
// Clients open /proposal/:token. The token is checked here with the Admin SDK
// and only the latest *sent* snapshot is returned, never the staff working
// copy. The proposals collection itself stays staff-only in firestore.rules.

const PROPOSAL_TOKEN_RE = /^[a-f0-9]{32}$/;
const MAX_CLIENT_COMMENTS = 200;
const MAX_COMMENT_LENGTH = 2000;

// Small in-memory limiter for the public proposal endpoints (one Render instance).
const proposalHits = new Map<string, { count: number; resetAt: number }>();
function proposalRateLimit(limit: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
    const key = `${req.path}|${ip}`;
    const now = Date.now();
    const entry = proposalHits.get(key);
    if (!entry || entry.resetAt < now) {
      proposalHits.set(key, { count: 1, resetAt: now + 60_000 });
    } else if (++entry.count > limit) {
      return res.status(429).json({ error: "too_many_requests" });
    }
    if (proposalHits.size > 10_000) {
      for (const [k, v] of proposalHits) if (v.resetAt < now) proposalHits.delete(k);
    }
    next();
  };
}

async function findSentProposal(token: unknown) {
  if (typeof token !== "string" || !PROPOSAL_TOKEN_RE.test(token)) return null;
  const snap = await adminDb.collection("proposals").where("token", "==", token).limit(1).get();
  if (snap.empty) return null;
  const ref = snap.docs[0].ref;
  const data = snap.docs[0].data();
  if (!data.sentVersion) return null; // drafts are never visible to clients
  return { ref, data };
}

const publicComment = (id: string, c: FirebaseFirestore.DocumentData) => ({
  id,
  author: c.author,
  name: c.name,
  message: c.message,
  section: c.section || null,
  kind: c.kind,
  version: c.version,
  createdAt: c.createdAt,
});

app.post("/api/proposals/view", proposalRateLimit(60), async (req, res) => {
  try {
    const found = await findSentProposal(req.body?.token);
    if (!found) return res.status(404).json({ error: "not_found" });
    const { ref, data } = found;

    const [versionSnap, commentsSnap] = await Promise.all([
      ref.collection("versions").doc(String(data.sentVersion)).get(),
      ref.collection("comments").orderBy("createdAt", "asc").limit(500).get(),
    ]);
    if (!versionSnap.exists) return res.status(404).json({ error: "not_found" });

    await ref.update({ lastViewedAt: new Date().toISOString() });

    res.json({
      proposal: versionSnap.data(),
      status: data.status,
      payment: {
        acceptedVersion: data.acceptedVersion || null,
        acceptedTotal: data.acceptedTotal || 0,
        acceptedItemIds: data.acceptedItemIds || null,
        amountPaid: data.amountPaid || 0,
        paymentStatus: data.paymentStatus || null,
        balanceRequested: !!data.balanceRequested,
      },
      paymentsEnabled: !!PAYSTACK_SECRET_KEY,
      comments: commentsSnap.docs.map((d) => publicComment(d.id, d.data())),
    });
  } catch (error: any) {
    console.error("Proposal view error:", error);
    res.status(500).json({ error: "Failed to load proposal." });
  }
});

app.post("/api/proposals/comment", proposalRateLimit(10), async (req, res) => {
  try {
    const found = await findSentProposal(req.body?.token);
    if (!found) return res.status(404).json({ error: "not_found" });
    const { ref, data } = found;

    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    const section = typeof req.body?.section === "string" ? req.body.section.trim().slice(0, 120) : "";
    const requestChanges = req.body?.requestChanges === true;

    if (!message || message.length > MAX_COMMENT_LENGTH) {
      return res.status(400).json({ error: "invalid_message" });
    }
    if (data.status === "declined" || (requestChanges && data.status === "accepted")) {
      return res.status(409).json({ error: "proposal_closed" });
    }
    if ((data.clientCommentCount || 0) >= MAX_CLIENT_COMMENTS) {
      return res.status(429).json({ error: "comment_limit" });
    }

    const now = new Date().toISOString();
    const comment = {
      author: "client",
      name: data.clientName || "Client",
      message,
      ...(section ? { section } : {}),
      kind: requestChanges ? "change_request" : "comment",
      version: data.sentVersion,
      createdAt: now,
    };
    const commentRef = ref.collection("comments").doc(`c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    const nextStatus = requestChanges && data.status === "sent" ? "changes_requested" : data.status;

    const batch = adminDb.batch();
    batch.set(commentRef, comment);
    batch.update(ref, {
      lastClientCommentAt: now,
      clientCommentCount: FieldValue.increment(1),
      status: nextStatus,
    });
    await batch.commit();

    res.json({ comment: publicComment(commentRef.id, comment), status: nextStatus });
  } catch (error: any) {
    console.error("Proposal comment error:", error);
    res.status(500).json({ error: "Failed to save comment." });
  }
});

// ── Paystack payments ───────────────────────────────────────────────────────
// The client ticks the line items they want and pays the deposit on those;
// that payment confirms the order. Amounts are always computed here from the
// sent version snapshot; the browser only says which items it chose.
// A payment only counts once Paystack confirms it: via the signed webhook, or
// when the client returns to the page (both re-verify with Paystack and record
// idempotently, so it doesn't matter which arrives first).

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";
const SITE_ORIGIN = "https://noksocial.com";
const PAYSTACK_REFERENCE_RE = /^[A-Za-z0-9.=-]{1,100}$/;
// Overridable only so tests can point at a local stub.
const PAYSTACK_API_BASE = process.env.PAYSTACK_API_BASE || "https://api.paystack.co";

async function paystack(path: string, init?: { method?: string; body?: unknown }) {
  const resp = await fetch(`${PAYSTACK_API_BASE}${path}`, {
    method: init?.method || "GET",
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
    ...(init?.body ? { body: JSON.stringify(init.body) } : {}),
  });
  const body: any = await resp.json().catch(() => ({}));
  if (!resp.ok || !body.status) {
    throw new Error(`Paystack ${path} failed: ${resp.status} ${body.message || ""}`);
  }
  return body.data;
}

const toPesewas = (ghs: number) => Math.round(ghs * 100);
const roundGhs = (n: number) => Math.round(n * 100) / 100;

const MAX_LINE_ITEMS = 200;

// What the client can pay next, or why they can't. For a deposit, itemIds is
// the client's choice of line items (anything else means all of them).
async function amountDue(
  ref: FirebaseFirestore.DocumentReference,
  data: FirebaseFirestore.DocumentData,
  kind: "deposit" | "balance",
  itemIds?: unknown,
): Promise<{ amount: number; version: number; itemIds?: string[] } | { error: string }> {
  if (kind === "deposit") {
    if (data.status !== "sent" && data.status !== "changes_requested") return { error: "not_payable" };
    const snap = (await ref.collection("versions").doc(String(data.sentVersion)).get()).data();
    if (!snap) return { error: "not_payable" };
    if (snap.validUntil && snap.validUntil < new Date().toISOString().slice(0, 10)) return { error: "expired" };
    const chosen = Array.isArray(itemIds)
      ? itemIds.filter((id): id is string => typeof id === "string").slice(0, MAX_LINE_ITEMS)
      : null;
    const items = selectedLineItems(snap.lineItems || [], chosen).map((li: any) => li.id as string);
    if (items.length === 0) return { error: "no_items" };
    const { deposit } = proposalTotals(snap as any, items);
    if (deposit <= 0) return { error: "not_payable" };
    return { amount: deposit, version: data.sentVersion, itemIds: items };
  }
  if (data.status !== "accepted" || !data.balanceRequested) return { error: "not_payable" };
  const remaining = roundGhs((data.acceptedTotal || 0) - (data.amountPaid || 0));
  if (remaining <= 0) return { error: "nothing_due" };
  return { amount: remaining, version: data.acceptedVersion };
}

type RecordResult = "recorded" | "already_recorded" | "not_successful" | "unknown_payment";

async function recordPaystackPayment(reference: string): Promise<RecordResult> {
  if (!PAYSTACK_REFERENCE_RE.test(reference)) return "unknown_payment";
  const tx = await paystack(`/transaction/verify/${encodeURIComponent(reference)}`);
  if (tx.status !== "success") return "not_successful";
  const proposalId = tx.metadata?.proposalId;
  if (typeof proposalId !== "string" || !proposalId) return "unknown_payment";

  const proposalRef = adminDb.collection("proposals").doc(proposalId);
  const paymentRef = proposalRef.collection("payments").doc(reference);

  return adminDb.runTransaction(async (t): Promise<RecordResult> => {
    const [paySnap, propSnap] = await Promise.all([t.get(paymentRef), t.get(proposalRef)]);
    if (!paySnap.exists || !propSnap.exists) return "unknown_payment";
    const pay = paySnap.data()!;
    const prop = propSnap.data()!;
    if (pay.status === "success") return "already_recorded";
    if (tx.amount !== toPesewas(pay.amount) || tx.currency !== "GHS") {
      console.error(`[paystack] amount mismatch for ${reference}: paid ${tx.amount} ${tx.currency}, expected ${toPesewas(pay.amount)} GHS`);
      return "unknown_payment";
    }

    // All transaction reads must happen before any writes.
    const isFirstDeposit = pay.kind === "deposit" && prop.status !== "accepted";
    const versionSnap = isFirstDeposit ? await t.get(proposalRef.collection("versions").doc(String(pay.version))) : null;
    const leadRef = isFirstDeposit && prop.requestId ? adminDb.collection("discoveryRequests").doc(prop.requestId) : null;
    const leadSnap = leadRef ? await t.get(leadRef) : null;

    const now = new Date().toISOString();
    const amountPaid = roundGhs((prop.amountPaid || 0) + pay.amount);
    // Deposits from before item selection have no itemIds: they ordered everything.
    const acceptedItemIds: string[] | null = isFirstDeposit && versionSnap?.exists
      ? selectedLineItems((versionSnap.data() as any).lineItems || [], pay.itemIds).map((li: any) => li.id)
      : null;
    const acceptedTotal = isFirstDeposit && versionSnap?.exists
      ? proposalTotals(versionSnap.data() as any, acceptedItemIds).total
      : prop.acceptedTotal || 0;
    const paidInFull = acceptedTotal > 0 && amountPaid >= acceptedTotal - 0.005;

    t.update(paymentRef, {
      status: "success",
      paidAt: tx.paid_at || now,
      channel: tx.channel || null,
      paystackId: tx.id || null,
      // A second deposit (e.g. paid in two tabs) is kept on record for a refund.
      ...(pay.kind === "deposit" && !isFirstDeposit ? { duplicate: true } : {}),
    });
    t.update(proposalRef, {
      amountPaid,
      paymentStatus: paidInFull ? "paid_in_full" : "deposit_paid",
      ...(paidInFull ? { balanceRequested: false } : {}),
      ...(isFirstDeposit
        ? { status: "accepted", acceptedAt: now, acceptedVersion: pay.version, acceptedTotal, acceptedItemIds }
        : {}),
      updatedAt: now,
    });
    if (leadRef && leadSnap?.exists) t.update(leadRef, { status: "Converted" });
    return "recorded";
  });
}

// Zoho sync runs after the response so a slow or failing Zoho never delays the
// client's payment confirmation. Failures are saved on the proposal and can be
// retried from the CMS.
function queueZohoSync(reference: string) {
  const proposalId = reference.match(/^nok-(.+)-(?:deposit|balance)-\d+$/)?.[1];
  if (!proposalId || !zohoConfigured()) return;
  syncProposalToZoho(adminDb, proposalId).then((r) => console.log(`[zoho] ${proposalId}: ${r}`));
}

app.post("/api/zoho/sync-proposal", requireStaffAuth, async (req, res) => {
  const proposalId = req.body?.proposalId;
  if (typeof proposalId !== "string" || !proposalId) return res.status(400).json({ error: "missing_proposal" });
  const result = await syncProposalToZoho(adminDb, proposalId);
  const data = (await adminDb.collection("proposals").doc(proposalId).get()).data();
  res.status(result === "error" ? 502 : 200).json({ result, error: data?.zohoSyncError || null });
});

app.post("/api/proposals/pay", proposalRateLimit(10), async (req, res) => {
  try {
    if (!PAYSTACK_SECRET_KEY) return res.status(503).json({ error: "payments_unavailable" });
    const found = await findSentProposal(req.body?.token);
    if (!found) return res.status(404).json({ error: "not_found" });
    const { ref, data } = found;
    const kind = req.body?.kind === "balance" ? "balance" : "deposit";

    const due = await amountDue(ref, data, kind, req.body?.itemIds);
    if ("error" in due) return res.status(409).json({ error: due.error });
    if (!data.clientEmail) return res.status(409).json({ error: "missing_email" });

    const origin = typeof req.headers.origin === "string" && allowedOrigins.includes(req.headers.origin)
      ? req.headers.origin
      : SITE_ORIGIN;
    const reference = `nok-${ref.id}-${kind}-${Date.now()}`;

    await ref.collection("payments").doc(reference).set({
      reference,
      kind,
      amount: due.amount,
      currency: "GHS",
      version: due.version,
      ...(due.itemIds ? { itemIds: due.itemIds } : {}),
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    const tx = await paystack("/transaction/initialize", {
      method: "POST",
      body: {
        email: data.clientEmail,
        amount: toPesewas(due.amount),
        currency: "GHS",
        reference,
        callback_url: `${origin}/proposal/${req.body.token}`,
        metadata: {
          proposalId: ref.id,
          kind,
          version: due.version,
          custom_fields: [
            { display_name: "Proposal", variable_name: "proposal", value: data.title || ref.id },
            { display_name: "Payment", variable_name: "payment", value: kind === "deposit" ? "Deposit" : "Balance" },
          ],
        },
      },
    });

    res.json({ authorizationUrl: tx.authorization_url, reference });
  } catch (error: any) {
    console.error("Proposal pay error:", error);
    res.status(500).json({ error: "Failed to start payment." });
  }
});

// Called by the proposal page when Paystack redirects the client back.
app.post("/api/proposals/verify-payment", proposalRateLimit(20), async (req, res) => {
  try {
    if (!PAYSTACK_SECRET_KEY) return res.status(503).json({ error: "payments_unavailable" });
    const found = await findSentProposal(req.body?.token);
    const reference = req.body?.reference;
    // Only references that belong to this proposal.
    if (!found || typeof reference !== "string" || !reference.startsWith(`nok-${found.ref.id}-`)) {
      return res.status(404).json({ error: "not_found" });
    }
    const result = await recordPaystackPayment(reference);
    if (result === "recorded") queueZohoSync(reference);
    res.json({ result });
  } catch (error: any) {
    console.error("Verify payment error:", error);
    res.status(500).json({ error: "Failed to verify payment." });
  }
});

// Paystack → server. Signed with HMAC-SHA512 of the raw body using the secret key.
app.post("/api/paystack/webhook", async (req, res) => {
  const raw: Buffer | undefined = (req as any).rawBody;
  const signature = req.headers["x-paystack-signature"];
  if (!PAYSTACK_SECRET_KEY || !raw || typeof signature !== "string") return res.sendStatus(400);

  const expected = crypto.createHmac("sha512", PAYSTACK_SECRET_KEY).update(raw).digest("hex");
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return res.sendStatus(401);
  }

  const reference = req.body?.data?.reference;
  if (req.body?.event === "charge.success" && typeof reference === "string" && reference.startsWith("nok-")) {
    try {
      const result = await recordPaystackPayment(reference);
      console.log(`[paystack] webhook ${reference}: ${result}`);
      if (result === "recorded") queueZohoSync(reference);
    } catch (error) {
      console.error("[paystack] webhook processing failed:", error);
      return res.sendStatus(500); // Paystack retries
    }
  }
  res.sendStatus(200);
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// Remote MCP endpoint for the Claude custom connector (see mcp/).
mountMcp(app, adminDb);

// Vite dev server (local full-stack dev only). In production this server is
// API-only — the static frontend is deployed separately to Firebase Hosting.
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
