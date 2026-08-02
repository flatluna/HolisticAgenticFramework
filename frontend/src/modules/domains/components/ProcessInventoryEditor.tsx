import { useState } from 'react'
import { Box, IconButton, TextField, Typography } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded'
import { READINESS_COLORS } from '@/modules/madurez/assessmentTheme'
import { computePriorityScore, computeQuadrant, ProcessInventoryItem } from '../hooks/useDomainDiscovery'
import { ChipMultiSelect } from './ChipMultiSelect'
import { SYSTEMS_OPTIONS } from '../data/industriesData'
import { DIMENSIONS, DimensionSlider } from './DimensionSlider'
import { QUADRANT_COLORS, QUADRANT_ICONS, QUADRANT_LABELS } from './quadrantMeta'

interface ProcessInventoryEditorProps {
  items: ProcessInventoryItem[]
  onAdd: (name: string) => void
  onUpdate: (processId: string, patch: Partial<ProcessInventoryItem>) => void
  onRemove: (processId: string) => void
  // Ajuste de complejidad efectivo del dominio (heredado de Fase 1), usado
  // para calcular el score/cuadrante de CADA proceso individual con la
  // misma fórmula que el dominio (ver ProcessRankingView).
  effectiveAdjustment: number
}

// Inventario de procesos del dominio (Pantalla B) — cada proceso tiene
// nombre, sistemas usados (chips reutilizando el catálogo de Fase 1), un
// pain point libre, y opcionalmente sus propias 5 dimensiones de
// evaluación (expandible) para poder rankearlo junto a procesos de otros
// dominios en la vista "Ranking de Procesos".
export const ProcessInventoryEditor = ({ items, onAdd, onUpdate, onRemove, effectiveAdjustment }: ProcessInventoryEditorProps) => {
  const [newName, setNewName] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const confirmAdd = () => {
    if (newName.trim()) {
      onAdd(newName)
      setNewName('')
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: -0.5 }}>
        Inventario de Procesos
      </Typography>

      {items.map((item) => {
        const priorityScore = computePriorityScore(item, effectiveAdjustment)
        const quadrant = computeQuadrant(item, effectiveAdjustment)
        const expanded = expandedId === item.id
        return (
          <Box
            key={item.id}
            sx={{
              p: 1.5,
              borderRadius: 1.5,
              border: `1px solid ${READINESS_COLORS.border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                size="small"
                fullWidth
                value={item.name}
                onChange={(e) => onUpdate(item.id, { name: e.target.value })}
                sx={{ '& .MuiInputBase-root': { fontSize: '0.85rem' } }}
              />
              <IconButton size="small" onClick={() => onRemove(item.id)} sx={{ color: 'text.secondary' }}>
                <DeleteOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
            <ChipMultiSelect
              label="Sistemas usados"
              options={SYSTEMS_OPTIONS}
              selected={item.systems}
              onToggle={(value) =>
                onUpdate(item.id, {
                  systems: item.systems.includes(value)
                    ? item.systems.filter((v) => v !== value)
                    : [...item.systems, value],
                })
              }
            />
            <TextField
              size="small"
              fullWidth
              multiline
              placeholder="Pain point / observación"
              value={item.painPoint}
              onChange={(e) => onUpdate(item.id, { painPoint: e.target.value })}
              sx={{ '& .MuiInputBase-root': { fontSize: '0.8rem' } }}
            />

            <Box
              onClick={() => setExpandedId(expanded ? null : item.id)}
              sx={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                pt: 0.5,
                borderTop: `1px solid ${READINESS_COLORS.border}`,
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', flexGrow: 1 }}>
                Evaluación del proceso (para Ranking de Procesos)
              </Typography>
              {priorityScore !== null && quadrant !== null && (
                <Box
                  sx={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    px: 0.75,
                    py: 0.15,
                    borderRadius: 1,
                    bgcolor: `${QUADRANT_COLORS[quadrant]}22`,
                    color: QUADRANT_COLORS[quadrant],
                  }}
                >
                  {QUADRANT_ICONS[quadrant]} {priorityScore.toFixed(1)} · {QUADRANT_LABELS[quadrant]}
                </Box>
              )}
              <IconButton size="small" sx={{ color: 'text.secondary' }}>
                {expanded ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
              </IconButton>
            </Box>

            {expanded && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 0.5 }}>
                {DIMENSIONS.map((def) => (
                  <DimensionSlider
                    key={def.key}
                    def={def}
                    value={item[def.key]}
                    onChange={(v) => onUpdate(item.id, { [def.key]: v })}
                  />
                ))}
              </Box>
            )}
          </Box>
        )
      })}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Nombre del proceso…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') confirmAdd()
          }}
          sx={{ '& .MuiInputBase-root': { fontSize: '0.85rem' } }}
        />
        <IconButton size="small" onClick={confirmAdd} sx={{ color: 'primary.main' }}>
          <AddRoundedIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  )
}
