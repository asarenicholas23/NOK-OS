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

// API endpoint to generate strategic insights from real uploaded data
app.post("/api/generate-insights", async (req, res) => {
  try {
    const { tagline, voiceTone, analyticsData, count = 5 } = req.body;

    if (!analyticsData || !Array.isArray(analyticsData) || analyticsData.length === 0) {
      return res.status(400).send("No analytics data was provided. Please import some data first.");
    }

    const dataPrompt = `You are an elite marketing strategist and data scientist. Analyze the following social media performance analytics data for a brand with the tagline "${tagline || ""}" and voice tone "${voiceTone || ""}".

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

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: dataPrompt,
      config: {
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
    const { brandId, tagline, voiceTone, analyticsData } = req.body;

    if (!analyticsData || !Array.isArray(analyticsData) || analyticsData.length === 0) {
      return res.status(400).send("No analytics data provided.");
    }

    const dataPrompt = `You are an elite marketing strategist and data scientist. Analyze the following social media performance analytics data for a brand named "${brandId}" with tagline "${tagline || ""}" and voice tone "${voiceTone || ""}".

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

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: dataPrompt,
      config: {
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
    const { tagline, voiceTone, approvedInsights, count = 5 } = req.body;

    const dataPrompt = `You are a visionary brand architect and creative director. Use the brand tagline "${tagline || ""}" and voice tone "${voiceTone || ""}" along with these strategic insights:
${JSON.stringify(approvedInsights, null, 2)}

Synthesize exactly ${count} brand positioning content pillars/directions that translate these insights into actionable content themes.

For each brand direction, provide:
1. "pillar": A bold, inspiring name for this content theme (e.g. "Authority-Led Case Studies").
2. "strategy": A detailed content marketing strategy explaining why and how to construct campaigns under this pillar.
3. "focus": Channel or format focus areas (e.g., "LinkedIn deep-dive articles, partner newsletters").
4. "checklist": An array of exactly 3 or 4 actionable checklist items for creators executing campaigns under this direction.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: dataPrompt,
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
    const { tagline, voiceTone, approvedDirections, count = 5 } = req.body;

    const dataPrompt = `You are an elite creative director and copywriter. Using the brand tagline "${tagline || ""}" and voice tone "${voiceTone || ""}", analyze the following positioning directions/pillars:
${JSON.stringify(approvedDirections, null, 2)}

Create exactly ${count} highly engaging creative content briefs for upcoming marketing campaigns that directly realize these pillars.

For each campaign brief, provide:
1. "title": A catchy, memorable campaign title.
2. "objective": A precise, goal-oriented creative objective.
3. "targetAudience": The specific target audience or reader segment.
4. "keyMessage": The core marketing message or key takeaway of the campaign.
5. "deliverables": Specific social assets or content assets to be created (e.g., "3x LinkedIn carousel graphics, 1x blog post series").`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: dataPrompt,
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

    const text = response.text || "[]";
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Gemini Briefs Generation Error:", error);
    res.status(500).send(error.message || "Failed to generate briefs.");
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
