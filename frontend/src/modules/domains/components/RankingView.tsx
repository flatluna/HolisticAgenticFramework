import { Box, Button, Tooltip, Typography } from '@mui/material'
import { DomainConfig } from '../data/industriesData'
import { DomainAssessmentState, Quadrant } from '../hooks/useDomainDiscovery'
import { QUADRANT_COLORS, QUADRANT_DESCRIPTIONS, QUADRANT_LABELS } from './quadrantMeta'

export interface EvaluatedDomain {
  domain: DomainConfig
  state: DomainAssessmentState
  priorityScore: number | null
  quadrant: Quadrant | null
}

interface RankingViewProps {
  items: EvaluatedDomain[]
  onSelect: (domainId: string) => void
}

// Vista Ranking (una de las 3 vistas de Pantalla A) — dominios evaluados
// ordenados por priorityScore desc, mismo lenguaje visual de tarjeta
// horizontal con borde de color por cuadrante que PillarCard de Fase 1.
export const RankingView = ({ items, onSelect }: RankingViewProps) => {
  const evaluated = items
    .filter((i): i is EvaluatedDomain & { priorityScore: number; quadrant: Quadrant } => i.priorityScore !== null && i.quadrant !== null)
    .sort((a, b) => b.priorityScore - a.priorityScore)
  const pending = items.filter((i) => i.priorityScore === null)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {evaluated.map((item, idx) => {
        const color = QUADRANT_COLORS[item.quadrant]
        return (
          <Box
            key={item.domain.id}
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
            <Typography sx={{ fontSize: '1.2rem' }}>{item.domain.emoji}</Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, flexGrow: 1 }}>
              {item.domain.name}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 800 }}>
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
                  bgcolor: `${color}22`,
                  color,
                  cursor: 'help',
                }}
              >
                {QUADRANT_LABELS[item.quadrant]}
              </Box>
            </Tooltip>
            <Button size="small" variant="text">
              Ver →
            </Button>
          </Box>
        )
      })}

      {pending.length > 0 && (
        <Box sx={{ mt: 1 }}>
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
                  border: '1px solid',
                  borderColor: 'divider',
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
