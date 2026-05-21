// src/lib/utils/export.ts
import * as XLSX from "xlsx";

export function createExcelBuffer(
  data: Record<string, unknown>[],
  sheetName = "Sheet1"
): Buffer {
  const ws = XLSX.utils.json_to_sheet(data);

  // Auto-size columns
  const colWidths = Object.keys(data[0] || {}).map((key) => {
    const maxLength = Math.max(
      key.length,
      ...data.map((row) => String(row[key] || "").length)
    );
    return { wch: Math.min(maxLength + 2, 50) };
  });
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return buffer;
}

export function createMultiSheetExcel(
  sheets: { name: string; data: Record<string, unknown>[] }[]
): Buffer {
  const wb = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    const ws = XLSX.utils.json_to_sheet(sheet.data);

    // Auto-size columns
    if (sheet.data.length > 0) {
      const colWidths = Object.keys(sheet.data[0]).map((key) => {
        const maxLength = Math.max(
          key.length,
          ...sheet.data.map((row) => String(row[key] || "").length)
        );
        return { wch: Math.min(maxLength + 2, 50) };
      });
      ws["!cols"] = colWidths;
    }

    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31)); // Sheet names max 31 chars
  });

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}
