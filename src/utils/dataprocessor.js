import Papa from "papaparse";
import * as XLSX from "xlsx";
import ss from "simple-statistics";

export async function parseFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  let data = [];

  if (ext === "csv") {
    const text = await file.text();
    const { data: parsed } = Papa.parse(text, { header: true });
    data = parsed;
  } else if (ext === "xlsx" || ext === "xls") {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    data = XLSX.utils.sheet_to_json(sheet);
  } else {
    throw new Error("Unsupported file type");
  }

  return data.filter((r) => Object.keys(r).length > 0);
}

export function getBasicStats(data) {
  if (!data || data.length === 0) return null;
  const columns = Object.keys(data[0]);
  const rows = data.length;

  const numericCols = columns.filter((col) =>
    data.every((r) => !isNaN(parseFloat(r[col])) || r[col] === ""),
  );

  const stats = numericCols.map((col) => {
    const values = data.map((r) => parseFloat(r[col])).filter((v) => !isNaN(v));
    return {
      column: col,
      mean: ss.mean(values),
      median: ss.median(values),
      min: ss.min(values),
      max: ss.max(values),
      std: ss.standardDeviation(values),
    };
  });

  return { rows, columns, numericCols, stats };
}
