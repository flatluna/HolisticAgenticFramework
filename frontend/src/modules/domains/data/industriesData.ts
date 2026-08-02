// Paso 2 · Descubrimiento y Priorización de Dominios de Negocio — catálogo
// editable de industrias y dominios. Capa 1 (UNIVERSAL_DOMAINS) siempre se
// muestra sin importar la industria; Capa 2 (INDUSTRY_DOMAINS) se agrega
// según la industria seleccionada. `sensitiveToTecnologia`/`sensitiveToDatos`
// controlan qué pilares de Fase 1 influyen en el ajuste de complejidad
// heredado (ver useDomainDiscovery.ts).

export interface Industry {
  id: string
  name: string
  emoji: string
}

export interface DomainConfig {
  id: string
  name: string
  emoji: string
  layer: 'universal' | 'industry'
  industryId?: string
  description: string
  typicalProcesses: string[]
  sensitiveToTecnologia: boolean
  sensitiveToDatos: boolean
}

export const INDUSTRIES: Industry[] = [
  { id: 'banca-servicios-financieros', name: 'Banca y Servicios Financieros', emoji: '🏦' },
  { id: 'seguros', name: 'Seguros', emoji: '🛡️' },
  { id: 'retail-ecommerce', name: 'Retail y E-commerce', emoji: '🛍️' },
  { id: 'manufactura', name: 'Manufactura', emoji: '🏭' },
  { id: 'salud-farmaceutica', name: 'Salud y Farmacéutica', emoji: '💊' },
  { id: 'energia-utilities', name: 'Energía y Utilities', emoji: '⚡' },
  { id: 'telecomunicaciones', name: 'Telecomunicaciones', emoji: '📡' },
  { id: 'logistica-transporte', name: 'Logística y Transporte', emoji: '🚛' },
  { id: 'construccion-infraestructura', name: 'Construcción e Infraestructura', emoji: '🏗️' },
  { id: 'agroindustria', name: 'Agroindustria', emoji: '🌾' },
  { id: 'educacion', name: 'Educación', emoji: '🎓' },
  { id: 'gobierno-sector-publico', name: 'Gobierno y Sector Público', emoji: '🏛️' },
  { id: 'medios-entretenimiento', name: 'Medios y Entretenimiento', emoji: '🎬' },
  { id: 'hoteleria-turismo', name: 'Hotelería y Turismo', emoji: '🏨' },
  { id: 'real-estate-inmobiliario', name: 'Real Estate e Inmobiliario', emoji: '🏢' },
  { id: 'mineria', name: 'Minería', emoji: '🪨' },
  { id: 'tecnologia-software', name: 'Tecnología y Software', emoji: '🖥️' },
  { id: 'alimentos-bebidas', name: 'Alimentos y Bebidas', emoji: '🍽️' },
  { id: 'profesional-consultoria', name: 'Servicios Profesionales y Consultoría', emoji: '💼' },
]

