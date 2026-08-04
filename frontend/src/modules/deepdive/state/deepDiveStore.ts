import { useSyncExternalStore } from 'react'
import type {
  ActionType,
  ApiAvailability,
  DireccionComunicacion,
  IAPotential,
  PriorityLevel,
  ProcessDeepDiveStatus,
  SystemFieldAction,
  TipoFuenteNoEstructurada,
} from '../data/catalogs'

export type { PriorityLevel, ProcessDeepDiveStatus }

// Una regla de negocio individual — puede colgar de un dato específico
// (StepDataItem.rules) o aplicar al paso completo (ProcessStepRecord.stepRules).
// `source`/`isDocumented` son los campos que disparan los badges visuales de
// riesgo (tribal / compliance) y sirven de insumo contable para el
// diagnóstico del Paso 4.
export interface BusinessRule {
  id: string
  description: string
  owner: string // quién autoriza / es dueño de la regla
  source: string
  origin: string // quién la dijo / de dónde salió
  isDocumented: boolean
  flexibility: string
}

// Ubicación EXACTA de un dato dentro de un sistema (sistema → módulo →
// transacción/pantalla → campo) — lo que un agente de RPA/API necesita para
// operar: el nombre TÉCNICO del campo (KUNNR, NETWR...), no solo la
// etiqueta visible. Vive A NIVEL DE CADA DATO (StepDataItem.systemLocation),
// no a nivel del paso: un mismo paso puede tocar varios datos, cada uno en
// un sistema/campo distinto (ej: RFC en SAP KUNNR, antigüedad en otro
// sistema). Solo se captura cuando el origen del dato implica un sistema
// (ver SYSTEM_DATA_ORIGINS en catalogs.ts). "módulo" solo aplica cuando el
// sistema elegido está marcado esSuite=true en systemsCatalogStore.ts.
export interface DataSystemLocation {
  sistema: string
  modulo: string
  transaccionCodigo: string
  transaccionNombre: string
  campoPantalla: string // nombre del campo como aparece en pantalla
  campoTecnico: string // nombre técnico (ej. SAP: KUNNR, NETWR)
  accion: SystemFieldAction | ''
  // "🔌 ¿Un Agente de IA podría hacer esto vía API?" — a diferencia de
  // SystemCatalogEntry.tieneAPI (¿el SISTEMA en general tiene API?, vive en
  // systemsCatalogStore.ts), esto es específico de ESTA transacción/pantalla
  // puntual: un sistema puede tener API pero esta transacción concreta no
  // estar expuesta (ej. Z-transacción custom en SAP).
  viaAPI: ApiAvailability | ''
  notasViaAPI: string
}

// Dueño del dato — la PERSONA (no solo un rol/puesto genérico) responsable
// de definir el nombre, formato y reglas de negocio de este dato específico
// — a quién preguntarle si hay dudas o excepciones. Vive A NIVEL DE CADA
// DATO (StepDataItem.dataOwner), igual que systemLocation.
export interface DataOwner {
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  departamento: string
}

// Un dato individual que el paso recibe/procesa (modelo centrado en el
// dato — cada dato puede traer sus propias reglas de negocio Y su propia
// ubicación exacta en sistema). `dictionaryId` lo vincula a una entrada del
// "📚 Diccionario de Datos del Negocio" (frontend/src/modules/datadictionary)
// cuando el FDE elige un dato ya existente en vez de capturarlo suelto — así
// se evita duplicar taxonomía entre procesos.
export interface StepDataItem {
  id: string
  name: string
  // Dueño del dato — persona responsable de definir su nombre, formato y
  // reglas de negocio (ver DataOwner arriba).
  dataOwner?: DataOwner
  origin: string
  format: string
  rules: BusinessRule[]
  dictionaryId?: string
  // "🖥 Ubicación exacta en el sistema" — solo se llena si `origin` es uno de
  // SYSTEM_DATA_ORIGINS ("Se captura en sistema" / "Se consulta en sistema").
  systemLocation?: DataSystemLocation
}

// Resumen del resultado del DocumentExtractionAgent para UN documento PDF
// subido desde esta fuente (ver services/documentExtractionApi.ts) — solo
// los campos que la UI necesita mostrar inline en la tarjeta de la fuente,
// no el DocumentExtractionDto completo.
export interface DocumentExtractionSummary {
  id: string
  fileName: string
  pageCount: number
  executiveSummary?: string
  contentDescription?: string
  extractedDataCount: number
  entitiesCount: number
  /** Cada dato de negocio tipado extraído del documento (nombre, valor, formato/tipo). */
  extractedData: { key: string; value: string; dataType: string }[]
  /** Reglas de negocio explícitas propuestas por el agente (política/umbral/autorización). */
  businessRules: { name: string; description: string }[]
  /** El grafo del documento: relaciones entre entidades/reglas (ej. quién autoriza qué). */
  relationships: { fromNode: string; relationType: string; toNode: string }[]
  extractedAt?: string
}

