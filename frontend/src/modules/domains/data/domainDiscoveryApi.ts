import { clientEngagementApi } from '@/modules/strategy/services/api'

export interface DomainAssessmentDto {
  id: string
  engagementId: string
  domainId: string
  businessContext: string | null
  processInventoryJson: string
  systemsInventoryJson: string
  strategicValue: number | null
  transformPotential: number | null
  roi: number | null
  complexity: number | null
  urgency: number | null
  complexityAdjustmentOverride: number | null
  createdAt: string
  updatedAt?: string | null
}

export interface DomainAssessmentRequest {
  domainId: string
  businessContext: string | null
  processInventoryJson: string
  systemsInventoryJson: string
  strategicValue: number | null
  transformPotential: number | null
  roi: number | null
  complexity: number | null
  urgency: number | null
  complexityAdjustmentOverride: number | null
}

export interface DomainDiscoveryResponse {
  selectedIndustryId: string | null
  domains: DomainAssessmentDto[]
}

export const getDomainDiscovery = async (engagementId: string): Promise<DomainDiscoveryResponse> => {
  const response = await clientEngagementApi.get(`/engagements/${engagementId}/domain-discovery`)
  return response.data
}

export const saveDomainDiscoveryIndustry = async (
  engagementId: string,
  selectedIndustryId: string | null,
): Promise<{ selectedIndustryId: string | null }> => {
  const response = await clientEngagementApi.put(`/engagements/${engagementId}/domain-discovery/industry`, {
    selectedIndustryId,
  })
  return response.data
}

export const saveDomainAssessments = async (
  engagementId: string,
  domains: DomainAssessmentRequest[],
): Promise<DomainAssessmentDto[]> => {
  const response = await clientEngagementApi.post(`/engagements/${engagementId}/domain-discovery/bulk`, { domains })
  return response.data
}
