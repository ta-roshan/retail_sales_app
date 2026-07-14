/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RetailWeeklySales, StoreMaster } from "./types";

export const SAMPLE_STORES: StoreMaster[] = [
  { store_id: "STR-001", store_name: "NYC Times Square", region: "East", city: "New York", store_format: "Flagship" },
  { store_id: "STR-002", store_name: "LA Santa Monica", region: "West", city: "Los Angeles", store_format: "Supercenter" },
  { store_id: "STR-003", store_name: "Chicago Loop", region: "Central", city: "Chicago", store_format: "Express" },
  { store_id: "STR-004", store_name: "Houston Galleria", region: "South", city: "Houston", store_format: "Mall Store" },
  { store_id: "STR-005", store_name: "Atlanta Midtown", region: "South", city: "Atlanta", store_format: "Boutique" },
  { store_id: "STR-006", store_name: "Seattle Downtown", region: "West", city: "Seattle", store_format: "Flagship" },
  { store_id: "STR-007", store_name: "Dallas Center", region: "Central", city: "Dallas", store_format: "Supercenter" },
  { store_id: "STR-008", store_name: "Boston Back Bay", region: "East", city: "Boston", store_format: "Boutique" },
];

export function getSampleWeeklySales(): RetailWeeklySales[] {
  const weeks = [
    "01-06-2026",
    "08-06-2026",
    "15-06-2026",
    "22-06-2026",
    "29-06-2026",
    "06-07-2026"
  ];

  const categories = ["Electronics", "Apparel", "Groceries", "Home Goods"];

  const salesData: RetailWeeklySales[] = [];

  weeks.forEach((week) => {
    SAMPLE_STORES.forEach((store) => {
      categories.forEach((category) => {
        // Build correlated, realistic data
        let baseFootfall = 1200;
        let conversionRate = 0.35;
        let averageUnitVal = 45;
        
        // Differentiate by store format and category
        if (store.store_format === "Supercenter") {
          baseFootfall = 2500;
          conversionRate = 0.42;
        } else if (store.store_format === "Flagship") {
          baseFootfall = 1800;
          conversionRate = 0.38;
        } else if (store.store_format === "Express") {
          baseFootfall = 800;
          conversionRate = 0.50; // high conversion
        }

        if (category === "Electronics") {
          averageUnitVal = 220;
          conversionRate *= 0.6; // lower conversion for high price
        } else if (category === "Groceries") {
          averageUnitVal = 18;
          conversionRate *= 1.3; // higher conversion for essentials
        } else if (category === "Apparel") {
          averageUnitVal = 60;
        }

        // Store performance scaling factor to trigger interesting alerts:
        // Atlanta Midtown (STR-005) is struggling, missing target by >20%
        // NYC Times Square (STR-001) is crushing it
        let performanceScale = 1.0;
        if (store.store_id === "STR-005") {
          performanceScale = 0.68; // Underperformer
        } else if (store.store_id === "STR-001") {
          performanceScale = 1.25; // Star performer
        } else if (store.store_id === "STR-003") {
          performanceScale = 0.95;
        }

        // Add some random variation
        const randomFactor = 0.85 + Math.random() * 0.3; // 85% to 115%
        const finalScale = performanceScale * randomFactor;

        const footfall = Math.round(baseFootfall * (0.9 + Math.random() * 0.2));
        const transactions = Math.round(footfall * conversionRate * (0.9 + Math.random() * 0.15));
        const units_sold = Math.round(transactions * (1.2 + Math.random() * 0.8));
        
        const gross_sales = Math.round(units_sold * averageUnitVal * finalScale * 100) / 100;
        
        // Discounts: Flagship has low discounts, Boutique has medium, Supercenter has promotional ones
        let discountRate = 0.08;
        if (store.store_format === "Supercenter") discountRate = 0.14;
        if (store.store_format === "Boutique") discountRate = 0.05;
        
        const discount_amount = Math.round(gross_sales * discountRate * (0.7 + Math.random() * 0.6) * 100) / 100;
        const net_sales = Math.round((gross_sales - discount_amount) * 100) / 100;
        
        // Sales Target: let's make it fixed but realistic
        let baseCategoryTarget = 15000;
        if (category === "Electronics") baseCategoryTarget = 30000;
        if (category === "Groceries") baseCategoryTarget = 20000;
        if (category === "Home Goods") baseCategoryTarget = 12000;
        if (store.store_format === "Supercenter") baseCategoryTarget *= 1.8;
        if (store.store_format === "Flagship") baseCategoryTarget *= 1.4;

        const sales_target = Math.round(baseCategoryTarget * performanceScale);

        // Inventory on hand & Stockouts
        let inventory_on_hand = Math.round(units_sold * (1.5 + Math.random() * 3));
        let stockouts = 0;
        
        // Trigger stockout issue in Electronics for certain stores
        if (category === "Electronics" && Math.random() > 0.65) {
          inventory_on_hand = Math.round(units_sold * 0.2); // too low
          stockouts = Math.floor(2 + Math.random() * 8);
        } else if (Math.random() > 0.92) {
          stockouts = Math.floor(1 + Math.random() * 3);
        }

        // Returns: Apparel has very high returns (10-15%), Groceries low (<1%)
        let returnRate = 0.04;
        if (category === "Apparel") returnRate = 0.12;
        if (category === "Groceries") returnRate = 0.005;
        if (category === "Electronics") returnRate = 0.05;

        const returns_amount = Math.round(net_sales * returnRate * (0.5 + Math.random() * 1.0) * 100) / 100;
        
        // Customer rating: NYC flagship is high (4.7), Seattle high (4.6), Atlanta struggles (3.8)
        let baseRating = 4.3;
        if (store.store_id === "STR-001") baseRating = 4.8;
        if (store.store_id === "STR-005") baseRating = 3.6;
        const customer_rating = Math.round((baseRating + (Math.random() * 0.4 - 0.2)) * 10) / 10;

        const marketing_spend = Math.round((gross_sales * 0.05 * (0.8 + Math.random() * 0.4)) * 100) / 100;

        salesData.push({
          week_start_date: week,
          region: store.region,
          store_id: store.store_id,
          store_name: store.store_name,
          city: store.city,
          store_format: store.store_format,
          product_category: category,
          footfall,
          transactions,
          units_sold,
          gross_sales,
          discount_amount,
          net_sales,
          sales_target,
          inventory_on_hand,
          stockouts,
          returns_amount,
          customer_rating,
          marketing_spend
        });
      });
    });
  });

  return salesData;
}

