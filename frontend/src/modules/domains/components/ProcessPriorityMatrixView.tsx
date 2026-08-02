import { Box, Tooltip, Typography } from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { READINESS_COLORS } from '@/modules/madurez/assessmentTheme'
import { DomainConfig } from '../data/industriesData'
import { computePriorityScore, computeQuadrant, DomainAssessmentState, ProcessInventoryItem, Quadrant } from '../hooks/useDomainDiscovery'
import { COMPLEXITY_DETECTION_HELP } from './DimensionSlider'
import { QUADRANT_COLORS, QUADRANT_DESCRIPTIONS, QUADRANT_ICONS, QUADRANT_LABELS } from './quadrantMeta'

interface ProcessMatrixItem {
  domain: DomainConfig
  process: ProcessInventoryItem
  priorityScore: number
  quadrant: Quadrant
}

interface ProcessPriorityMatrixSourceItem {
  domain: DomainConfig
  state: DomainAssessmentState
  effectiveAdjustment: number
}

interface ProcessPriorityMatrixViewProps {
  items: ProcessPriorityMatrixSourceItem[]
  onSelect: (domainId: string) => void
}

// Matriz 2x2 a nivel de PROCESO (Eje X = complejidad efectiva, Eje Y = valor
// estratégico) — variante de PriorityMatrixView que evita el problema de
// "promediar" un dominio que en realidad tiene procesos en cuadrantes muy
// distintos (ej. 3 procesos "Hazlo ya" y 5 "Planifica" dentro del mismo
// dominio). Cruza todos los procesos de todos los dominios evaluados, igual
// que ProcessRankingView, pero agrupados visualmente por cuadrante.
export const ProcessPriorityMatrixView = ({ items, onSelect }: ProcessPriorityMatrixViewProps) => {
  const evaluated: ProcessMatrixItem[] = []
  const pending: { domain: DomainConfig; process: ProcessInventoryItem }[] = []

  for (const { domain, state, effectiveAdjustment } of items) {
    for (const process of state.processInventory) {
      const priorityScore = computePriorityScore(process, effectiveAdjustment)
      const quadrant = computeQuadrant(process, effectiveAdjustment)
      if (priorityScore !== null && quadrant !== null) {
        evaluated.push({ domain, process, priorityScore, quadrant })
      } else {
        pending.push({ domain, process })
      }
    }
  }

  const byQuadrant: Record<Quadrant, ProcessMatrixItem[]> = {
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
            key={item.process.id}
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
            {item.process.name} · {item.priorityScore.toFixed(1)}
            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
              ({item.domain.emoji} {item.domain.name})
            </Typography>
          </Box>
        ))}
        {byQuadrant[quadrant].length === 0 && (
          <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            Sin procesos aquí todavía
          </Typography>
        )}
      </Box>
    </Box>
  )

  if (evaluated.length === 0 && pending.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
        Todavía no hay procesos capturados en ningún dominio. Agrega procesos en el Inventario de Procesos de cada
        dominio (Pantalla B) y evalúa sus 5 dimensiones para verlos aquí.
      </Typography>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        {renderQuadrant('do-now')}
        {renderQuadrant('plan')}
        {renderQuadrant('quick-win')}
        {renderQuadrant('later')}
      </Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}
      >
        ← Baja complejidad · Alta complejidad → &nbsp;|&nbsp; ↑ Alto valor · Bajo valor ↓
        <Tooltip title={COMPLEXITY_DETECTION_HELP} arrow>
          <InfoOutlinedIcon sx={{ fontSize: '0.95rem', color: 'text.secondary', cursor: 'help' }} />
        </Tooltip>
      </Typography>

      {pending.length > 0 && (
        <Box>
          <Typography variant="overline" color="text.secondary">
            Procesos pendientes de evaluar ({pending.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.75 }}>
            {pending.map(({ domain, process }) => (
              <Box
                key={process.id}
                onClick={() => onSelect(domain.id)}
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
                {process.name} <Typography component="span" variant="caption">({domain.emoji} {domain.name})</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  )
}
