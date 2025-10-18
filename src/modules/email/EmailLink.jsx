import React, { useMemo, useState } from 'react'
import { useSession } from '@context/SessionContext.jsx'
export default function EmailLink(){
  const { session } = useSession()
  const ds = session?.dataset
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('SmartDoc Report')
  const [body, setBody] = useState('Attached: Report.\n\nSummary: '+(ds? `Rows ${ds.rows.length}, Cols ${ds.headers.length}` : 'N/A'))
  const href = useMemo(()=>{
    const enc = (s)=> encodeURIComponent(s||'')
    return `mailto:${enc(to)}?subject=${enc(subject)}&body=${enc(body)}`
  }, [to, subject, body])
  return (
    <div className="card">
      <div className="font-semibold mb-2">Send Email (opens your default client)</div>
      <div className="grid gap-2 text-sm">
        <input className="badge" placeholder="recipient@example.com" value={to} onChange={e=>setTo(e.target.value)} />
        <input className="badge" placeholder="Subject" value={subject} onChange={e=>setSubject(e.target.value)} />
        <textarea className="badge" rows={4} placeholder="Body" value={body} onChange={e=>setBody(e.target.value)} />
        <a className="kbd inline-block text-center" href={href}>Open Email Client</a>
      </div>
    </div>
  )
}
