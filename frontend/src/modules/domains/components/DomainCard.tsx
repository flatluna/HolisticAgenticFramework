import { Box, Button, Card, CardContent, Tooltip, Typography } from '@mui/material'
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded'
import { READINESS_COLORS } from '@/modules/madurez/assessmentTheme'
import { DomainConfig } from '../data/industriesData'
import { DomainAssessmentState, Quadrant } from '../hooks/useDomainDiscovery'
import { QUADRANT_COLORS, QUADRANT_DESCRIPTIONS, QUADRANT_LABELS } from './quadrantMeta'

interface DomainCardProps {
  domain: DomainConfig
  state: DomainAssessmentState
  priorityScore: number | null
  quadrant: Quadrant | null
  onClick: () => void
  // Solo se pasa para los dominios habilitados como atajo de pruebas
  // manuales (ver DomainDiscoveryPage) — agrega 3 procesos dummy sin abrir
  // el drawer, para probar el guardado end-to-end rápido.
  onSeedDummy?: () => void
}

const DIMENSION_KEYS = ['strategicValue', 'transformPotential', 'roi', 'complexity', 'urgency'] as const

// Tarjeta de dominio para la grid de Pantalla A — evaluado o no, siempre
// clickeable para abrir el Drawer de detalle (Pantalla B). El borde
// izquierdo se colorea por cuadrante una vez evaluado (mismo lenguaje
// visual que PillarCard de Fase 1: color = criterio ya emitido).
export const DomainCard = ({ domain, state, priorityScore, quadrant, onClick, onSeedDummy }: DomainCardProps) => {
  const evaluatedDimensions = DIMENSION_KEYS.filter((k) => state[k] !== null).length
  const accentColor = quadrant ? QUADRANT_COLORS[quadrant] : READINESS_COLORS.border

  return (
    <Card
      variant="outlined"
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        height: '100%',
        borderLeft: `3px solid ${accentColor}`,
        boxShadow: quadrant ? `0 0 24px -10px ${accentColor}55` : 'none',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        '&:hover': { borderColor: 'primary.main' },
      }}
    >
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1, height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Typography sx={{ fontSize: '1.3rem', lineHeight: 1 }}>{domain.emoji}</Typography>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              {domain.name}
            </Typography>
            <Box
              sx={{
                display: 'inline-block',
                mt: 0.4,
                fontSize: '0.65rem',
                fontWeight: 700,
                px: 0.6,
                py: 0.1,
                borderRadius: 1,
                bgcolor: 'rgba(240, 244, 250, 0.06)',
                color: 'text.secondary',
              }}
            >
              {domain.layer === 'universal' ? 'Universal' : 'Específico de industria'}
            </Box>
          </Box>
        </Box>

        {onSeedDummy && (
          <Button
            size="small"
            variant="text"
            startIcon={<ScienceRoundedIcon sx={{ fontSize: '14px !important' }} />}
            onClick={(e) => {
              e.stopPropagation()
              onSeedDummy()
            }}
            sx={{ alignSelf: 'flex-start', fontSize: '0.68rem', py: 0.15, px: 0.75, minWidth: 0 }}
          >
            Datos de prueba
          </Button>
        )}

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
        >
          {domain.description}
        </Typography>

        <Box sx={{ display: 'flex', gap: 0.5, mt: 'auto' }}>
          {DIMENSION_KEYS.map((k) => (
            <Box
              key={k}
              sx={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                bgcolor: state[k] ? 'primary.main' : 'rgba(240, 244, 250, 0.08)',
              }}
            />
          ))}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {evaluatedDimensions}/5 dimensiones
          </Typography>
          {priorityScore !== null && quadrant ? (
            <Tooltip title={QUADRANT_DESCRIPTIONS[quadrant]} arrow>
              <Box
                sx={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  px: 0.85,
                  py: 0.15,
                  borderRadius: 1,
                  bgcolor: `${accentColor}22`,
                  color: accentColor,
                  cursor: 'help',
                }}
              >
                {priorityScore.toFixed(1)} · {QUADRANT_LABELS[quadrant]}
              </Box>
            </Tooltip>
          ) : (
            <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
              Sin evaluar
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}
