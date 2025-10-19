import Papa from "papaparse";
import * as XLSX from "xlsx";
import mammoth from "mammoth";

/**
 * Smart header detection with confidence scoring
 */
function detectHeaderRow(lines, options = {}) {
  const maxCheck = Math.min(10, lines.length);
  const scores = [];

  for (let i = 0; i < maxCheck; i++) {
    const line = lines[i];
    if (!line || line.trim().length === 0) continue;

    const fields = line.split(/[,\t|;]/).map(f => f.trim());
    let score = 0;

    // Heuristic 1: Non-numeric fields (headers usually aren't numbers)
    const nonNumeric = fields.filter(f => f && isNaN(f)).length;
    score += (nonNumeric / fields.length) * 30;

    // Heuristic 2: Capitalization patterns
    const capitalized = fields.filter(f => 
      f && f.length > 0 && /^[A-Z]/.test(f)
    ).length;
    score += (capitalized / fields.length) * 20;

    // Heuristic 3: Common header keywords
    const headerKeywords = /name|id|date|time|email|phone|address|city|country|price|total|status|type|code|number/i;
    const hasKeywords = fields.filter(f => headerKeywords.test(f)).length;
    score += (hasKeywords / fields.length) * 25;

    // Heuristic 4: Uniqueness (headers tend to be unique)
    const unique = new Set(fields.filter(Boolean)).size;
    score += (unique / fields.length) * 15;

    // Heuristic 5: Reasonable length (not too short, not too long)
    const avgLength = fields.filter(Boolean).reduce((sum, f) => sum + f.length, 0) / fields.length;
    if (avgLength >= 3 && avgLength <= 50) score += 10;

    scores.push({ index: i, score, line, fields });
  }

  // Find best match
  const best = scores.reduce((max, curr) => 
    curr.score > max.score ? curr : max, scores[0] || { index: 0, score: 0 }
  );

  // Confidence levels
  const confidence = best.score >= 70 ? 'high' : 
                     best.score >= 50 ? 'medium' : 'low';

  return {
    headerIndex: best.index,
    confidence,
    score: Math.round(best.score),
    alternatives: scores
      .filter(s => s.index !== best.index && s.score >= 30)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5),
    lines: lines.slice(0, 10) // Include lines in detection result
  };
}

/**
 * Unified ingest with smart header detection.
 */
export async function ingestFile(file) {
  const name = file.name.toLowerCase();
  const meta = { name: file.name, size: file.size, mime: file.type };

  console.log('📂 Processing file:', file.name);

  if (name.endsWith(".csv")) return await parseCSV(file, meta);
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return await parseExcel(file, meta);
  if (name.endsWith(".docx")) return await parseDocx(file, meta);
  if (name.endsWith(".txt")) return await parseText(file, meta);

  throw new Error("Unsupported file type");
}

/* ---------- CSV ---------- */
async function parseCSV(file, meta) {
  try {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);

    console.log('📊 CSV lines found:', lines.length);

    // Auto detect header row with confidence
    const detection = detectHeaderRow(lines);
    console.log('🎯 CSV detection result:', detection);

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

    console.log('✅ CSV parsed - Headers:', headers.length, 'Rows:', rows.length);
    
    return { 
      kind: "table", 
      headers, 
      rows, 
      meta, 
      headerIndex,
      detection 
    };
  } catch (error) {
    console.error('❌ CSV parse error:', error);
    throw error;
  }
}

/* ---------- EXCEL ---------- */
async function parseExcel(file, meta) {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheet];
    
    // Get raw data to detect headers
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
    const lines = rawData.map(row => Array.isArray(row) ? row.join(",") : String(row));
    
    console.log('📊 Excel lines found:', lines.length);

    const detection = detectHeaderRow(lines);
    console.log('🎯 Excel detection result:', detection);

    const { headerIndex } = detection;
    
    // Parse with detected header - SIMPLIFIED APPROACH
    const json = XLSX.utils.sheet_to_json(worksheet, { 
      header: headerIndex, // Use header row index directly
      defval: "" 
    });

    const headers = json.length && json[0] ? Object.keys(json[0]) : [];
    const rows = json.length > 1 ? json.slice(1) : [];

    console.log('✅ Excel parsed - Headers:', headers.length, 'Rows:', rows.length);
    
    return { 
      kind: "table", 
      headers, 
      rows, 
      meta, 
      headerIndex,
      detection 
    };
  } catch (error) {
    console.error('❌ Excel parse error:', error);
    throw error;
  }
}

/* ---------- TEXT ---------- */
async function parseText(file, meta) {
  try {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);

    console.log('📊 Text lines found:', lines.length);
    
    const detection = detectHeaderRow(lines);
    console.log('🎯 Text detection result:', detection);

    const { headerIndex } = detection;
    
    const headers = lines[headerIndex]?.split(/[,\t|;]/).map((h) => h.trim()) || [];
    const rows = lines.slice(headerIndex + 1).map((line) => {
      const values = line.split(/[,\t|;]/);
      const obj = {};
      headers.forEach((h, i) => (obj[h] = values[i]?.trim() || ""));
      return obj;
    }).filter(row => Object.values(row).some(val => val !== ""));
    
    console.log('✅ Text parsed - Headers:', headers.length, 'Rows:', rows.length);
    
    return { 
      kind: "table", 
      headers, 
      rows, 
      meta, 
      headerIndex,
      detection 
    };
  } catch (error) {
    console.error('❌ Text parse error:', error);
    throw error;
  }
}

/* ---------- DOCX ---------- */
async function parseDocx(file, meta) {
  try {
    const buffer = await file.arrayBuffer();
    const { value } = await mammoth.extractRawText({ arrayBuffer: buffer });
    const text = value.trim();
    
    console.log('✅ DOCX parsed - Text length:', text.length);
    
    return { kind: "doc", text, meta };
  } catch (error) {
    console.error('❌ DOCX parse error:', error);
    throw error;
  }
}

/**
 * Re-parse with a different header row
 */
export async function reparseWithHeader(file, newHeaderIndex) {
  const result = await ingestFile(file);
  if (result.kind !== "table") return result;
  
  // Update the detection info
  result.headerIndex = newHeaderIndex;
  result.detection.headerIndex = newHeaderIndex;
  
  // Re-parse based on file type
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