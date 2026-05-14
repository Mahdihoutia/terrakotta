import * as XLSX from "xlsx";

export interface ParsedFile {
  headers: string[];
  rows: Record<string, unknown>[];
}

/**
 * Parse un fichier CSV ou XLSX et retourne headers + rows clés/valeurs.
 * Lignes 100% vides ignorées. Headers trimés.
 */
export async function parseFile(file: File): Promise<ParsedFile> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(new Uint8Array(buffer), { type: "array" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    return { headers: [], rows: [] };
  }
  const sheet = wb.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: null,
  });

  if (matrix.length === 0) {
    return { headers: [], rows: [] };
  }

  const rawHeaders = (matrix[0] ?? []).map((h) =>
    typeof h === "string" ? h.trim() : h == null ? "" : String(h).trim()
  );
  const headers = rawHeaders.filter((h) => h.length > 0);

  const rows: Record<string, unknown>[] = [];
  for (let i = 1; i < matrix.length; i++) {
    const row = matrix[i] ?? [];
    const obj: Record<string, unknown> = {};
    let hasValue = false;
    rawHeaders.forEach((h, idx) => {
      if (!h) return;
      const v = row[idx];
      if (v !== null && v !== undefined && String(v).trim() !== "") {
        hasValue = true;
      }
      obj[h] = v == null ? null : v;
    });
    if (hasValue) rows.push(obj);
  }

  return { headers, rows };
}
