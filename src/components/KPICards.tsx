/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { DollarSign, Percent, TrendingUp, Undo2, Tag, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { KPIMetrics } from "../types";

interface KPICardsProps {
  metrics: KPIMetrics;
}

export default function KPICards({ metrics }: KPICardsProps) {
  // Format currency helpers
  const formatCurrency = (val: number) => {
    if (val >= 1000000) {
      return `$${(val / 1000000).toFixed(2)}M`;
    }
    if (val >= 1000) {
      return `$${(val / 1000).toFixed(1)}k`;
    }
    return `$${val.toFixed(2)}`;
  };

  const targetAchColor = 
    metrics.targetAchievement >= 100 
      ? { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-100", bar: "bg-emerald-500" }
      : metrics.targetAchievement >= 85
        ? { text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-100", bar: "bg-amber-500" }
        : { text: "text-rose-700", bg: "bg-rose-50", border: "border-rose-100", bar: "bg-rose-500" };

  return (
    <div id="kpi-cards-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Net Sales */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Sales</span>
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <span className="text-2xl font-bold text-slate-800 tracking-tight block">
            {formatCurrency(metrics.netSales)}
          </span>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[10px] font-semibold text-slate-400">
              Gross: {formatCurrency(metrics.totalGrossSales)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Target Achievement % */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target Achievement</span>
          <div className={`p-2 rounded-lg ${targetAchColor.bg} ${targetAchColor.text}`}>
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <span className="text-2xl font-bold text-slate-800 tracking-tight block">
            {metrics.targetAchievement.toFixed(1)}%
          </span>
          <div className="flex flex-col gap-1.5 mt-2 w-full">
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${targetAchColor.bar} transition-all duration-500`}
                style={{ width: `${Math.min(metrics.targetAchievement, 100)}%` }}
              ></div>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 block truncate">
              Target: {formatCurrency(metrics.salesTarget)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Average Transaction Value (ATV) */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Transaction Value</span>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <span className="text-2xl font-bold text-slate-800 tracking-tight block">
            ${metrics.averageTransactionValue.toFixed(2)}
          </span>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[10px] font-semibold text-slate-400">
              Txns: {metrics.totalTransactions.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Return Rate % */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Return Rate</span>
          <div className={`p-2 rounded-lg ${metrics.returnRate > 8 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
            <Undo2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <span className="text-2xl font-bold text-slate-800 tracking-tight block">
            {metrics.returnRate.toFixed(2)}%
          </span>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[10px] font-semibold text-slate-400 block truncate">
              Returns: {formatCurrency(metrics.totalReturnsAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Discount Rate % */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Discount Rate</span>
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
            <Tag className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <span className="text-2xl font-bold text-slate-800 tracking-tight block">
            {metrics.discountRate.toFixed(2)}%
          </span>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[10px] font-semibold text-slate-400 block truncate">
              Discounts: {formatCurrency(metrics.totalDiscountAmount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
