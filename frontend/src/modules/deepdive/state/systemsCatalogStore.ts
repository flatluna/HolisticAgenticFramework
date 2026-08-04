import { useEffect, useSyncExternalStore } from 'react'
import { clientEngagementApi } from '@/modules/strategy/services/api'
import { getActiveEngagementId } from '@/shared/hooks/useEmpresaActiva'
import type { HostingType } from '../data/catalogs'

// "🖥 Ubicación exacta en el sistema" — catálogo GLOBAL de sistemas tipo
// SUITE (con jerarquía interna módulo → transacción → pantalla → campo).
// Vive separado de §SISTEMAS (catalogs.ts, lista plana de nombres) porque
// necesita CRECER en runtime: cada módulo/transacción que un FDE captura en
// un paso se guarda aquí y se sugiere en autocompletado la próxima vez
// ("mini-catálogo de transacciones usadas por el negocio").
//
// PERSISTENCIA: este store es un CACHE sincronizado con el backend
// (EnterpriseSystem + EnterpriseSystemModule + EnterpriseSystemTransaction
// en AETP.Modules.Process, expuestos vía Functions en
// AETP.Modules.ClientEngagement.Api) — nada vive solo en memoria. Toda
// mutación actualiza el array local de inmediato (misma UX que antes, sin
// esperar al servidor) y dispara en paralelo la llamada HTTP real que
// persiste el cambio en SQL, scoped por engagement activo (ver
// getActiveEngagementId()).

export interface SystemTransaction {
  codigo: string // ej. "VA01"
  nombre: string // ej. "Crear pedido de ventas"
}

export interface SystemCatalogEntry {
  name: string
  esSuite: boolean
  modulos: string[]
  transacciones: SystemTransaction[]
  // "🔌 API del sistema" — ¿este sistema, EN GENERAL, expone alguna API que
  // un Agente de IA podría usar en vez de simular clicks (RPA)? Es
  // conocimiento GLOBAL del sistema (se captura una vez, se reusa en todos
  // los procesos/pasos que lo toquen) — distinto de si ESTA transacción
  // puntual está expuesta por esa API (ver DataSystemLocation.viaAPI en
  // deepDiveStore.ts, que vive por dato).
  tieneAPI: boolean
  tipoAPI: string
  notasAPI: string
  // "☁️ Hosting del sistema" — ¿dónde corre? On-premises / Nube / Híbrido.
  // Igual que tieneAPI, es conocimiento GLOBAL del sistema — insumo directo
  // para construir el "reference architecture" del cliente conforme se van
  // capturando sistemas en los procesos.
  hosting: HostingType | ''
  proveedorNube: string
  notasHosting: string
}

const transactionKey = (t: SystemTransaction) => (t.codigo.trim() || t.nombre.trim()).toLowerCase()

// Forma del EnterpriseSystemDto devuelto por el backend (ver
// AETP.Modules.ClientEngagement.Api.DTOs.ProcessCatalogDtos.EnterpriseSystemDto).
interface EnterpriseSystemDto {
  id: string
  engagementId: string
  name: string
  category?: string | null
  description?: string | null
  status: string
  esSuite: boolean
  tieneAPI: boolean
  tipoAPI?: string | null
  notasAPI?: string | null
  hosting?: string | null
  proveedorNube?: string | null
  notasHosting?: string | null
  modulos: string[]
  transacciones: { codigo?: string | null; nombre?: string | null }[]
}

const dtoToEntry = (dto: EnterpriseSystemDto): SystemCatalogEntry => ({
  name: dto.name,
  esSuite: dto.esSuite,
  modulos: dto.modulos,
  transacciones: dto.transacciones.map((t) => ({ codigo: t.codigo || '', nombre: t.nombre || '' })),
  tieneAPI: dto.tieneAPI,
  tipoAPI: dto.tipoAPI || '',
  notasAPI: dto.notasAPI || '',
  hosting: (dto.hosting as HostingType) || '',
  proveedorNube: dto.proveedorNube || '',
  notasHosting: dto.notasHosting || '',
})

