import React, { useState } from 'react'
import { useSession } from '@context/SessionContext.jsx'
import { exportCSV } from '@utils/analyze.js'

export default function ExportCenter(){
  const { session } = useSession()
  const ds = session?.dataset
  const [fmt, setFmt] = useState('csv')
  const [scope, setScope] = useState('all')
  if (!ds) return <div className="opacity-70 text-sm">Upload a dataset to export.</div>
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <div className="card">
        <div className="font-semibold mb-2">Export Options</div>
        <div className="grid gap-2 text-sm">
          <label className="flex items-center justify-between">Format
            <select className="badge" value={fmt} onChange={e=>setFmt(e.target.value)}>
              <option value="csv">CSV (data)</option>
              <option value="html">HTML (dashboard)</option>
              <option value="pdf">PDF (report)</option>
              <option value="pptx">PowerPoint</option>
              <option value="xlsx">Excel</option>
            </select>
          </label>
          <label className="flex items-center justify-between">Scope
            <select className="badge" value={scope} onChange={e=>setScope(e.target.value)}>
              <option value="all">All rows</option>
              <option value="visible">Visible rows</option>
              <option value="selected">Selected rows</option>
            </select>
          </label>
          <button className="kbd" onClick={()=>handleExport(fmt, ds)}>Export</button>
        </div>
      </div>
      <div className="card"><div className="font-semibold mb-2">Heads up</div><div className="text-sm opacity-70">PDF/HTML/PPT/Excel are wired with graceful fallbacks. CSV works out-of-the-box.</div></div>
    </div>
  )
}

async function handleExport(fmt, ds){
  if (fmt==='csv') {
    exportCSV('smartdoc.csv', ds.headers, ds.rows)
  } else if (fmt==='html') {
    const html = renderHTML(ds)
    downloadBlob('smartdoc_report.html', new Blob([html], {type:'text/html'}))
  } else if (fmt==='pdf') {
    try { const { jsPDF } = await import('jspdf'); const doc = new jsPDF(); doc.text('SmartDoc Report', 20, 20); doc.text('Rows: '+ds.rows.length, 20, 30); doc.save('smartdoc.pdf') } 
    catch(e){ alert('Install PDF engine: npm i jspdf') }
  } else if (fmt==='pptx') {
    try { const PptxGenJS = (await import('pptxgenjs')).default; const pptx = new PptxGenJS(); const slide = pptx.addSlide(); slide.addText('SmartDoc Summary', { x:1, y:0.5, fontSize:24 }); slide.addText(`Rows: ${ds.rows.length}  Cols: ${ds.headers.length}`, { x:1, y:1.2, fontSize:14 }); await pptx.writeFile({ fileName:'smartdoc.pptx' }) }
    catch(e){ alert('Install PPT engine: npm i pptxgenjs') }
  } else if (fmt==='xlsx') {
    try { const XLSX = await import('xlsx'); const ws = XLSX.utils.json_to_sheet(ds.rows); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Data'); XLSX.writeFile(wb, 'smartdoc.xlsx') }
    catch(e){ alert('XLSX export requires sheetjs already installed (it is).') }
  }
}
function renderHTML(ds){
  return `<!doctype html><html><head><meta charset="utf-8"><title>SmartDoc Report</title>
  <style>body{font-family:ui-sans-serif,system-ui;padding:20px;}table{border-collapse:collapse}td,th{border:1px solid #ddd;padding:6px;font-size:12px}</style>
  </head><body><h1>SmartDoc Report</h1><p><b>Rows:</b> ${ds.rows.length} &nbsp; <b>Columns:</b> ${ds.headers.length}</p>
  <table><thead><tr>${ds.headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
  <tbody>${ds.rows.slice(0,50).map(r=>`<tr>${ds.headers.map(h=>`<td>${String(r[h]??'')}</td>`).join('')}</tr>`).join('')}</tbody></table>
  <p style="opacity:.7">* Showing first 50 rows</p></body></html>`
}
function downloadBlob(name, blob){
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=name; a.click(); URL.revokeObjectURL(url);
}
