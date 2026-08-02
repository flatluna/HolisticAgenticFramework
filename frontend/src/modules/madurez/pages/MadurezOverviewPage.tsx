import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Breadcrumbs, Button, Grid, LinearProgress, ThemeProvider, Typography } from '@mui/material'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import { phases } from '@/layout/phaseData'
import { useEmpresaActiva } from '@/shared/hooks/useEmpresaActiva'
import { readinessTheme } from '../assessmentTheme'
import { AssessmentSummaryPanel } from '../components/AssessmentSummaryPanel'
import { PillarCard } from '../components/PillarCard'
import { DrawerRect, PillarEditDrawer } from '../components/PillarEditDrawer'
import { usePillarAssessment } from '../hooks/usePillarAssessment'
import { PILLARS } from '../data/pillarsData'

// Global 1-21 pipeline position of this step ("Assessment de Preparación
// Organizacional"), used to drive the header and hand off to the next step
// in the sequence defined in phaseData.ts.
const allSteps = phases.flatMap((phase) => phase.steps.map((step, idx) => ({ ...step, phase, phaseStepIndex: idx })))
const stepIndex = allSteps.findIndex((s) => s.path === '/madurez')
const step = allSteps[stepIndex]
const nextGlobalStepPath = allSteps[stepIndex + 1]?.path

export const MadurezOverviewPage = () => {
  const navigate = useNavigate()
  const nombreEmpresa = useEmpresaActiva()
  const {
    pillars,
    toggleEvidenceChip,
    addOtherEvidence,
    setLevel,
    setNotes,
    saveNow,
    assignedCount,
    globalScore,
    weakest,
    strongest,
    canFinish,
    saving,
    hasEngagement,
    lastSavedLabel,
  } = usePillarAssessment()

  const progressPct = Math.round((assignedCount / PILLARS.length) * 100)

  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const leftColumnRef = useRef<HTMLDivElement>(null)
  const [drawerRect, setDrawerRect] = useState<DrawerRect | null>(null)

  // El drawer de edición mide en vivo el rect de la columna de cards (no un
  // ancho fijo) para cubrirla exactamente sin invadir la columna del radar,
  // sin importar breakpoint ni si la barra lateral global está colapsada.
  useEffect(() => {
    if (activeIndex === null) return
    const measure = () => {
      const el = leftColumnRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      setDrawerRect({ top: r.top, left: r.left, width: r.width })
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (leftColumnRef.current) ro.observe(leftColumnRef.current)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [activeIndex])

  const handleFinish = () => {
    if (!canFinish) return
    navigate(nextGlobalStepPath ?? '/fase/h0')
  }

  return (
    <ThemeProvider theme={readinessTheme}>
      <Box sx={{ minHeight: '100%', bgcolor: 'background.default', color: 'text.primary' }}>
        <Box sx={{ px: 3, pt: 2 }}>
          <Breadcrumbs
            separator={<NavigateNextRoundedIcon sx={{ fontSize: 16 }} />}
            sx={{ color: 'text.secondary', fontSize: '0.8rem' }}
          >
            <Typography variant="caption" color="text.secondary">
              {nombreEmpresa || 'Cliente'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {step.phase.code} · {step.phase.label}
            </Typography>
            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>
              Paso {stepIndex} · Assessment
            </Typography>
          </Breadcrumbs>
        </Box>

        <Box
          sx={{
            px: 3,
            py: 2.5,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Paso {stepIndex} · Assessment de Preparación Organizacional
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Evalúa la capacidad de la organización para transformarse
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ minWidth: 180 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Progreso: {assignedCount}/{PILLARS.length} pilares
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {lastSavedLabel}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progressPct}
                sx={{
                  height: 6,
                  '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' },
                }}
              />
            </Box>
            <Button
              variant="outlined"
              startIcon={<SaveRoundedIcon />}
              onClick={saveNow}
              disabled={saving || !hasEngagement}
            >
              Guardar
            </Button>
            <Button
              variant="contained"
              startIcon={<CheckCircleRoundedIcon />}
              onClick={handleFinish}
              disabled={!canFinish}
            >
              Finalizar
            </Button>
          </Box>
        </Box>

        {!hasEngagement && (
          <Box sx={{ px: 3, pt: 2 }}>
            <Typography variant="body2" sx={{ color: 'warning.main' }}>
              No hay una empresa/engagement activo — completa el Paso 0 (Fundamento) primero para poder guardar este
              assessment.
            </Typography>
          </Box>
        )}

        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={7} lg={7.2}>
              <Box ref={leftColumnRef} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {PILLARS.map((pillar, idx) => {
                  const state = pillars.find((p) => p.id === pillar.id)!
                  return (
                    <PillarCard
                      key={pillar.id}
                      pillar={pillar}
                      state={state}
                      active={activeIndex === idx}
                      onClick={() => setActiveIndex(idx)}
                    />
                  )
                })}
              </Box>
            </Grid>
            <Grid item xs={12} md={5} lg={4.8}>
              <Box sx={{ position: 'sticky', top: 16 }}>
                <AssessmentSummaryPanel
                  pillars={pillars}
                  globalScore={globalScore}
                  weakest={weakest}
                  strongest={strongest}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>

      <PillarEditDrawer
        open={activeIndex !== null}
        rect={drawerRect}
        pillar={activeIndex !== null ? PILLARS[activeIndex] : null}
        state={activeIndex !== null ? pillars.find((p) => p.id === PILLARS[activeIndex].id) ?? null : null}
        pillarIndex={activeIndex ?? 0}
        totalPillars={PILLARS.length}
        onClose={() => setActiveIndex(null)}
        onPrev={() => setActiveIndex((i) => (i !== null && i > 0 ? i - 1 : i))}
        onNext={() => setActiveIndex((i) => (i !== null && i < PILLARS.length - 1 ? i + 1 : i))}
        onToggleEvidenceChip={(groupId, value) =>
          activeIndex !== null && toggleEvidenceChip(PILLARS[activeIndex].id, groupId, value)
        }
        onAddOtherEvidence={(groupId, text) =>
          activeIndex !== null && addOtherEvidence(PILLARS[activeIndex].id, groupId, text)
        }
        onSetLevel={(level) => activeIndex !== null && setLevel(PILLARS[activeIndex].id, level)}
        onSetNotes={(notes) => activeIndex !== null && setNotes(PILLARS[activeIndex].id, notes)}
      />
    </ThemeProvider>
  )
}

