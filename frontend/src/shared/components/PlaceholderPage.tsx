import { Box, Typography } from '@mui/material'
import ConstructionRoundedIcon from '@mui/icons-material/ConstructionRounded'

interface PlaceholderPageProps {
  title: string
}

export const PlaceholderPage = ({ title }: PlaceholderPageProps) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      minHeight: '60vh',
      gap: 1.5,
      color: 'text.secondary',
    }}
  >
    <ConstructionRoundedIcon sx={{ fontSize: 48 }} />
    <Typography variant="h6" sx={{ fontWeight: 700 }}>
      {title}
    </Typography>
    <Typography variant="body2">Esta sección estará disponible próximamente</Typography>
  </Box>
)
