import { Fragment } from 'react'
import { Box, ButtonBase, Typography, alpha, useTheme } from '@mui/material'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import type { WizardStageMeta } from '../data/catalogs'

// Indicador de progreso superior del wizard de 4 etapas (①─②─③─④):
// - Etapa completada (sus campos obligatorios ya están OK): check ✅.
// - Etapa actual: resaltada con su color identitario (background sólido +
//   halo/glow sutil) — se recalcula en cada render desde el tema activo, así
//   que se ve bien en claro Y oscuro sin colores hardcodeados que rompan un
//   tema.
// - Etapa futura (todavía no alcanzada, modo CREAR): atenuada y no clickeable.
// - Clickeable: en modo EDITAR (`freeNavigation`) todas las etapas son
//   libres; en modo CREAR solo las ya alcanzadas (`index <= maxReachedIndex`).
export const StepWizardStepper = ({
  stages,
  activeIndex,
  maxReachedIndex,
  completed,
  freeNavigation,
  onStepClick,
}: {
  stages: WizardStageMeta[]
  activeIndex: number
  maxReachedIndex: number
  /** Validación (solo visual, no gatilla navegación) de cada etapa. */
  completed: boolean[]
  freeNavigation: boolean
  onStepClick: (index: number) => void
}) => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
      {stages.map((stage, index) => {
        const color = isDark ? stage.colorDark : stage.colorLight
        const isCurrent = index === activeIndex
        const isDone = completed[index] && !isCurrent
        const canClick = freeNavigation || index <= maxReachedIndex
        const isActiveOrDone = isCurrent || isDone

        return (
          <Fragment key={stage.key}>
            {index > 0 && (
              <Box
                sx={{
                  flex: 1,
                  height: 3,
                  mt: '19px',
                  mx: 0.5,
                  borderRadius: 2,
                  bgcolor: (index - 1 < activeIndex || completed[index - 1]) ? color : 'divider',
                  opacity: (index - 1 < activeIndex || completed[index - 1]) ? 0.6 : 1,
                  transition: 'background-color 0.25s ease',
                }}
              />
            )}
            <ButtonBase
              onClick={() => canClick && onStepClick(index)}
              disabled={!canClick}
              aria-label={`Ir a la etapa ${index + 1}: ${stage.label}`}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
                minWidth: 76,
                borderRadius: 2,
                p: 0.5,
                opacity: canClick ? 1 : 0.45,
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  bgcolor: isActiveOrDone ? color : 'transparent',
                  border: '2px solid',
                  borderColor: isActiveOrDone ? color : theme.palette.divider,
                  color: isActiveOrDone ? '#FFFFFF' : theme.palette.text.secondary,
                  boxShadow: isCurrent ? `0 0 0 4px ${alpha(color, 0.2)}` : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {isDone ? <CheckRoundedIcon fontSize="small" /> : index + 1}
              </Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: isCurrent ? 800 : 600,
                  color: isCurrent ? color : 'text.secondary',
                  textAlign: 'center',
                  lineHeight: 1.2,
                }}
              >
                {stage.emoji} {stage.label}
              </Typography>
            </ButtonBase>
          </Fragment>
        )
      })}
    </Box>
  )
}
