import { Box, Tooltip, Typography } from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { READINESS_COLORS } from '@/modules/madurez/assessmentTheme'
import { Quadrant } from '../hooks/useDomainDiscovery'
import { EvaluatedDomain } from './RankingView'
import { COMPLEXITY_DETECTION_HELP } from './DimensionSlider'
import { QUADRANT_COLORS, QUADRANT_DESCRIPTIONS, QUADRANT_ICONS, QUADRANT_LABELS } from './quadrantMeta'

interface PriorityMatrixViewProps {
  items: EvaluatedDomain[]
  onSelect: (domainId: string) => void
}

// Matriz 2x2 (Eje X = complejidad efectiva, Eje Y = valor estratégico) — una
// de las 3 vistas de Pantalla A. Solo muestra dominios ya evaluados (con
// las 5 dimensiones capturadas); los pendientes se listan aparte.
export const PriorityMatrixView = ({ items, onSelect }: PriorityMatrixViewProps) => {
  const evaluated = items.filter(
    (i): i is EvaluatedDomain & { priorityScore: number; quadrant: Quadrant } => i.priorityScore !== null && i.quadrant !== null,
  )
  const pending = items.filter((i) => i.priorityScore === null)

  const byQuadrant: Record<Quadrant, typeof evaluated> = {
    'do-now': evaluated.filter((i) => i.quadrant === 'do-now'),
    plan: evaluated.filter((i) => i.quadrant === 'plan'),
    'quick-win': evaluated.filter((i) => i.quadrant === 'quick-win'),
    later: evaluated.filter((i) => i.quadrant === 'later'),
  }

  const renderQuadrant = (quadrant: Quadrant) => (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: `1px solid ${QUADRANT_COLORS[quadrant]}44`,
        bgcolor: `${QUADRANT_COLORS[quadrant]}0D`,
        minHeight: 160,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: QUADRANT_COLORS[quadrant] }}>
          {QUADRANT_ICONS[quadrant]} {QUADRANT_LABELS[quadrant]}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {QUADRANT_DESCRIPTIONS[quadrant]}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
        {byQuadrant[quadrant].map((item) => (
          <Box
            key={item.domain.id}
            onClick={() => onSelect(item.domain.id)}
            sx={{
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: 700,
              px: 1,
              py: 0.5,
              borderRadius: 1.5,
              bgcolor: 'background.paper',
              border: `1px solid ${QUADRANT_COLORS[quadrant]}66`,
              '&:hover': { borderColor: QUADRANT_COLORS[quadrant] },
            }}
          >
            {item.domain.emoji} {item.domain.name} · {item.priorityScore.toFixed(1)}
          </Box>
        ))}
        {byQuadrant[quadrant].length === 0 && (
          <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            Sin dominios aquí todavía
          </Typography>
        )}
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        {renderQuadrant('do-now')}
        {renderQuadrant('plan')}
        {renderQuadrant('quick-win')}
        {renderQuadrant('later')}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
        ← Baja complejidad · Alta complejidad → &nbsp;|&nbsp; ↑ Alto valor · Bajo valor ↓
        <Tooltip title={COMPLEXITY_DETECTION_HELP} arrow>
          <InfoOutlinedIcon sx={{ fontSize: '0.95rem', color: 'text.secondary', cursor: 'help' }} />
        </Tooltip>
      </Typography>

      {pending.length > 0 && (
        <Box>
          <Typography variant="overline" color="text.secondary">
            Pendientes de evaluar ({pending.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.75 }}>
            {pending.map((item) => (
              <Box
                key={item.domain.id}
                onClick={() => onSelect(item.domain.id)}
                sx={{
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  px: 1.25,
                  py: 0.5,
                  borderRadius: 5,
                  border: `1px solid ${READINESS_COLORS.border}`,
                  color: 'text.secondary',
                  '&:hover': { borderColor: 'primary.main' },
                }}
              >
                {item.domain.emoji} {item.domain.name}
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  )
}
