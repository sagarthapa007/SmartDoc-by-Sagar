/**
 * Smart header row detector.
 * Scans first 10–20 lines of a CSV or text file and returns
 * the row index most likely to contain column names.
 */
export function detectHeaderRow(lines) {
  let bestIndex = 0;
  let bestScore = 0;

  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const alpha = cols.filter((c) => /^[A-Za-z\s_]+$/.test(c)).length;
    const blanks = cols.filter((c) => !c).length;
    const score = alpha - blanks;

    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return { headerIndex: bestIndex, confidence: bestScore > 0 ? bestScore : 0 };
}
