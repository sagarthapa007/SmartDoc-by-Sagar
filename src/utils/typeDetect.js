import * as ss from 'simple-statistics'
export function inferType(values){
  let total=0, nums=0, dates=0, bools=0
  for(const v of values){
    if(v==null || v==='') continue
    total++
    const s = String(v).trim()
    if(/^(true|false|yes|no)$/i.test(s)) { bools++; continue }
    const n = Number(s.replace(/,/g,''))
    if(!Number.isNaN(n) && s!==''){ nums++; continue }
    const d = Date.parse(s)
    if(!Number.isNaN(d)) { dates++; continue }
  }
  if(total===0) return 'text'
  if(nums/total > .7) return 'number'
  if(dates/total > .7) return 'date'
  if(bools/total > .7) return 'boolean'
  const uniq = new Set(values.filter(x=>x!=null && String(x).trim()!=='').map(x=>String(x))).size
  const density = uniq/(total||1)
  if(density < .1) return 'categorical'
  return 'text'
}
export function normalizeHeaders(arr){
  const taken = new Set()
  return arr.map((h,i)=>{
    let x = String(h??'').trim().replace(/\s+/g,' ').replace(/[\t\n\r]/g,' ').replace(/[^\w\s\-\%\.]/g,'')
    if(!x) x = 'Column_'+(i+1)
    let k = x, c=1
    while(taken.has(k)){ k = `${x}_${c++}` }
    taken.add(k); return k
  })
}
