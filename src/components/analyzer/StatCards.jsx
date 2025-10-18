import { useMemo } from 'react';

export default function StatCards({ headers=[], rows=[] }){
  const stats = useMemo(() => {
    const count = rows.length;
    const colCount = headers.length;
    
    if (!count || !colCount) {
      return { count, colCount, missing: 0, sampleSize: 0, roughMin: 0, roughMax: 0, roughAvg: 0 };
    }
    
    // Sample up to 200 rows for performance, but ensure we sample from entire dataset
    const sampleSize = Math.min(200, count);
    const step = Math.max(1, Math.floor(count / sampleSize));
    const sampledRows = [];
    for (let i = 0; i < count && sampledRows.length < sampleSize; i += step) {
      sampledRows.push(rows[i]);
    }
    
    // Calculate missing values from sample
    let empty = 0, total = 0;
    const bytes = [];
    
    for (const r of sampledRows) {
      let rowSize = 0;
      for (const h of headers) {
        total++;
        const val = r[h];
        if (val === null || val === undefined || String(val).trim() === "") {
          empty++;
        }
        // More accurate byte calculation (rough estimate for strings)
        rowSize += val ? String(val).length * 2 : 0;
      }
      bytes.push(rowSize);
    }
    
    const missing = +(100 * empty / Math.max(total, 1)).toFixed(1);
    const roughMin = bytes.length ? Math.min(...bytes) : 0;
    const roughMax = bytes.length ? Math.max(...bytes) : 0;
    const roughAvg = bytes.length ? Math.round(bytes.reduce((a,b) => a+b, 0) / bytes.length) : 0;
    
    return { count, colCount, missing, sampleSize, roughMin, roughMax, roughAvg };
  }, [headers, rows]);
  
  const { count, colCount, missing, sampleSize, roughMin, roughMax, roughAvg } = stats;
  
  return (
    <div className="kpis">
      <div className="kpi">
        <div className="icon">📊</div>
        <div>
          <div className="label">Rows</div>
          <div className="value">{count.toLocaleString()}</div>
        </div>
      </div>
      <div className="kpi">
        <div className="icon">🧩</div>
        <div>
          <div className="label">Columns</div>
          <div className="value">{colCount}</div>
        </div>
      </div>
      <div className="kpi">
        <div className="icon">🧼</div>
        <div>
          <div className="label">Missing Data</div>
          <div className="value">{missing}%</div>
        </div>
      </div>
      <div className="kpi">
        <div className="icon">⚙️</div>
        <div>
          <div className="label">Row Size (bytes)</div>
          <div className="value" style={{ fontSize: '0.9em' }}>
            {roughAvg.toLocaleString()} <span style={{ opacity: 0.6, fontSize: '0.85em' }}>avg</span>
          </div>
          {sampleSize < count && (
            <div style={{ fontSize: '0.7em', opacity: 0.5, marginTop: 2 }}>
              ~{sampleSize} row sample
            </div>
          )}
        </div>
      </div>
    </div>
  );
}