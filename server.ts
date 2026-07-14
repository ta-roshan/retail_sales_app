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

// Programmatic analytical report generator as a robust fallback
function generateDynamicFallbackReport(summaryData: any): string {
  const { overallMetrics, storesBreakdown, categoriesBreakdown } = summaryData;
  
  const topStore = storesBreakdown?.[0];
  const bottomStore = storesBreakdown?.[storesBreakdown.length - 1];
  
  const criticalStores = (storesBreakdown || []).filter(
    (s: any) => s.targetAchievementPercent < 85
  );

  const highReturnCategories = (categoriesBreakdown || []).filter(
    (c: any) => c.returnRatePercent > 8
  );

  const highStockoutCategories = (categoriesBreakdown || []).filter(
    (c: any) => c.stockoutIncidents > 5
  );

  let report = "";
  report += "# 💡 Automated Business Intelligence Report\n\n";
  report += "> **⚠️ NOTE on Preview Mode**: This diagnostic report was compiled via the local heuristic analyzer engine because your **GEMINI_API_KEY** is not configured. Add your API key in **Settings > Secrets** inside AI Studio to unlock advanced deep-reasoning AI strategic recommendations.\n\n";
  
  report += "## 1. 📊 Executive Summary & KPI Performance\n\n";
  report += `- **Total Net Sales**: $${(overallMetrics?.netSales || 0).toLocaleString()}\n`;
  report += `- **Target Achievement**: **${overallMetrics?.targetAchievementPercent || 0}%**\n`;
  report += `- **Average Transaction Value (ATV)**: $${(overallMetrics?.averageTransactionValue || 0).toFixed(2)}\n`;
  report += `- **Return Rate**: **${overallMetrics?.returnRatePercent || 0}%**\n`;
  report += `- **Discount Rate**: **${overallMetrics?.discountRatePercent || 0}%**\n\n`;
  
  if ((overallMetrics?.targetAchievementPercent || 0) >= 100) {
    report += `Overall, the company **exceeded its sales targets** by achieving **${overallMetrics?.targetAchievementPercent}%** of the goals! This represents excellent operational efficiency across most formats.\n\n`;
  } else if ((overallMetrics?.targetAchievementPercent || 0) >= 85) {
    report += `The company is **on track** but slightly under target, achieving **${overallMetrics?.targetAchievementPercent}%** of the goals. Focused promotional activities could help close this gap.\n\n`;
  } else {
    report += `Performance is **lagging significantly behind goals**, currently sitting at a critical target achievement of **${overallMetrics?.targetAchievementPercent}%**. Immediate management action is recommended.\n\n`;
  }

  report += "## 2. 🏆 Top & Bottom Performers\n\n";
  if (topStore) {
    report += `- **Highest Performing Store**: **${topStore.storeName}** (${topStore.region} region, format: ${topStore.format}) generated **$${topStore.netSales.toLocaleString()}** in net sales, achieving **${topStore.targetAchievementPercent}%** of its target.\n`;
  }
  if (bottomStore && bottomStore !== topStore) {
    report += `- **Lowest Performing Store**: **${bottomStore.storeName}** (${bottomStore.region} region, format: ${bottomStore.format}) generated **$${bottomStore.netSales.toLocaleString()}** in net sales, achieving only **${bottomStore.targetAchievementPercent}%** of its target.\n\n`;
  }

  report += "## 3. 🚨 Critical Target Alerts\n\n";
  if (criticalStores.length > 0) {
    report += `The following **${criticalStores.length} stores** missed their sales target by more than 15% (Target Achievement < 85%):\n\n`;
    criticalStores.forEach((s: any) => {
      report += `- **${s.storeName}** (${s.region}): Sales of **$${s.netSales.toLocaleString()}** against target. Achievement was only **${s.targetAchievementPercent}%**. *Immediate localized marketing spend or pricing optimization required.*\n`;
    });
  } else {
    report += "**Excellent consistency!** No stores missed their targets by more than 15% under the currently filtered parameters.\n";
  }
  report += "\n";

  report += "## 4. 📦 Category Performance & Inventory Risks\n\n";
  report += "### Return Rate Analysis\n";
  if (highReturnCategories.length > 0) {
    report += `The following categories have elevated returns (> 8% Return Rate):\n\n`;
    highReturnCategories.forEach((c: any) => {
      report += `- **${c.category}** has a high Return Rate of **${c.returnRatePercent}%** with **$${c.netSales.toLocaleString()}** in sales. *Review product quality or size alignment models immediately.*\n`;
    });
  } else {
    report += "All categories show healthy return rates below the 8% industry threshold.\n";
  }
  report += "\n";

  report += "### Stockout & Logistics Gaps\n";
  if (highStockoutCategories.length > 0) {
    report += `Logistics alerts triggered for the following categories due to high stockout counts:\n\n`;
    highStockoutCategories.forEach((c: any) => {
      report += `- **${c.category}** registered **${c.stockoutIncidents}** stockout events despite having ${c.inventoryOnHand.toLocaleString()} average units on hand. This indicates a geographic mismatch in distribution or seasonal replenishment latency.\n`;
    });
  } else {
    report += "Inventory replenishment is matching current consumer demand levels effectively.\n";
  }

  return report;
}

// AI Insights endpoint
app.post("/api/ai-insights", async (req, res) => {
  const { summaryData } = req.body;
  if (!summaryData) {
    res.status(400).json({ error: "Missing summaryData in request body." });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    console.log("No GEMINI_API_KEY found or using placeholder. Compiling dynamic fallback report.");
    const report = generateDynamicFallbackReport(summaryData);
    res.json({ text: report });
    return;
  }

  try {
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
    console.error("Error generating insights from Gemini, compiling fallback report instead:", error);
    try {
      const report = generateDynamicFallbackReport(summaryData);
      res.json({ text: report });
    } catch (innerError: any) {
      res.status(500).json({ 
        error: error.message || "Failed to generate business report.",
        details: "Check if the GEMINI_API_KEY is configured in the secrets menu."
      });
    }
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
