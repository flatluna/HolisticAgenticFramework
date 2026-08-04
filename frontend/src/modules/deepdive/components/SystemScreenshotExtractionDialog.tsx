import { useRef, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material'
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import TravelExploreRoundedIcon from '@mui/icons-material/TravelExploreRounded'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import {
  extractSystemFieldsFromScreenshot,
  type SystemFieldCandidateDto,
} from '../services/systemFieldScreenshotApi'
import { SYSTEM_FIELD_ACTIONS } from '../data/catalogs'
import { getDataDictionaryEntries } from '@/modules/datadictionary/state/dataDictionaryStore'

const accionLabel = (accion: string) => SYSTEM_FIELD_ACTIONS.find((a) => a.value === accion)?.label ?? accion

// Busca, SOLO para mostrarlo en la revisión (no modifica nada todavía), qué
// va a pasar en el diccionario si se acepta este campo — misma lógica que
// `findOrRegisterDictionaryEntry` en StepCapturePage.tsx (que usa el
// `context` = nombre del paso actual para no fusionar ciegamente nombres
// genéricos como "Priority"/"Status"/"Category" que en realidad significan
// cosas distintas en procesos distintos). Se muestra ANTES de aceptar para
// que el asesor decida si renombra el campo o le pone contexto antes.
type DictionaryPreview =
  | { kind: 'new' }
  | { kind: 'merge'; officialName: string; description: string }
  | { kind: 'conflict'; officialName: string; context: string }

const previewDictionaryMatch = (nombreCampo: string, context: string): DictionaryPreview => {
  const normalizedName = nombreCampo.trim().toLowerCase()
  const normalizedContext = context.trim().toLowerCase()
  const matches = getDataDictionaryEntries().filter(
    (e) =>
      e.officialName.trim().toLowerCase() === normalizedName || e.synonyms.some((s) => s.trim().toLowerCase() === normalizedName),
  )
  if (matches.length === 0) return { kind: 'new' }
  const reusable = matches.find((e) => !e.context.trim() || e.context.trim().toLowerCase() === normalizedContext)
  if (reusable) return { kind: 'merge', officialName: reusable.officialName, description: reusable.description }
  return { kind: 'conflict', officialName: matches[0].officialName, context: matches[0].context }
}

// "📸 Extraer campos desde captura de pantalla" — al capturar los datos que
// procesa un paso de tipo Sistema/Aplicación, el asesor puede subir UNA
// captura de pantalla (SAP u otro sistema) y un agente de IA con visión lee
// TODOS los campos visibles, investigándolos además con Bing Grounding
// (ver SystemScreenshotExtractionAgent + SystemFieldGroundingAgent en el
// backend) — el asesor revisa la propuesta y acepta/rechaza campo por
// campo antes de que se agreguen como nuevos "📥 Datos" del paso. NUNCA se
// pide ni se muestra el valor realmente capturado en un campo, solo su
// nombre/estructura.
export const SystemScreenshotExtractionDialog = ({
  open,
  systemOptions,
  defaultSystem,
  context,
  onClose,
  onAccept,
}: {
  open: boolean
  systemOptions: string[]
  defaultSystem?: string
  /** Nombre del paso actual — usado solo para la vista previa de qué pasará
   * en el diccionario (ver `previewDictionaryMatch`). */
  context: string
  onClose: () => void
  onAccept: (fields: SystemFieldCandidateDto[], systemName: string, transaccionCodigo: string, transaccionNombre: string) => void
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [systemName, setSystemName] = useState(defaultSystem ?? '')
  // Transacción/pantalla de la que viene ESTA captura — se pide UNA sola
  // vez por captura (no por campo) porque los 20-30 campos que salen de una
  // misma pantalla comparten la misma transacción/pantalla. Se aplica a
  // TODOS los campos aceptados en `onAccept`.
  const [transaccionCodigo, setTransaccionCodigo] = useState('')
  const [transaccionNombre, setTransaccionNombre] = useState('')
  const [loading, setLoading] = useState(false)
  const [progressStep, setProgressStep] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sistemaDetectado, setSistemaDetectado] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<SystemFieldCandidateDto[] | null>(null)
  const [selected, setSelected] = useState<Record<number, boolean>>({})

  const reset = () => {
    setFile(null)
    setPreviewUrl(null)
    setTransaccionCodigo('')
    setTransaccionNombre('')
    setLoading(false)
    setProgressStep('')
    setError(null)
    setSistemaDetectado(null)
    setCandidates(null)
    setSelected({})
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFileChosen = (chosen: File | null) => {
    setFile(chosen)
    setError(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(chosen ? URL.createObjectURL(chosen) : null)
  }

  const handleExtract = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setProgressStep('Leyendo la captura de pantalla…')
    try {
      const { sistemaDetectado: detected, campos } = await extractSystemFieldsFromScreenshot(
        file,
        systemName.trim() || undefined,
        (step) => setProgressStep(step),
      )
      setSistemaDetectado(detected ?? null)
      if (detected && !systemName.trim()) setSystemName(detected)
      setCandidates(campos)
      setSelected(Object.fromEntries(campos.map((_, i) => [i, true])))
    } catch (err: any) {
      setError(err?.response?.data?.error ?? err?.message ?? 'No se pudieron extraer los campos de la captura.')
    } finally {
      setLoading(false)
    }
  }

  const selectedCount = Object.values(selected).filter(Boolean).length

  const handleAccept = () => {
    if (!candidates) return
    const accepted = candidates.filter((_, i) => selected[i])
    onAccept(accepted, systemName.trim() || sistemaDetectado || '', transaccionCodigo.trim(), transaccionNombre.trim())
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        📸 Extraer campos desde captura de pantalla
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        {!candidates && (
          <>
            <Typography variant="body2" color="text.secondary">
              Sube una captura de pantalla de una pantalla del sistema (SAP u otro) y un agente de IA identificará
              todos los campos visibles, proponiendo descripción, formato y reglas de negocio — investigados con
              Bing cuando sea posible. Solo se analiza la ESTRUCTURA de la pantalla, nunca los valores capturados.
            </Typography>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleFileChosen(e.target.files?.[0] ?? null)}
            />

            <Box
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                p: previewUrl ? 1.5 : 4,
                textAlign: 'center',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                '&:hover': { borderColor: 'primary.main', bgcolor: (t) => alpha(t.palette.primary.main, 0.04) },
              }}
            >
              {previewUrl ? (
                <Box
                  component="img"
                  src={previewUrl}
                  alt="Vista previa de la captura"
                  sx={{ maxWidth: '100%', maxHeight: 220, borderRadius: 1.5, objectFit: 'contain' }}
                />
              ) : (
                <>
                  <CloudUploadRoundedIcon sx={{ fontSize: 36, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Haz clic para elegir una imagen (PNG/JPG)
                  </Typography>
                </>
              )}
              {file && (
                <Typography variant="caption" color="text.secondary">
                  {file.name}
                </Typography>
              )}
            </Box>

            <Autocomplete
              freeSolo
              size="small"
              options={systemOptions}
              inputValue={systemName}
              onInputChange={(_, v) => setSystemName(v)}
              renderInput={(params) => (
                <TextField {...params} label="Sistema (opcional, ayuda a fundamentar la búsqueda)" placeholder='Ej: "SAP"' />
              )}
            />

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <TextField
                size="small"
                sx={{ flex: '1 1 160px' }}
                label="Transacción / Código (opcional)"
                placeholder='Ej: "VA01"'
                value={transaccionCodigo}
                onChange={(e) => setTransaccionCodigo(e.target.value)}
              />
              <TextField
                size="small"
                sx={{ flex: '1 1 200px' }}
                label="Nombre de pantalla (opcional)"
                placeholder='Ej: "Crear pedido de ventas"'
                value={transaccionNombre}
                onChange={(e) => setTransaccionNombre(e.target.value)}
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              Se aplica una sola vez a todos los campos de esta captura — todos vienen de la misma pantalla, así que no
              hace falta repetirlo campo por campo.
            </Typography>

            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <Button
              variant="contained"
              onClick={handleExtract}
              disabled={!file || loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeRoundedIcon />}
              sx={{ alignSelf: 'flex-start' }}
            >
              {loading ? progressStep || 'Extrayendo…' : 'Extraer campos con IA'}
            </Button>
          </>
        )}

        {candidates && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Se detectaron {candidates.length} campo{candidates.length === 1 ? '' : 's'}
                {sistemaDetectado ? ` en ${sistemaDetectado}` : ''} — revisa y elige cuáles agregar.
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={() => setSelected(Object.fromEntries(candidates.map((_, i) => [i, true])))}>
                  Seleccionar todos
                </Button>
                <Button size="small" onClick={() => setSelected({})}>
                  Ninguno
                </Button>
              </Stack>
            </Box>

            {candidates.length === 0 && (
              <Alert severity="info">No se detectó ningún campo en la captura. Intenta con otra imagen más nítida.</Alert>
            )}

            <Stack spacing={1.25} sx={{ maxHeight: 420, overflowY: 'auto', pr: 0.5 }}>
              {candidates.map((candidate, index) => (
                <Card
                  key={`${candidate.nombreCampo}-${index}`}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    display: 'flex',
                    gap: 1,
                    alignItems: 'flex-start',
                    flexShrink: 0,
                    bgcolor: selected[index] ? (t) => alpha(t.palette.primary.main, 0.05) : 'transparent',
                    borderColor: selected[index] ? 'primary.main' : 'divider',
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={!!selected[index]}
                    onChange={(e) => setSelected((prev) => ({ ...prev, [index]: e.target.checked }))}
                    sx={{ mt: -0.5 }}
                  />
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {candidate.nombreCampo}
                      </Typography>
                      {candidate.campoTecnico && (
                        <Chip size="small" label={candidate.campoTecnico} sx={{ height: 20, fontFamily: 'monospace' }} />
                      )}
                      {candidate.accion && (
                        <Chip size="small" variant="outlined" label={`Uso: ${accionLabel(candidate.accion)}`} sx={{ height: 20 }} />
                      )}
                      {candidate.encontradoEnGrounding && (
                        <Tooltip title={candidate.fuenteGrounding || 'Fundamentado con Bing Grounding'}>
                          <Chip
                            size="small"
                            icon={<TravelExploreRoundedIcon sx={{ fontSize: 14 }} />}
                            label="Fundamentado con Bing"
                            color="info"
                            variant="outlined"
                            sx={{ height: 20 }}
                          />
                        </Tooltip>
                      )}
                      {(() => {
                        const preview = previewDictionaryMatch(candidate.nombreCampo, context)
                        if (preview.kind === 'new') {
                          return (
                            <Chip size="small" label="🆕 Nuevo en diccionario" color="success" variant="outlined" sx={{ height: 20 }} />
                          )
                        }
                        if (preview.kind === 'merge') {
                          return (
                            <Tooltip
                              title={`Ya existe en el diccionario: "${preview.description || 'sin descripción'}" — se agregará esta pantalla como otra representación de ese mismo dato. Si en realidad es un dato distinto, cambia el nombre del campo antes de agregarlo.`}
                            >
                              <Chip
                                size="small"
                                label={`🔗 Coincide con "${preview.officialName}" en diccionario`}
                                color="warning"
                                variant="outlined"
                                sx={{ height: 20 }}
                              />
                            </Tooltip>
                          )
                        }
                        return (
                          <Tooltip
                            title={`Ya existe un dato "${preview.officialName}" pero en el contexto "${preview.context}" — como es distinto al contexto actual ("${context || 'sin nombre de paso'}"), se creará un dato NUEVO en vez de mezclarlos.`}
                          >
                            <Chip
                              size="small"
                              label="⚠️ Mismo nombre, otro contexto → se creará nuevo"
                              color="info"
                              variant="outlined"
                              sx={{ height: 20 }}
                            />
                          </Tooltip>
                        )
                      })()}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {candidate.descripcion || 'Sin descripción disponible.'}
                    </Typography>
                    {candidate.formato && (
                      <Typography variant="caption" color="text.secondary">
                        Formato: {candidate.formato}
                      </Typography>
                    )}
                    {candidate.reglaNegocio && (
                      <Typography variant="caption" color="text.secondary">
                        Regla de negocio: {candidate.reglaNegocio}
                      </Typography>
                    )}
                  </Box>
                </Card>
              ))}
            </Stack>

            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {candidates && (
          <Button startIcon={<RestartAltRoundedIcon />} onClick={reset}>
            Nueva captura
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button onClick={handleClose}>Cancelar</Button>
        {candidates && (
          <Button
            variant="contained"
            disabled={selectedCount === 0}
            startIcon={<AutoAwesomeRoundedIcon />}
            onClick={handleAccept}
          >
            Agregar {selectedCount} campo{selectedCount === 1 ? '' : 's'} seleccionado{selectedCount === 1 ? '' : 's'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
