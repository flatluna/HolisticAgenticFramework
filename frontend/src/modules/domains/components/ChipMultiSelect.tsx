import { useState } from 'react'
import { Box, IconButton, TextField, Typography } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { READINESS_COLORS } from '@/modules/madurez/assessmentTheme'

interface ChipMultiSelectProps {
  label: string
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
  onAddOther?: (text: string) => void
}

const chipSx = (isSelected: boolean) => ({
  cursor: 'pointer',
  px: 1.25,
  py: 0.5,
  borderRadius: 5,
  fontSize: '0.78rem',
  fontWeight: 700,
  lineHeight: 1.6,
  border: '1px solid',
  borderColor: isSelected ? 'primary.main' : READINESS_COLORS.border,
  bgcolor: isSelected ? 'primary.main' : 'transparent',
  color: isSelected ? '#04202A' : 'text.secondary',
  transition: 'all 0.15s ease',
  userSelect: 'none' as const,
  '&:hover': { borderColor: 'primary.main' },
})

// Selector multi-chip genérico (mismo look & feel que EvidenceChipGroup de
// Fase 1, decoplado de sus tipos) — usado en Fase 2 para el inventario de
// sistemas por dominio.
export const ChipMultiSelect = ({ label, options, selected, onToggle, onAddOther }: ChipMultiSelectProps) => {
  const [otherOpen, setOtherOpen] = useState(false)
  const [otherText, setOtherText] = useState('')

  const customChips = selected.filter((v) => !options.includes(v))
  const allChips = [...options, ...customChips]

  const confirmOther = () => {
    if (otherText.trim()) {
      onAddOther?.(otherText)
      setOtherText('')
    }
    setOtherOpen(false)
  }

  return (
    <Box>
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
        {allChips.map((value) => (
          <Box key={value} onClick={() => onToggle(value)} sx={chipSx(selected.includes(value))}>
            {value}
          </Box>
        ))}

        {onAddOther &&
          (otherOpen ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TextField
                size="small"
                autoFocus
                value={otherText}
                placeholder="Escribe y presiona Enter"
                onChange={(e) => setOtherText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmOther()
                  if (e.key === 'Escape') {
                    setOtherText('')
                    setOtherOpen(false)
                  }
                }}
                sx={{ '& .MuiInputBase-root': { fontSize: '0.78rem', height: 30 } }}
              />
              <IconButton size="small" onClick={confirmOther} sx={{ color: 'primary.main' }}>
                <CheckRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
          ) : (
            <Box
              onClick={() => setOtherOpen(true)}
              sx={{
                ...chipSx(false),
                display: 'flex',
                alignItems: 'center',
                gap: 0.4,
                borderStyle: 'dashed',
              }}
            >
              <AddRoundedIcon sx={{ fontSize: 14 }} /> Otro
            </Box>
          ))}
      </Box>
    </Box>
  )
}
