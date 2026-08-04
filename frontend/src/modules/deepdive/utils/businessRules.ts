import type { BusinessRule } from '../state/deepDiveStore'
import { COMPLIANCE_RULE_SOURCE, TACIT_KNOWLEDGE_SOURCE } from '../data/catalogs'

export const emptyRule = (): BusinessRule => ({
  id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  description: '',
  owner: '',
  source: '',
  origin: '',
  isDocumented: true,
  flexibility: '',
})

// Una regla "en riesgo" es insumo contable para el diagnóstico del Paso 4
// ("3 reglas no documentadas detectadas"). Compartido entre las reglas de
// paso/dato (L3) y las reglas globales del diccionario de datos.
export const isTribalRisk = (rule: BusinessRule) => !rule.isDocumented || rule.source === TACIT_KNOWLEDGE_SOURCE
export const isComplianceRisk = (rule: BusinessRule) => rule.source === COMPLIANCE_RULE_SOURCE
