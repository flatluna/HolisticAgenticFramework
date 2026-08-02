import { Box, Button, Tooltip } from '@mui/material'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'

interface BottomActionBarProps {
  currentIndex?: number
  totalSteps?: number
  onPrevious?: () => void
  onNext?: () => void
  // Explicit overrides for when a page needs to hand off to the next/previous
  // step in the 21-step pipeline (phaseData.ts) instead of just moving within
  // its own local tabs — lets "Siguiente" stay enabled past local tab bounds.
  previousDisabled?: boolean
  nextDisabled?: boolean
}

export const BottomActionBar = ({
  currentIndex,
  totalSteps,
  onPrevious,
  onNext,
  previousDisabled,
  nextDisabled,
}: BottomActionBarProps) => {
  const hasNavigation = currentIndex !== undefined && totalSteps !== undefined
  const notImplementedTooltip = 'Aún no implementado'

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 3,
        py: 1.5,
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        boxShadow: '0 -2px 8px rgba(21, 26, 46, 0.05)',
        flexWrap: 'wrap',
        gap: 1,
      }}
    >
      <Button
        startIcon={<ArrowBackRoundedIcon />}
        color="inherit"
        disabled={previousDisabled ?? (!hasNavigation || currentIndex === 0)}
        onClick={onPrevious}
      >
        Anterior
      </Button>
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        <Tooltip title={notImplementedTooltip}>
          <span>
            <Button variant="outlined" startIcon={<SaveRoundedIcon />} disabled>
              Guardar borrador
            </Button>
          </span>
        </Tooltip>
        <Tooltip title={notImplementedTooltip}>
          <span>
            <Button variant="contained" color="secondary" startIcon={<CheckRoundedIcon />} disabled>
              Completar sección
            </Button>
          </span>
        </Tooltip>
        <Button
          variant="contained"
          endIcon={<ArrowForwardRoundedIcon />}
          disabled={nextDisabled ?? (!hasNavigation || currentIndex === totalSteps - 1)}
          onClick={onNext}
        >
          Siguiente
        </Button>
      </Box>
    </Box>
  )
}

