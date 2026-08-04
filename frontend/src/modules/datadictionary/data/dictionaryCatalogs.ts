import type { CanonicalDataType } from '../state/dataDictionaryStore'

export interface DataTypeOption {
  value: CanonicalDataType
  label: string
}

// Tipo de dato de una entrada canónica del diccionario.
export const DATA_TYPES: DataTypeOption[] = [
  { value: 'texto', label: 'Texto' },
  { value: 'numero', label: 'Número' },
  { value: 'fecha', label: 'Fecha' },
  { value: 'booleano', label: 'Booleano' },
  { value: 'identificador', label: 'Identificador' },
  { value: 'monto', label: 'Monto' },
  { value: 'documento', label: 'Documento' },
  { value: 'otro', label: 'Otro' },
]

export const dataTypeLabel = (value: CanonicalDataType | '') => DATA_TYPES.find((t) => t.value === value)?.label ?? '—'
