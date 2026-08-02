import { useEffect } from 'react'
import { Box, Button, IconButton, TextField, Typography } from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded'
import { READINESS_COLORS } from '@/modules/madurez/assessmentTheme'
import { DomainConfig, SYSTEMS_OPTIONS } from '../data/industriesData'
import { DimensionKey, DomainAssessmentState, Quadrant } from '../hooks/useDomainDiscovery'
import { DIMENSIONS, DimensionSlider } from './DimensionSlider'
import { ChipMultiSelect } from './ChipMultiSelect'
import { ProcessInventoryEditor } from './ProcessInventoryEditor'
import { QUADRANT_COLORS, QUADRANT_DESCRIPTIONS, QUADRANT_LABELS } from './quadrantMeta'

export interface DrawerRect {
  top: number
  left: number
  width: number
}

interface DomainDetailDrawerProps {
  open: boolean
  rect: DrawerRect | null
  domain: DomainConfig | null
  state: DomainAssessmentState | null
  autoAdjustment: number
  priorityScore: number | null
  quadrant: Quadrant | null
  domainIndex: number
  totalDomains: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  onSetBusinessContext: (text: string) => void
  onToggleSystemChip: (value: string) => void
  onAddProcess: (name: string) => void
  onUpdateProcess: (processId: string, patch: Partial<DomainAssessmentState['processInventory'][number]>) => void
  onRemoveProcess: (processId: string) => void
  onSetDimension: (dimension: DimensionKey, value: number) => void
  onSetComplexityOverride: (value: number | null) => void
  // Solo se pasa para los dominios habilitados como atajo de pruebas
  // manuales (ver DomainDiscoveryPage) - llena contexto de negocio,
  // sistemas, procesos y dimensiones con datos dummy.
  onSeedDummy?: () => void
}

// Panel de edición de un dominio (Pantalla B), mismo patrón/posicionamiento
// que PillarEditDrawer de Fase 1: se desliza desde la izquierda midiendo en
// vivo el rect de la columna de cards.
export const DomainDetailDrawer = ({
  open,
  rect,
  domain,
  state,
  autoAdjustment,
  priorityScore,
  quadrant,
  domainIndex,
  totalDomains,
  onClose,
  onPrev,
  onNext,
  onSetBusinessContext,
  onToggleSystemChip,
  onAddProcess,
  onUpdateProcess,
  onRemoveProcess,
  onSetDimension,
  onSetComplexityOverride,
  onSeedDummy,
}: DomainDetailDrawerProps) => {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open || !domain || !state || !rect) return null

  const hasOverride = state.complexityAdjustmentOverride !== null
  const effectiveAdjustment = state.complexityAdjustmentOverride ?? autoAdjustment

  return (
    <>
      <Box onClick={onClose} sx={{ position: 'fixed', inset: 0, zIndex: 1250, bgcolor: 'transparent' }} />

      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          position: 'fixed',
          top: rect.top,
          left: rect.left,
          width: rect.width,
          bottom: 0,
          zIndex: 1251,
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          boxShadow: '8px 0 32px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'domainDrawerSlideIn 0.2s ease',
          '@keyframes domainDrawerSlideIn': {
            from: { transform: 'translateX(-24px)', opacity: 0 },
            to: { transform: 'translateX(0)', opacity: 1 },
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.5,
            p: 2.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography sx={{ fontSize: '1.6rem', lineHeight: 1 }}>{domain.emoji}</Typography>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="overline" color="text.secondary">
              Dominio {domainIndex + 1}/{totalDomains}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              {domain.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {domain.description}
            </Typography>
            {onSeedDummy && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<ScienceRoundedIcon fontSize="small" />}
                onClick={onSeedDummy}
                sx={{ mt: 1, fontSize: '0.72rem' }}
              >
                Llenar con datos de prueba
              </Button>
            )}
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
              Contexto de Negocio
            </Typography>
            <TextField
              multiline
              minRows={2}
              fullWidth
              value={state.businessContext}
              onChange={(e) => onSetBusinessContext(e.target.value)}
              placeholder="Notas sobre cómo opera este dominio en la organización…"
            />
          </Box>

          <ChipMultiSelect
            label="Sistemas del Dominio"
            options={SYSTEMS_OPTIONS}
            selected={state.systemsInventory}
            onToggle={onToggleSystemChip}
          />

          <ProcessInventoryEditor
            items={state.processInventory}
            onAdd={onAddProcess}
            onUpdate={onUpdateProcess}
            onRemove={onRemoveProcess}
            effectiveAdjustment={effectiveAdjustment}
          />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: -1 }}>
              Evaluación (criterio del evaluador)
            </Typography>
            {DIMENSIONS.map((def) => (
              <Box key={def.key}>
                <DimensionSlider def={def} value={state[def.key]} onChange={(v) => onSetDimension(def.key, v)} />
                {def.key === 'complexity' && state.complexity !== null && (
                  <Box
                    sx={{
                      mt: 0.75,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 1,
                      py: 0.6,
                      borderRadius: 1.5,
                      bgcolor: 'rgba(240, 244, 250, 0.04)',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
                      {hasOverride ? '✏️ Editado manualmente' : '⚠️ Ajustado por Fase 1'}: complejidad efectiva{' '}
                      <b>{Math.max(1, state.complexity + effectiveAdjustment)}</b> ({effectiveAdjustment >= 0 ? '+' : ''}
                      {effectiveAdjustment} vs. base {state.complexity})
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => onSetComplexityOverride(hasOverride ? null : effectiveAdjustment)}
                      sx={{ color: hasOverride ? 'primary.main' : 'text.secondary' }}
                      title={hasOverride ? 'Volver a usar el ajuste automático' : 'Editar ajuste manualmente'}
                    >
                      <EditRoundedIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
                {def.key === 'complexity' && hasOverride && (
                  <Box sx={{ display: 'flex', gap: 0.75, mt: 0.75 }}>
                    {[-2, -1, 0, 1, 2].map((v) => (
                      <Box
                        key={v}
                        onClick={() => onSetComplexityOverride(v)}
                        sx={{
                          flex: 1,
                          cursor: 'pointer',
                          textAlign: 'center',
                          py: 0.5,
                          borderRadius: 1,
                          border: `1px solid ${state.complexityAdjustmentOverride === v ? READINESS_COLORS.cyan : READINESS_COLORS.border}`,
                          color: state.complexityAdjustmentOverride === v ? READINESS_COLORS.cyan : 'text.secondary',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                        }}
                      >
                        {v >= 0 ? `+${v}` : v}
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            ))}
          </Box>

          {priorityScore !== null && quadrant && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                border: `1px solid ${QUADRANT_COLORS[quadrant]}`,
                bgcolor: `${QUADRANT_COLORS[quadrant]}14`,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Priority Score
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: QUADRANT_COLORS[quadrant] }}>
                  {priorityScore.toFixed(1)} · {QUADRANT_LABELS[quadrant]}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {QUADRANT_DESCRIPTIONS[quadrant]}
              </Typography>
            </Box>
          )}
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Button startIcon={<ChevronLeftRoundedIcon />} onClick={onPrev} disabled={domainIndex === 0}>
            Anterior
          </Button>
          <Button
            endIcon={<ChevronRightRoundedIcon />}
            onClick={onNext}
            disabled={domainIndex === totalDomains - 1}
          >
            Siguiente
          </Button>
        </Box>
      </Box>
    </>
  )
}
