import { useNavigate, useParams } from 'react-router-dom'
import { Box, Typography, Paper, List, ListItem, ListItemIcon, ListItemText, Button } from '@mui/material'
import FiberManualRecordRoundedIcon from '@mui/icons-material/FiberManualRecordRounded'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import { StepHeader } from '@/layout/StepHeader'
import { BottomActionBar } from '@/layout/BottomActionBar'
import { phases } from '@/layout/phaseData'
import { madurezCategories, madurezCategoryPath } from '../data/madurezData'
import { CapabilityDimensionPage } from '../capabilities/CapabilityDimensionPage'
import { ProcessDimensionPage } from '../processes/ProcessDimensionPage'
import { DecisionDimensionPage } from '../decisions/DecisionDimensionPage'

const allSteps = phases.flatMap((phase) => phase.steps.map((step, idx) => ({ ...step, phase, phaseStepIndex: idx })))
const madurezStepIndex = allSteps.findIndex((s) => s.path === '/madurez')
const madurezStep = allSteps[madurezStepIndex]
const nextGlobalStepPath = allSteps[madurezStepIndex + 1]?.path

// Detail page for one of the 9 assessment dimensions (2.1-2.9). Anterior/
// Siguiente walk through the dimensions in order; leaving the last one hands
// off to the next step in the global 21-step pipeline (Gap Analysis).
export const MadurezCategoryPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()
  const catIndex = madurezCategories.findIndex((c) => c.id === categoryId)
  const category = madurezCategories[catIndex]

  if (!category) {
    return null
  }

  const isFirst = catIndex === 0
  const isLast = catIndex === madurezCategories.length - 1

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <Box sx={{ position: 'sticky', top: 0, zIndex: 2 }}>
        <StepHeader
          stepNumber={madurezStepIndex}
          title={`${madurezStep.label.toUpperCase()} · ${category.code} ${category.title.toUpperCase()}`}
          description={`${madurezStep.phase.code} · ${madurezStep.phase.label}`}
          progress={Math.round(((catIndex + 1) / madurezCategories.length) * 100)}
          lastSaved="—"
        />
      </Box>

      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Button
          startIcon={<ArrowBackRoundedIcon />}
          size="small"
          color="inherit"
          onClick={() => navigate('/madurez')}
          sx={{ mb: 2, color: 'text.secondary', px: 1 }}
        >
          Volver a las 9 dimensiones
        </Button>

        {category.id === 'capacidades' ? (
          <CapabilityDimensionPage />
        ) : category.id === 'procesos' ? (
          <ProcessDimensionPage />
        ) : category.id === 'decisiones' ? (
          <DecisionDimensionPage />
        ) : (
          <Paper variant="outlined" sx={{ p: 3, maxWidth: 640 }}>
            <Typography variant="overline" color="primary">
              {category.code}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
              {category.title}
            </Typography>
            <List dense sx={{ mb: 1 }}>
              {category.items.map((item) => (
                <ListItem key={item} disableGutters>
                  <ListItemIcon sx={{ minWidth: 26 }}>
                    <FiberManualRecordRoundedIcon sx={{ fontSize: 8, color: 'primary.main' }} />
                  </ListItemIcon>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
            <Typography variant="caption" color="text.disabled">
              Esta dimensión estará disponible próximamente para captura detallada.
            </Typography>
          </Paper>
        )}
      </Box>

      <Box sx={{ position: 'sticky', bottom: 0, zIndex: 2 }}>
        <BottomActionBar
          previousDisabled={false}
          nextDisabled={isLast && !nextGlobalStepPath}
          onPrevious={() => navigate(isFirst ? '/madurez' : madurezCategoryPath(madurezCategories[catIndex - 1].id))}
          onNext={() => {
            if (!isLast) {
              navigate(madurezCategoryPath(madurezCategories[catIndex + 1].id))
            } else if (nextGlobalStepPath) {
              navigate(nextGlobalStepPath)
            }
          }}
        />
      </Box>
    </Box>
  )
}
