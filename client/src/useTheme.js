import { useEffect, useState } from 'react'

function readStoredTheme() {
  try {
    const stored = localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // storage blocked (private mode, sandboxed iframe) — fall through
  }
  return null
}

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    return readStoredTheme() || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem('theme', theme)
    } catch {
      // ignore
    }
  }, [theme])

  return [theme, setTheme]
}
