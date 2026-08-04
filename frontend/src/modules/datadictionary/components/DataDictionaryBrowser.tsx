import { useMemo, useState } from 'react'
import { Box, Button, Card, Chip, IconButton, InputAdornment, TextField, Typography } from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { SYSTEM_FIELD_ACTIONS } from '@/modules/deepdive/data/catalogs'
import { useDeepDiveProcesses } from '@/modules/deepdive/state/deepDiveStore'
import { dataTypeLabel } from '../data/dictionaryCatalogs'
import { DataDictionaryEntryDialog } from './DataDictionaryEntryDialog'
import { removeDataDictionaryEntry, upsertDataDictionaryEntry, useDataDictionaryEntries } from '../state/dataDictionaryStore'

type DialogMode = 'closed' | 'create' | 'edit'

// UN punto de contacto entre un dato canónico y un proceso/paso real —
// hoy se muestra como texto en la ficha "Dónde aparece"; mañana es
// literalmente la lista de ARISTAS para un grafo dato ↔ proceso/sistema
// (nodos = datos + procesos/sistemas, aristas = estos touchpoints con su
// acción). Se arma a partir de los StepDataItem — modelo unificado: cada
// dato ya trae, opcionalmente, su propia ubicación exacta en sistema
// (StepDataItem.systemLocation), sin una sección separada a nivel paso.
interface DataUsageTouchpoint {
  processName: string
  stepName: string
  action: string
  system?: string
  transaccion?: string
}

const systemFieldActionLabel = (value: string) => SYSTEM_FIELD_ACTIONS.find((a) => a.value === value)?.label ?? value

interface DataDictionaryBrowserProps {
  /** Vista de solo consulta — oculta "Agregar dato" y los íconos de editar/
   * eliminar de la ficha (usada en el tab global de "📚 Diccionario" que
   * vive fuera del ciclo de captura/edición de un paso). Por default es
   * `false` (comportamiento completo, usado en la página dedicada). */
  readOnly?: boolean
}

