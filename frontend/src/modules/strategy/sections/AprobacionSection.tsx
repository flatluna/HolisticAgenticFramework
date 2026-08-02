import { useState } from 'react'
import { Card, CardContent, Typography, Box, TextField, Button, Chip, Divider } from '@mui/material'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CancelRoundedIcon from '@mui/icons-material/CancelRounded'

type ApprovalStatus = 'Pendiente' | 'Aprobado' | 'Rechazado'

const statusColor: Record<ApprovalStatus, 'warning' | 'success' | 'error'> = {
  Pendiente: 'warning',
  Aprobado: 'success',
  Rechazado: 'error',
}

export const AprobacionSection = () => {
  const [status, setStatus] = useState<ApprovalStatus>('Pendiente')
  const [aprobador, setAprobador] = useState('')
  const [comentarios, setComentarios] = useState('')

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Aprobación del paso
          </Typography>
          <Chip label={status} color={statusColor[status]} />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Antes de avanzar al siguiente paso, el fundamento estratégico debe ser revisado y aprobado por el
          patrocinador ejecutivo del engagement.
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Aprobador" value={aprobador} onChange={(e) => setAprobador(e.target.value)} fullWidth />
          <TextField
            label="Comentarios"
            multiline
            minRows={3}
            value={comentarios}
            onChange={(e) => setComentarios(e.target.value)}
            fullWidth
          />
        </Box>

        <Box sx={{ mt: 3, display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button variant="outlined" color="error" startIcon={<CancelRoundedIcon />} onClick={() => setStatus('Rechazado')}>
            Rechazar
          </Button>
          <Button variant="contained" color="success" startIcon={<CheckCircleRoundedIcon />} onClick={() => setStatus('Aprobado')}>
            Aprobar
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}
