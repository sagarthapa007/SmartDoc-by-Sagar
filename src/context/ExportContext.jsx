import React, { createContext, useContext, useMemo, useState } from 'react'
const Ctx = createContext(null)
export function ExportProvider({ children }){
  const [state, setState] = useState({ format:'csv', scope:'all' })
  const value = useMemo(()=>({ state, setState }), [state])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export const useExportContext = ()=> useContext(Ctx)
