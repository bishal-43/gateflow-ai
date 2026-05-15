import { useEffect, useCallback } from 'react'

/** GateFlow is dark-theme only; keep hook for compatibility with existing imports. */
export function useTheme() {
  const applyDark = useCallback(() => {
    const html = document.documentElement
    html.classList.add('dark')
    document.body.style.backgroundColor = '#0f172a'
    document.body.style.color = '#f1f5f9'
  }, [])

  useEffect(() => {
    applyDark()
  }, [applyDark])

  const toggleTheme = useCallback(() => {
    applyDark()
  }, [applyDark])

  return { isDark: true, toggleTheme }
}
