import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  TextField,
  Stack,
  Divider,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import { useLocation, useNavigate } from 'react-router-dom'
import { DecisionForm } from './DecisionForm'
import {
  listDecisions,
  suggestDecisions,
  suggestionToFormData,
  uploadProcessDocument,
  type DecisionDto,
  type DecisionFormData,
  type DecisionSuggestion,
  type ProcessDocumentResult,
} from './decisionApi'
import { listProcesses, type ProcessDto } from '../processes/processApi'

const EMPRESA_STORAGE_KEY = 'aetp.empresa.perfil'

const obtenerEngagementIdGuardado = (): string | null => {
  const raw = localStorage.getItem(EMPRESA_STORAGE_KEY)
  if (!raw) return null
  try {
    const datos = JSON.parse(raw) as { engagementId?: string }
    return datos.engagementId ?? null
  } catch {
    return null
  }
}

const autonomyLabel: Record<string, string> = {
  L0: 'L0 · Humano',
  L1: 'L1 · IA recomienda',
  L2: 'L2 · IA asiste',
  L3: 'L3 · Supervisado',
  L4: 'L4 · Autónomo',
  L5: 'L5 · Multi-agent',
}

// Dimensión 2.4 "Decisiones": lista plana de decisiones registradas para el
// engagement (cada una mostrando el proceso relacionado como chip), con
// acceso al formulario de captura/edición (DecisionForm) y a un flujo de
// sugerencia por IA (DecisionExtractionAgent) que propone candidatas a
// partir del texto de un proceso ya registrado — siempre para revisión
// humana antes de guardar.
export const DecisionDimensionPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [engagementId, setEngagementId] = useState<string | null>(null)
  const [decisions, setDecisions] = useState<DecisionDto[]>([])
  const [processes, setProcesses] = useState<ProcessDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'form'>('list')
  const [editing, setEditing] = useState<DecisionDto | undefined>(undefined)
  const [initialFormData, setInitialFormData] = useState<DecisionFormData | undefined>(undefined)

  // Flujo "Sugerir con IA"
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [suggestProcessId, setSuggestProcessId] = useState('')
  const [suggesting, setSuggesting] = useState(false)
  const [suggestError, setSuggestError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<DecisionSuggestion[] | null>(null)

  // Flujo "Subir PDF del proceso" (documento completo, en vez de solo el
  // texto corto del proceso) — mismo resultado (sugerencias), más resumen
  // ejecutivo y entidades mencionadas.
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [docResult, setDocResult] = useState<ProcessDocumentResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processName = (id: string) => processes.find((p) => p.id === id)?.name ?? 'Sin proceso'

  const loadAll = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const [decisionData, processData] = await Promise.all([listDecisions(id), listProcesses(id)])
      setDecisions(decisionData)
      setProcesses(processData)
    } catch {
      setError('No se pudieron cargar las decisiones. Verifica que el backend esté corriendo.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const id = obtenerEngagementIdGuardado()
    setEngagementId(id)
    if (id) {
      loadAll(id)
    } else {
      setLoading(false)
    }
  }, [])

  // Si llegamos aquí desde "Subir PDF" en Procesos con una sugerencia ya
  // elegida (navigate con state), abrimos el formulario pre-llenado de una
  // vez, sin pasar por el diálogo "Sugerir con IA".
  useEffect(() => {
    const state = location.state as { processId?: string; suggestion?: DecisionSuggestion } | null
    if (state?.processId && state.suggestion) {
      setInitialFormData(suggestionToFormData(state.processId, state.suggestion))
      setEditing(undefined)
      setView('form')
      navigate(location.pathname, { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  const noProcesses = !loading && processes.length === 0

  const openSuggestDialog = () => {
    setSuggestProcessId(processes[0]?.id ?? '')
    setSuggestions(null)
    setSuggestError(null)
    setDocResult(null)
    setSuggestOpen(true)
  }

  const runSuggest = async () => {
    if (!suggestProcessId) return
    setSuggesting(true)
    setSuggestError(null)
    try {
      const result = await suggestDecisions(suggestProcessId)
      setSuggestions(result)
      setDocResult(null)
    } catch (err: any) {
      setSuggestError(
        err?.response?.data?.error ?? 'No se pudieron generar sugerencias. Intenta de nuevo.',
      )
    } finally {
      setSuggesting(false)
    }
  }

  const handleFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // permite volver a seleccionar el mismo archivo
    if (!file || !suggestProcessId) return

    if (file.type !== 'application/pdf') {
      setSuggestError('El archivo debe ser un PDF.')
      return
    }

    setUploadingDoc(true)
    setSuggestError(null)
    try {
      const result = await uploadProcessDocument(suggestProcessId, file)
      setDocResult(result)
      setSuggestions(result.suggestions)
    } catch (err: any) {
      setSuggestError(
        err?.response?.data?.error ?? 'No se pudo procesar el PDF. Intenta de nuevo.',
      )
    } finally {
      setUploadingDoc(false)
    }
  }

  const useSuggestion = (s: DecisionSuggestion) => {
    setInitialFormData(suggestionToFormData(suggestProcessId, s))
    setEditing(undefined)
    setSuggestOpen(false)
    setView('form')
  }

  if (view === 'form' && engagementId) {
    return (
      <DecisionForm
        engagementId={engagementId}
        processes={processes}
        initialData={editing}
        initialFormData={initialFormData}
        onCancel={() => {
          setInitialFormData(undefined)
          setView('list')
        }}
        onSaved={() => {
          setInitialFormData(undefined)
          setView('list')
          loadAll(engagementId)
        }}
      />
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Decisiones registradas ({decisions.length})
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<AutoAwesomeRoundedIcon />}
            disabled={!engagementId || noProcesses}
            onClick={openSuggestDialog}
          >
            Sugerir con IA
          </Button>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            disabled={!engagementId || noProcesses}
            onClick={() => {
              setEditing(undefined)
              setInitialFormData(undefined)
              setView('form')
            }}
          >
            Nueva decisión
          </Button>
        </Box>
      </Box>

      {!engagementId && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Primero completa el perfil de la empresa en el Paso 1 (Empresa) para poder registrar decisiones.
        </Alert>
      )}
      {noProcesses && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Primero registra al menos un proceso en "Procesos" — cada decisión debe pertenecer a un proceso.
        </Alert>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : decisions.length === 0 ? (
        engagementId &&
        !noProcesses && (
          <Alert severity="info">
            Aún no hay decisiones registradas. Usa "Sugerir con IA" para partir de un borrador, o "Nueva decisión" para capturar desde cero.
          </Alert>
        )
      ) : (
        <Grid container spacing={2}>
          {decisions.map((d) => (
            <Grid item xs={12} sm={6} md={4} key={d.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {d.name}
                    </Typography>
                    <Chip size="small" label={d.status} color={d.status === 'Completo' ? 'success' : 'default'} />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {processName(d.processId)}
                    {d.owner ? ` · ${d.owner}` : ''}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                    <Chip size="small" label={d.decisionType} sx={{ bgcolor: 'action.hover' }} />
                    <Chip size="small" label={`Reglas: ${d.isRuleBased}`} sx={{ bgcolor: 'action.hover' }} />
                    <Chip size="small" label={autonomyLabel[d.currentAutonomyLevel] ?? d.currentAutonomyLevel} sx={{ bgcolor: 'action.hover' }} />
                    <Chip size="small" label={`Potencial: ${d.automationPotential}`} sx={{ bgcolor: 'action.hover' }} />
                  </Box>
                  <Box sx={{ flexGrow: 1 }} />
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditRoundedIcon />}
                    onClick={() => {
                      setEditing(d)
                      setInitialFormData(undefined)
                      setView('form')
                    }}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Editar
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={suggestOpen} onClose={() => setSuggestOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Sugerir decisiones con IA</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Selecciona un proceso ya registrado. Un agente de IA propondrá las decisiones candidatas a partir de su
              descripción y hallazgos — siempre como borrador para que tú revises y confirmes.
            </Typography>
            <TextField
              select
              label="Proceso"
              fullWidth
              value={suggestProcessId}
              onChange={(e) => {
                setSuggestProcessId(e.target.value)
                setSuggestions(null)
                setDocResult(null)
              }}
            >
              {processes.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </TextField>

            {suggestError && <Alert severity="error">{suggestError}</Alert>}

            {!suggestions && (
              <Stack spacing={1.5}>
                <Button
                  variant="contained"
                  startIcon={<AutoAwesomeRoundedIcon />}
                  disabled={!suggestProcessId || suggesting || uploadingDoc}
                  onClick={runSuggest}
                >
                  {suggesting ? 'Generando sugerencias…' : 'Generar sugerencias (texto corto del proceso)'}
                </Button>

                <Divider>o</Divider>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  hidden
                  onChange={handleFileSelected}
                />
                <Button
                  variant="outlined"
                  startIcon={<UploadFileRoundedIcon />}
                  disabled={!suggestProcessId || suggesting || uploadingDoc}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingDoc ? 'Leyendo PDF completo…' : 'Subir PDF completo del proceso'}
                </Button>
                <Typography variant="caption" color="text.secondary">
                  El agente lee el documento entero (hasta ~50 páginas) en una sola pasada y propone resumen ejecutivo,
                  personas/departamentos mencionados y todas las decisiones candidatas.
                </Typography>
              </Stack>
            )}

            {(suggesting || uploadingDoc) && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {docResult && (
              <Stack spacing={1}>
                <Alert severity="success">
                  {docResult.fileName} · {docResult.pageCount} páginas procesadas
                </Alert>
                {docResult.executiveSummary && (
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                        Resumen ejecutivo
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {docResult.executiveSummary}
                      </Typography>
                      {(docResult.people.length > 0 || docResult.departments.length > 0) && (
                        <Box sx={{ mt: 1, display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                          {docResult.people.map((p, i) => (
                            <Chip key={`p-${i}`} size="small" label={p.role ? `${p.name} (${p.role})` : p.name} />
                          ))}
                          {docResult.departments.map((d, i) => (
                            <Chip key={`d-${i}`} size="small" variant="outlined" label={d} />
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                )}
              </Stack>
            )}

            {suggestions && suggestions.length === 0 && (
              <Alert severity="info">El agente no encontró decisiones candidatas claras en el texto de este proceso.</Alert>
            )}

            {suggestions && suggestions.length > 0 && (
              <Stack spacing={1.5}>
                {suggestions.map((s, idx) => (
                  <Card key={idx} variant="outlined">
                    <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                      <Typography sx={{ fontWeight: 700 }}>{s.name}</Typography>
                      {s.description && (
                        <Typography variant="body2" color="text.secondary">
                          {s.description}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                        <Chip size="small" label={s.decisionType} />
                        <Chip size="small" label={`Reglas: ${s.isRuleBased}`} />
                        <Chip size="small" label={`Datos: ${s.dataAvailability}`} />
                      </Box>
                      <Button
                        size="small"
                        variant="outlined"
                        sx={{ alignSelf: 'flex-start', mt: 0.5 }}
                        onClick={() => useSuggestion(s)}
                      >
                        Usar esta sugerencia
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuggestOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
