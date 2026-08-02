import axios from 'axios'

const API_BASE_URL = (import.meta as any).env?.VITE_CLIENT_ENGAGEMENT_API_URL || 'http://localhost:7073/api'

export const clientEngagementApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface CreateClientOrganizationRequest {
  name: string
  industry?: string
  country?: string
  employeeCount?: number
}

export interface ClientOrganizationDto {
  id: string
  name: string
  industry?: string
  country?: string
  employeeCount?: number
  status: string
  createdAt: string
}

export interface CreateEngagementRequest {
  name: string
  description?: string
}

export interface EngagementDto {
  id: string
  clientOrganizationId: string
  name: string
  description?: string
  status: string
  createdAt: string
}

export interface CreateCompanyProfileRequest {
  clientOrganizationId: string
  headquartersStreet?: string
  headquartersNeighborhood?: string
  headquartersCity?: string
  headquartersState?: string
  headquartersCountry?: string
  headquartersPostalCode?: string
  phoneCountryCode?: string
  phone?: string
  annualRevenue?: number
  totalEmployees?: number
  cloudAdoptionScore?: number
  dataMaturityScore?: number
  aiAdoptionScore?: number
  geographicMarkets?: string
  keyProducts?: string
}

export interface UpdateCompanyProfileRequest {
  headquartersStreet?: string
  headquartersNeighborhood?: string
  headquartersCity?: string
  headquartersState?: string
  headquartersCountry?: string
  headquartersPostalCode?: string
  phoneCountryCode?: string
  phone?: string
  annualRevenue?: number
  totalEmployees?: number
  cloudAdoptionScore?: number
  dataMaturityScore?: number
  aiAdoptionScore?: number
  geographicMarkets?: string
  keyProducts?: string
  status?: string
}

export interface CompanyProfileDto {
  id: string
  engagementId: string
  clientOrganizationId: string
  headquartersStreet?: string
  headquartersNeighborhood?: string
  headquartersCity?: string
  headquartersState?: string
  headquartersCountry?: string
  headquartersPostalCode?: string
  phoneCountryCode?: string
  phone?: string
  annualRevenue?: number
  totalEmployees?: number
  geographicMarkets?: string
  keyProducts?: string
  status: string
  createdAt: string
  updatedAt?: string
}

export const createClientOrganization = async (
  request: CreateClientOrganizationRequest,
): Promise<ClientOrganizationDto> => {
  const response = await clientEngagementApi.post<ClientOrganizationDto>('/clients', request)
  return response.data
}

export interface LookupClientOrganizationResult {
  clientOrganizationId: string
  engagementId: string | null
  companyProfileId: string | null
}

export const lookupClientOrganizationByName = async (
  name: string,
): Promise<LookupClientOrganizationResult> => {
  const response = await clientEngagementApi.get<LookupClientOrganizationResult>(
    `/clients/lookup/${encodeURIComponent(name)}`,
  )
  return response.data
}

// Alternative lookup function using the new endpoint path
export const lookupClientOrganizationByNameV2 = async (
  name: string,
): Promise<LookupClientOrganizationResult> => {
  try {
    const response = await fetch(
      `http://localhost:7073/api/clientengagements/clients/lookup/${encodeURIComponent(name)}`,
    )
    if (!response.ok) {
      return { clientOrganizationId: '', engagementId: null, companyProfileId: null }
    }
    return await response.json()
  } catch (error) {
    console.error('Error looking up client:', error)
    return { clientOrganizationId: '', engagementId: null, companyProfileId: null }
  }
}

export const createEngagement = async (
  clientId: string,
  request: CreateEngagementRequest,
): Promise<EngagementDto> => {
  const response = await clientEngagementApi.post<EngagementDto>(`/clients/${clientId}/engagements`, request)
  return response.data
}

export const createCompanyProfile = async (
  engagementId: string,
  request: CreateCompanyProfileRequest,
): Promise<CompanyProfileDto> => {
  const response = await clientEngagementApi.post<CompanyProfileDto>(`/engagements/${engagementId}/company-profile`, request)
  return response.data
}

export const getCompanyProfile = async (engagementId: string): Promise<CompanyProfileDto> => {
  const response = await clientEngagementApi.get<CompanyProfileDto>(`/engagements/${engagementId}/company-profile`)
  return response.data
}

export const updateCompanyProfile = async (
  engagementId: string,
  companyProfileId: string,
  request: UpdateCompanyProfileRequest,
): Promise<CompanyProfileDto> => {
  const response = await clientEngagementApi.put<CompanyProfileDto>(
    `/engagements/${engagementId}/company-profile/${companyProfileId}`,
    request,
  )
  return response.data
}

export interface OrgChartPersonNode {
  name: string
  position: string
  reportsTo?: string | null
  level: number
}

export interface OrgChartExtractionResult {
  people: OrgChartPersonNode[]
}

// Sube una imagen de organigrama al agente de IA (Microsoft Agent Framework)
// y devuelve la jerarquía organizacional extraída (nombre, puesto, a quién
// reporta y nivel), lista para poblar la tabla de roles. El backend guarda
// además la imagen original en Data Lake/Blob Storage (best-effort, para
// auditoría/reprocesamiento) vinculada al engagement indicado.
export const extractOrgChart = async (file: File, engagementId: string): Promise<OrgChartExtractionResult> => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await clientEngagementApi.post<OrgChartExtractionResult>(
    `/engagements/${engagementId}/org-chart/extract`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return response.data
}

