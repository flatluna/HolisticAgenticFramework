import { useLocation, useNavigate } from 'react-router-dom'
import { Box, Typography, Paper } from '@mui/material'
import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded'
import { StepHeader } from '@/layout/StepHeader'
import { BottomActionBar } from '@/layout/BottomActionBar'
import { phases } from '@/layout/phaseData'

// Flatten every step across every phase, in order, so we can compute a
// global step number (1-21) and look up the step matching the current route.
const allSteps = phases.flatMap((phase) => phase.steps.map((step, idx) => ({ ...step, phase, phaseStepIndex: idx })))

export const StepPlaceholderPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const stepIndex = allSteps.findIndex((s) => s.path === location.pathname)
  const step = allSteps[stepIndex]

  if (!step) {
    return null
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <Box sx={{ position: 'sticky', top: 0, zIndex: 2 }}>
        <StepHeader
          stepNumber={stepIndex + 1}
          title={step.label.toUpperCase()}
          description={`${step.phase.code} · ${step.phase.label}`}
          progress={0}
          lastSaved="—"
        />
      </Box>

      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Paper
          variant="outlined"
          sx={{
            height: '100%',
            minHeight: 320,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
            color: 'text.secondary',
            borderStyle: 'dashed',
            p: 4,
            textAlign: 'center',
          }}
        >
          <ArticleRoundedIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {step.label}
          </Typography>
          <Typography variant="body2">Entregable: {step.deliverable}</Typography>
          <Typography variant="caption" color="text.disabled">
            Esta sección estará disponible próximamente
          </Typography>
        </Paper>
      </Box>

      <Box sx={{ position: 'sticky', bottom: 0, zIndex: 2 }}>
        <BottomActionBar
          currentIndex={stepIndex}
          totalSteps={allSteps.length}
          previousDisabled={stepIndex === 0}
          nextDisabled={stepIndex === allSteps.length - 1}
          onPrevious={() => navigate(allSteps[stepIndex - 1].path)}
          onNext={() => navigate(allSteps[stepIndex + 1].path)}
        />
      </Box>
    </Box>
  )
}