// SEED — sistemas tipo Suite precargados por el pedido, con algunos
// módulos/transacciones de ejemplo para SAP y Salesforce. Se persiste una
// sola vez en SQL, la primera vez que el catálogo de un engagement viene
// vacío del backend — así cada nuevo engagement arranca con la misma base
// de conocimiento sin volver a depender de un array en memoria. El resto de
// §SISTEMAS (Excel, SharePoint, Portal bancario, etc.) queda con
// esSuite=false y solo pide pantalla/URL básica (sin esta sección).
const SEED: SystemCatalogEntry[] = [
  {
    name: 'SAP',
    esSuite: true,
    modulos: ['FI (Finanzas)', 'CO (Controlling)', 'MM (Materiales)', 'SD (Ventas)', 'HR/HCM', 'PP (Producción)'],
    transacciones: [
      { codigo: 'VA01', nombre: 'Crear pedido de ventas' },
      { codigo: 'ME21N', nombre: 'Crear pedido de compra' },
      { codigo: 'XD01', nombre: 'Crear cliente' },
    ],
    tieneAPI: true,
    tipoAPI: 'RFC/BAPI',
    notasAPI: 'BAPIs estándar (ej. BAPI_SALESORDER_CREATEFROMDAT2) y OData Services (SAP Gateway) según versión/módulo.',
    hosting: 'no-se',
    proveedorNube: '',
    notasHosting: 'Varía mucho por cliente: ECC clásico suele ser on-premises; S/4HANA Cloud o RISE with SAP corren en nube.',
  },
  {
    name: 'Salesforce',
    esSuite: true,
    modulos: ['Sales Cloud', 'Service Cloud', 'Marketing Cloud'],
    transacciones: [
      { codigo: '', nombre: 'Vista de Leads' },
      { codigo: '', nombre: 'Nueva Oportunidad' },
    ],
    tieneAPI: true,
    tipoAPI: 'REST',
    notasAPI: 'REST API / SOAP API + Bulk API para cargas masivas.',
    hosting: 'nube',
    proveedorNube: 'Otro',
    notasHosting: 'SaaS multi-tenant en infraestructura propia de Salesforce.',
  },
  {
    name: 'Oracle EBS',
    esSuite: true,
    modulos: [],
    transacciones: [],
    tieneAPI: false,
    tipoAPI: '',
    notasAPI: '',
    hosting: 'on-premises',
    proveedorNube: '',
    notasHosting: 'Típicamente on-premises (versión clásica); existe Oracle Cloud ERP como alternativa SaaS distinta.',
  },
  {
    name: 'Dynamics 365',
    esSuite: true,
    modulos: [
      'Sales',
      'Customer Service',
      'Field Service',
      'Customer Insights - Data',
      'Customer Insights - Journeys',
      'Contact Center',
      'Finance',
      'Supply Chain Management',
      'Commerce',
      'Human Resources',
      'Project Operations',
      'Business Central',
      'Copilot',
      'Fraud Protection',
    ],
    transacciones: [],
    tieneAPI: true,
    tipoAPI: 'REST',
    notasAPI: 'Dataverse Web API (OData v4).',
    hosting: 'nube',
    proveedorNube: 'Azure',
    notasHosting: 'SaaS multi-tenant sobre Microsoft Azure.',
  },
  {
    name: 'Workday',
    esSuite: true,
    modulos: [],
    transacciones: [],
    tieneAPI: false,
    tipoAPI: '',
    notasAPI: '',
    hosting: 'nube',
    proveedorNube: 'Otro',
    notasHosting: 'SaaS propio de Workday.',
  },
  {
    name: 'ServiceNow',
    esSuite: true,
    modulos: [],
    transacciones: [],
    tieneAPI: false,
    tipoAPI: '',
    notasAPI: '',
    hosting: 'nube',
    proveedorNube: 'Otro',
    notasHosting: 'SaaS propio de ServiceNow.',
  },
  {
    name: 'Oracle NetSuite',
    esSuite: true,
    modulos: [],
    transacciones: [],
    tieneAPI: false,
    tipoAPI: '',
    notasAPI: '',
    hosting: 'nube',
    proveedorNube: 'Oracle Cloud (OCI)',
    notasHosting: 'SaaS multi-tenant en Oracle Cloud Infrastructure.',
  },
]

let systemsCatalog: SystemCatalogEntry[] = []
const idByName = new Map<string, string>()
const pendingCreate = new Map<string, Promise<string>>()
let loadedForEngagementId: string | null = null
let loadingPromise: Promise<void> | null = null

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())