// Contenido "crudo"/no estructurado que llega o sale en el paso (email,
// transcripción de llamada, un PDF, el texto de una ley...) — distinto del
// dato YA estructurado en StepDataItem. Vive A NIVEL DEL PASO (no por
// dato), ya que una misma fuente (ej. un correo) puede dar origen a varios
// datos estructurados distintos.
export interface FuenteNoEstructurada {
  id: string
  tipo: TipoFuenteNoEstructurada
  descripcion: string
  /** Texto/transcripción real de ejemplo — para que el agente de IA entienda el formato. */
  ejemploContenido?: string
  formato?: string
  notas?: string
  /** ROL de quién la envía/genera (ej. "cliente", "gerente") — NUNCA la dirección de email literal. */
  origen?: string
  /** Solo aplica cuando tipo === 'email' — el asunto real (o patrón de asunto) del correo. */
  asunto?: string
  /** Solo aplica a email/documento/pdf/ley — nombres descriptivos de adjuntos (ej. "Estados financieros PDF"). */
  adjuntos?: string[]
  /** ID real del ActivityInteraction (📥 Fuente) en el backend — se crea la
   * primera vez que se sube un PDF desde esta fuente (ver processActivityApi.ts). */
  backendInteractionId?: string
  /** Resultado de la última extracción de IA sobre el PDF subido para esta fuente. */
  extraction?: DocumentExtractionSummary
}

// ⏱ Tiempos de UN paso — separa DOS conceptos que antes vivían mezclados
// en un solo `estMinutes`: el ESFUERZO real (tiempo activo trabajando) y el
// tiempo de ESPERA (colas, tiempo sin atender). La diferencia entre ambos
// es exactamente el desperdicio que un agente de IA (disponible 24/7, sin
// colas) podría eliminar — ver utils/tiempos.ts para los cálculos
// derivados (tiempoTotalPaso, esfuerzoTotalProceso, desperdicioTotal...).
export interface TiemposPaso {
  /** ⏱ Esfuerzo real (SIEMPRE requerido) — lo que de verdad toma trabajar. */
  tiempoActivoMin: number
  /** ⏳ Espera/cola antes de atender — opcional, según el tipo de paso. */
  tiempoEsperaMin?: number
  // Timestamps REALES — SOLO los llena una integración automática (Outlook,
  // WhatsApp API, logs de SAP). NUNCA se capturan a mano en el Deep Dive:
  // en captura humana quedan en null.
  /** ISO — cuándo llegó (mensajes entrantes). */
  horaRecibido?: string | null
  /** ISO — cuándo se empezó a atender. */
  horaInicio?: string | null
  /** ISO — cuándo se terminó. */
  horaFin?: string | null
}

export interface ProcessStepRecord {
  id: string
  order: number
  name: string
  description: string
  // ⏱ Tiempos del paso — separa esfuerzo REAL (tiempoActivoMin, siempre
  // requerido) de tiempo de ESPERA/cola (tiempoEsperaMin, opcional y sujeto
  // a qué campos pide el formulario según actionType/channel/direccion —
  // ver tiempoEsperaConfig en utils/tiempos.ts). Los timestamps reales
  // (horaRecibido/horaInicio/horaFin) NUNCA se capturan a mano en el Deep
  // Dive — quedan en null hasta que una integración real (Outlook,
  // WhatsApp API, logs de SAP) los llene.
  tiempos: TiemposPaso
  responsiblePuesto: string
  iaPotential: IAPotential | ''
  notes: string
  actionType: ActionType
  // Campos dinámicos — solo el subconjunto correspondiente al actionType
  // vigente se llena (ver C) CAMPOS DINÁMICOS SEGÚN TIPO en el pedido). El
  // detalle de sistema/módulo/transacción/campo YA NO se captura aquí —
  // vive por dato (ver StepDataItem.systemLocation) para evitar capturar la
  // misma información dos veces.
  channel?: string
  // Solo relevante cuando el canal es Email/WhatsApp (channelNeedsDireccion
  // en catalogs.ts) — determina si se pide/oculta tiempoEsperaMin.
  direccion?: DireccionComunicacion
  withWhom?: string
  decisionType?: string
  whoDecides?: string
  documentName?: string
  documentAction?: string
  blockType?: string
  waitTime?: string
  // Etapa ③ del wizard para el tipo "✋ Manual" — descripción libre de qué
  // datos se manejan a mano, sin sistema ni documento de origen (ver
  // showsManualDataDescription en catalogs.ts).
  manualDataNotes?: string
  // "📥 Datos que procesamos en este paso" — cada dato con sus propias
  // reglas de negocio (nivel DATO).
  stepData?: StepDataItem[]
  // "� Fuentes no estructuradas" — contenido crudo (email, llamada,
  // documento, ley...) del que a veces se extraen datos estructurados y a
  // veces no. Distinto de stepData: vive a nivel de PASO, no por dato (ver
  // FuenteNoEstructurada arriba y showsFuentesNoEstructuradas en catalogs.ts).
  fuentesNoEstructuradas?: FuenteNoEstructurada[]
  // "�📋 Reglas a nivel del PASO completo" — reglas que no cuelgan de un
  // dato específico sino que aplican al paso entero (nivel PASO).
  stepRules?: BusinessRule[]
  /** ID real del ProcessActivity (🪜 Paso) en el backend — se crea/actualiza
   * al guardar el paso, una vez que el DeepDiveProcess dueño ya está
   * vinculado a un BusinessProcess real (ver DeepDiveProcess.backendProcessId). */
  backendActivityId?: string
}

