// Catálogos y enums del formulario de captura de pasos (L3 · Deep Dive de
// Procesos). Mantenidos como constantes reutilizables — nunca hardcodeados
// en el JSX — tal como se especificó. Si el negocio pide agregar/quitar
// valores, este es el único archivo que hay que tocar.

// §WIZARD — las 4 etapas del wizard de captura de pasos, cada una con su
// color identitario (claro/oscuro) usado en el stepper superior, el header
// de la etapa y sus acentos (ver StepWizardStepper.tsx y StepCapturePage.tsx).
export type WizardStageKey = 'basico' | 'accion' | 'datos' | 'reglas'

export interface WizardStageMeta {
  key: WizardStageKey
  label: string
  emoji: string
  colorLight: string
  colorDark: string
}

export const WIZARD_STAGES: WizardStageMeta[] = [
  { key: 'basico', label: 'Básico', emoji: '🟦', colorLight: '#3247D6', colorDark: '#6E7CFF' },
  { key: 'accion', label: 'Tipo de acción', emoji: '🟪', colorLight: '#7C3AED', colorDark: '#A78BFA' },
  { key: 'datos', label: 'Datos procesados', emoji: '🟩', colorLight: '#0F9D77', colorDark: '#4FC79B' },
  { key: 'reglas', label: 'Reglas del paso', emoji: '🟧', colorLight: '#B45309', colorDark: '#E0A03D' },
]

export const wizardStageColor = (key: WizardStageKey, isDark: boolean): string => {
  const meta = WIZARD_STAGES.find((s) => s.key === key)!
  return isDark ? meta.colorDark : meta.colorLight
}

// 'llamada' y 'manual' se agregaron con el rediseño del wizard de 4 etapas
// (Etapa ② Tipo de Acción) como tarjetas propias, en vez de vivir escondidas
// dentro de 'comunicacion' (canal=Llamada) o no existir en absoluto. 'decision'
// y 'bloqueo' se conservan por compatibilidad con pasos ya capturados con el
// formulario anterior — ya NO aparecen como tarjeta seleccionable en el
// wizard (ver WIZARD_ACTION_TYPES abajo) pero siguen siendo valores válidos
// para no perder/romper datos existentes.
export type ActionType = 'sistema' | 'comunicacion' | 'decision' | 'documento' | 'bloqueo' | 'llamada' | 'manual'

export interface ActionTypeOption {
  value: ActionType
  label: string
  emoji: string
  /** Color distintivo de la tarjeta (Etapa ② del wizard) — variantes claro/oscuro. */
  colorLight: string
  colorDark: string
}

// B) Tipo de acción (raíz — define los campos dinámicos de la Etapa ③ del wizard)
export const ACTION_TYPES: ActionTypeOption[] = [
  { value: 'sistema', label: 'Sistema / Aplicación', emoji: '🖥️', colorLight: '#2563EB', colorDark: '#6EA1FF' },
  { value: 'comunicacion', label: 'Email / Comunicación', emoji: '📧', colorLight: '#DB2777', colorDark: '#F472B6' },
  { value: 'documento', label: 'Documento / PDF', emoji: '📄', colorLight: '#0F9D77', colorDark: '#4FC79B' },
  { value: 'llamada', label: 'Llamada', emoji: '📞', colorLight: '#B45309', colorDark: '#E0A03D' },
  { value: 'manual', label: 'Manual', emoji: '✋', colorLight: '#64748B', colorDark: '#94A3B8' },
  // Legacy — ya no seleccionables desde el wizard, solo lectura/compat.
  { value: 'decision', label: 'Decisión', emoji: '✅', colorLight: '#7C3AED', colorDark: '#A78BFA' },
  { value: 'bloqueo', label: 'Bloqueo', emoji: '⏸️', colorLight: '#D8344B', colorDark: '#F0708A' },
]

// Las 5 tarjetas reales que muestra la Etapa ② del wizard, en el orden del pedido.
export const WIZARD_ACTION_TYPES: ActionTypeOption[] = ACTION_TYPES.filter((a) =>
  (['sistema', 'comunicacion', 'documento', 'llamada', 'manual'] as ActionType[]).includes(a.value),
)

export const actionTypeMeta = (value: ActionType) => ACTION_TYPES.find((a) => a.value === value)!

export const actionTypeColor = (value: ActionType, isDark: boolean): string => {
  const meta = actionTypeMeta(value)
  return isDark ? meta.colorDark : meta.colorLight
}

