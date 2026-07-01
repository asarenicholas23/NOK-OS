import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

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
app.post("/api/generate-insights", async (req, res) => {
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
app.post("/api/generate-performance-intelligence", async (req, res) => {
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
app.post("/api/generate-directions", async (req, res) => {
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
app.post("/api/generate-briefs", async (req, res) => {
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
8. CONTENT OUTLINE: A beat-by-beat or slide-by-slide breakdown of what each individual asset/slide/tweet/scene says.
9. CALL TO ACTION: The specific action the viewer should take (comment, save, DM, click link, book a call).
10. TONE & VISUAL REFERENCE: 2-3 adjectives for tone, brand guide reference (colors, fonts, logo placement), and style inspiration references if available.
11. SUCCESS METRIC / KPI TARGET: The specific metric target (e.g., ">= 2.5% engagement rate", "15 saves", "3 inbound DMs") so performance can be reviewed against a target.
12. DELIVERABLES & SCOPE: Exact count and type of final assets (e.g., "1x LinkedIn document post (7-slide carousel)").
13. APPROVER: Who signs off before this goes to the designer (e.g., "Osei").`;

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
            approver: { type: Type.STRING }
          },
          required: [
            "title", "campaignId", "date", "sequencePosition", "objective", 
            "targetAudience", "keyMessage", "proofPoint", "formatSpec", 
            "contentOutline", "cta", "toneVisualRef", "successMetric", 
            "deliverables", "approver"
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
app.post("/api/suggest-brand-guide", async (req, res) => {
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

// Vite dev server or static server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