// Capa 1 — dominios universales, presentes para TODAS las industrias.
export const UNIVERSAL_DOMAINS: DomainConfig[] = [
  {
    id: 'finanzas',
    name: 'Finanzas',
    emoji: '💰',
    layer: 'universal',
    description: 'FP&A, contabilidad, tesorería y control financiero',
    typicalProcesses: ['Cierre contable', 'Presupuestación', 'Cuentas por pagar/cobrar', 'Reporteo financiero'],
    sensitiveToTecnologia: true,
    sensitiveToDatos: true,
  },
  {
    id: 'rrhh',
    name: 'Recursos Humanos',
    emoji: '👥',
    layer: 'universal',
    description: 'Reclutamiento, nómina, desempeño y desarrollo de talento',
    typicalProcesses: ['Reclutamiento y selección', 'Nómina', 'Evaluación de desempeño', 'Onboarding'],
    sensitiveToTecnologia: false,
    sensitiveToDatos: false,
  },
  {
    id: 'ventas',
    name: 'Ventas',
    emoji: '📈',
    layer: 'universal',
    description: 'Gestión comercial, pipeline y cierre de oportunidades',
    typicalProcesses: ['Prospección', 'Cotización', 'Cierre de venta', 'Gestión de cuentas clave'],
    sensitiveToTecnologia: true,
    sensitiveToDatos: true,
  },
  {
    id: 'marketing',
    name: 'Marketing',
    emoji: '📣',
    layer: 'universal',
    description: 'Generación de demanda, campañas y gestión de marca',
    typicalProcesses: ['Planeación de campañas', 'Gestión de leads', 'Contenido y redes', 'Analítica de marketing'],
    sensitiveToTecnologia: true,
    sensitiveToDatos: true,
  },
  {
    id: 'compras',
    name: 'Compras y Abastecimiento',
    emoji: '🛒',
    layer: 'universal',
    description: 'Sourcing, negociación y gestión de proveedores',
    typicalProcesses: ['Solicitud de compra', 'Selección de proveedores', 'Órdenes de compra', 'Gestión de contratos'],
    sensitiveToTecnologia: true,
    sensitiveToDatos: false,
  },
  {
    id: 'cadena-suministro',
    name: 'Cadena de Suministro y Logística',
    emoji: '🚚',
    layer: 'universal',
    description: 'Planeación de demanda, inventarios y distribución',
    typicalProcesses: ['Planeación de demanda', 'Gestión de inventario', 'Distribución', 'Gestión de almacenes'],
    sensitiveToTecnologia: true,
    sensitiveToDatos: true,
  },
  {
    id: 'tecnologia-ti',
    name: 'Tecnología / TI',
    emoji: '💻',
    layer: 'universal',
    description: 'Infraestructura, soporte y desarrollo de sistemas',
    typicalProcesses: ['Mesa de servicio', 'Gestión de incidentes', 'Desarrollo de software', 'Seguridad de la información'],
    sensitiveToTecnologia: true,
    sensitiveToDatos: true,
  },
  {
    id: 'servicio-cliente',
    name: 'Servicio al Cliente',
    emoji: '🎧',
    layer: 'universal',
    description: 'Atención, soporte y retención de clientes',
    typicalProcesses: ['Atención de tickets', 'Gestión de quejas', 'Soporte post-venta', 'Retención de clientes'],
    sensitiveToTecnologia: true,
    sensitiveToDatos: false,
  },
  {
    id: 'legal-cumplimiento',
    name: 'Legal y Cumplimiento',
    emoji: '⚖️',
    layer: 'universal',
    description: 'Gestión contractual, riesgo legal y cumplimiento normativo',
    typicalProcesses: ['Revisión de contratos', 'Gestión de cumplimiento', 'Gestión de litigios', 'Auditoría interna'],
    sensitiveToTecnologia: false,
    sensitiveToDatos: false,
  },
  {
    id: 'operaciones',
    name: 'Operaciones Generales',
    emoji: '⚙️',
    layer: 'universal',
    description: 'Ejecución operativa del negocio día a día',
    typicalProcesses: ['Planeación operativa', 'Gestión de calidad', 'Gestión de instalaciones', 'Mejora continua'],
    sensitiveToTecnologia: true,
    sensitiveToDatos: false,
  },
]

