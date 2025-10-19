
// Detect Data Type (ML-powered)
const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "/api";

export async function detectDataType(dataset) {
  const url = `${API_BASE}/detect`;
  const payload = {
    headers: dataset.headers,
    sample_rows: dataset.rows?.slice(0, 100) || [],
    text_blocks: dataset.text_blocks || []
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}
