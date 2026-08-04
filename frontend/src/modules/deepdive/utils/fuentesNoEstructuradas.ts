import type { FuenteNoEstructurada } from '../state/deepDiveStore'

export const emptyFuenteNoEstructurada = (): FuenteNoEstructurada => ({
  id: `fuente-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  tipo: 'email',
  descripcion: '',
  ejemploContenido: '',
  formato: '',
  notas: '',
  origen: '',
  asunto: '',
  adjuntos: [],
})