// Capa 2 — dominios específicos por industria (se agregan a los
// universales cuando esa industria está seleccionada).
export const INDUSTRY_DOMAINS: DomainConfig[] = [
  {
    id: 'riesgo-crediticio', name: 'Gestión de Riesgo Crediticio', emoji: '📊', layer: 'industry',
    industryId: 'banca-servicios-financieros', description: 'Evaluación, scoring y monitoreo de riesgo crediticio',
    typicalProcesses: ['Originación de crédito', 'Scoring crediticio', 'Monitoreo de cartera'],
    sensitiveToTecnologia: true, sensitiveToDatos: true,
  },
  {
    id: 'banca-digital', name: 'Banca Digital y Canales', emoji: '📱', layer: 'industry',
    industryId: 'banca-servicios-financieros', description: 'Canales digitales, banca móvil y experiencia del cliente',
    typicalProcesses: ['Onboarding digital', 'Autoservicio', 'Gestión de canales'],
    sensitiveToTecnologia: true, sensitiveToDatos: true,
  },
  {
    id: 'suscripcion-polizas', name: 'Suscripción de Pólizas', emoji: '📝', layer: 'industry',
    industryId: 'seguros', description: 'Evaluación de riesgo y emisión de pólizas',
    typicalProcesses: ['Cotización de póliza', 'Suscripción', 'Renovación'],
    sensitiveToTecnologia: true, sensitiveToDatos: true,
  },
  {
    id: 'gestion-siniestros', name: 'Gestión de Siniestros', emoji: '🚑', layer: 'industry',
    industryId: 'seguros', description: 'Recepción, ajuste y pago de siniestros',
    typicalProcesses: ['Notificación de siniestro', 'Ajuste', 'Pago de indemnización'],
    sensitiveToTecnologia: true, sensitiveToDatos: false,
  },
  {
    id: 'gestion-inventario-retail', name: 'Gestión de Inventario y Reposición', emoji: '📦', layer: 'industry',
    industryId: 'retail-ecommerce', description: 'Control de existencias y reposición en punto de venta',
    typicalProcesses: ['Conteo de inventario', 'Reposición automática', 'Gestión de mermas'],
    sensitiveToTecnologia: true, sensitiveToDatos: true,
  },
  {
    id: 'experiencia-omnicanal', name: 'Experiencia Omnicanal', emoji: '🛒', layer: 'industry',
    industryId: 'retail-ecommerce', description: 'Consistencia de experiencia entre canal físico y digital',
    typicalProcesses: ['Click & collect', 'Devoluciones omnicanal', 'Unificación de catálogo'],
    sensitiveToTecnologia: true, sensitiveToDatos: false,
  },
  {
    id: 'produccion', name: 'Planeación y Control de Producción', emoji: '🏭', layer: 'industry',
    industryId: 'manufactura', description: 'Programación, ejecución y control de la producción',
    typicalProcesses: ['Planeación MRP', 'Programación de planta', 'Control de calidad'],
    sensitiveToTecnologia: true, sensitiveToDatos: true,
  },
  {
    id: 'mantenimiento', name: 'Mantenimiento de Activos', emoji: '🔧', layer: 'industry',
    industryId: 'manufactura', description: 'Mantenimiento preventivo y predictivo de equipos',
    typicalProcesses: ['Mantenimiento preventivo', 'Gestión de órdenes de trabajo', 'Mantenimiento predictivo'],
    sensitiveToTecnologia: true, sensitiveToDatos: true,
  },
  {
    id: 'gestion-pacientes', name: 'Gestión de Pacientes', emoji: '🩺', layer: 'industry',
    industryId: 'salud-farmaceutica', description: 'Historial clínico, citas y experiencia del paciente',
    typicalProcesses: ['Agendamiento de citas', 'Historial clínico electrónico', 'Facturación médica'],
    sensitiveToTecnologia: true, sensitiveToDatos: true,
  },
  {
    id: 'cumplimiento-regulatorio-salud', name: 'Cumplimiento Regulatorio Sanitario', emoji: '📋', layer: 'industry',
    industryId: 'salud-farmaceutica', description: 'Cumplimiento normativo sanitario y farmacovigilancia',
    typicalProcesses: ['Farmacovigilancia', 'Auditoría sanitaria', 'Gestión de registros sanitarios'],
    sensitiveToTecnologia: false, sensitiveToDatos: false,
  },
  {
    id: 'gestion-activos-energia', name: 'Gestión de Activos de Red', emoji: '🔌', layer: 'industry',
    industryId: 'energia-utilities', description: 'Operación y mantenimiento de infraestructura de red',
    typicalProcesses: ['Inspección de red', 'Mantenimiento de subestaciones', 'Gestión de outages'],
    sensitiveToTecnologia: true, sensitiveToDatos: true,
  },
  {
    id: 'medicion-facturacion', name: 'Medición y Facturación', emoji: '🧾', layer: 'industry',
    industryId: 'energia-utilities', description: 'Lectura de consumo y facturación a usuarios',
    typicalProcesses: ['Lectura de medidores', 'Facturación', 'Gestión de cobranza'],
    sensitiveToTecnologia: true, sensitiveToDatos: true,
  },
  {
    id: 'gestion-red', name: 'Gestión de Red y Infraestructura', emoji: '📶', layer: 'industry',
    industryId: 'telecomunicaciones', description: 'Operación de red de telecomunicaciones',
    typicalProcesses: ['Provisión de servicios', 'Gestión de fallas de red', 'Planeación de capacidad'],
    sensitiveToTecnologia: true, sensitiveToDatos: true,
  },
  {
    id: 'billing-telco', name: 'Billing y Cobranza', emoji: '💳', layer: 'industry',
    industryId: 'telecomunicaciones', description: 'Facturación de servicios y gestión de cobranza',
    typicalProcesses: ['Ciclo de facturación', 'Gestión de disputas', 'Cobranza'],
    sensitiveToTecnologia: true, sensitiveToDatos: true,
  },
  {
    id: 'gestion-flota', name: 'Gestión de Flota', emoji: '🚚', layer: 'industry',
    industryId: 'logistica-transporte', description: 'Administración y mantenimiento de flota vehicular',
    typicalProcesses: ['Mantenimiento de flota', 'Gestión de combustible', 'Cumplimiento normativo vehicular'],
    sensitiveToTecnologia: true, sensitiveToDatos: false,
  },
  {
    id: 'planeacion-rutas', name: 'Planeación de Rutas', emoji: '🗺️', layer: 'industry',
    industryId: 'logistica-transporte', description: 'Optimización de rutas y programación de entregas',
    typicalProcesses: ['Ruteo', 'Programación de entregas', 'Seguimiento de última milla'],
    sensitiveToTecnologia: true, sensitiveToDatos: true,
  },
  {
    id: 'gestion-proyectos-obra', name: 'Gestión de Proyectos de Obra', emoji: '🏗️', layer: 'industry',
    industryId: 'construccion-infraestructura', description: 'Planeación y control de proyectos de construcción',
    typicalProcesses: ['Planeación de obra', 'Control de avance', 'Gestión de cambios'],
    sensitiveToTecnologia: false, sensitiveToDatos: false,
  },
  {
    id: 'gestion-contratistas', name: 'Gestión de Contratistas', emoji: '👷', layer: 'industry',
    industryId: 'construccion-infraestructura', description: 'Contratación y supervisión de subcontratistas',
    typicalProcesses: ['Licitación', 'Gestión de subcontratos', 'Control de seguridad en obra'],
    sensitiveToTecnologia: false, sensitiveToDatos: false,
  },
  {
    id: 'gestion-cosecha', name: 'Gestión de Cosecha y Producción Agrícola', emoji: '🌱', layer: 'industry',
    industryId: 'agroindustria', description: 'Planeación de siembra, cosecha y rendimiento',
    typicalProcesses: ['Planeación de siembra', 'Monitoreo de cultivos', 'Gestión de cosecha'],
    sensitiveToTecnologia: true, sensitiveToDatos: true,
  },
  {
    id: 'trazabilidad-agro', name: 'Trazabilidad Agroalimentaria', emoji: '🔍', layer: 'industry',
    industryId: 'agroindustria', description: 'Trazabilidad de campo a mesa y cumplimiento sanitario',
    typicalProcesses: ['Trazabilidad de lote', 'Certificaciones', 'Control de calidad agrícola'],
    sensitiveToTecnologia: false, sensitiveToDatos: true,
  },
  {
    id: 'gestion-academica', name: 'Gestión Académica', emoji: '📚', layer: 'industry',
    industryId: 'educacion', description: 'Planeación curricular, calificaciones y seguimiento académico',
    typicalProcesses: ['Planeación curricular', 'Gestión de calificaciones', 'Seguimiento académico'],
    sensitiveToTecnologia: true, sensitiveToDatos: false,
  },
  {
    id: 'admisiones', name: 'Admisiones y Matrícula', emoji: '🎒', layer: 'industry',
    industryId: 'educacion', description: 'Proceso de admisión, matrícula y becas',
    typicalProcesses: ['Proceso de admisión', 'Matrícula', 'Gestión de becas'],
    sensitiveToTecnologia: true, sensitiveToDatos: false,
  },
  {
    id: 'atencion-ciudadana', name: 'Atención Ciudadana', emoji: '🧑‍🤝‍🧑', layer: 'industry',
    industryId: 'gobierno-sector-publico', description: 'Canales de atención y servicio al ciudadano',
    typicalProcesses: ['Atención en ventanilla', 'Canales digitales de gobierno', 'Gestión de quejas ciudadanas'],
    sensitiveToTecnologia: true, sensitiveToDatos: false,
  },
  {
    id: 'gestion-tramites', name: 'Gestión de Trámites', emoji: '📄', layer: 'industry',
    industryId: 'gobierno-sector-publico', description: 'Procesamiento de trámites y permisos',
    typicalProcesses: ['Recepción de trámite', 'Validación documental', 'Emisión de permisos'],
    sensitiveToTecnologia: true, sensitiveToDatos: false,
  },
  {
    id: 'gestion-contenidos', name: 'Gestión de Contenidos', emoji: '🎥', layer: 'industry',
    industryId: 'medios-entretenimiento', description: 'Producción y gestión de contenido multimedia',
    typicalProcesses: ['Producción de contenido', 'Gestión de derechos', 'Programación editorial'],
    sensitiveToTecnologia: true, sensitiveToDatos: false,
  },
  {
    id: 'distribucion-medios', name: 'Distribución y Monetización', emoji: '📺', layer: 'industry',
    industryId: 'medios-entretenimiento', description: 'Distribución multiplataforma y monetización de contenido',
    typicalProcesses: ['Distribución multiplataforma', 'Gestión publicitaria', 'Analítica de audiencia'],
    sensitiveToTecnologia: true, sensitiveToDatos: true,
  },
  {
    id: 'gestion-reservas', name: 'Gestión de Reservas', emoji: '📅', layer: 'industry',
    industryId: 'hoteleria-turismo', description: 'Reservaciones, tarifas y disponibilidad',
    typicalProcesses: ['Gestión de reservas', 'Revenue management', 'Overbooking y disponibilidad'],
    sensitiveToTecnologia: true, sensitiveToDatos: true,
  },
  {
    id: 'experiencia-huesped', name: 'Experiencia del Huésped', emoji: '🛎️', layer: 'industry',
    industryId: 'hoteleria-turismo', description: 'Servicio al huésped durante toda la estadía',
    typicalProcesses: ['Check-in/check-out', 'Servicios a huéspedes', 'Gestión de quejas de huéspedes'],
    sensitiveToTecnologia: true, sensitiveToDatos: false,
  },
  {
    id: 'gestion-propiedades', name: 'Gestión de Propiedades', emoji: '🏠', layer: 'industry',
    industryId: 'real-estate-inmobiliario', description: 'Administración de propiedades y arrendamientos',
    typicalProcesses: ['Gestión de arrendamientos', 'Mantenimiento de propiedades', 'Cobranza de rentas'],
    sensitiveToTecnologia: false, sensitiveToDatos: false,
  },
  {
    id: 'comercializacion-inmobiliaria', name: 'Comercialización Inmobiliaria', emoji: '🏘️', layer: 'industry',
    industryId: 'real-estate-inmobiliario', description: 'Venta y comercialización de proyectos inmobiliarios',
    typicalProcesses: ['Gestión de leads inmobiliarios', 'Proceso de venta', 'Postventa inmobiliaria'],
    sensitiveToTecnologia: true, sensitiveToDatos: false,
  },
  {
    id: 'planeacion-mina', name: 'Planeación Minera', emoji: '⛏️', layer: 'industry',
    industryId: 'mineria', description: 'Planeación de extracción y operación minera',
    typicalProcesses: ['Planeación de mina', 'Control de leyes de mineral', 'Gestión de voladuras'],
    sensitiveToTecnologia: true, sensitiveToDatos: true,
  },
  {
    id: 'seguridad-industrial-minera', name: 'Seguridad Industrial', emoji: '🦺', layer: 'industry',
    industryId: 'mineria', description: 'Gestión de seguridad y salud ocupacional en operación minera',
    typicalProcesses: ['Gestión de incidentes de seguridad', 'Inspecciones de seguridad', 'Capacitación en seguridad'],
    sensitiveToTecnologia: false, sensitiveToDatos: false,
  },
  {
    id: 'desarrollo-producto-software', name: 'Desarrollo de Producto', emoji: '👨‍💻', layer: 'industry',
    industryId: 'tecnologia-software', description: 'Ciclo de vida de desarrollo de producto de software',
    typicalProcesses: ['Planeación de producto', 'Desarrollo ágil', 'Release management'],
    sensitiveToTecnologia: true, sensitiveToDatos: false,
  },
  {
    id: 'soporte-tecnico-software', name: 'Soporte Técnico', emoji: '🛠️', layer: 'industry',
    industryId: 'tecnologia-software', description: 'Soporte técnico y éxito del cliente',
    typicalProcesses: ['Gestión de tickets de soporte', 'Customer success', 'Gestión de SLAs'],
    sensitiveToTecnologia: true, sensitiveToDatos: false,
  },
  {
    id: 'seguridad-alimentaria', name: 'Seguridad Alimentaria', emoji: '🧪', layer: 'industry',
    industryId: 'alimentos-bebidas', description: 'Control sanitario e inocuidad alimentaria',
    typicalProcesses: ['Control de inocuidad', 'Certificaciones sanitarias', 'Trazabilidad alimentaria'],
    sensitiveToTecnologia: false, sensitiveToDatos: true,
  },
  {
    id: 'gestion-calidad-alimentos', name: 'Gestión de Calidad', emoji: '✅', layer: 'industry',
    industryId: 'alimentos-bebidas', description: 'Control de calidad de producto alimenticio',
    typicalProcesses: ['Control de calidad de producto', 'Gestión de no conformidades', 'Auditorías de calidad'],
    sensitiveToTecnologia: false, sensitiveToDatos: false,
  },
]

export const ALL_DOMAINS: DomainConfig[] = [...UNIVERSAL_DOMAINS, ...INDUSTRY_DOMAINS]

// Dominios visibles para una industria: los universales SIEMPRE + los
// específicos de esa industria (si la industria no tiene ninguno
// configurado, como "Servicios Profesionales y Consultoría", solo se
// muestran los universales).
export const getDomainsForIndustry = (industryId: string | null): DomainConfig[] => {
  if (!industryId) return UNIVERSAL_DOMAINS
  return [...UNIVERSAL_DOMAINS, ...INDUSTRY_DOMAINS.filter((d) => d.industryId === industryId)]
}

// Reutilizado de Fase 1 · pilar Tecnología (grupo erpCrm en pillarsData.ts)
// — mismo catálogo de sistemas para el inventario de sistemas de Fase 2.
export const SYSTEMS_OPTIONS: string[] = [
  'SAP',
  'Oracle',
  'Microsoft Dynamics',
  'Salesforce',
  'NetSuite',
  'Odoo',
  'HubSpot',
]
