import { useState } from 'react'
import { Grid, Card, CardContent, Typography, TextField, Box } from '@mui/material'

const blocks: { key: string; label: string; sm: number }[] = [
  { key: 'socios', label: 'Socios clave', sm: 4 },
  { key: 'actividades', label: 'Actividades clave', sm: 4 },
  { key: 'propuesta', label: 'Propuesta de valor', sm: 4 },
  { key: 'relaciones', label: 'Relación con clientes', sm: 4 },
  { key: 'segmentos', label: 'Segmentos de clientes', sm: 4 },
  { key: 'recursos', label: 'Recursos clave', sm: 4 },
  { key: 'canales', label: 'Canales', sm: 4 },
  { key: 'costos', label: 'Estructura de costos', sm: 6 },
  { key: 'ingresos', label: 'Fuentes de ingresos', sm: 6 },
]

export const ModeloNegocioSection = () => {
  const [values, setValues] = useState<Record<string, string>>({})

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Modelo de negocio (Business Model Canvas)
      </Typography>
      <Grid container spacing={2}>
        {blocks.map((block) => (
          <Grid item xs={12} sm={block.sm} key={block.key}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  {block.label}
                </Typography>
                <TextField
                  multiline
                  minRows={3}
                  fullWidth
                  size="small"
                  placeholder="Describe este bloque..."
                  value={values[block.key] ?? ''}
                  onChange={(e) => handleChange(block.key, e.target.value)}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
