import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getActiveEngagementId } from '@/shared/hooks/useEmpresaActiva'
import { getOrganizationalReadiness } from '@/modules/madurez/data/readinessApi'
import { MaturityLevel } from '@/modules/madurez/data/pillarsData'
import { DomainConfig, getDomainsForIndustry, SYSTEMS_OPTIONS } from '../data/industriesData'
import {
  DomainAssessmentDto,
  DomainAssessmentRequest,
  getDomainDiscovery,
  saveDomainAssessments,
  saveDomainDiscoveryIndustry,
} from '../data/domainDiscoveryApi'

export interface ProcessInventoryItem {
  id: string
  name: string
  systems: string[]
  painPoint: string
  // Evaluación individual del proceso (mismas 5 dimensiones que el dominio,
  // 1-5) para poder rankear procesos de TODOS los dominios en una sola
  // lista (ver ProcessRankingView). Independiente del score del dominio.
  strategicValue: number | null
  transformPotential: number | null
  roi: number | null
  complexity: number | null
  urgency: number | null
}

export interface DomainAssessmentState {
  domainId: string
  businessContext: string
  processInventory: ProcessInventoryItem[]
  systemsInventory: string[]
  strategicValue: number | null
  transformPotential: number | null
  roi: number | null
  complexity: number | null
  urgency: number | null
  complexityAdjustmentOverride: number | null
}

export type DimensionKey = 'strategicValue' | 'transformPotential' | 'roi' | 'complexity' | 'urgency'

interface InheritedPillarLevels {
  procesos: MaturityLevel | null
  tecnologia: MaturityLevel | null
  datos: MaturityLevel | null
}

const buildEmptyState = (domainId: string): DomainAssessmentState => ({
  domainId,
  businessContext: '',
  processInventory: [],
  systemsInventory: [],
  strategicValue: null,
  transformPotential: null,
  roi: null,
  complexity: null,
  urgency: null,
  complexityAdjustmentOverride: null,
})

