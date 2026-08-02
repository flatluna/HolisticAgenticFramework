import { useState } from 'react'
import { Box, Chip, TextField, Typography } from '@mui/material'

interface ChipListInputProps {
  label: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
}

export const ChipListInput = ({ label, items, onChange, placeholder }: ChipListInputProps) => {
  const [draft, setDraft] = useState('')

  const addItem = () => {
    const value = draft.trim()
    if (value && !items.includes(value)) {
      onChange([...items, value])
    }
    setDraft('')
  }

  const removeItem = (item: string) => {
    onChange(items.filter((i) => i !== item))
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.75 }}>
        {label}
      </Typography>
      <TextField
        fullWidth
        size="small"
        placeholder={placeholder ?? 'Escribe y presiona Enter'}
        helperText="Presiona Enter o haz clic fuera del campo para agregarlo"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            addItem()
          }
        }}
        onBlur={addItem}
      />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
        {items.map((item) => (
          <Chip key={item} label={item} onDelete={() => removeItem(item)} size="small" />
        ))}
      </Box>
    </Box>
  )
}
