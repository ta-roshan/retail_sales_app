/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from "react";
import Papa from "papaparse";
import { read, utils } from "xlsx";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw, FileDown } from "lucide-react";
import { RetailWeeklySales, StoreMaster } from "../types";
import { getStoreMasterCsvTemplate, getWeeklySalesCsvTemplate } from "../data";
import { parseNumeric, normalizeDateToDDMMYYYY } from "../utils";

interface DataIngestionZoneProps {
  onWeeklySalesLoaded: (data: RetailWeeklySales[]) => void;
  onStoreMasterLoaded: (data: StoreMaster[]) => void;
  onResetToSample: () => void;
  weeklySalesCount: number;
  storeMasterCount: number;
  isUsingSampleData: boolean;
}

export default function DataIngestionZone({
  onWeeklySalesLoaded,
  onStoreMasterLoaded,
  onResetToSample,
  weeklySalesCount,
  storeMasterCount,
  isUsingSampleData,
}: DataIngestionZoneProps) {
  const [salesError, setSalesError] = useState<string | null>(null);
  const [masterError, setMasterError] = useState<string | null>(null);
  const [isSalesDragging, setIsSalesDragging] = useState(false);
  const [isMasterDragging, setIsMasterDragging] = useState(false);

  const salesFileInputRef = useRef<HTMLInputElement>(null);
  const masterFileInputRef = useRef<HTMLInputElement>(null);

  const MANDATORY_SALES_COLUMNS = [
    "week_start_date", "region", "store_id", "store_name", "city", "store_format",
    "product_category", "footfall", "transactions", "units_sold", "gross_sales",
    "discount_amount", "net_sales", "sales_target", "inventory_on_hand",
    "stockouts", "returns_amount", "customer_rating", "marketing_spend"
  ];

  const MANDATORY_MASTER_COLUMNS = [
    "store_id", "store_name", "region", "city", "store_format"
  ];

  // Excel parser for Weekly Sales
  const parseExcelSales = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = utils.sheet_to_json(worksheet, { defval: "" });

        if (jsonData.length === 0) {
          setSalesError("The Excel sheet appears to be empty.");
          return;
        }

        const headers = Object.keys(jsonData[0] as object).map(h => h.trim());
        const missing = MANDATORY_SALES_COLUMNS.filter(col => !headers.includes(col));
        
        if (missing.length > 0) {
          setSalesError(`Missing mandatory columns: ${missing.join(", ")}`);
          return;
        }

        const validData = jsonData.map((row: any) => {
          return {
            week_start_date: normalizeDateToDDMMYYYY(row.week_start_date),
            region: String(row.region || "").trim(),
            store_id: String(row.store_id || "").trim(),
            store_name: String(row.store_name || "").trim(),
            city: String(row.city || "").trim(),
            store_format: String(row.store_format || "").trim(),
            product_category: String(row.product_category || "").trim(),
            footfall: parseNumeric(row.footfall),
            transactions: parseNumeric(row.transactions),
            units_sold: parseNumeric(row.units_sold),
            gross_sales: parseNumeric(row.gross_sales),
            discount_amount: parseNumeric(row.discount_amount),
            net_sales: parseNumeric(row.net_sales),
            sales_target: parseNumeric(row.sales_target),
            inventory_on_hand: parseNumeric(row.inventory_on_hand),
            stockouts: parseNumeric(row.stockouts),
            returns_amount: parseNumeric(row.returns_amount),
            customer_rating: parseNumeric(row.customer_rating),
            marketing_spend: parseNumeric(row.marketing_spend),
          };
        }) as RetailWeeklySales[];

        onWeeklySalesLoaded(validData);
      } catch (err: any) {
        setSalesError(`Failed to parse Excel file: ${err.message}`);
      }
    };
    reader.onerror = () => {
      setSalesError("Failed to read the Excel file.");
    };
    reader.readAsArrayBuffer(file);
  };

  // Excel parser for Store Master
  const parseExcelMaster = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = utils.sheet_to_json(worksheet, { defval: "" });

        if (jsonData.length === 0) {
          setMasterError("The Excel sheet appears to be empty.");
          return;
        }

        const headers = Object.keys(jsonData[0] as object).map(h => h.trim());
        const missing = MANDATORY_MASTER_COLUMNS.filter(col => !headers.includes(col));
        
        if (missing.length > 0) {
          setMasterError(`Missing mandatory columns: ${missing.join(", ")}`);
          return;
        }

        const validData = jsonData.map((row: any) => {
          return {
            store_id: String(row.store_id || ""),
            store_name: String(row.store_name || ""),
            region: String(row.region || ""),
            city: String(row.city || ""),
            store_format: String(row.store_format || ""),
          };
        }) as StoreMaster[];

        onStoreMasterLoaded(validData);
      } catch (err: any) {
        setMasterError(`Failed to parse Excel file: ${err.message}`);
      }
    };
    reader.onerror = () => {
      setMasterError("Failed to read the Excel file.");
    };
    reader.readAsArrayBuffer(file);
  };

  const validateAndParseSales = (file: File) => {
    setSalesError(null);
    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
    
    if (isExcel) {
      parseExcelSales(file);
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        const headers = (results.meta.fields || []).map(h => h.trim());
        const missing = MANDATORY_SALES_COLUMNS.filter(col => !headers.includes(col));
        
        if (missing.length > 0) {
          setSalesError(`Missing mandatory columns: ${missing.join(", ")}`);
          return;
        }

        const validData = results.data.map((row: any) => {
          return {
            week_start_date: normalizeDateToDDMMYYYY(row.week_start_date),
            region: String(row.region || "").trim(),
            store_id: String(row.store_id || "").trim(),
            store_name: String(row.store_name || "").trim(),
            city: String(row.city || "").trim(),
            store_format: String(row.store_format || "").trim(),
            product_category: String(row.product_category || "").trim(),
            footfall: parseNumeric(row.footfall),
            transactions: parseNumeric(row.transactions),
            units_sold: parseNumeric(row.units_sold),
            gross_sales: parseNumeric(row.gross_sales),
            discount_amount: parseNumeric(row.discount_amount),
            net_sales: parseNumeric(row.net_sales),
            sales_target: parseNumeric(row.sales_target),
            inventory_on_hand: parseNumeric(row.inventory_on_hand),
            stockouts: parseNumeric(row.stockouts),
            returns_amount: parseNumeric(row.returns_amount),
            customer_rating: parseNumeric(row.customer_rating),
            marketing_spend: parseNumeric(row.marketing_spend),
          };
        }) as RetailWeeklySales[];

        onWeeklySalesLoaded(validData);
      },
      error: (err) => {
        setSalesError(`Failed to parse file: ${err.message}`);
      }
    });
  };

  const validateAndParseMaster = (file: File) => {
    setMasterError(null);
    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
    
    if (isExcel) {
      parseExcelMaster(file);
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        const headers = (results.meta.fields || []).map(h => h.trim());
        const missing = MANDATORY_MASTER_COLUMNS.filter(col => !headers.includes(col));
        
        if (missing.length > 0) {
          setMasterError(`Missing mandatory columns: ${missing.join(", ")}`);
          return;
        }

        const validData = results.data.map((row: any) => {
          return {
            store_id: String(row.store_id || ""),
            store_name: String(row.store_name || ""),
            region: String(row.region || ""),
            city: String(row.city || ""),
            store_format: String(row.store_format || ""),
          };
        }) as StoreMaster[];

        onStoreMasterLoaded(validData);
      },
      error: (err) => {
        setMasterError(`Failed to parse file: ${err.message}`);
      }
    });
  };

  const handleDownloadTemplate = (type: "sales" | "master") => {
    const csvContent = type === "sales" ? getWeeklySalesCsvTemplate() : getStoreMasterCsvTemplate();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", type === "sales" ? "retail_weekly_sales_template.csv" : "store_master_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="data-ingestion-zone" className="bg-white rounded-xl border border-slate-100 p-6 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-500" />
            Data Ingestion Control
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Ingest and validate your store configurations and weekly sales records via CSV or Excel sheets.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isUsingSampleData && (
            <button
              onClick={onResetToSample}
              className="px-3 py-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset to Sample Data
            </button>
          )}
          {isUsingSampleData && (
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              Using Preloaded Live Sample Data
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dataset 1: Store Master */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">1. Store Master (Dimension Table)</span>
            <button 
              onClick={() => handleDownloadTemplate("master")}
              className="text-indigo-600 hover:text-indigo-800 text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" />
              Download CSV Template
            </button>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setIsMasterDragging(true); }}
            onDragLeave={() => setIsMasterDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsMasterDragging(false);
              if (e.dataTransfer.files?.[0]) validateAndParseMaster(e.dataTransfer.files[0]);
            }}
            onClick={() => masterFileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
              isMasterDragging 
                ? "border-indigo-500 bg-indigo-50/50" 
                : storeMasterCount > 0 
                  ? "border-emerald-300 bg-emerald-50/10 hover:border-emerald-400" 
                  : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50/40"
            }`}
          >
            <input
              type="file"
              ref={masterFileInputRef}
              onChange={(e) => {
                if (e.target.files?.[0]) validateAndParseMaster(e.target.files[0]);
              }}
              accept=".csv, .xlsx, .xls"
              className="hidden"
            />
            
            {storeMasterCount > 0 ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
            ) : (
              <FileSpreadsheet className="w-8 h-8 text-slate-400 mb-2" />
            )}

            <span className="text-sm font-medium text-slate-700">
              {storeMasterCount > 0 ? `Loaded ${storeMasterCount} Store records` : "Drag Store Master CSV/Excel here or click"}
            </span>
            <span className="text-xs text-slate-400 mt-1">
              Supports CSV, XLSX, XLS. Requires columns: store_id, store_name, region, city, store_format
            </span>
          </div>

          {masterError && (
            <div className="mt-2 text-xs text-rose-500 bg-rose-50 border border-rose-100 rounded-lg p-2.5 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{masterError}</span>
            </div>
          )}
        </div>

        {/* Dataset 2: Weekly Sales */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">2. Retail Weekly Sales (Fact Table)</span>
            <button 
              onClick={() => handleDownloadTemplate("sales")}
              className="text-indigo-600 hover:text-indigo-800 text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" />
              Download CSV Template
            </button>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setIsSalesDragging(true); }}
            onDragLeave={() => setIsSalesDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsSalesDragging(false);
              if (e.dataTransfer.files?.[0]) validateAndParseSales(e.dataTransfer.files[0]);
            }}
            onClick={() => salesFileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
              isSalesDragging 
                ? "border-indigo-500 bg-indigo-50/50" 
                : weeklySalesCount > 0 
                  ? "border-emerald-300 bg-emerald-50/10 hover:border-emerald-400" 
                  : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50/40"
            }`}
          >
            <input
              type="file"
              ref={salesFileInputRef}
              onChange={(e) => {
                if (e.target.files?.[0]) validateAndParseSales(e.target.files[0]);
              }}
              accept=".csv, .xlsx, .xls"
              className="hidden"
            />
            
            {weeklySalesCount > 0 ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
            ) : (
              <FileSpreadsheet className="w-8 h-8 text-slate-400 mb-2" />
            )}

            <span className="text-sm font-medium text-slate-700">
              {weeklySalesCount > 0 ? `Loaded ${weeklySalesCount} Weekly Sales rows` : "Drag Weekly Sales CSV/Excel here or click"}
            </span>
            <span className="text-xs text-slate-400 mt-1">
              Supports CSV, XLSX, XLS. Requires 19 metric and dimensional columns (Net sales, footfall, etc.)
            </span>
          </div>

          {salesError && (
            <div className="mt-2 text-xs text-rose-500 bg-rose-50 border border-rose-100 rounded-lg p-2.5 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{salesError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