export type IAPotential = 'automatizable' | 'asistible' | 'requiere-humano' | 'bloqueado-integracion'

export interface IAPotentialOption {
  value: IAPotential
  label: string
  emoji: string
  color: string
}

// §IA — Potencial de automatización. Campo siempre visible y OBLIGATORIO.
export const IA_POTENTIAL_OPTIONS: IAPotentialOption[] = [
  { value: 'automatizable', label: 'Automatizable (agente lo ejecuta hoy)', emoji: '🟢', color: '#2BA85B' },
  { value: 'asistible', label: 'Asistible (agente apoya, humano decide)', emoji: '🔵', color: '#2B6FF5' },
  { value: 'requiere-humano', label: 'Requiere humano (compliance / criterio)', emoji: '🟡', color: '#C9A400' },
  { value: 'bloqueado-integracion', label: 'Bloqueado por integración (legacy / datos)', emoji: '🔴', color: '#D8344B' },
]

export const iaPotentialMeta = (value: IAPotential) => IA_POTENTIAL_OPTIONS.find((o) => o.value === value)!

// §UBICACIÓN EN SISTEMA DE UN DATO — solo aparece cuando el origen del dato
// implica un sistema (ver SYSTEM_DATA_ORIGINS abajo). Vive A NIVEL DE CADA
// DATO (StepDataItem.systemLocation), no a nivel del paso — un mismo paso
// puede tocar datos en sistemas distintos (ej: RFC en SAP, antigüedad en
// otro sistema). "Acción sobre el campo" — qué hace el paso con ESE campo
// específico de la pantalla/transacción.
export type SystemFieldAction = 'lee' | 'captura' | 'modifica' | 'valida'

export interface SystemFieldActionOption {
  value: SystemFieldAction
  label: string
}

export const SYSTEM_FIELD_ACTIONS: SystemFieldActionOption[] = [
  { value: 'lee', label: 'Lee' },
  { value: 'captura', label: 'Captura' },
  { value: 'modifica', label: 'Modifica' },
  { value: 'valida', label: 'Valida' },
]

// §PUESTOS
export const PUESTOS = [
  'Analista',
  'Auxiliar',
  'Ejecutivo',
  'Coordinador',
  'Líder de equipo',
  'Gerente',
  'Subdirector',
  'Director',
  'VP',
  'C-level',
  'Cliente',
  'Proveedor',
  'Regulador',
]

// §DEPARTAMENTOS — catálogo abierto (el usuario puede agregar más vía
// "+ Otro" con SelectWithOther), usado por "Dueño del dato" de cada dato
// capturado (ver StepDataOwner en deepDiveStore.ts).
export const DEPARTAMENTOS = [
  'Compras',
  'Finanzas',
  'Contabilidad',
  'Recursos Humanos',
  'Tecnología',
  'Operaciones',
  'Ventas',
  'Marketing',
  'Legal',
  'Logística',
  'Servicio al cliente',
  'Auditoría',
  'Riesgos',
]