const safeParseArray = <T,>(json: string): T[] => {
  try {
    const parsed = JSON.parse(json)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const dtoToState = (dto: DomainAssessmentDto): DomainAssessmentState => ({
  domainId: dto.domainId,
  businessContext: dto.businessContext ?? '',
  processInventory: safeParseArray<ProcessInventoryItem>(dto.processInventoryJson),
  systemsInventory: safeParseArray<string>(dto.systemsInventoryJson),
  strategicValue: dto.strategicValue,
  transformPotential: dto.transformPotential,
  roi: dto.roi,
  complexity: dto.complexity,
  urgency: dto.urgency,
  complexityAdjustmentOverride: dto.complexityAdjustmentOverride,
})

const stateToRequest = (state: DomainAssessmentState): DomainAssessmentRequest => ({
  domainId: state.domainId,
  businessContext: state.businessContext || null,
  processInventoryJson: JSON.stringify(state.processInventory),
  systemsInventoryJson: JSON.stringify(state.systemsInventory),
  strategicValue: state.strategicValue,
  transformPotential: state.transformPotential,
  roi: state.roi,
  complexity: state.complexity,
  urgency: state.urgency,
  complexityAdjustmentOverride: state.complexityAdjustmentOverride,
})

// Ajuste de complejidad heredado de un nivel de madurez de Fase 1: niveles
// bajos (1-2) SUMAN complejidad, niveles altos (3-4) la RESTAN. Nunca
// sobreescribe el criterio humano — solo sugiere un punto de partida
// editable (ver `complexityAdjustmentOverride`).
const pillarAdjustment = (level: MaturityLevel | null): number => {
  switch (level) {
    case 1:
      return 2
    case 2:
      return 1
    case 3:
      return -1
    case 4:
      return -2
    default:
      return 0
  }
}

export const computeAutoAdjustment = (domain: DomainConfig, levels: InheritedPillarLevels): number => {
  let adjustment = pillarAdjustment(levels.procesos)
  if (domain.sensitiveToTecnologia) adjustment += pillarAdjustment(levels.tecnologia)
  if (domain.sensitiveToDatos) adjustment += pillarAdjustment(levels.datos)
  return adjustment
}

export type Quadrant = 'do-now' | 'plan' | 'quick-win' | 'later'

// Forma mínima compartida por DomainAssessmentState y ProcessInventoryItem
// para poder calcular priorityScore/quadrant tanto a nivel dominio como a
// nivel proceso individual con la misma fórmula.
export interface EvaluationDimensions {
  strategicValue: number | null
  transformPotential: number | null
  roi: number | null
  complexity: number | null
  urgency: number | null
  complexityAdjustmentOverride?: number | null
}

// priorityScore = (valor × potencial × roi × urgencia) / complejidad_efectiva,
// normalizado a una escala 0-10 (625 = 5×5×5×5, el máximo numerador posible
// con complejidad_efectiva mínima de 1).
export const computePriorityScore = (values: EvaluationDimensions, autoAdjustment: number): number | null => {
  const { strategicValue, transformPotential, roi, complexity, urgency, complexityAdjustmentOverride } = values
  if (!strategicValue || !transformPotential || !roi || !complexity || !urgency) return null
  const effectiveAdjustment = complexityAdjustmentOverride ?? autoAdjustment
  const effectiveComplexity = Math.max(1, complexity + effectiveAdjustment)
  const raw = strategicValue * transformPotential * roi * urgency
  const normalized = Math.min(10, (raw / effectiveComplexity / 625) * 10)
  return Math.round(normalized * 10) / 10
}

export const computeQuadrant = (values: EvaluationDimensions, autoAdjustment: number): Quadrant | null => {
  const { strategicValue, complexity, complexityAdjustmentOverride } = values
  if (!strategicValue || !complexity) return null
  const effectiveAdjustment = complexityAdjustmentOverride ?? autoAdjustment
  const effectiveComplexity = Math.max(1, complexity + effectiveAdjustment)
  const highValue = strategicValue >= 4
  const highComplexity = effectiveComplexity >= 4
  if (highValue && !highComplexity) return 'do-now'
  if (highValue && highComplexity) return 'plan'
  if (!highValue && !highComplexity) return 'quick-win'
  return 'later'
}

const formatTime = (iso: string | null): string => {
  if (!iso) return 'Sin guardar'
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

const AUTOSAVE_DEBOUNCE_MS = 800

// Estado + autosave (backend SQL real, vía /engagements/{id}/domain-
// discovery) del Paso 2 · Descubrimiento y Priorización de Dominios de
// Negocio. Lee Fase 1 (organizational-readiness) SOLO LECTURA para sugerir
// un ajuste de complejidad heredado por dominio — el humano siempre puede
// sobreescribirlo (`complexityAdjustmentOverride`).
export const useDomainDiscovery = () => {
  const engagementId = getActiveEngagementId()
  const [selectedIndustryId, setSelectedIndustryId] = useState<string | null>(null)
  const [assessments, setAssessments] = useState<Record<string, DomainAssessmentState>>({})
  const [pillarLevels, setPillarLevels] = useState<InheritedPillarLevels>({
    procesos: null,
    tecnologia: null,
    datos: null,
  })
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const hasLoadedRef = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const domains = useMemo(() => getDomainsForIndustry(selectedIndustryId), [selectedIndustryId])

  useEffect(() => {
    let cancelled = false
    if (!engagementId) {
      setLoading(false)
      return
    }
    Promise.all([getDomainDiscovery(engagementId), getOrganizationalReadiness(engagementId)])
      .then(([discovery, readiness]) => {
        if (cancelled) return
        setSelectedIndustryId(discovery.selectedIndustryId)
        const map: Record<string, DomainAssessmentState> = {}
        discovery.domains.forEach((dto) => {
          map[dto.domainId] = dtoToState(dto)
        })
        setAssessments(map)
        const findLevel = (pillarId: string): MaturityLevel | null =>
          readiness.find((r) => r.pillarId === pillarId)?.level ?? null
        setPillarLevels({
          procesos: findLevel('procesos'),
          tecnologia: findLevel('tecnologia'),
          datos: findLevel('datos'),
        })
        const latest = discovery.domains.reduce<string | null>((acc, d) => {
          const ts = d.updatedAt ?? d.createdAt
          return !acc || ts > acc ? ts : acc
        }, null)
        setUpdatedAt(latest)
      })
      .catch((err) => console.error('Error cargando el descubrimiento de dominios de negocio', err))
      .finally(() => {
        if (!cancelled) {
          hasLoadedRef.current = true
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [engagementId])

  // Autosave con debounce hacia SQL (mismo patrón que usePillarAssessment).
  useEffect(() => {
    if (!engagementId || !hasLoadedRef.current) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSaving(true)
      const requests = domains
        .map((d) => assessments[d.id])
        .filter((s): s is DomainAssessmentState => !!s)
        .map(stateToRequest)
      Promise.all([
        saveDomainDiscoveryIndustry(engagementId, selectedIndustryId),
        saveDomainAssessments(engagementId, requests),
      ])
        .then(() => setUpdatedAt(new Date().toISOString()))
        .catch((err) => console.error('Error guardando el descubrimiento de dominios de negocio', err))
        .finally(() => setSaving(false))
    }, AUTOSAVE_DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessments, selectedIndustryId, engagementId])

  const getState = useCallback(
    (domainId: string): DomainAssessmentState => assessments[domainId] ?? buildEmptyState(domainId),
    [assessments],
  )

  const updateAssessment = useCallback(
    (domainId: string, updater: (prev: DomainAssessmentState) => DomainAssessmentState) => {
      setAssessments((prev) => ({ ...prev, [domainId]: updater(prev[domainId] ?? buildEmptyState(domainId)) }))
    },
    [],
  )

  const setBusinessContext = useCallback(
    (domainId: string, text: string) => updateAssessment(domainId, (s) => ({ ...s, businessContext: text })),
    [updateAssessment],
  )

  const toggleSystemChip = useCallback(
    (domainId: string, value: string) =>
      updateAssessment(domainId, (s) => ({
        ...s,
        systemsInventory: s.systemsInventory.includes(value)
          ? s.systemsInventory.filter((v) => v !== value)
          : [...s.systemsInventory, value],
      })),
    [updateAssessment],
  )

  const addProcess = useCallback(
    (domainId: string, name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return
      updateAssessment(domainId, (s) => ({
        ...s,
        processInventory: [
          ...s.processInventory,
          {
            id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`,
            name: trimmed,
            systems: [],
            painPoint: '',
            strategicValue: null,
            transformPotential: null,
            roi: null,
            complexity: null,
            urgency: null,
          },
        ],
      }))
    },
    [updateAssessment],
  )

  const updateProcess = useCallback(
    (domainId: string, processId: string, patch: Partial<ProcessInventoryItem>) =>
      updateAssessment(domainId, (s) => ({
        ...s,
        processInventory: s.processInventory.map((p) => (p.id === processId ? { ...p, ...patch } : p)),
      })),
    [updateAssessment],
  )

  const removeProcess = useCallback(
    (domainId: string, processId: string) =>
      updateAssessment(domainId, (s) => ({
        ...s,
        processInventory: s.processInventory.filter((p) => p.id !== processId),
      })),
    [updateAssessment],
  )

  // Atajo SOLO para pruebas manuales: llena TODO el estado del dominio con
  // datos dummy (contexto de negocio, sistemas, 3 procesos tomados del
  // `typicalProcesses` propio del dominio en industriesData.ts, y las 5
  // dimensiones de evaluación tanto del dominio como de cada proceso) para
  // poder probar guardado end-to-end sin capturar todo a mano cada vez.
  // Respeta lo que ya esté capturado (solo llena lo que esté vacío/null);
  // si el proceso dummy ya existe (ej. agregado por un click anterior) pero
  // le faltan sus 5 dimensiones, las completa en vez de duplicarlo.
  const seedDummyProcesses = useCallback(
    (domain: DomainConfig) => {
      updateAssessment(domain.id, (s) => {
        const dummyProcessNames = domain.typicalProcesses.slice(0, 3)
        const existingByName = new Map(s.processInventory.map((p) => [p.name, p]))
        const processInventory: ProcessInventoryItem[] = [...s.processInventory]

        dummyProcessNames.forEach((name, idx) => {
          const existing = existingByName.get(name)
          if (existing) {
            const needsDims =
              existing.strategicValue == null ||
              existing.transformPotential == null ||
              existing.roi == null ||
              existing.complexity == null ||
              existing.urgency == null
            if (!needsDims) return
            const pos = processInventory.findIndex((p) => p.id === existing.id)
            processInventory[pos] = {
              ...existing,
              strategicValue: existing.strategicValue ?? 3,
              transformPotential: existing.transformPotential ?? 4,
              roi: existing.roi ?? 3,
              complexity: existing.complexity ?? 3,
              urgency: existing.urgency ?? 3,
            }
            return
          }
          processInventory.push({
            id: `${Date.now()}-${idx}-${Math.round(Math.random() * 1e6)}`,
            name,
            systems: [SYSTEMS_OPTIONS[idx % SYSTEMS_OPTIONS.length]],
            painPoint: `[Dummy] Proceso manual/lento, pendiente de levantar detalle real para ${name}.`,
            strategicValue: 3,
            transformPotential: 4,
            roi: 3,
            complexity: 3,
            urgency: 3,
          })
        })

        const dummySystems = SYSTEMS_OPTIONS.slice(0, 2).filter((sys) => !s.systemsInventory.includes(sys))
        return {
          ...s,
          businessContext:
            s.businessContext.trim().length > 0
              ? s.businessContext
              : `[Dummy] ${domain.name} opera de forma mayormente manual, con dependencia de hojas de cálculo y poca integración entre sistemas. Datos de ejemplo para pruebas.`,
          systemsInventory: [...s.systemsInventory, ...dummySystems],
          processInventory,
          strategicValue: s.strategicValue ?? 3,
          transformPotential: s.transformPotential ?? 4,
          roi: s.roi ?? 3,
          complexity: s.complexity ?? 3,
          urgency: s.urgency ?? 3,
        }
      })
    },
    [updateAssessment],
  )

  const setDimension = useCallback(
    (domainId: string, dimension: DimensionKey, value: number) =>
      updateAssessment(domainId, (s) => ({ ...s, [dimension]: value })),
    [updateAssessment],
  )

  const setComplexityOverride = useCallback(
    (domainId: string, value: number | null) =>
      updateAssessment(domainId, (s) => ({ ...s, complexityAdjustmentOverride: value })),
    [updateAssessment],
  )

  const saveNow = useCallback(async () => {
    if (!engagementId) return false
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSaving(true)
    try {
      const requests = domains
        .map((d) => assessments[d.id])
        .filter((s): s is DomainAssessmentState => !!s)
        .map(stateToRequest)
      await Promise.all([
        saveDomainDiscoveryIndustry(engagementId, selectedIndustryId),
        saveDomainAssessments(engagementId, requests),
      ])
      setUpdatedAt(new Date().toISOString())
      return true
    } catch (err) {
      console.error('Error guardando el descubrimiento de dominios de negocio', err)
      return false
    } finally {
      setSaving(false)
    }
  }, [engagementId, domains, assessments, selectedIndustryId])

  const evaluatedDomains = useMemo(
    () =>
      domains.map((domain) => {
        const state = getState(domain.id)
        const autoAdjustment = computeAutoAdjustment(domain, pillarLevels)
        return {
          domain,
          state,
          autoAdjustment,
          effectiveAdjustment: state.complexityAdjustmentOverride ?? autoAdjustment,
          priorityScore: computePriorityScore(state, autoAdjustment),
          quadrant: computeQuadrant(state, autoAdjustment),
        }
      }),
    [domains, getState, pillarLevels],
  )

  const evaluatedCount = evaluatedDomains.filter((d) => d.priorityScore !== null).length

  return {
    selectedIndustryId,
    setSelectedIndustryId,
    domains,
    evaluatedDomains,
    evaluatedCount,
    getState,
    setBusinessContext,
    toggleSystemChip,
    addProcess,
    updateProcess,
    removeProcess,
    seedDummyProcesses,
    setDimension,
    setComplexityOverride,
    saveNow,
    loading,
    saving,
    hasEngagement: !!engagementId,
    hasInheritanceData:
      pillarLevels.procesos !== null || pillarLevels.tecnologia !== null || pillarLevels.datos !== null,
    lastSavedLabel: saving ? 'Guardando…' : formatTime(updatedAt),
  }
}
