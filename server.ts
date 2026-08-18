import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Origins allowed to call this API. Firebase Hosting serves the frontend on a
// different origin than this server, so CORS must be explicit.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
}));

app.use(express.json({ limit: "50mb" }));
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
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  }),
});
const adminDb = admin.firestore();

// Gate: only signed-in staff (real Firebase email/password accounts) may call
// the Gemini-backed endpoints below, so a stranger can't burn the API quota.
async function requireStaffAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization || "";
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) {
    return res.status(401).json({ error: "Missing Authorization header." });
  }
  try {
    const decoded = await admin.auth().verifyIdToken(match[1]);
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

// API endpoint to generate creative content briefs from brand directions
app.post("/api/generate-briefs", requireStaffAuth, async (req, res) => {
  try {
    const { tagline, voiceTone, brandGuide, approvedDirections, count = 5 } = req.body;

    const guidePrompt = brandGuide && (brandGuide.contentPillars || brandGuide.audiencePersonas || brandGuide.competitorContext || brandGuide.platformNotes) ? `
Brand Guide Guidelines to obey:
- Content Pillars: ${brandGuide.contentPillars || "Not specified"}
- Target Audience Personas: ${brandGuide.audiencePersonas || "Not specified"}
- Competitor Context: ${brandGuide.competitorContext || "Not specified"}
- Platform Notes: ${brandGuide.platformNotes || "Not specified"}

Please align the campaign titles, creative objectives, target segments, and deliverables strictly with these brand guide parameters.
` : "";

    const dataPrompt = `You are an elite creative director and copywriter. Using the brand tagline "${tagline || ""}" and voice tone "${voiceTone || ""}", analyze the following positioning directions/pillars:
${guidePrompt}
${JSON.stringify(approvedDirections, null, 2)}

Create exactly ${count} highly engaging, execution-ready creative content briefs for upcoming marketing campaigns that directly realize these pillars.
Every brief must contain complete information for all sections; if details are not explicitly defined, infer reasonable values consistent with the brand positioning. DO NOT leave fields blank.

Always populate the following sections for each brief:
1. HEADER: Campaign ID (e.g., "KNTENEVA-R1"), Date (e.g. "7/1/2026"), and Sequence Position (e.g. "Campaign 1 of ${count}").
2. CAMPAIGN TITLE: A catchy, memorable campaign title.
3. CAMPAIGN OBJECTIVE: One sentence, tied to a specific outcome (e.g., recall, saves, profile visits, inbound DMs, etc.) - specify exactly what awareness should produce.
4. TARGET AUDIENCE: Specific role/persona + one specific pain point this piece speaks to directly.
5. CORE POSITIONING COPY / KEY MESSAGE: The single core message the audience should remember, in brand voice.
6. PROOF POINT / DATA SOURCE: Specific stat, dataset, case study, or real example. If no real internal data exists yet, flag explicitly as "PLACEHOLDER — needs real data before publishing" (never invent fictitious metrics).
7. FORMAT & TECHNICAL SPEC: Platform (e.g. "LinkedIn"), exact format (e.g. "Native document post (carousel)"), dimensions/aspect ratio (e.g. "1080 x 1350 px, portrait (4:5)"), slide/post count (e.g. "7 slides"), companion assets if any. Default carousel length to 7 slides unless content requires otherwise (range 5-10, hard cap 15).
8. CONTENT OUTLINE: A beat-by-beat, slide-by-slide, or section-by-section breakdown of what each individual asset/slide/tweet/scene says. You MUST format this strictly according to the format being built, using these markdown structures:
   - For Carousels (slides/cards/pages): Generate a slide-by-slide sequence. Each slide must use this format exactly:
     ## Slide [Number] — [Slide Title]
     **Copy:**
     > "Exact copy text inside quotes"
     **Design:** Full description of visual layout, background styles, color guidelines, typography weighting, and negative space boundaries.
     If there are channel specific swaps (like slide 4 having different assets on Instagram vs LinkedIn), add them precisely:
     **Instagram version:** [Describe native motion video assets]
     **LinkedIn version (static swap):** [Describe clean screenshots with annotation arrows]
   
   - For Videos/Reels/TikToks: Generate a scene-by-scene script storyboard. Each scene must use this format exactly:
     ## Scene [Number] — [Scene Focus / Timecode]
     **Copy:**
     > "Exact narrator audio or voiceover copy inside quotes"
     **Design:** Full director directions of camera movement, lighting, visual scenes, and on-screen overlays.
     
   - For Fliers/Posters/Prints: Generate a blueprint layout structure. Each section must use this format exactly:
     ## Section [Number] — [Layout Component Name]
     **Copy:**
     > "Exact printed copy inside quotes"
     **Design:** Precise blueprint instructions for grid alignment, border accents, and visual focus anchors.
     
   - For Email Campaigns/Newsletters: Generate a modular newsletter template block. Each block must use this format exactly:
     ## Section [Number] — [Block Title]
     For Section 1, always specify subject line metadata:
     **Subject Line:**
     > "Newsletter subject line in quotes"
     **Preview Text:**
     > "Interesting inbox preview snippet in quotes"
     For other sections:
     **Copy:**
     > "Exact newsletter content block in quotes"
     **Design:** Editorial margins, signature styles, highlighted card backgrounds, and custom colored call-to-action buttons.
9. CALL TO ACTION: The specific action the viewer should take (comment, save, DM, click link, book a call).
10. TONE & VISUAL REFERENCE: 2-3 adjectives for tone, brand guide reference (colors, fonts, logo placement), and style inspiration references if available.
11. SUCCESS METRIC / KPI TARGET: The specific metric target (e.g., ">= 2.5% engagement rate", "15 saves", "3 inbound DMs") so performance can be reviewed against a target.
12. DELIVERABLES & SCOPE: Exact count and type of final assets (e.g., "1x LinkedIn document post (7-slide carousel)").
13. APPROVER: Who signs off before this goes to the designer (e.g., "Osei").

The brief will be dropped directly into a spreadsheet-style content calendar row, so you MUST also populate these calendar fields for every brief, using this exact vocabulary:
14. PLATFORM: Exactly one of "Instagram", "Facebook", "LinkedIn", "TikTok", "Twitter/X", "YouTube", "Newsletter" — pick the single best-fit primary channel (this drives a dropdown, not free text).
15. MAIN FOCUS: Exactly one of "Reach", "Engagement", "Link Click", "Sales" — the funnel stage this asset serves.
16. TOPIC/IDEA: A short (one sentence) hook or idea line for the calendar cell — punchier and shorter than the key message, e.g. "What if your body and mind were your greatest asset?".
17. CONTENT PILLAR: The specific content pillar this brief belongs to, drawn from the brand's actual content pillars provided above (fall back to a sensible pillar name like "Strategy", "Proof", "Culture", or "Product" if none were provided).
18. TYPE: Exactly one of "Artwork", "Carousel", "Video", "Reel" — matching the format implied by the content outline above (this drives a dropdown, not free text).
19. PROGRESS TRACKING: Always "Create" for a freshly generated brief (this is the starting stage of a dropdown that later moves through Edit/Film/Review/Schedule/Done).
20. VISUAL REFERENCE: 1-2 short sentences of art direction (palette, typography, reference style) for the calendar cell — a condensed version of the tone & visual reference above.
21. VISUAL COPY DETAIL: The same detailed slide/scene/section-by-section breakdown you wrote for CONTENT OUTLINE above, repeated here verbatim so the calendar cell and the full brief stay in sync.
22. COPYWRITING CAPTION: The actual publish-ready caption or on-post copy text a scheduler would paste straight into the platform — written in full sentences in brand voice, not a summary.
23. HASHTAGS: A short block of relevant hashtags (e.g. "#BrandName #ContentPillar #CampaignTheme").`;

    const response = await generateContentWithFallback(dataPrompt, {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            campaignId: { type: Type.STRING },
            date: { type: Type.STRING },
            sequencePosition: { type: Type.STRING },
            objective: { type: Type.STRING },
            targetAudience: { type: Type.STRING },
            keyMessage: { type: Type.STRING },
            proofPoint: { type: Type.STRING },
            formatSpec: { type: Type.STRING },
            contentOutline: { type: Type.STRING },
            cta: { type: Type.STRING },
            toneVisualRef: { type: Type.STRING },
            successMetric: { type: Type.STRING },
            deliverables: { type: Type.STRING },
            approver: { type: Type.STRING },
            platform: { type: Type.STRING },
            mainFocus: { type: Type.STRING },
            topicIdea: { type: Type.STRING },
            contentPillar: { type: Type.STRING },
            postType: { type: Type.STRING },
            progressTracking: { type: Type.STRING },
            visualReference: { type: Type.STRING },
            visualCopyDetail: { type: Type.STRING },
            copywritingCaption: { type: Type.STRING },
            hashtags: { type: Type.STRING }
          },
          required: [
            "title", "campaignId", "date", "sequencePosition", "objective",
            "targetAudience", "keyMessage", "proofPoint", "formatSpec",
            "contentOutline", "cta", "toneVisualRef", "successMetric",
            "deliverables", "approver",
            "platform", "mainFocus", "topicIdea", "contentPillar", "postType",
            "progressTracking", "visualReference", "visualCopyDetail",
            "copywritingCaption", "hashtags"
          ]
        }
      }
    });

    const text = response.text || "[]";
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Gemini Briefs Generation Error:", error);
    res.status(500).send(error.message || "Failed to generate briefs.");
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
3. Draft structured Creative Briefs. If the user asks you to write, draft, or generate a "Creative Brief", you must format it beautifully. When generating a complete creative brief, you should also include a special structured JSON block at the very end of your response, enclosed in \`\`\`json_brief ... \`\`\` markers, so the client can parse it and let the user save it to their Briefs Registry with a single click.

The contentOutline inside the JSON MUST be highly detailed and structured based on the target campaign format, conforming to these precise standards:
- For Carousels (slides/pages): Write a slide-by-slide sequence. Format each slide as:
  ## Slide [Number] — [Slide Title]
  **Copy:**
  > "Exact copy text inside quotes"
  **Design:** Visual instructions for designers (color contrast, typography, margins, backgrounds, negative space). Include optional "Instagram version:" or "LinkedIn version (static swap):" variants if appropriate.
  
- For Videos/Reels/TikToks: Write a scene-by-scene script. Format each scene as:
  ## Scene [Number] — [Scene Focus / Timecode]
  **Copy:** (or **Audio:**)
  > "Exact narrator audio/voiceover copy inside quotes"
  **Design:** (or **Visual Direction:**) Detailed visual scenes, on-screen caption overlays, camera framing, lighting, and pacing.
  
- For Fliers/Posters/Prints: Write a layout blueprint. Format each section as:
  ## Section [Number] — [Section Name]
  **Copy:**
  > "Exact copy inside quotes"
  **Design:** Specific layout guidelines, grid sizing, QR code frame references, and main visual focus anchors.
  
- For Email Newsletters: Write a template block sequence. Format each block as:
  ## Section [Number] — [Block Theme]
  For Section 1, specify Subject Line and Preview Text:
  **Subject Line:**
  > "Catchy subject line"
  **Preview Text:**
  > "Inbox preview snippet"
  For other sections:
  **Copy:**
  > "Exact newsletter copy in quotes"
  **Design:** Spacing, borders, logo alignment, and highlighted action buttons.

The JSON inside \`\`\`json_brief ... \`\`\` must conform exactly to this structure:
{
  "title": "Creative brief title",
  "objective": "Campaign objective sentence",
  "targetAudience": "Target role/persona + pain point",
  "keyMessage": "Core key message",
  "deliverables": "Deliverables and formats list",
  "status": "Draft",
  "campaignId": "Brief reference id (e.g. NOK-CAR-1)",
  "date": "Today's date or release date (e.g. 7/1/2026)",
  "sequencePosition": "Campaign sequence position",
  "proofPoint": "Supporting stat, study or example",
  "formatSpec": "Platform + formats spec (e.g. LinkedIn 7-slide carousel)",
  "contentOutline": "Slide-by-slide or section-by-section breakdown details complying with the formatting rules above",
  "cta": "Call to action message",
  "toneVisualRef": "Tone and visual style descriptions",
  "successMetric": "Success metric or KPI target",
  "approver": "Creative sign-off authority"
}
Ensure all JSON fields are populated. If some fields are not mentioned, infer realistic details aligned with the active brand. Keep the JSON perfectly valid.`;

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
6. "authorRole": Author role (default to "Lead Strategist, NOK Social").
7. "excerpt": A compelling 1-2 sentence summary hook (150-200 characters).
8. "contentMarkdown": The COMPLETE article body text, formatted cleanly in Markdown. Include all section headings (## Heading), subheadings (### Subheading), key callout boxes (> Callout quote), bulleted lists (- Item), bold text (**bold**), and any image URLs (![Alt](url)) present in the article. DO NOT summarize or truncate the article body — extract all paragraphs from beginning to end.

Return JSON in this exact structure:
{
  "title": "Article Title",
  "category": "Substack Series",
  "readTime": "5 min read",
  "coverImage": "https://...",
  "authorName": "Osei Kofi",
  "authorRole": "Lead Strategist, NOK Social",
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

    const customToken = await admin.auth().createCustomToken(`client-${linkDoc.id}`, {
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

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

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
