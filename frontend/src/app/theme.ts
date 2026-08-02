import { createTheme, type PaletteMode, type Theme } from '@mui/material/styles'

// AETP design system — enterprise-grade visual language for a business
// transformation platform. Deeper indigo primary (authority/trust), emerald
// secondary (growth/progress), softer neutral surfaces, richer elevation,
// and a slightly larger, more confident type scale than a typical CRUD app.
//
// One brand accent (indigo + emerald), light & dark variants — no multi-color
// theme picker. For enterprise B2B software a light/dark toggle is standard
// (accessibility, long-session eye strain), but switching the *brand* accent
// color per user is a consumer/dev-tool pattern (VS Code, Discord) that
// dilutes brand identity for enterprise clients — keep one accent, offer
// light/dark only.
export const buildTheme = (mode: PaletteMode): Theme => {
  const isDark = mode === 'dark'

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#6E7CFF' : '#3247D6',
        dark: isDark ? '#3247D6' : '#20308F',
        light: isDark ? '#A6B0FF' : '#6E7CFF',
        contrastText: isDark ? '#0B0E1A' : '#FFFFFF',
      },
      secondary: {
        main: isDark ? '#4FC79B' : '#0F9D77',
        dark: isDark ? '#0F9D77' : '#0B7659',
        light: isDark ? '#8AE0BF' : '#4FC79B',
        contrastText: isDark ? '#0B0E1A' : '#FFFFFF',
      },
      success: {
        main: isDark ? '#4FC79B' : '#189D6E',
        light: isDark ? 'rgba(79, 199, 155, 0.16)' : 'rgba(24, 157, 110, 0.12)',
      },
      warning: {
        main: isDark ? '#E0A03D' : '#B45309',
        light: isDark ? 'rgba(224, 160, 61, 0.16)' : 'rgba(217, 119, 6, 0.12)',
      },
      error: {
        main: isDark ? '#F0708A' : '#D8344B',
        light: isDark ? 'rgba(240, 112, 138, 0.16)' : 'rgba(216, 52, 75, 0.1)',
      },
      info: {
        main: isDark ? '#6EA1FF' : '#2563EB',
        light: isDark ? 'rgba(110, 161, 255, 0.16)' : 'rgba(37, 99, 235, 0.1)',
      },
      background: {
        default: isDark ? '#0E1120' : '#EEF1F8',
        paper: isDark ? '#161A2C' : '#FFFFFF',
      },
      text: {
        primary: isDark ? '#EDEFF7' : '#151A2E',
        secondary: isDark ? '#9AA3C2' : '#606B85',
      },
      divider: isDark ? 'rgba(237, 239, 247, 0.1)' : 'rgba(21, 26, 46, 0.09)',
    },
    shape: {
      borderRadius: 8,
    },
    typography: {
      fontFamily: [
        'Inter',
        'Roboto',
        '-apple-system',
        'BlinkMacSystemFont',
        'Segoe UI',
        'sans-serif',
      ].join(','),
      h1: { fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.01em' },
      h2: { fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.01em' },
      h3: { fontSize: '1.1rem', fontWeight: 700 },
      h4: { fontSize: '1rem', fontWeight: 700 },
      subtitle1: { fontWeight: 700 },
      subtitle2: { fontWeight: 700 },
      button: { textTransform: 'none', fontWeight: 700 },
      overline: { letterSpacing: '0.08em', fontWeight: 800 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isDark ? '#0E1120' : '#EEF1F8',
          },
          '::-webkit-scrollbar': { width: 10, height: 10 },
          '::-webkit-scrollbar-thumb': {
            backgroundColor: isDark ? 'rgba(237, 239, 247, 0.18)' : 'rgba(21, 26, 46, 0.18)',
            borderRadius: 8,
          },
          '::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#161A2C' : '#FFFFFF',
            color: isDark ? '#EDEFF7' : '#151A2E',
            boxShadow: isDark ? '0 1px 2px rgba(0, 0, 0, 0.4)' : '0 1px 2px rgba(21, 26, 46, 0.06)',
            borderBottom: isDark ? '1px solid rgba(237, 239, 247, 0.1)' : '1px solid rgba(21, 26, 46, 0.08)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? '#161A2C' : '#FFFFFF',
            borderRight: isDark ? '1px solid rgba(237, 239, 247, 0.1)' : '1px solid rgba(21, 26, 46, 0.08)',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            marginLeft: 8,
            marginRight: 8,
            marginBottom: 2,
            width: 'auto',
            '&.Mui-selected': {
              backgroundColor: isDark ? 'rgba(110, 124, 255, 0.16)' : 'rgba(50, 71, 214, 0.1)',
              color: isDark ? '#6E7CFF' : '#3247D6',
              '& .MuiListItemIcon-root': {
                color: isDark ? '#6E7CFF' : '#3247D6',
              },
              '&:hover': {
                backgroundColor: isDark ? 'rgba(110, 124, 255, 0.22)' : 'rgba(50, 71, 214, 0.14)',
              },
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            boxShadow: isDark
              ? '0 2px 8px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.25)'
              : '0 2px 8px rgba(21, 26, 46, 0.06), 0 1px 2px rgba(21, 26, 46, 0.05)',
            border: isDark ? '1px solid rgba(237, 239, 247, 0.1)' : '1px solid rgba(21, 26, 46, 0.06)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          elevation1: {
            boxShadow: isDark
              ? '0 2px 8px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.25)'
              : '0 2px 8px rgba(21, 26, 46, 0.06), 0 1px 2px rgba(21, 26, 46, 0.05)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            paddingLeft: 18,
            paddingRight: 18,
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: isDark ? '0 4px 12px rgba(110, 124, 255, 0.3)' : '0 4px 12px rgba(50, 71, 214, 0.25)',
            },
          },
          outlined: {
            borderWidth: 1.5,
            '&:hover': {
              borderWidth: 1.5,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 700,
            borderRadius: 8,
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            height: 3,
            borderRadius: '3px 3px 0 0',
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 700,
            '&.Mui-selected': {
              color: isDark ? '#6E7CFF' : '#3247D6',
            },
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
          bar: {
            borderRadius: 8,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 800,
            backgroundColor: isDark ? '#1C2036' : '#F4F6FB',
            color: isDark ? '#9AA3C2' : '#606B85',
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? '#2A2F4A' : '#151A2E',
            fontSize: '0.72rem',
            borderRadius: 8,
            padding: '6px 10px',
          },
        },
      },
    },
  })
}

// Default export kept for anything that imports the static light theme
// directly instead of using `buildTheme()` / `useThemeMode()`.
export const theme = buildTheme('light')

