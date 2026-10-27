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

// API endpoint to generate strategic insights from real uploaded data or from brand guide specifications
app.post("/api/generate-insights", requireStaffAuth, async (req, res) => {
  try {
    const { tagline, voiceTone, brandGuide, analyticsData, count = 5, sourceType = "data" } = req.body;

    let dataPrompt = "";

    if (sourceType === "guides") {
      const guideData = brandGuide || {};
      dataPrompt = `You are a world-class CMO and elite digital marketing strategist.
We need you to generate exactly ${count} highly valuable, custom strategic insights based solely on the brand's core guide coordinates.

Brand Coordinates:
- Tagline: "${tagline || ""}"
- Voice & Tone: "${voiceTone || ""}"
- Brand Description: "${guideData.brandDescription || "A modern scaling business"}"
- Campaign Objective: "${guideData.campaignObjective || "General Growth"}"
- Content Pillars: "${guideData.contentPillars || "Not specified yet"}"
- Target Audience Personas: "${guideData.audiencePersonas || "Not specified yet"}"
- Competitor Context: "${guideData.competitorContext || "Not specified yet"}"
- Platform Notes: "${guideData.platformNotes || "Not specified yet"}"

Since this brand does not have historical performance raw data yet, analyze these positioning guidelines, competitor gaps, target personas, and the active campaign objective, and deduce key strategic priorities, creative hooks, or channel plays as actionable insights.

For each insight, return:
1. "title": A concise, action-oriented title.
2. "desc": A detailed strategic description explaining the recommended tactic and how to implement it to achieve the active campaign objective.
3. "standpoint": A strategic explanation why this is critical based on the brand guide (e.g., "Aligned with our Lead Acquisition objective, we need a high-impact lead magnet to capture busy professional personas.").
4. "metric": A hypothetical target metric or key KPI to track progress (e.g., "Conversion Rate", "Audience Growth").
5. "change": A realistic growth target or benchmark expectation (e.g., "+20%", "+15%", "+500 leads").
6. "type": The insight category. It MUST be one of these exact values: "Audience", "Competitor", "Content", "Creative", "Platform", "SEO", "Conversion".`;
    } else {
      if (!analyticsData || !Array.isArray(analyticsData) || analyticsData.length === 0) {
        return res.status(400).send("No analytics data was provided. Please import some data first.");
      }

      const guidePrompt = brandGuide && (brandGuide.contentPillars || brandGuide.audiencePersonas || brandGuide.competitorContext || brandGuide.platformNotes) ? `
Brand Guide Guidelines to obey:
- Content Pillars: ${brandGuide.contentPillars || "Not specified"}
- Target Audience Personas: ${brandGuide.audiencePersonas || "Not specified"}
- Competitor Context: ${brandGuide.competitorContext || "Not specified"}
- Platform Notes: ${brandGuide.platformNotes || "Not specified"}

Please align all suggestions and insights with these guidelines.
` : "";

      dataPrompt = `You are an elite marketing strategist and data scientist. Analyze the following social media performance analytics data for a brand with the tagline "${tagline || ""}" and voice tone "${voiceTone || ""}".
${guidePrompt}

Analytics Data (real uploaded data rows):
${JSON.stringify(analyticsData.slice(0, 50), null, 2)}

Based on this real data, discover exactly ${count} highly valuable, custom strategic insights. Do not generate generic insights. They must directly reflect the metrics, trends, platforms, content formats, and engagement rates found in the provided data.

For each insight, return:
1. "title": A concise, action-oriented title.
2. "desc": A detailed strategic description explaining the finding and suggesting a concrete, high-impact action.
3. "standpoint": A technical standpoint/evidence summary from the data (e.g., "We observed a 7.2% engagement rate on LinkedIn text posts, surpassing other platform-type combinations by 35%.").
4. "metric": The primary key performance indicator (e.g., "CTR", "Engagement Rate", "Impressions").
5. "change": The percentage change or performance difference seen in the data (e.g., "+35.2%", "-14.0%", "+150k").
6. "type": The insight category. It MUST be one of these exact values: "Audience", "Competitor", "Content", "Creative", "Platform", "SEO", "Conversion".`;
    }

    const response = await generateContentWithFallback(dataPrompt, {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Action-oriented title of the insight." },
            desc: { type: Type.STRING, description: "Detailed strategy description explaining the finding and action." },
            standpoint: { type: Type.STRING, description: "The technical evidence summary or supporting observation from the data." },
            metric: { type: Type.STRING, description: "Primary KPI name e.g. 'Engagement Rate', 'Impressions', 'CTR'." },
            change: { type: Type.STRING, description: "Casing/numeric change indicator e.g. '+24.5%' or '+150k' based on the metrics." },
            type: { 
              type: Type.STRING, 
              description: "Must be one of: 'Audience', 'Competitor', 'Content', 'Creative', 'Platform', 'SEO', 'Conversion'." 
            }
          },
          required: ["title", "desc", "standpoint", "metric", "change", "type"]
        }
      }
    });

    const text = response.text || "[]";
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    res.status(500).send(error.message || "Failed to generate insights.");
  }
});

