import { useState } from 'react'
import { Box, IconButton, TextField, Typography } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { EvidenceGroupConfig } from '../data/pillarsData'
import { READINESS_COLORS } from '../assessmentTheme'

interface EvidenceChipGroupProps {
  group: EvidenceGroupConfig
  selected: string[]
  onToggle: (value: string) => void
  onAddOther: (text: string) => void
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

// Un grupo de evidencia estructurada (chips multi-select). Los chips son
// evidencia que INFORMA el juicio del evaluador — NUNCA auto-calculan el
// nivel de madurez (eso lo sigue eligiendo el humano en el selector 1-4).
export const EvidenceChipGroup = ({ group, selected, onToggle, onAddOther }: EvidenceChipGroupProps) => {
  const [otherOpen, setOtherOpen] = useState(false)
  const [otherText, setOtherText] = useState('')

  const customChips = selected.filter((v) => !group.options.includes(v))
  const allChips = [...group.options, ...customChips]

  const confirmOther = () => {
    if (otherText.trim()) {
      onAddOther(otherText)
      setOtherText('')
    }
    setOtherOpen(false)
  }

  return (
    <Box>
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
        {group.label}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
        {allChips.map((value) => (
          <Box key={value} onClick={() => onToggle(value)} sx={chipSx(selected.includes(value))}>
            {value}
          </Box>
        ))}

        {group.allowOther &&
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
                gap: 0.25,
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
