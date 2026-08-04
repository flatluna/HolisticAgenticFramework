import type { DataSystemLocation } from '../state/deepDiveStore'

export const emptyDataSystemLocation = (): DataSystemLocation => ({
  sistema: '',
  modulo: '',
  transaccionCodigo: '',
  transaccionNombre: '',
  campoPantalla: '',
  campoTecnico: '',
  accion: '',
  viaAPI: '',
  notasViaAPI: '',
})
