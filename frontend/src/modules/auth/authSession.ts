// Sesión y "empresa registrada" - carga ACUMEN desde la API
// login -> home page de una empresa registrada en la BD

const SESSION_KEY = 'aetp.session.loggedIn'
const EMPRESA_STORAGE_KEY = 'aetp.empresa.perfil'
const API_BASE = 'http://localhost:7073/api'

export interface EmpresaRegistrada {
  nombre: string
  industria?: string
}

export interface ClientOrganization {
  id: string
  name: string
  industry?: string
  country?: string
  status: string
}

// Cargar ACUMEN desde la API
export const cargarEmpresasDesdeAPI = async (): Promise<ClientOrganization[]> => {
  try {
    const response = await fetch(`${API_BASE}/clients`)
    if (!response.ok) {
      console.error('Error fetching clients:', response.statusText)
      return []
    }
    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error loading companies from API:', error)
    return []
  }
}

// Guardar empresa en localStorage
export const guardarEmpresa = (empresa: ClientOrganization): void => {
  const empresaData: EmpresaRegistrada = {
    nombre: empresa.name,
    industria: empresa.industry
  }
  localStorage.setItem(EMPRESA_STORAGE_KEY, JSON.stringify(empresaData))
}

export const getEmpresaRegistrada = (): EmpresaRegistrada | null => {
  const raw = localStorage.getItem(EMPRESA_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed?.nombre) return null
    return { nombre: parsed.nombre, industria: parsed.industria }
  } catch {
    return null
  }
}

export const isLoggedIn = (): boolean => sessionStorage.getItem(SESSION_KEY) === 'true'

export const login = async (): Promise<void> => {
  // Cargar empresas desde la API
  const empresas = await cargarEmpresasDesdeAPI()
  
  // Guardar la primera empresa (ACUMEN) en localStorage
  if (empresas.length > 0) {
    guardarEmpresa(empresas[0])
  }
  
  sessionStorage.setItem(SESSION_KEY, 'true')
}

export const logout = (): void => {
  sessionStorage.removeItem(SESSION_KEY)
}
