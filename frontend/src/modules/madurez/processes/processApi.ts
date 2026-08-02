import { clientEngagementApi } from '@/modules/strategy/services/api'

export interface ProcessFormData {
  // Información General
  capabilityId: string
  name: string
  description?: string
  owner?: string
  // Estado de Documentación
  isDocumented: string
  isFormalized: string
  // Estado Actual
  currentAutonomyLevel: string
  criticality: string
  // Sistema origen de los datos del proceso (ej. dónde vive la orden de
  // compra u otro documento fuente): SAP, Oracle, Dynamics 365, un sistema
  // propio hecho por la empresa, etc.
  dataSourceSystem?: string
  dataSourceSystemOther?: string
  // Hallazgos
  mainProblems?: string
  mainOpportunities?: string
  observations?: string
  status?: string
}

export interface ProcessDto extends ProcessFormData {
  id: string
  engagementId: string
  createdAt: string
  updatedAt?: string | null
}

export const emptyProcessForm = (capabilityId = ''): ProcessFormData => ({
  capabilityId,
  name: '',
  description: '',
  owner: '',
  isDocumented: 'No',
  isFormalized: 'No',
  currentAutonomyLevel: 'L0',
  criticality: 'Media',
  dataSourceSystem: '',
  dataSourceSystemOther: '',
  mainProblems: '',
  mainOpportunities: '',
  observations: '',
  status: 'Borrador',
})

export const listProcesses = async (engagementId: string): Promise<ProcessDto[]> => {
  const response = await clientEngagementApi.get(`/engagements/${engagementId}/processes`)
  return response.data
}

export const createProcess = async (engagementId: string, data: ProcessFormData): Promise<ProcessDto> => {
  const response = await clientEngagementApi.post(`/engagements/${engagementId}/processes`, data)
  return response.data
}

export const updateProcess = async (processId: string, data: ProcessFormData): Promise<ProcessDto> => {
  const response = await clientEngagementApi.put(`/processes/${processId}`, data)
  return response.data
}

// Borra el proceso Y toda su data extraída de PDF (filas ProcessDocument +
// el archivo PDF en Blob/Data Lake Storage). No borra decisiones ya
// registradas para este proceso (quedan huérfanas si existieran).
export const deleteProcess = async (processId: string): Promise<void> => {
  await clientEngagementApi.delete(`/processes/${processId}`)
}
