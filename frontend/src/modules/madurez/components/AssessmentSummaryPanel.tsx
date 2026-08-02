import { Box, Card, CardContent, Typography } from '@mui/material'
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import { MATURITY_LEVEL_LABELS, PILLARS } from '../data/pillarsData'
import { READINESS_COLORS } from '../assessmentTheme'
import { PillarAssessmentState } from '../hooks/usePillarAssessment'

interface AssessmentSummaryPanelProps {
  pillars: PillarAssessmentState[]
  globalScore: number
  weakest: PillarAssessmentState | null
  strongest: PillarAssessmentState | null
}

const scoreRange = (score: number): { label: string; color: string } => {
  if (score === 0) return { label: 'Sin evaluar', color: READINESS_COLORS.textMuted }
  if (score < 2) return { label: 'Inicial', color: READINESS_COLORS.danger }
  if (score < 3) return { label: 'En desarrollo', color: READINESS_COLORS.warning }
  if (score < 3.5) return { label: 'Definido', color: READINESS_COLORS.cyan }
  return { label: 'Avanzado', color: READINESS_COLORS.green }
}

const pillarName = (id: string) => PILLARS.find((p) => p.id === id)?.name ?? id

export const AssessmentSummaryPanel = ({ pillars, globalScore, weakest, strongest }: AssessmentSummaryPanelProps) => {
  const radarData = PILLARS.map((p) => {
    const state = pillars.find((s) => s.id === p.id)
    return { pillar: p.name, value: state?.level ?? 0 }
  })

  const range = scoreRange(globalScore)
  const progressPct = (globalScore / 4) * 100

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Radar de preparación
          </Typography>
          <Box sx={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke={READINESS_COLORS.border} />
                <PolarAngleAxis
                  dataKey="pillar"
                  tick={{ fill: READINESS_COLORS.textMuted, fontSize: 11 }}
                />
                <Radar
                  dataKey="value"
                  stroke={READINESS_COLORS.cyan}
                  fill={READINESS_COLORS.cyan}
                  fillOpacity={0.2}
                  isAnimationActive={false}
                  domain={[0, 4]}
                />
              </RadarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent sx={{ textAlign: 'center' }}>
          <Typography variant="overline" color="text.secondary">
            Preparación global
          </Typography>
          <Typography
            sx={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '2.4rem',
              fontWeight: 700,
              color: range.color,
              lineHeight: 1.2,
            }}
          >
            {globalScore.toFixed(1)} / 4
          </Typography>
          <Box
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'rgba(240, 244, 250, 0.08)',
              overflow: 'hidden',
              mb: 1,
            }}
          >
            <Box sx={{ height: '100%', width: `${progressPct}%`, bgcolor: range.color, transition: 'width 0.3s ease' }} />
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 700, color: range.color }}>
            {range.label}
          </Typography>
        </CardContent>
      </Card>

      {(weakest || strongest) && (
        <Card variant="outlined" sx={{ borderLeft: `3px solid ${READINESS_COLORS.cyan}` }}>
          <CardContent>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              💡 Recomendación
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
              {weakest && (
                <>
                  El pilar más débil es <strong>{pillarName(weakest.id)}</strong> (
                  {weakest.level}/4 · {weakest.level ? MATURITY_LEVEL_LABELS[weakest.level] : ''}). Antes de escalar
                  agentes, priorizar su fortalecimiento.
                  <br />
                </>
              )}
              {strongest && (
                <>
                  Fortaleza principal: <strong>{pillarName(strongest.id)}</strong> ({strongest.level}/4).
                </>
              )}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
