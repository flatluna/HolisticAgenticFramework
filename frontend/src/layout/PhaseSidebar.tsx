import { Box, Divider, Typography } from '@mui/material'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import GavelRoundedIcon from '@mui/icons-material/GavelRounded'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import DnsRoundedIcon from '@mui/icons-material/DnsRounded'
import { useNavigate, useLocation } from 'react-router-dom'
import { phases, flatNavItems, StepStatus, phasePath, getPhaseStatus } from './phaseData'
import { useDeepDiveTotals } from '@/modules/deepdive/state/deepDiveStore'

const flatIcons: { [key: string]: JSX.Element } = {
  trazabilidad: <TimelineRoundedIcon fontSize="small" />,
  entregables: <DescriptionRoundedIcon fontSize="small" />,
  decisiones: <GavelRoundedIcon fontSize="small" />,
  'diccionario-datos': <MenuBookRoundedIcon fontSize="small" />,
  'catalogo-sistemas': <DnsRoundedIcon fontSize="small" />,
  administracion: <SettingsRoundedIcon fontSize="small" />,
}

const nodeStyles: { [key in StepStatus]: { bg: string; border: string; color: string } } = {
  completed: { bg: 'success.main', border: 'success.main', color: '#fff' },
  current: { bg: 'primary.main', border: 'primary.main', color: '#fff' },
  locked: { bg: 'background.paper', border: 'divider', color: 'text.disabled' },
  pending: { bg: 'background.paper', border: 'divider', color: 'text.disabled' },
}

// One accent color per level (L1, L2, L3…) so each phase is visually
// distinct in the sidebar at a glance, cycling if more levels are added.
const LEVEL_COLORS = ['#3247D6', '#00B0A6', '#E8916A', '#B15DE0', '#2BA85B', '#E0526B']
const levelColor = (phaseIdx: number) => LEVEL_COLORS[phaseIdx % LEVEL_COLORS.length]

// Reuses the same font pairing as the madurez module: 'Space Grotesk' for
// headings/labels, 'IBM Plex Mono' for codes/counters — both already loaded
// via Google Fonts in index.html.
const HEADING_FONT = "'Space Grotesk', sans-serif"
const MONO_FONT = "'IBM Plex Mono', monospace"

export const PhaseSidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  // L3 (Deep Dive de Procesos) no cuenta "pasos" a nivel de fase como L1/L2
  // — su avance real vive en los pasos capturados por proceso (ver
  // deepDiveStore). Se usa aquí solo para ese contador; el resto de fases
  // sigue usando phase.steps normalmente.
  const deepDiveTotals = useDeepDiveTotals()

  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ px: 3, mb: 0.5 }}>
        <Typography variant="overline" color="primary" sx={{ display: 'block', fontSize: '0.65rem' }}>
          Recorrido de transformación
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
          De la estrategia a la operación con agentes de IA
        </Typography>
      </Box>

      {/* One row per phase (not per step) — clicking opens that phase's
          overview page, which shows a card per step. Keeps the sidebar
          short while still surfacing the whole journey. */}
      <Box sx={{ px: 2, pt: 1.5 }}>
        {phases.map((phase, phaseIdx) => {
          const status = getPhaseStatus(phase)
          const style = nodeStyles[status]
          const accent = levelColor(phaseIdx)
          const useAccent = status === 'current' || status === 'pending'
          const isLastPhase = phaseIdx === phases.length - 1
          const completedCount =
            phase.id === 'h2' ? deepDiveTotals.totalCaptured : phase.steps.filter((s) => s.status === 'completed').length
          const totalCount = phase.id === 'h2' ? deepDiveTotals.totalExpected : phase.steps.length
          const selected =
            location.pathname === phasePath(phase) || phase.steps.some((s) => s.path === location.pathname)

          return (
            <Box key={phase.id} sx={{ display: 'flex', gap: 1.25 }}>
              <Box sx={{ width: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: useAccent ? `${accent}1F` : style.bg,
                    border: 2,
                    borderColor: useAccent ? accent : style.border,
                    color: useAccent ? accent : style.color,
                    flexShrink: 0,
                  }}
                >
                  {status === 'completed' && <CheckRoundedIcon sx={{ fontSize: 13 }} />}
                  {status === 'locked' && <LockRoundedIcon sx={{ fontSize: 11 }} />}
                  {(status === 'current' || status === 'pending') && (
                    <Typography sx={{ fontSize: '0.58rem', fontWeight: 800, fontFamily: MONO_FONT }}>
                      {phase.code}
                    </Typography>
                  )}
                </Box>
                {!isLastPhase && (
                  <Box
                    sx={{
                      flexGrow: 1,
                      width: 2,
                      minHeight: 18,
                      mt: 0.5,
                      background: `linear-gradient(${accent}, ${levelColor(phaseIdx + 1)})`,
                    }}
                  />
                )}
              </Box>

              <Box
                onClick={() => navigate(phasePath(phase))}
                sx={{
                  flexGrow: 1,
                  minWidth: 0,
                  pb: 1.75,
                  pt: 0.1,
                  cursor: 'pointer',
                  borderRadius: 1.5,
                  px: 1,
                  ml: -1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 0.5,
                  bgcolor: selected ? `${accent}14` : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontFamily: HEADING_FONT,
                      fontSize: '0.78rem',
                      fontWeight: selected ? 700 : 600,
                      lineHeight: 1.25,
                      color: 'text.primary',
                    }}
                  >
                    {phase.label}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.15 }}>
                    <Typography
                      sx={{ fontFamily: MONO_FONT, fontSize: '0.62rem', fontWeight: 700, color: accent }}
                    >
                      {phase.code}
                    </Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                      · {completedCount}/{totalCount} pasos
                    </Typography>
                  </Box>
                </Box>
                <ChevronRightRoundedIcon sx={{ fontSize: 16, color: 'text.disabled', flexShrink: 0 }} />
              </Box>
            </Box>
          )
        })}
      </Box>

      <Divider sx={{ my: 1.5, mx: 2 }} />

      <Box sx={{ px: 2 }}>
        {flatNavItems.map((item) => {
          const selected = location.pathname === item.path
          return (
            <Box
              key={item.id}
              onClick={() => navigate(item.path)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                px: 1.5,
                py: 0.75,
                borderRadius: 1.5,
                cursor: 'pointer',
                bgcolor: selected ? 'rgba(50, 71, 214, 0.08)' : 'transparent',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Box sx={{ color: 'text.secondary', display: 'flex' }}>{flatIcons[item.id]}</Box>
              <Typography sx={{ fontSize: '0.78rem', fontWeight: selected ? 700 : 600 }}>{item.label}</Typography>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

