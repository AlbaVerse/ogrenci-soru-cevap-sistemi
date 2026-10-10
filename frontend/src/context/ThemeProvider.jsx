import { useCallback, useEffect, useMemo, useState } from 'react'
import { ThemeContext } from './theme-context'

const STORAGE_KEY = 'albaverse.theme' // hassas olmayan tercih: localStorage kullanılabilir
const DARK_QUERY = '(prefers-color-scheme: dark)'

function readPreference() {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    return 'system'
  }
}

const systemPrefersDark = () => typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches

export function ThemeProvider({ children }) {
  const [preference, setPreferenceState] = useState(readPreference)
  const [systemDark, setSystemDark] = useState(systemPrefersDark)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined
    const media = window.matchMedia(DARK_QUERY)
    const onChange = (event) => setSystemDark(event.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const resolvedTheme = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
    document.documentElement.style.colorScheme = resolvedTheme
  }, [resolvedTheme])

  const setPreference = useCallback((next) => {
    setPreferenceState(next)
    try {
      if (next === 'system') localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* depolama kapalıysa tercih yalnızca bu oturumda geçerli olur */
    }
  }, [])

  const toggle = useCallback(
    () => setPreference(resolvedTheme === 'dark' ? 'light' : 'dark'),
    [resolvedTheme, setPreference],
  )

  const value = useMemo(
    () => ({ preference, resolvedTheme, setPreference, toggle }),
    [preference, resolvedTheme, setPreference, toggle],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
