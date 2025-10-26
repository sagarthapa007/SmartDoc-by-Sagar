import Papa from "papaparse";
import * as XLSX from "xlsx";
import mammoth from "mammoth";

// File type detection helper
export function getFileTypeInfo(filename) {
  const extension = filename.toLowerCase().match(/\.[^.]+$/)?.[0] || "";
  const typeMap = {
    ".csv": { type: "data", label: "CSV Data" },
    ".xlsx": { type: "data", label: "Excel Spreadsheet" },
    ".xls": { type: "data", label: "Excel Spreadsheet" },
    ".json": { type: "data", label: "JSON Data" },
    ".xml": { type: "data", label: "XML Data" },
    ".docx": { type: "document", label: "Word Document" },
    ".doc": { type: "document", label: "Word Document" },
    ".pdf": { type: "document", label: "PDF Document" },
    ".txt": { type: "document", label: "Text File" },
    ".rtf": { type: "document", label: "Rich Text" },
    ".pptx": { type: "presentation", label: "PowerPoint" },
    ".ppt": { type: "presentation", label: "PowerPoint" },
    ".jpg": { type: "image", label: "JPEG Image" },
    ".jpeg": { type: "image", label: "JPEG Image" },
    ".png": { type: "image", label: "PNG Image" },
    ".gif": { type: "image", label: "GIF Image" },
    ".zip": { type: "archive", label: "ZIP Archive" },
    ".rar": { type: "archive", label: "RAR Archive" },
    ".7z": { type: "archive", label: "7-Zip Archive" },
    ".odt": { type: "document", label: "OpenDocument Text" },
    ".ods": { type: "data", label: "OpenDocument Spreadsheet" },
    ".odp": { type: "presentation", label: "OpenDocument Presentation" },
  };

  return (
    typeMap[extension] || {
      type: "unknown",
      label: "Unknown File",
    }
  );
}

/**
 * Smart header detection with confidence scoring
 */
function detectHeaderRow(lines, options = {}) {
  const maxCheck = Math.min(10, lines.length);
  const scores = [];

  for (let i = 0; i < maxCheck; i++) {
    const line = lines[i];
    if (!line?.trim()) continue;

    const fields = line.split(/[,\t|;]/).map((f) => f.trim());
    let score = 0;

    // Heuristic 1: Non-numeric fields (headers usually aren't numbers)
    const nonNumeric = fields.filter((f) => f && isNaN(f)).length;
    score += (nonNumeric / fields.length) * 30;

    // Heuristic 2: Capitalization patterns
    const capitalized = fields.filter((f) => f && /^[A-Z]/.test(f)).length;
    score += (capitalized / fields.length) * 20;

    // Heuristic 3: Common header keywords
    const headerKeywords =
      /name|id|date|time|email|phone|address|city|country|price|total|status|type|code|number/i;
    const hasKeywords = fields.filter((f) => headerKeywords.test(f)).length;
    score += (hasKeywords / fields.length) * 25;

    // Heuristic 4: Uniqueness (headers tend to be unique)
    const unique = new Set(fields.filter(Boolean)).size;
    score += (unique / fields.length) * 15;

    // Heuristic 5: Reasonable length (not too short, not too long)
    const validFields = fields.filter(Boolean);
    const avgLength =
      validFields.reduce((sum, f) => sum + f.length, 0) / validFields.length;
    if (avgLength >= 3 && avgLength <= 50) score += 10;

    scores.push({ index: i, score, line, fields });
  }

  // Find best match
  const best = scores.reduce(
    (max, curr) => (curr.score > max.score ? curr : max),
    scores[0] || { index: 0, score: 0 },
  );

  // Confidence levels
  const confidence =
    best.score >= 70 ? "high" : best.score >= 50 ? "medium" : "low";

  return {
    headerIndex: best.index,
    confidence,
    score: Math.round(best.score),
    alternatives: scores
      .filter((s) => s.index !== best.index && s.score >= 30)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5),
    lines: lines.slice(0, 10),
  };
}

/**
 * Unified ingest with smart header detection and universal file support.
 */
