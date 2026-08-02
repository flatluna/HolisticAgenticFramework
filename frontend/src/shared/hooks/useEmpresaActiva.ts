import { useEffect, useState } from 'react'

const EMPRESA_STORAGE_KEY = 'aetp.empresa.perfil'

const readNombreEmpresa = (): string | null => {
  const raw = localStorage.getItem(EMPRESA_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as { nombre?: string }
    return parsed.nombre || null
  } catch {
    return null
  }
}

// engagementId de la empresa activa (mismo localStorage que EmpresaSection
// usa para persistir clientOrganizationId/engagementId/companyProfileId),
// necesario para que cualquier módulo (ej. el assessment de Paso 1) sepa a
// qué engagement guardar sus datos sin depender de un route param.
export const getActiveEngagementId = (): string | null => {
  const raw = localStorage.getItem(EMPRESA_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as { engagementId?: string }
    return parsed.engagementId || null
  } catch {
    return null
  }
}

// Nombre de la empresa activa (persistido por EmpresaSection en localStorage),
// compartido por cualquier pieza de UI que necesite mostrarlo (TopInfoBar,
// breadcrumbs, etc.) sin depender de un route param o contexto dedicado.
export const useEmpresaActiva = (): string | null => {
  const [nombre, setNombre] = useState<string | null>(() => readNombreEmpresa())

  useEffect(() => {
    const refrescar = () => setNombre(readNombreEmpresa())
    window.addEventListener('empresa-perfil-updated', refrescar)
    window.addEventListener('storage', refrescar)
    return () => {
      window.removeEventListener('empresa-perfil-updated', refrescar)
      window.removeEventListener('storage', refrescar)
    }
  }, [])

  return nombre
}
