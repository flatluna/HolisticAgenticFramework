import { clientEngagementApi } from '@/modules/strategy/services/api'

// Tipos que reflejan EXACTAMENTE el contrato JSON del agente
// "Agent-Readiness Process Architect" (snake_case, igual que el backend
// serializa AETP.Modules.ClientEngagement.Api.Agents.AgentReadinessResult).

export interface AgentReadinessMeta {
  process_name: string
  industry: string
  scope: string
  process_owner_role: string
  systems_involved: string[]
  source_type: string
  validation_status: string
  generated_by: string
  version: string
}

export interface ProcessStep {
  id: string
  name: string
  description: string
  role_responsible: string
  data_objects: string[]
  system?: string | null
  handoff_to?: string | null
  business_rules: string[]
  autonomy_level: number
  autonomy_reason: string
}

export interface ObjectRelationship {
  type: string
  target: string
  cardinality: string
}

export interface OntologyObject {
  id: string
  name: string
  attributes: string[]
  key_attributes: string[]
  source_system?: string | null
  source_table?: string | null
  classification: string
  origin_step?: string | null
  relationships: ObjectRelationship[]
  rules: string[]
}

export interface OntologyPrinciple {
  id: string
  statement: string
  connects_objects: string[]
}

export interface Ontology {
  objects: OntologyObject[]
  principles: OntologyPrinciple[]
  relationship_graph?: string | null
}

export interface BusinessRule {
  id: string
  statement: string
  applies_at_step?: string | null
  type: string
  guardrail_candidate: boolean
  action_if_fail?: string | null
}

export interface RoleInfo {
  name: string
  steps_executed: string[]
  objects_owned: string[]
  workshop_group?: string | null
}

export interface Handoff {
  id: string
  from: string
  to: string
  medium?: string | null
  risk: string
  integration_note?: string | null
}

export interface ProcessException {
  id: string
  type: string
  description: string
  frequency?: string | null
  status?: string | null
}

export interface OwnershipEntry {
  object_id: string
  data_owner_business?: string | null
  data_steward_operational?: string | null
}

export interface LineageQuestion {
  question: string
  traces?: string | null
}

export interface ClassificationSummary {
  classification: string
  objects: string[]
}

export interface DataGovernance {
  ownership_matrix: OwnershipEntry[]
  lineage_questions: LineageQuestion[]
  classification_summary: ClassificationSummary[]
}

export interface AccountabilityRole {
  governance_role: string
  assigned_to?: string | null
  responsibility?: string | null
}

export interface AutonomyMapEntry {
  step: string
  level: number
  reason?: string | null
}

export interface Guardrail {
  id: string
  rule_origin?: string | null
  rule: string
  action_if_fail?: string | null
  codified: boolean
}

export interface AiGovernance {
  accountability_roles: AccountabilityRole[]
  autonomy_map: AutonomyMapEntry[]
  guardrails: Guardrail[]
  human_only_steps: string[]
}

export interface AgentSkill {
  id: string
  name: string
  description?: string | null
  steps_covered: string[]
}

export interface AgentTool {
  id: string
  name: string
  skill_id?: string | null
  inputs: string[]
  outputs: string[]
  system_endpoint?: string | null
  guardrails: string[]
}

export interface ObservabilityEvent {
  event: string
  logged_data?: string | null
  audience?: string | null
}

export interface AgentDesign {
  skills: AgentSkill[]
  tools: AgentTool[]
  orchestration: string
  observability_events: ObservabilityEvent[]
}

export interface IntegrationItem {
  object_id: string
  system?: string | null
  access_method?: string | null
  latency?: string | null
  risk_flag?: string | null
}

export interface QuestionSource {
  system?: string | null
  table_or_endpoint?: string | null
  role_to_ask?: string | null
}

export type AssessmentQuestionType = 'AUTO' | 'BUSINESS' | 'GAP'

