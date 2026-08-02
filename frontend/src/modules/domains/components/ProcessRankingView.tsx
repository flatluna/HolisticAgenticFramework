import { Box, Tooltip, Typography } from '@mui/material'
import { DomainConfig } from '../data/industriesData'
import { computePriorityScore, computeQuadrant, DomainAssessmentState, ProcessInventoryItem, Quadrant } from '../hooks/useDomainDiscovery'
import { QUADRANT_COLORS, QUADRANT_DESCRIPTIONS, QUADRANT_ICONS, QUADRANT_LABELS } from './quadrantMeta'

interface ProcessRankingItem {
  domain: DomainConfig
  process: ProcessInventoryItem
  priorityScore: number
  quadrant: Quadrant
}

interface ProcessRankingSourceItem {
  domain: DomainConfig
  state: DomainAssessmentState
  effectiveAdjustment: number
}

interface ProcessRankingViewProps {
  items: ProcessRankingSourceItem[]
  onSelect: (domainId: string) => void
}

// Ranking de Procesos (4a vista de Pantalla A) — cruza TODOS los procesos de
// TODOS los dominios evaluados en una sola lista ordenada por priorityScore
// desc, usando la MISMA fórmula/dimensiones que el ranking de dominios pero
// evaluada por proceso individual. El dominio se muestra solo como
// etiqueta/badge de contexto; clicar un proceso abre el drawer de SU dominio.
export const ProcessRankingView = ({ items, onSelect }: ProcessRankingViewProps) => {
  const ranked: ProcessRankingItem[] = []
  const pending: { domain: DomainConfig; process: ProcessInventoryItem }[] = []

  for (const { domain, state, effectiveAdjustment } of items) {
    for (const process of state.processInventory) {
      const priorityScore = computePriorityScore(process, effectiveAdjustment)
      const quadrant = computeQuadrant(process, effectiveAdjustment)
      if (priorityScore !== null && quadrant !== null) {
        ranked.push({ domain, process, priorityScore, quadrant })
      } else {
        pending.push({ domain, process })
      }
    }
  }
  ranked.sort((a, b) => b.priorityScore - a.priorityScore)

  if (ranked.length === 0 && pending.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
        Todavía no hay procesos capturados en ningún dominio. Agrega procesos en el Inventario de Procesos de cada
        dominio (Pantalla B) y evalúa sus 5 dimensiones para verlos aquí.
      </Typography>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {ranked.map((item, idx) => {
        const color = QUADRANT_COLORS[item.quadrant]
        return (
          <Box
            key={item.process.id}
            onClick={() => onSelect(item.domain.id)}
            sx={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1.5,
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              borderLeft: `3px solid ${color}`,
              transition: 'border-color 0.15s ease',
              '&:hover': { borderColor: 'primary.main' },
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800, width: 28, color: 'text.secondary' }}>
              #{idx + 1}
            </Typography>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="body1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {item.process.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {item.domain.emoji} {item.domain.name}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>
              Score {item.priorityScore.toFixed(1)}
            </Typography>
            <Tooltip title={QUADRANT_DESCRIPTIONS[item.quadrant]} arrow>
              <Box
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  px: 1,
                  py: 0.25,
                  borderRadius: 1,
                  whiteSpace: 'nowrap',
                  bgcolor: `${color}22`,
                  color,
                  cursor: 'help',
                }}
              >
                {QUADRANT_ICONS[item.quadrant]} {QUADRANT_LABELS[item.quadrant]}
              </Box>
            </Tooltip>
          </Box>
        )
      })}

      {pending.length > 0 && (
        <Box sx={{ mt: 1 }}>
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
                  border: '1px solid',
                  borderColor: 'divider',
                  color: 'text.secondary',
                  '&:hover': { borderColor: 'primary.main' },
                }}
              >
                {domain.emoji} {process.name}
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  )
}