// §SISTEMAS (catálogo base; el usuario puede agregar nuevos desde el campo
// con búsqueda, ver CatalogAutocomplete en StepCapturePage). Los
// sistemas tipo SUITE (con jerarquía interna módulo/transacción/pantalla)
// viven además en systemsCatalogStore.ts, marcados con esSuite=true.
// Lista amplia de sistemas reales del mercado (ERP, CRM, HRIS, ITSM, etc.)
// para que el autocomplete nunca se sienta "solo SAP" — de todas formas es
// freeSolo, así que cualquier sistema no listado se puede escribir y se
// agrega solo (ver onAddCustomSystem).
export const SISTEMAS = [
  // ERP
  'SAP ECC',
  'SAP S/4HANA',
  'SAP Business One',
  'SAP Business ByDesign',
  'Oracle E-Business Suite',
  'Oracle Fusion Cloud ERP',
  'Oracle NetSuite',
  'Oracle JD Edwards',
  'Oracle PeopleSoft',
  'Microsoft Dynamics 365 Finance & Operations',
  'Microsoft Dynamics 365 Business Central',
  'Microsoft Dynamics GP',
  'Infor LN',
  'Infor M3',
  'Infor CloudSuite',
  'Epicor Kinetic',
  'Sage X3',
  'Sage Intacct',
  'Sage 300',
  'Odoo',
  'Acumatica',
  'IFS Cloud',
  'QAD',
  'Unit4',
  'Syspro',
  // CRM
  'Salesforce',
  'Salesforce Service Cloud',
  'Microsoft Dynamics 365 Sales',
  'Microsoft Dynamics 365 Customer Service',
  'HubSpot',
  'Zoho CRM',
  'Pipedrive',
  'SugarCRM',
  'Zendesk',
  // HRIS / Talento
  'Workday',
  'SAP SuccessFactors',
  'ADP Workforce Now',
  'BambooHR',
  'Ceridian Dayforce',
  'UKG (Ultimate Kronos Group)',
  'Meta4 / Cegid',
  // ITSM / Operaciones internas
  'ServiceNow',
  'Jira Service Management',
  'BMC Remedy',
  'Freshservice',
  'Freshdesk',
  // Finanzas / Compras / Gastos
  'Coupa',
  'SAP Ariba',
  'Concur',
  'QuickBooks',
  'Xero',
  'Zoho Books',
  'Bill.com',
  // Banca / Core financiero
  'Temenos',
  'Finastra',
  'Portal bancario',
  'Core bancario',
  // Firma y documentos
  'DocuSign',
  'Adobe Sign',
  'Adobe Acrobat',
  // Datos / BI
  'Power BI',
  'Tableau',
  'Snowflake',
  'SQL Server Management Studio',
  // Productividad / colaboración
  'Excel',
  'Google Sheets',
  'Word',
  'SharePoint',
  'Confluence',
  'Notion',
  'Google Workspace',
  'Microsoft 365',
  'Outlook',
  'Teams',
  'Slack',
  // Legacy / interno
  'Sistema contable',
  'Sistema interno',
  'Mainframe/AS400',
  'Portal web propio',
]

// §CANALES
export const CANALES = ['📧 Email', '👥 Teams', '💬 Slack', '📱 WhatsApp', '📞 Llamada', '🚶 Presencial']

// §DIRECCIÓN — solo aplica a canales de comunicación (email/WhatsApp/
// llamada): determina si el paso es reactivo (entrante, hay que medir
// cuánto se tarda en atender) o proactivo (saliente, tú controlas el
// envío, no hay cola de espera real). Ver tiempoEsperaConfig en
// utils/tiempos.ts, que usa esto para mostrar/ocultar el campo de espera.
export type DireccionComunicacion = 'entrante' | 'saliente'

export const DIRECCION_OPTIONS: { value: DireccionComunicacion; label: string }[] = [
  { value: 'entrante', label: '⬇️ Entrante (lo recibimos)' },
  { value: 'saliente', label: '⬆️ Saliente (lo enviamos nosotros)' },
]

// Un canal "requiere" dirección explícita cuando la espera SÍ puede variar
// muchísimo según si es entrante o saliente (email/WhatsApp). Llamada no la
// necesita — es síncrona por definición — y el resto de canales (Teams,
// Slack, Presencial) usan un tiempo de espera genérico opcional.
export const channelNeedsDireccion = (channel: string | undefined): boolean =>
  Boolean(channel && (channel.includes('Email') || channel.includes('WhatsApp')))

// §DECISION
export const DECISION_TYPES = ['Regla fija', 'Criterio humano', 'Compliance', 'Aprobación jerárquica']

// §BLOQUEO
export const BLOQUEO_TYPES = [
  'Espera aprobación',
  'Espera sistema',
  'Dependencia externa',
  'Falta de datos',
  'Integración manual (copiar-pegar)',
]

// Acción sobre el documento/dato (tipo DOCUMENTO)
export const DOCUMENT_ACTIONS = ['Genera', 'Consulta', 'Transforma']

// §DATOS — "Origen del dato" que procesa el paso (select simple, sin
// "+ Otro" — el pedido no lo marca como catálogo abierto).
export const DATA_ORIGINS = [
  'Viene del paso anterior',
  'Se captura en sistema',
  'Se consulta en sistema',
  'Lo ingresa una persona',
  'Viene en documento',
  'Lo aporta el cliente',
]

// Orígenes que implican que el dato vive en un sistema — disparan la
// sub-sección "🖥 Ubicación exacta en el sistema" dentro de la tarjeta del
// dato (ver DataItemCard en StepCapturePage.tsx).
export const SYSTEM_DATA_ORIGINS = ['Se captura en sistema', 'Se consulta en sistema']