export async function ingestFile(file) {
  const name = file.name.toLowerCase();
  const meta = { name: file.name, size: file.size, mime: file.type };
  const fileTypeInfo = getFileTypeInfo(file.name);

  console.log("📂 Processing file:", file.name, "Type:", fileTypeInfo.label);

  try {
    // Data files with tabular structure
    if (name.endsWith(".csv")) return await parseCSV(file, meta, fileTypeInfo);
    if (name.endsWith(".xlsx") || name.endsWith(".xls"))
      return await parseExcel(file, meta, fileTypeInfo);

    // Document files with potential tabular data
    if (name.endsWith(".docx"))
      return await parseDocx(file, meta, fileTypeInfo);
    if (name.endsWith(".txt")) return await parseText(file, meta, fileTypeInfo);

    // JSON files
    if (name.endsWith(".json"))
      return await parseJSON(file, meta, fileTypeInfo);

    // XML files
    if (name.endsWith(".xml")) return await parseXML(file, meta, fileTypeInfo);

    // For other file types, return basic file info
    return await parseGenericFile(file, meta, fileTypeInfo);
  } catch (error) {
    console.error("❌ File processing failed:", error);
    // Return a graceful fallback instead of throwing
    return {
      kind: "file",
      meta,
      fileType: fileTypeInfo,
      originalName: file.name,
      error: error.message,
      content: null,
    };
  }
}

/* ---------- CSV ---------- */
async function parseCSV(file, meta, fileTypeInfo) {
  try {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);

    console.log("📊 CSV lines found:", lines.length);

    const detection = detectHeaderRow(lines);
    console.log("🎯 CSV detection result:", detection);

    const { headerIndex } = detection;
    const sample = lines.slice(headerIndex).join("\n");

    const parsed = Papa.parse(sample, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transformHeader: (h) => h.trim(),
    });

    const headers = parsed.meta.fields || [];
    const rows = parsed.data || [];

    console.log(
      "✅ CSV parsed - Headers:",
      headers.length,
      "Rows:",
      rows.length,
    );

    return {
      kind: "table",
      headers,
      rows,
      meta,
      fileType: fileTypeInfo,
      originalName: file.name,
      headerIndex,
      detection,
    };
  } catch (error) {
    console.error("❌ CSV parse error:", error);
    throw error;
  }
}

/* ---------- EXCEL ---------- */
async function parseExcel(file, meta, fileTypeInfo) {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheet];

    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
    });
    const lines = rawData.map((row) =>
      Array.isArray(row) ? row.join(",") : String(row),
    );

    console.log("📊 Excel lines found:", lines.length);

    const detection = detectHeaderRow(lines);
    console.log("🎯 Excel detection result:", detection);

    const { headerIndex } = detection;

    const json = XLSX.utils.sheet_to_json(worksheet, {
      header: headerIndex,
      defval: "",
    });

    const headers = json.length && json[0] ? Object.keys(json[0]) : [];
    const rows = json.length > 1 ? json.slice(1) : [];

    console.log(
      "✅ Excel parsed - Headers:",
      headers.length,
      "Rows:",
      rows.length,
    );

    return {
      kind: "table",
      headers,
      rows,
      meta,
      fileType: fileTypeInfo,
      originalName: file.name,
      headerIndex,
      detection,
    };
  } catch (error) {
    console.error("❌ Excel parse error:", error);
    throw error;
  }
}

/* ---------- TEXT ---------- */
async function parseText(file, meta, fileTypeInfo) {
  try {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);

    console.log("📊 Text lines found:", lines.length);

    const detection = detectHeaderRow(lines);
    console.log("🎯 Text detection result:", detection);

    const { headerIndex } = detection;

    const headers =
      lines[headerIndex]?.split(/[,\t|;]/).map((h) => h.trim()) || [];
    const rows = lines
      .slice(headerIndex + 1)
      .map((line) => {
        const values = line.split(/[,\t|;]/);
        const obj = {};
        headers.forEach((h, i) => (obj[h] = values[i]?.trim() || ""));
        return obj;
      })
      .filter((row) => Object.values(row).some((val) => val !== ""));

    console.log(
      "✅ Text parsed - Headers:",
      headers.length,
      "Rows:",
      rows.length,
    );

    return {
      kind: "table",
      headers,
      rows,
      meta,
      fileType: fileTypeInfo,
      originalName: file.name,
      headerIndex,
      detection,
    };
  } catch (error) {
    console.error("❌ Text parse error:", error);
    throw error;
  }
}