// Descarga la imagen original del organigrama (la última subida) guardada
// en Data Lake para este engagement, y dispara la descarga en el navegador.
export const downloadOrgChartImage = async (engagementId: string): Promise<void> => {
  const response = await clientEngagementApi.get(`/engagements/${engagementId}/org-chart/image`, {
    responseType: 'blob',
  })

  const contentDisposition = response.headers['content-disposition'] as string | undefined
  const fileNameMatch = contentDisposition?.match(/filename="?([^"]+)"?/)
  const fileName = fileNameMatch?.[1] ?? 'organigrama.png'

  const url = window.URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export interface StakeholderDto {
  id: string
  engagementId: string
  name: string
  email?: string
  role?: string
  position?: string
  hierarchyLevel?: string
  reportsTo?: string
  replicaTo?: string
  responsibilities?: string
  status: string
  createdAt: string
  updatedAt?: string
}

export interface OrgRoleRequest {
  name: string
  position?: string
  hierarchyLevel?: string
  reportsTo?: string
  replicaTo?: string
  responsibilities?: string
}

export interface MandateStakeholderItem {
  stakeholder: string
  role: string
}

export interface EngagementMandateDto {
  engagementId: string
  title?: string
  objective?: string
  includedScope?: string
  excludedScope?: string
  executiveSponsor?: string
  sponsorResponsibilities?: string
  expectedOutcomes?: string
  successCriteria?: string
  horizonMinMonths?: number
  horizonMaxMonths?: number
  revenueGrowthTargetPct?: number
  costReductionTargetPct?: number
  productivityImprovementTargetPct?: number
  slaImprovementTargetPct?: number
  stakeholders: MandateStakeholderItem[]
  createdAt: string
  updatedAt?: string
}

export interface SaveEngagementMandateRequest {
  title?: string
  objective?: string
  includedScope?: string
  excludedScope?: string
  executiveSponsor?: string
  sponsorResponsibilities?: string
  expectedOutcomes?: string
  successCriteria?: string
  horizonMinMonths?: number
  horizonMaxMonths?: number
  revenueGrowthTargetPct?: number
  costReductionTargetPct?: number
  productivityImprovementTargetPct?: number
  slaImprovementTargetPct?: number
  stakeholders: MandateStakeholderItem[]
}

export interface EngagementMissionVisionDto {
  engagementId: string
  strategyTitle?: string
  companyName?: string
  sector?: string
  directionGeneral?: string
  mission?: string
  vision?: string
  visionObjetivo?: string
  automationTargets: {
    atencionCliente?: number
    finanzas?: number
    recursosHumanos?: number
    marketing?: number
    ventas?: number
    operaciones?: number
    analiticaReportes?: number
  }
  valorActual: string[]
  clientesObjetivo: string[]
  crecimiento: string[]
  eficiencia: string[]
  calidad: string[]
  innovacion: string[]
  principles: string[]
  declaracionFinal?: string
  createdAt: string
  updatedAt?: string
}

export interface SaveEngagementMissionVisionRequest {
  strategyTitle?: string
  companyName?: string
  sector?: string
  directionGeneral?: string
  mission?: string
  vision?: string
  visionObjetivo?: string
  automationTargets: {
    atencionCliente?: number
    finanzas?: number
    recursosHumanos?: number
    marketing?: number
    ventas?: number
    operaciones?: number
    analiticaReportes?: number
  }
  valorActual: string[]
  clientesObjetivo: string[]
  crecimiento: string[]
  eficiencia: string[]
  calidad: string[]
  innovacion: string[]
  principles: string[]
  declaracionFinal?: string
}

export const getEngagementMissionVision = async (engagementId: string): Promise<EngagementMissionVisionDto> => {
  const response = await clientEngagementApi.get<EngagementMissionVisionDto>(
    `/engagements/${engagementId}/mission-vision`,
  )
  return response.data
}

export const saveEngagementMissionVision = async (
  engagementId: string,
  request: SaveEngagementMissionVisionRequest,
): Promise<EngagementMissionVisionDto> => {
  const response = await clientEngagementApi.put<EngagementMissionVisionDto>(
    `/engagements/${engagementId}/mission-vision`,
    request,
  )
  return response.data
}

export const getEngagementMandate = async (engagementId: string): Promise<EngagementMandateDto> => {
  const response = await clientEngagementApi.get<EngagementMandateDto>(`/engagements/${engagementId}/mandate`)
  return response.data
}

export const saveEngagementMandate = async (
  engagementId: string,
  request: SaveEngagementMandateRequest,
): Promise<EngagementMandateDto> => {
  const response = await clientEngagementApi.put<EngagementMandateDto>(`/engagements/${engagementId}/mandate`, request)
  return response.data
}

// Trae los roles de Org Design (Stakeholders) ya guardados para el engagement.
export const listStakeholders = async (engagementId: string): Promise<StakeholderDto[]> => {
  const response = await clientEngagementApi.get<StakeholderDto[]>(`/engagements/${engagementId}/stakeholders`)
  return response.data
}

// Reemplaza TODOS los roles de Org Design del engagement con los que se ven
// en pantalla (botón "Guardar todos"), en la tabla Stakeholders conectada a
// la empresa (vía Engagement -> ClientOrganization).
export const bulkSaveStakeholders = async (
  engagementId: string,
  roles: OrgRoleRequest[],
): Promise<StakeholderDto[]> => {
  const response = await clientEngagementApi.post<StakeholderDto[]>(
    `/engagements/${engagementId}/stakeholders/bulk`,
    { roles },
  )
  return response.data
}
