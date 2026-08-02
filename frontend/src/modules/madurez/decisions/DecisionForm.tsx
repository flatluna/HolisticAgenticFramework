import { useState } from 'react'
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
  Chip,
  Alert,
} from '@mui/material'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import { emptyDecisionForm, createDecision, updateDecision, type DecisionDto, type DecisionFormData } from './decisionApi'
import type { ProcessDto } from '../processes/processApi'

interface DecisionFormProps {
  engagementId: string
  processes: ProcessDto[]
  initialData?: DecisionDto
  initialFormData?: DecisionFormData
  defaultProcessId?: string
  onSaved: (decision: DecisionDto) => void
  onCancel: () => void
}

interface FieldErrors {
  name?: string
  processId?: string
}

const autonomyOptions: [string, string][] = [
  ['L0', 'L0 · Humano'],
  ['L1', 'L1 · IA recomienda'],
  ['L2', 'L2 · IA asiste'],
  ['L3', 'L3 · IA ejecuta con supervisión'],
  ['L4', 'L4 · IA autónoma'],
  ['L5', 'L5 · Multi-agent autonomous'],
]

// Formulario de captura de una Decisión de negocio (dimensión 2.4). Cada
// decisión pertenece a un solo proceso (donde ocurre), seleccionable solo
// entre los procesos ya registrados para este engagement.
export const DecisionForm = ({
  engagementId,
  processes,
  initialData,
  initialFormData,
  defaultProcessId,
  onSaved,
  onCancel,
}: DecisionFormProps) => {
  const [form, setForm] = useState<DecisionFormData>(
    initialData ?? initialFormData ?? emptyDecisionForm(defaultProcessId),
  )
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof DecisionFormData>(key: K, value: DecisionFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const validate = (): FieldErrors => {
    const next: FieldErrors = {}
    if (!form.name.trim()) next.name = 'El nombre de la decisión es obligatorio'
    if (!form.processId) next.processId = 'Selecciona el proceso donde ocurre esta decisión'
    return next
  }

  const handleSave = async (status: 'Borrador' | 'Completo') => {
    const fieldErrors = validate()
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length > 0) {
      setError('Revisa los campos marcados antes de guardar.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload: DecisionFormData = { ...form, status }
      const saved = initialData
        ? await updateDecision(initialData.id, payload)
        : await createDecision(engagementId, payload)
      onSaved(saved)
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'No se pudo guardar la decisión. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {initialData ? `Editar decisión · ${initialData.name}` : 'Nueva decisión'}
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
                label="Nombre de la decisión"
                fullWidth
                required
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                placeholder="p. ej. ¿Aprobar o rechazar la solicitud de crédito?"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Proceso relacionado"
                fullWidth
                required
                value={form.processId}
                onChange={(e) => set('processId', e.target.value)}
                error={!!errors.processId}
                helperText={errors.processId ?? 'El proceso donde ocurre esta decisión'}
                disabled={processes.length === 0}
              >
                {processes.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </TextField>
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
              <TextField
                label="Responsable de la decisión (Decision Owner)"
                fullWidth
                value={form.owner}
                onChange={(e) => set('owner', e.target.value)}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* 2. Clasificación */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
          <Typography sx={{ fontWeight: 700 }}>Clasificación</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Tipo de decisión"
                fullWidth
                value={form.decisionType}
                onChange={(e) => set('decisionType', e.target.value)}
              >
                {['Estratégica', 'Táctica', 'Operativa'].map((v) => (
                  <MenuItem key={v} value={v}>{v}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Frecuencia"
                fullWidth
                value={form.frequency}
                onChange={(e) => set('frequency', e.target.value)}
              >
                {['Diaria', 'Semanal', 'Mensual', 'Trimestral', 'Ad-hoc'].map((v) => (
                  <MenuItem key={v} value={v}>{v}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Complejidad"
                fullWidth
                value={form.complexity}
                onChange={(e) => set('complexity', e.target.value)}
              >
                {['Baja', 'Media', 'Alta'].map((v) => (
                  <MenuItem key={v} value={v}>{v}</MenuItem>
                ))}
              </TextField>
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
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="¿Quién decide hoy?"
                fullWidth
                value={form.decisionMaker}
                onChange={(e) => set('decisionMaker', e.target.value)}
              >
                {['Humano', 'Humano + IA', 'IA supervisada', 'IA autónoma'].map((v) => (
                  <MenuItem key={v} value={v}>{v}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Nivel de autonomía actual"
                fullWidth
                value={form.currentAutonomyLevel}
                onChange={(e) => set('currentAutonomyLevel', e.target.value)}
              >
                {autonomyOptions.map(([v, label]) => (
                  <MenuItem key={v} value={v}>{label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="¿Se basa en reglas de negocio claras?"
                fullWidth
                value={form.isRuleBased}
                onChange={(e) => set('isRuleBased', e.target.value)}
              >
                {['Sí', 'No', 'Parcial'].map((v) => (
                  <MenuItem key={v} value={v}>{v}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="¿Datos disponibles y confiables?"
                fullWidth
                value={form.dataAvailability}
                onChange={(e) => set('dataAvailability', e.target.value)}
              >
                {['Sí', 'No', 'Parcial'].map((v) => (
                  <MenuItem key={v} value={v}>{v}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Reglas de negocio aplicadas"
                fullWidth
                multiline
                minRows={2}
                value={form.rulesDescription}
                onChange={(e) => set('rulesDescription', e.target.value)}
                placeholder="p. ej. Si score > 700 y deuda/ingreso < 30% → aprobar automático"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Fuente de las reglas"
                fullWidth
                value={form.rulesSource}
                onChange={(e) => set('rulesSource', e.target.value)}
                placeholder="p. ej. Política escrita, conocimiento tácito, ERP, Excel"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Datos de entrada utilizados"
                fullWidth
                value={form.inputDataUsed}
                onChange={(e) => set('inputDataUsed', e.target.value)}
                placeholder="p. ej. Edad, historial crediticio, score de buró"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* 4. Potencial de Automatización */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
          <Typography sx={{ fontWeight: 700 }}>Potencial de Automatización</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Nivel de autonomía objetivo"
                fullWidth
                value={form.targetAutonomyLevel}
                onChange={(e) => set('targetAutonomyLevel', e.target.value)}
              >
                {autonomyOptions.map(([v, label]) => (
                  <MenuItem key={v} value={v}>{label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Potencial de automatización"
                fullWidth
                value={form.automationPotential}
                onChange={(e) => set('automationPotential', e.target.value)}
              >
                {['Baja', 'Media', 'Alta', 'Crítica'].map((v) => (
                  <MenuItem key={v} value={v}>{v}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Riesgo / impacto de automatizar"
                fullWidth
                multiline
                minRows={2}
                value={form.automationRisk}
                onChange={(e) => set('automationRisk', e.target.value)}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* 5. Hallazgos */}
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
