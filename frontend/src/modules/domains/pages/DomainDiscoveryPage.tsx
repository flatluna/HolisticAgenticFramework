import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Collapse,
  FormControl,
  Grid,
  IconButton,
  MenuItem,
  Select,
  Tab,
  Tabs,
  ThemeProvider,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import TipsAndUpdatesRoundedIcon from '@mui/icons-material/TipsAndUpdatesRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { useNavigate } from 'react-router-dom'
import { phases } from '@/layout/phaseData'
import { useEmpresaActiva } from '@/shared/hooks/useEmpresaActiva'
import { readinessTheme } from '@/modules/madurez/assessmentTheme'
import { INDUSTRIES } from '../data/industriesData'
import { useDomainDiscovery } from '../hooks/useDomainDiscovery'
import { DomainCard } from '../components/DomainCard'
import { DomainDetailDrawer, DrawerRect } from '../components/DomainDetailDrawer'
import { PriorityMatrixView } from '../components/PriorityMatrixView'
import { ProcessPriorityMatrixView } from '../components/ProcessPriorityMatrixView'
import { RankingView } from '../components/RankingView'
import { BusinessCaseView } from '../components/BusinessCaseView'
import { ProcessBusinessCaseView } from '../components/ProcessBusinessCaseView'
import { ProcessRankingView } from '../components/ProcessRankingView'

const allSteps = phases.flatMap((phase) => phase.steps.map((step, idx) => ({ ...step, phase, phaseStepIndex: idx })))
const stepIndex = allSteps.findIndex((s) => s.path === '/dominios')
const step = allSteps[stepIndex]
const nextGlobalStepPath = allSteps[stepIndex + 1]?.path

// Dominios habilitados con el atajo "Datos de prueba" en su card (llena 3
// procesos dummy de un clic, sin abrir el drawer) — solo para pruebas
// manuales rápidas del flujo de guardado, pedido explícitamente para estos
// 3 dominios universales.
const DUMMY_SEED_DOMAIN_IDS = ['finanzas', 'ventas', 'rrhh']

type ViewMode = 'grid' | 'matrix' | 'ranking' | 'process-ranking' | 'business-case'

