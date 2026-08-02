import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Grid, Card, CardActionArea, CardContent, Typography, Chip, Stack, CircularProgress } from '@mui/material'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import { StepHeader } from '@/layout/StepHeader'
import { phases } from '@/layout/phaseData'
import { sectionCatalog, type SectionCatalogItem } from '../sectionCatalog'
import { useAcumenBootstrap } from '../useAcumenBootstrap'
import {
  getCompanyProfile,
  getEngagementMandate,
  getEngagementMissionVision,
  listStakeholders,
} from '../services/api'

const EMPRESA_STORAGE_KEY = 'aetp.empresa.perfil'

// Paso 0 ('/') is the first node of the real flow defined in phaseData.ts:
// "Executive Alignment & Customer Intimacy" — before talking about
// processes, agents or architecture, understand the business. Step number
// and "next step" hand-off are derived from phaseData.ts (not hardcoded) so
// they stay correct as the roadmap evolves.
const allSteps = phases.flatMap((phase) => phase.steps.map((step) => step))
const stepIndex = allSteps.findIndex((s) => s.path === '/')
const nextStepPath = allSteps[stepIndex + 1]?.path

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

interface SectionRuntimeMeta {
  createdAt: string
  updatedAt: string
}

export const StrategyFoundationPage = () => {
  const navigate = useNavigate()
  // Resolves (and, in test mode, auto-restores) the active company context
  // before we try to read its real data from SQL below.
  const ready = useAcumenBootstrap()
  const [sectionRuntime, setSectionRuntime] = useState<
    Partial<Record<SectionCatalogItem['key'], SectionRuntimeMeta>>
  >({})
  const [loadingRuntime, setLoadingRuntime] = useState(true)

  useEffect(() => {
    if (!ready) return

    let cancelled = false

    const loadSectionData = async () => {
      const raw = localStorage.getItem(EMPRESA_STORAGE_KEY)
      let engagementId: string | undefined
      try {
        engagementId = raw ? (JSON.parse(raw) as { engagementId?: string }).engagementId : undefined
      } catch {
        engagementId = undefined
      }

      if (!engagementId) {
        if (!cancelled) setLoadingRuntime(false)
        return
      }

      // Every section's "creado"/"actualizado" comes straight from SQL
      // (CreatedAt/UpdatedAt columns), never from localStorage.
      const [profileResult, stakeholdersResult, mandateResult, missionVisionResult] = await Promise.allSettled([
        getCompanyProfile(engagementId),
        listStakeholders(engagementId),
        getEngagementMandate(engagementId),
        getEngagementMissionVision(engagementId),
      ])

      if (cancelled) return

      const next: Partial<Record<SectionCatalogItem['key'], SectionRuntimeMeta>> = {}

      if (profileResult.status === 'fulfilled') {
        const p = profileResult.value
        next.empresa = { createdAt: p.createdAt, updatedAt: p.updatedAt ?? p.createdAt }
      }

      if (stakeholdersResult.status === 'fulfilled' && stakeholdersResult.value.length > 0) {
        const list = stakeholdersResult.value
        const createdTimes = list.map((s) => new Date(s.createdAt).getTime())
        const updatedTimes = list.map((s) => new Date(s.updatedAt ?? s.createdAt).getTime())
        next['org-design'] = {
          createdAt: new Date(Math.min(...createdTimes)).toISOString(),
          updatedAt: new Date(Math.max(...updatedTimes)).toISOString(),
        }
      }

      if (mandateResult.status === 'fulfilled') {
        const m = mandateResult.value
        const hasData = Boolean(
          m.objective || m.includedScope || m.excludedScope || m.executiveSponsor || m.stakeholders.length,
        )
        if (hasData) {
          next.mandato = { createdAt: m.createdAt, updatedAt: m.updatedAt ?? m.createdAt }
        }
      }

      if (missionVisionResult.status === 'fulfilled') {
        const mv = missionVisionResult.value
        if (mv.mission || mv.vision) {
          next['business-strategy'] = { createdAt: mv.createdAt, updatedAt: mv.updatedAt ?? mv.createdAt }
        }
      }

      setSectionRuntime(next)
      setLoadingRuntime(false)
    }

    loadSectionData()

    return () => {
      cancelled = true
    }
  }, [ready])

  const completedCount = sectionCatalog.filter((s) => sectionRuntime[s.key]).length
  const progress = Math.round((completedCount / sectionCatalog.length) * 100)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <Box sx={{ position: 'sticky', top: 0, zIndex: 2 }}>
        <StepHeader
          stepNumber={stepIndex}
          title="EXECUTIVE ALIGNMENT & CUSTOMER INTIMACY"
          description="Antes de hablar de procesos, agentes o arquitectura: hay que entender la empresa."
          progress={progress}
          lastSaved={completedCount > 0 ? 'Ver tarjetas' : 'Sin guardar'}
        />
      </Box>

      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Box
          sx={{
            mb: 3,
            p: 2.5,
            borderRadius: 3,
            border: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            borderLeft: 4,
            borderLeftColor: 'primary.main',
          }}
        >
          <Typography variant="overline" color="primary" sx={{ display: 'block', mb: 0.5 }}>
            Objetivo
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Entender el negocio. Capturar: estrategia, prioridades ejecutivas, objetivos, problemas, presiones,
            drivers de transformación y la razón para explorar IA.
          </Typography>
          <Typography variant="overline" color="primary" sx={{ display: 'block', mb: 0.5 }}>
            Pregunta principal
          </Typography>
          <Typography variant="subtitle1" sx={{ fontStyle: 'italic', fontWeight: 700, color: 'text.primary' }}>
            &ldquo;Why does the business want to transform?&rdquo;
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Este paso reúne el contexto estratégico del cliente: quién es, hacia dónde va y qué modelo de negocio
          opera. Abre cada tarjeta para completar su sección y avanzar hacia la aprobación.
        </Typography>

        {!ready || loadingRuntime ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, py: 8 }}>
            <CircularProgress size={22} />
            <Typography variant="body2" color="text.secondary">
              Cargando datos de la empresa...
            </Typography>
          </Box>
        ) : (
        <Grid container spacing={2.5}>
          {sectionCatalog.map((section) => {
            const meta = sectionRuntime[section.key]
            return (
              <Grid item xs={12} sm={6} lg={3} key={section.key}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2,
                    borderColor: 'divider',
                    boxShadow: 'none',
                    transition: 'border-color 0.15s ease, background-color 0.15s ease',
                    '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(50, 71, 214, 0.02)' },
                  }}
                >
                  <CardActionArea
                    onClick={() => navigate(section.path)}
                    sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                  >
                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1.5, p: 2.5 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'rgba(50, 71, 214, 0.08)',
                          color: 'primary.main',
                        }}
                      >
                        {section.icon}
                      </Box>

                      <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.3 }}>
                        {section.shortLabel}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                        {section.description}
                      </Typography>

                      <Chip
                        size="small"
                        label={meta ? 'En progreso' : 'Pendiente'}
                        sx={{
                          alignSelf: 'flex-start',
                          fontWeight: 700,
                          bgcolor: meta ? 'rgba(15, 157, 119, 0.12)' : 'action.hover',
                          color: meta ? 'secondary.dark' : 'text.secondary',
                        }}
                      />

                      <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'text.secondary' }}>
                          <EventAvailableRoundedIcon sx={{ fontSize: 15 }} />
                          <Typography variant="caption">
                            Creado: {meta ? formatDate(meta.createdAt) : '—'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'text.secondary' }}>
                          <HistoryRoundedIcon sx={{ fontSize: 15 }} />
                          <Typography variant="caption">
                            Actualizado: {meta ? formatDate(meta.updatedAt) : '—'}
                          </Typography>
                        </Box>
                      </Stack>

                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          color: 'primary.main',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          mt: 0.5,
                        }}
                      >
                        Abrir sección
                        <ArrowForwardRoundedIcon sx={{ fontSize: 17 }} />
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            )
          })}
        </Grid>
        )}
      </Box>
    </Box>
  )
}
