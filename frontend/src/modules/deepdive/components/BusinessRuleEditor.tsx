import { Box, Card, Chip, IconButton, MenuItem, Switch, TextField, Typography } from '@mui/material'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import { PUESTOS, RULE_FLEXIBILITY, RULE_SOURCES } from '../data/catalogs'
import type { BusinessRule } from '../state/deepDiveStore'
import { isComplianceRisk, isTribalRisk } from '../utils/businessRules'
import { SelectWithOther } from './SelectWithOther'

// Tarjeta de UNA regla de negocio — reutilizada para las reglas colgadas de
// un dato (nivel DATO), las reglas del paso completo (nivel PASO) y las
// reglas globales de una entrada del diccionario de datos. Muestra los
// badges de riesgo (⚠️ no documentada / 🔒 compliance) directamente sobre
// la tarjeta.
export const BusinessRuleEditor = ({
  rule,
  onChange,
  onDelete,
}: {
  rule: BusinessRule
  onChange: (patch: Partial<BusinessRule>) => void
  onDelete: () => void
}) => {
  const tribalRisk = isTribalRisk(rule)
  const complianceRisk = isComplianceRisk(rule)

  return (
    <Card variant="outlined" sx={{ p: 2, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {tribalRisk && (
            <Chip
              size="small"
              icon={<WarningAmberRoundedIcon sx={{ fontSize: '14px !important' }} />}
              label="No documentada — validar con dueño"
              color="warning"
            />
          )}
          {complianceRisk && (
            <Chip
              size="small"
              icon={<LockRoundedIcon sx={{ fontSize: '14px !important' }} />}
              label="Compliance"
              sx={{ bgcolor: 'rgba(43, 111, 245, 0.16)', color: '#2B6FF5', fontWeight: 700 }}
            />
          )}
        </Box>
        <IconButton size="small" onClick={onDelete} aria-label="Eliminar regla">
          <DeleteOutlineRoundedIcon fontSize="small" />
        </IconButton>
      </Box>

      <TextField
        size="small"
        label="Descripción de la regla"
        placeholder='Ej: "El RFC debe tener 13 caracteres y coincidir con SAT"'
        multiline
        minRows={2}
        value={rule.description}
        onChange={(e) => onChange({ description: e.target.value })}
      />
      <SelectWithOther
        label="¿Quién autoriza / es dueño de la regla?"
        options={PUESTOS}
        value={rule.owner}
        onChange={(v) => onChange({ owner: v })}
      />
      <TextField
        size="small"
        label="¿Quién la dijo? / Origen de la información"
        placeholder='Ej: "Me la dijo Juan de Compliance", "Manual v3 sección 4"'
        value={rule.origin}
        onChange={(e) => onChange({ origin: e.target.value })}
      />
      <SelectWithOther
        label="Fuente"
        options={RULE_SOURCES}
        value={rule.source}
        onChange={(v) => onChange({ source: v })}
      />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Switch checked={rule.isDocumented} onChange={(e) => onChange({ isDocumented: e.target.checked })} />
        <Typography variant="body2">¿Está documentada?</Typography>
      </Box>
      <TextField
        select
        size="small"
        label="¿Es dura o flexible?"
        value={rule.flexibility}
        onChange={(e) => onChange({ flexibility: e.target.value })}
      >
        {RULE_FLEXIBILITY.map((opt) => (
          <MenuItem key={opt} value={opt}>
            {opt}
          </MenuItem>
        ))}
      </TextField>
    </Card>
  )
}
