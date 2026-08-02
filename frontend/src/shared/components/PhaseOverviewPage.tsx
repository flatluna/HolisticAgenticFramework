import { useNavigate, useParams } from 'react-router-dom'
import { Box, Typography, Card, CardContent, Chip, Button, Grid } from '@mui/material'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import { phases, StepStatus } from '@/layout/phaseData'

const statusMeta: { [key in StepStatus]: { label: string; sx: object } } = {
  completed: { label: 'Completado', sx: { bgcolor: 'success.light', color: 'success.main' } },
  current: { label: 'En curso', sx: { bgcolor: 'rgba(50, 71, 214, 0.1)', color: 'primary.main' } },
  pending: { label: 'Pendiente', sx: { bgcolor: 'action.hover', color: 'text.secondary' } },
  locked: { label: 'Bloqueado', sx: { bgcolor: 'action.hover', color: 'text.disabled' } },
}

// Landing page for a single phase (e.g. "Diagnóstico"), reached from its
// collapsed row in the sidebar. Shows one card per step in that phase; each
// card links to the step's own page. Keeps the sidebar short while still
// letting every step be discovered and opened.
export const PhaseOverviewPage = () => {
  const { phaseId } = useParams<{ phaseId: string }>()
  const navigate = useNavigate()
  const phase = phases.find((p) => p.id === phaseId)

  if (!phase) {
    return null
  }

  const completedCount = phase.steps.filter((s) => s.status === 'completed').length

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <Box sx={{ px: 3, pt: 2.25, pb: 2.5, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Button
          startIcon={<ArrowBackRoundedIcon />}
          size="small"
          color="inherit"
          onClick={() => navigate(-1)}
          sx={{ mb: 1.5, color: 'text.secondary', px: 1 }}
        >
          Volver al recorrido
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              flexShrink: 0,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'primary.main',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.95rem',
            }}
          >
            {phase.code}
          </Box>
          <Box>
            <Typography variant="h2">{phase.label}</Typography>
            <Typography variant="body2" color="text.secondary">
              {completedCount} de {phase.steps.length} pasos completados
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Grid container spacing={2.5}>
          {phase.steps.map((step) => {
            const meta = statusMeta[step.status]
            const disabled = step.status === 'locked'
            return (
              <Grid item xs={12} md={6} key={step.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', opacity: disabled ? 0.65 : 1 }}>
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'rgba(50, 71, 214, 0.08)',
                          color: 'primary.main',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                        }}
                      >
                        {step.code}
                      </Box>
                      <Chip
                        size="small"
                        icon={
                          step.status === 'locked' ? (
                            <LockRoundedIcon sx={{ fontSize: '14px !important' }} />
                          ) : step.status === 'completed' ? (
                            <CheckCircleRoundedIcon sx={{ fontSize: '14px !important' }} />
                          ) : undefined
                        }
                        label={meta.label}
                        sx={meta.sx}
                      />
                    </Box>

                    <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.3 }}>
                      {step.label}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, color: 'text.secondary' }}>
                      <ArticleRoundedIcon sx={{ fontSize: 16, mt: 0.2, flexShrink: 0 }} />
                      <Typography variant="body2">Entregable: {step.deliverable}</Typography>
                    </Box>

                    <Box sx={{ flexGrow: 1 }} />

                    <Button
                      variant={step.status === 'current' ? 'contained' : 'outlined'}
                      endIcon={<ArrowForwardRoundedIcon />}
                      disabled={disabled}
                      onClick={() => navigate(step.path)}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      Abrir paso
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      </Box>
    </Box>
  )
}
