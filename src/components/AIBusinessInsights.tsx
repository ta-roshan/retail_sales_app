/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Sparkles, Loader2, Download, AlertCircle, FileText, CheckCircle } from "lucide-react";
import { RetailWeeklySales } from "../types";

interface AIBusinessInsightsProps {
  key?: any;
  filteredData: RetailWeeklySales[];
  overallMetrics: {
    netSales: number;
    salesTarget: number;
    targetAchievement: number;
    averageTransactionValue: number;
    returnRate: number;
    discountRate: number;
  };
}

export default function AIBusinessInsights({ filteredData, overallMetrics }: AIBusinessInsightsProps) {
  const [reportText, setReportText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compile specific business indicators to send to the Gemini API
  const generateAIBusinessReport = async () => {
    if (filteredData.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Group data by store to locate top performers and target deviations
      const storeMetrics: Record<string, { store_name: string; format: string; region: string; net_sales: number; target: number; stockouts: number }> = {};
      filteredData.forEach((row) => {
        if (!storeMetrics[row.store_id]) {
          storeMetrics[row.store_id] = {
            store_name: row.store_name,
            format: row.store_format,
            region: row.region,
            net_sales: 0,
            target: 0,
            stockouts: 0,
          };
        }
        storeMetrics[row.store_id].net_sales += row.net_sales;
        storeMetrics[row.store_id].target += row.sales_target;
        storeMetrics[row.store_id].stockouts += row.stockouts;
      });

      const storesList = Object.values(storeMetrics).map((s) => ({
        storeName: s.store_name,
        format: s.format,
        region: s.region,
        netSales: Math.round(s.net_sales),
        salesTarget: Math.round(s.target),
        targetAchievementPercent: s.target > 0 ? Math.round((s.net_sales / s.target) * 100) : 0,
        stockoutIncidents: s.stockouts,
      }));

      // 2. Group data by product category
      const categoryMetrics: Record<string, { name: string; sales: number; returns: number; inventory: number; stockouts: number }> = {};
      filteredData.forEach((row) => {
        const cat = row.product_category;
        if (!categoryMetrics[cat]) {
          categoryMetrics[cat] = { name: cat, sales: 0, returns: 0, inventory: 0, stockouts: 0 };
        }
        categoryMetrics[cat].sales += row.net_sales;
        categoryMetrics[cat].returns += row.returns_amount;
        categoryMetrics[cat].inventory += row.inventory_on_hand;
        categoryMetrics[cat].stockouts += row.stockouts;
      });

      const categoriesList = Object.values(categoryMetrics).map((c) => ({
        category: c.name,
        netSales: Math.round(c.sales),
        returnRatePercent: c.sales > 0 ? Number(((c.returns / c.sales) * 100).toFixed(2)) : 0,
        inventoryOnHand: c.inventory,
        stockoutIncidents: c.stockouts,
      }));

      // Create a smart, condensed summary object to stay within token limits and guide Gemini
      const dataSummary = {
        timePeriod: "Active Filter Selections",
        overallMetrics: {
          netSales: Math.round(overallMetrics.netSales),
          salesTarget: Math.round(overallMetrics.salesTarget),
          targetAchievementPercent: Number(overallMetrics.targetAchievement.toFixed(1)),
          averageTransactionValue: Number(overallMetrics.averageTransactionValue.toFixed(2)),
          returnRatePercent: Number(overallMetrics.returnRate.toFixed(2)),
          discountRatePercent: Number(overallMetrics.discountRate.toFixed(2)),
        },
        storesBreakdown: storesList.sort((a, b) => b.netSales - a.netSales),
        categoriesBreakdown: categoriesList.sort((a, b) => b.netSales - a.netSales),
      };

      const response = await fetch("/api/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summaryData: dataSummary }),
      });

      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson.error || "Failed to compile the AI report.");
      }

      setReportText(resJson.text || "No insights could be compiled.");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while communicating with Gemini.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!reportText) return;
    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `AI_Business_Analyst_Report_${new Date().toISOString().slice(0,10)}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Safe custom markdown rendering engine to prevent any package loading errors
  const parseMarkdownToJSX = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();

      // Skip empty lines
      if (!trimmed) return <div key={idx} className="h-2" />;

      // Header 1
      if (trimmed.startsWith("# ")) {
        return (
          <h1 key={idx} className="text-xl font-extrabold text-slate-800 border-b border-slate-100 pb-1.5 mt-4 mb-2 flex items-center gap-1.5">
            {trimmed.slice(2)}
          </h1>
        );
      }

      // Header 2 / 3
      if (trimmed.startsWith("## ") || trimmed.startsWith("### ")) {
        const titleText = trimmed.startsWith("## ") ? trimmed.slice(3) : trimmed.slice(4);
        return (
          <h2 key={idx} className="text-sm font-bold text-slate-800 tracking-tight mt-4 mb-1.5 uppercase border-l-3 border-indigo-500 pl-2">
            {titleText}
          </h2>
        );
      }

      // Bullet points
      if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
        const bulletText = trimmed.slice(2);
        return (
          <li key={idx} className="text-xs text-slate-600 leading-relaxed ml-4 list-disc mb-1 pl-1">
            {renderInlineFormat(bulletText)}
          </li>
        );
      }

      // Numbered items
      if (/^\d+\.\s/.test(trimmed)) {
        const dotIndex = trimmed.indexOf(".");
        const bulletText = trimmed.slice(dotIndex + 1).trim();
        return (
          <li key={idx} className="text-xs text-slate-600 leading-relaxed ml-4 list-decimal mb-1 pl-1">
            {renderInlineFormat(bulletText)}
          </li>
        );
      }

      // Standard paragraphs
      return (
        <p key={idx} className="text-xs text-slate-600 leading-relaxed mb-2.5">
          {renderInlineFormat(trimmed)}
        </p>
      );
    });
  };

  // Helper to compile inline formatting like bolding **text**
  const renderInlineFormat = (text: string) => {
    const parts = text.split(/\*\*([\s\S]*?)\*\*/g);
    if (parts.length === 1) return text;
    return parts.map((part, i) => {
      // Every odd index was surrounded by **
      if (i % 2 === 1) {
        return <strong key={i} className="font-extrabold text-slate-900 bg-indigo-50/40 px-1 rounded-sm">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div id="ai-business-insights" className="bg-white rounded-xl border border-slate-100 p-6 shadow-xs flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
            AI Business Insights Report
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Generate an automated business diagnostics analysis using the server-side Gemini 3.5 LLM engine.
          </p>
        </div>
        
        {reportText && (
          <button
            onClick={handleDownloadReport}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export Report (.TXT)
          </button>
        )}
      </div>

      {/* Main viewport */}
      <div className="flex-1 flex flex-col justify-center">
        {!reportText && !loading && !error && (
          <div className="text-center py-10 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <Sparkles className="w-12 h-12 text-indigo-300 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-700">Ready to Analyze Dataset</h4>
            <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto">
              Scan active filters (including region performance, return rates, missed targets, and stockouts) to compile a natural language business diagnosis.
            </p>
            <button
              onClick={generateAIBusinessReport}
              disabled={filteredData.length === 0}
              className="mt-5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-sm inline-flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Generate AI Business Report
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-16 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
            <h4 className="text-sm font-semibold text-slate-700 animate-pulse">Running Server-Side Gemini Intelligence Diagnostics...</h4>
            <p className="text-xs text-slate-400 mt-1.5 max-w-xs">
              This will parse your aggregated retail dimensions and generate real-time actionable feedback. Please hold on.
            </p>
          </div>
        )}

        {error && (
          <div className="border border-rose-100 bg-rose-50 rounded-xl p-5 text-slate-700 max-w-lg mx-auto flex flex-col items-center text-center">
            <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
            <h4 className="text-sm font-bold text-rose-800">Diagnostics Error</h4>
            <p className="text-xs text-rose-600 mt-1.5">{error}</p>
            <p className="text-[11px] text-slate-400 mt-3 bg-white p-2 border border-slate-100 rounded-lg w-full">
              Ensure you have added your **GEMINI_API_KEY** in the Secrets panel inside AI Studio (Settings &gt; Secrets).
            </p>
            <button
              onClick={generateAIBusinessReport}
              className="mt-4 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Retry Generation
            </button>
          </div>
        )}

        {reportText && !loading && !error && (
          <div className="flex flex-col h-full">
            <div className="border border-slate-100 rounded-xl p-5 bg-slate-50/30 overflow-y-auto max-h-[500px] text-left shadow-inner">
              {parseMarkdownToJSX(reportText)}
            </div>
            
            <div className="mt-4 flex items-center gap-2 text-[11px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100/50 p-2 rounded-lg">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Report compiled successfully. Use the button in the top right to save this file offline.</span>
              <button
                onClick={generateAIBusinessReport}
                className="ml-auto text-indigo-600 hover:text-indigo-800 text-[11px] font-bold border-b border-indigo-600 border-dashed cursor-pointer"
              >
                Re-Generate Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
