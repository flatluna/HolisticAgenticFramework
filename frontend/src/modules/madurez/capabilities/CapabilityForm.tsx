import { useState, type ReactNode } from 'react'
import {
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  TextField,
  MenuItem,
  Grid,
  Button,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Alert,
} from '@mui/material'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import {
  emptyCapabilityForm,
  createCapability,
  updateCapability,
  type CapabilityDto,
  type CapabilityFormData,
  type CapabilityKpiInput,
} from './capabilityApi'

const ESCALA_1_A_5 = [1, 2, 3, 4, 5]

interface CapabilityFormProps {
  engagementId: string
  initialData?: CapabilityDto
  onSaved: (capability: CapabilityDto) => void
  onCancel: () => void
}

// Formulario de captura de una Business Capability (dimensión 2.2). Organizado
// en secciones tipo acordeón; KPIs es un sub-formulario repetible con
// "Agregar fila". Procesos/Tecnología/Datos/Personas se capturan en otras
// dimensiones (2.3/2.5/2.6/2.7).
export const CapabilityForm = ({ engagementId, initialData, onSaved, onCancel }: CapabilityFormProps) => {
  const [form, setForm] = useState<CapabilityFormData>(initialData ?? emptyCapabilityForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof CapabilityFormData>(key: K, value: CapabilityFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSave = async (status: 'Borrador' | 'Completo') => {
    if (status === 'Completo' && (!form.name.trim() || !form.businessDomain.trim())) {
      setError('Nombre y Dominio de negocio son obligatorios para completar el registro.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload: CapabilityFormData = { ...form, status }
      const saved = initialData
        ? await updateCapability(initialData.id, payload)
        : await createCapability(engagementId, payload)
      onSaved(saved)
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'No se pudo guardar la capacidad. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  // KPIs
  const addKpi = () => setForm((p) => ({ ...p, kpis: [...p.kpis, { name: '', unit: '' }] }))
  const updateKpi = (i: number, patch: Partial<CapabilityKpiInput>) =>
    setForm((p) => ({ ...p, kpis: p.kpis.map((row, idx) => (idx === i ? { ...row, ...patch } : row)) }))
  const removeKpi = (i: number) => setForm((p) => ({ ...p, kpis: p.kpis.filter((_, idx) => idx !== i) }))

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {initialData ? `Editar capacidad · ${initialData.name}` : 'Nueva capacidad empresarial'}
        </Typography>
        {form.status && <Chip size="small" label={form.status} color={form.status === 'Completo' ? 'success' : 'default'} />}
      </Box>

      {/* 1. Información General */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
          <Typography sx={{ fontWeight: 700 }}>Información General</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Nombre de la capacidad"
                fullWidth
                required
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="p. ej. Marketing, Gestión de Pedidos"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Dominio de negocio"
                fullWidth
                required
                value={form.businessDomain}
                onChange={(e) => set('businessDomain', e.target.value)}
                placeholder="Comercial, Operaciones, Finanzas..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Descripción"
                fullWidth
                multiline
                minRows={2}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Owner" fullWidth value={form.owner} onChange={(e) => set('owner', e.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Área responsable"
                fullWidth
                value={form.responsibleArea}
                onChange={(e) => set('responsibleArea', e.target.value)}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* 2. Alineación Estratégica */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
          <Typography sx={{ fontWeight: 700 }}>Alineación Estratégica</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Objetivo estratégico relacionado"
                fullWidth
                value={form.relatedStrategicObjective}
                onChange={(e) => set('relatedStrategicObjective', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Prioridad estratégica"
                fullWidth
                value={form.strategicPriority}
                onChange={(e) => set('strategicPriority', e.target.value)}
              >
                {['Crítica', 'Alta', 'Media', 'Baja'].map((v) => (
                  <MenuItem key={v} value={v}>
                    {v}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Contribución al negocio"
                fullWidth
                value={form.businessContribution}
                onChange={(e) => set('businessContribution', e.target.value)}
              >
                {['Diferenciadora', 'Habilitadora', 'Soporte', 'Commodity'].map((v) => (
                  <MenuItem key={v} value={v}>
                    {v}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Impacto esperado"
                fullWidth
                value={form.expectedImpact}
                onChange={(e) => set('expectedImpact', e.target.value)}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* 3. Estado Actual */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
          <Typography sx={{ fontWeight: 700 }}>Estado Actual</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {(
              [
                ['maturityLevel', 'Nivel de madurez'],
                ['performanceLevel', 'Nivel de desempeño'],
                ['digitalizationLevel', 'Nivel de digitalización'],
              ] as const
            ).map(([key, label]) => (
              <Grid item xs={12} md={4} key={key}>
                <TextField
                  select
                  label={label}
                  fullWidth
                  value={form[key]}
                  onChange={(e) => set(key, Number(e.target.value) as any)}
                  helperText="1 Inicial · 2 Básico · 3 Definido · 4 Gestionado · 5 Optimizado"
                >
                  {ESCALA_1_A_5.map((v) => (
                    <MenuItem key={v} value={v}>
                      {v}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* 4. KPIs */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
          <Typography sx={{ fontWeight: 700 }}>KPIs ({form.kpis.length})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <RepeatableTable
            rows={form.kpis}
            onAdd={addKpi}
            onRemove={removeKpi}
            columns={[
              { label: 'Nombre', render: (r, i) => <TextField size="small" fullWidth value={r.name} onChange={(e) => updateKpi(i, { name: e.target.value })} /> },
              {
                label: 'Valor actual',
                render: (r, i) => (
                  <TextField
                    size="small"
                    type="number"
                    fullWidth
                    value={r.currentValue ?? ''}
                    onChange={(e) => updateKpi(i, { currentValue: e.target.value === '' ? null : Number(e.target.value) })}
                  />
                ),
              },
              {
                label: 'Meta',
                render: (r, i) => (
                  <TextField
                    size="small"
                    type="number"
                    fullWidth
                    value={r.target ?? ''}
                    onChange={(e) => updateKpi(i, { target: e.target.value === '' ? null : Number(e.target.value) })}
                  />
                ),
              },
              { label: 'Unidad', render: (r, i) => <TextField size="small" fullWidth value={r.unit ?? ''} onChange={(e) => updateKpi(i, { unit: e.target.value })} /> },
            ]}
            addLabel="Agregar KPI"
          />
        </AccordionDetails>
      </Accordion>

      {/* 5. Preparación Agentic */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
          <Typography sx={{ fontWeight: 700 }}>Preparación Agentic</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                type="number"
                label="Potencial de automatización (%)"
                fullWidth
                value={form.automationPotentialPercent}
                onChange={(e) => set('automationPotentialPercent', Math.min(100, Math.max(0, Number(e.target.value))))}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField select label="Potencial de agentes IA" fullWidth value={form.aiAgentPotential} onChange={(e) => set('aiAgentPotential', e.target.value)}>
                {['Bajo', 'Medio', 'Alto', 'Muy Alto'].map((v) => (
                  <MenuItem key={v} value={v}>{v}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Nivel objetivo de autonomía"
                fullWidth
                value={form.targetAutonomyLevel}
                onChange={(e) => set('targetAutonomyLevel', e.target.value)}
              >
                {[
                  ['L0', 'L0 · Humano'],
                  ['L1', 'L1 · IA recomienda'],
                  ['L2', 'L2 · IA asiste'],
                  ['L3', 'L3 · IA ejecuta con supervisión'],
                  ['L4', 'L4 · IA autónoma'],
                  ['L5', 'L5 · Multi-agent autonomous'],
                ].map(([v, label]) => (
                  <MenuItem key={v} value={v}>{label}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* 6. Hallazgos */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
          <Typography sx={{ fontWeight: 700 }}>Hallazgos</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Principales problemas"
                fullWidth
                multiline
                minRows={2}
                value={form.mainProblems}
                onChange={(e) => set('mainProblems', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Principales oportunidades"
                fullWidth
                multiline
                minRows={2}
                value={form.mainOpportunities}
                onChange={(e) => set('mainOpportunities', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Observaciones"
                fullWidth
                multiline
                minRows={2}
                value={form.observations}
                onChange={(e) => set('observations', e.target.value)}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {error && <Alert severity="error">{error}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, pb: 2 }}>
        <Button color="inherit" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button variant="outlined" startIcon={<SaveRoundedIcon />} onClick={() => handleSave('Borrador')} disabled={saving}>
          Guardar como borrador
        </Button>
        <Button variant="contained" startIcon={<CheckCircleRoundedIcon />} onClick={() => handleSave('Completo')} disabled={saving}>
          Completar registro
        </Button>
      </Box>
    </Box>
  )
}

interface RepeatableTableProps<T> {
  rows: T[]
  columns: { label: string; render: (row: T, index: number) => ReactNode }[]
  onAdd: () => void
  onRemove: (index: number) => void
  addLabel: string
}

function RepeatableTable<T>({ rows, columns, onAdd, onRemove, addLabel }: RepeatableTableProps<T>) {
  return (
    <Box>
      {rows.length > 0 && (
        <Table size="small" sx={{ mb: 1.5 }}>
          <TableHead>
            <TableRow>
              {columns.map((c) => (
                <TableCell key={c.label}>{c.label}</TableCell>
              ))}
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i}>
                {columns.map((c) => (
                  <TableCell key={c.label}>{c.render(row, i)}</TableCell>
                ))}
                <TableCell>
                  <IconButton size="small" onClick={() => onRemove(i)} aria-label="Eliminar fila">
                    <DeleteRoundedIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Button size="small" startIcon={<AddRoundedIcon />} onClick={onAdd}>
        {addLabel}
      </Button>
    </Box>
  )
}

