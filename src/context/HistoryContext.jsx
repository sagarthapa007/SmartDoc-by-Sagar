import React, { createContext, useContext, useMemo, useState } from 'react'
const Ctx = createContext(null)
export function HistoryProvider({ children }){
  const [events, setEvents] = useState([])
  const log = (type, detail)=> setEvents(e=>[...e, { ts:new Date().toISOString(), type, detail }])
  const value = useMemo(()=>({ events, log, setEvents }), [events])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export const useHistoryContext = ()=> useContext(Ctx)
