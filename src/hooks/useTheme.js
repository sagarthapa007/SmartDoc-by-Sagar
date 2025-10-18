import { useEffect, useState } from 'react'
export default function useTheme(){
  const [theme, setTheme] = useState('light')
  const toggle = ()=> setTheme(t=> t==='light' ? 'dark' : 'light')
  useEffect(()=>{ document.documentElement.classList.toggle('dark', theme==='dark') }, [theme])
  return { theme, toggle }
}
