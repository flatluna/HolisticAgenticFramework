import { clientEngagementApi } from '@/modules/strategy/services/api'

// Cliente del flujo "📸 Extraer campos desde captura de pantalla" — ver
// backend/.../Functions/SystemFieldScreenshotFunctions.cs. Sube una imagen
// de una pantalla de un sistema (SAP u otro), arranca en background el
// flujo de dos agentes (visión + Bing Grounding) y hace polling hasta que
// termina — mismo patrón que uploadSourceDocument en documentExtractionApi.ts.
// NUNCA se envía/expone el valor realmente capturado en un campo, solo su
// nombre/estructura.

export interface SystemFieldCandidateDto {
  nombreCampo: string
  campoTecnico: string
  descripcion: string
  formato: string
  reglaNegocio: string
  fuenteGrounding: string
  encontradoEnGrounding: boolean
  /** "lee" | "captura" | "modifica" | "valida" — cómo se usa este campo en
   * esta pantalla (uso dentro de la app), inferido por el agente de visión. */
  accion: string
}

export const extractSystemFieldsFromScreenshot = async (
  file: File,
  systemName: string | undefined,
  onProgress?: (step: string) => void,
): Promise<{ sistemaDetectado?: string; campos: SystemFieldCandidateDto[] }> => {
  const formData = new FormData()
  formData.append('file', file)
  if (systemName) formData.append('systemName', systemName)

  const startResponse = await clientEngagementApi.post('/system-fields/extract-screenshot', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  const { runId } = startResponse.data as { runId: string; stage: string }

  const pollIntervalMs = 1500
  const maxAttempts = 200 // hasta 5 minutos

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))

    const statusResponse = await clientEngagementApi.get(`/system-fields/extract-screenshot/status/${runId}`)
    const status = statusResponse.data as {
      stage: 'Running' | 'Completed' | 'Failed'
      step?: string
      errorMessage?: string
      sistemaDetectado?: string
      result?: SystemFieldCandidateDto[]
    }

    if (status.stage === 'Running') {
      if (status.step) onProgress?.(status.step)
      continue
    }

    if (status.stage === 'Failed') {
      throw new Error(status.errorMessage ?? 'La extracción de campos falló')
    }

    if (status.result) {
      // El agente de visión a veces copia el label literal de la pantalla,
      // incluyendo ":" al final (ej. "Title:") — se normaliza aquí, en el
      // único punto de entrada, para que el nombre se vea limpio en toda la
      // UI y, más importante, para que la búsqueda de coincidencias en el
      // diccionario de datos (por nombre) no dependa de si un screenshot
      // trajo el ":" y otro no.
      const campos = status.result.map((campo) => ({ ...campo, nombreCampo: campo.nombreCampo.trim().replace(/:+$/, '').trim() }))
      return { sistemaDetectado: status.sistemaDetectado, campos }
    }
    throw new Error('La extracción de campos terminó sin resultado')
  }

  throw new Error('La extracción de campos tardó demasiado (tiempo de espera agotado)')
}