export const isSystemOrigin = (origin: string) => SYSTEM_DATA_ORIGINS.includes(origin)

// §FUENTES NO ESTRUCTURADAS — contenido "crudo" (correo, transcripción de
// llamada, PDF, texto de una ley...) del que a veces se extraen datos
// estructurados y a veces no. Vive A NIVEL DEL PASO
// (ProcessStepRecord.fuentesNoEstructuradas), separado del bloque de
// "📥 Datos estructurados" (StepDataItem[]) — un mismo paso puede tener
// AMBOS bloques (ej: un email entrante del que se extraen datos).
export type TipoFuenteNoEstructurada =
  | 'email'
  | 'whatsapp'
  | 'llamada'
  | 'documento'
  | 'ley'
  | 'pdf'
  | 'formulario'
  | 'otro'

export const FUENTE_NO_ESTRUCTURADA_TIPOS: { value: TipoFuenteNoEstructurada; label: string; emoji: string }[] = [
  { value: 'email', label: 'Email', emoji: '📧' },
  { value: 'whatsapp', label: 'WhatsApp', emoji: '📱' },
  { value: 'llamada', label: 'Llamada', emoji: '📞' },
  { value: 'documento', label: 'Documento', emoji: '📄' },
  { value: 'ley', label: 'Ley/Normativa', emoji: '⚖️' },
  { value: 'pdf', label: 'PDF', emoji: '📕' },
  { value: 'formulario', label: 'Formulario', emoji: '📋' },
  { value: 'otro', label: 'Otro', emoji: '🗂️' },
]

// Etiqueta dinámica del textarea "Ejemplo del contenido" — el texto que se
// pide varía según qué tan literal/transcrito es el contenido de origen.
export const ejemploContenidoLabel = (tipo: TipoFuenteNoEstructurada): string => {
  switch (tipo) {
    case 'email':
      return 'Ejemplo del correo recibido'
    case 'whatsapp':
      return 'Ejemplo del mensaje'
    case 'llamada':
      return 'Transcripción / guion de la llamada'
    case 'documento':
    case 'pdf':
      return 'Ejemplo del contenido del documento'
    case 'ley':
      return 'Texto/artículo relevante de la norma'
    default:
      return 'Ejemplo de contenido'
  }
}

// Qué campos "extra" (opcionales) mostrar según el tipo de fuente — evita
// pedir asunto/adjuntos donde no aplican (ej. una llamada no tiene asunto).
export const fuenteCamposExtra = (
  tipo: TipoFuenteNoEstructurada,
): { origen: boolean; asunto: boolean; adjuntos: boolean } => {
  switch (tipo) {
    case 'email':
      return { origen: true, asunto: true, adjuntos: true }
    case 'llamada':
      return { origen: true, asunto: false, adjuntos: false }
    case 'documento':
    case 'pdf':
    case 'ley':
      return { origen: true, asunto: false, adjuntos: true }
    default:
      return { origen: false, asunto: false, adjuntos: false }
  }
}

// Un paso "es de contenido no estructurado" cuando su tipo de acción es
// comunicación (email/WhatsApp), documento o llamada — NO cuando es sistema
// puro (SAP/mainframe) o manual, donde no hay un documento/mensaje de origen.
export const showsFuentesNoEstructuradas = (actionType: ActionType): boolean =>
  actionType === 'comunicacion' || actionType === 'documento' || actionType === 'llamada'

// El bloque de datos estructurados se muestra para pasos de sistema (SAP)
// y también para comunicación — un email entrante puede traer datos que sí
// se extraen y estructuran (ver showsFuentesNoEstructuradas arriba).
export const showsDatosEstructurados = (actionType: ActionType): boolean =>
  actionType === 'sistema' || actionType === 'comunicacion'

// Etapa ③ del wizard para el tipo "✋ Manual" — no hay sistema ni documento
// de origen, solo una descripción libre de qué datos se manejan a mano.
export const showsManualDataDescription = (actionType: ActionType): boolean => actionType === 'manual'

// §DISPONIBILIDAD DE API — a nivel de LA TRANSACCIÓN/PANTALLA ESPECÍFICA de
// cada dato (DataSystemLocation.viaAPI): ¿un Agente de IA podría ejecutar
// esta operación puntual vía API en vez de simular clicks en pantalla (RPA)?
// Es distinto del nivel SISTEMA (SystemCatalogEntry.tieneAPI, en
// systemsCatalogStore.ts) porque un sistema puede tener API en general (ej.
// SAP con BAPIs/OData) pero esta transacción concreta (ej. una Z-transacción
// custom) puede no estar expuesta vía esa API.
export type ApiAvailability = 'si' | 'parcial' | 'no' | 'no-se'

