import { Box, Tooltip, Typography } from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { READINESS_COLORS } from '@/modules/madurez/assessmentTheme'

export interface DimensionDef {
  key: 'strategicValue' | 'transformPotential' | 'roi' | 'complexity' | 'urgency'
  label: string
  helpText: string
}

// Las 5 dimensiones de evaluación por dominio — SIEMPRE criterio humano
// (1-5), nunca auto-calculadas. "Complejidad" es la única dimensión que
// además recibe una sugerencia editable heredada de Fase 1 (ver
// ComplexityAdjustmentBadge).
export const DIMENSIONS: DimensionDef[] = [
  { key: 'strategicValue', label: 'Valor Estratégico', helpText: 'Impacto en objetivos de negocio clave' },
  { key: 'transformPotential', label: 'Potencial de Transformación', helpText: 'Qué tanto se puede mejorar con agentes/IA' },
  { key: 'roi', label: 'ROI Esperado', helpText: 'Retorno de inversión estimado' },
  { key: 'complexity', label: 'Complejidad', helpText: 'Dificultad de implementación (ajustable por herencia de Fase 1)' },
  { key: 'urgency', label: 'Urgencia', helpText: 'Qué tan pronto se necesita resolver' },
]

// Explicación de cómo se calcula/detecta la complejidad EFECTIVA — mostrada
// como tooltip junto al label "Complejidad" (ver uso más abajo). Se centraliza
// aquí porque el mismo texto aplica tanto en la evaluación de dominio
// (DomainDetailDrawer) como en la de cada proceso (ProcessInventoryEditor).
export const COMPLEXITY_DETECTION_HELP =
  'Complejidad efectiva = complejidad base (1-5, tu criterio) + ajuste heredado de la madurez de Fase 1. ' +
  'Nivel 1 de madurez en Procesos suma +2, Nivel 2 suma +1, Nivel 3 resta -1, Nivel 4 resta -2 ' +
  '(y también se suma/resta el ajuste de Tecnología o Datos si el dominio es sensible a esos pilares). ' +
  'Se considera "alta complejidad" cuando ese valor efectivo llega a 4 o más — por eso un dominio/proceso ' +
  'con poca madurez organizacional puede aparecer como complejo aunque su dificultad base sea moderada.'

const LEVELS = [1, 2, 3, 4, 5] as const

interface DimensionSliderProps {
  def: DimensionDef
  value: number | null
  onChange: (value: number) => void
}

export const DimensionSlider = ({ def, value, onChange }: DimensionSliderProps) => (
  <Box>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
        <Typography variant="overline" color="text.secondary">
          {def.label}
        </Typography>
        {def.key === 'complexity' && (
          <Tooltip title={COMPLEXITY_DETECTION_HELP} arrow>
            <InfoOutlinedIcon sx={{ fontSize: '0.95rem', color: 'text.secondary', cursor: 'help' }} />
          </Tooltip>
        )}
      </Box>
      {value && (
        <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 800 }}>
          {value}/5
        </Typography>
      )}
    </Box>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
      {def.helpText}
    </Typography>
    <Box sx={{ display: 'flex', gap: 0.75 }}>
      {LEVELS.map((level) => {
        const selected = value === level
        return (
          <Box
            key={level}
            onClick={() => onChange(level)}
            sx={{
              flex: 1,
              cursor: 'pointer',
              textAlign: 'center',
              py: 0.85,
              borderRadius: 1.5,
              border: `1px solid ${selected ? READINESS_COLORS.cyan : READINESS_COLORS.border}`,
              bgcolor: selected ? `${READINESS_COLORS.cyan}1F` : 'transparent',
              color: selected ? READINESS_COLORS.cyan : 'text.secondary',
              fontSize: '0.8rem',
              fontWeight: 700,
              transition: 'all 0.15s ease',
              '&:hover': { borderColor: READINESS_COLORS.cyan },
            }}
          >
            {level}
          </Box>
        )
      })}
    </Box>
  </Box>
)
