import { Box, Card, CardContent, Typography } from '@mui/material'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import { MATURITY_LEVEL_LABELS, Pillar } from '../data/pillarsData'
import { MATURITY_LEVEL_COLORS, READINESS_COLORS } from '../assessmentTheme'
import { PillarAssessmentState } from '../hooks/usePillarAssessment'

interface PillarCardProps {
  pillar: Pillar
  state: PillarAssessmentState
  active?: boolean
  onClick: () => void
}

// Fila compacta de un pilar (sin acordeón inline) — al hacer click abre el
// PillarEditDrawer lateral donde vive toda la edición (evidencia, nivel,
// notas), dejando el radar/score de la derecha siempre visible.
export const PillarCard = ({ pillar, state, active = false, onClick }: PillarCardProps) => {
  const evidenceCount = state.evidenceGroups.reduce((sum, g) => sum + g.selected.length, 0)
  const levelColor = state.level ? MATURITY_LEVEL_COLORS[state.level] : READINESS_COLORS.border

  return (
    <Card
      variant="outlined"
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        borderLeft: `3px solid ${levelColor}`,
        boxShadow: state.level ? `0 0 24px -8px ${levelColor}55` : 'none',
        outline: active ? `2px solid ${READINESS_COLORS.cyan}` : 'none',
        outlineOffset: -1,
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease, outline 0.15s ease',
        '&:hover': { borderColor: 'primary.main' },
      }}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography sx={{ fontSize: '1.4rem', lineHeight: 1 }}>{pillar.icon}</Typography>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              {pillar.name}
            </Typography>
            <Box
              sx={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.68rem',
                fontWeight: 600,
                px: 0.75,
                py: 0.15,
                borderRadius: 1,
                bgcolor: 'rgba(240, 244, 250, 0.06)',
                color: 'text.secondary',
              }}
            >
              {evidenceCount} evidencia{evidenceCount === 1 ? '' : 's'}
            </Box>
            {state.level && (
              <Box
                sx={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  px: 0.85,
                  py: 0.15,
                  borderRadius: 1,
                  bgcolor: `${levelColor}22`,
                  color: levelColor,
                }}
              >
                {MATURITY_LEVEL_LABELS[state.level]}
              </Box>
            )}
          </Box>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {pillar.description}
          </Typography>
        </Box>
        <ChevronRightRoundedIcon sx={{ color: 'text.secondary', flexShrink: 0 }} />
      </CardContent>
    </Card>
  )
}

