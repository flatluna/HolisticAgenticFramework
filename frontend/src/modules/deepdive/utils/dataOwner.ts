import type { DataOwner } from '../state/deepDiveStore'

export const emptyDataOwner = (): DataOwner => ({
  nombre: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  departamento: '',
})
