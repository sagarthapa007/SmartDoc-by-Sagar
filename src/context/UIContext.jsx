import React, { createContext, useContext, useEffect, useState } from 'react'
const UIContext = createContext(null)
export const useUI = ()=> useContext(UIContext)
export default function UIProvider({ children }){
  const [dark, setDark] = useState(false)
  const [tab, setTab] = useState('overview')
  useEffect(()=>{ document.documentElement.classList.toggle('dark', dark) }, [dark])
  return <UIContext.Provider value={{dark,setDark,tab,setTab}}>{children}</UIContext.Provider>
}
