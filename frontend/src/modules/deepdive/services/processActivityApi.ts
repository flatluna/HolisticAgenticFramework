import { clientEngagementApi } from '@/modules/strategy/services/api'

// Wrappers mínimos sobre los endpoints reales de ProcessActivity (🪜 Paso) y
// ActivityInteraction (📥 Fuente) — ver
// backend/.../Functions/ProcessActivityFunctions.cs. Usados para persistir
// el Deep Dive local (ver state/deepDiveStore.ts) contra el backend real,
// para que el DocumentExtractionAgent tenga IDs verdaderos
// (activityId/sourceId) a los cuales atar la subida de PDF.

export interface ProcessActivityDto {
  id: string
  engagementId: string
  processId: string
  sequenceOrder: number
  name: string
  createdAt: string
  updatedAt?: string | null
}

export interface CreateProcessActivityRequest {
  sequenceOrder: number
  name: string
}

export const createProcessActivity = async (
  processId: string,
  data: CreateProcessActivityRequest,
): Promise<ProcessActivityDto> => {
  const response = await clientEngagementApi.post(`/processes/${processId}/activities`, data)
  return response.data
}

export const updateProcessActivity = async (
  activityId: string,
  data: CreateProcessActivityRequest,
): Promise<ProcessActivityDto> => {
  const response = await clientEngagementApi.put(`/activities/${activityId}`, data)
  return response.data
}

export const listProcessActivities = async (processId: string): Promise<ProcessActivityDto[]> => {
  const response = await clientEngagementApi.get(`/processes/${processId}/activities`)
  return response.data
}

export interface ActivityInteractionDto {
  id: string
  engagementId: string
  activityId: string
  sequenceOrder: number
  channel: string
  contentExample?: string | null
  createdAt: string
  updatedAt?: string | null
}

export interface CreateActivityInteractionRequest {
  sequenceOrder: number
  /** Email | WhatsApp | Slack | Teams | Phone | InPerson | EnterpriseSystem | Other */
  channel: string
  contentExample?: string
}

export const createActivityInteraction = async (
  activityId: string,
  data: CreateActivityInteractionRequest,
): Promise<ActivityInteractionDto> => {
  const response = await clientEngagementApi.post(`/activities/${activityId}/interactions`, data)
  return response.data
}

export const listActivityInteractions = async (activityId: string): Promise<ActivityInteractionDto[]> => {
  const response = await clientEngagementApi.get(`/activities/${activityId}/interactions`)
  return response.data
}