export const subscribeSystemsCatalog = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const getSystemsCatalog = () => systemsCatalog

const setCatalogFromDtos = (dtos: EnterpriseSystemDto[]) => {
  systemsCatalog = dtos.map(dtoToEntry).sort((a, b) => a.name.localeCompare(b.name))
  idByName.clear()
  dtos.forEach((d) => idByName.set(d.name, d.id))
  emit()
}

const seedEngagement = async (engagementId: string) => {
  for (const seed of SEED) {
    try {
      const created = await clientEngagementApi.post<EnterpriseSystemDto>(
        `/engagements/${engagementId}/enterprise-systems`,
        { name: seed.name },
      )
      const id = created.data.id
      idByName.set(seed.name, id)
      await clientEngagementApi.put(`/enterprise-systems/${id}`, {
        esSuite: seed.esSuite,
        tieneAPI: seed.tieneAPI,
        tipoAPI: seed.tipoAPI,
        notasAPI: seed.notasAPI,
        hosting: seed.hosting || null,
        proveedorNube: seed.proveedorNube,
        notasHosting: seed.notasHosting,
      })
      for (const modulo of seed.modulos) {
        await clientEngagementApi.post(`/enterprise-systems/${id}/modules`, { name: modulo })
      }
      for (const transaccion of seed.transacciones) {
        await clientEngagementApi.post(`/enterprise-systems/${id}/transactions`, {
          codigo: transaccion.codigo,
          nombre: transaccion.nombre,
        })
      }
    } catch (err) {
      console.error('Error sembrando catálogo de sistemas', seed.name, err)
    }
  }
}

const loadCatalogForEngagement = async (engagementId: string) => {
  try {
    const response = await clientEngagementApi.get<EnterpriseSystemDto[]>(
      `/engagements/${engagementId}/enterprise-systems`,
    )
    if (response.data.length === 0) {
      await seedEngagement(engagementId)
      const reloaded = await clientEngagementApi.get<EnterpriseSystemDto[]>(
        `/engagements/${engagementId}/enterprise-systems`,
      )
      setCatalogFromDtos(reloaded.data)
    } else {
      setCatalogFromDtos(response.data)
    }
    loadedForEngagementId = engagementId
  } catch (err) {
    console.error('Error cargando catálogo de sistemas', err)
  }
}

// Dispara la carga del catálogo desde SQL para el engagement activo, una
// sola vez por engagement (idempotente: llamar varias veces es seguro).
export const ensureSystemsCatalogLoaded = () => {
  const engagementId = getActiveEngagementId()
  if (!engagementId) return
  if (loadedForEngagementId === engagementId) return
  if (loadingPromise) return
  loadingPromise = loadCatalogForEngagement(engagementId).finally(() => {
    loadingPromise = null
  })
}

// Obtiene el ID en SQL de un sistema por nombre, creándolo (get-or-create,
// case-insensitive en el backend) si aún no existe. Cachea la promesa en
// vuelo para no disparar creates duplicados si se llama varias veces
// seguido antes de que el primero resuelva.
const getOrCreateSystemId = (name: string): Promise<string> => {
  const existingId = idByName.get(name)
  if (existingId) return Promise.resolve(existingId)

  const pending = pendingCreate.get(name)
  if (pending) return pending

  const engagementId = getActiveEngagementId()
  if (!engagementId) return Promise.reject(new Error('No hay engagement activo'))

  const promise = clientEngagementApi
    .post<EnterpriseSystemDto>(`/engagements/${engagementId}/enterprise-systems`, { name })
    .then((response) => {
      idByName.set(name, response.data.id)
      pendingCreate.delete(name)
      return response.data.id
    })
    .catch((err) => {
      pendingCreate.delete(name)
      throw err
    })

  pendingCreate.set(name, promise)
  return promise
}

export const getSystemEntry = (name: string) => systemsCatalog.find((s) => s.name === name)

export const isSuiteSystem = (name: string | undefined) => (name ? Boolean(getSystemEntry(name)?.esSuite) : false)

