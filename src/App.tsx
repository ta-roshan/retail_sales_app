/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { LayoutDashboard, FileDown, Download, AlertCircle, Info, Sparkles } from "lucide-react";
import { RetailWeeklySales, StoreMaster, GlobalFilters } from "./types";
import { SAMPLE_STORES, getSampleWeeklySales } from "./data";
import { parseDateToTimestamp } from "./utils";

// Sub-components
import DataIngestionZone from "./components/DataIngestionZone";
import FilterBar from "./components/FilterBar";
import KPICards from "./components/KPICards";
import Visualizations from "./components/Visualizations";
import AIBusinessInsights from "./components/AIBusinessInsights";

export default function App() {
  // Preload with our rich, consistent sample dataset by default
  const [weeklySales, setWeeklySales] = useState<RetailWeeklySales[]>(() => getSampleWeeklySales());
  const [storeMaster, setStoreMaster] = useState<StoreMaster[]>(() => SAMPLE_STORES);
  const [isUsingSampleData, setIsUsingSampleData] = useState(true);
  const [aiReportKey, setAiReportKey] = useState(0);

  // Global filters state
  const [filters, setFilters] = useState<GlobalFilters>({
    weeks: [],
    regions: [],
    stores: [],
    cities: [],
    storeFormats: [],
    productCategories: [],
  });

  const handleWeeklySalesLoaded = (data: RetailWeeklySales[]) => {
    setWeeklySales(data);
    setIsUsingSampleData(false);
    setAiReportKey((prev) => prev + 1);
  };

  const handleStoreMasterLoaded = (data: StoreMaster[]) => {
    setStoreMaster(data);
    setIsUsingSampleData(false);
    setAiReportKey((prev) => prev + 1);
  };

  const handleResetToSample = () => {
    setWeeklySales(getSampleWeeklySales());
    setStoreMaster(SAMPLE_STORES);
    setIsUsingSampleData(true);
    setAiReportKey((prev) => prev + 1);
    // Clear filters as well
    setFilters({
      weeks: [],
      regions: [],
      stores: [],
      cities: [],
      storeFormats: [],
      productCategories: [],
    });
  };

  // 1-to-Many Join: Map properties from storeMaster (Dimension) to weeklySales (Fact) based on store_id
  const fullyResolvedWeeklySales = useMemo(() => {
    if (storeMaster.length === 0) return weeklySales;
    
    return weeklySales.map((sale) => {
      const store = storeMaster.find((s) => s.store_id === sale.store_id);
      if (store) {
        return {
          ...sale,
          // Fallback or map dimension fields to the fact table row to ensure consistency
          store_name: sale.store_name || store.store_name,
          region: sale.region || store.region,
          city: sale.city || store.city,
          store_format: sale.store_format || store.store_format,
        };
      }
      return sale;
    });
  }, [weeklySales, storeMaster]);

  // Compute distinct options dynamically for Filter dropdowns
  const distinctValues = useMemo(() => {
    const weeksSet = new Set<string>();
    const regionsSet = new Set<string>();
    const storesSet = new Set<string>();
    const citiesSet = new Set<string>();
    const storeFormatsSet = new Set<string>();
    const productCategoriesSet = new Set<string>();

    fullyResolvedWeeklySales.forEach((row) => {
      if (row.week_start_date && !row.week_start_date.toLowerCase().includes("invalid")) weeksSet.add(row.week_start_date);
      if (row.region) regionsSet.add(row.region);
      if (row.store_name) storesSet.add(row.store_name);
      if (row.city) citiesSet.add(row.city);
      if (row.store_format) storeFormatsSet.add(row.store_format);
      if (row.product_category) productCategoriesSet.add(row.product_category);
    });

    return {
      weeks: Array.from(weeksSet).sort((a, b) => parseDateToTimestamp(a) - parseDateToTimestamp(b)),
      regions: Array.from(regionsSet).sort(),
      stores: Array.from(storesSet).sort(),
      cities: Array.from(citiesSet).sort(),
      storeFormats: Array.from(storeFormatsSet).sort(),
      productCategories: Array.from(productCategoriesSet).sort(),
    };
  }, [fullyResolvedWeeklySales]);

  // Apply global filters to sales records
  const filteredSales = useMemo(() => {
    return fullyResolvedWeeklySales.filter((row) => {
      if (filters.weeks.length > 0 && !filters.weeks.includes(row.week_start_date)) return false;
      if (filters.regions.length > 0 && !filters.regions.includes(row.region)) return false;
      if (filters.stores.length > 0 && !filters.stores.includes(row.store_name) && !filters.stores.includes(row.store_id)) return false;
      if (filters.cities.length > 0 && !filters.cities.includes(row.city)) return false;
      if (filters.storeFormats.length > 0 && !filters.storeFormats.includes(row.store_format)) return false;
      if (filters.productCategories.length > 0 && !filters.productCategories.includes(row.product_category)) return false;
      return true;
    });
  }, [fullyResolvedWeeklySales, filters]);

  // Compute overall dashboard summary KPI metrics
  const kpiMetrics = useMemo(() => {
    let netSales = 0;
    let salesTarget = 0;
    let totalTransactions = 0;
    let totalReturnsAmount = 0;
    let totalDiscountAmount = 0;
    let totalGrossSales = 0;

    filteredSales.forEach((row) => {
      netSales += row.net_sales;
      salesTarget += row.sales_target;
      totalTransactions += row.transactions;
      totalReturnsAmount += row.returns_amount;
      totalDiscountAmount += row.discount_amount;
      totalGrossSales += row.gross_sales;
    });

    const targetAchievement = salesTarget > 0 ? (netSales / salesTarget) * 100 : 0;
    const averageTransactionValue = totalTransactions > 0 ? netSales / totalTransactions : 0;
    const returnRate = netSales > 0 ? (totalReturnsAmount / netSales) * 100 : 0;
    const discountRate = totalGrossSales > 0 ? (totalDiscountAmount / totalGrossSales) * 100 : 0;

    return {
      netSales,
      salesTarget,
      targetAchievement,
      averageTransactionValue,
      returnRate,
      discountRate,
      totalTransactions,
      totalGrossSales,
      totalDiscountAmount,
      totalReturnsAmount,
    };
  }, [filteredSales]);

  // Export Filtered data as CSV
  const handleExportData = () => {
    if (filteredSales.length === 0) return;
    
    const headers = [
      "week_start_date", "region", "store_id", "store_name", "city", "store_format",
      "product_category", "footfall", "transactions", "units_sold", "gross_sales",
      "discount_amount", "net_sales", "sales_target", "inventory_on_hand",
      "stockouts", "returns_amount", "customer_rating", "marketing_spend"
    ];

    let csvContent = headers.join(",") + "\n";

    filteredSales.forEach((s) => {
      const row = [
        s.week_start_date,
        `"${s.region}"`,
        `"${s.store_id}"`,
        `"${s.store_name}"`,
        `"${s.city}"`,
        `"${s.store_format}"`,
        `"${s.product_category}"`,
        s.footfall,
        s.transactions,
        s.units_sold,
        s.gross_sales,
        s.discount_amount,
        s.net_sales,
        s.sales_target,
        s.inventory_on_hand,
        s.stockouts,
        s.returns_amount,
        s.customer_rating,
        s.marketing_spend
      ];
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `filtered_retail_weekly_sales_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans" id="app-root">
      {/* Top Banner Message for API Key configuration instructions */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 flex justify-between items-center border-b border-slate-800">
        <span className="flex items-center gap-1.5 font-medium">
          <Info className="w-3.5 h-3.5 text-indigo-400" />
          To enable real-time AI Insights, make sure your Gemini API key is active in the <strong>Secrets</strong> panel.
        </span>
        <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-md font-mono text-slate-400">
          models/gemini-3.5-flash
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* Header Dashboard Controls */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-xl border border-slate-100 p-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-xs">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Retail Analytics Command Center</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Executive Sales, Target Achievements, and AI Intelligence Dashboard
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportData}
              disabled={filteredSales.length === 0}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export Dashboard Data (.CSV)
            </button>
          </div>
        </header>

        {/* 1. Data Ingestion Zone */}
        <section id="section-data-ingestion">
          <DataIngestionZone
            onWeeklySalesLoaded={handleWeeklySalesLoaded}
            onStoreMasterLoaded={handleStoreMasterLoaded}
            onResetToSample={handleResetToSample}
            weeklySalesCount={weeklySales.length}
            storeMasterCount={storeMaster.length}
            isUsingSampleData={isUsingSampleData}
          />
        </section>

        {/* 2. Global Filters & Controls */}
        <section id="section-filters">
          <FilterBar
            filters={filters}
            onChange={setFilters}
            distinctValues={distinctValues}
          />
        </section>

        {/* 3. KPI Cards */}
        <section id="section-kpis">
          <KPICards metrics={kpiMetrics} />
        </section>

        {/* 4. Split Dashboard Grid: Charts and AI Intelligence */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-main-grid">
          {/* Visualizations - 7/12 width */}
          <div className="lg:col-span-7 space-y-6" id="grid-visualizations">
            <Visualizations data={filteredSales} />
          </div>

          {/* AI Intelligence - 5/12 width */}
          <div className="lg:col-span-5" id="grid-ai-insights">
            <AIBusinessInsights
              key={aiReportKey}
              filteredData={filteredSales}
              overallMetrics={kpiMetrics}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
