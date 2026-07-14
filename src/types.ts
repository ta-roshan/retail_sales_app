/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RetailWeeklySales {
  week_start_date: string; // YYYY-MM-DD
  region: string;
  store_id: string;
  store_name: string;
  city: string;
  store_format: string;
  product_category: string;
  footfall: number;
  transactions: number;
  units_sold: number;
  gross_sales: number;
  discount_amount: number;
  net_sales: number;
  sales_target: number;
  inventory_on_hand: number;
  stockouts: number;
  returns_amount: number;
  customer_rating: number;
  marketing_spend: number;
}

export interface StoreMaster {
  store_id: string;
  store_name: string;
  region: string;
  city: string;
  store_format: string;
}

export interface GlobalFilters {
  weeks: string[]; // selected values (if empty, no filter or all)
  regions: string[];
  stores: string[];
  cities: string[];
  storeFormats: string[];
  productCategories: string[];
}

export interface KPIMetrics {
  netSales: number;
  salesTarget: number;
  targetAchievement: number; // percentage (netSales / salesTarget) * 100
  averageTransactionValue: number; // netSales / transactions
  returnRate: number; // (returnsAmount / netSales) * 100
  discountRate: number; // (discountAmount / grossSales) * 100
  totalTransactions: number;
  totalGrossSales: number;
  totalDiscountAmount: number;
  totalReturnsAmount: number;
}
