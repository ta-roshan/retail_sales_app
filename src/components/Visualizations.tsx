/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
} from "recharts";
import { RetailWeeklySales } from "../types";
import { TrendingUp, Map, LayoutGrid, Award, AlertTriangle } from "lucide-react";

interface VisualizationsProps {
  data: RetailWeeklySales[];
}

export default function Visualizations({ data }: VisualizationsProps) {
  // Common colors for pie slices and categories
  const COLORS = ["#6366f1", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899"];

  // Helper to format currency
  const formatYAxis = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
    return `$${val}`;
  };

  // 1. Weekly Trend: Net Sales vs. Sales Target
  const weeklyTrendData = useMemo(() => {
    const grouped: Record<string, { week: string; netSales: number; target: number }> = {};
    data.forEach((row) => {
      const week = row.week_start_date;
      if (!grouped[week]) {
        grouped[week] = { week, netSales: 0, target: 0 };
      }
      grouped[week].netSales += row.net_sales;
      grouped[week].target += row.sales_target;
    });

    return Object.values(grouped).sort((a, b) => a.week.localeCompare(b.week));
  }, [data]);

  // 2. Sales by Region: Pie/Donut Chart
  const regionalSalesData = useMemo(() => {
    const grouped: Record<string, number> = {};
    data.forEach((row) => {
      grouped[row.region] = (grouped[row.region] || 0) + row.net_sales;
    });

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  // 3. Category Performance: Horizontal Bar Chart
  const categoryData = useMemo(() => {
    const grouped: Record<string, number> = {};
    data.forEach((row) => {
      grouped[row.product_category] = (grouped[row.product_category] || 0) + row.net_sales;
    });

    return Object.entries(grouped)
      .map(([category, netSales]) => ({ category, netSales: Math.round(netSales) }))
      .sort((a, b) => b.netSales - a.netSales); // Sort descending (ascending here for horizontal ranking)
  }, [data]);

  // 4. Store Leaderboard: Ranked Bar Chart
  const storeLeaderboardData = useMemo(() => {
    const grouped: Record<string, { store_name: string; net_sales: number; sales_target: number }> = {};
    data.forEach((row) => {
      if (!grouped[row.store_id]) {
        grouped[row.store_id] = { store_name: row.store_name, net_sales: 0, sales_target: 0 };
      }
      grouped[row.store_id].net_sales += row.net_sales;
      grouped[row.store_id].sales_target += row.sales_target;
    });

    return Object.values(grouped)
      .map((store) => ({
        storeName: store.store_name,
        netSales: Math.round(store.net_sales),
        achievement: store.sales_target > 0 ? Math.round((store.net_sales / store.sales_target) * 100) : 0,
      }))
      .sort((a, b) => b.netSales - a.netSales)
      .slice(0, 8); // Top 8 stores
  }, [data]);

  // 5. Stockout Risk Combo Chart: Inventory on Hand vs Stockouts by Category
  const stockoutRiskData = useMemo(() => {
    const grouped: Record<string, { category: string; stockouts: number; inventory: number }> = {};
    data.forEach((row) => {
      const cat = row.product_category;
      if (!grouped[cat]) {
        grouped[cat] = { category: cat, stockouts: 0, inventory: 0 };
      }
      grouped[cat].stockouts += row.stockouts;
      grouped[cat].inventory += row.inventory_on_hand;
    });

    return Object.values(grouped).map(item => ({
      category: item.category,
      inventory: Math.round(item.inventory),
      stockouts: item.stockouts
    }));
  }, [data]);

  const hasData = data.length > 0;

  if (!hasData) {
    return (
      <div className="bg-slate-50 rounded-xl p-12 text-center text-slate-400 border border-slate-100 flex flex-col items-center justify-center min-h-[300px]">
        <AlertTriangle className="w-10 h-10 text-slate-300 mb-2" />
        <p className="text-sm font-medium">No sales data matches the active filters.</p>
        <p className="text-xs text-slate-400 mt-1">Please adjust your filters or reset to preloaded sample data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="dashboard-visualizations-section">
      {/* Row 1: Weekly Trend and Region */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Trend (Line) - 2/3 Width */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-5 shadow-xs flex flex-col">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            Weekly Net Sales Trend vs Target Achievement
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="week" tickMargin={8} style={{ fontSize: 10, fontWeight: 500, fill: "#64748b" }} />
                <YAxis tickFormatter={formatYAxis} tickMargin={8} style={{ fontSize: 10, fontWeight: 500, fill: "#64748b" }} />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                  contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }} 
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 500, paddingTop: 10 }} />
                <Line
                  type="monotone"
                  name="Net Sales ($)"
                  dataKey="netSales"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  activeDot={{ r: 6 }}
                  dot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  name="Sales Target ($)"
                  dataKey="target"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Region (Donut) - 1/3 Width */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs flex flex-col">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <Map className="w-4 h-4 text-indigo-500" />
            Sales Contribution by Region
          </h3>
          <div className="h-72 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={regionalSalesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {regionalSalesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Net Sales"]}
                  contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }} 
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Donut center absolute label */}
            <div className="absolute text-center pointer-events-none">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Filtered</span>
              <span className="block text-lg font-extrabold text-slate-800">
                ${Math.round(regionalSalesData.reduce((acc, curr) => acc + curr.value, 0)).toLocaleString()}
              </span>
            </div>
          </div>
          
          {/* Pie legends layout */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {regionalSalesData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                <span className="truncate">{entry.name}</span>
                <span className="text-[10px] text-slate-400 font-bold ml-auto">
                  {((entry.value / regionalSalesData.reduce((acc, curr) => acc + curr.value, 0)) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Category and Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Performance (Horizontal Bar Chart) */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs flex flex-col">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <LayoutGrid className="w-4 h-4 text-indigo-500" />
            Category Revenue Performance
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData}
                layout="vertical"
                margin={{ top: 10, right: 15, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tickFormatter={formatYAxis} tickMargin={8} style={{ fontSize: 10, fontWeight: 500, fill: "#64748b" }} />
                <YAxis dataKey="category" type="category" width={80} style={{ fontSize: 10, fontWeight: 600, fill: "#475569" }} />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Net Sales"]}
                  contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }} 
                />
                <Bar dataKey="netSales" radius={[0, 6, 6, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Store Leaderboard (Vertical Bar Chart with Achievements) */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs flex flex-col">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-indigo-500" />
            Store Leaderboard (Top 8 Stores by Net Sales)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={storeLeaderboardData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="storeName" tickMargin={8} style={{ fontSize: 10, fontWeight: 500, fill: "#64748b" }} />
                <YAxis tickFormatter={formatYAxis} tickMargin={8} style={{ fontSize: 10, fontWeight: 500, fill: "#64748b" }} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-md text-xs space-y-1">
                          <p className="font-bold text-slate-800">{item.storeName}</p>
                          <p className="text-slate-600">Net Sales: <span className="font-semibold">${item.netSales.toLocaleString()}</span></p>
                          <p className="text-slate-600">Target Achievement: <span className={`font-semibold ${item.achievement >= 100 ? "text-emerald-600" : item.achievement >= 85 ? "text-amber-500" : "text-rose-500"}`}>{item.achievement}%</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="netSales" fill="#6366f1" radius={[6, 6, 0, 0]} name="Net Sales ($)">
                  {storeLeaderboardData.map((entry, index) => {
                    const isStar = entry.achievement >= 100;
                    const isStruggling = entry.achievement < 85;
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={isStar ? "#10b981" : isStruggling ? "#f43f5e" : "#6366f1"} 
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 justify-center mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-emerald-500"></span>
              <span>Met Target (≥100%)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-indigo-500"></span>
              <span>Caution (85% - 99%)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-rose-500"></span>
              <span>Underperforming (&lt;85%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Stockout Risk Combo Chart (Inventory vs Stockouts) */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs flex flex-col">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-indigo-500" />
          Stockout Risk & Inventory Health Analysis by Product Category
        </h3>
        <p className="text-xs text-slate-500 mb-4 -mt-2">
          An critical dual-axis index: comparing the <strong>Inventory on Hand</strong> (blue bars, left axis) against the count of <strong>Stockout Events</strong> (rose line, right axis) to identify logistics and replenishment gaps.
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={stockoutRiskData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="category" tickMargin={8} style={{ fontSize: 10, fontWeight: 600, fill: "#475569" }} />
              <YAxis yAxisId="left" tickMargin={8} style={{ fontSize: 10, fontWeight: 500, fill: "#3b82f6" }} name="Inventory on Hand" />
              <YAxis yAxisId="right" orientation="right" tickMargin={8} style={{ fontSize: 10, fontWeight: 500, fill: "#f43f5e" }} name="Stockout Incidents" />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-md text-xs space-y-1">
                        <p className="font-bold text-slate-800">{item.category}</p>
                        <p className="text-blue-600 font-semibold">Inventory on Hand: {item.inventory.toLocaleString()} units</p>
                        <p className="text-rose-500 font-semibold">Stockout Incidents: {item.stockouts} events</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 500, paddingTop: 10 }} />
              <Bar yAxisId="left" dataKey="inventory" name="On Hand Inventory (Units)" fill="#3b82f6" fillOpacity={0.7} radius={[4, 4, 0, 0]} barSize={40} />
              <Line yAxisId="right" type="monotone" dataKey="stockouts" name="Stockout Events" stroke="#f43f5e" strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 4, stroke: "#ffffff", strokeWidth: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
