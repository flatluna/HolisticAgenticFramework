import { Box, Typography, LinearProgress } from '@mui/material'

interface StepHeaderProps {
  stepNumber: number
  title: string
  description: string
  progress: number
  lastSaved: string
}

export const StepHeader = ({ stepNumber, title, description, progress, lastSaved }: StepHeaderProps) => {
  return (
    <Box
      sx={{
        px: 3,
        pt: 2.25,
        pb: 2,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          flexShrink: 0,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'primary.main',
          color: '#fff',
          fontWeight: 800,
          fontSize: '1.05rem',
        }}
      >
        {stepNumber}
      </Box>

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="overline" color="primary" sx={{ display: 'block', lineHeight: 1.2 }}>
          Paso {stepNumber} · {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {description}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                flexGrow: 1,
                height: 6,
                borderRadius: 1,
                bgcolor: 'rgba(50, 71, 214, 0.1)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: 'primary.main',
                  borderRadius: 1,
                },
              }}
            />
            <Typography variant="caption" sx={{ fontWeight: 800, minWidth: 36 }}>
              {progress}%
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
            Último guardado: {lastSaved}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