export interface ApiAvailabilityOption {
  value: ApiAvailability
  label: string
}

export const API_AVAILABILITY_OPTIONS: ApiAvailabilityOption[] = [
  { value: 'si', label: '✅ Sí, vía API' },
  { value: 'parcial', label: '🟡 Parcial (algunos campos sí)' },
  { value: 'no', label: '🔴 No, solo interfaz de usuario' },
  { value: 'no-se', label: '❔ No lo sé todavía' },
]

export const apiAvailabilityMeta = (value: ApiAvailability) => API_AVAILABILITY_OPTIONS.find((o) => o.value === value)!

// Tipos de API a nivel SISTEMA (SystemCatalogEntry.tipoAPI) — catálogo
// abierto (el sistema soporta "+ Otro" vía SelectWithOther).
export const API_TYPES = ['REST', 'SOAP', 'RFC/BAPI', 'GraphQL', 'Archivo / Batch', 'Otro']

// §HOSTING DEL SISTEMA — a nivel de SISTEMA (SystemCatalogEntry.hosting, en
// systemsCatalogStore.ts), igual que tieneAPI: conocimiento GLOBAL, se
// captura una vez por sistema y se reusa en todos los procesos que lo
// toquen. Insumo directo para el "reference architecture" (dónde vive cada
// sistema: on-premises vs. nube, y qué proveedor).
export type HostingType = 'on-premises' | 'nube' | 'hibrido' | 'no-se'

export interface HostingOption {
  value: HostingType
  label: string
}

export const HOSTING_OPTIONS: HostingOption[] = [
  { value: 'on-premises', label: '🏢 On-premises' },
  { value: 'nube', label: '☁️ Nube' },
  { value: 'hibrido', label: '🔀 Híbrido (on-prem + nube)' },
  { value: 'no-se', label: '❔ No sé todavía' },
]

export const hostingMeta = (value: HostingType) => HOSTING_OPTIONS.find((o) => o.value === value)!

// Proveedor de nube — catálogo abierto (soporta "+ Otro").
export const CLOUD_PROVIDERS = ['Azure', 'AWS', 'Google Cloud', 'Oracle Cloud (OCI)', 'IBM Cloud', 'Otro']

// §REGLAS DE NEGOCIO — fuente/origen de cómo se conoce la regla. Se usa
// tanto para las reglas colgadas de un dato como para las del paso completo.
export const RULE_SOURCES = [
  'Política escrita',
  'Manual de procedimientos',
  'Regulación externa',
  'Conocimiento tácito (nadie la escribió)',
  'Instrucción verbal',
  'Sistema la aplica automático',
]

// §REGLAS DE NEGOCIO — qué tan negociable/flexible es la regla.
export const RULE_FLEXIBILITY = [
  'Regla dura (siempre se cumple)',
  'Flexible (hay excepciones)',
  'Depende del caso',
]

// Fuente que dispara el badge de riesgo de compliance en una regla de negocio.
export const COMPLIANCE_RULE_SOURCE = 'Regulación externa'

// Fuente que, junto con "no documentada", dispara el badge de riesgo tribal.
export const TACIT_KNOWLEDGE_SOURCE = 'Conocimiento tácito (nadie la escribió)'

// Badge de prioridad heredado de L2 — compartido entre la lista de
// procesos (L3 window) y el header de la pantalla de captura paso a paso.
export type PriorityLevel = 'alta' | 'media' | 'baja'

export const PRIORITY_META: Record<PriorityLevel, { label: string; emoji: string; color: string }> = {
  alta: { label: 'Alta', emoji: '🔴', color: '#D8344B' },
  media: { label: 'Media', emoji: '🟠', color: '#E0A03D' },
  baja: { label: 'Baja', emoji: '🟡', color: '#C9A400' },
}

export type ProcessDeepDiveStatus = 'pendiente' | 'en-progreso' | 'completado'

export const STATUS_LABEL: Record<ProcessDeepDiveStatus, string> = {
  pendiente: 'Pendiente',
  'en-progreso': 'En progreso',
  completado: 'Completado',
}
