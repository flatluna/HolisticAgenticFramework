import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getActiveEngagementId } from '@/shared/hooks/useEmpresaActiva'
import { MaturityLevel, PILLARS } from '../data/pillarsData'
import { getOrganizationalReadiness, saveOrganizationalReadiness } from '../data/readinessApi'

// Selección de chips de un grupo de evidencia estructurada. `selected` puede
// contener tanto valores predefinidos (`group.options`) como texto libre
// agregado vía el chip "Otro" — no se distinguen internamente, ambos son
// strings seleccionados.
export interface EvidenceGroupState {
  groupId: string
  selected: string[]
}

export interface PillarAssessmentState {
  id: string
  evidenceGroups: EvidenceGroupState[]
  level: MaturityLevel | null
  notes: string
}

const buildInitialState = (): PillarAssessmentState[] =>
  PILLARS.map((p) => ({
    id: p.id,
    evidenceGroups: p.evidenceGroups.map((g) => ({ groupId: g.id, selected: [] })),
    level: null,
    notes: '',
  }))

const parseEvidenceGroupsJson = (json: string, pillarId: string): EvidenceGroupState[] => {
  const pillar = PILLARS.find((p) => p.id === pillarId)
  const template = pillar ? pillar.evidenceGroups.map((g) => ({ groupId: g.id, selected: [] as string[] })) : []
  try {
    const parsed = JSON.parse(json) as EvidenceGroupState[]
    if (!Array.isArray(parsed)) return template
    return template.map((t) => {
      const found = parsed.find((g) => g.groupId === t.groupId)
      return found ? { groupId: t.groupId, selected: found.selected ?? [] } : t
    })
  } catch {
    return template
  }
}

const formatTime = (iso: string | null): string => {
  if (!iso) return 'Sin guardar'
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

const AUTOSAVE_DEBOUNCE_MS = 800

// Estado + autosave (backend SQL real, vía /engagements/{id}/organizational-
// readiness) del Assessment de Preparación Organizacional (Paso 1 · 6
// pilares). Cualitativo y ejecutivo: los chips de evidencia estructurada son
// apoyo, el nivel 1-4 lo decide el evaluador humano (nunca se auto-calcula
// desde la evidencia seleccionada).
export const usePillarAssessment = () => {
  const engagementId = getActiveEngagementId()
  const [pillars, setPillars] = useState<PillarAssessmentState[]>(() => buildInitialState())
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const hasLoadedRef = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Carga inicial desde SQL.
  useEffect(() => {
    let cancelled = false
    if (!engagementId) {
      setLoading(false)
      return
    }
    getOrganizationalReadiness(engagementId)
      .then((rows) => {
        if (cancelled) return
        const merged = PILLARS.map((p) => {
          const found = rows.find((r) => r.pillarId === p.id)
          return found
            ? {
                id: p.id,
                evidenceGroups: parseEvidenceGroupsJson(found.evidenceGroupsJson, p.id),
                level: found.level,
                notes: found.notes ?? '',
              }
            : {
                id: p.id,
                evidenceGroups: p.evidenceGroups.map((g) => ({ groupId: g.id, selected: [] })),
                level: null,
                notes: '',
              }
        })
        setPillars(merged)
        const latest = rows.reduce<string | null>((acc, r) => {
          const ts = r.updatedAt ?? r.createdAt
          return !acc || ts > acc ? ts : acc
        }, null)
        setUpdatedAt(latest)
      })
      .catch((err) => {
        console.error('Error cargando el assessment de preparación organizacional', err)
      })
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

  // Autosave con debounce hacia SQL cada vez que cambia el estado (después
  // de la carga inicial, para no disparar un guardado vacío al montar).
  useEffect(() => {
    if (!engagementId || !hasLoadedRef.current) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSaving(true)
      saveOrganizationalReadiness(
        engagementId,
        pillars.map((p) => ({
          pillarId: p.id,
          level: p.level,
          notes: p.notes,
          evidenceGroupsJson: JSON.stringify(p.evidenceGroups),
        })),
      )
        .then(() => setUpdatedAt(new Date().toISOString()))
        .catch((err) => console.error('Error guardando el assessment de preparación organizacional', err))
        .finally(() => setSaving(false))
    }, AUTOSAVE_DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pillars, engagementId])

  const toggleEvidenceChip = useCallback((pillarId: string, groupId: string, value: string) => {
    setPillars((prev) =>
      prev.map((p) =>
        p.id === pillarId
          ? {
              ...p,
              evidenceGroups: p.evidenceGroups.map((g) =>
                g.groupId === groupId
                  ? {
                      ...g,
                      selected: g.selected.includes(value)
                        ? g.selected.filter((v) => v !== value)
                        : [...g.selected, value],
                    }
                  : g,
              ),
            }
          : p,
      ),
    )
  }, [])

  const addOtherEvidence = useCallback((pillarId: string, groupId: string, text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setPillars((prev) =>
      prev.map((p) =>
        p.id === pillarId
          ? {
              ...p,
              evidenceGroups: p.evidenceGroups.map((g) =>
                g.groupId === groupId && !g.selected.includes(trimmed)
                  ? { ...g, selected: [...g.selected, trimmed] }
                  : g,
              ),
            }
          : p,
      ),
    )
  }, [])

  const setLevel = useCallback((pillarId: string, level: MaturityLevel) => {
    setPillars((prev) => prev.map((p) => (p.id === pillarId ? { ...p, level } : p)))
  }, [])

  const setNotes = useCallback((pillarId: string, notes: string) => {
    setPillars((prev) => prev.map((p) => (p.id === pillarId ? { ...p, notes } : p)))
  }, [])

  const saveNow = useCallback(async () => {
    if (!engagementId) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSaving(true)
    try {
      await saveOrganizationalReadiness(
        engagementId,
        pillars.map((p) => ({
          pillarId: p.id,
          level: p.level,
          notes: p.notes,
          evidenceGroupsJson: JSON.stringify(p.evidenceGroups),
        })),
      )
      setUpdatedAt(new Date().toISOString())
    } catch (err) {
      console.error('Error guardando el assessment de preparación organizacional', err)
    } finally {
      setSaving(false)
    }
  }, [engagementId, pillars])

  const assigned = useMemo(() => pillars.filter((p) => p.level !== null), [pillars])

  const globalScore = useMemo(
    () => (assigned.length ? assigned.reduce((s, p) => s + (p.level as number), 0) / assigned.length : 0),
    [assigned],
  )

  const weakest = useMemo(
    () => (assigned.length ? [...assigned].sort((a, b) => (a.level as number) - (b.level as number))[0] : null),
    [assigned],
  )

  const strongest = useMemo(
    () => (assigned.length ? [...assigned].sort((a, b) => (b.level as number) - (a.level as number))[0] : null),
    [assigned],
  )

  const canFinish = assigned.length === PILLARS.length

  return {
    pillars,
    toggleEvidenceChip,
    addOtherEvidence,
    setLevel,
    setNotes,
    saveNow,
    assignedCount: assigned.length,
    globalScore,
    weakest,
    strongest,
    canFinish,
    loading,
    saving,
    hasEngagement: !!engagementId,
    lastSavedLabel: saving ? 'Guardando…' : formatTime(updatedAt),
  }
}
