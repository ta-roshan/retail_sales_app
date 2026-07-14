/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Filter, ChevronDown, Check, X, RotateCcw } from "lucide-react";
import { GlobalFilters } from "../types";

interface FilterBarProps {
  filters: GlobalFilters;
  onChange: (updatedFilters: GlobalFilters) => void;
  distinctValues: {
    weeks: string[];
    regions: string[];
    stores: string[];
    cities: string[];
    storeFormats: string[];
    productCategories: string[];
  };
}

export default function FilterBar({ filters, onChange, distinctValues }: FilterBarProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const handleSelectAll = (key: keyof GlobalFilters, values: string[]) => {
    onChange({
      ...filters,
      [key]: values,
    });
  };

  const handleClearAll = (key: keyof GlobalFilters) => {
    onChange({
      ...filters,
      [key]: [],
    });
  };

  const handleToggleValue = (key: keyof GlobalFilters, value: string) => {
    const current = filters[key] as string[];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    
    onChange({
      ...filters,
      [key]: updated,
    });
  };

  const handleResetFilters = () => {
    onChange({
      weeks: [],
      regions: [],
      stores: [],
      cities: [],
      storeFormats: [],
      productCategories: [],
    });
  };

  const isFilterActive = 
    filters.weeks.length > 0 ||
    filters.regions.length > 0 ||
    filters.stores.length > 0 ||
    filters.cities.length > 0 ||
    filters.storeFormats.length > 0 ||
    filters.productCategories.length > 0;

  const getFilterSummary = (selected: string[], all: string[]) => {
    if (selected.length === 0 || selected.length === all.length) {
      return "All";
    }
    if (selected.length === 1) {
      return selected[0];
    }
    return `${selected.length} Selected`;
  };

  // Helper for rendering a multi-select dropdown
  const renderDropdown = (
    label: string,
    key: keyof GlobalFilters,
    options: string[],
    selectedValues: string[]
  ) => {
    const isOpen = activeDropdown === key;
    const isFiltered = selectedValues.length > 0 && selectedValues.length < options.length;
    const summary = getFilterSummary(selectedValues, options);

    return (
      <div className="relative flex-1 min-w-[160px]" id={`filter-dropdown-${key}`}>
        <button
          onClick={() => toggleDropdown(isOpen ? "" : key)}
          className={`w-full flex items-center justify-between px-3 py-2 bg-white border rounded-xl text-xs font-medium text-left transition-all cursor-pointer ${
            isFiltered 
              ? "border-indigo-400 text-indigo-700 ring-1 ring-indigo-400" 
              : "border-slate-200 text-slate-700 hover:border-slate-300"
          }`}
        >
          <div className="truncate pr-1">
            <span className="text-slate-400 text-[10px] block font-semibold uppercase tracking-wider mb-0.5">{label}</span>
            <span className="font-semibold block truncate">{summary}</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute left-0 mt-1 w-64 max-h-72 bg-white border border-slate-100 rounded-xl shadow-lg z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 border-b border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Select {label}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSelectAll(key, options)}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={() => handleClearAll(key)}
                  className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto p-1.5 max-h-48">
              {options.length === 0 ? (
                <div className="text-xs text-slate-400 py-4 text-center">No options available</div>
              ) : (
                options.map((opt) => {
                  const isChecked = selectedValues.includes(opt) || selectedValues.length === 0;
                  return (
                    <button
                      key={opt}
                      onClick={() => handleToggleValue(key, opt)}
                      className="w-full flex items-center justify-between px-2.5 py-2 hover:bg-slate-50 rounded-lg text-xs font-medium text-slate-700 transition-colors text-left"
                    >
                      <span className="truncate pr-2">{opt || "Unknown"}</span>
                      {selectedValues.includes(opt) && (
                        <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={containerRef} id="global-filters" className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-800">Global Dashboard Filters</h3>
          {isFilterActive && (
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full">
              Active Filters
            </span>
          )}
        </div>
        
        {isFilterActive && (
          <button
            onClick={handleResetFilters}
            className="text-xs text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {renderDropdown("Week Start", "weeks", distinctValues.weeks, filters.weeks)}
        {renderDropdown("Region", "regions", distinctValues.regions, filters.regions)}
        {renderDropdown("Store Format", "storeFormats", distinctValues.storeFormats, filters.storeFormats)}
        {renderDropdown("Store Name", "stores", distinctValues.stores, filters.stores)}
        {renderDropdown("City", "cities", distinctValues.cities, filters.cities)}
        {renderDropdown("Product Category", "productCategories", distinctValues.productCategories, filters.productCategories)}
      </div>
    </div>
  );
}