export interface DeepDiveProcess {
  id: string
  priority: number // 1 = más prioritario (heredado del score de L2)
  priorityLevel: PriorityLevel
  name: string
  estMinutes: number
  expectedStepCount: number // "X pasos" estimado, heredado de L2
  status: ProcessDeepDiveStatus
  steps: ProcessStepRecord[]
  /** Capacidad de Negocio dueña elegida al vincular este Deep Dive con el
   * backend real (requerida por BusinessProcess.Create). */
  capabilityId?: string
  /** ID real del BusinessProcess en el backend — null hasta que el asesor
   * vincula este proceso (ver linkProcessToBackend), momento en el que
   * puede empezar a guardar pasos/fuentes con trazabilidad real. */
  backendProcessId?: string
}

// MOCK — reemplazar por los procesos realmente priorizados en L2 (Ranking
// de Procesos / Business Case) en cuanto exista el wiring L2 → L3. El
// proceso #2 trae un paso ya capturado de ejemplo para poder probar el
// modo "editar" desde el primer render.
let processes: DeepDiveProcess[] = [
  {
    id: 'p1',
    priority: 1,
    priorityLevel: 'alta',
    name: 'Aprobación de crédito',
    estMinutes: 45,
    expectedStepCount: 8,
    status: 'pendiente',
    steps: [],
  },
  {
    id: 'p2',
    priority: 2,
    priorityLevel: 'media',
    name: 'Alta de proveedor',
    estMinutes: 30,
    expectedStepCount: 5,
    status: 'en-progreso',
    steps: [
      {
        id: 'p2-s1',
        order: 1,
        name: 'Recibir solicitud de alta por correo',
        description: 'El proveedor envía su documentación de alta al buzón de compras.',
        tiempos: { tiempoActivoMin: 5, tiempoEsperaMin: 45 },
        responsiblePuesto: 'Analista',
        iaPotential: 'asistible',
        notes: '',
        actionType: 'comunicacion',
        channel: '📧 Email',
        direccion: 'entrante',
        withWhom: 'Proveedor',
      },
    ],
  },
  {
    id: 'p3',
    priority: 3,
    priorityLevel: 'baja',
    name: 'Conciliación bancaria',
    estMinutes: 20,
    expectedStepCount: 4,
    status: 'completado',
    steps: [
      {
        id: 'p3-s1',
        order: 1,
        name: 'Descargar movimientos del portal bancario',
        description: 'Se descarga el estado de cuenta del día desde el portal del banco.',
        tiempos: { tiempoActivoMin: 5 },
        responsiblePuesto: 'Analista',
        iaPotential: 'automatizable',
        notes: '',
        actionType: 'sistema',
        stepData: [
          {
            id: 'p3-s1-d1',
            name: 'Movimientos bancarios del día',
            origin: 'Se consulta en sistema',
            format: '',
            rules: [],
            systemLocation: {
              sistema: 'Portal bancario',
              modulo: '',
              transaccionCodigo: '',
              transaccionNombre: 'Estado de cuenta',
              campoPantalla: '',
              campoTecnico: '',
              accion: 'lee',
            },
          },
        ],
      },
      {
        id: 'p3-s2',
        order: 2,
        name: 'Cargar movimientos al sistema contable',
        description: 'Se importan los movimientos descargados al sistema contable interno.',
        tiempos: { tiempoActivoMin: 5 },
        responsiblePuesto: 'Analista',
        iaPotential: 'automatizable',
        notes: '',
        actionType: 'sistema',
        stepData: [
          {
            id: 'p3-s2-d1',
            name: 'Movimientos bancarios del día',
            origin: 'Se captura en sistema',
            format: '',
            rules: [],
            systemLocation: {
              sistema: 'Sistema contable',
              modulo: '',
              transaccionCodigo: '',
              transaccionNombre: '',
              campoPantalla: '',
              campoTecnico: '',
              accion: 'captura',
            },
          },
        ],
      },
      {
        id: 'p3-s3',
        order: 3,
        name: 'Identificar partidas no conciliadas',
        description: 'Se comparan movimientos bancarios contra registros contables para detectar diferencias.',
        tiempos: { tiempoActivoMin: 7, tiempoEsperaMin: 15 },
        responsiblePuesto: 'Analista',
        iaPotential: 'asistible',
        notes: '',
        actionType: 'decision',
        decisionType: 'Criterio humano',
        whoDecides: 'Analista',
      },
      {
        id: 'p3-s4',
        order: 4,
        name: 'Aprobar conciliación del periodo',
        description: 'El coordinador revisa y aprueba la conciliación antes del cierre.',
        tiempos: { tiempoActivoMin: 3, tiempoEsperaMin: 120 },
        responsiblePuesto: 'Coordinador',
        iaPotential: 'requiere-humano',
        notes: '',
        actionType: 'decision',
        decisionType: 'Aprobación jerárquica',
        whoDecides: 'Coordinador',
      },
    ],
  },
]

