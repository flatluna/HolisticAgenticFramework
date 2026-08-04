import { Box, MenuItem, TextField } from '@mui/material'

// Select simple con opción "+ Otro" que revela un campo de texto libre —
// usado para los catálogos que no están marcados como "con búsqueda"
// (Puestos, Canales, Decisión, Bloqueo, Fuente de reglas, etc.). Compartido
// entre el formulario de captura de pasos (L3) y el diccionario de datos.
const OTRO = '__otro__'

export const SelectWithOther = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
}) => {
  const isOther = value !== '' && !options.includes(value)
  const selectValue = isOther ? OTRO : value

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <TextField
        select
        size="small"
        label={label}
        value={selectValue}
        onChange={(e) => onChange(e.target.value === OTRO ? '' : e.target.value)}
      >
        {options.map((opt) => (
          <MenuItem key={opt} value={opt}>
            {opt}
          </MenuItem>
        ))}
        <MenuItem value={OTRO}>+ Otro</MenuItem>
      </TextField>
      {selectValue === OTRO && (
        <TextField
          size="small"
          placeholder="Especifica..."
          value={isOther ? value : ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Box>
  )
}