// Sistemas capturados vía "+ Agregar" en el paso (no estaban en el catálogo
// precargado) entran como esSuite=false por default — no tienen jerarquía
// interna conocida todavía, ni info de API. Se persiste en SQL de inmediato
// (fire-and-forget) para que quede disponible en el resto de la sesión/
// procesos sin depender de que el usuario recargue.
const ensureSystemEntry = (name: string) => {
  if (!getSystemEntry(name)) {
    systemsCatalog = [
      ...systemsCatalog,
      {
        name,
        esSuite: false,
        modulos: [],
        transacciones: [],
        tieneAPI: false,
        tipoAPI: '',
        notasAPI: '',
        hosting: '',
        proveedorNube: '',
        notasHosting: '',
      },
    ]
    emit()
  }
  getOrCreateSystemId(name).catch((err) => console.error('Error creando sistema en catálogo', name, err))
}

export const addModuloToSystem = (systemName: string, modulo: string) => {
  const value = modulo.trim()
  if (!value) return
  ensureSystemEntry(systemName)
  systemsCatalog = systemsCatalog.map((s) => {
    if (s.name !== systemName) return s
    if (s.modulos.some((m) => m.toLowerCase() === value.toLowerCase())) return s
    return { ...s, modulos: [...s.modulos, value] }
  })
  emit()

  getOrCreateSystemId(systemName)
    .then((id) => clientEngagementApi.post(`/enterprise-systems/${id}/modules`, { name: value }))
    .catch((err) => console.error('Error guardando módulo del sistema', systemName, value, err))
}

export const addTransaccionToSystem = (systemName: string, transaccion: SystemTransaction) => {
  const key = transactionKey(transaccion)
  if (!key) return
  ensureSystemEntry(systemName)
  systemsCatalog = systemsCatalog.map((s) => {
    if (s.name !== systemName) return s
    if (s.transacciones.some((t) => transactionKey(t) === key)) return s
    return { ...s, transacciones: [...s.transacciones, transaccion] }
  })
  emit()

  getOrCreateSystemId(systemName)
    .then((id) =>
      clientEngagementApi.post(`/enterprise-systems/${id}/transactions`, {
        codigo: transaccion.codigo,
        nombre: transaccion.nombre,
      }),
    )
    .catch((err) => console.error('Error guardando transacción del sistema', systemName, transaccion, err))
}

// "🔌 API del sistema" — se edita desde la sección de ubicación en sistema
// de cualquier dato que use ese sistema; el cambio queda GLOBAL para todo
// el catálogo (todos los pasos/procesos que usen ese sistema lo ven).
export const setSystemApiInfo = (
  systemName: string,
  patch: Partial<Pick<SystemCatalogEntry, 'tieneAPI' | 'tipoAPI' | 'notasAPI'>>,
) => {
  if (!systemName.trim()) return
  ensureSystemEntry(systemName)
  systemsCatalog = systemsCatalog.map((s) => (s.name === systemName ? { ...s, ...patch } : s))
  emit()

  getOrCreateSystemId(systemName)
    .then((id) => clientEngagementApi.put(`/enterprise-systems/${id}`, patch))
    .catch((err) => console.error('Error guardando info de API del sistema', systemName, err))
}

// "☁️ Hosting del sistema" — igual que setSystemApiInfo: se edita desde la
// sección de ubicación en sistema de cualquier dato que use ese sistema, y
// el cambio queda GLOBAL (insumo para el "reference architecture").
export const setSystemHostingInfo = (
  systemName: string,
  patch: Partial<Pick<SystemCatalogEntry, 'hosting' | 'proveedorNube' | 'notasHosting'>>,
) => {
  if (!systemName.trim()) return
  ensureSystemEntry(systemName)
  systemsCatalog = systemsCatalog.map((s) => (s.name === systemName ? { ...s, ...patch } : s))
  emit()

  getOrCreateSystemId(systemName)
    .then((id) => clientEngagementApi.put(`/enterprise-systems/${id}`, { ...patch, hosting: patch.hosting || null }))
    .catch((err) => console.error('Error guardando info de hosting del sistema', systemName, err))
}

export const useSystemsCatalog = () => {
  useEffect(() => {
    ensureSystemsCatalogLoaded()
  }, [])
  return useSyncExternalStore(subscribeSystemsCatalog, getSystemsCatalog, getSystemsCatalog)
}

export const useSystemEntry = (name: string | undefined) => {
  const list = useSystemsCatalog()
  return list.find((s) => s.name === name)
}

export const useIsSuiteSystem = (name: string | undefined) => Boolean(useSystemEntry(name)?.esSuite)
