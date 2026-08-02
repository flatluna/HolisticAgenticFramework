import { Box, Grid, Card, CardActionArea, Chip, Typography } from '@mui/material'
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded'
import FlagRoundedIcon from '@mui/icons-material/FlagRounded'

interface ResumenSectionProps {
  onNavigate: (index: number) => void
}

// Kept in sync with the `sections` array in StrategyFoundationPage.tsx (only
// the 4 tabs after "Resumen" itself). Indices must match 1:1 with that array
// or onNavigate() lands on a blank tab.
const overviewItems: { index: number; label: string; icon: JSX.Element; status: 'completo' | 'en progreso' | 'pendiente' }[] = [
  { index: 1, label: 'Empresa', icon: <BusinessRoundedIcon />, status: 'pendiente' },
  { index: 2, label: 'Org Design', icon: <GroupsRoundedIcon />, status: 'pendiente' },
  { index: 3, label: 'Mandato', icon: <AssignmentRoundedIcon />, status: 'pendiente' },
  { index: 4, label: 'Business Strategy & Future-State Definition', icon: <FlagRoundedIcon />, status: 'pendiente' },
]

const statusColor: Record<string, 'success' | 'warning' | 'default'> = {
  completo: 'success',
  'en progreso': 'warning',
  pendiente: 'default',
}

export const ResumenSection = ({ onNavigate }: ResumenSectionProps) => {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        Este paso reúne el contexto estratégico del cliente: quién es, hacia dónde va y qué modelo de negocio opera.
        Completa cada sección para avanzar hacia la aprobación.
      </Typography>
      <Grid container spacing={2}>
        {overviewItems.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.label}>
            <Card variant="outlined">
              <CardActionArea onClick={() => onNavigate(item.index)} sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ color: 'primary.main', display: 'flex' }}>{item.icon}</Box>
                  <Chip label={item.status} size="small" color={statusColor[item.status]} sx={{ textTransform: 'capitalize' }} />
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {item.label}
                </Typography>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
