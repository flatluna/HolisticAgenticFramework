import { clientEngagementApi } from '@/modules/strategy/services/api'

// "🎯 Agente de Enriquecimiento de Campos SAP" — al capturar "🖥 Ubicación
// exacta en el sistema" con sistema=SAP, este servicio llama al agente de
// IA (Microsoft Agent Framework + Grounding with Bing Search, ver
// SapFieldEnrichmentAgent en el backend) que investiga qué es un campo
// técnico de SAP (ej. "KLIMK") y propone descripción/formato/regla de
// negocio fundamentados en fuentes reales. El backend cachea el resultado
// en SQL (global para campos estándar, por engagement para campos custom
// "Z*") — por eso se envía engagementId siempre, aunque solo se use para
// los custom. SIEMPRE es una propuesta para que el asesor revise antes de
// aceptar.

export interface SapFieldEnrichmentDto {
  nombreCampo: string
  descripcion: string
  formato: string
  reglaNegocio: string
  fuenteGrounding: string
  encontradoEnGrounding: boolean
  fromCache: boolean
}

export const enrichSapField = async (
  fieldName: string,
  engagementId: string | null,
  forceRefresh = false,
): Promise<SapFieldEnrichmentDto> => {
  const { data } = await clientEngagementApi.post<SapFieldEnrichmentDto>('/sap-fields/enrich', {
    fieldName,
    engagementId,
    forceRefresh,
  })
  return data
}
