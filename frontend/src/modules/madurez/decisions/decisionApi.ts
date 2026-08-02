import { clientEngagementApi } from '@/modules/strategy/services/api'

export interface DecisionFormData {
  // Información General
  processId: string
  name: string
  description?: string
  owner?: string
  // Clasificación
  decisionType: string
  frequency: string
  complexity: string
  // Estado Actual
  decisionMaker: string
  currentAutonomyLevel: string
  isRuleBased: string
  rulesDescription?: string
  rulesSource?: string
  dataAvailability: string
  inputDataUsed?: string
  // Potencial de Automatización
  targetAutonomyLevel: string
  automationPotential: string
  automationRisk?: string
  // Hallazgos
  mainProblems?: string
  mainOpportunities?: string
  observations?: string
  status?: string
}

export interface DecisionDto extends DecisionFormData {
  id: string
  engagementId: string
  createdAt: string
  updatedAt?: string | null
}

export interface DecisionSuggestion {
  name: string
  description?: string
  decisionType: string
  frequency: string
  complexity: string
  isRuleBased: string
  rulesDescription?: string
  inputDataUsed?: string
  dataAvailability: string
}

export const emptyDecisionForm = (processId = ''): DecisionFormData => ({
  processId,
  name: '',
  description: '',
  owner: '',
  decisionType: 'Operativa',
  frequency: 'Mensual',
  complexity: 'Media',
  decisionMaker: 'Humano',
  currentAutonomyLevel: 'L0',
  isRuleBased: 'No',
  rulesDescription: '',
  rulesSource: '',
  dataAvailability: 'No',
  inputDataUsed: '',
  targetAutonomyLevel: 'L0',
  automationPotential: 'Media',
  automationRisk: '',
  mainProblems: '',
  mainOpportunities: '',
  observations: '',
  status: 'Borrador',
})

// Convierte una sugerencia de IA en datos de formulario pre-llenados, listos
// para que el humano revise/edite antes de guardar.
export const suggestionToFormData = (processId: string, s: DecisionSuggestion): DecisionFormData => ({
  ...emptyDecisionForm(processId),
  name: s.name,
  description: s.description ?? '',
  decisionType: s.decisionType,
  frequency: s.frequency,
  complexity: s.complexity,
  isRuleBased: s.isRuleBased,
  rulesDescription: s.rulesDescription ?? '',
  inputDataUsed: s.inputDataUsed ?? '',
  dataAvailability: s.dataAvailability,
})

export const listDecisions = async (engagementId: string): Promise<DecisionDto[]> => {
  const response = await clientEngagementApi.get(`/engagements/${engagementId}/decisions`)
  return response.data
}

export const createDecision = async (engagementId: string, data: DecisionFormData): Promise<DecisionDto> => {
  const response = await clientEngagementApi.post(`/engagements/${engagementId}/decisions`, data)
  return response.data
}

export const updateDecision = async (decisionId: string, data: DecisionFormData): Promise<DecisionDto> => {
  const response = await clientEngagementApi.put(`/decisions/${decisionId}`, data)
  return response.data
}

// Pide al agente de IA una lista de decisiones candidatas para un proceso ya
// registrado, a partir de su texto (nombre/descripción/hallazgos). Nunca se
// guarda nada automáticamente — solo sugerencias para revisar.
export const suggestDecisions = async (processId: string): Promise<DecisionSuggestion[]> => {
  const response = await clientEngagementApi.post(`/processes/${processId}/decisions/suggest`)
  return response.data.suggestions
}

export interface ProcessDocumentPerson {
  name: string
  role?: string
}

// Resultado de subir el PDF completo de un proceso: el agente lee todo el
// documento de una sola vez y propone resumen ejecutivo, entidades
// mencionadas (personas/departamentos) y todas las decisiones candidatas.
// Igual que suggestDecisions, nada se guarda automáticamente.
export interface ProcessDocumentResult {
  id: string
  processId: string
  fileName: string
  pageCount: number
  extractionStatus: string
  extractionError?: string
  executiveSummary?: string
  people: ProcessDocumentPerson[]
  departments: string[]
  suggestions: DecisionSuggestion[]
  createdAt: string
}

// Sube el PDF completo de un proceso (hasta 20MB) para que el agente lo lea
// entero en una sola pasada (incluyendo imágenes embebidas, descritas por
// un modelo de visión), en vez de depender solo de la descripción corta del
// proceso.
//
// La extracción de IA corre en segundo plano en el backend (puede tardar
// varios minutos en documentos largos con muchas imágenes) — esta función
// sube el archivo, arranca la extracción, y luego hace polling del estado
// hasta que termine (Completed/Failed), para que el llamador siga viendo
// una única Promise que resuelve con el resultado final, sin cambiar su
// firma pública. `onProgress` (opcional) recibe una descripción corta del
// paso en curso (p.ej. "Describiendo imagen 2/5 (página 3)") para mostrar
// feedback en la UI mientras se espera.
export const uploadProcessDocument = async (
  processId: string,
  file: File,
  onProgress?: (step: string) => void,
): Promise<ProcessDocumentResult> => {
  const formData = new FormData()
  formData.append('file', file)
  const startResponse = await clientEngagementApi.post(`/processes/${processId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  const { runId } = startResponse.data as { runId: string; documentId: string; stage: string }

  const pollIntervalMs = 2000
  const maxAttempts = 300 // up to 10 minutes

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))

    const statusResponse = await clientEngagementApi.get(`/processes/${processId}/documents/status/${runId}`)
    const status = statusResponse.data as {
      stage: 'Running' | 'Completed' | 'Failed'
      step?: string
      errorMessage?: string
      result?: ProcessDocumentResult
    }

    if (status.stage === 'Running') {
      if (status.step) onProgress?.(status.step)
      continue
    }

    if (status.stage === 'Failed') {
      throw new Error(status.errorMessage ?? 'La extracción del documento falló')
    }

    if (status.result) return status.result
    throw new Error('La extracción del documento terminó sin resultado')
  }

  throw new Error('La extracción del documento tardó demasiado (tiempo de espera agotado)')
}

