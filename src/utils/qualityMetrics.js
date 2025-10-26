export function calculateQualityScore(dataArrayOrObject) {
  const rows = Array.isArray(dataArrayOrObject)
    ? dataArrayOrObject
    : dataArrayOrObject?.rows || [];

  const completeness = calcCompleteness(rows);
  const accuracy = 0.9;
  const consistency = 0.8;
  const timeliness = estimateTimeliness(rows);

  const weights = {
    completeness: 0.3,
    accuracy: 0.3,
    consistency: 0.2,
    timeliness: 0.2,
  };
  const overall =
    completeness * weights.completeness +
    accuracy * weights.accuracy +
    consistency * weights.consistency +
    timeliness * weights.timeliness;

  return {
    overall: Math.round(overall * 100),
    dimensions: { completeness, accuracy, consistency, timeliness },
  };
}

function calcCompleteness(rows) {
  if (!rows?.length) return 0;
  const headers = Object.keys(rows[0] || {});
  const total = rows.length * headers.length;
  const filled = rows
    .flatMap((r) => headers.map((h) => r?.[h]))
    .filter((v) => v !== "" && v != null).length;
  return total ? filled / total : 0;
}

function estimateTimeliness(rows) {
  if (!rows?.length) return 0.6;
  const headers = Object.keys(rows[0] || {});
  const dateHeader = headers.find((h) => /date|period|month|year/i.test(h));
  if (!dateHeader) return 0.7;
  const dates = rows
    .map((r) => {
      const s = String(r?.[dateHeader] || "");
      const iso = Date.parse(s);
      if (!isNaN(iso)) return new Date(iso);
      const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (m) return new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
      return null;
    })
    .filter(Boolean);
  if (!dates.length) return 0.7;
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
  const daysOld = (Date.now() - maxDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysOld < 30) return 0.9;
  if (daysOld < 90) return 0.8;
  return 0.7;
}
