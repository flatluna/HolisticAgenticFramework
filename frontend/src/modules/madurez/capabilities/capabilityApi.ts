import { clientEngagementApi } from '@/modules/strategy/services/api'

export interface CapabilityKpiInput {
  name: string
  currentValue?: number | null
  target?: number | null
  unit?: string
}

export interface CapabilityFormData {
  // Información general
  name: string
  description?: string
  businessDomain: string
  owner?: string
  responsibleArea?: string
  // Alineación estratégica
  relatedStrategicObjective?: string
  strategicPriority?: string
  businessContribution?: string
  expectedImpact?: string
  // Estado actual
  maturityLevel: number
  performanceLevel: number
  digitalizationLevel: number
  // KPIs
  kpis: CapabilityKpiInput[]
  // Preparación agentic
  automationPotentialPercent: number
  aiAgentPotential?: string
  targetAutonomyLevel: string
  // Hallazgos
  mainProblems?: string
  mainOpportunities?: string
  observations?: string
  status?: string
}

export interface CapabilityDto extends CapabilityFormData {
  id: string
  engagementId: string
  createdAt: string
  updatedAt?: string | null
}

export const emptyCapabilityForm = (): CapabilityFormData => ({
  name: '',
  description: '',
  businessDomain: '',
  owner: '',
  responsibleArea: '',
  relatedStrategicObjective: '',
  strategicPriority: 'Media',
  businessContribution: 'Habilitadora',
  expectedImpact: '',
  maturityLevel: 1,
  performanceLevel: 1,
  digitalizationLevel: 1,
  kpis: [],
  automationPotentialPercent: 0,
  aiAgentPotential: 'Medio',
  targetAutonomyLevel: 'L0',
  mainProblems: '',
  mainOpportunities: '',
  observations: '',
  status: 'Borrador',
})

export const listCapabilities = async (engagementId: string): Promise<CapabilityDto[]> => {
  const response = await clientEngagementApi.get(`/engagements/${engagementId}/capabilities`)
  return response.data
}

export const createCapability = async (engagementId: string, data: CapabilityFormData): Promise<CapabilityDto> => {
  const response = await clientEngagementApi.post(`/engagements/${engagementId}/capabilities`, data)
  return response.data
}

export const updateCapability = async (capabilityId: string, data: CapabilityFormData): Promise<CapabilityDto> => {
  const response = await clientEngagementApi.put(`/capabilities/${capabilityId}`, data)
  return response.data
}