// Generates string representation of Store Master template CSV
export function getStoreMasterCsvTemplate(): string {
  let csv = "store_id,store_name,region,city,store_format\n";
  SAMPLE_STORES.forEach((s) => {
    csv += `"${s.store_id}","${s.store_name}","${s.region}","${s.city}","${s.store_format}"\n`;
  });
  return csv;
}

// Generates string representation of Weekly Sales template CSV
export function getWeeklySalesCsvTemplate(): string {
  const sales = getSampleWeeklySales().slice(0, 48); // limit template download length to keep it clean
  let csv = "week_start_date,region,store_id,store_name,city,store_format,product_category,footfall,transactions,units_sold,gross_sales,discount_amount,net_sales,sales_target,inventory_on_hand,stockouts,returns_amount,customer_rating,marketing_spend\n";
  sales.forEach((s) => {
    csv += `${s.week_start_date},"${s.region}","${s.store_id}","${s.store_name}","${s.city}","${s.store_format}","${s.product_category}",${s.footfall},${s.transactions},${s.units_sold},${s.gross_sales},${s.discount_amount},${s.net_sales},${s.sales_target},${s.inventory_on_hand},${s.stockouts},${s.returns_amount},${s.customer_rating},${s.marketing_spend}\n`;
  });
  return csv;
}