export const DomainDiscoveryPage = () => {
  const navigate = useNavigate()
  const nombreEmpresa = useEmpresaActiva()
  const {
    selectedIndustryId,
    setSelectedIndustryId,
    evaluatedDomains,
    evaluatedCount,
    domains,
    setBusinessContext,
    toggleSystemChip,
    addProcess,
    updateProcess,
    removeProcess,
    seedDummyProcesses,
    setDimension,
    setComplexityOverride,
    saveNow,
    saving,
    hasEngagement,
    hasInheritanceData,
    lastSavedLabel,
  } = useDomainDiscovery()

  const [view, setView] = useState<ViewMode>('grid')
  const [matrixGranularity, setMatrixGranularity] = useState<'process' | 'domain'>('process')
  const [businessCaseGranularity, setBusinessCaseGranularity] = useState<'process' | 'domain'>('process')
  const [showMethodologyNote, setShowMethodologyNote] = useState(true)
  const [activeDomainId, setActiveDomainId] = useState<string | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [drawerRect, setDrawerRect] = useState<DrawerRect | null>(null)

  const activeIndex = activeDomainId ? domains.findIndex((d) => d.id === activeDomainId) : -1
  const active = activeIndex >= 0 ? evaluatedDomains[activeIndex] : null

  useEffect(() => {
    if (!activeDomainId) return
    const measure = () => {
      const el = contentRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      setDrawerRect({ top: r.top, left: r.left, width: r.width })
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (contentRef.current) ro.observe(contentRef.current)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [activeDomainId])

  const progressPct = domains.length ? Math.round((evaluatedCount / domains.length) * 100) : 0
  const canProceed = evaluatedCount > 0

  const rankingItems = useMemo(
    () => evaluatedDomains.map((d) => ({ domain: d.domain, state: d.state, priorityScore: d.priorityScore, quadrant: d.quadrant })),
    [evaluatedDomains],
  )

  const processRankingItems = useMemo(
    () => evaluatedDomains.map((d) => ({ domain: d.domain, state: d.state, effectiveAdjustment: d.effectiveAdjustment })),
    [evaluatedDomains],
  )

  const handleProceed = () => {
    if (!canProceed) return
    navigate(nextGlobalStepPath ?? '/fase/h1')
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
              {step ? `${step.phase.code} · ${step.phase.label}` : 'L2 · Descubrimiento y Priorización de Dominios de Negocio'}
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Descubrimiento y Priorización de Dominios de Negocio
              </Typography>
              <Tooltip title={showMethodologyNote ? 'Ocultar nota metodológica' : 'Ver nota metodológica'} arrow>
                <IconButton
                  size="small"
                  onClick={() => setShowMethodologyNote((v) => !v)}
                  sx={{ color: showMethodologyNote ? 'primary.main' : 'text.secondary' }}
                >
                  <TipsAndUpdatesRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Selecciona la industria, evalúa cada dominio y prioriza dónde enfocar la transformación
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 260 }}>
              <Select
                displayEmpty
                value={selectedIndustryId ?? ''}
                onChange={(e) => setSelectedIndustryId(e.target.value || null)}
              >
                <MenuItem value="">
                  <em>Sin industria específica (solo dominios universales)</em>
                </MenuItem>
                {INDUSTRIES.map((ind) => (
                  <MenuItem key={ind.id} value={ind.id}>
                    {ind.emoji} {ind.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography variant="caption" color="text.secondary">
              {evaluatedCount}/{domains.length} dominios · {lastSavedLabel}
            </Typography>

            <Button variant="outlined" startIcon={<SaveRoundedIcon />} onClick={saveNow} disabled={saving || !hasEngagement}>
              Guardar
            </Button>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.4 }}>
              <Button
                variant="contained"
                endIcon={<ArrowForwardRoundedIcon />}
                onClick={handleProceed}
                disabled={!canProceed}
              >
                Ir a Fase 3
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 220, textAlign: 'right', lineHeight: 1.3 }}>
                Ranking preliminar — Fase 3 profundiza el análisis técnico de cada proceso
              </Typography>
            </Box>
          </Box>
        </Box>

        <Collapse in={showMethodologyNote}>
          <Box sx={{ px: 3, pt: 2 }}>
            <Alert
              severity="info"
              icon={<TipsAndUpdatesRoundedIcon fontSize="inherit" />}
              action={
                <IconButton size="small" onClick={() => setShowMethodologyNote(false)} sx={{ color: 'inherit' }}>
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              }
              sx={{ alignItems: 'flex-start', '& .MuiAlert-message': { width: '100%' } }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.25 }}>
                Esta priorización es criterio de negocio, no un análisis técnico definitivo
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Los puntajes (1-5 por dimensión) reflejan la experiencia y el juicio del equipo de negocio — son un
                punto de partida sólido para construir el roadmap, no una medición técnica exhaustiva. En{' '}
                <b>Fase 3</b> cada proceso priorizado se evaluará a detalle (volumen, tiempos, sistemas, complejidad
                técnica real) y el score o el cuadrante <b>podría ajustarse</b> con esa información adicional.
              </Typography>
            </Alert>
          </Box>
        </Collapse>

        {!hasEngagement && (
          <Box sx={{ px: 3, pt: 2 }}>
            <Typography variant="body2" sx={{ color: 'warning.main' }}>
              No hay una empresa/engagement activo — completa el Paso 0 (Fundamento) primero para poder guardar este
              descubrimiento de dominios.
            </Typography>
          </Box>
        )}

        {hasEngagement && !hasInheritanceData && (
          <Box sx={{ px: 3, pt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              Aún no completaste el Assessment de Preparación Organizacional (Paso 1) — sin esos niveles, la
              complejidad de cada dominio no recibe ajuste heredado (queda en 0 hasta que se evalúe Fase 1).
            </Typography>
          </Box>
        )}

        <Box sx={{ px: 3, pt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Box sx={{ flexGrow: 1, maxWidth: 320 }}>
              <Box
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: 'rgba(240, 244, 250, 0.08)',
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ height: '100%', width: `${progressPct}%`, bgcolor: 'primary.main' }} />
              </Box>
            </Box>
          </Box>
          <Tabs value={view} onChange={(_, v) => setView(v)} sx={{ minHeight: 36 }}>
            <Tab value="grid" label="Grid de Dominios" sx={{ minHeight: 36 }} />
            <Tab value="matrix" label="Matriz 2×2" sx={{ minHeight: 36 }} />
            <Tab value="ranking" label="Ranking" sx={{ minHeight: 36 }} />
            <Tab value="process-ranking" label="Ranking de Procesos" sx={{ minHeight: 36 }} />
            <Tab value="business-case" label="Business Case" sx={{ minHeight: 36 }} />
          </Tabs>
        </Box>

        <Box ref={contentRef} sx={{ p: 3 }}>
          {view === 'grid' && (
            <Grid container spacing={2}>
              {evaluatedDomains.map(({ domain, state, priorityScore, quadrant }) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={domain.id}>
                  <DomainCard
                    domain={domain}
                    state={state}
                    priorityScore={priorityScore}
                    quadrant={quadrant}
                    onClick={() => setActiveDomainId(domain.id)}
                    onSeedDummy={
                      DUMMY_SEED_DOMAIN_IDS.includes(domain.id) ? () => seedDummyProcesses(domain) : undefined
                    }
                  />
                </Grid>
              ))}
            </Grid>
          )}
          {view === 'matrix' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={matrixGranularity}
                  onChange={(_, v) => v && setMatrixGranularity(v)}
                >
                  <ToggleButton value="process">Por Proceso</ToggleButton>
                  <ToggleButton value="domain">Por Dominio</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              {matrixGranularity === 'process' ? (
                <ProcessPriorityMatrixView items={processRankingItems} onSelect={setActiveDomainId} />
              ) : (
                <PriorityMatrixView items={rankingItems} onSelect={setActiveDomainId} />
              )}
            </Box>
          )}
          {view === 'ranking' && <RankingView items={rankingItems} onSelect={setActiveDomainId} />}
          {view === 'process-ranking' && <ProcessRankingView items={processRankingItems} onSelect={setActiveDomainId} />}
          {view === 'business-case' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={businessCaseGranularity}
                  onChange={(_, v) => v && setBusinessCaseGranularity(v)}
                >
                  <ToggleButton value="process">Por Proceso</ToggleButton>
                  <ToggleButton value="domain">Por Dominio</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              {businessCaseGranularity === 'process' ? (
                <ProcessBusinessCaseView items={processRankingItems} onSelect={setActiveDomainId} />
              ) : (
                <BusinessCaseView items={rankingItems} onSelect={setActiveDomainId} />
              )}
            </Box>
          )}
        </Box>
      </Box>

      <DomainDetailDrawer
        open={activeDomainId !== null}
        rect={drawerRect}
        domain={active?.domain ?? null}
        state={active?.state ?? null}
        autoAdjustment={active?.autoAdjustment ?? 0}
        priorityScore={active?.priorityScore ?? null}
        quadrant={active?.quadrant ?? null}
        domainIndex={Math.max(activeIndex, 0)}
        totalDomains={domains.length}
        onClose={() => setActiveDomainId(null)}
        onPrev={() => setActiveDomainId((_) => (activeIndex > 0 ? domains[activeIndex - 1].id : activeDomainId))}
        onNext={() =>
          setActiveDomainId((_) => (activeIndex < domains.length - 1 ? domains[activeIndex + 1].id : activeDomainId))
        }
        onSetBusinessContext={(text) => activeDomainId && setBusinessContext(activeDomainId, text)}
        onToggleSystemChip={(value) => activeDomainId && toggleSystemChip(activeDomainId, value)}
        onAddProcess={(name) => activeDomainId && addProcess(activeDomainId, name)}
        onUpdateProcess={(processId, patch) => activeDomainId && updateProcess(activeDomainId, processId, patch)}
        onRemoveProcess={(processId) => activeDomainId && removeProcess(activeDomainId, processId)}
        onSetDimension={(dimension, value) => activeDomainId && setDimension(activeDomainId, dimension, value)}
        onSetComplexityOverride={(value) => activeDomainId && setComplexityOverride(activeDomainId, value)}
        onSeedDummy={
          active?.domain && DUMMY_SEED_DOMAIN_IDS.includes(active.domain.id)
            ? () => seedDummyProcesses(active.domain)
            : undefined
        }
      />
    </ThemeProvider>
  )
}
