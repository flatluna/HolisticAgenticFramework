import { useEffect } from 'react'
import { Box, Button, IconButton, TextField, Typography } from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import { MaturityLevel, MATURITY_LEVEL_LABELS, Pillar } from '../data/pillarsData'
import { MATURITY_LEVEL_COLORS, READINESS_COLORS } from '../assessmentTheme'
import { EvidenceGroupState, PillarAssessmentState } from '../hooks/usePillarAssessment'
import { EvidenceChipGroup } from './EvidenceChipGroup'

export interface DrawerRect {
  top: number
  left: number
  width: number
}

interface PillarEditDrawerProps {
  open: boolean
  rect: DrawerRect | null
  pillar: Pillar | null
  state: PillarAssessmentState | null
  pillarIndex: number
  totalPillars: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  onToggleEvidenceChip: (groupId: string, value: string) => void
  onAddOtherEvidence: (groupId: string, text: string) => void
  onSetLevel: (level: MaturityLevel) => void
  onSetNotes: (notes: string) => void
}

const LEVELS: MaturityLevel[] = [1, 2, 3, 4]

// Panel de edición de un pilar, deslizado desde la IZQUIERDA sobre la
// columna de cards (su ancho/posición se mide en vivo desde esa columna vía
// `rect`), dejando el radar/score de la derecha (columna 40%) siempre
// visible y actualizándose en tiempo real mientras se edita. El
// click-catcher de fondo es transparente (sin overlay oscuro) para no
// afectar la legibilidad del radar.
export const PillarEditDrawer = ({
  open,
  rect,
  pillar,
  state,
  pillarIndex,
  totalPillars,
  onClose,
  onPrev,
  onNext,
  onToggleEvidenceChip,
  onAddOtherEvidence,
  onSetLevel,
  onSetNotes,
}: PillarEditDrawerProps) => {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open || !pillar || !state || !rect) return null

  return (
    <>
      {/* Click-outside catcher, transparente: cierra el drawer sin oscurecer el radar */}
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
          animation: 'pillarDrawerSlideIn 0.2s ease',
          '@keyframes pillarDrawerSlideIn': {
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
          <Typography sx={{ fontSize: '1.6rem', lineHeight: 1 }}>{pillar.icon}</Typography>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="overline" color="text.secondary">
              Pilar {pillarIndex + 1}/{totalPillars}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              {pillar.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {pillar.description}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: -1 }}>
              Evidencia
            </Typography>
            {pillar.evidenceGroups.map((group) => {
              const groupState: EvidenceGroupState = state.evidenceGroups.find((g) => g.groupId === group.id) ?? {
                groupId: group.id,
                selected: [],
              }
              return (
                <EvidenceChipGroup
                  key={group.id}
                  group={group}
                  selected={groupState.selected}
                  onToggle={(value) => onToggleEvidenceChip(group.id, value)}
                  onAddOther={(text) => onAddOtherEvidence(group.id, text)}
                />
              )
            })}
          </Box>

          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
              Nivel de madurez (tu criterio)
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {LEVELS.map((level) => {
                const selected = state.level === level
                const color = MATURITY_LEVEL_COLORS[level]
                return (
                  <Box
                    key={level}
                    onClick={() => onSetLevel(level)}
                    sx={{
                      cursor: 'pointer',
                      px: 1.75,
                      py: 0.85,
                      borderRadius: 1.5,
                      border: `1px solid ${selected ? color : READINESS_COLORS.border}`,
                      bgcolor: selected ? `${color}1F` : 'transparent',
                      color: selected ? color : 'text.secondary',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      transition: 'all 0.15s ease',
                      '&:hover': { borderColor: color },
                    }}
                  >
                    {MATURITY_LEVEL_LABELS[level]}
                  </Box>
                )
              })}
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 240 }}>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
              {pillar.notesLabel ?? 'Notas / Evidencia'}
            </Typography>
            <TextField
              multiline
              fullWidth
              value={state.notes}
              onChange={(e) => onSetNotes(e.target.value)}
              placeholder={
                pillar.notesPlaceholder ?? 'Facts observados, ej. oficina BPM desde 2022, 60% de procesos documentados…'
              }
              sx={{
                flexGrow: 1,
                display: 'flex',
                '& .MuiInputBase-root': { flexGrow: 1, alignItems: 'flex-start', height: '100%' },
                '& .MuiInputBase-input': { height: '100% !important', overflowY: 'auto' },
              }}
            />
          </Box>
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
          <Button startIcon={<ChevronLeftRoundedIcon />} onClick={onPrev} disabled={pillarIndex === 0}>
            Anterior
          </Button>
          <Button endIcon={<ChevronRightRoundedIcon />} onClick={onNext} disabled={pillarIndex === totalPillars - 1}>
            Siguiente
          </Button>
        </Box>
      </Box>
    </>
  )
}
