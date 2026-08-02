import { clientEngagementApi } from '@/modules/strategy/services/api'
import { MaturityLevel } from './pillarsData'

export interface OrganizationalReadinessPillarDto {
  id: string
  engagementId: string
  pillarId: string
  level: MaturityLevel | null
  notes: string | null
  evidenceGroupsJson: string
  createdAt: string
  updatedAt?: string | null
}

export interface OrganizationalReadinessPillarRequest {
  pillarId: string
  level: MaturityLevel | null
  notes: string | null
  evidenceGroupsJson: string
}

export const getOrganizationalReadiness = async (engagementId: string): Promise<OrganizationalReadinessPillarDto[]> => {
  const response = await clientEngagementApi.get(`/engagements/${engagementId}/organizational-readiness`)
  return response.data
}

export const saveOrganizationalReadiness = async (
  engagementId: string,
  pillars: OrganizationalReadinessPillarRequest[],
): Promise<OrganizationalReadinessPillarDto[]> => {
  const response = await clientEngagementApi.post(`/engagements/${engagementId}/organizational-readiness/bulk`, {
    pillars,
  })
  return response.data
}
