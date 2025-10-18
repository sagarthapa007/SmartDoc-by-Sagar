import * as ss from 'simple-statistics'
export function numericColumns(headers, rows){
  return headers.filter(h=> rows.some(r=> !Number.isNaN(Number(String(r[h]??'').replace(/,/g,''))) ))
}
export function toSeries(rows, col){
  const arr = rows.map(r=>{
    const v = Number(String(r[col]??'').replace(/,/g,''))
    return Number.isNaN(v)? null : v
  }).filter(v=>v!=null)
  return arr
}
export function correlationMatrix(headers, rows){
  const nums = numericColumns(headers, rows)
  const map = {}
  nums.forEach(a=>{
    map[a] = {}
    const A = toSeries(rows,a)
    nums.forEach(b=>{
      const B = toSeries(rows,b)
      let r = 0
      if (A.length>2 && B.length>2){
        const len = Math.min(A.length, B.length)
        r = ss.sampleCorrelation(A.slice(0,len), B.slice(0,len))
      }
      map[a][b] = Number.isFinite(r) ? +r.toFixed(3) : 0
    })
  })
  return { cols: nums, values: map }
}
export function strongestPair(matrix){
  const cols = matrix.cols
  let best = null, bestAbs = 0
  for(let i=0;i<cols.length;i++){
    for(let j=i+1;j<cols.length;j++){
      const a = cols[i], b = cols[j]
      const r = Math.abs(matrix.values[a][b])
      if (r > bestAbs){ bestAbs = r; best = { a, b, r: matrix.values[a][b] } }
    }
  }
  return best
}
export function exportCSV(filename, headers, rows){
  const esc = (v)=> '"'+String(v??'').replaceAll('"','""')+'"'
  const csv = [headers.join(',')].concat(rows.map(r=> headers.map(h=>esc(r[h])).join(','))).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename || 'smartdoc.csv'; a.click()
  URL.revokeObjectURL(url)
}
