import { useEffect, useRef, useState, type ChangeEvent } from 'react'
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
  CircularProgress,
} from '@mui/material'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import PsychologyRoundedIcon from '@mui/icons-material/PsychologyRounded'
import { emptyProcessForm, createProcess, updateProcess, type ProcessDto, type ProcessFormData } from './processApi'
import type { CapabilityDto } from '../capabilities/capabilityApi'
import {
  uploadAgentReadinessDocument,
  getLatestAgentReadinessAssessment,
  type AgentReadinessResult,
} from './agentReadinessApi'
import { AgentReadinessResultView } from './AgentReadinessResultView'

interface ProcessFormProps {
  engagementId: string
  capabilities: CapabilityDto[]
  initialData?: ProcessDto
  defaultCapabilityId?: string
  onSaved: (process: ProcessDto) => void
  onCancel: () => void
}

interface FieldErrors {
  name?: string
  capabilityId?: string
}

// Lista de paquetes/sistemas comunes que las empresas usan en sus procesos.
// Puede elegirse el principal en el combo y detallar adicionales en texto.
const DATA_SOURCE_SYSTEM_OPTIONS = [
  { value: '', label: '— Selecciona —' },
  { value: 'SAP S/4HANA', label: 'SAP S/4HANA' },
  { value: 'Oracle (E-Business Suite / Fusion)', label: 'Oracle (E-Business Suite / Fusion)' },
  { value: 'Microsoft Dynamics 365', label: 'Microsoft Dynamics 365' },
  { value: 'Salesforce', label: 'Salesforce' },
  { value: 'ServiceNow', label: 'ServiceNow' },
  { value: 'Workday', label: 'Workday' },
  { value: 'NetSuite', label: 'NetSuite' },
  { value: 'HubSpot', label: 'HubSpot' },
  { value: 'Zendesk', label: 'Zendesk' },
  { value: 'Jira / Atlassian', label: 'Jira / Atlassian' },
  { value: 'SAP Ariba', label: 'SAP Ariba' },
  { value: 'Coupa', label: 'Coupa' },
  { value: 'SuccessFactors', label: 'SuccessFactors' },
  { value: 'Sistema propio (desarrollado internamente)', label: 'Sistema propio (desarrollado internamente)' },
  { value: 'Hojas de cálculo / manual (Excel, correo)', label: 'Hojas de cálculo / manual (Excel, correo)' },
  { value: 'Otro', label: 'Otro' },
]

const KNOWN_SYSTEM_OPTIONS = DATA_SOURCE_SYSTEM_OPTIONS.filter((o) => o.value && o.value !== 'Otro')
const KNOWN_SYSTEM_SET = new Set(KNOWN_SYSTEM_OPTIONS.map((o) => o.value))

const normalizeLines = (raw?: string): string[] => {
  if (!raw) return []
  return raw
    .split(/\r?\n|,|;/)
    .map((s) => s.trim())
    .filter(Boolean)
}

const unique = (items: string[]) => Array.from(new Set(items))

const deriveSystemsState = (data?: ProcessFormData) => {
  const primary = (data?.dataSourceSystem ?? '').trim()
  const others = normalizeLines(data?.dataSourceSystemOther)

  const selectedKnown = unique([
    ...(KNOWN_SYSTEM_SET.has(primary) ? [primary] : []),
    ...others.filter((x) => KNOWN_SYSTEM_SET.has(x)),
  ])

  const custom = others.filter((x) => !KNOWN_SYSTEM_SET.has(x)).join('\n')

  return {
    selectedKnown,
    custom,
  }
}

