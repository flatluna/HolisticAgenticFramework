import { useState } from 'react'
import { Card, CardContent, Typography, Box, TextField, IconButton, Button, Divider } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import { v4 as uuidv4 } from 'uuid'

interface Strategy {
  id: string
  name: string
  description: string
  outcome: string
}

export const EstrategiasSection = () => {
  const [strategies, setStrategies] = useState<Strategy[]>([])

  const addStrategy = () => {
    setStrategies((prev) => [...prev, { id: uuidv4(), name: '', description: '', outcome: '' }])
  }

  const updateStrategy = (id: string, patch: Partial<Strategy>) => {
    setStrategies((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  const removeStrategy = (id: string) => {
    setStrategies((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Estrategias para lograr la vision
          </Typography>
          <Button size="small" startIcon={<AddRoundedIcon />} onClick={addStrategy}>
            Agregar estrategia
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Aqui defines como pasar de la vision a ejecucion: cada estrategia debe tener una iniciativa clara y un resultado
          de negocio esperado.
        </Typography>

        {strategies.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Aún no se han definido estrategias.
          </Typography>
        )}

        {strategies.map((strategy, idx) => (
          <Box key={strategy.id}>
            {idx > 0 && <Divider sx={{ my: 2 }} />}
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <Box sx={{ flexGrow: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={`Estrategia ${idx + 1}`}
                  value={strategy.name}
                  onChange={(e) => updateStrategy(strategy.id, { name: e.target.value })}
                  placeholder="Ej. Operacion full automated by agents en Atencion a Cliente"
                  sx={{ mb: 1 }}
                />
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  minRows={2}
                  label="Plan / alcance"
                  value={strategy.description}
                  onChange={(e) => updateStrategy(strategy.id, { description: e.target.value })}
                  placeholder="Que procesos se automatizan, con que controles y en que fases"
                  sx={{ mb: 1 }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Resultado de negocio esperado"
                  value={strategy.outcome}
                  onChange={(e) => updateStrategy(strategy.id, { outcome: e.target.value })}
                  placeholder="Ej. -20% costo operativo, +15% productividad, SLA < 2h"
                />
              </Box>
              <IconButton size="small" onClick={() => removeStrategy(strategy.id)}>
                <DeleteRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        ))}
      </CardContent>
    </Card>
  )
}
