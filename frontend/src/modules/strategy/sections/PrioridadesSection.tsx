import { useState } from 'react'
import { Card, CardContent, Typography, Box, TextField, IconButton, MenuItem, Select, Button } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import { v4 as uuidv4 } from 'uuid'

interface Priority {
  id: string
  label: string
  level: 'Alta' | 'Media' | 'Baja'
}

const levelColor: Record<Priority['level'], string> = {
  Alta: '#DC2626',
  Media: '#D97706',
  Baja: '#65A30D',
}

export const PrioridadesSection = () => {
  const [priorities, setPriorities] = useState<Priority[]>([])

  const cargarEjemplos = () => {
    setPriorities([
      { id: uuidv4(), label: 'Aumentar ingresos con nuevos servicios digitales asistidos por agentes', level: 'Alta' },
      { id: uuidv4(), label: 'Reducir costos operativos mediante automatizacion end-to-end', level: 'Alta' },
      { id: uuidv4(), label: 'Incrementar productividad de equipos con copilotos y flujos autonomos', level: 'Media' },
      { id: uuidv4(), label: 'Mejorar experiencia de cliente con respuestas y resoluciones mas rapidas', level: 'Media' },
      { id: uuidv4(), label: 'Acelerar toma de decisiones con analitica y recomendaciones en tiempo real', level: 'Media' },
    ])
  }

  const addPriority = () => {
    setPriorities((prev) => [...prev, { id: uuidv4(), label: '', level: 'Media' }])
  }

  const updatePriority = (id: string, patch: Partial<Priority>) => {
    setPriorities((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  const removePriority = (id: string) => {
    setPriorities((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Prioridades globales de negocio
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" variant="outlined" onClick={cargarEjemplos}>
              Cargar ejemplos
            </Button>
            <Button size="small" startIcon={<AddRoundedIcon />} onClick={addPriority}>
              Agregar prioridad
            </Button>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Define 3-5 resultados estrategicos medibles que la automatizacion por agentes debe lograr.
        </Typography>

        {priorities.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Aun no se han definido prioridades. Puedes usar "Cargar ejemplos" y luego ajustarlas a tu negocio.
          </Typography>
        )}

        {priorities.map((priority, idx) => (
          <Box key={priority.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <Box
              sx={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                bgcolor: 'action.selected',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {idx + 1}
            </Box>
            <TextField
              fullWidth
              size="small"
              placeholder="Describe la prioridad"
              value={priority.label}
              onChange={(e) => updatePriority(priority.id, { label: e.target.value })}
            />
            <Select
              size="small"
              value={priority.level}
              onChange={(e) => updatePriority(priority.id, { level: e.target.value as Priority['level'] })}
              sx={{ minWidth: 110, '& .MuiSelect-select': { color: levelColor[priority.level], fontWeight: 700 } }}
            >
              <MenuItem value="Alta">Alta</MenuItem>
              <MenuItem value="Media">Media</MenuItem>
              <MenuItem value="Baja">Baja</MenuItem>
            </Select>
            <IconButton size="small" onClick={() => removePriority(priority.id)}>
              <DeleteRoundedIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </CardContent>
    </Card>
  )
}