// Formulario de captura de un Proceso de negocio (dimensión 2.3). Cada proceso
// pertenece a una sola capacidad dueña (ej. "Marketing"), seleccionable solo
// entre las capacidades ya registradas para este engagement.
export const ProcessForm = ({
  engagementId,
  capabilities,
  initialData,
  defaultCapabilityId,
  onSaved,
  onCancel,
}: ProcessFormProps) => {
  const [form, setForm] = useState<ProcessFormData>(initialData ?? emptyProcessForm(defaultCapabilityId))
  const initialSystemsState = deriveSystemsState(initialData ?? emptyProcessForm(defaultCapabilityId))
  const [selectedSystems, setSelectedSystems] = useState<string[]>(initialSystemsState.selectedKnown)
  const [customSystemsText, setCustomSystemsText] = useState<string>(initialSystemsState.custom)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Extracción con IA desde PDF ("Agent-Readiness Process Architect"): se
  // sube el PDF completo del proceso AQUÍ MISMO, en el formulario de
  // creación/edición, y el resultado llena automáticamente nombre,
  // descripción, estado de documentación/formalización, nivel de autonomía,
  // criticidad y hallazgos. Si el proceso todavía no existe (creación
  // nueva), se crea un borrador silenciosamente en cuanto se sube el PDF
  // (se necesita un processId para subir el archivo) — `workingProcess`
  // rastrea ese id para que "Guardar" actualice ese mismo registro en vez
  // de crear uno duplicado.
  const [workingProcess, setWorkingProcess] = useState<ProcessDto | undefined>(initialData)
  const [extracting, setExtracting] = useState(false)
  const [extractStep, setExtractStep] = useState<string | null>(null)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [extractedResult, setExtractedResult] = useState<AgentReadinessResult | null>(null)
  const [showFullAnalysis, setShowFullAnalysis] = useState(false)
  const extractFileInputRef = useRef<HTMLInputElement>(null)

  // Si estamos editando un proceso que ya tiene una evaluación de
  // Agent-Readiness guardada, la mostramos de una vez (best-effort).
  useEffect(() => {
    if (!initialData) return
    getLatestAgentReadinessAssessment(initialData.id)
      .then((existing) => {
        if (existing?.result) setExtractedResult(existing.result)
      })
      .catch(() => {
        // silencioso: si falla, el usuario igual puede subir un PDF nuevo
      })
  }, [initialData])

  const set = <K extends keyof ProcessFormData>(key: K, value: ProcessFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const syncSystemsIntoForm = (knownSystems: string[], customRaw: string) => {
    const cleanKnown = unique(knownSystems.filter(Boolean))
    const customLines = unique(normalizeLines(customRaw)).filter((line) => !KNOWN_SYSTEM_SET.has(line))

    const primary = cleanKnown[0] ?? (customLines.length > 0 ? 'Otro' : '')
    const rest = [...cleanKnown.slice(1), ...customLines]

    setForm((prev) => ({
      ...prev,
      dataSourceSystem: primary,
      dataSourceSystemOther: rest.join('\n'),
    }))
  }

  const handleKnownSystemsChange = (value: string[] | string) => {
    const next = Array.isArray(value) ? value : value.split(',')
    setSelectedSystems(next)
    syncSystemsIntoForm(next, customSystemsText)
  }

  const handleCustomSystemsChange = (nextRaw: string) => {
    setCustomSystemsText(nextRaw)
    syncSystemsIntoForm(selectedSystems, nextRaw)
  }

  const applyExtractionToForm = (result: AgentReadinessResult) => {
    const steps = result.process.steps
    const levelCounts = new Map<number, number>()
    steps.forEach((s) => levelCounts.set(s.autonomy_level, (levelCounts.get(s.autonomy_level) ?? 0) + 1))
    let modeLevel: number | undefined
    let modeCount = 0
    levelCounts.forEach((count, level) => {
      if (count > modeCount) {
        modeCount = count
        modeLevel = level
      }
    })

    const gaps = result.gap_engine.gaps
    const hasHighSeverity = gaps.some((g) => /alta|crítica|critica|high|critical/i.test(g.severity))
    const hasMediumSeverity = gaps.some((g) => /media|medium/i.test(g.severity))

    setForm((prev) => ({
      ...prev,
      name: result.meta.process_name?.trim() || prev.name,
      description: result.meta.scope?.trim() || prev.description,
      isDocumented: 'Sí',
      isFormalized: /valid|aprob|complet/i.test(result.meta.validation_status ?? '') ? 'Sí' : 'Parcial',
      currentAutonomyLevel: modeLevel !== undefined ? `L${Math.min(Math.max(modeLevel, 0), 3)}` : prev.currentAutonomyLevel,
      criticality: hasHighSeverity ? 'Alta' : hasMediumSeverity ? 'Media' : prev.criticality,
      mainProblems: gaps.length
        ? gaps.map((g) => `[${g.dimension}] ${g.as_is ?? 'estado desconocido'} → ${g.target ?? '—'} (severidad ${g.severity})`).join('\n')
        : prev.mainProblems,
      mainOpportunities: result.agent_design.skills.length
        ? result.agent_design.skills.map((s) => `${s.name}: ${s.description ?? ''}`).join('\n')
        : prev.mainOpportunities,
      observations:
        [
          result.meta.systems_involved.length ? `Sistemas involucrados: ${result.meta.systems_involved.join(', ')}` : null,
          result.ai_governance.human_only_steps.length
            ? `Pasos exclusivamente humanos: ${result.ai_governance.human_only_steps.join(', ')}`
            : null,
        ]
          .filter(Boolean)
          .join('\n') || prev.observations,
    }))
    setExtractedResult(result)
  }

  const handleExtractFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (file.type !== 'application/pdf') {
      setExtractError('El archivo debe ser un PDF.')
      return
    }
    if (!form.capabilityId) {
      setExtractError('Selecciona primero la capacidad dueña del proceso.')
      return
    }

    setExtracting(true)
    setExtractError(null)
    setExtractStep('Subiendo PDF…')
    try {
      let target = workingProcess
      if (!target) {
        target = await createProcess(engagementId, {
          ...form,
          name: form.name.trim() || file.name.replace(/\.pdf$/i, ''),
          status: 'Borrador',
        })
        setWorkingProcess(target)
      }
      const assessment = await uploadAgentReadinessDocument(target.id, file, (step) => setExtractStep(step))
      if (assessment.result) applyExtractionToForm(assessment.result)
    } catch (err: any) {
      setExtractError(err?.response?.data?.error ?? err?.message ?? 'No se pudo extraer el proceso del PDF. Intenta de nuevo.')
    } finally {
      setExtracting(false)
      setExtractStep(null)
    }
  }

  const validate = (): FieldErrors => {
    const next: FieldErrors = {}
    if (!form.name.trim()) next.name = 'El nombre del proceso es obligatorio'
    if (!form.capabilityId) next.capabilityId = 'Selecciona la capacidad dueña del proceso'
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
      const payload: ProcessFormData = { ...form, status }
      const targetId = workingProcess?.id ?? initialData?.id
      const saved = targetId ? await updateProcess(targetId, payload) : await createProcess(engagementId, payload)
      onSaved(saved)
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'No se pudo guardar el proceso. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {initialData ? `Editar proceso · ${initialData.name}` : 'Nuevo proceso'}
        </Typography>
        {form.status && <Chip size="small" label={form.status} color={form.status === 'Completo' ? 'success' : 'default'} />}
      </Box>

      {/* Extracción con IA desde PDF */}
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          border: '1px dashed',
          borderColor: 'secondary.main',
          bgcolor: 'action.hover',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PsychologyRoundedIcon color="secondary" />
          <Typography sx={{ fontWeight: 700 }}>Extraer con IA desde el PDF del proceso</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Sube el PDF completo del proceso y el agente "Agent-Readiness Process Architect" llenará
          automáticamente el nombre, la descripción, el estado de documentación/formalización, el nivel de
          autonomía, la criticidad y los hallazgos. Revisa y ajusta los campos antes de guardar.
        </Typography>

        <input
          ref={extractFileInputRef}
          type="file"
          accept="application/pdf"
          hidden
          onChange={handleExtractFileSelected}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<UploadFileRoundedIcon />}
            onClick={() => extractFileInputRef.current?.click()}
            disabled={extracting || !form.capabilityId}
          >
            {extractedResult ? 'Subir otro PDF (reemplaza la extracción)' : 'Subir PDF y extraer con IA'}
          </Button>
          {extractedResult && !extracting && (
            <Button size="small" onClick={() => setShowFullAnalysis((v) => !v)}>
              {showFullAnalysis ? 'Ocultar análisis completo' : 'Ver análisis completo'}
            </Button>
          )}
        </Box>

        {!form.capabilityId && (
          <Typography variant="caption" color="text.secondary">
            Selecciona primero la capacidad dueña para poder subir el PDF.
          </Typography>
        )}

        {extracting && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={18} />
            <Typography variant="body2">
              {extractStep ?? 'Analizando el proceso con el agente… esto puede tardar varios minutos.'}
            </Typography>
          </Box>
        )}

        {extractError && <Alert severity="error">{extractError}</Alert>}

        {extractedResult && !extracting && (
          <Alert severity="success">
            Extracción completa: {extractedResult.process.steps.length} pasos, {extractedResult.business_rules.length}{' '}
            reglas de negocio, {extractedResult.gap_engine.gaps.length} gaps detectados. Los campos de abajo se
            llenaron automáticamente — revísalos y ajústalos antes de guardar.
          </Alert>
        )}

        {extractedResult && showFullAnalysis && <AgentReadinessResultView result={extractedResult} />}
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
                label="Nombre del proceso"
                fullWidth
                required
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                placeholder="p. ej. Gestión de campañas, Facturación"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Capacidad dueña"
                fullWidth
                required
                value={form.capabilityId}
                onChange={(e) => set('capabilityId', e.target.value)}
                error={!!errors.capabilityId}
                helperText={errors.capabilityId ?? 'Ej. Marketing — la capacidad principal responsable de este proceso'}
                disabled={capabilities.length === 0}
              >
                {capabilities.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
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
                label="Dueño del proceso (Process Owner)"
                fullWidth
                value={form.owner}
                onChange={(e) => set('owner', e.target.value)}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* 2. Estado de Documentación */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
          <Typography sx={{ fontWeight: 700 }}>Estado de Documentación</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="¿Está documentado?"
                fullWidth
                value={form.isDocumented}
                onChange={(e) => set('isDocumented', e.target.value)}
              >
                {['Sí', 'No', 'Parcial'].map((v) => (
                  <MenuItem key={v} value={v}>{v}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="¿Está formalizado/estandarizado?"
                fullWidth
                value={form.isFormalized}
                onChange={(e) => set('isFormalized', e.target.value)}
              >
                {['Sí', 'No', 'Parcial'].map((v) => (
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
                label="Nivel de autonomía actual"
                fullWidth
                value={form.currentAutonomyLevel}
                onChange={(e) => set('currentAutonomyLevel', e.target.value)}
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
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Criticidad"
                fullWidth
                value={form.criticality}
                onChange={(e) => set('criticality', e.target.value)}
              >
                {['Baja', 'Media', 'Alta', 'Crítica'].map((v) => (
                  <MenuItem key={v} value={v}>{v}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Paquetes/sistemas usados en este proceso"
                fullWidth
                SelectProps={{
                  multiple: true,
                  value: selectedSystems,
                  renderValue: (selected) => (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {(selected as string[]).map((v) => (
                        <Chip key={v} size="small" label={v} />
                      ))}
                    </Box>
                  ),
                }}
                onChange={(e) => handleKnownSystemsChange(e.target.value as unknown as string[])}
                helperText="Selecciona todos los paquetes/SaaS/ERP que participan en el proceso. El primero queda como sistema principal."
              >
                {KNOWN_SYSTEM_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Otros sistemas no listados (incluye home-made)"
                fullWidth
                multiline
                minRows={3}
                value={customSystemsText}
                onChange={(e) => handleCustomSystemsChange(e.target.value)}
                placeholder={[
                  'SAP ECC legado',
                  'Sistema propio: portal interno de compras',
                ].join('\n')}
                helperText="Uno por línea. Esto también se envía al agente para el gap de Data Quality."
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* 4. Hallazgos */}
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