export interface AssessmentQuestion {
  id: string
  question: string
  type: AssessmentQuestionType
  source: QuestionSource
  target?: string | null
  unit?: string | null
  weight: number
  owner_role?: string | null
  linked_step?: string | null
  solution_hint?: string | null
  answer?: string | null
  status: string
}

export interface AssessmentDimension {
  dimension: string
  core_question?: string | null
  questions: AssessmentQuestion[]
}

export interface AssessmentInstrument {
  dimensions: AssessmentDimension[]
}

export interface Gap {
  id: string
  dimension: string
  as_is?: string | null
  target?: string | null
  severity: string
  value_type?: string | null
  solution?: string | null
  app_component?: string | null
  effort: string
  priority?: string | null
}

export interface GapEngine {
  gaps: Gap[]
}

export interface PreGap {
  question: string
  linked_step?: string | null
  flag: string
}

export interface Workshop {
  group: string
  audience_role?: string | null
  questions: string[]
  focus?: string | null
  duration_min: number
}

export interface Scoring {
  method: string
  rules: { unknown_gap: string; business_unanswered: string }
  dimension_status_legend: Record<string, string>
}

export interface AgentReadinessResult {
  meta: AgentReadinessMeta
  process: { steps: ProcessStep[] }
  ontology: Ontology
  business_rules: BusinessRule[]
  roles: RoleInfo[]
  handoffs: Handoff[]
  exceptions: ProcessException[]
  data_governance: DataGovernance
  ai_governance: AiGovernance
  agent_design: AgentDesign
  integration: IntegrationItem[]
  assessment_instrument: AssessmentInstrument
  gap_engine: GapEngine
  pre_gaps_recognized: PreGap[]
  workshops: Workshop[]
  scoring: Scoring
}

export interface AgentReadinessAssessmentDto {
  id: string
  processId: string
  fileName: string
  pageCount: number
  status: string
  errorMessage?: string | null
  result: AgentReadinessResult | null
  createdAt: string
}

// Sube el PDF completo del proceso para que el agente "Agent-Readiness
// Process Architect" lo analice en una sola pasada y genere el assessment
// completo. Igual que uploadProcessDocument: la extracción corre en segundo
// plano en el backend (puede tardar varios minutos en documentos largos) —
// esta función sube el archivo, arranca la extracción y hace polling del
// estado hasta que termine.
export const uploadAgentReadinessDocument = async (
  processId: string,
  file: File,
  onProgress?: (step: string) => void,
): Promise<AgentReadinessAssessmentDto> => {
  const formData = new FormData()
  formData.append('file', file)
  const startResponse = await clientEngagementApi.post(`/processes/${processId}/agent-readiness`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  const { runId } = startResponse.data as { runId: string; assessmentId: string; stage: string }

  const pollIntervalMs = 2000
  const maxAttempts = 300 // hasta 10 minutos

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))

    const statusResponse = await clientEngagementApi.get(`/processes/${processId}/agent-readiness/status/${runId}`)
    const status = statusResponse.data as {
      stage: 'Running' | 'Completed' | 'Failed'
      step?: string
      errorMessage?: string
      result?: AgentReadinessAssessmentDto
    }

    if (status.stage === 'Running') {
      if (status.step) onProgress?.(status.step)
      continue
    }

    if (status.stage === 'Failed') {
      throw new Error(status.errorMessage ?? 'La evaluación de Agent-Readiness falló')
    }

    if (status.result) return status.result
    throw new Error('La evaluación de Agent-Readiness terminó sin resultado')
  }

  throw new Error('La evaluación de Agent-Readiness tardó demasiado (tiempo de espera agotado)')
}

// Recupera la última evaluación de Agent-Readiness guardada para un proceso
// (si existe), para que recargar la página siga mostrando el resultado sin
// tener que volver a subir el PDF.
export const getLatestAgentReadinessAssessment = async (
  processId: string,
): Promise<AgentReadinessAssessmentDto | null> => {
  try {
    const response = await clientEngagementApi.get(`/processes/${processId}/agent-readiness`)
    return response.data
  } catch (err: any) {
    if (err?.response?.status === 404) return null
    throw err
  }
}