// "📚 Diccionario de Datos del Negocio" — vista central de la taxonomía de
// datos que se va poblando conforme el FDE captura pasos en L3. El uso
// ("en qué procesos aparece") se calcula cruzando con el store de Deep
// Dive — el diccionario en sí no sabe nada de procesos/pasos. Extraído de
// DataDictionaryPage para poder reutilizarse en modo solo-lectura desde el
// tab global (ver Layout.tsx) sin duplicar esta lógica.
export const DataDictionaryBrowser = ({ readOnly = false }: DataDictionaryBrowserProps) => {
  const entries = useDataDictionaryEntries()
  const processes = useDeepDiveProcesses()
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dialogMode, setDialogMode] = useState<DialogMode>('closed')

  const usageByEntry = useMemo(() => {
    const map = new Map<string, { processNames: Set<string>; touchpoints: DataUsageTouchpoint[] }>()
    const addTouchpoint = (dictionaryId: string, touchpoint: DataUsageTouchpoint) => {
      const bucket = map.get(dictionaryId) ?? { processNames: new Set<string>(), touchpoints: [] }
      bucket.processNames.add(touchpoint.processName)
      bucket.touchpoints.push(touchpoint)
      map.set(dictionaryId, bucket)
    }
    processes.forEach((p) => {
      p.steps.forEach((s) => {
        ;(s.stepData ?? []).forEach((d) => {
          if (!d.dictionaryId) return
          const loc = d.systemLocation
          addTouchpoint(d.dictionaryId, {
            processName: p.name,
            stepName: s.name,
            action: loc?.accion ? systemFieldActionLabel(loc.accion) : 'Dato del paso',
            system: loc?.sistema || undefined,
            transaccion: loc?.transaccionCodigo || loc?.transaccionNombre || undefined,
          })
        })
      })
    })
    return map
  }, [processes])

  const filteredEntries = entries.filter((e) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      e.officialName.toLowerCase().includes(q) ||
      e.technicalName.toLowerCase().includes(q) ||
      e.synonyms.some((s) => s.toLowerCase().includes(q))
    )
  })

  const totalRepresentations = entries.reduce((sum, e) => sum + e.representations.length, 0)
  const totalPII = entries.filter((e) => e.isPII).length

  const selectedEntry = entries.find((e) => e.id === selectedId)
  const selectedUsage = selectedId ? usageByEntry.get(selectedId) : undefined

  return (
    <Box sx={{ minHeight: '100%', bgcolor: 'background.default', color: 'text.primary' }}>
      <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          📚 Diccionario de Datos del Negocio{readOnly ? ' (solo consulta)' : ''}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {entries.length} dato{entries.length === 1 ? '' : 's'} canónico{entries.length === 1 ? '' : 's'} ·{' '}
          {totalRepresentations} representaci{totalRepresentations === 1 ? 'ón' : 'ones'} en sistemas ·{' '}
          {totalPII} marcado{totalPII === 1 ? '' : 's'} como PII
        </Typography>
      </Box>

      <Box sx={{ p: 3, display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'flex-start' }}>
        {/* Lista + buscador */}
        <Box sx={{ flex: '1 1 380px', minWidth: 320, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <TextField
            size="small"
            placeholder="Buscar dato, sinónimo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          {filteredEntries.map((entry) => {
            const usage = usageByEntry.get(entry.id)
            const isSelected = entry.id === selectedId
            return (
              <Card
                key={entry.id}
                variant="outlined"
                onClick={() => setSelectedId(entry.id)}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  cursor: 'pointer',
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  bgcolor: isSelected ? 'action.selected' : 'background.paper',
                  '&:hover': { borderColor: 'primary.main' },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography sx={{ fontWeight: 700, flexGrow: 1 }}>{entry.officialName}</Typography>
                  {entry.context && <Chip size="small" variant="outlined" label={entry.context} />}
                  {entry.isPII && <Chip size="small" color="warning" label="PII" />}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {dataTypeLabel(entry.dataType)} · {entry.representations.length} sistema
                  {entry.representations.length === 1 ? '' : 's'} · {usage?.processNames.size ?? 0} proceso
                  {(usage?.processNames.size ?? 0) === 1 ? '' : 's'}
                </Typography>
              </Card>
            )
          })}

          {filteredEntries.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              No se encontraron datos con ese criterio.
            </Typography>
          )}

          {!readOnly && (
            <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={() => setDialogMode('create')} sx={{ mt: 1 }}>
              Agregar dato
            </Button>
          )}
        </Box>

        {/* Ficha del dato seleccionado */}
        <Box sx={{ flex: '1 1 420px', minWidth: 320 }}>
          {!selectedEntry ? (
            <Card variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2, borderStyle: 'dashed' }}>
              <Typography color="text.secondary">Selecciona un dato de la lista para ver su ficha completa.</Typography>
            </Card>
          ) : (
            <Card variant="outlined" sx={{ p: 2.5, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {selectedEntry.officialName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {dataTypeLabel(selectedEntry.dataType)}
                  </Typography>
                </Box>
                {!readOnly && (
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => setDialogMode('edit')} aria-label="Editar dato">
                      <EditRoundedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        removeDataDictionaryEntry(selectedEntry.id)
                        setSelectedId(null)
                      }}
                      aria-label="Eliminar dato"
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {selectedEntry.context && (
                  <Chip size="small" variant="outlined" label={`Contexto: ${selectedEntry.context}`} />
                )}
                {selectedEntry.isPII && (
                  <Chip
                    size="small"
                    color="warning"
                    icon={<WarningAmberRoundedIcon sx={{ fontSize: '14px !important' }} />}
                    label="Dato sensible / PII"
                  />
                )}
              </Box>

              <Typography variant="body2">{selectedEntry.description || 'Sin descripción.'}</Typography>

              <Box>
                <Typography variant="overline" color="text.secondary">
                  Nombre técnico
                </Typography>
                <Typography variant="body2">{selectedEntry.technicalName || '—'}</Typography>
              </Box>

              {selectedEntry.synonyms.length > 0 && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Sinónimos
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 0.5 }}>
                    {selectedEntry.synonyms.map((s) => (
                      <Chip key={s} size="small" label={s} />
                    ))}
                  </Box>
                </Box>
              )}

              <Box>
                <Typography variant="overline" color="text.secondary">
                  Formato / longitud esperada
                </Typography>
                <Typography variant="body2">{selectedEntry.format || '—'}</Typography>
              </Box>

              <Box>
                <Typography variant="overline" color="text.secondary">
                  Dueño del dato
                </Typography>
                <Typography variant="body2">{selectedEntry.owner || '—'}</Typography>
              </Box>

              <Box>
                <Typography variant="overline" color="text.secondary">
                  Responsable de calidad del dato
                </Typography>
                <Typography variant="body2">{selectedEntry.qualityOwner || '—'}</Typography>
              </Box>

              <Box>
                <Typography variant="overline" color="text.secondary">
                  Representación en sistemas
                </Typography>
                {selectedEntry.representations.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Sin representaciones registradas.
                  </Typography>
                )}
                {selectedEntry.representations.map((rep) => (
                  <Typography key={rep.id} variant="body2">
                    <strong>{rep.system || 'Sistema no especificado'}</strong> → {rep.fieldName || '—'} (
                    {rep.screenOrTable || 'pantalla/tabla no especificada'})
                  </Typography>
                ))}
              </Box>

              {selectedEntry.globalRules.length > 0 && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Reglas globales
                  </Typography>
                  {selectedEntry.globalRules.map((rule) => (
                    <Typography key={rule.id} variant="body2">
                      • {rule.description || '(sin descripción)'}
                    </Typography>
                  ))}
                </Box>
              )}

              <Box>
                <Typography variant="overline" color="text.secondary">
                  Dónde aparece
                </Typography>
                {!selectedUsage || selectedUsage.touchpoints.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Todavía no está referenciado en ningún paso capturado.
                  </Typography>
                ) : (
                  <>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      {selectedUsage.touchpoints.length} punto{selectedUsage.touchpoints.length === 1 ? '' : 's'} de contacto en{' '}
                      {selectedUsage.processNames.size} proceso{selectedUsage.processNames.size === 1 ? '' : 's'}
                    </Typography>
                    {selectedUsage.touchpoints.map((tp, i) => (
                      <Typography key={i} variant="body2" color="text.secondary">
                        • {tp.processName} → {tp.stepName}
                        {tp.system ? ` (${tp.system}${tp.transaccion ? ' · ' + tp.transaccion : ''})` : ''} — {tp.action}
                      </Typography>
                    ))}
                  </>
                )}
              </Box>
            </Card>
          )}
        </Box>
      </Box>

      {!readOnly && dialogMode === 'create' && (
        <DataDictionaryEntryDialog
          open
          onClose={() => setDialogMode('closed')}
          onSave={(entry) => {
            upsertDataDictionaryEntry(entry)
            setSelectedId(entry.id)
            setDialogMode('closed')
          }}
        />
      )}
      {!readOnly && dialogMode === 'edit' && selectedEntry && (
        <DataDictionaryEntryDialog
          open
          initialEntry={selectedEntry}
          onClose={() => setDialogMode('closed')}
          onSave={(entry) => {
            upsertDataDictionaryEntry(entry)
            setDialogMode('closed')
          }}
        />
      )}
    </Box>
  )
}
