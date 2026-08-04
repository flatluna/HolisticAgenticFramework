import { useEffect, useSyncExternalStore } from 'react'
import type { BusinessRule } from '@/modules/deepdive/state/deepDiveStore'
import { clientEngagementApi } from '@/modules/strategy/services/api'
import { getActiveEngagementId } from '@/shared/hooks/useEmpresaActiva'

// "📚 Diccionario de Datos del Negocio" — fuente única de verdad para la
// taxonomía de datos de la empresa. Es estado GLOBAL compartido entre todos
// los procesos/pasos de L3 (no vive dentro del store de Deep Dive): un mismo
// dato canónico (ej. "RFC") puede estar referenciado desde muchos
// StepDataItem distintos vía StepDataItem.dictionaryId.
//
// PERSISTENCIA: este store es un CACHE sincronizado con el backend
// (DataDictionaryEntry en AETP.Modules.Process, expuesto vía
// DataDictionaryFunctions en AETP.Modules.ClientEngagement.Api) — nada vive
// solo en memoria/localStorage. Toda mutación actualiza el array local de
// inmediato (misma UX que antes) y dispara en paralelo un PUT (upsert real
// por id) que persiste el cambio en SQL, scoped por engagement activo (ver
// getActiveEngagementId()). El id de cada entrada lo genera el FRONTEND
// (GUID real, ver emptyDataDictionaryEntry) para poder referenciarlo de
// inmediato desde StepDataItem.dictionaryId antes de que exista en SQL —
// el backend lo acepta tal cual en el primer PUT (create-by-id).

export type CanonicalDataType =
  | 'texto'
  | 'numero'
  | 'fecha'
  | 'booleano'
  | 'identificador'
  | 'monto'
  | 'documento'
  | 'otro'

export interface DataRepresentation {
  id: string
  system: string
  fieldName: string
  screenOrTable: string
}

export interface CanonicalDataEntry {
  id: string
  officialName: string
  // Proceso/pantalla/dominio de negocio donde vive este dato (ej.
  // "Aprobación de crédito", "Recursos Humanos") — permite distinguir
  // nombres genéricos ("Priority", "Status", "Category") que significan
  // cosas DISTINTAS según el contexto. Vacío = dato verdaderamente global/
  // reutilizable en cualquier proceso (ej. "RFC"), no ambiguo.
  context: string
  description: string
  technicalName: string
  synonyms: string[]
  dataType: CanonicalDataType | ''
  format: string
  isPII: boolean
  owner: string
  // Responsable de que este dato se mantenga correcto/actualizado — distinto
  // del dueño de negocio (owner): puede ser la misma persona o un rol de
  // gobierno de datos dedicado (steward de calidad).
  qualityOwner: string
  representations: DataRepresentation[]
  // Reglas que aplican al dato SIEMPRE, sin importar el paso — distintas de
  // las reglas capturadas a nivel dato DENTRO de un paso (esas son
  // específicas de ese paso y viven en StepDataItem.rules).
  globalRules: BusinessRule[]
}

export const emptyDataDictionaryEntry = (seedName = '', context = ''): CanonicalDataEntry => ({
  id: crypto.randomUUID(),
  officialName: seedName,
  context,
  description: '',
  technicalName: '',
  synonyms: [],
  dataType: '',
  format: '',
  isPII: false,
  owner: '',
  qualityOwner: '',
  representations: [],
  globalRules: [],
})

// Forma del DataDictionaryEntryDto devuelto por el backend (ver
// AETP.Modules.ClientEngagement.Api.DTOs.DataDictionaryEntryDtos).
interface DataDictionaryEntryDto {
  id: string
  engagementId: string
  officialName: string
  context: string
  description: string
  technicalName: string
  dataType: string
  format: string
  isPII: boolean
  owner: string
  qualityOwner: string
  synonyms: string[]
  representations: DataRepresentation[]
  globalRules: BusinessRule[]
}

const dtoToEntry = (dto: DataDictionaryEntryDto): CanonicalDataEntry => ({
  id: dto.id,
  officialName: dto.officialName,
  context: dto.context || '',
  description: dto.description || '',
  technicalName: dto.technicalName || '',
  synonyms: dto.synonyms || [],
  dataType: (dto.dataType as CanonicalDataEntry['dataType']) || '',
  format: dto.format || '',
  isPII: dto.isPII,
  owner: dto.owner || '',
  qualityOwner: dto.qualityOwner || '',
  representations: dto.representations || [],
  globalRules: dto.globalRules || [],
})

