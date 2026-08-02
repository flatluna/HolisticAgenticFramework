import { useEffect, useState } from 'react'
import { getCompanyProfile, lookupClientOrganizationByName } from './services/api'

const EMPRESA_STORAGE_KEY = 'aetp.empresa.perfil'
const TEST_COMPANY_NAME = 'ACUMEN'

interface EmpresaContext {
  engagementId?: string
}

const readEngagementId = (): string | null => {
  const raw = localStorage.getItem(EMPRESA_STORAGE_KEY)
  if (!raw) return null
  try {
    return (JSON.parse(raw) as EmpresaContext).engagementId ?? null
  } catch {
    return null
  }
}

// Ensures the ACUMEN test-company context (engagementId, companyProfileId,
// etc.) is present in localStorage before any Fundamento section reads it.
// This used to run only inside the overview page ('/'), so landing directly
// on a route like /fundamento/empresa (bookmark, refresh, direct link)
// skipped it entirely and every section mounted empty. Every Fundamento
// page now calls this hook before rendering its section component.
export const useAcumenBootstrap = (): boolean => {
  const [ready, setReady] = useState(() => readEngagementId() !== null)

  useEffect(() => {
    if (ready) return
    let cancelled = false

    const bootstrap = async () => {
      try {
        const lookup = await lookupClientOrganizationByName(TEST_COMPANY_NAME)
        if (cancelled || !lookup.engagementId || !lookup.companyProfileId) return

        await getCompanyProfile(lookup.engagementId)
        if (cancelled) return

        localStorage.setItem(
          EMPRESA_STORAGE_KEY,
          JSON.stringify({
            clientOrganizationId: lookup.clientOrganizationId,
            engagementId: lookup.engagementId,
            companyProfileId: lookup.companyProfileId,
            nombre: TEST_COMPANY_NAME,
            industria: '',
          }),
        )
        window.dispatchEvent(new Event('empresa-perfil-updated'))
      } catch {
        // Non-blocking: if the lookup fails (no test company yet), sections
        // just start empty in creation mode.
      } finally {
        if (!cancelled) setReady(true)
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return ready
}
