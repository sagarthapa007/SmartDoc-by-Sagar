import React, { useState } from 'react'
import CatalogPanel from './catalog/CatalogPanel.jsx'
import CompareWorkbench from './compare/CompareWorkbench.jsx'
import ExportCenter from './export/ExportCenter.jsx'
import ReportGenerator from './reports/ReportGenerator.jsx'
import ControlsPanel from './controls/ControlsPanel.jsx'
import HistoryLogger from './logging/HistoryLogger.jsx'
import EmailLink from './email/EmailLink.jsx'

const TABS = [
  { id:'catalog', label:'Catalog' },
  { id:'compare', label:'Compare' },
  { id:'controls', label:'Analysis Controls' },
  { id:'export', label:'Export' },
  { id:'reports', label:'Reports' },
  { id:'history', label:'History' },
  { id:'email', label:'Email' },
]

export default function ModulesHub(){
  const [tab, setTab] = useState('catalog')
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Modules</h3>
        <div className="flex items-center gap-2">
          {TABS.map(t=> (
            <button key={t.id} className={'kbd '+(tab===t.id?'ring-2 ring-brand-600':'')} onClick={()=>setTab(t.id)}>{t.label}</button>
          ))}
        </div>
      </div>
      {tab==='catalog' && <CatalogPanel />}
      {tab==='compare' && <CompareWorkbench />}
      {tab==='controls' && <ControlsPanel />}
      {tab==='export' && <ExportCenter />}
      {tab==='reports' && <ReportGenerator />}
      {tab==='history' && <HistoryLogger />}
      {tab==='email' && <EmailLink />}
    </div>
  )
}
