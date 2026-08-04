import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import { PUESTOS, SISTEMAS } from '@/modules/deepdive/data/catalogs'
import { SelectWithOther } from '@/modules/deepdive/components/SelectWithOther'
import { BusinessRuleEditor } from '@/modules/deepdive/components/BusinessRuleEditor'
import { emptyRule } from '@/modules/deepdive/utils/businessRules'
import type { BusinessRule } from '@/modules/deepdive/state/deepDiveStore'
import { DATA_TYPES } from '../data/dictionaryCatalogs'
import {
  CanonicalDataEntry,
  CanonicalDataType,
  DataRepresentation,
  emptyDataDictionaryEntry,
} from '../state/dataDictionaryStore'
import { suggestDataDictionaryEntry, type DataDictionarySuggestionDto } from '../services/suggestionApi'

const emptyRepresentation = (): DataRepresentation => ({
  id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  system: '',
  fieldName: '',
  screenOrTable: '',
})

// Mini-formulario con la estructura completa de una entrada del diccionario
// (§1 del pedido). Se usa tanto para crear un dato nuevo sin salir del flujo
// de captura de pasos (desde StepCapturePage) como para crear/editar
// desde la propia pantalla del diccionario. El componente se monta solo
// mientras `open` — así siempre arranca con estado fresco (initialEntry o
// seedName), sin necesidad de efectos de reseteo.
export const DataDictionaryEntryDialog = ({
  open,
  initialEntry,
  seedName,
  onClose,
  onSave,
}: {
  open: boolean
  initialEntry?: CanonicalDataEntry
  seedName?: string
  onClose: () => void
  onSave: (entry: CanonicalDataEntry) => void
}) => {
  const [entry, setEntry] = useState<CanonicalDataEntry>(() => initialEntry ?? emptyDataDictionaryEntry(seedName ?? ''))
  const [synonymDraft, setSynonymDraft] = useState('')

  // "✨ Sugerir con IA" — solo al CREAR un dato nuevo (no al editar uno
  // existente). Llama al agente de IA (Microsoft Agent Framework + Grounding
  // with Bing Search) que propone la entrada completa a partir de una
  // descripción corta. Siempre es una propuesta: el asesor debe pulsar
  // "Aplicar sugerencia" para volcarla al formulario, y luego puede
  // editarla libremente antes de guardar.
  const [aiPrompt, setAiPrompt] = useState(seedName ?? '')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiSuggestion, setAiSuggestion] = useState<DataDictionarySuggestionDto | null>(null)

  const handleSuggest = async () => {
    const description = aiPrompt.trim() || entry.officialName.trim()
    if (!description) {
      setAiError('Escribe una breve descripción del dato (ej: "RFC en México").')
      return
    }
    setAiLoading(true)
    setAiError(null)
    try {
      const suggestion = await suggestDataDictionaryEntry(description)
      setAiSuggestion(suggestion)
    } catch {
      setAiError('No se pudo generar la sugerencia. Verifica que el agente esté configurado en el backend.')
    } finally {
      setAiLoading(false)
    }
  }

  const applyAiSuggestion = () => {
    if (!aiSuggestion) return
    setEntry((prev) => {
      const mergedSynonyms = Array.from(new Set([...prev.synonyms, ...aiSuggestion.synonyms]))
      const knownDataTypes = DATA_TYPES.map((t) => t.value)
      const suggestedRepresentations = aiSuggestion.possibleSourceSystems
        .filter((sys) => !prev.representations.some((r) => r.system === sys))
        .map((sys) => ({
          ...emptyRepresentation(),
          system: SISTEMAS.includes(sys) ? sys : '',
          fieldName: SISTEMAS.includes(sys) ? '' : sys,
        }))
      const suggestedRules = aiSuggestion.businessRules.map((r) => ({
        ...emptyRule(),
        description: r.description,
        owner: r.owner ?? '',
        source: r.source ?? '',
        origin: 'Sugerencia IA (Bing grounding)',
      }))

      return {
        ...prev,
        officialName: prev.officialName.trim() ? prev.officialName : aiSuggestion.officialName,
        technicalName: prev.technicalName.trim() ? prev.technicalName : aiSuggestion.technicalName ?? prev.technicalName,
        synonyms: mergedSynonyms,
        dataType: knownDataTypes.includes(aiSuggestion.dataType as CanonicalDataType)
          ? (aiSuggestion.dataType as CanonicalDataType)
          : prev.dataType,
        description: prev.description.trim() ? prev.description : aiSuggestion.description ?? prev.description,
        format: prev.format.trim() ? prev.format : aiSuggestion.format ?? prev.format,
        isPII: prev.isPII || aiSuggestion.isPII,
        owner: prev.owner.trim() ? prev.owner : aiSuggestion.suggestedOwner ?? prev.owner,
        representations: [...prev.representations, ...suggestedRepresentations],
        globalRules: [...prev.globalRules, ...suggestedRules],
      }
    })
  }

  const addSynonym = () => {
    const value = synonymDraft.trim()
    if (!value || entry.synonyms.includes(value)) return
    setEntry({ ...entry, synonyms: [...entry.synonyms, value] })
    setSynonymDraft('')
  }
  const removeSynonym = (value: string) =>
    setEntry({ ...entry, synonyms: entry.synonyms.filter((s) => s !== value) })

  const addGlobalRule = () => setEntry({ ...entry, globalRules: [...entry.globalRules, emptyRule()] })
  const updateGlobalRule = (id: string, patch: Partial<BusinessRule>) =>
    setEntry({ ...entry, globalRules: entry.globalRules.map((r) => (r.id === id ? { ...r, ...patch } : r)) })
  const removeGlobalRule = (id: string) =>
    setEntry({ ...entry, globalRules: entry.globalRules.filter((r) => r.id !== id) })

  const isValid = entry.officialName.trim() !== ''

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle>{initialEntry ? 'Editar dato canónico' : '➕ Crear nuevo dato en diccionario'}</DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {!initialEntry && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              p: 1.5,
              border: '1px solid',
              borderColor: 'primary.light',
              borderRadius: 2,
              bgcolor: 'primary.50',
            }}
          >
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AutoAwesomeRoundedIcon fontSize="small" color="primary" /> Sugerir con IA
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Describe el dato (ej. "RFC en México", "fecha de nacimiento del empleado") y el agente de IA
              propondrá nombre, tipo, dueño, sistemas de origen, referencias legales y reglas de negocio,
              fundamentadas con una búsqueda real en Bing.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                placeholder='Ej: "RFC en México"'
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSuggest()
                  }
                }}
                sx={{ flexGrow: 1, bgcolor: 'background.paper' }}
              />
              <Button
                variant="contained"
                size="small"
                onClick={handleSuggest}
                disabled={aiLoading}
                startIcon={aiLoading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeRoundedIcon />}
              >
                Sugerir
              </Button>
            </Box>
            {aiError && (
              <Alert severity="error" onClose={() => setAiError(null)}>
                {aiError}
              </Alert>
            )}
            {aiSuggestion && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 0.5 }}>
                <Typography variant="body2">
                  <strong>{aiSuggestion.officialName}</strong>
                  {aiSuggestion.description ? ` — ${aiSuggestion.description}` : ''}
                </Typography>
                {aiSuggestion.possibleSourceSystems.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    Sistemas posibles: {aiSuggestion.possibleSourceSystems.join(', ')}
                  </Typography>
                )}
                {aiSuggestion.legalReferences.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    📜 Referencias legales: {aiSuggestion.legalReferences.join(' · ')}
                  </Typography>
                )}
                {aiSuggestion.bestPractices.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    ✅ Mejores prácticas: {aiSuggestion.bestPractices.join(' · ')}
                  </Typography>
                )}
                {aiSuggestion.businessRules.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    📏 Reglas propuestas: {aiSuggestion.businessRules.map((r) => r.description).join(' · ')}
                  </Typography>
                )}
                <Button size="small" variant="outlined" onClick={applyAiSuggestion} sx={{ alignSelf: 'flex-start' }}>
                  Aplicar sugerencia al formulario
                </Button>
              </Box>
            )}
          </Box>
        )}
        <TextField
          size="small"
          label="Nombre oficial en la empresa"
          required
          placeholder='Ej: "RFC"'
          value={entry.officialName}
          onChange={(e) => setEntry({ ...entry, officialName: e.target.value })}
        />
        <TextField
          size="small"
          label="Descripción del dato"
          placeholder="¿Qué representa?"
          multiline
          minRows={2}
          value={entry.description}
          onChange={(e) => setEntry({ ...entry, description: e.target.value })}
        />
        <TextField
          size="small"
          label="Nombre técnico / cómo se llama comúnmente"
          value={entry.technicalName}
          onChange={(e) => setEntry({ ...entry, technicalName: e.target.value })}
        />
        <TextField
          size="small"
          label="Contexto / proceso de negocio (opcional)"
          placeholder='Ej: "Aprobación de crédito", "Recursos Humanos"'
          helperText='Déjalo vacío si es un dato verdaderamente global (ej. "RFC"). Llénalo cuando el nombre sea genérico ("Priority", "Status", "Category") para que no se confunda con el mismo nombre usado en otro proceso.'
          value={entry.context}
          onChange={(e) => setEntry({ ...entry, context: e.target.value })}
        />

        <Box>
          <Typography variant="caption" color="text.secondary">
            Sinónimos / alias
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 0.5, mb: 1 }}>
            {entry.synonyms.map((s) => (
              <Chip key={s} size="small" label={s} onDelete={() => removeSynonym(s)} />
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              placeholder='Ej: "clave fiscal", "tax ID"'
              value={synonymDraft}
              onChange={(e) => setSynonymDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addSynonym()
                }
              }}
              sx={{ flexGrow: 1 }}
            />
            <Button size="small" onClick={addSynonym}>
              Agregar
            </Button>
          </Box>
        </Box>

        <TextField
          select
          size="small"
          label="Tipo de dato"
          value={entry.dataType}
          onChange={(e) => setEntry({ ...entry, dataType: e.target.value as CanonicalDataType })}
        >
          {DATA_TYPES.map((t) => (
            <MenuItem key={t.value} value={t.value}>
              {t.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          label="Formato / longitud esperada"
          placeholder='Ej: "13 caracteres"'
          value={entry.format}
          onChange={(e) => setEntry({ ...entry, format: e.target.value })}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Switch checked={entry.isPII} onChange={(e) => setEntry({ ...entry, isPII: e.target.checked })} />
          <Typography variant="body2">Dato sensible / PII</Typography>
          {entry.isPII && <Chip size="small" color="warning" label="PII" />}
        </Box>

        <SelectWithOther
          label="Dueño del dato"
          options={PUESTOS}
          value={entry.owner}
          onChange={(v) => setEntry({ ...entry, owner: v })}
        />
        <SelectWithOther
          label="Responsable de calidad del dato"
          options={PUESTOS}
          value={entry.qualityOwner}
          onChange={(v) => setEntry({ ...entry, qualityOwner: v })}
        />

        <Typography sx={{ fontWeight: 700, mt: 1 }}>Reglas globales del dato (opcional)</Typography>
        {entry.globalRules.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Sin reglas globales — aplican siempre, sin importar el paso.
          </Typography>
        )}
        {entry.globalRules.map((rule) => (
          <BusinessRuleEditor
            key={rule.id}
            rule={rule}
            onChange={(patch) => updateGlobalRule(rule.id, patch)}
            onDelete={() => removeGlobalRule(rule.id)}
          />
        ))}
        <Button variant="outlined" size="small" startIcon={<AddRoundedIcon />} onClick={addGlobalRule} sx={{ alignSelf: 'flex-start' }}>
          Agregar regla global
        </Button>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="contained" disabled={!isValid} onClick={() => onSave(entry)}>
          Guardar dato
        </Button>
      </DialogActions>
    </Dialog>
  )
}