// SEED — una entrada de ejemplo (RFC) para poder probar la vinculación
// dato-de-paso ↔ diccionario desde el primer render. Se persiste una sola
// vez en SQL, la primera vez que el diccionario de un engagement viene
// vacío del backend — igual que systemsCatalogStore.ts.
const SEED_RFC_ID = '00000000-0000-0000-0000-0000000000dd'
const SEED: CanonicalDataEntry[] = [
  {
    id: SEED_RFC_ID,
    officialName: 'RFC',
    context: '',
    description:
      'Registro Federal de Contribuyentes — identificador fiscal único de personas físicas y morales en México.',
    technicalName: 'rfc',
    synonyms: ['Clave fiscal', 'Tax ID', 'Registro fiscal'],
    dataType: 'identificador',
    format: '13 caracteres (personas físicas) / 12 caracteres (morales)',
    isPII: true,
    owner: 'Coordinador',
    qualityOwner: 'Analista',
    representations: [
      { id: 'dd-rfc-r1', system: 'SAP', fieldName: 'STCD1', screenOrTable: 'Datos maestros de proveedor/cliente' },
      { id: 'dd-rfc-r2', system: 'Salesforce', fieldName: 'RFC__c', screenOrTable: 'Cuenta (Account)' },
    ],
    globalRules: [],
  },
]

let entries: CanonicalDataEntry[] = []
let loadedForEngagementId: string | null = null
let loadingPromise: Promise<void> | null = null

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())

export const subscribeDataDictionary = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const getDataDictionaryEntries = () => entries

export const getDataDictionaryEntry = (id: string) => entries.find((e) => e.id === id)

const persistEntry = (engagementId: string, entry: CanonicalDataEntry) => {
  clientEngagementApi
    .put<DataDictionaryEntryDto>(`/engagements/${engagementId}/data-dictionary/${entry.id}`, {
      officialName: entry.officialName,
      context: entry.context,
      description: entry.description,
      technicalName: entry.technicalName,
      dataType: entry.dataType,
      format: entry.format,
      isPII: entry.isPII,
      owner: entry.owner,
      qualityOwner: entry.qualityOwner,
      synonyms: entry.synonyms,
      representations: entry.representations,
      globalRules: entry.globalRules,
    })
    .catch((err) => console.error('Error guardando dato del diccionario en SQL', entry.officialName, err))
}

const loadEntriesForEngagement = async (engagementId: string) => {
  try {
    const response = await clientEngagementApi.get<DataDictionaryEntryDto[]>(
      `/engagements/${engagementId}/data-dictionary`,
    )
    if (response.data.length === 0) {
      for (const seed of SEED) {
        await clientEngagementApi.put(`/engagements/${engagementId}/data-dictionary/${seed.id}`, {
          officialName: seed.officialName,
          context: seed.context,
          description: seed.description,
          technicalName: seed.technicalName,
          dataType: seed.dataType,
          format: seed.format,
          isPII: seed.isPII,
          owner: seed.owner,
          qualityOwner: seed.qualityOwner,
          synonyms: seed.synonyms,
          representations: seed.representations,
          globalRules: seed.globalRules,
        })
      }
      const reloaded = await clientEngagementApi.get<DataDictionaryEntryDto[]>(
        `/engagements/${engagementId}/data-dictionary`,
      )
      entries = reloaded.data.map(dtoToEntry)
    } else {
      entries = response.data.map(dtoToEntry)
    }
    loadedForEngagementId = engagementId
    emit()
  } catch (err) {
    console.error('Error cargando diccionario de datos desde SQL', err)
  }
}

// Dispara la carga del diccionario desde SQL para el engagement activo, una
// sola vez por engagement (idempotente: llamar varias veces es seguro).
export const ensureDataDictionaryLoaded = () => {
  const engagementId = getActiveEngagementId()
  if (!engagementId) return
  if (loadedForEngagementId === engagementId) return
  if (loadingPromise) return
  loadingPromise = loadEntriesForEngagement(engagementId).finally(() => {
    loadingPromise = null
  })
}

export const upsertDataDictionaryEntry = (entry: CanonicalDataEntry) => {
  const existingIndex = entries.findIndex((e) => e.id === entry.id)
  entries = existingIndex >= 0 ? entries.map((e, i) => (i === existingIndex ? entry : e)) : [...entries, entry]
  emit()

  const engagementId = getActiveEngagementId()
  if (!engagementId) {
    console.error('No hay engagement activo — no se pudo guardar el dato del diccionario en SQL')
    return
  }
  persistEntry(engagementId, entry)
}


export const removeDataDictionaryEntry = (id: string) => {
  entries = entries.filter((e) => e.id !== id)
  emit()

  clientEngagementApi
    .delete(`/data-dictionary/${id}`)
    .catch((err) => console.error('Error eliminando dato del diccionario en SQL', id, err))
}

export const useDataDictionaryEntries = () => {
  useEffect(() => {
    ensureDataDictionaryLoaded()
  }, [])
  return useSyncExternalStore(subscribeDataDictionary, getDataDictionaryEntries, getDataDictionaryEntries)
}

export const useDataDictionaryEntry = (id: string | undefined) => {
  const list = useDataDictionaryEntries()
  return list.find((e) => e.id === id)
}
