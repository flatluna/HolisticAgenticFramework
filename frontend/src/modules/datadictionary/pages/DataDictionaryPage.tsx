import { DataDictionaryBrowser } from '../components/DataDictionaryBrowser'

// /diccionario-datos — página dedicada con el ciclo completo de
// agregar/editar/eliminar. La lógica de búsqueda/lista/ficha vive en
// DataDictionaryBrowser (reutilizada también, en modo solo-lectura, por el
// tab global "📚 Diccionario" — ver Layout.tsx).
export const DataDictionaryPage = () => <DataDictionaryBrowser />
