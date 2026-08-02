import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Stack,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import { ProcessForm } from './ProcessForm'
import { deleteProcess, listProcesses, type ProcessDto } from './processApi'
import { listCapabilities, type CapabilityDto } from '../capabilities/capabilityApi'
import { uploadProcessDocument, type DecisionSuggestion, type ProcessDocumentResult } from '../decisions/decisionApi'

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

// Dimensión 2.3 "Procesos": lista plana de procesos registrados para el
// engagement (cada uno mostrando la capacidad dueña como chip), con acceso
// al formulario de captura/edición (ProcessForm). Cada proceso pertenece a
// exactamente una capacidad ya registrada previamente en 2.2.
export const ProcessDimensionPage = () => {
  const navigate = useNavigate()
  const [engagementId, setEngagementId] = useState<string | null>(null)
  const [processes, setProcesses] = useState<ProcessDto[]>([])
  const [capabilities, setCapabilities] = useState<CapabilityDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'form'>('list')
  const [editing, setEditing] = useState<ProcessDto | undefined>(undefined)

  // Flujo "Subir PDF del proceso": lee el documento completo con IA y
  // propone resumen ejecutivo, entidades y decisiones candidatas — el
  // usuario elige cuáles usar y termina en el formulario de Decisiones.
  const [uploadTarget, setUploadTarget] = useState<ProcessDto | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [docResult, setDocResult] = useState<ProcessDocumentResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Flujo "Borrar proceso": borra el proceso Y toda su data extraída de PDF
  // (filas ProcessDocument + archivo en Blob/Data Lake Storage). Pide
  // confirmación explícita antes de llamar al backend.
  const [deleteTarget, setDeleteTarget] = useState<ProcessDto | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const capabilityName = (id: string) => capabilities.find((c) => c.id === id)?.name ?? 'Sin capacidad'

  const loadAll = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const [processData, capabilityData] = await Promise.all([listProcesses(id), listCapabilities(id)])
      setProcesses(processData)
      setCapabilities(capabilityData)
    } catch {
      setError('No se pudieron cargar los procesos. Verifica que el backend esté corriendo.')
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

  const noCapabilities = !loading && capabilities.length === 0

  const openUploadDialog = (process: ProcessDto) => {
    setUploadTarget(process)
    setUploadError(null)
    setDocResult(null)
  }

  const handleFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // permite volver a seleccionar el mismo archivo
    if (!file || !uploadTarget) return

    if (file.type !== 'application/pdf') {
      setUploadError('El archivo debe ser un PDF.')
      return
    }

    setUploading(true)
    setUploadError(null)
    try {
      const result = await uploadProcessDocument(uploadTarget.id, file)
      setDocResult(result)
    } catch (err: any) {
      setUploadError(err?.response?.data?.error ?? 'No se pudo procesar el PDF. Intenta de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  const useSuggestion = (s: DecisionSuggestion) => {
    if (!uploadTarget) return
    setUploadTarget(null)
    navigate('/madurez/decisiones', { state: { processId: uploadTarget.id, suggestion: s } })
  }

  const confirmDelete = async () => {
    if (!deleteTarget || !engagementId) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteProcess(deleteTarget.id)
      setDeleteTarget(null)
      await loadAll(engagementId)
    } catch (err: any) {
      setDeleteError(err?.response?.data?.error ?? 'No se pudo borrar el proceso. Intenta de nuevo.')
    } finally {
      setDeleting(false)
    }
  }

  if (view === 'form' && engagementId) {
    return (
      <ProcessForm
        engagementId={engagementId}
        capabilities={capabilities}
        initialData={editing}
        onCancel={() => setView('list')}
        onSaved={() => {
          setView('list')
          loadAll(engagementId)
        }}
      />
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Procesos registrados ({processes.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          disabled={!engagementId || noCapabilities}
          onClick={() => {
            setEditing(undefined)
            setView('form')
          }}
        >
          Nuevo proceso
        </Button>
      </Box>

      {!engagementId && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Primero completa el perfil de la empresa en el Paso 1 (Empresa) para poder registrar procesos.
        </Alert>
      )}
      {noCapabilities && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Primero registra al menos una capacidad en "Capacidades Empresariales" — cada proceso debe pertenecer a una capacidad.
        </Alert>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : processes.length === 0 ? (
        engagementId &&
        !noCapabilities && (
          <Alert severity="info">Aún no hay procesos registrados. Usa "Nuevo proceso" para agregar el primero.</Alert>
        )
      ) : (
        <Grid container spacing={2}>
          {processes.map((p) => (
            <Grid item xs={12} sm={6} md={4} key={p.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {p.name}
                    </Typography>
                    <Chip size="small" label={p.status} color={p.status === 'Completo' ? 'success' : 'default'} />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {capabilityName(p.capabilityId)}
                    {p.owner ? ` · ${p.owner}` : ''}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                    <Chip size="small" label={`Documentado: ${p.isDocumented}`} sx={{ bgcolor: 'action.hover' }} />
                    <Chip size="small" label={`Formalizado: ${p.isFormalized}`} sx={{ bgcolor: 'action.hover' }} />
                    <Chip size="small" label={autonomyLabel[p.currentAutonomyLevel] ?? p.currentAutonomyLevel} sx={{ bgcolor: 'action.hover' }} />
                    <Chip size="small" label={`Criticidad: ${p.criticality}`} sx={{ bgcolor: 'action.hover' }} />
                  </Box>
                  <Box sx={{ flexGrow: 1 }} />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditRoundedIcon />}
                      onClick={() => {
                        setEditing(p)
                        setView('form')
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<UploadFileRoundedIcon />}
                      onClick={() => openUploadDialog(p)}
                    >
                      Subir PDF
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteRoundedIcon />}
                      onClick={() => {
                        setDeleteError(null)
                        setDeleteTarget(p)
                      }}
                    >
                      Borrar
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={!!uploadTarget} onClose={() => setUploadTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Subir PDF del proceso{uploadTarget ? ` · ${uploadTarget.name}` : ''}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Sube el documento completo del proceso (PDF, hasta 20MB). Un agente de IA lo lee entero en una sola
              pasada y propone resumen ejecutivo, personas/departamentos mencionados y decisiones candidatas — nada
              se guarda automáticamente.
            </Typography>

            <input ref={fileInputRef} type="file" accept="application/pdf" hidden onChange={handleFileSelected} />

            {!docResult && (
              <Button
                variant="contained"
                startIcon={<UploadFileRoundedIcon />}
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? 'Leyendo PDF completo…' : 'Seleccionar PDF'}
              </Button>
            )}

            {uploadError && <Alert severity="error">{uploadError}</Alert>}

            {uploading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {docResult && (
              <Stack spacing={1.5}>
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
                          {docResult.people.map((person, i) => (
                            <Chip
                              key={`p-${i}`}
                              size="small"
                              label={person.role ? `${person.name} (${person.role})` : person.name}
                            />
                          ))}
                          {docResult.departments.map((d, i) => (
                            <Chip key={`d-${i}`} size="small" variant="outlined" label={d} />
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                )}

                {docResult.suggestions.length === 0 ? (
                  <Alert severity="info">El agente no encontró decisiones candidatas claras en el documento.</Alert>
                ) : (
                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Decisiones candidatas ({docResult.suggestions.length})
                    </Typography>
                    {docResult.suggestions.map((s, idx) => (
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
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadTarget(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => (deleting ? null : setDeleteTarget(null))} maxWidth="xs" fullWidth>
        <DialogTitle>¿Borrar proceso{deleteTarget ? ` "${deleteTarget.name}"` : ''}?</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="warning">
              Esto borra el proceso y TODA su data extraída de PDF (resumen ejecutivo, texto extraído y el archivo
              original en almacenamiento). Esta acción no se puede deshacer.
            </Alert>
            {deleteError && <Alert severity="error">{deleteError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteRoundedIcon />}
            disabled={deleting}
            onClick={confirmDelete}
          >
            {deleting ? 'Borrando…' : 'Borrar definitivamente'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