// API endpoint to generate custom AI Performance Reports from real uploaded data
app.post("/api/generate-performance-intelligence", requireStaffAuth, async (req, res) => {
  try {
    const { brandId, tagline, voiceTone, brandGuide, analyticsData } = req.body;

    if (!analyticsData || !Array.isArray(analyticsData) || analyticsData.length === 0) {
      return res.status(400).send("No analytics data provided.");
    }

    const guidePrompt = brandGuide && (brandGuide.contentPillars || brandGuide.audiencePersonas || brandGuide.competitorContext || brandGuide.platformNotes) ? `
Brand Guide Guidelines to obey:
- Content Pillars: ${brandGuide.contentPillars || "Not specified"}
- Target Audience Personas: ${brandGuide.audiencePersonas || "Not specified"}
- Competitor Context: ${brandGuide.competitorContext || "Not specified"}
- Platform Notes: ${brandGuide.platformNotes || "Not specified"}

Please align all suggestions, predictions, and recommendations with these guidelines.
` : "";

    const dataPrompt = `You are an elite marketing strategist and data scientist. Analyze the following social media performance analytics data for a brand named "${brandId}" with tagline "${tagline || ""}" and voice tone "${voiceTone || ""}".
${guidePrompt}

Analytics Data (real uploaded data rows):
${JSON.stringify(analyticsData.slice(0, 50), null, 2)}

Generate a highly customized Strategic Intelligence Report based directly on this actual data. Do not make up mock stats or use generic recommendations. Provide exactly 3 highly specific, actionable, and data-backed recommendations.

For the metricsSummary, find the true top-performing platform (bestChannel) and determine a plausible optimal posting time based on the dayOfWeek trends. Estimate a realistic predictedGrowth percentage and an ROI factor based on the engagement metrics in the data.

Return JSON in this format:
{
  "id": "rep-${Date.now()}",
  "brandId": "${brandId}",
  "generatedAt": "${new Date().toISOString()}",
  "recommendations": [
    "Specific recommendation 1 based on the data",
    "Specific recommendation 2 based on the data",
    "Specific recommendation 3 based on the data"
  ],
  "metricsSummary": {
    "bestChannel": "Platform name (e.g. LinkedIn)",
    "optimalPostingHour": "Plausible time (e.g. 09:00 AM or 02:00 PM)",
    "predictedGrowth": "Realistic forecast (e.g. +15.5% reach)",
    "roiFactor": "Realistic multiplier (e.g. 4.2x)"
  }
}`;

    const response = await generateContentWithFallback(dataPrompt, {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          brandId: { type: Type.STRING },
          generatedAt: { type: Type.STRING },
          recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          metricsSummary: {
            type: Type.OBJECT,
            properties: {
              bestChannel: { type: Type.STRING },
              optimalPostingHour: { type: Type.STRING },
              predictedGrowth: { type: Type.STRING },
              roiFactor: { type: Type.STRING }
            },
            required: ["bestChannel", "optimalPostingHour", "predictedGrowth", "roiFactor"]
          }
        },
        required: ["id", "brandId", "generatedAt", "recommendations", "metricsSummary"]
      }
    });

    const text = response.text || "{}";
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Gemini Performance Intelligence Error:", error);
    res.status(500).send(error.message || "Failed to generate report.");
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

Synthesize exactly ${count} brand positioning content pillars/directions that translate these insights into actionable content themes.

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

// API endpoint to suggest strategic brand guide details
app.post("/api/suggest-brand-guide", requireStaffAuth, async (req, res) => {
  try {
    const { 
      brandName, 
      industry, 
      tagline, 
      voiceTone, 
      brandDescription, 
      campaignObjective, 
      analyticsData
    } = req.body;

    const dataPrompt = `You are a world-class Chief Marketing Officer (CMO) and elite digital marketing strategist.
    
We need you to suggest strategic brand positioning and guidelines for the following brand:
- Brand Name: ${brandName || "Active Brand"}
- Industry: ${industry || "SaaS"}
- Tagline: ${tagline || ""}
- Voice & Tone: ${voiceTone || ""}
- Brand Description: ${brandDescription || "Not provided yet"}
- Active Campaign Objective: ${campaignObjective || "General Brand Growth"}

${analyticsData && Array.isArray(analyticsData) && analyticsData.length > 0 ? `
Here is real performance analytics data from our recent postings (use this to identify top performing platforms, content topics, and formats, and align the suggestions with these proven insights):
${JSON.stringify(analyticsData.slice(0, 50), null, 2)}
` : "No historical performance data is uploaded yet. Rely on digital marketing best practices, competitor intelligence, and campaign objective strategies."}

Using your vast marketing expertise, the provided brand coordinates, campaign objective, and raw performance metrics (if any), generate high-impact strategic content to fill in the brand guidelines.

Please construct:
1. Content Pillars (The core content pillars that represent what the brand should post about, with specific focus areas geared towards achieving the campaign objective. Make it actionable, detailed, and directly useful for content creation.)
2. Target Audience Personas (Detailed, rich customer profiles/target personas, including demographics, key pain points, media consumption habits, and why they fit our campaign objective.)
3. Competitor Context (Strategic analysis of the competitive environment and how our brand can differentiate itself. What are competitors doing? How do we carve out an unfair advantage?)
4. Platform Notes (Platform-specific tips and content distribution strategies across channels like LinkedIn, YouTube, Instagram, Twitter/X, etc., matching the campaign objective to maximize conversion or engagement.)

Return a single JSON object containing these 4 suggested fields. Maintain a highly professional, authoritative, action-oriented, and strategic tone. Highlight specific digital marketing tactics that would optimize success for the active campaign objective "${campaignObjective}".`;

    const response = await generateContentWithFallback(dataPrompt, {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          contentPillars: { type: Type.STRING, description: "Suggested core content pillars aligned with the brand and objective." },
          audiencePersonas: { type: Type.STRING, description: "Target customer/audience personas and why they matter." },
          competitorContext: { type: Type.STRING, description: "Analysis of competitor positioning and how we differentiate." },
          platformNotes: { type: Type.STRING, description: "Platform notes, tips, and distribution channels to prioritize." }
        },
        required: ["contentPillars", "audiencePersonas", "competitorContext", "platformNotes"]
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Error generating brand guide suggestions:", error);
    res.status(500).send(error.message || "Failed to generate suggestions.");
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
    const { messages, brandContext, performanceContext } = req.body;

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
3. "readTime": Estimate reading time e.g. "5 min read".
4. "coverImage": Extract the main header/featured image URL if present in the HTML/meta tags, or return an appropriate high quality Unsplash image URL related to the topic if none found.
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
