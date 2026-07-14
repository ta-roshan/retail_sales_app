/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy initializer for Google GenAI client to prevent crashes if key is missing
let aiInstance: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined. Please add it via Settings > Secrets.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// AI Insights endpoint
app.post("/api/ai-insights", async (req, res) => {
  try {
    const { summaryData } = req.body;
    if (!summaryData) {
      res.status(400).json({ error: "Missing summaryData in request body." });
      return;
    }

    const ai = getAIClient();
    
    const prompt = `
You are a Senior Retail Business Intelligence Analyst.
Analyze the following filtered retail dataset and generate a comprehensive natural language business report.

The report MUST include the following sections (use professional retail terminology, beautiful markdown formatting, bold text, and bullet points):

1. 📊 **Executive Summary & KPI Performance**: 
   Summarize overall Net Sales, Target Achievement % (how close we are to sales targets), Average Transaction Value (ATV), Return Rate %, and Discount Rate %. Highlight if overall targets were met, exceeded, or missed.
   
2. 🏆 **Top & Bottom Performers**: 
   Identify the highest and lowest performing regions and stores based on Net Sales and Target Achievement. Be specific with names.

3. 🚨 **Critical Target Alerts**: 
   Detail stores that missed their sales targets by more than 15% (Target Achievement < 85%). Outline potential reasons and immediate actions required.

4. 📦 **Category Performance & Inventory Risks**: 
   Highlight product categories experiencing high stockout events or return rates. Identify patterns (e.g., if particular formats or categories are high risk) and give strategic recommendations to optimize on-hand inventory levels.

Here is the aggregated analytics data for the active filter view:
${JSON.stringify(summaryData, null, 2)}

Provide high-impact, professional retail recommendations that the management team can act on immediately.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error generating insights from Gemini:", error);
    res.status(500).json({ 
      error: error.message || "Failed to generate business report.",
      details: "Check if the GEMINI_API_KEY is configured in the secrets menu."
    });
  }
});

// Serve health status
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
