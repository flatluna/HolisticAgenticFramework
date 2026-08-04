import type { ProcessStepRecord, BusinessRule } from '../state/deepDiveStore'
import { isComplianceRisk, isTribalRisk } from './businessRules'
import { tiempoTotalPaso } from './tiempos'

export { tiempoTotalProceso, esfuerzoTotalProceso, desperdicioTotal } from './tiempos'

// Todas las reglas de un paso viven en dos niveles: colgadas de cada dato
// (stepData[].rules) o a nivel del paso completo (stepRules) — esta helper
// las junta para contadores y badges que no distinguen nivel. Compartida
// entre la página de captura, la vista general (tarjetas) y el grafo del
// proceso, para que los tres usen exactamente el mismo cálculo.
export const collectStepRules = (step: ProcessStepRecord): BusinessRule[] => [
  ...(step.stepData ?? []).flatMap((d) => d.rules),
  ...(step.stepRules ?? []),
]

export interface StepStats {
  dataCount: number
  ruleCount: number
  undocumentedCount: number
  complianceCount: number
  systems: string[]
  tiempoTotalMin: number
}

// Stats resumidas de UN paso — usadas por las tarjetas de la vista general
// ("# de datos · # de reglas · # reglas no documentadas ⚠️ · sistema(s)
// principal(es)") y por los nodos del grafo de flujo (mismo cálculo, una
// sola fuente de verdad).
export const computeStepStats = (step: ProcessStepRecord): StepStats => {
  const rules = collectStepRules(step)
  const systems = Array.from(
    new Set(
      (step.stepData ?? [])
        .map((d) => d.systemLocation?.sistema?.trim())
        .filter((s): s is string => Boolean(s)),
    ),
  )
  return {
    dataCount: (step.stepData ?? []).length,
    ruleCount: rules.length,
    undocumentedCount: rules.filter(isTribalRisk).length,
    complianceCount: rules.filter(isComplianceRisk).length,
    systems,
    tiempoTotalMin: tiempoTotalPaso(step.tiempos),
  }
}
