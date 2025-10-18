export function exportToCSV(data, filename = "SmartDoc_Export.csv") {
  const arr = Array.isArray(data) ? data : [];
  const headers = Object.keys(arr[0] || {});
  const csv = [headers.join(",")]
    .concat(arr.map(r => headers.map(h => csvEscape(r?.[h])).join(",")))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}
