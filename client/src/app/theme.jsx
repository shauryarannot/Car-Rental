import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const Ctx = createContext({
  theme: 'light',
  setTheme: () => {},
  toggle: () => {},
})
export const useTheme = () => useContext(Ctx)

const KEY = 'odo-theme'
const initial = () => {
  const saved = localStorage.getItem(KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initial)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(KEY, theme)
  }, [theme])
  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])
  const value = useMemo(() => ({ theme, setTheme, toggle }), [theme, toggle])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
