import { createTheme, type Theme } from '@mui/material/styles'

// Design system dedicado para Paso 1 · Assessment de Preparación
// Organizacional — dark-mode-only, independiente del tema claro/oscuro del
// resto de la app (nested ThemeProvider). Tokens tomados literalmente del
// handoff de diseño.
export const READINESS_COLORS = {
  bg: '#0A0F1C',
  surface: '#121A2B',
  surfaceElev: '#1A2438',
  border: '#263248',
  text: '#F0F4FA',
  textMuted: '#7E8BA3',
  cyan: '#00D4E0',
  blue: '#2B6FF5',
  green: '#34E5A0',
  warning: '#FFB020',
  danger: '#FF5A5F',
  glow: 'rgba(0, 212, 224, 0.15)',
} as const

export const MATURITY_LEVEL_COLORS: Record<1 | 2 | 3 | 4, string> = {
  1: READINESS_COLORS.danger,
  2: READINESS_COLORS.warning,
  3: READINESS_COLORS.cyan,
  4: READINESS_COLORS.green,
}

export const readinessTheme: Theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: READINESS_COLORS.cyan, contrastText: '#04202A' },
    secondary: { main: READINESS_COLORS.blue, contrastText: '#FFFFFF' },
    success: { main: READINESS_COLORS.green },
    warning: { main: READINESS_COLORS.warning },
    error: { main: READINESS_COLORS.danger },
    info: { main: READINESS_COLORS.blue },
    background: { default: READINESS_COLORS.bg, paper: READINESS_COLORS.surface },
    text: { primary: READINESS_COLORS.text, secondary: READINESS_COLORS.textMuted },
    divider: READINESS_COLORS.border,
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: "'Inter', sans-serif",
    h1: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 },
    h2: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 },
    h3: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 },
    h4: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 },
    h5: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 },
    h6: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 },
    subtitle1: { fontWeight: 700 },
    subtitle2: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 700 },
    overline: { letterSpacing: '0.08em', fontWeight: 800 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: READINESS_COLORS.bg },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${READINESS_COLORS.border}`,
          backgroundColor: READINESS_COLORS.surface,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 700 },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: { color: READINESS_COLORS.textMuted },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { backgroundColor: 'rgba(240, 244, 250, 0.08)', borderRadius: 6 },
      },
    },
  },
})