/* ---------- DOCX ---------- */
async function parseDocx(file, meta, fileTypeInfo) {
  try {
    const buffer = await file.arrayBuffer();

    const { value: html } = await mammoth.convertToHtml({
      arrayBuffer: buffer,
    });
    const div = document.createElement("div");
    div.innerHTML = html;

    const table = div.querySelector("table");

    if (table) {
      const rows = Array.from(table.querySelectorAll("tr")).map((tr) =>
        Array.from(tr.querySelectorAll("td,th")).map((td) =>
          td.textContent.trim(),
        ),
      );

      let headers = rows.shift() || [];
      const objects = rows.map((r) => {
        const o = {};
        headers.forEach((h, i) => (o[h || `col_${i + 1}`] = r[i] ?? ""));
        return o;
      });
      headers = headers.map((h, i) => h || `col_${i + 1}`);

      console.log(
        `📑 DOCX table detected with ${headers.length} columns and ${rows.length} rows`,
      );

      return {
        kind: "table",
        headers,
        rows: objects,
        meta: { ...meta, source: "docx", mode: "table" },
        fileType: fileTypeInfo,
        originalName: file.name,
        headerIndex: 0,
        detection: { headerIndex: 0, confidence: "medium", score: 65 },
      };
    }

    const { value: text } = await mammoth.extractRawText({
      arrayBuffer: buffer,
    });
    console.log(`📝 DOCX text extracted — ${text.length} characters`);
    return {
      kind: "doc",
      text,
      meta: { ...meta, source: "docx", mode: "text" },
      fileType: fileTypeInfo,
      originalName: file.name,
    };
  } catch (error) {
    console.error("❌ DOCX parse error:", error);
    throw error;
  }
}

/* ---------- JSON ---------- */
async function parseJSON(file, meta, fileTypeInfo) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    console.log("📊 JSON data loaded");

    // Handle array of objects (tabular data)
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object") {
      const headers = Object.keys(data[0]);
      return {
        kind: "table",
        headers,
        rows: data,
        meta,
        fileType: fileTypeInfo,
        originalName: file.name,
        headerIndex: 0,
        detection: { headerIndex: 0, confidence: "high", score: 90 },
      };
    }

    // Handle object data
    return {
      kind: "json",
      data,
      meta,
      fileType: fileTypeInfo,
      originalName: file.name,
    };
  } catch (error) {
    console.error("❌ JSON parse error:", error);
    throw error;
  }
}

/* ---------- XML ---------- */
async function parseXML(file, meta, fileTypeInfo) {
  try {
    const text = await file.text();
    // Basic XML parsing - could be enhanced with proper XML parser
    return {
      kind: "xml",
      content: text,
      meta,
      fileType: fileTypeInfo,
      originalName: file.name,
    };
  } catch (error) {
    console.error("❌ XML parse error:", error);
    throw error;
  }
}

/* ---------- GENERIC FILE ---------- */
async function parseGenericFile(file, meta, fileTypeInfo) {
  // For unsupported file types, return basic file info
  return {
    kind: "file",
    meta,
    fileType: fileTypeInfo,
    originalName: file.name,
    content: null,
    message: `File type ${fileTypeInfo.label} requires specialized processing`,
  };
}

/**
 * Re-parse with a different header row
 */
export async function reparseWithHeader(file, newHeaderIndex) {
  const result = await ingestFile(file);
  if (result.kind !== "table") return result;

  result.headerIndex = newHeaderIndex;
  result.detection.headerIndex = newHeaderIndex;

  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const sample = lines.slice(newHeaderIndex).join("\n");

    const parsed = Papa.parse(sample, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transformHeader: (h) => h.trim(),
    });

    result.headers = parsed.meta.fields || [];
    result.rows = parsed.data || [];
  }

  return result;
}
