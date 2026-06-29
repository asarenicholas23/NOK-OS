import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

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
    const { tagline, voiceTone, analyticsData } = req.body;

    if (!analyticsData || !Array.isArray(analyticsData) || analyticsData.length === 0) {
      return res.status(400).send("No analytics data was provided. Please import some data first.");
    }

    const dataPrompt = `You are an elite marketing strategist and data scientist. Analyze the following social media performance analytics data for a brand with the tagline "${tagline || ""}" and voice tone "${voiceTone || ""}".

Analytics Data (real uploaded data rows):
${JSON.stringify(analyticsData.slice(0, 50), null, 2)}

Based on this real data, discover exactly 3 or 4 highly valuable, custom strategic insights. Do not generate generic insights. They must directly reflect the metrics, trends, platforms, content formats, and engagement rates found in the provided data.

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
