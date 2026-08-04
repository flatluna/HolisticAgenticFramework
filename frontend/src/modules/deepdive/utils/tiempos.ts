import type { ActionType, DireccionComunicacion } from '../data/catalogs'
import type { ProcessStepRecord, TiemposPaso } from '../state/deepDiveStore'

export const emptyTiempos = (tiempoActivoMin = 0): TiemposPaso => ({
  tiempoActivoMin,
  tiempoEsperaMin: undefined,
  horaRecibido: null,
  horaInicio: null,
  horaFin: null,
})

// ⏱ Tiempo total de UN paso = esfuerzo real + espera/cola (si la hay).
export const tiempoTotalPaso = (tiempos: TiemposPaso): number => tiempos.tiempoActivoMin + (tiempos.tiempoEsperaMin ?? 0)

// --- Unidades de captura para la espera (min/horas/días), normalizadas
// siempre a minutos internamente (Cambio 4.3 del pedido) ---
export type UnidadTiempo = 'min' | 'horas' | 'dias'

export const UNIDADES_TIEMPO: { value: UnidadTiempo; label: string; factor: number }[] = [
  { value: 'min', label: 'Minutos', factor: 1 },
  { value: 'horas', label: 'Horas', factor: 60 },
  { value: 'dias', label: 'Días', factor: 60 * 24 },
]

const factorDe = (unidad: UnidadTiempo) => UNIDADES_TIEMPO.find((u) => u.value === unidad)?.factor ?? 1

/** Convierte un valor capturado en `unidad` a minutos (lo que se persiste). */
export const aMinutos = (valor: number, unidad: UnidadTiempo): number => Math.round(valor * factorDe(unidad))

/** Convierte minutos persistidos de vuelta a la unidad elegida, para mostrar. */
export const deMinutos = (minutos: number, unidad: UnidadTiempo): number =>
  Math.round((minutos / factorDe(unidad)) * 100) / 100

export interface TiempoEsperaConfig {
  /** ¿El formulario debe pedir tiempoEsperaMin para este paso? */
  show: boolean
  /** Etiqueta contextual del campo (ver tabla del Cambio 2 del pedido). */
  label: string
  helperText?: string
  /** ¿Es opcional (🟡) o siempre relevante? Solo afecta copy, no validación. */
  optional?: boolean
  /** Espera crítica (ej. autorizaciones) — se resalta en la UI. */
  critical?: boolean
}

/**
 * Cambio 2 del pedido: qué campos de tiempo pide el formulario según el
 * TIPO de paso (actionType) y, para comunicación, según canal + dirección
 * entrante/saliente (Cambio 3). Única fuente de verdad para esta lógica —
 * usada por StepCapturePage para mostrar/ocultar y etiquetar el campo.
 */
export const tiempoEsperaConfig = (
  actionType: ActionType,
  channel: string | undefined,
  direccion: DireccionComunicacion | undefined,
): TiempoEsperaConfig => {
  const isEmail = Boolean(channel?.includes('Email'))
  const isWhatsapp = Boolean(channel?.includes('WhatsApp'))
  const isLlamada = Boolean(channel?.includes('Llamada'))

  if (actionType === 'comunicacion' && (isEmail || isWhatsapp)) {
    if (direccion === 'saliente') {
      // Tú lo envías, no hay cola — se oculta y se asume ≈0.
      return { show: false, label: '' }
    }
    return {
      show: true,
      label: isEmail ? '¿Cuánto queda sin atender?' : '¿Cuánto tardan en responder?',
    }
  }

  if ((actionType === 'comunicacion' && isLlamada) || actionType === 'llamada') {
    // La llamada es síncrona — la espera es solo para agendar/que contesten.
    return { show: true, label: 'Espera para agendar/que contesten', optional: true }
  }

  if (actionType === 'manual') {
    return { show: true, label: 'Espera antes de iniciar (si aplica)', optional: true }
  }

  if (actionType === 'sistema') {
    return { show: true, label: '¿Cuánto suele esperar en cola antes de atenderse?' }
  }

  if (actionType === 'decision') {
    // ✅ Autorización — aquí la espera suele ser EL cuello de botella real.
    return {
      show: true,
      label: '¿Cuánto se suele esperar al aprobador?',
      helperText: '⚠️ Esta espera suele ser crítica — a menudo el mayor desperdicio del proceso.',
      critical: true,
    }
  }

  if (actionType === 'documento') {
    return { show: true, label: 'Espera antes de procesarlo', optional: true }
  }

  // 'bloqueo' u otros tipos no cubiertos explícitamente en la tabla.
  return { show: true, label: 'Tiempo de espera', optional: true }
}

/** Etiqueta del campo de esfuerzo activo — la llamada telefónica es su propia duración. */
export const tiempoActivoLabel = (actionType: ActionType, channel: string | undefined): string =>
  actionType === 'llamada' || (actionType === 'comunicacion' && channel?.includes('Llamada'))
    ? 'Duración de la llamada (min)'
    : '¿Cuánto tiempo REAL toma? (esfuerzo activo, min)'

// --- Cambio 5: cálculos derivados a nivel PROCESO ---

/** ⏳ Tiempo calendario total del proceso = suma del tiempo total de cada paso. */
export const tiempoTotalProceso = (steps: ProcessStepRecord[]): number =>
  steps.reduce((sum, s) => sum + tiempoTotalPaso(s.tiempos), 0)

/** 💪 Esfuerzo real total = suma SOLO de tiempoActivoMin (sin esperas). */
export const esfuerzoTotalProceso = (steps: ProcessStepRecord[]): number =>
  steps.reduce((sum, s) => sum + s.tiempos.tiempoActivoMin, 0)

/** ⏳ Desperdicio total = suma de TODAS las esperas — métrica clave del FDE:
 * exactamente lo que un agente de IA (24/7, sin colas) podría eliminar. */
export const desperdicioTotal = (steps: ProcessStepRecord[]): number =>
  steps.reduce((sum, s) => sum + (s.tiempos.tiempoEsperaMin ?? 0), 0)

// --- Cambio 6: migración de pasos legacy con un solo `estMinutes` ---

interface LegacyProcessStepRecord {
  estMinutes?: number
  tiempos?: TiemposPaso
  [key: string]: unknown
}

/**
 * Migra un paso legacy (un solo `estMinutes`) al nuevo modelo `tiempos`:
 * copia el valor a `tiempoActivoMin`, deja `tiempoEsperaMin` en undefined y
 * los timestamps reales en null (Cambio 6 del pedido). Idempotente — si el
 * paso ya trae `tiempos`, lo deja intacto y solo limpia el campo legacy.
 */
export const migrateStepToTiempos = <T extends LegacyProcessStepRecord>(
  step: T,
): Omit<T, 'estMinutes' | 'tiempos'> & { tiempos: TiemposPaso } => {
  const { estMinutes, tiempos, ...rest } = step
  return {
    ...rest,
    tiempos: tiempos ?? emptyTiempos(typeof estMinutes === 'number' ? estMinutes : 0),
  } as Omit<T, 'estMinutes' | 'tiempos'> & { tiempos: TiemposPaso }
}

/** Aplica migrateStepToTiempos a todos los pasos de una lista (ej. al cargar un proceso legacy). */
export const migrateProcessSteps = <T extends LegacyProcessStepRecord>(steps: T[]) => steps.map(migrateStepToTiempos)
