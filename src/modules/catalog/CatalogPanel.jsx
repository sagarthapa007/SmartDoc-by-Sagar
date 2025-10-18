import React from 'react'
import { useSession } from '@context/SessionContext.jsx'

export default function CatalogPanel(){
  const { session } = useSession()
  const files = session?.files || []
  const ds = session?.dataset
  const doc = session?.doc
  return (
    <div className="grid gap-3">
      <div className="text-sm opacity-70">Define and manage uploaded files. Set roles (Dataset / Document / Ignore) and add notes.</div>
      <div className="grid md:grid-cols-2 gap-3">
        {files.length===0 && <div className="opacity-70 text-sm">No files uploaded yet.</div>}
        {files.map((f, idx)=> (
          <div key={idx} className="border rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">{f.meta?.name || f.name}</div>
              <span className="badge">{(f.kind||'file').toUpperCase()}</span>
            </div>
            <div className="text-xs opacity-70 mt-1">Size: {(f.meta?.size||0).toLocaleString()} bytes</div>
            {f.sheetName && <div className="text-xs opacity-70">Sheet: {f.sheetName}</div>}
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div className="border rounded-xl p-3">
          <div className="font-semibold mb-1">Active Dataset</div>
          <div className="text-sm opacity-80">{ds ? ds.meta?.name : '—'}</div>
          {ds && <div className="text-xs opacity-70">Headers: {ds.headers?.length||0}, Rows: {ds.rows?.length||0}</div>}
        </div>
        <div className="border rounded-xl p-3">
          <div className="font-semibold mb-1">Active Document</div>
          <div className="text-sm opacity-80">{doc ? doc.meta?.name : '—'}</div>
          {doc && <div className="text-xs opacity-70">Excerpt len: {doc.excerpt?.length||0}</div>}
        </div>
      </div>
    </div>
  )
}
