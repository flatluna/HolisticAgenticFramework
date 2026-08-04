import { clientEngagementApi } from '@/modules/strategy/services/api'

// "✨ Sugerir con IA" en "Crear nuevo dato en diccionario" — llama al agente
// de IA (Microsoft Agent Framework + Grounding with Bing Search, ver
// DataDictionarySuggestionAgent en el backend) que propone una entrada
// completa del diccionario a partir de una descripción corta del dato
// (ej. "RFC en México"). SIEMPRE es una propuesta para que el humano
// revise/edite antes de guardar — nunca se aplica automáticamente.

export interface DataDictionaryRuleSuggestionDto {
  description: string
  owner?: string | null
  source?: string | null
}

export interface DataDictionarySuggestionDto {
  officialName: string
  technicalName?: string | null
  synonyms: string[]
  dataType: string
  description?: string | null
  format?: string | null
  isPII: boolean
  suggestedOwner?: string | null
  possibleSourceSystems: string[]
  legalReferences: string[]
  bestPractices: string[]
  businessRules: DataDictionaryRuleSuggestionDto[]
}

export const suggestDataDictionaryEntry = async (description: string): Promise<DataDictionarySuggestionDto> => {
  const { data } = await clientEngagementApi.post<DataDictionarySuggestionDto>('/data-dictionary/suggest', {
    description,
  })
  return data
}
