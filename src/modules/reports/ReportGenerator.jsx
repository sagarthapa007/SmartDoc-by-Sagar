import React, { useState } from 'react'
import { useSession } from '@context/SessionContext.jsx'

export default function ReportGenerator(){
  const { session } = useSession()
  const ds = session?.dataset
  const [template, setTemplate] = useState('executive')
  if (!ds) return <div className="opacity-70 text-sm">Upload a dataset to generate reports.</div>
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <div className="card">
        <div className="font-semibold mb-2">Report Templates</div>
        <select className="badge" value={template} onChange={e=>setTemplate(e.target.value)}>
          <option value="executive">Executive Summary (1–2 pages)</option>
          <option value="full">Full Analysis (10–20 pages)</option>
          <option value="custom">Custom Builder</option>
        </select>
        <button className="kbd mt-3" onClick={()=>alert('Stub: Will assemble narrative + charts per template.')}>Generate</button>
      </div>
      <div className="card"><div className="font-semibold mb-2">Notes</div><div className="text-sm opacity-70">Integrates with Export Center to output PDF/HTML/PPT in Phase 2B.</div></div>
    </div>
  )
}
