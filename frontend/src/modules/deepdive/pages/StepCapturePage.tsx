import { memo, useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Autocomplete,
  Box,
  Button,
  ButtonBase,
  Card,
  Chip,
  CircularProgress,
  Collapse,
  Fade,
  IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import {
  actionTypeMeta,
  API_AVAILABILITY_OPTIONS,
  API_TYPES,
  BLOQUEO_TYPES,
  CANALES,
  channelNeedsDireccion,
  DATA_ORIGINS,
  DECISION_TYPES,
  DEPARTAMENTOS,
  DIRECCION_OPTIONS,
  DOCUMENT_ACTIONS,
  ejemploContenidoLabel,
  FUENTE_NO_ESTRUCTURADA_TIPOS,
  fuenteCamposExtra,
  IA_POTENTIAL_OPTIONS,
  PUESTOS,
  SISTEMAS,
  SYSTEM_FIELD_ACTIONS,
  apiAvailabilityMeta,
  isSystemOrigin,
  WIZARD_ACTION_TYPES,
  WIZARD_STAGES,
  wizardStageColor,
  type ApiAvailability,
  type DireccionComunicacion,
  type IAPotential,
  type SystemFieldAction,
} from '../data/catalogs'
import {
  BusinessRule,
  DataOwner,
  DataSystemLocation,
  FuenteNoEstructurada,
  ProcessStepRecord,
  StepDataItem,
  useDeepDiveProcess,
  upsertProcessStep,
  linkProcessToBackend,
} from '../state/deepDiveStore'
import { createProcessActivity, updateProcessActivity, createActivityInteraction, listActivityInteractions, listProcessActivities } from '../services/processActivityApi'
import { uploadSourceDocument, listSourceDocuments } from '../services/documentExtractionApi'
import { listCapabilities, createCapability, emptyCapabilityForm, type CapabilityDto } from '@/modules/madurez/capabilities/capabilityApi'
import { createProcess, emptyProcessForm, listProcesses } from '@/modules/madurez/processes/processApi'
import { getActiveEngagementId } from '@/shared/hooks/useEmpresaActiva'
import { SelectWithOther } from '../components/SelectWithOther'
import { BusinessRuleEditor } from '../components/BusinessRuleEditor'
import { emptyRule, isComplianceRisk, isTribalRisk } from '../utils/businessRules'
import { emptyDataOwner } from '../utils/dataOwner'
import { emptyDataSystemLocation } from '../utils/systemLocation'
import { emptyFuenteNoEstructurada } from '../utils/fuentesNoEstructuradas'
import { collectStepRules } from '../utils/stepStats'
import {
  aMinutos,
  deMinutos,
  emptyTiempos,
  tiempoActivoLabel,
  tiempoEsperaConfig,
  UNIDADES_TIEMPO,
  type UnidadTiempo,
} from '../utils/tiempos'
import {
  addModuloToSystem,
  addTransaccionToSystem,
  setSystemApiInfo,
  useIsSuiteSystem,
  useSystemEntry,
} from '../state/systemsCatalogStore'
import {
  CanonicalDataEntry,
  emptyDataDictionaryEntry,
  getDataDictionaryEntries,
  upsertDataDictionaryEntry,
  useDataDictionaryEntries,
  type CanonicalDataType,
  type DataRepresentation,
} from '@/modules/datadictionary/state/dataDictionaryStore'
import { DataDictionaryEntryDialog } from '@/modules/datadictionary/components/DataDictionaryEntryDialog'
import {
  suggestDataDictionaryEntry,
  type DataDictionaryRuleSuggestionDto,
} from '@/modules/datadictionary/services/suggestionApi'
import { enrichSapField, type SapFieldEnrichmentDto } from '../services/sapFieldEnrichmentApi'
import { SystemScreenshotExtractionDialog } from '../components/SystemScreenshotExtractionDialog'
import type { SystemFieldCandidateDto } from '../services/systemFieldScreenshotApi'
import { StepWizardStepper } from '../components/StepWizardStepper'
import { InlineCapabilityDialog } from '../components/InlineCapabilityDialog'

const emptyDataItem = (): StepDataItem => ({
  id: `data-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name: '',
  origin: '',
  format: '',
  rules: [],
})

const emptyDraft = (order: number): ProcessStepRecord => ({
  id: `step-${Date.now()}`,
  order,
  name: '',
  description: '',
  tiempos: emptyTiempos(5),
  responsiblePuesto: '',
  iaPotential: '',
  notes: '',
  actionType: 'sistema',
  stepData: [],
  stepRules: [],
})

// Panel de edición COMPLETO de UN dato que el paso procesa (todos los
// campos + su propia lista dinámica de reglas de negocio anidada) — se
// muestra para UN SOLO dato a la vez, el seleccionado en la lista
// compacta (ver DataItemRow más abajo). Antes cada dato era un Accordion
// independiente apilado verticalmente: con 25+ datos (típico tras "📸
// Extraer campos desde captura de pantalla") esto obligaba a hacer scroll
// por un muro de acordeones, y varios podían quedar expandidos a la vez,
// pegando el contenido de uno con el encabezado del siguiente. El patrón
// lista-compacta + panel de detalle (igual que 📚 Diccionario de Datos y
// 🖥 Catálogo de Sistemas) resuelve ambos problemas.
// El campo "Nombre del dato" busca en el 📚 Diccionario de Datos del Negocio
// (state global, no local a este paso): si el dato ya existe se vincula y
// hereda formato/tipo; si no existe, se puede crear sin salir del flujo.
const DataItemDetailPanel = ({
  dataItem,
  index,
  systemOptions,
  onAddCustomSystem,
  onChange,
  onDelete,
  onClose,
}: {
  dataItem: StepDataItem
  index: number
  systemOptions: string[]
  onAddCustomSystem: (name: string) => void
  onChange: (id: string, updated: StepDataItem) => void
  onDelete: (id: string) => void
  onClose: () => void
}) => {
  const dictionaryEntries = useDataDictionaryEntries()
  const [creatingSeed, setCreatingSeed] = useState<string | null>(null)
  // "🔌 API del sistema" es conocimiento GLOBAL (vive en systemsCatalogStore,
  // no en este dato) — colapsado por defecto para no repetir el mismo
  // formulario en cada uno de los N datos que comparten sistema.
  const [apiInfoOpen, setApiInfoOpen] = useState(false)
  const navigate = useNavigate()
  // Formulario dividido en pestañas (antes todo apilado verticalmente, muy
  // largo con datos de sistema): "General" (nombre/dueño/origen/formato),
  // "Sistema" (ubicación exacta — solo aplica si el origen es un sistema) y
  // "Reglas" (reglas de negocio de este dato). Se resetea a la pestaña 0 al
  // cambiar de dato porque el padre remonta este componente con `key`.
  const [activeTab, setActiveTab] = useState(0)

  // Envoltura local: el resto del componente sigue llamando "patchItem(nextItem)"
  // como antes llamaba a "onChange(nextItem)", sin tener que reescribir cada
  // sitio de uso — solo el contrato con el padre cambió.
  const patchItem = (updated: StepDataItem) => onChange(dataItem.id, updated)

  const addRule = () => patchItem({ ...dataItem, rules: [...dataItem.rules, emptyRule()] })
  const updateRule = (ruleId: string, patch: Partial<BusinessRule>) =>
    patchItem({ ...dataItem, rules: dataItem.rules.map((r) => (r.id === ruleId ? { ...r, ...patch } : r)) })
  const removeRule = (ruleId: string) =>
    patchItem({ ...dataItem, rules: dataItem.rules.filter((r) => r.id !== ruleId) })

  // "✨ Sugerir reglas con IA" para ESTE dato dentro de ESTE paso — a
  // diferencia de las reglas globales sugeridas al crear el dato en el
  // diccionario (siempre iguales para el dato), estas reglas genéricas
  // (ej. "la fecha no puede ser posterior a hoy", "máximo 14 caracteres")
  // pueden variar según el paso/sistema/proceso en que se captura el dato,
  // así que se sugieren y agregan aquí, a nivel de dato-en-paso.
  const [aiRulesLoading, setAiRulesLoading] = useState(false)
  const [aiRulesError, setAiRulesError] = useState<string | null>(null)
  const [aiRuleSuggestions, setAiRuleSuggestions] = useState<DataDictionaryRuleSuggestionDto[] | null>(null)

  const handleSuggestRules = async () => {
    const description = dataItem.name.trim() || linkedEntry?.officialName
    if (!description) {
      setAiRulesError('Escribe primero el nombre del dato para poder sugerir reglas.')
      return
    }
    setAiRulesLoading(true)
    setAiRulesError(null)
    try {
      const suggestion = await suggestDataDictionaryEntry(description)
      setAiRuleSuggestions(suggestion.businessRules)
    } catch {
      setAiRulesError('No se pudo generar la sugerencia. Verifica que el agente esté configurado en el backend.')
    } finally {
      setAiRulesLoading(false)
    }
  }

  const applySuggestedRule = (rule: DataDictionaryRuleSuggestionDto) => {
    patchItem({
      ...dataItem,
      rules: [
        ...dataItem.rules,
        {
          ...emptyRule(),
          description: rule.description,
          owner: rule.owner ?? '',
          source: rule.source ?? '',
          origin: 'Sugerencia IA (Bing grounding)',
        },
      ],
    })
    setAiRuleSuggestions((prev) => prev?.filter((r) => r !== rule) ?? null)
  }

  const undocumentedCount = dataItem.rules.filter(isTribalRisk).length
  const complianceCount = dataItem.rules.filter(isComplianceRisk).length
  const linkedEntry = dataItem.dictionaryId ? dictionaryEntries.find((e) => e.id === dataItem.dictionaryId) : undefined

  const linkToEntry = (entry: CanonicalDataEntry) =>
    patchItem({ ...dataItem, name: entry.officialName, format: dataItem.format || entry.format, dictionaryId: entry.id })

  const unlink = () => patchItem({ ...dataItem, dictionaryId: undefined })

  const handleEntryCreated = (entry: CanonicalDataEntry) => {
    upsertDataDictionaryEntry(entry)
    linkToEntry(entry)
    setCreatingSeed(null)
  }

  // "🖥 Ubicación exacta en el sistema" — vive A NIVEL DE ESTE DATO, no del
  // paso: cada dato puede estar en un sistema distinto (ej: RFC en SAP,
  // antigüedad en otro sistema). Solo aparece si el origen implica sistema.
  const showSystemLocation = isSystemOrigin(dataItem.origin)
  const sysLoc = dataItem.systemLocation
  const catalogEntry = useSystemEntry(sysLoc?.sistema)
  const isSuiteSystem = useIsSuiteSystem(sysLoc?.sistema)
  const modulos = catalogEntry?.modulos ?? []
  const transacciones = catalogEntry?.transacciones ?? []

  const updateSystemLocation = (patch: Partial<DataSystemLocation>) =>
    patchItem({ ...dataItem, systemLocation: { ...(sysLoc ?? emptyDataSystemLocation()), ...patch } })

  // "🎯 Agente de Enriquecimiento de Campos SAP" — solo aplica cuando el
  // sistema capturado es SAP y ya se escribió un nombre técnico de campo
  // (ej. "KLIMK"). El backend cachea en SQL (global para campos estándar,
  // por engagement para campos custom "Z*"), así que la primera consulta
  // puede tardar (Bing) pero las siguientes son instantáneas.
  const isSapSystem = Boolean(sysLoc?.sistema?.trim().toLowerCase().includes('sap'))
  const [sapEnrichLoading, setSapEnrichLoading] = useState(false)
  const [sapEnrichError, setSapEnrichError] = useState<string | null>(null)
  const [sapEnrichResult, setSapEnrichResult] = useState<SapFieldEnrichmentDto | null>(null)

  const handleEnrichSapField = async (forceRefresh: boolean) => {
    const fieldName = sysLoc?.campoTecnico?.trim()
    if (!fieldName) {
      setSapEnrichError('Escribe primero el nombre técnico del campo.')
      return
    }
    setSapEnrichLoading(true)
    setSapEnrichError(null)
    try {
      const result = await enrichSapField(fieldName, getActiveEngagementId(), forceRefresh)
      setSapEnrichResult(result)
    } catch {
      setSapEnrichError('No se pudo enriquecer el campo. Verifica que el agente esté configurado en el backend.')
    } finally {
      setSapEnrichLoading(false)
    }
  }

  // Dueño del dato — persona (no solo un rol genérico) responsable de
  // definir nombre/formato/reglas de este dato específico.
  const owner = dataItem.dataOwner
  const updateOwner = (patch: Partial<DataOwner>) =>
    patchItem({ ...dataItem, dataOwner: { ...(owner ?? emptyDataOwner()), ...patch } })

  return (
    <Card variant="outlined" sx={{ borderRadius: 2, borderColor: 'primary.main' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap',
          p: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
        }}
      >
        <Typography sx={{ fontWeight: 700 }}>{dataItem.name.trim() || `Dato ${index + 1}`}</Typography>
        {linkedEntry && (
          <Chip
            size="small"
            icon={<MenuBookRoundedIcon sx={{ fontSize: '14px !important' }} />}
            label="Vinculado al diccionario"
            color="primary"
            variant="outlined"
          />
        )}
        {dataItem.rules.length > 0 && (
          <Chip size="small" label={`${dataItem.rules.length} regla${dataItem.rules.length === 1 ? '' : 's'}`} />
        )}
        {undocumentedCount > 0 && (
          <Chip
            size="small"
            icon={<WarningAmberRoundedIcon sx={{ fontSize: '14px !important' }} />}
            label="No documentada"
            color="warning"
          />
        )}
        {complianceCount > 0 && (
          <Chip
            size="small"
            icon={<LockRoundedIcon sx={{ fontSize: '14px !important' }} />}
            label="Compliance"
            sx={{ bgcolor: 'rgba(43, 111, 245, 0.16)', color: '#2B6FF5', fontWeight: 700 }}
          />
        )}
        {sysLoc?.sistema && (
          <Chip size="small" label={`🖥 ${sysLoc.sistema}${sysLoc.transaccionCodigo ? ` · ${sysLoc.transaccionCodigo}` : ''}`} />
        )}
        {sysLoc?.viaAPI && <Chip size="small" variant="outlined" label={`🔌 ${apiAvailabilityMeta(sysLoc.viaAPI).label}`} />}
        {owner?.nombre && (
          <Chip size="small" variant="outlined" label={`👤 ${owner.nombre} ${owner.apellidoPaterno}`.trim()} />
        )}
        <Box sx={{ flexGrow: 1 }} />
        <IconButton size="small" onClick={() => onDelete(dataItem.id)} aria-label="Eliminar dato">
          <DeleteOutlineRoundedIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={onClose} aria-label="Cerrar detalle">
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 2, maxHeight: 640, overflowY: 'auto' }}>
        <Autocomplete<CanonicalDataEntry, false, false, true>
          freeSolo
          size="small"
          options={dictionaryEntries}
          getOptionLabel={(option) => (typeof option === 'string' ? option : option.officialName)}
          filterOptions={(options, state) => {
            const q = state.inputValue.trim().toLowerCase()
            if (!q) return options
            return options.filter(
              (o) => o.officialName.toLowerCase().includes(q) || o.synonyms.some((s) => s.toLowerCase().includes(q)),
            )
          }}
          inputValue={dataItem.name}
          onInputChange={(_, value, reason) => {
            if (reason === 'input') patchItem({ ...dataItem, name: value, dictionaryId: undefined })
          }}
          onChange={(_, value) => {
            if (value && typeof value !== 'string') linkToEntry(value)
          }}
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              <Box>
                <Typography variant="body2">{option.officialName}</Typography>
                {option.synonyms.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    {option.synonyms.join(', ')}
                  </Typography>
                )}
              </Box>
            </li>
          )}
          renderInput={(params) => (
            <TextField {...params} label="Nombre del dato (buscar en el diccionario)" placeholder='Ej: "RFC", "Número de empleado"' />
          )}
        />

        {linkedEntry ? (
          <Chip
            size="small"
            icon={<MenuBookRoundedIcon sx={{ fontSize: '14px !important' }} />}
            label={`Vinculado a "${linkedEntry.officialName}" del diccionario`}
            onDelete={unlink}
            sx={{ alignSelf: 'flex-start' }}
          />
        ) : (
          <Button
            size="small"
            variant="text"
            startIcon={<AddRoundedIcon />}
            onClick={() => setCreatingSeed(dataItem.name)}
            sx={{ alignSelf: 'flex-start' }}
          >
            Crear nuevo dato en diccionario
          </Button>
        )}

        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ minHeight: 36, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Tab label="General" sx={{ minHeight: 36, py: 0.5 }} />
          <Tab label={`🖥 Sistema${sysLoc?.sistema ? ` · ${sysLoc.sistema}` : ''}`} sx={{ minHeight: 36, py: 0.5 }} />
          <Tab
            label={`Reglas${dataItem.rules.length > 0 ? ` (${dataItem.rules.length})` : ''}`}
            sx={{ minHeight: 36, py: 0.5 }}
          />
        </Tabs>

        {activeTab === 0 && (
        <>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            p: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'action.hover',
          }}
        >
          <Typography variant="overline" color="text.secondary">
            Dueño del dato (responsable)
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              sx={{ flex: '1 1 160px' }}
              label="Nombre"
              value={owner?.nombre ?? ''}
              onChange={(e) => updateOwner({ nombre: e.target.value })}
            />
            <TextField
              size="small"
              sx={{ flex: '1 1 160px' }}
              label="Apellido paterno"
              value={owner?.apellidoPaterno ?? ''}
              onChange={(e) => updateOwner({ apellidoPaterno: e.target.value })}
            />
            <TextField
              size="small"
              sx={{ flex: '1 1 160px' }}
              label="Apellido materno"
              value={owner?.apellidoMaterno ?? ''}
              onChange={(e) => updateOwner({ apellidoMaterno: e.target.value })}
            />
          </Box>
          <SelectWithOther
            label="Departamento"
            options={DEPARTAMENTOS}
            value={owner?.departamento ?? ''}
            onChange={(v) => updateOwner({ departamento: v })}
          />
        </Box>

        <TextField
          select
          size="small"
          label="Origen del dato"
          value={dataItem.origin}
          onChange={(e) => patchItem({ ...dataItem, origin: e.target.value })}
        >
          {DATA_ORIGINS.map((opt) => (
            <MenuItem key={opt} value={opt}>
              {opt}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          size="small"
          label="Formato esperado"
          placeholder='Ej: "13 caracteres", "número", "fecha DD/MM/AAAA"'
          value={dataItem.format}
          onChange={(e) => patchItem({ ...dataItem, format: e.target.value })}
        />
        </>
        )}

        {activeTab === 1 && (
        !showSystemLocation ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>
            Esta sección solo aplica cuando el "Origen del dato" (pestaña General) es un sistema. Cambia el origen para
            capturar aquí la ubicación exacta (sistema, transacción, campo técnico, etc.).
          </Typography>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              p: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'action.hover',
            }}
          >
            <Typography variant="overline" color="text.secondary">
              🖥 Ubicación exacta en el sistema
            </Typography>
            <Autocomplete
              size="small"
              freeSolo
              options={systemOptions}
              value={sysLoc?.sistema ?? ''}
              onChange={(_, v) => updateSystemLocation({ sistema: v ?? '' })}
              onInputChange={(_, v) => updateSystemLocation({ sistema: v })}
              onBlur={() => {
                const name = sysLoc?.sistema?.trim()
                if (name && !systemOptions.includes(name)) onAddCustomSystem(name)
              }}
              renderInput={(params) => (
                <TextField {...params} label="Sistema" helperText="¿No está en la lista? Escribe el nombre y se agrega solo." />
              )}
            />
            {isSuiteSystem && (
              <Autocomplete
                size="small"
                freeSolo
                options={modulos}
                inputValue={sysLoc?.modulo ?? ''}
                onInputChange={(_, v) => updateSystemLocation({ modulo: v })}
                onBlur={() => sysLoc?.sistema && addModuloToSystem(sysLoc.sistema, sysLoc.modulo ?? '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Módulo / Área"
                    placeholder='Ej: "SD (Ventas)"'
                    helperText="Lista de ejemplo, no exhaustiva. Si tu módulo no aparece, escríbelo y se guarda para la próxima vez."
                  />
                )}
              />
            )}

            {sysLoc?.sistema && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  p: 1.25,
                  border: '1px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, flexGrow: 1 }}>
                    🔌 ¿Tiene API "{sysLoc.sistema}"? — dato GLOBAL del sistema (no de este campo): se define una sola vez
                    y aplica a todos los pasos/datos que usen este sistema.
                  </Typography>
                  <Chip
                    size="small"
                    variant="outlined"
                    label={catalogEntry?.tieneAPI ? `Sí${catalogEntry?.tipoAPI ? ` · ${catalogEntry.tipoAPI}` : ''}` : 'No capturado todavía'}
                  />
                  <Button
                    size="small"
                    variant="text"
                    endIcon={<OpenInNewRoundedIcon sx={{ fontSize: 14 }} />}
                    onClick={() => setApiInfoOpen((v) => !v)}
                  >
                    {apiInfoOpen ? 'Ocultar' : 'Editar'}
                  </Button>
                </Box>
                <Collapse in={apiInfoOpen}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, pt: 0.5 }}>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                      <TextField
                        select
                        size="small"
                        label="¿Este sistema tiene API?"
                        sx={{ minWidth: 180 }}
                        value={catalogEntry?.tieneAPI ? 'si' : 'no'}
                        onChange={(e) => setSystemApiInfo(sysLoc.sistema, { tieneAPI: e.target.value === 'si' })}
                      >
                        <MenuItem value="si">Sí</MenuItem>
                        <MenuItem value="no">No / No sé todavía</MenuItem>
                      </TextField>
                      {catalogEntry?.tieneAPI && (
                        <Box sx={{ minWidth: 200 }}>
                          <SelectWithOther
                            label="Tipo de API"
                            options={API_TYPES}
                            value={catalogEntry?.tipoAPI ?? ''}
                            onChange={(v) => setSystemApiInfo(sysLoc.sistema, { tipoAPI: v })}
                          />
                        </Box>
                      )}
                    </Box>
                    {catalogEntry?.tieneAPI && (
                      <TextField
                        size="small"
                        label="Notas de la API del sistema"
                        placeholder='Ej: "BAPIs estándar (VA01→BAPI_SALESORDER_CREATEFROMDAT2), OData Gateway"'
                        helperText='Texto libre: nombres de BAPIs/endpoints que YA CONOCES o hayas confirmado (ej. con TI del cliente). No inventes nombres de API que no existan — si no lo sabes, déjalo vacío o escribe "por confirmar".'
                        value={catalogEntry?.notasAPI ?? ''}
                        onChange={(e) => setSystemApiInfo(sysLoc.sistema, { notasAPI: e.target.value })}
                      />
                    )}
                    <Typography variant="caption" color="text.secondary">
                      ✅ Se guarda automáticamente en el{' '}
                      <Box component="span" sx={{ fontWeight: 700 }}>
                        Catálogo de Sistemas
                      </Box>{' '}
                      — también puedes editarlo{' '}
                      <Box
                        component="button"
                        type="button"
                        onClick={() => navigate('/catalogo-sistemas')}
                        sx={{
                          border: 'none',
                          bgcolor: 'transparent',
                          color: 'primary.main',
                          cursor: 'pointer',
                          p: 0,
                          font: 'inherit',
                          textDecoration: 'underline',
                        }}
                      >
                        ahí directamente
                      </Box>
                      .
                    </Typography>
                  </Box>
                </Collapse>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Autocomplete
                size="small"
                freeSolo
                sx={{ flex: '1 1 160px' }}
                options={transacciones.map((t) => t.codigo).filter(Boolean)}
                inputValue={sysLoc?.transaccionCodigo ?? ''}
                onInputChange={(_, v) => updateSystemLocation({ transaccionCodigo: v })}
                onChange={(_, v) => {
                  const match = transacciones.find((t) => t.codigo === v)
                  if (match) updateSystemLocation({ transaccionCodigo: match.codigo, transaccionNombre: match.nombre })
                }}
                onBlur={() =>
                  sysLoc?.sistema &&
                  addTransaccionToSystem(sysLoc.sistema, {
                    codigo: sysLoc.transaccionCodigo ?? '',
                    nombre: sysLoc.transaccionNombre ?? '',
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Transacción / Código"
                    placeholder='Ej: "VA01"'
                    helperText="Código de la transacción/pantalla donde vive este dato. Si viene de una captura de pantalla, ya se llenó solo — todos los campos de esa misma captura comparten el mismo valor."
                  />
                )}
              />
              <Autocomplete
                size="small"
                freeSolo
                sx={{ flex: '1 1 200px' }}
                options={transacciones.map((t) => t.nombre).filter(Boolean)}
                inputValue={sysLoc?.transaccionNombre ?? ''}
                onInputChange={(_, v) => updateSystemLocation({ transaccionNombre: v })}
                onChange={(_, v) => {
                  const match = transacciones.find((t) => t.nombre === v)
                  if (match) updateSystemLocation({ transaccionCodigo: match.codigo, transaccionNombre: match.nombre })
                }}
                onBlur={() =>
                  sysLoc?.sistema &&
                  addTransaccionToSystem(sysLoc.sistema, {
                    codigo: sysLoc.transaccionCodigo ?? '',
                    nombre: sysLoc.transaccionNombre ?? '',
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Nombre de pantalla"
                    placeholder='Ej: "Crear pedido de ventas"'
                    helperText="Nombre legible de esa misma pantalla/transacción (ej. el título que aparece arriba en el sistema)."
                  />
                )}
              />
            </Box>
            <TextField
              size="small"
              label="Nombre del campo en pantalla"
              placeholder='Ej: "Solicitante", "Importe neto"'
              value={sysLoc?.campoPantalla ?? ''}
              onChange={(e) => updateSystemLocation({ campoPantalla: e.target.value })}
            />
            <TextField
              size="small"
              label="Nombre técnico del campo"
              placeholder='Ej: "KUNNR", "NETWR"'
              value={sysLoc?.campoTecnico ?? ''}
              onChange={(e) => {
                updateSystemLocation({ campoTecnico: e.target.value })
                setSapEnrichResult(null)
                setSapEnrichError(null)
              }}
            />
            {isSapSystem && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    color="primary"
                    onClick={() => handleEnrichSapField(false)}
                    disabled={sapEnrichLoading}
                    startIcon={sapEnrichLoading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeRoundedIcon />}
                  >
                    Enriquecer con IA
                  </Button>
                  {sapEnrichResult && (
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => handleEnrichSapField(true)}
                      disabled={sapEnrichLoading}
                    >
                      🔄 Volver a enriquecer
                    </Button>
                  )}
                </Box>
                {sapEnrichError && (
                  <Alert severity="error" onClose={() => setSapEnrichError(null)}>
                    {sapEnrichError}
                  </Alert>
                )}
                {sapEnrichResult && (
                  <Card
                    variant="outlined"
                    sx={{ p: 1.25, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 0.5, bgcolor: 'primary.50' }}
                  >
                    <Typography variant="body2">{sapEnrichResult.descripcion}</Typography>
                    {sapEnrichResult.formato && (
                      <Typography variant="caption" color="text.secondary">
                        Formato: {sapEnrichResult.formato}
                      </Typography>
                    )}
                    {sapEnrichResult.reglaNegocio && (
                      <Typography variant="caption" color="text.secondary">
                        Regla de negocio: {sapEnrichResult.reglaNegocio}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      {sapEnrichResult.encontradoEnGrounding
                        ? `Fuente: ${sapEnrichResult.fuenteGrounding}`
                        : 'No se encontró información pública (esperable para campos custom "Z*") — revisa/completa manualmente.'}
                      {sapEnrichResult.fromCache ? ' · desde caché' : ''}
                    </Typography>
                    {sapEnrichResult.formato && (
                      <Box>
                        <Button size="small" onClick={() => patchItem({ ...dataItem, format: sapEnrichResult.formato })}>
                          Usar como formato esperado
                        </Button>
                      </Box>
                    )}
                  </Card>
                )}
              </Box>
            )}
            <TextField
              select
              size="small"
              label="Acción sobre el campo"
              value={sysLoc?.accion ?? ''}
              onChange={(e) => updateSystemLocation({ accion: e.target.value as SystemFieldAction })}
            >
              {SYSTEM_FIELD_ACTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="¿Un Agente de IA podría hacer esto vía API?"
              value={sysLoc?.viaAPI ?? ''}
              onChange={(e) => updateSystemLocation({ viaAPI: e.target.value as ApiAvailability })}
              helperText="Específico de ESTA transacción/pantalla (puede diferir de la API general del sistema, arriba)."
            >
              {API_AVAILABILITY_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              label="Notas sobre automatización vía API"
              placeholder='Ej: "Falta exponer el campo X en el endpoint", "requiere aprobación manual antes de llamar la API"'
              helperText='Específico de ESTE campo/transacción — ej. si falta o no algo en el endpoint que ya existe. No inventes, si no lo sabes déjalo vacío.'
              value={sysLoc?.notasViaAPI ?? ''}
              onChange={(e) => updateSystemLocation({ notasViaAPI: e.target.value })}
            />
          </Box>
        )
        )}

        {activeTab === 2 && (
        <>
        <Typography variant="overline" color="text.secondary" sx={{ mt: 1 }}>
          Reglas de negocio de este dato
        </Typography>
        {dataItem.rules.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Este dato todavía no tiene reglas de negocio.
          </Typography>
        )}
        {dataItem.rules.map((rule) => (
          <BusinessRuleEditor
            key={rule.id}
            rule={rule}
            onChange={(patch) => updateRule(rule.id, patch)}
            onDelete={() => removeRule(rule.id)}
          />
        ))}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" size="small" startIcon={<AddRoundedIcon />} onClick={addRule}>
            Agregar regla a este dato
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="primary"
            onClick={handleSuggestRules}
            disabled={aiRulesLoading}
            startIcon={aiRulesLoading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeRoundedIcon />}
          >
            Sugerir reglas con IA
          </Button>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Reglas genéricas (ej. "no puede ser posterior a hoy", "máximo 14 caracteres") que pueden cambiar según el
          sistema/paso donde se capture este dato — revisa y agrega solo las que apliquen aquí.
        </Typography>
        {aiRulesError && (
          <Alert severity="error" onClose={() => setAiRulesError(null)}>
            {aiRulesError}
          </Alert>
        )}
        {aiRuleSuggestions && aiRuleSuggestions.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Sin más sugerencias pendientes.
          </Typography>
        )}
        {aiRuleSuggestions?.map((rule, i) => (
          <Card
            key={i}
            variant="outlined"
            sx={{ p: 1.25, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'primary.50' }}
          >
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2">{rule.description}</Typography>
              {(rule.owner || rule.source) && (
                <Typography variant="caption" color="text.secondary">
                  {[rule.owner, rule.source].filter(Boolean).join(' · ')}
                </Typography>
              )}
            </Box>
            <Button size="small" onClick={() => applySuggestedRule(rule)}>
              Agregar
            </Button>
          </Card>
        ))}
        </>
        )}
      </Box>

      {creatingSeed !== null && (
        <DataDictionaryEntryDialog
          open
          seedName={creatingSeed}
          onClose={() => setCreatingSeed(null)}
          onSave={handleEntryCreated}
        />
      )}
    </Card>
  )
}

// Fila compacta de la lista de "📥 Datos que procesamos en este paso" — solo
// nombre + chips resumen + eliminar; al hacer clic selecciona el dato para
// verlo/editarlo en el panel de detalle (DataItemDetailPanel) de al lado.
// Memoizada: con 25+ datos (típico tras "📸 Extraer campos desde captura de
// pantalla") es la pieza que se repite muchas veces, así que debe ser
// barata de re-renderizar.
const DataItemRow = memo(function DataItemRow({
  dataItem,
  index,
  selected,
  onSelect,
  onDelete,
}: {
  dataItem: StepDataItem
  index: number
  selected: boolean
  onSelect: () => void
  onDelete: (id: string) => void
}) {
  const dictionaryEntries = useDataDictionaryEntries()
  const linkedEntry = dataItem.dictionaryId ? dictionaryEntries.find((e) => e.id === dataItem.dictionaryId) : undefined
  const undocumentedCount = dataItem.rules.filter(isTribalRisk).length
  const sysLoc = dataItem.systemLocation
  const owner = dataItem.dataOwner

  return (
    <Card
      variant="outlined"
      onClick={onSelect}
      sx={{
        p: 1.25,
        borderRadius: 2,
        cursor: 'pointer',
        borderColor: selected ? 'primary.main' : 'divider',
        bgcolor: selected ? 'action.selected' : 'background.paper',
        '&:hover': { borderColor: 'primary.main' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
        <Typography variant="body2" sx={{ fontWeight: 700, flexGrow: 1 }}>
          {dataItem.name.trim() || `Dato ${index + 1}`}
        </Typography>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(dataItem.id)
          }}
          aria-label="Eliminar dato"
        >
          <DeleteOutlineRoundedIcon fontSize="small" />
        </IconButton>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
        {sysLoc?.sistema && (
          <Chip size="small" variant="outlined" label={`🖥 ${sysLoc.sistema}${sysLoc.transaccionCodigo ? ` · ${sysLoc.transaccionCodigo}` : ''}`} sx={{ height: 20 }} />
        )}
        {linkedEntry && (
          <Chip size="small" color="primary" variant="outlined" label="📚 Vinculado" sx={{ height: 20 }} />
        )}
        {dataItem.rules.length > 0 && (
          <Chip size="small" label={`${dataItem.rules.length} regla${dataItem.rules.length === 1 ? '' : 's'}`} sx={{ height: 20 }} />
        )}
        {undocumentedCount > 0 && (
          <Chip size="small" color="warning" label="No documentada" sx={{ height: 20 }} />
        )}
        {owner?.nombre && <Chip size="small" variant="outlined" label={`👤 ${owner.nombre}`} sx={{ height: 20 }} />}
      </Box>
    </Card>
  )
})

// "📄 Fuentes no estructuradas" — contenido crudo (email, llamada,
// documento, ley...) del que a veces se extraen datos, distinto del bloque
// de datos YA estructurados (DataItemCard arriba). Deliberadamente más
// simple: tipo + descripción + campos condicionales (origen/asunto/
// adjuntos, según fuenteCamposExtra) + texto de ejemplo (etiqueta dinámica
// vía ejemploContenidoLabel) + notas.
const FuenteNoEstructuradaCard = ({
  fuente,
  index,
  activityId,
  stepContext,
  onEnsureActivityId,
  onChange,
  onDelete,
}: {
  fuente: FuenteNoEstructurada
  index: number
  /** ID real del ProcessActivity (🪜 Paso) en el backend, SI ya existe (el
   * paso ya se guardó antes). Puede venir undefined — en ese caso, al subir
   * un archivo se crea automáticamente vía `onEnsureActivityId` sin pedirle
   * al usuario que guarde el paso manualmente primero. */
  activityId?: string
  /** Nombre del paso actual (ej. "Aprobación de crédito") — se usa como
   * `context` al dar de alta/vincular un dato extraído en el 📚 Diccionario
   * de Datos, para no fusionar ciegamente nombres genéricos que significan
   * cosas distintas en procesos distintos (mismo criterio que
   * `findOrRegisterDictionaryEntry`). */
  stepContext: string
  /** Crea (o reutiliza) el ProcessActivity real en el backend bajo demanda —
   * se llama justo antes de subir un PDF si `activityId` todavía no existe,
   * para que "Subir PDF" nunca esté bloqueado esperando un guardado manual. */
  onEnsureActivityId: () => Promise<string | undefined>
  onChange: (updated: FuenteNoEstructurada) => void
  onDelete: () => void
}) => {
  const tipoMeta = FUENTE_NO_ESTRUCTURADA_TIPOS.find((t) => t.value === fuente.tipo)
  const camposExtra = fuenteCamposExtra(fuente.tipo)
  const [nuevoAdjunto, setNuevoAdjunto] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStep, setUploadStep] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)
  // Datos extraídos del PDF (por `key`) que el usuario ya envió al 📚
  // Diccionario de Datos con el botón "Usar en Diccionario" — solo estado de
  // UI (no se persiste) para mostrar el chip "✓ En diccionario" y evitar
  // crear representaciones duplicadas con clics repetidos.
  const [linkedDataKeys, setLinkedDataKeys] = useState<Set<string>>(new Set())

  // Mapea el tipo de fuente local al InteractionChannel real del backend
  // (enum fijo: Email/WhatsApp/Slack/Teams/Phone/InPerson/EnterpriseSystem/Other).
  const channelForTipo = (): string => {
    switch (fuente.tipo) {
      case 'email':
        return 'Email'
      case 'whatsapp':
        return 'WhatsApp'
      case 'llamada':
        return 'Phone'
      default:
        return 'Other'
    }
  }

  const handleUploadClick = () => {
    if (uploading) return
    fileInputRef.current?.click()
  }

  const handleFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // permite volver a seleccionar el mismo archivo
    if (!file) return

    if (file.type !== 'application/pdf') {
      setUploadError('El archivo debe ser un PDF.')
      return
    }

    setUploading(true)
    setUploadError(null)
    setUploadStep('')
    try {
      let realActivityId = activityId
      if (!realActivityId) {
        setUploadStep('Guardando paso…')
        realActivityId = await onEnsureActivityId()
        if (!realActivityId) {
          throw new Error('No se pudo guardar el paso en el backend. Intenta de nuevo.')
        }
      }

      let sourceId = fuente.backendInteractionId
      if (!sourceId) {
        try {
          const interaction = await createActivityInteraction(realActivityId, {
            sequenceOrder: index + 1,
            channel: channelForTipo(),
            contentExample: fuente.ejemploContenido,
          })
          sourceId = interaction.id
        } catch (createErr: any) {
          // Si ya existe una interacción con ese orden (ej. un intento previo
          // que creó la interacción pero falló después, antes de que
          // guardáramos backendInteractionId localmente), reutilizamos la
          // que ya existe en el backend en vez de fallar.
          if (createErr?.response?.status === 409) {
            const existentes = await listActivityInteractions(realActivityId)
            const existente = existentes.find((i) => i.sequenceOrder === index + 1)
            if (!existente) throw createErr
            sourceId = existente.id
          } else {
            throw createErr
          }
        }
        // Guardamos el ID real de inmediato — si la subida del PDF falla
        // después, un reintento reutilizará esta interacción en vez de
        // intentar crear otra con el mismo orden (lo que causaba el error
        // "Ya existe una interacción con ese orden en este paso").
        onChange({ ...fuente, backendInteractionId: sourceId })
      }

      const result = await uploadSourceDocument(realActivityId, sourceId, file, setUploadStep)

      onChange({
        ...fuente,
        backendInteractionId: sourceId,
        extraction: {
          id: result.id,
          fileName: result.fileName,
          pageCount: result.pageCount,
          executiveSummary: result.executiveSummary ?? undefined,
          contentDescription: result.contentDescription ?? undefined,
          extractedDataCount: result.extractedData.length,
          entitiesCount: result.entities.length,
          extractedData: result.extractedData.map((d) => ({ key: d.key, value: d.value, dataType: d.dataType })),
          businessRules: result.businessRules.map((r) => ({ name: r.name, description: r.description })),
          relationships: result.relationships.map((r) => ({
            fromNode: r.fromNode,
            relationType: r.relationType,
            toNode: r.toNode,
          })),
          extractedAt: result.extractedAt ?? undefined,
        },
      })
    } catch (err: any) {
      setUploadError(err?.response?.data?.error ?? err?.message ?? 'No se pudo procesar el documento.')
    } finally {
      setUploading(false)
    }
  }

  const addAdjunto = () => {
    const value = nuevoAdjunto.trim()
    if (!value) return
    onChange({ ...fuente, adjuntos: [...(fuente.adjuntos ?? []), value] })
    setNuevoAdjunto('')
  }

  const removeAdjunto = (i: number) =>
    onChange({ ...fuente, adjuntos: (fuente.adjuntos ?? []).filter((_, idx) => idx !== i) })

  // "string"/"number"/"date"/"currency"/"boolean"/"identifier" (ver
  // DocumentExtractionAgent.ExtractedDataPoint.DataType en el backend) →
  // CanonicalDataType del 📚 Diccionario de Datos.
  const mapExtractedDataTypeToCanonical = (dataType: string): CanonicalDataType => {
    switch (dataType.toLowerCase()) {
      case 'number':
        return 'numero'
      case 'date':
        return 'fecha'
      case 'currency':
        return 'monto'
      case 'boolean':
        return 'booleano'
      case 'identifier':
        return 'identificador'
      default:
        return 'texto'
    }
  }

  // Botón "➕ Usar en Diccionario" de la tabla de datos extraídos del PDF —
  // mismo criterio de búsqueda/fusión que `findOrRegisterDictionaryEntry`
  // (usado por la extracción de capturas de pantalla): busca por nombre
  // oficial o sinónimo, respetando `context` (nombre del paso) para no
  // fusionar ciegamente nombres genéricos que significan cosas distintas en
  // procesos distintos; si existe, solo agrega esta fuente como una
  // representación más (si no estaba ya); si no existe, la da de alta con
  // el tipo de dato que ya detectó la IA.
  const handleUseExtractedDataInDictionary = (dato: { key: string; value: string; dataType: string }) => {
    const normalizedName = dato.key.trim().toLowerCase()
    const context = stepContext.trim()
    const normalizedContext = context.toLowerCase()
    const existing = getDataDictionaryEntries().find((e) => {
      const nameMatches =
        e.officialName.trim().toLowerCase() === normalizedName ||
        e.synonyms.some((s) => s.trim().toLowerCase() === normalizedName)
      if (!nameMatches) return false
      const entryContext = e.context.trim().toLowerCase()
      return !entryContext || entryContext === normalizedContext
    })

    const representation: DataRepresentation = {
      id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      system: fuente.extraction?.fileName ?? 'Documento subido',
      fieldName: dato.key,
      screenOrTable: '',
    }

    if (existing) {
      const alreadyRepresented = existing.representations.some(
        (r) => r.system.trim().toLowerCase() === representation.system.trim().toLowerCase() && r.fieldName === representation.fieldName,
      )
      if (!alreadyRepresented) {
        upsertDataDictionaryEntry({ ...existing, representations: [...existing.representations, representation] })
      }
    } else {
      const newEntry: CanonicalDataEntry = {
        ...emptyDataDictionaryEntry(dato.key, context),
        dataType: mapExtractedDataTypeToCanonical(dato.dataType),
        representations: [representation],
      }
      upsertDataDictionaryEntry(newEntry)
    }
    setLinkedDataKeys((prev) => new Set(prev).add(dato.key))
  }

  return (
    <Accordion disableGutters variant="outlined" sx={{ borderRadius: 2, '&:before': { display: 'none' } }}>
      <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', width: '100%', pr: 1 }}>
          <Typography sx={{ fontWeight: 700 }}>
            {tipoMeta ? `${tipoMeta.emoji} ` : ''}
            {fuente.descripcion.trim() || fuente.asunto?.trim() || `Fuente ${index + 1}`}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            aria-label="Eliminar fuente"
          >
            <DeleteOutlineRoundedIcon fontSize="small" />
          </IconButton>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <TextField
            select
            size="small"
            label="Tipo"
            sx={{ minWidth: 160 }}
            value={fuente.tipo}
            onChange={(e) => onChange({ ...fuente, tipo: e.target.value as FuenteNoEstructurada['tipo'] })}
          >
            {FUENTE_NO_ESTRUCTURADA_TIPOS.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.emoji} {t.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            required
            sx={{ flex: '1 1 240px' }}
            label="Descripción"
            value={fuente.descripcion}
            onChange={(e) => onChange({ ...fuente, descripcion: e.target.value })}
          />
          <TextField
            size="small"
            sx={{ flex: '1 1 160px' }}
            label="Formato (opcional)"
            placeholder="ej. texto plano, audio transcrito"
            value={fuente.formato ?? ''}
            onChange={(e) => onChange({ ...fuente, formato: e.target.value })}
          />
        </Box>

        {/* 📎 Documento de esta fuente — flujo guiado e intuitivo:
            1) ¿Tienes el archivo? → botón de subida bien visible.
            2) Al subirlo, extraemos sus datos con IA (DocumentExtractionAgent)
               y los guardamos aquí mismo, en esta Fuente.
            3) Si NO tienes el archivo a la mano todavía, puedes simplemente
               anotar su nombre (lista de texto, opcional, secundaria) —
               claramente separada de "subir" para no confundir ambas cosas. */}
        {camposExtra.adjuntos && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              p: 1.5,
              border: '1px solid',
              borderColor: fuente.extraction ? 'success.main' : 'primary.main',
              borderRadius: 2,
              bgcolor: (theme) =>
                alpha(fuente.extraction ? theme.palette.success.main : theme.palette.primary.main, 0.06),
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              📎 ¿Esta fuente trae un documento (PDF)?
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Puede ser un PDF adjunto a un correo, o simplemente un archivo que tengas en tu computadora. Súbelo y
              extraemos automáticamente sus datos — quedan guardados aquí, en esta fuente.
            </Typography>

            <input ref={fileInputRef} type="file" accept="application/pdf" hidden onChange={handleFileSelected} />

            {!fuente.extraction && (
              <Button
                variant="contained"
                startIcon={<UploadFileRoundedIcon />}
                disabled={uploading}
                onClick={handleUploadClick}
                sx={{ alignSelf: 'flex-start' }}
              >
                {uploading ? uploadStep || 'Leyendo PDF…' : 'Subir PDF y extraer datos con IA'}
              </Button>
            )}

            {uploading && <LinearProgress />}
            {uploadError && <Alert severity="error">{uploadError}</Alert>}

            {fuente.extraction && (
              <Stack spacing={0.75}>
                <Alert severity="success" sx={{ py: 0.5 }}>
                  ✅ {fuente.extraction.fileName} — {fuente.extraction.pageCount} página
                  {fuente.extraction.pageCount === 1 ? '' : 's'} · {fuente.extraction.extractedDataCount} dato
                  {fuente.extraction.extractedDataCount === 1 ? '' : 's'} · {fuente.extraction.entitiesCount} entidad
                  {fuente.extraction.entitiesCount === 1 ? '' : 'es'} · {fuente.extraction.businessRules.length} regla
                  {fuente.extraction.businessRules.length === 1 ? '' : 's'} de negocio extraídos y guardados en esta
                  fuente
                </Alert>
                {fuente.extraction.executiveSummary && (
                  <Typography variant="body2" color="text.secondary">
                    {fuente.extraction.executiveSummary}
                  </Typography>
                )}

                {fuente.extraction.extractedData.length > 0 && (
                  <Accordion disableGutters elevation={0} sx={{ bgcolor: 'transparent', '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={{ px: 0, minHeight: 32 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        📊 Ver datos extraídos ({fuente.extraction.extractedData.length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 0, pt: 0 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Valor</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Formato</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>📚 Diccionario</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {fuente.extraction.extractedData.map((dato, i) => (
                            <TableRow key={i}>
                              <TableCell>{dato.key}</TableCell>
                              <TableCell>{dato.value}</TableCell>
                              <TableCell>
                                <Chip size="small" variant="outlined" label={dato.dataType} />
                              </TableCell>
                              <TableCell>
                                {linkedDataKeys.has(dato.key) ? (
                                  <Chip size="small" color="success" variant="outlined" label="✓ En diccionario" />
                                ) : (
                                  <Button size="small" variant="text" onClick={() => handleUseExtractedDataInDictionary(dato)}>
                                    ➕ Usar en Diccionario
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </AccordionDetails>
                  </Accordion>
                )}

                {(fuente.extraction.businessRules.length > 0 || fuente.extraction.relationships.length > 0) && (
                  <Accordion disableGutters elevation={0} sx={{ bgcolor: 'transparent', '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={{ px: 0, minHeight: 32 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        📐 Ver reglas de negocio y grafo de relaciones ({fuente.extraction.businessRules.length} reglas
                        · {fuente.extraction.relationships.length} relaciones)
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 0, pt: 0 }}>
                      {fuente.extraction.businessRules.length > 0 && (
                        <Box sx={{ mb: 1.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            Reglas de negocio
                          </Typography>
                          <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                            {fuente.extraction.businessRules.map((rule, i) => (
                              <Typography key={i} variant="caption" color="text.secondary">
                                • <b>{rule.name}:</b> {rule.description}
                              </Typography>
                            ))}
                          </Stack>
                        </Box>
                      )}
                      {fuente.extraction.relationships.length > 0 && (
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            Grafo de relaciones
                          </Typography>
                          <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
                            {fuente.extraction.relationships.map((rel, i) => (
                              <Chip
                                key={i}
                                size="small"
                                variant="outlined"
                                label={`${rel.fromNode} → ${rel.relationType} → ${rel.toNode}`}
                              />
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                )}

                <Button
                  size="small"
                  variant="text"
                  startIcon={<UploadFileRoundedIcon />}
                  disabled={uploading}
                  onClick={handleUploadClick}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  {uploading ? uploadStep || 'Leyendo PDF…' : 'Subir otra versión'}
                </Button>
              </Stack>
            )}

            {!fuente.extraction && (
              <Accordion
                disableGutters
                elevation={0}
                sx={{ bgcolor: 'transparent', '&:before': { display: 'none' }, mt: 0.5 }}
              >
                <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={{ px: 0, minHeight: 32 }}>
                  <Typography variant="caption" color="text.secondary">
                    ¿Todavía no tienes el archivo a la mano? Anota solo su nombre por ahora
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 0, pt: 0 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                      size="small"
                      sx={{ flex: '1 1 240px' }}
                      label="Nombre del archivo (ej. Estados financieros.pdf)"
                      value={nuevoAdjunto}
                      onChange={(e) => setNuevoAdjunto(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addAdjunto()
                        }
                      }}
                    />
                    <Button size="small" variant="outlined" onClick={addAdjunto}>
                      Agregar
                    </Button>
                  </Box>
                  {(fuente.adjuntos ?? []).length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.75 }}>
                      {(fuente.adjuntos ?? []).map((adjunto, i) => (
                        <Chip key={`${adjunto}-${i}`} size="small" label={adjunto} onDelete={() => removeAdjunto(i)} />
                      ))}
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            )}
          </Box>
        )}

        {(camposExtra.origen || camposExtra.asunto) && (
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            {camposExtra.origen && (
              <SelectWithOther
                label={fuente.tipo === 'llamada' ? 'Origen (quién llama)' : 'Origen (rol de quién la envía)'}
                options={PUESTOS}
                value={fuente.origen ?? ''}
                onChange={(v) => onChange({ ...fuente, origen: v })}
              />
            )}
            {camposExtra.asunto && (
              <TextField
                size="small"
                sx={{ flex: '1 1 220px' }}
                label="Asunto"
                placeholder="ej. Solicitud de alta de proveedor"
                value={fuente.asunto ?? ''}
                onChange={(e) => onChange({ ...fuente, asunto: e.target.value })}
              />
            )}
          </Box>
        )}

        <TextField
          size="small"
          multiline
          minRows={3}
          label={ejemploContenidoLabel(fuente.tipo)}
          value={fuente.ejemploContenido ?? ''}
          onChange={(e) => onChange({ ...fuente, ejemploContenido: e.target.value })}
        />
        <TextField
          size="small"
          multiline
          minRows={2}
          label="Notas"
          value={fuente.notas ?? ''}
          onChange={(e) => onChange({ ...fuente, notas: e.target.value })}
        />
      </AccordionDetails>
    </Accordion>
  )
}

// /deep-dive/:processId/paso/:stepId (o /paso/nuevo) — CAPTURA / EDICIÓN de
// UN paso, con espacio completo para el formulario (datos, ubicación en
// sistema, reglas, tiempos, potencial IA...). La vista general del proceso
// (tarjetas + grafo) vive por separado en ProcessOverviewPage.
export const StepCapturePage = () => {
  const navigate = useNavigate()
  const { processId, stepId } = useParams<{ processId: string; stepId: string }>()
  const process = useDeepDiveProcess(processId)
  const engagementId = getActiveEngagementId()

  const isNewStep = stepId === 'nuevo'
  const existingStep = process && !isNewStep ? process.steps.find((s) => s.id === stepId) : undefined

  const [draft, setDraft] = useState<ProcessStepRecord | null>(() => {
    if (!process) return null
    if (isNewStep) return emptyDraft(process.steps.length + 1)
    return existingStep ? { ...existingStep } : null
  })
  // Sistemas agregados en esta sesión vía "+ Agregar" — se suman al
  // catálogo base §SISTEMAS mientras dura la sesión (fácil de persistir
  // luego a un catálogo real de backend).
  const [customSystems, setCustomSystems] = useState<string[]>([])
  // Unidad en la que se CAPTURA/muestra la espera (min/horas/días) — solo
  // de UI: lo que se persiste en draft.tiempos.tiempoEsperaMin siempre está
  // normalizado a minutos (Cambio 4.3 del pedido).
  const [esperaUnidad, setEsperaUnidad] = useState<UnidadTiempo>('min')

  // "Vincular con backend real" — necesario para poder subir documentos
  // (DocumentExtractionAgent exige un ProcessActivity/ActivityInteraction
  // reales). Este DeepDiveProcess sigue siendo un draft local; solo cuando
  // el asesor elige la Capacidad dueña se crea el BusinessProcess real una
  // única vez (linkProcessToBackend guarda el vínculo para siempre).
  const [capabilities, setCapabilities] = useState<CapabilityDto[]>([])
  const [linkCapabilityId, setLinkCapabilityId] = useState('')
  const [linking, setLinking] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)
  // "➕ Crear capacidad" inline (sin redirigir) — ver InlineCapabilityDialog.
  const [capabilityDialogOpen, setCapabilityDialogOpen] = useState(false)

  // "📸 Extraer campos desde captura de pantalla" — ver
  // SystemScreenshotExtractionDialog.
  const [screenshotDialogOpen, setScreenshotDialogOpen] = useState(false)
  // Dato seleccionado en la lista compacta de "📥 Datos que procesamos en
  // este paso" — solo ESE se muestra en el panel de detalle (ver
  // DataItemDetailPanel/DataItemRow).
  const [selectedDataItemId, setSelectedDataItemId] = useState<string | null>(null)

  // Wizard de 4 etapas — modo CREAR (isNewStep) navega guiado ①→②→③→④ con
  // Siguiente/Atrás y solo permite saltar en el stepper a etapas ya
  // alcanzadas (maxReachedStage); modo EDITAR es libre (tabs sueltas, se
  // puede saltar a cualquier etapa desde el inicio).
  const [activeStage, setActiveStage] = useState(0)
  const [maxReachedStage, setMaxReachedStage] = useState(isNewStep ? 0 : WIZARD_STAGES.length - 1)
  // Etapa ③ (tipo "comunicacion") — antes Canal/Dirección/Remitente,
  // Fuentes y Datos iban todos apilados verticalmente en un solo bloque
  // largo; ahora viven en 3 pestañas separadas para no confundir con un
  // muro de campos + tarjetas de fuente + lista de datos todo junto.
  const [comunicacionSubTab, setComunicacionSubTab] = useState(0)
  // Solo se muestran errores de validación de la Etapa ① después de un
  // primer intento fallido de avanzar — no antes, para no abrumar al FDE.
  const [stage1Touched, setStage1Touched] = useState(false)

  useEffect(() => {
    if (!engagementId || process?.backendProcessId) return
    listCapabilities(engagementId)
      .then(setCapabilities)
      .catch(() => setCapabilities([]))
  }, [engagementId, process?.backendProcessId])

  const handleLinkToBackend = async () => {
    if (!process || !engagementId || !linkCapabilityId) return
    setLinking(true)
    setLinkError(null)
    try {
      let backendProcessId: string
      try {
        const created = await createProcess(engagementId, { ...emptyProcessForm(linkCapabilityId), name: process.name })
        backendProcessId = created.id
      } catch (createErr: any) {
        // 409: ya existe un BusinessProcess con ese nombre en esta capacidad
        // — típicamente porque un vínculo anterior en esta MISMA sesión ya
        // lo creó, pero el store en memoria (deepDiveStore) se reinició
        // (recarga de página / HMR) y perdió la referencia local. En vez de
        // fallar, reutilizamos el proceso real ya existente en el backend.
        if (createErr?.response?.status !== 409) throw createErr
        const existing = await listProcesses(engagementId)
        const match = existing.find((p) => p.name === process.name && p.capabilityId === linkCapabilityId)
        if (!match) throw createErr
        backendProcessId = match.id
      }
      linkProcessToBackend(process.id, linkCapabilityId, backendProcessId)
    } catch (err: any) {
      setLinkError(err?.response?.data?.error ?? 'No se pudo vincular el proceso con el backend.')
    } finally {
      setLinking(false)
    }
  }

  // Recuperación best-effort: si este paso ya tiene un backendActivityId
  // real pero el store en memoria (deepDiveStore) perdió sus
  // fuentesNoEstructuradas — por ejemplo, un reinicio del store ANTES de
  // que existiera la persistencia en localStorage, o en cualquier
  // navegador/perfil donde localStorage no esté disponible — reconstruye
  // cada Fuente + su extracción ya completada consultando directamente al
  // backend (ActivityInteractions + DocumentExtractions), que SIEMPRE
  // conservan los datos reales aunque el frontend los "olvide".
  useEffect(() => {
    const activityId = draft?.backendActivityId
    if (!activityId || !process) return
    let cancelled = false
    ;(async () => {
      try {
        const interactions = await listActivityInteractions(activityId)
        const existingIds = new Set(
          (draft?.fuentesNoEstructuradas ?? []).map((f) => f.backendInteractionId).filter(Boolean),
        )
        const missing = interactions.filter((i) => !existingIds.has(i.id))
        if (missing.length === 0) return

        const recovered: FuenteNoEstructurada[] = []
        for (const interaction of missing) {
          if (cancelled) return
          const documents = await listSourceDocuments(activityId, interaction.id)
          const completed = documents.find((d) => d.extractionStatus === 'Procesado')
          if (!completed) continue
          recovered.push({
            ...emptyFuenteNoEstructurada(),
            tipo: 'pdf',
            descripcion: completed.contentDescription ?? completed.fileName,
            adjuntos: [completed.fileName],
            backendInteractionId: interaction.id,
            extraction: {
              id: completed.id,
              fileName: completed.fileName,
              pageCount: completed.pageCount,
              executiveSummary: completed.executiveSummary ?? undefined,
              contentDescription: completed.contentDescription ?? undefined,
              extractedDataCount: completed.extractedData.length,
              entitiesCount: completed.entities.length,
              extractedData: completed.extractedData.map((d) => ({ key: d.key, value: d.value, dataType: d.dataType })),
              businessRules: completed.businessRules.map((r) => ({ name: r.name, description: r.description })),
              relationships: completed.relationships.map((r) => ({
                fromNode: r.fromNode,
                relationType: r.relationType,
                toNode: r.toNode,
              })),
              extractedAt: completed.extractedAt ?? undefined,
            },
          })
        }
        if (cancelled || recovered.length === 0) return

        setDraft((prev) => {
          if (!prev) return prev
          const merged = { ...prev, fuentesNoEstructuradas: [...(prev.fuentesNoEstructuradas ?? []), ...recovered] }
          upsertProcessStep(process.id, merged)
          return merged
        })
      } catch {
        // Best-effort — si falla, "Agregar fuente" sigue funcionando normalmente.
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.backendActivityId])

  if (!process) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="text.secondary">Proceso no encontrado.</Typography>
        <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/deep-dive')} sx={{ mt: 2 }}>
          Volver a procesos
        </Button>
      </Box>
    )
  }

  if (draft === null) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="text.secondary">Paso no encontrado.</Typography>
        <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate(`/deep-dive/${processId}`)} sx={{ mt: 2 }}>
          Volver al proceso
        </Button>
      </Box>
    )
  }

  const isValid = draft.name.trim() !== '' && draft.iaPotential !== '' && draft.tiempos.tiempoActivoMin > 0
  const isEditingExisting = process.steps.some((s) => s.id === draft.id)

  const handleCancel = () => navigate(`/deep-dive/${processId}`)

  // Crea/actualiza el ProcessActivity real (🪜 Paso) en el backend, best-effort
  // (si el proceso todavía no está vinculado a un BusinessProcess real, o la
  // llamada falla, el paso se guarda igual localmente — solo no tendrá
  // activityId real hasta la próxima vez). Necesario para que "Subir PDF" en
  // sus fuentes tenga un activityId verdadero.
  const syncActivityToBackend = async (
    step: ProcessStepRecord,
    backendProcessIdOverride?: string,
    // rethrow: true — usado desde ensureActivityId (disparado por "Subir PDF"),
    // donde SÍ necesitamos que el error real (servidor caído, 500, etc.) llegue
    // hasta el usuario en vez de fallar en silencio con un backendActivityId
    // ausente que después se traducía en un mensaje genérico y engañoso
    // ("verifica que tenga nombre") sin relación con la causa real.
    options?: { rethrow?: boolean },
  ): Promise<ProcessStepRecord> => {
    const backendProcessId = backendProcessIdOverride ?? process.backendProcessId
    if (!backendProcessId) return step
    try {
      if (step.backendActivityId) {
        await updateProcessActivity(step.backendActivityId, { sequenceOrder: step.order, name: step.name })
        return step
      }
      try {
        const created = await createProcessActivity(backendProcessId, {
          sequenceOrder: step.order,
          name: step.name,
        })
        return { ...step, backendActivityId: created.id }
      } catch (createErr: any) {
        // 409: ya existe un ProcessActivity con ese orden en este proceso —
        // típicamente porque el store en memoria se reinició (recarga de
        // página / HMR) y perdió la referencia local a uno ya creado antes
        // en esta misma sesión. Reutilizamos el real ya existente.
        if (createErr?.response?.status !== 409) throw createErr
        const existing = await listProcessActivities(backendProcessId)
        const match = existing.find((a) => a.sequenceOrder === step.order)
        if (!match) throw createErr
        await updateProcessActivity(match.id, { sequenceOrder: step.order, name: step.name })
        return { ...step, backendActivityId: match.id }
      }
    } catch (err) {
      console.error('No se pudo sincronizar el paso con el backend', err)
      if (options?.rethrow) throw err
      return step
    }
  }

  // Vincula el proceso a una Capacidad de negocio real de forma AUTOMÁTICA y
  // transparente (sin pedirle al usuario que elija una manualmente) —
  // reutiliza una Capacidad existente con el mismo nombre del proceso, o crea
  // una nueva (renombrable/reclasificable después desde Madurez → Capacidades).
  // Necesario porque BusinessProcess.CapabilityId es una FK real obligatoria
  // en el backend; el usuario no debería tener que entender ese detalle de
  // modelo solo para subir un PDF.
  const ensureProcessLinkedToBackend = async (): Promise<string | undefined> => {
    if (process.backendProcessId) return process.backendProcessId
    if (!engagementId) {
      // Causa real más común de "no se pudo guardar el paso": no hay una
      // empresa/engagement activo seleccionado (ver TopInfoBar — "Sin
      // empresa" / "Sin engagement"), así que no hay dónde crear la
      // Capacidad/Proceso real. Antes esto devolvía `undefined` en
      // silencio y terminaba mostrando el mensaje genérico "verifica que
      // tenga nombre", que no tiene nada que ver con el problema real.
      throw new Error(
        'No hay una empresa/engagement activo seleccionado (arriba, en la barra superior). Selecciona uno antes de subir un documento.',
      )
    }

    const existingCaps = await listCapabilities(engagementId)
    let capability = existingCaps.find((c) => c.name.trim().toLowerCase() === process.name.trim().toLowerCase())
    if (!capability) {
      capability = await createCapability(engagementId, {
        ...emptyCapabilityForm(),
        name: process.name,
        businessDomain: 'Operaciones',
      })
    }
    setCapabilities((prev) => (prev.some((c) => c.id === capability!.id) ? prev : [...prev, capability!]))

    let backendProcessId: string
    try {
      const created = await createProcess(engagementId, { ...emptyProcessForm(capability.id), name: process.name })
      backendProcessId = created.id
    } catch (createErr: any) {
      if (createErr?.response?.status !== 409) throw createErr
      const existingProcesses = await listProcesses(engagementId)
      const match = existingProcesses.find((p) => p.name === process.name && p.capabilityId === capability!.id)
      if (!match) throw createErr
      backendProcessId = match.id
    }
    linkProcessToBackend(process.id, capability.id, backendProcessId)
    return backendProcessId
  }

  // Crea el ProcessActivity real bajo demanda, SIN esperar a que el usuario le
  // dé clic manualmente a "Guardar paso" — se usa desde "Subir PDF" en una
  // fuente para que esa acción nunca quede bloqueada por un guardado manual
  // previo (vincula el proceso a una Capacidad si hace falta, de paso).
  const ensureActivityId = async (): Promise<string | undefined> => {
    if (draft.backendActivityId) return draft.backendActivityId
    if (!processId) return undefined

    // Se deja propagar el error tal cual (en vez de envolverlo en un mensaje
    // genérico) — así el usuario ve la causa real ("no hay engagement
    // activo", el error real del backend, etc.) en vez de un mensaje
    // engañoso que siempre culpaba al nombre del paso.
    const backendProcessId = await ensureProcessLinkedToBackend()
    if (!backendProcessId) return undefined

    const synced = await syncActivityToBackend(draft, backendProcessId, { rethrow: true })
    if (!synced.backendActivityId) {
      throw new Error('El backend no devolvió un ID de paso válido. Intenta de nuevo.')
    }
    setDraft(synced)
    upsertProcessStep(processId, synced)
    return synced.backendActivityId
  }

  const handleSave = async () => {
    if (!isValid || !processId) return
    const synced = await syncActivityToBackend(draft)
    upsertProcessStep(processId, synced)
    navigate(`/deep-dive/${processId}`)
  }

  const handleSaveAndAddAnother = async () => {
    if (!isValid || !processId) return
    const synced = await syncActivityToBackend(draft)
    upsertProcessStep(processId, synced)
    const nextOrder = process.steps.length + (isEditingExisting ? 1 : 2)
    setDraft(emptyDraft(nextOrder))
    navigate(`/deep-dive/${processId}/paso/nuevo`, { replace: true })
  }

  // Memoizado (solo cambia cuando customSystems cambia, no en cada tecla) —
  // se pasa como prop a cada DataItemCard memoizado; si fuera un array nuevo
  // en cada render de este componente, rompería el memo de las 60+ tarjetas.
  const systemOptions = useMemo(() => [...SISTEMAS, ...customSystems], [customSystems])
  const addCustomSystem = useCallback((name: string) => {
    setCustomSystems((prev) => (prev.includes(name) || SISTEMAS.includes(name) ? prev : [...prev, name]))
  }, [])

  // Nivel DATO — "📥 Datos que procesamos en este paso". updateDataItem/
  // removeDataItem usan la forma funcional de setDraft (sin depender de
  // `draft`) para que su identidad sea ESTABLE entre renders — se pasan
  // DIRECTAMENTE como onChange/onDelete a cada DataItemCard memoizado en vez
  // de envolverlas en un closure nuevo por tarjeta en cada render.
  const addDataItem = () => {
    const item = emptyDataItem()
    setDraft({ ...draft, stepData: [...(draft.stepData ?? []), item] })
    setSelectedDataItemId(item.id)
  }

  const updateDataItem = useCallback(
    (id: string, updated: StepDataItem) =>
      setDraft((prev) => ({ ...prev, stepData: (prev.stepData ?? []).map((d) => (d.id === id ? updated : d)) })),
    [],
  )

  const removeDataItem = useCallback((id: string) => {
    setDraft((prev) => ({ ...prev, stepData: (prev.stepData ?? []).filter((d) => d.id !== id) }))
    setSelectedDataItemId((prev) => (prev === id ? null : prev))
  }, [])

  // "📸 Extraer campos desde captura de pantalla" → "📚 Diccionario de Datos
  // del Negocio": busca si YA existe un dato canónico con ese nombre oficial
  // o sinónimo; si existe, lo VINCULA (dictionaryId) y agrega esta pantalla/
  // sistema como una representación más (si no estaba ya registrada); si NO
  // existe, lo DA DE ALTA automáticamente con la descripción/formato/regla
  // de negocio que propuso la IA — así el diccionario se puebla solo en vez
  // de depender de que alguien lo llene a mano campo por campo.
  // Busca (o crea) la entrada del diccionario para un campo extraído.
  // `context` = nombre del PASO actual (ej. "Aprobación de crédito") — se
  // usa para NO fusionar ciegamente nombres genéricos ("Priority", "Status",
  // "Category") que en realidad significan cosas distintas en procesos
  // distintos: solo se reutiliza una entrada existente si su `context` está
  // vacío (dato verdaderamente global, ej. "RFC") o coincide con el
  // contexto actual; si el nombre coincide pero el contexto es OTRO no
  // vacío, se crea una entrada NUEVA con el contexto actual en vez de
  // mezclarla con la existente.
  const findOrRegisterDictionaryEntry = (field: SystemFieldCandidateDto, systemName: string, context: string): string => {
    const normalizedName = field.nombreCampo.trim().toLowerCase()
    const normalizedContext = context.trim().toLowerCase()
    const existing = getDataDictionaryEntries().find((e) => {
      const nameMatches =
        e.officialName.trim().toLowerCase() === normalizedName ||
        e.synonyms.some((s) => s.trim().toLowerCase() === normalizedName)
      if (!nameMatches) return false
      const entryContext = e.context.trim().toLowerCase()
      return !entryContext || entryContext === normalizedContext
    })

    const representation: DataRepresentation = {
      id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      system: systemName,
      fieldName: field.campoTecnico || field.nombreCampo,
      screenOrTable: '',
    }

    if (existing) {
      const alreadyRepresented = existing.representations.some(
        (r) => r.system.trim().toLowerCase() === systemName.trim().toLowerCase() && r.fieldName === representation.fieldName,
      )
      if (!alreadyRepresented && systemName.trim()) {
        upsertDataDictionaryEntry({ ...existing, representations: [...existing.representations, representation] })
      }
      return existing.id
    }

    const newEntry: CanonicalDataEntry = {
      ...emptyDataDictionaryEntry(field.nombreCampo, context),
      description: field.descripcion,
      format: field.formato,
      representations: systemName.trim() ? [representation] : [],
      globalRules: field.reglaNegocio.trim()
        ? [
            {
              ...emptyRule(),
              description: field.reglaNegocio,
              origin: 'IA — extracción de captura de pantalla (Bing Grounding)',
              source: field.fuenteGrounding,
              isDocumented: field.encontradoEnGrounding,
            },
          ]
        : [],
    }
    upsertDataDictionaryEntry(newEntry)
    return newEntry.id
  }

  // "📸 Extraer campos desde captura de pantalla" — al aceptar campos
  // propuestos por SystemScreenshotExtractionDialog, se crea UN nuevo
  // StepDataItem por cada campo aceptado, con su "🖥 Ubicación exacta en el
  // sistema" pre-llenada (campoPantalla/campoTecnico/accion) y vinculado (o
  // dado de alta) en el diccionario de datos. "Origen del dato" y "Uso en
  // pantalla" (accion: lee/captura/modifica/valida) ya NO se asumen fijos —
  // se derivan de lo que el agente de visión infirió para cada campo. La
  // descripción y regla de negocio de la IA también se agregan como reglas
  // de negocio propias del dato en ESTE paso (además de quedar en el
  // diccionario), siempre marcadas con su origen para que quede claro que
  // son una propuesta a revisar.
  const addExtractedDataItems = (
    fields: SystemFieldCandidateDto[],
    systemName: string,
    transaccionCodigo: string,
    transaccionNombre: string,
  ) => {
    const newItems: StepDataItem[] = fields.map((field) => {
      const rules: BusinessRule[] = []
      if (field.descripcion.trim()) {
        rules.push({
          ...emptyRule(),
          description: field.descripcion,
          origin: 'IA — extracción de captura de pantalla',
          source: field.encontradoEnGrounding ? field.fuenteGrounding : 'Propuesta por IA (visión), sin fundamentar aún',
          isDocumented: field.encontradoEnGrounding,
        })
      }
      if (field.reglaNegocio.trim()) {
        rules.push({
          ...emptyRule(),
          description: field.reglaNegocio,
          origin: 'IA — extracción de captura de pantalla (Bing Grounding)',
          source: field.fuenteGrounding,
          isDocumented: field.encontradoEnGrounding,
        })
      }

      const accion: SystemFieldAction = SYSTEM_FIELD_ACTIONS.some((a) => a.value === field.accion)
        ? (field.accion as SystemFieldAction)
        : 'captura'
      const origin = accion === 'lee' || accion === 'valida' ? 'Se consulta en sistema' : 'Se captura en sistema'
      const dictionaryId = findOrRegisterDictionaryEntry(field, systemName, draft.name)

      return {
        ...emptyDataItem(),
        name: field.nombreCampo,
        origin,
        format: field.formato,
        rules,
        dictionaryId,
        systemLocation: {
          ...emptyDataSystemLocation(),
          sistema: systemName,
          transaccionCodigo,
          transaccionNombre,
          campoPantalla: field.nombreCampo,
          campoTecnico: field.campoTecnico,
          accion,
        },
      }
    })

    if (newItems.length > 0) {
      addCustomSystem(systemName)
      setSelectedDataItemId((prev) => prev ?? newItems[0].id)
    }
    if (transaccionCodigo || transaccionNombre) {
      addTransaccionToSystem(systemName, { codigo: transaccionCodigo, nombre: transaccionNombre })
    }
    setDraft({ ...draft, stepData: [...(draft.stepData ?? []), ...newItems] })
  }

  // "📄 Fuentes no estructuradas" — nivel PASO, no por dato (ver
  // FuenteNoEstructurada en deepDiveStore.ts). El tipo por default se
  // adapta al tipo de acción de la Etapa ② (Cambio del wizard).
  const addFuente = () => {
    const defaultTipo = draft.actionType === 'llamada' ? 'llamada' : draft.actionType === 'documento' ? 'documento' : 'email'
    setDraft({
      ...draft,
      fuentesNoEstructuradas: [...(draft.fuentesNoEstructuradas ?? []), { ...emptyFuenteNoEstructurada(), tipo: defaultTipo }],
    })
  }

  const updateFuente = (index: number, updated: FuenteNoEstructurada) =>
    setDraft({
      ...draft,
      fuentesNoEstructuradas: (draft.fuentesNoEstructuradas ?? []).map((f, i) => (i === index ? updated : f)),
    })

  const removeFuente = (index: number) =>
    setDraft({
      ...draft,
      fuentesNoEstructuradas: (draft.fuentesNoEstructuradas ?? []).filter((_, i) => i !== index),
    })

  // Nivel PASO — "📋 Reglas a nivel del PASO completo".
  const addStepRule = () => setDraft({ ...draft, stepRules: [...(draft.stepRules ?? []), emptyRule()] })

  const updateStepRule = (id: string, patch: Partial<BusinessRule>) =>
    setDraft({
      ...draft,
      stepRules: (draft.stepRules ?? []).map((r) => (r.id === id ? { ...r, ...patch } : r)),
    })

  const removeStepRule = (id: string) =>
    setDraft({ ...draft, stepRules: (draft.stepRules ?? []).filter((r) => r.id !== id) })

  // Contador "Este paso: X datos · Y reglas (Z no documentadas)".
  const draftDataItems = draft.stepData ?? []
  const draftFuentes = draft.fuentesNoEstructuradas ?? []
  const draftAllRules = collectStepRules(draft)
  const draftUndocumentedCount = draftAllRules.filter(isTribalRisk).length

  // --- Wizard de 4 etapas ---
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const stage1Valid = draft.name.trim() !== '' && draft.tiempos.tiempoActivoMin > 0 && draft.iaPotential !== ''
  // Modo EDITAR (paso ya existente): tabs libres, se puede saltar a
  // cualquier etapa. Modo CREAR: wizard guiado ①→②→③→④.
  const freeNavigation = isEditingExisting
  // Una etapa se marca "completada" (check ✓) solo si ya fue superada en el
  // recorrido (guiado) o si el paso ya existe y se está editando (donde el
  // dato de todas las etapas ya está presente de antemano) — nunca se
  // muestra un check en una etapa futura todavía no visitada.
  const stageCompleted = WIZARD_STAGES.map((_, idx) => {
    if (freeNavigation) return idx !== activeStage
    if (idx === 0) return stage1Valid && activeStage > 0
    return idx < maxReachedStage
  })
  const currentStage = WIZARD_STAGES[activeStage]
  const stageColor = wizardStageColor(currentStage.key, isDark)

  const handleNext = () => {
    if (activeStage === 0 && !stage1Valid) {
      setStage1Touched(true)
      return
    }
    const next = Math.min(activeStage + 1, WIZARD_STAGES.length - 1)
    setActiveStage(next)
    setMaxReachedStage((prev) => Math.max(prev, next))
  }

  const handleBack = () => setActiveStage((prev) => Math.max(prev - 1, 0))

  const handleStepperClick = (index: number) => setActiveStage(index)

  const handleCapabilityCreated = (created: CapabilityDto) => {
    setCapabilities((prev) => [...prev, created])
    setLinkCapabilityId(created.id)
    setCapabilityDialogOpen(false)
  }

  // Etapa ③ — bloque "📄 Fuentes no estructuradas" (email/documento/llamada).
  const fuentesBlock = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {draftFuentes.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          Todavía no hay fuentes capturadas para este paso.
        </Typography>
      )}
      {draftFuentes.map((fuente, index) => (
        <FuenteNoEstructuradaCard
          key={fuente.id}
          fuente={fuente}
          index={index}
          activityId={draft.backendActivityId}
          stepContext={draft.name}
          onEnsureActivityId={ensureActivityId}
          onChange={(updated) => updateFuente(index, updated)}
          onDelete={() => removeFuente(index)}
        />
      ))}
      <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={addFuente} sx={{ alignSelf: 'flex-start' }}>
        Agregar fuente
      </Button>
    </Box>
  )

  // Etapa ③ — bloque "📥 Datos que procesamos en este paso" (sistema/SAP y,
  // opcionalmente, datos estructurados extraídos de un email). Lista
  // compacta (izquierda) + panel de detalle del dato seleccionado (derecha)
  // — mismo patrón que 📚 Diccionario de Datos y 🖥 Catálogo de Sistemas, en
  // vez de apilar un Accordion por dato.
  const selectedDataItem = draftDataItems.find((d) => d.id === selectedDataItemId) ?? null

  const datosBlock = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {draftDataItems.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          Todavía no hay datos capturados para este paso.
        </Typography>
      )}
      {draftDataItems.length > 0 && (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Box
            sx={{
              flex: '1 1 280px',
              minWidth: 260,
              maxWidth: 360,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              maxHeight: 660,
              overflowY: 'auto',
              pr: 0.5,
            }}
          >
            {draftDataItems.map((dataItem, index) => (
              <DataItemRow
                key={dataItem.id}
                dataItem={dataItem}
                index={index}
                selected={dataItem.id === selectedDataItemId}
                onSelect={() => setSelectedDataItemId(dataItem.id)}
                onDelete={removeDataItem}
              />
            ))}
          </Box>
          <Box sx={{ flex: '2 1 420px', minWidth: 320 }}>
            {selectedDataItem ? (
              <DataItemDetailPanel
                key={selectedDataItem.id}
                dataItem={selectedDataItem}
                index={draftDataItems.findIndex((d) => d.id === selectedDataItem.id)}
                systemOptions={systemOptions}
                onAddCustomSystem={addCustomSystem}
                onChange={updateDataItem}
                onDelete={removeDataItem}
                onClose={() => setSelectedDataItemId(null)}
              />
            ) : (
              <Card variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2, borderStyle: 'dashed' }}>
                <Typography color="text.secondary">Selecciona un dato de la lista para ver/editar sus detalles.</Typography>
              </Card>
            )}
          </Box>
        </Box>
      )}
      <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={addDataItem} sx={{ alignSelf: 'flex-start' }}>
        Agregar campo / dato
      </Button>
    </Box>
  )

  const stageHeader = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          bgcolor: alpha(stageColor, 0.15),
          color: stageColor,
        }}
      >
        {activeStage + 1}
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 800, color: stageColor }}>
        {currentStage.emoji} {currentStage.label}
      </Typography>
    </Box>
  )

  return (
    <Box sx={{ minHeight: '100%', bgcolor: 'background.default', color: 'text.primary' }}>
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Button
            startIcon={<ArrowBackRoundedIcon />}
            size="small"
            color="inherit"
            onClick={handleCancel}
            sx={{ alignSelf: 'flex-start', color: 'text.secondary', px: 1 }}
          >
            Volver al proceso
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {process.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isEditingExisting ? `Editando paso #${draft.order}` : 'Nuevo paso'}
            {isEditingExisting ? ' · navegación libre entre etapas' : ' · wizard guiado'}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ p: 3, maxWidth: 860, mx: 'auto' }}>
        {/* Stepper de progreso ①─②─③─④ */}
        <Box sx={{ mb: 3 }}>
          <StepWizardStepper
            stages={WIZARD_STAGES}
            activeIndex={activeStage}
            maxReachedIndex={maxReachedStage}
            completed={stageCompleted}
            freeNavigation={freeNavigation}
            onStepClick={handleStepperClick}
          />
        </Box>

        <Card
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
            borderTop: '4px solid',
            borderTopColor: stageColor,
          }}
        >
          <Fade key={activeStage} in timeout={300}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {stageHeader}

              {/* ① BÁSICO — ¿Qué es este paso? */}
              {activeStage === 0 && (
                <>
                  <TextField
                    size="small"
                    label="Nombre del paso"
                    required
                    value={draft.name}
                    error={stage1Touched && draft.name.trim() === ''}
                    helperText={stage1Touched && draft.name.trim() === '' ? 'Campo obligatorio' : ' '}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  />
                  <TextField
                    size="small"
                    label="Descripción"
                    multiline
                    minRows={2}
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  />
                  <SelectWithOther
                    label="Responsable / Puesto"
                    options={PUESTOS}
                    value={draft.responsiblePuesto}
                    onChange={(v) => setDraft({ ...draft, responsiblePuesto: v })}
                  />
                  <TextField
                    size="small"
                    type="number"
                    label={`⏱️ ${tiempoActivoLabel(draft.actionType, draft.channel)}`}
                    required
                    error={stage1Touched && draft.tiempos.tiempoActivoMin <= 0}
                    helperText={stage1Touched && draft.tiempos.tiempoActivoMin <= 0 ? 'Campo obligatorio (mayor a 0)' : ' '}
                    value={draft.tiempos.tiempoActivoMin}
                    onChange={(e) =>
                      setDraft({ ...draft, tiempos: { ...draft.tiempos, tiempoActivoMin: Number(e.target.value) } })
                    }
                  />

                  {/* ⏳ Tiempo en cola — Cambio 2 del pedido original: la
                      etiqueta se adapta según el tipo/canal ya elegidos. */}
                  {(() => {
                    const esperaConfig = tiempoEsperaConfig(draft.actionType, draft.channel, draft.direccion)
                    if (!esperaConfig.show) {
                      return (
                        <Typography variant="caption" color="text.secondary">
                          Sin cola de espera — tú controlas el envío, se asume ≈0.
                        </Typography>
                      )
                    }
                    const valorMostrado =
                      draft.tiempos.tiempoEsperaMin !== undefined
                        ? deMinutos(draft.tiempos.tiempoEsperaMin, esperaUnidad)
                        : ''
                    return (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                          <TextField
                            size="small"
                            type="number"
                            sx={{ flex: '1 1 220px' }}
                            label={`⏳ ${esperaConfig.label}${esperaConfig.optional ? ' (opcional)' : ''}`}
                            value={valorMostrado}
                            onChange={(e) => {
                              const raw = e.target.value
                              setDraft({
                                ...draft,
                                tiempos: {
                                  ...draft.tiempos,
                                  tiempoEsperaMin: raw === '' ? undefined : aMinutos(Number(raw), esperaUnidad),
                                },
                              })
                            }}
                          />
                          <TextField
                            select
                            size="small"
                            label="Unidad"
                            sx={{ minWidth: 120 }}
                            value={esperaUnidad}
                            onChange={(e) => setEsperaUnidad(e.target.value as UnidadTiempo)}
                          >
                            {UNIDADES_TIEMPO.map((u) => (
                              <MenuItem key={u.value} value={u.value}>
                                {u.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Box>
                        {esperaConfig.helperText && (
                          <Typography variant="caption" color={esperaConfig.critical ? 'warning.main' : 'text.secondary'}>
                            {esperaConfig.helperText}
                          </Typography>
                        )}
                      </Box>
                    )
                  })()}

                  <TextField
                    select
                    size="small"
                    label="🤖 Potencial de automatización IA"
                    required
                    error={stage1Touched && draft.iaPotential === ''}
                    helperText={stage1Touched && draft.iaPotential === '' ? 'Campo obligatorio' : ' '}
                    value={draft.iaPotential}
                    onChange={(e) => setDraft({ ...draft, iaPotential: e.target.value as IAPotential })}
                  >
                    {IA_POTENTIAL_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.emoji} {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    size="small"
                    label="Notas"
                    multiline
                    minRows={2}
                    value={draft.notes}
                    onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                  />

                  {/* Vinculación a Capacidad de Negocio — NUNCA bloquea el
                      avance del wizard, solo se avisa al final (Etapa ④) si
                      falta. Necesaria para poder subir PDFs (Etapa ③). */}
                  <Box
                    sx={{
                      p: 2,
                      border: '1px dashed',
                      borderColor: process.backendProcessId ? 'success.main' : 'divider',
                      borderRadius: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.25,
                      bgcolor: (t) =>
                        process.backendProcessId ? alpha(t.palette.success.main, 0.06) : 'action.hover',
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      🔗 Vinculación a Capacidad de Negocio
                    </Typography>
                    {process.backendProcessId ? (
                      <Alert severity="success" sx={{ py: 0.5 }}>
                        Vinculado — ya puedes subir PDFs y extraer datos con IA en la Etapa ③.
                      </Alert>
                    ) : (
                      <>
                        <Typography variant="body2" color="text.secondary">
                          Opcional por ahora — necesaria más adelante para subir PDFs y extraer datos con IA.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                          {capabilities.length > 0 && (
                            <TextField
                              select
                              size="small"
                              label="Capacidad dueña"
                              value={linkCapabilityId}
                              onChange={(e) => setLinkCapabilityId(e.target.value)}
                              sx={{ minWidth: 200 }}
                            >
                              {capabilities.map((c) => (
                                <MenuItem key={c.id} value={c.id}>
                                  {c.name}
                                </MenuItem>
                              ))}
                            </TextField>
                          )}
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<AddRoundedIcon />}
                            onClick={() => setCapabilityDialogOpen(true)}
                          >
                            Crear capacidad
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            disabled={!linkCapabilityId || linking}
                            onClick={handleLinkToBackend}
                          >
                            {linking ? 'Vinculando…' : 'Vincular'}
                          </Button>
                        </Box>
                        {linkError && (
                          <Typography variant="caption" color="error">
                            {linkError}
                          </Typography>
                        )}
                      </>
                    )}
                  </Box>
                </>
              )}

              {/* ② TIPO DE ACCIÓN — ¿Qué clase de trabajo es? */}
              {activeStage === 1 && (
                <>
                  <Typography variant="body2" color="text.secondary">
                    Elige una opción — define qué se captura en la Etapa ③ (Datos procesados).
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 2 }}>
                    {WIZARD_ACTION_TYPES.map((opt) => {
                      const optColor = isDark ? opt.colorDark : opt.colorLight
                      const selected = draft.actionType === opt.value
                      return (
                        <ButtonBase
                          key={opt.value}
                          onClick={() => setDraft({ ...draft, actionType: opt.value })}
                          sx={{ borderRadius: 3, display: 'block', textAlign: 'left' }}
                        >
                          <Box
                            sx={{
                              p: 2.5,
                              borderRadius: 3,
                              border: '2px solid',
                              borderColor: selected ? optColor : 'divider',
                              bgcolor: selected ? alpha(optColor, 0.12) : 'background.paper',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 1,
                              transition: 'all 0.2s ease',
                              '&:hover': { borderColor: optColor, boxShadow: 2 },
                            }}
                          >
                            <Typography sx={{ fontSize: '2rem', lineHeight: 1 }}>{opt.emoji}</Typography>
                            <Typography
                              sx={{ fontWeight: 700, textAlign: 'center', color: selected ? optColor : 'text.primary' }}
                            >
                              {opt.label}
                            </Typography>
                          </Box>
                        </ButtonBase>
                      )
                    })}
                  </Box>
                  {!WIZARD_ACTION_TYPES.some((o) => o.value === draft.actionType) && (
                    <Alert severity="info">
                      Este paso usa un tipo heredado del formulario anterior ({actionTypeMeta(draft.actionType).emoji}{' '}
                      {actionTypeMeta(draft.actionType).label}) — puedes dejarlo así o elegir uno de los tipos de arriba.
                    </Alert>
                  )}
                </>
              )}

              {/* ③ DATOS PROCESADOS — se adapta a la acción elegida en ② */}
              {activeStage === 2 && (
                <>
                  {draft.actionType === 'sistema' && (
                    <>
                      <Typography variant="body2" color="text.secondary">
                        Cada dato captura su propio Sistema, Módulo, Transacción y campo técnico — usa
                        "✨ Enriquecer con IA" para que el agente investigue qué es cada campo técnico.
                      </Typography>
                      <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<AutoAwesomeRoundedIcon />}
                        onClick={() => setScreenshotDialogOpen(true)}
                        sx={{ alignSelf: 'flex-start' }}
                      >
                        📸 Extraer campos desde captura de pantalla
                      </Button>
                      {datosBlock}
                    </>
                  )}

                  {draft.actionType === 'comunicacion' && (
                    <>
                      <Tabs
                        value={comunicacionSubTab}
                        onChange={(_, v) => setComunicacionSubTab(v)}
                        sx={{ minHeight: 40, borderBottom: 1, borderColor: 'divider', '& .MuiTab-root': { minHeight: 40, textTransform: 'none', fontWeight: 600 } }}
                      >
                        <Tab label="① Canal y contexto" />
                        <Tab label="② Agrega fuentes" />
                        <Tab label="③ Agrega datos" />
                      </Tabs>

                      {comunicacionSubTab === 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                          <SelectWithOther
                            label="Canal"
                            options={CANALES}
                            value={draft.channel ?? ''}
                            onChange={(v) => setDraft({ ...draft, channel: v })}
                          />
                          {channelNeedsDireccion(draft.channel) && (
                            <TextField
                              select
                              size="small"
                              label="Dirección"
                              value={draft.direccion ?? ''}
                              onChange={(e) => setDraft({ ...draft, direccion: e.target.value as DireccionComunicacion })}
                            >
                              {DIRECCION_OPTIONS.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          )}
                          <SelectWithOther
                            label="Remitente típico (con quién)"
                            options={PUESTOS}
                            value={draft.withWhom ?? ''}
                            onChange={(v) => setDraft({ ...draft, withWhom: v })}
                          />
                        </Box>
                      )}

                      {comunicacionSubTab === 1 && (
                        <Box sx={{ pt: 2 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                            Fuentes (asunto típico, adjuntos esperados)
                          </Typography>
                          {fuentesBlock}
                        </Box>
                      )}

                      {comunicacionSubTab === 2 && (
                        <Box sx={{ pt: 2 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                            Datos estructurados extraídos del mensaje (opcional)
                          </Typography>
                          {datosBlock}
                        </Box>
                      )}
                    </>
                  )}

                  {draft.actionType === 'documento' && (
                    <>
                      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                        <TextField
                          size="small"
                          sx={{ flex: '1 1 220px' }}
                          label="Nombre del documento/dato"
                          value={draft.documentName ?? ''}
                          onChange={(e) => setDraft({ ...draft, documentName: e.target.value })}
                        />
                        <TextField
                          select
                          size="small"
                          sx={{ minWidth: 160 }}
                          label="Acción"
                          value={draft.documentAction ?? ''}
                          onChange={(e) => setDraft({ ...draft, documentAction: e.target.value })}
                        >
                          {DOCUMENT_ACTIONS.map((opt) => (
                            <MenuItem key={opt} value={opt}>
                              {opt}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        📄 Documento de ejemplo — sube un PDF y extrae sus datos con IA
                      </Typography>
                      {fuentesBlock}
                    </>
                  )}

                  {draft.actionType === 'llamada' && (
                    <>
                      <SelectWithOther
                        label="Con quién (origen de la llamada)"
                        options={PUESTOS}
                        value={draft.withWhom ?? ''}
                        onChange={(v) => setDraft({ ...draft, withWhom: v })}
                      />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        📞 Guion / datos que se piden verbalmente y datos que se registran
                      </Typography>
                      {fuentesBlock}
                    </>
                  )}

                  {draft.actionType === 'manual' && (
                    <TextField
                      size="small"
                      label="Descripción libre de qué datos se manejan en este paso manual"
                      multiline
                      minRows={4}
                      placeholder="Ej: se revisa a mano la carpeta física del cliente y se anota el folio en una libreta..."
                      value={draft.manualDataNotes ?? ''}
                      onChange={(e) => setDraft({ ...draft, manualDataNotes: e.target.value })}
                    />
                  )}

                  {/* Tipos heredados (ya no seleccionables desde ②, pero se
                      conservan si un paso viejo los sigue usando). */}
                  {draft.actionType === 'decision' && (
                    <>
                      <SelectWithOther
                        label="Tipo de decisión"
                        options={DECISION_TYPES}
                        value={draft.decisionType ?? ''}
                        onChange={(v) => setDraft({ ...draft, decisionType: v })}
                      />
                      <SelectWithOther
                        label="Quién decide"
                        options={PUESTOS}
                        value={draft.whoDecides ?? ''}
                        onChange={(v) => setDraft({ ...draft, whoDecides: v })}
                      />
                    </>
                  )}
                  {draft.actionType === 'bloqueo' && (
                    <>
                      <SelectWithOther
                        label="Tipo de bloqueo"
                        options={BLOQUEO_TYPES}
                        value={draft.blockType ?? ''}
                        onChange={(v) => setDraft({ ...draft, blockType: v })}
                      />
                      <TextField
                        size="small"
                        label="Tiempo de espera estimado"
                        value={draft.waitTime ?? ''}
                        onChange={(e) => setDraft({ ...draft, waitTime: e.target.value })}
                      />
                    </>
                  )}
                </>
              )}

              {/* ④ REGLAS DEL PASO — reglas de negocio generales + resumen final */}
              {activeStage === 3 && (
                <>
                  {(draft.stepRules ?? []).length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Todavía no hay reglas capturadas a nivel de este paso.
                    </Typography>
                  )}
                  {(draft.stepRules ?? []).map((rule) => (
                    <BusinessRuleEditor
                      key={rule.id}
                      rule={rule}
                      onChange={(patch) => updateStepRule(rule.id, patch)}
                      onDelete={() => removeStepRule(rule.id)}
                    />
                  ))}
                  <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={addStepRule} sx={{ alignSelf: 'flex-start' }}>
                    Agregar regla del paso
                  </Button>

                  <Box
                    sx={{
                      mt: 1,
                      p: 2,
                      borderRadius: 2,
                      bgcolor: (t) => alpha(stageColor, t.palette.mode === 'dark' ? 0.14 : 0.08),
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5,
                    }}
                  >
                    <Typography sx={{ fontWeight: 700 }}>
                      ✅ Resumen: {draftDataItems.length} dato{draftDataItems.length === 1 ? '' : 's'} ·{' '}
                      {draftAllRules.length} regla{draftAllRules.length === 1 ? '' : 's'}
                      {draftAllRules.length > 0 && ` (${draftUndocumentedCount} no documentadas)`}
                    </Typography>
                    {!process.backendProcessId && (
                      <Typography variant="caption" color="warning.main">
                        ⚠️ Todavía no vinculaste una Capacidad de Negocio (Etapa ① Básico) — puedes guardar igual, pero no
                        podrás subir PDFs hasta vincularlo.
                      </Typography>
                    )}
                  </Box>
                </>
              )}
            </Box>
          </Fade>

          {/* Navegación — guiada (Siguiente/Atrás) al crear, libre (Guardar
              siempre visible) al editar. */}
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', flexWrap: 'wrap', pt: 1 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button color="inherit" onClick={handleCancel}>
                Cancelar
              </Button>
              {activeStage > 0 && (
                <Button startIcon={<ArrowBackRoundedIcon />} onClick={handleBack}>
                  Atrás
                </Button>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {!freeNavigation && activeStage < WIZARD_STAGES.length - 1 ? (
                <Button
                  variant="contained"
                  endIcon={<ArrowForwardRoundedIcon />}
                  onClick={handleNext}
                  sx={{ bgcolor: stageColor, '&:hover': { bgcolor: stageColor } }}
                >
                  Siguiente
                </Button>
              ) : (
                <>
                  {isNewStep && (
                    <Button variant="outlined" disabled={!isValid} onClick={handleSaveAndAddAnother}>
                      Guardar y agregar otro paso
                    </Button>
                  )}
                  <Button variant="contained" disabled={!isValid} onClick={handleSave} startIcon={<CheckCircleRoundedIcon />}>
                    Guardar paso
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </Card>
      </Box>

      {engagementId && (
        <InlineCapabilityDialog
          open={capabilityDialogOpen}
          engagementId={engagementId}
          onClose={() => setCapabilityDialogOpen(false)}
          onCreated={handleCapabilityCreated}
        />
      )}

      <SystemScreenshotExtractionDialog
        open={screenshotDialogOpen}
        systemOptions={systemOptions}
        context={draft.name}
        onClose={() => setScreenshotDialogOpen(false)}
        onAccept={addExtractedDataItems}
      />
    </Box>
  )
}