const listeners = new Set<() => void>()
const emit = () => {
  persist()
  listeners.forEach((listener) => listener())
}

const deriveStatus = (steps: ProcessStepRecord[], expectedStepCount: number): ProcessDeepDiveStatus => {
  if (steps.length === 0) return 'pendiente'
  if (steps.length >= expectedStepCount) return 'completado'
  return 'en-progreso'
}

// El status de cada proceso siempre se deriva de sus pasos reales, nunca se
// confía en el campo "status" escrito a mano arriba — evita que el mock (o
// datos reales de L2 más adelante) queden inconsistentes con el conteo.
processes = processes.map((p) => ({ ...p, status: deriveStatus(p.steps, p.expectedStepCount) }))

// Persistencia en localStorage — este store es puramente en memoria (no hay
// backend propio para el "Deep Dive" en sí, solo para lo ya vinculado vía
// linkProcessToBackend/upsertProcessStep), así que CUALQUIER recarga de
// página (F5, HMR de Vite al editar código, navegación por URL directa)
// perdía TODO: capacidad vinculada, backendProcessId, backendActivityId,
// fuentes/PDFs capturados. Se guarda el árbol completo en localStorage y se
// recupera al cargar el módulo, para que sobreviva recargas dentro del
// mismo navegador/perfil.
const STORAGE_KEY = 'aetp.deepDiveStore.v1'

const loadPersisted = (): DeepDiveProcess[] | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

const persist = () => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(processes))
  } catch {
    // localStorage puede fallar (modo privado, cuota llena) — no es crítico,
    // el store en memoria sigue funcionando para el resto de la sesión.
  }
}

const persisted = loadPersisted()
if (persisted) processes = persisted

export const subscribeDeepDive = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const getDeepDiveProcesses = () => processes

export const getDeepDiveProcess = (processId: string) => processes.find((p) => p.id === processId)

/** Vincula un DeepDiveProcess local con un BusinessProcess real ya creado
 * en el backend (ver StepCapturePage.tsx, flujo "Vincular con backend") —
 * a partir de este momento sus pasos/fuentes pueden sincronizarse contra
 * ProcessActivity/ActivityInteraction reales. */
export const linkProcessToBackend = (processId: string, capabilityId: string, backendProcessId: string) => {
  processes = processes.map((p) => (p.id === processId ? { ...p, capabilityId, backendProcessId } : p))
  emit()
}

export const upsertProcessStep = (processId: string, step: ProcessStepRecord) => {
  processes = processes.map((process) => {
    if (process.id !== processId) return process
    const existingIndex = process.steps.findIndex((s) => s.id === step.id)
    const nextSteps =
      existingIndex >= 0
        ? process.steps.map((s, i) => (i === existingIndex ? step : s))
        : [...process.steps, step]
    const sortedSteps = [...nextSteps].sort((a, b) => a.order - b.order)
    return { ...process, steps: sortedSteps, status: deriveStatus(sortedSteps, process.expectedStepCount) }
  })
  emit()
}

/** Hook reactivo: re-renderiza cuando cualquier proceso/paso cambia. */
export const useDeepDiveProcesses = () => useSyncExternalStore(subscribeDeepDive, getDeepDiveProcesses, getDeepDiveProcesses)

export const useDeepDiveProcess = (processId: string | undefined) => {
  const list = useDeepDiveProcesses()
  return list.find((p) => p.id === processId)
}

/** Totales usados por el contador "L3 · X/Y pasos" del sidebar. */
export const useDeepDiveTotals = () => {
  const list = useDeepDiveProcesses()
  const totalCaptured = list.reduce((sum, p) => sum + p.steps.length, 0)
  const totalExpected = list.reduce((sum, p) => sum + p.expectedStepCount, 0)
  return { totalCaptured, totalExpected }
}
