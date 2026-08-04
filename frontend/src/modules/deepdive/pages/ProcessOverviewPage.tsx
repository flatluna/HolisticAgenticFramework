import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Button, Card, Chip, Typography } from '@mui/material'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { PRIORITY_META, actionTypeMeta, iaPotentialMeta } from '../data/catalogs'
import { useDeepDiveProcess } from '../state/deepDiveStore'
import { computeStepStats, desperdicioTotal, esfuerzoTotalProceso, tiempoTotalProceso } from '../utils/stepStats'
import { ProcessFlowGraph } from '../components/ProcessFlowGraph'
import { DataRelationshipsGraph } from '../components/DataRelationshipsGraph'

// /deep-dive/:processId — VISTA GENERAL del proceso. Solo lectura/navegación:
// la captura/edición de un paso vive en su propia página
// (/deep-dive/:processId/paso/:stepId) para no saturar esta vista con un
// formulario largo. Aquí solo se muestran tarjetas resumidas + el grafo de
// flujo entre pasos.
export const ProcessOverviewPage = () => {
  const navigate = useNavigate()
  const { processId } = useParams<{ processId: string }>()
  const process = useDeepDiveProcess(processId)

  const orderedSteps = useMemo(
    () => (process ? [...process.steps].sort((a, b) => a.order - b.order) : []),
    [process],
  )
  const statsById = useMemo(
    () => new Map(orderedSteps.map((s) => [s.id, computeStepStats(s)])),
    [orderedSteps],
  )

  if (!process) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="text.secondary">Proceso no encontrado.</Typography>
        <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/deep-dive')} sx={{ mt: 2 }}>
          Volver a procesos
        </Button>
      </Box>
    )
  }

  const priorityMeta = PRIORITY_META[process.priorityLevel]
  const automatableCount = orderedSteps.filter((s) => s.iaPotential === 'automatizable').length
  const automatablePct = orderedSteps.length > 0 ? Math.round((automatableCount / orderedSteps.length) * 100) : 0
  const totalRisks = orderedSteps.reduce((sum, s) => {
    const stats = statsById.get(s.id)!
    return sum + stats.undocumentedCount + stats.complianceCount
  }, 0)
  // ⏱ Cambio 5/6 del pedido: separar ESFUERZO real (lo que se podría
  // automatizar) de tiempo CALENDARIO (esfuerzo + esperas) y de
  // DESPERDICIO (solo las esperas — la métrica clave FDE: exactamente lo
  // que un agente de IA 24/7 sin colas podría eliminar).
  const esfuerzoTotal = esfuerzoTotalProceso(orderedSteps)
  const tiempoCalendario = tiempoTotalProceso(orderedSteps)
  const desperdicio = desperdicioTotal(orderedSteps)

  const openStep = (stepId: string) => navigate(`/deep-dive/${processId}/paso/${stepId}`)

  return (
    <Box sx={{ minHeight: '100%', bgcolor: 'background.default', color: 'text.primary' }}>
      {/* 1. Header */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Button
            startIcon={<ArrowBackRoundedIcon />}
            size="small"
            color="inherit"
            onClick={() => navigate('/deep-dive')}
            sx={{ alignSelf: 'flex-start', color: 'text.secondary', px: 1 }}
          >
            Volver a procesos
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {process.name}
            </Typography>
            <Chip
              size="small"
              label={`${priorityMeta.emoji} ${priorityMeta.label}`}
              sx={{ bgcolor: `${priorityMeta.color}1F`, color: priorityMeta.color, fontWeight: 700 }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Vista general del proceso — abre un paso para capturar o editar su detalle
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => navigate(`/deep-dive/${processId}/paso/nuevo`)}
        >
          Agregar paso
        </Button>
      </Box>

      {/* e) Barra de stats del proceso completo */}
      <Box
        sx={{
          px: 3,
          py: 1.5,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Chip size="small" label={`${orderedSteps.length}/${process.expectedStepCount} pasos capturados`} />
        <Chip size="small" label={`🟢 ${automatablePct}% automatizable`} />
        <Chip
          size="small"
          label={`⚠️ ${totalRisks} riesgo${totalRisks === 1 ? '' : 's'}`}
          color={totalRisks > 0 ? 'warning' : 'default'}
        />
        <Chip size="small" label={`💪 ${esfuerzoTotal} min esfuerzo`} />
        <Chip size="small" label={`📅 ${tiempoCalendario} min calendario`} />
        <Chip
          size="small"
          label={`⏳ ${desperdicio} min desperdicio`}
          color={desperdicio > 0 ? 'warning' : 'default'}
        />
      </Box>

      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
        {/* a) Tarjetas de pasos, coloreadas por Potencial de automatización IA */}
        <Box>
          <Typography variant="overline" color="text.secondary">
            Pasos capturados
          </Typography>

          {orderedSteps.length === 0 ? (
            <Card variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2, borderStyle: 'dashed', mt: 1 }}>
              <Typography color="text.secondary">Todavía no hay pasos capturados para este proceso.</Typography>
            </Card>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 2,
                mt: 1,
              }}
            >
              {orderedSteps.map((step) => {
                const typeMeta = actionTypeMeta(step.actionType)
                const iaMeta = step.iaPotential ? iaPotentialMeta(step.iaPotential) : null
                const stats = statsById.get(step.id)!
                const color = iaMeta?.color ?? '#9AA3AF'
                return (
                  <Card
                    key={step.id}
                    variant="outlined"
                    onClick={() => openStep(step.id)}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      cursor: 'pointer',
                      borderLeft: '5px solid',
                      borderLeftColor: color,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.75,
                      transition: 'box-shadow 0.2s ease',
                      '&:hover': { boxShadow: 3 },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontWeight: 800, color: 'text.secondary' }}>#{step.order}</Typography>
                      <Typography sx={{ fontSize: '1.1rem' }}>{typeMeta.emoji}</Typography>
                      <Typography sx={{ fontWeight: 700, flexGrow: 1, minWidth: 0 }} noWrap title={step.name}>
                        {step.name || 'Sin nombre'}
                      </Typography>
                    </Box>

                    {iaMeta && (
                      <Chip
                        size="small"
                        label={`${iaMeta.emoji} ${iaMeta.label.split(' (')[0]}`}
                        sx={{ bgcolor: `${iaMeta.color}1F`, color: iaMeta.color, fontWeight: 700, alignSelf: 'flex-start' }}
                      />
                    )}

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                      <Chip size="small" variant="outlined" label={`📥 ${stats.dataCount} dato${stats.dataCount === 1 ? '' : 's'}`} />
                      <Chip size="small" variant="outlined" label={`📋 ${stats.ruleCount} regla${stats.ruleCount === 1 ? '' : 's'}`} />
                      {stats.undocumentedCount > 0 && (
                        <Chip
                          size="small"
                          icon={<WarningAmberRoundedIcon sx={{ fontSize: '14px !important' }} />}
                          label={`${stats.undocumentedCount} no documentada${stats.undocumentedCount === 1 ? '' : 's'}`}
                          color="warning"
                        />
                      )}
                    </Box>

                    <Typography variant="caption" color="text.secondary">
                      💪 {step.tiempos.tiempoActivoMin} min
                      {step.tiempos.tiempoEsperaMin ? ` · ⏳ ${step.tiempos.tiempoEsperaMin} min espera` : ''} · 👤{' '}
                      {step.responsiblePuesto || 'Sin asignar'}
                    </Typography>

                    {stats.systems.length > 0 && (
                      <Typography variant="caption" color="text.secondary" noWrap title={stats.systems.join(', ')}>
                        🖥 {stats.systems.join(', ')}
                      </Typography>
                    )}
                  </Card>
                )
              })}
            </Box>
          )}
        </Box>

        {/* b) Grafo de flujo entre pasos */}
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            🕸 Flujo del proceso
          </Typography>
          <ProcessFlowGraph steps={orderedSteps} onOpenStep={openStep} />
        </Box>

        {/* c) Grafo consolidado de relaciones de datos — agrega el "grafo de
            relaciones" que cada documento subido (en cualquier fuente de
            cualquier paso) propuso, para dar una vista de conjunto en vez de
            solo el mini-grafo aislado por fuente (ver StepCapturePage.tsx). */}
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            🕸 Grafo de relaciones de datos (todas las fuentes del proceso)
          </Typography>
          <DataRelationshipsGraph steps={orderedSteps} />
        </Box>
      </Box>
    </Box>
  )
}
