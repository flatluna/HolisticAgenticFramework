import axios from 'axios'

const API_BASE_URL = 'http://localhost:7073/api'

export interface Department {
  id?: string
  name: string
  description?: string
  budget?: number
}

export interface Location {
  id?: string
  name: string
  address?: string
  city?: string
  country?: string
}

export interface CompanyProfile {
  id?: string
  engagementId: string
  name: string
  industry?: string
  foundedYear?: number
  headquarters?: string
  employees?: number
  departments: Department[]
  locations: Location[]
}

export interface CompanyProfileRequest {
  name: string
  industry?: string
  foundedYear?: number
  headquarters?: string
  employees?: number
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const companyProfileAPI = {
  // Company Profile endpoints
  getCompanyProfile: async (engagementId: string): Promise<CompanyProfile> => {
    const response = await apiClient.get(`/engagements/${engagementId}/company-profile`)
    return response.data
  },

  createCompanyProfile: async (
    engagementId: string,
    data: CompanyProfileRequest
  ): Promise<CompanyProfile> => {
    const response = await apiClient.post(
      `/engagements/${engagementId}/company-profile`,
      data
    )
    return response.data
  },

  updateCompanyProfile: async (
    engagementId: string,
    profileId: string,
    data: CompanyProfileRequest
  ): Promise<CompanyProfile> => {
    const response = await apiClient.put(
      `/engagements/${engagementId}/company-profile/${profileId}`,
      data
    )
    return response.data
  },

  // Department endpoints
  addDepartment: async (
    engagementId: string,
    companyProfileId: string,
    data: Department
  ): Promise<Department> => {
    const response = await apiClient.post(
      `/engagements/${engagementId}/company-profile/${companyProfileId}/departments`,
      data
    )
    return response.data
  },

  updateDepartment: async (
    engagementId: string,
    departmentId: string,
    data: Department
  ): Promise<Department> => {
    const response = await apiClient.put(
      `/engagements/${engagementId}/departments/${departmentId}`,
      data
    )
    return response.data
  },

  deleteDepartment: async (engagementId: string, departmentId: string): Promise<void> => {
    await apiClient.delete(`/engagements/${engagementId}/departments/${departmentId}`)
  },

  // Location endpoints
  addLocation: async (
    engagementId: string,
    companyProfileId: string,
    data: Location
  ): Promise<Location> => {
    const response = await apiClient.post(
      `/engagements/${engagementId}/company-profile/${companyProfileId}/locations`,
      data
    )
    return response.data
  },

  updateLocation: async (
    engagementId: string,
    locationId: string,
    data: Location
  ): Promise<Location> => {
    const response = await apiClient.put(
      `/engagements/${engagementId}/locations/${locationId}`,
      data
    )
    return response.data
  },

  deleteLocation: async (engagementId: string, locationId: string): Promise<void> => {
    await apiClient.delete(`/engagements/${engagementId}/locations/${locationId}`)
  },
}
