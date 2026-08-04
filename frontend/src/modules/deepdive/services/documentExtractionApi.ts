import { clientEngagementApi } from '@/modules/strategy/services/api'

// Cliente del DocumentExtractionAgent — ver
// backend/.../Functions/DocumentExtractionFunctions.cs. Sube el PDF de una
// 📄 Fuente no estructurada (ActivityInteraction) dentro de un 🪜 Paso
// (ProcessActivity), arranca la extracción de IA en background, y hace
// polling hasta que termina — mismo patrón que uploadProcessDocument en
// modules/madurez/decisions/decisionApi.ts.

export interface ExtractedDataPointDto {
  key: string
  value: string
  dataType: string
}

export interface ExtractedEntityDto {
  type: string
  text: string
}

export interface BusinessRuleDto {
  name: string
  description: string
}

export interface ExtractedRelationshipDto {
  fromNode: string
  relationType: string
  toNode: string
}

export interface DocumentExtractionDto {
  id: string
  engagementId: string
  processId: string
  activityId: string
  sourceId: string
  fileName: string
  contentType?: string | null
  fileSizeBytes: number
  blobPath?: string | null
  documentFormat?: string | null
  documentCreatedAt?: string | null
  documentModifiedAt?: string | null
  author?: string | null
  detectedLanguage?: string | null
  extractedData: ExtractedDataPointDto[]
  entities: ExtractedEntityDto[]
  businessRules: BusinessRuleDto[]
  relationships: ExtractedRelationshipDto[]
  contentDescription?: string | null
  pageCount: number
  executiveSummary?: string | null
  extractionStatus: string
  extractionError?: string | null
  extractedAt?: string | null
  extractionModel?: string | null
  createdAt: string
}

export const uploadSourceDocument = async (
  activityId: string,
  sourceId: string,
  file: File,
  onProgress?: (step: string) => void,
): Promise<DocumentExtractionDto> => {
  const formData = new FormData()
  formData.append('file', file)
  const startResponse = await clientEngagementApi.post(
    `/activities/${activityId}/sources/${sourceId}/documents`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )

  const { runId } = startResponse.data as { runId: string; documentExtractionId: string; stage: string }

  const pollIntervalMs = 2000
  const maxAttempts = 300 // hasta 10 minutos

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))

    const statusResponse = await clientEngagementApi.get(
      `/activities/${activityId}/sources/${sourceId}/documents/status/${runId}`,
    )
    const status = statusResponse.data as {
      stage: 'Running' | 'Completed' | 'Failed'
      step?: string
      errorMessage?: string
      result?: DocumentExtractionDto
    }

    if (status.stage === 'Running') {
      if (status.step) onProgress?.(status.step)
      continue
    }

    if (status.stage === 'Failed') {
      throw new Error(status.errorMessage ?? 'La extracción del documento falló')
    }

    if (status.result) return status.result
    throw new Error('La extracción del documento terminó sin resultado')
  }

  throw new Error('La extracción del documento tardó demasiado (tiempo de espera agotado)')
}

/** Lista todos los documentos extraídos para una Fuente dada — usado para
 * RECUPERAR extracciones ya completadas cuando el store local en memoria
 * (deepDiveStore) se reinició (recarga de página / HMR / navegación) y
 * perdió la referencia local a un PDF ya subido/procesado antes en esta
 * misma sesión. GET /api/activities/{activityId}/sources/{sourceId}/documents */
export const listSourceDocuments = async (
  activityId: string,
  sourceId: string,
): Promise<DocumentExtractionDto[]> => {
  const response = await clientEngagementApi.get(`/activities/${activityId}/sources/${sourceId}/documents`)
  return response.data
}

