import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { PaletteMode } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { buildTheme } from './theme'

const THEME_MODE_STORAGE_KEY = 'aetp.theme.mode'

interface ThemeModeContextValue {
  mode: PaletteMode
  toggleMode: () => void
}

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null)

const readStoredMode = (): PaletteMode => {
  const stored = localStorage.getItem(THEME_MODE_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  // Respetar la preferencia del sistema operativo la primera vez.
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Provee el modo claro/oscuro a toda la app (persistido en localStorage) y
// envuelve el árbol con el ThemeProvider de MUI ya construido para ese modo.
export const ThemeModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<PaletteMode>(() => readStoredMode())

  useEffect(() => {
    localStorage.setItem(THEME_MODE_STORAGE_KEY, mode)
  }, [mode])

  const value = useMemo<ThemeModeContextValue>(
    () => ({
      mode,
      toggleMode: () => setMode((prev) => (prev === 'light' ? 'dark' : 'light')),
    }),
    [mode],
  )

  const theme = useMemo(() => buildTheme(mode), [mode])

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  )
}

export const useThemeMode = (): ThemeModeContextValue => {
  const ctx = useContext(ThemeModeContext)
  if (!ctx) {
    throw new Error('useThemeMode must be used within a ThemeModeProvider')
  }
  return ctx
}
