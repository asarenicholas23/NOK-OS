import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Shared Gemini client utility with User-Agent set to 'aistudio-build'
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required but missing");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API Route: Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API Route: Generate Strategic Insights from Analytics Data
  app.post("/api/generate-insights", async (req, res) => {
    try {
      const { tagline, voiceTone, analyticsData } = req.body;
      const ai = getGeminiClient();

      const dataStr = JSON.stringify(analyticsData || [], null, 2);
      const prompt = `You are an elite brand growth strategist.
We have uploaded raw performance analytics data for a brand.
Brand Profile:
- Tagline: "${tagline || "N/A"}"
- Brand Voice/Tone: "${voiceTone || "N/A"}"

Raw Analytics Data:
${dataStr}

Based on this raw data, generate exactly 5 highly tactical strategic insights.
The insights MUST categorize the observations into one of the following 5 standpoints:
- "analytics" (quantitative calculations)
- "observation" (direct behavior notice)
- "opportunity" (clear recommendation action)
- "pattern" (recurring trend over days or formats)
- "lesson" (high-level takeaway from failures/successes)

Each insight must contain:
1. title: A short, high-impact title (e.g. "LinkedIn Engagement Surge").
2. desc: A precise, highly actionable description sentence (e.g., "SaaS copy scheduled for Fridays incurs 22% CTR drop. Shifting to Monday morning brackets is advised.").
3. standpoint: One of the five standpoint string values: "analytics", "observation", "opportunity", "pattern", "lesson".
4. metric: A specific qualitative/quantitative metric mentioned or inferred (e.g. "LinkedIn Engagement" or "+14% CTR").
5. change: A percentage or ratio delta (e.g., "+14.3%", "-22.1%", "+3.5x").
6. type: A performance categorization. Must be "positive", "warning", or "neutral" depending on the performance.

Ensure all suggestions match the brand voice tone and align with the tagline.
Respond STRICTLY with a valid JSON array of 5 objects matching the schema. Do not include markdown tags other than standard JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                desc: { type: Type.STRING },
                standpoint: { type: Type.STRING, description: "Must be analytics, observation, opportunity, pattern, or lesson" },
                metric: { type: Type.STRING },
                change: { type: Type.STRING },
                type: { type: Type.STRING, description: "Must be positive, warning, or neutral" }
              },
              required: ["title", "desc", "standpoint", "metric", "change", "type"]
            }
          }
        }
      });

      const responseText = response.text || "[]";
      res.json(JSON.parse(responseText.trim()));
    } catch (error: any) {
      console.error("Error generating insights:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: Generate Content Directions from Approved Insights
  app.post("/api/generate-directions", async (req, res) => {
    try {
      const { tagline, voiceTone, approvedInsights } = req.body;
      const ai = getGeminiClient();

      const insightsStr = JSON.stringify(approvedInsights || [], null, 2);
      const prompt = `You are a high-level content strategist.
We have approved several strategic insights for a brand.
Brand Profile:
- Tagline: "${tagline || "N/A"}"
- Brand Voice/Tone: "${voiceTone || "N/A"}"

Approved Strategic Insights:
${insightsStr}

Based on these approved insights, generate exactly 2-3 content directions or positioning pillars.
Each positioning direction/pillar must contain:
1. pillar: A short catchy pillar name (e.g. "Technical Superiority" or "Capital Efficiency").
2. strategy: A clear execution strategy explaining how to write or act on this pillar (e.g. "Publish benchmarking reports showing 90% latency reduction against legacy container models.").
3. focus: A target demographic focus (e.g., "CTO, DevOps Managers, Engineering Leads").
4. checklist: A simple array of exactly 3 tactical tasks or milestone items to implement this strategy.

Respond STRICTLY with a valid JSON array of objects.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
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
        }
      });

      const responseText = response.text || "[]";
      res.json(JSON.parse(responseText.trim()));
    } catch (error: any) {
      console.error("Error generating directions:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: Generate Content Briefs from Content Directions
  app.post("/api/generate-briefs", async (req, res) => {
    try {
      const { tagline, voiceTone, approvedDirections } = req.body;
      const ai = getGeminiClient();

      const directionsStr = JSON.stringify(approvedDirections || [], null, 2);
      const prompt = `You are a creative content director.
We have selected brand positioning directions/pillars for content development.
Brand Profile:
- Tagline: "${tagline || "N/A"}"
- Brand Voice/Tone: "${voiceTone || "N/A"}"

Approved Directions:
${directionsStr}

Generate exactly 2 creative briefs based on these directions.
Each brief must contain:
1. title: Creative, attention-grabbing content campaign title (e.g., "Decarbonization Impact Deck" or "Zero-Idle Costs Campaign").
2. objective: A clear creative objective (e.g., "Establish the brand as the primary sustainable grid leader...").
3. targetAudience: Specific target audience (e.g., "Institutional Investors, Green Board Members").
4. keyMessage: The core narrative theme to embed (e.g., "Global Industries is tracking 2 years ahead of Scope-2 neutrality...").
5. deliverables: The actual content files/pieces to produce (e.g., "18-slide Keynote deck, 3x LinkedIn graphics").

Respond STRICTLY with a valid JSON array of 2 objects matching the schema.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                objective: { type: Type.STRING },
                targetAudience: { type: Type.STRING },
                keyMessage: { type: Type.STRING },
                deliverables: { type: Type.STRING }
              },
              required: ["title", "objective", "targetAudience", "keyMessage", "deliverables"]
            }
          }
        }
      });

      const responseText = response.text || "[]";
      res.json(JSON.parse(responseText.trim()));
    } catch (error: any) {
      console.error("Error generating briefs:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: Generate CEO Performance Report
  app.post("/api/generate-ceo-report", async (req, res) => {
    try {
      const { brandName, industry, tagline, voiceTone, analyticsData } = req.body;
      const ai = getGeminiClient();

      const dataStr = JSON.stringify(analyticsData || [], null, 2);
      const prompt = `You are an elite Chief Marketing Officer writing a performance intelligence report for the CEO and board of directors of "${brandName || "Active Brand"}" (${industry || "N/A"}).
Tagline: "${tagline || "N/A"}"
Voice Tone: "${voiceTone || "N/A"}"

Raw Analytics Metrics & Historical Post Performance Data:
${dataStr}

Provide a deep, strategic executive-level analytical brief that a CEO can easily understand to make resource allocation decisions.
Identify:
1. Overall Brand Health (impressions, engagement trends, and distribution across channels).
2. Channels with high ROI vs friction.
3. 3-4 specific tactical prescriptive recommendations.
4. An executive narrative summarizing the exact progress or current market situation of the brand.

Structure your response strictly as a JSON object matching this schema:
{
  "bestChannel": "The channel showing optimal performance (e.g. LinkedIn, YouTube)",
  "optimalPostingHour": "Best posting hour bracket based on data (e.g. 09:00 AM)",
  "predictedGrowth": "Forecast growth reach (e.g. +18.4% reach, +42% CTR)",
  "roiFactor": "Calculated ROI factor (e.g. 4.8x or 5.5x)",
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "ceoSummary": "A comprehensive, 2-3 paragraph professional Markdown styled report written for a CEO, summarizing the brand performance, current situation, and future trajectory."
}

Respond STRICTLY with a valid JSON object.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              bestChannel: { type: Type.STRING },
              optimalPostingHour: { type: Type.STRING },
              predictedGrowth: { type: Type.STRING },
              roiFactor: { type: Type.STRING },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              ceoSummary: { type: Type.STRING, description: "CMO report written for CEO in clean Markdown." }
            },
            required: ["bestChannel", "optimalPostingHour", "predictedGrowth", "roiFactor", "recommendations", "ceoSummary"]
          }
        }
      });

      const responseText = response.text || "{}";
      res.json(JSON.parse(responseText.trim()));
    } catch (error: any) {
      console.error("Error generating CEO report:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
