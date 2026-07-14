/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Robustly parses a value into a safe number.
 * Handles strings with currency symbols, commas, percent signs, and whitespaces.
 * Prevents NaN values.
 */
export function parseNumeric(val: any): number {
  if (val === undefined || val === null || val === "") return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  
  // Clean string by removing currency symbols, commas, and trailing whitespaces
  const clean = String(val).replace(/[\$,%\s]/g, "");
  const num = Number(clean);
  return isNaN(num) ? 0 : num;
}

/**
 * Normalizes any date value (including Excel date serials and standard date formats)
 * into the user's requested format: DD-MM-YYYY.
 */
export function normalizeDateToDDMMYYYY(val: any): string {
  if (val === undefined || val === null || val === "") return "";

  // 0. If it's already a Date object
  if (val instanceof Date) {
    if (!isNaN(val.getTime())) {
      const day = String(val.getDate()).padStart(2, "0");
      const month = String(val.getMonth() + 1).padStart(2, "0");
      const year = val.getFullYear();
      return `${day}-${month}-${year}`;
    }
    return "";
  }

  const str = String(val).trim();
  if (!str || str.toLowerCase().includes("invalid") || str.toLowerCase() === "null" || str.toLowerCase() === "undefined") {
    return "";
  }
  
  // 1. If it's a number or numeric string (Excel date serial)
  if (typeof val === "number" || /^\d+(\.\d+)?$/.test(str)) {
    const num = Number(val);
    if (!isNaN(num) && num > 25569 && num < 100000) {
      // Excel considers 1900-01-01 as day 1. 25569 is the offset for Unix epoch (1970-01-01).
      const utc_days = Math.floor(num - 25569);
      const utc_value = utc_days * 86400;
      const d = new Date(utc_value * 1000);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
      }
    }
  }

  // 2. Check if already DD-MM-YYYY or DD/MM/YYYY or MM-DD-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const p1 = parseInt(dmyMatch[1], 10);
    const p2 = parseInt(dmyMatch[2], 10);
    const year = dmyMatch[3];

    // If second number is > 12, it must be the day, which means format was MM-DD-YYYY
    if (p2 > 12 && p1 <= 12) {
      const day = String(p2).padStart(2, "0");
      const month = String(p1).padStart(2, "0");
      return `${day}-${month}-${year}`;
    } else {
      const day = String(p1).padStart(2, "0");
      const month = String(p2).padStart(2, "0");
      return `${day}-${month}-${year}`;
    }
  }

  // 3. Check if DD-MM-YY or DD/MM/YY or MM-DD-YY (2-digit year)
  const dmy2Match = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2})$/);
  if (dmy2Match) {
    const p1 = parseInt(dmy2Match[1], 10);
    const p2 = parseInt(dmy2Match[2], 10);
    const year = "20" + dmy2Match[3];

    if (p2 > 12 && p1 <= 12) {
      const day = String(p2).padStart(2, "0");
      const month = String(p1).padStart(2, "0");
      return `${day}-${month}-${year}`;
    } else {
      const day = String(p1).padStart(2, "0");
      const month = String(p2).padStart(2, "0");
      return `${day}-${month}-${year}`;
    }
  }

  // 4. Check if YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, "0");
    const day = ymdMatch[3].padStart(2, "0");
    return `${day}-${month}-${year}`;
  }

  // 5. Try parsing as a general Date string
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, "0");
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const year = parsed.getFullYear();
    return `${day}-${month}-${year}`;
  }

  return str; // Return as-is if all fallback methods fail
}

/**
 * Returns a timestamp from any DD-MM-YYYY or YYYY-MM-DD format for chronological sorting.
 */
export function parseDateToTimestamp(dateStr: string): number {
  if (!dateStr) return 0;
  const cleanStr = dateStr.trim();

  if (cleanStr.toLowerCase().includes("invalid") || cleanStr.toLowerCase() === "null" || cleanStr.toLowerCase() === "undefined") {
    return 0;
  }
  
  // 1. Check if format is DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = cleanStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1; // 0-indexed month
    const year = parseInt(dmyMatch[3], 10);
    return new Date(year, month, day).getTime();
  }

  // 2. Check if format is YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = cleanStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    return new Date(year, month, day).getTime();
  }

  // 3. Fallback to standard Date parsing
  const parsed = Date.parse(cleanStr);
  return isNaN(parsed) ? 0 : parsed;
}
