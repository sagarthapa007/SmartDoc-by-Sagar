import React, { createContext, useContext, useMemo, useState } from 'react'
const Ctx = createContext(null)
export function ReportProvider({ children }){
  const [state, setState] = useState({ template:'executive', sections:[] })
  const value = useMemo(()=>({ state, setState }), [state])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export const useReportContext = ()=> useContext(Ctx)
