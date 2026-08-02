export type MaturityLevel = 1 | 2 | 3 | 4 // Inicial | En desarrollo | Definido | Avanzado

// Config estático de un grupo de evidencia estructurada (chips multi-select).
// `options` NO incluye el chip "Otro" — ese se agrega siempre en la UI
// (regla de oro: cada grupo siempre permite un chip "Otro" con texto libre).
export interface EvidenceGroupConfig {
  id: string
  label: string
  options: string[]
  allowOther: boolean
}

export interface Pillar {
  id: string
  icon: string
  name: string
  description: string
  evidenceGroups: EvidenceGroupConfig[]
  // Override opcional del label/placeholder del campo de texto libre
  // (`notes`) del drawer de edición — por defecto es un campo genérico de
  // "Notas / Evidencia", pero algunos pilares (ej. Procesos) se benefician
  // de una pregunta más específica sin necesitar un campo nuevo en el
  // backend (reutiliza la misma columna `notes`).
  notesLabel?: string
  notesPlaceholder?: string
}

export const MATURITY_LEVEL_LABELS: Record<MaturityLevel, string> = {
  1: 'Inicial',
  2: 'En desarrollo',
  3: 'Definido',
  4: 'Avanzado',
}

// Seed definition of the 6 pillars evaluated in Paso 1 · Assessment de
// Preparación Organizacional. This is a qualitative executive diagnostic
// (NOT a process-by-process audit): the evaluator reviews structured
// evidence chips per pillar (grouped, multi-select), then assigns a
// maturity level 1-4 by judgement — the level is never auto-derived from
// the chip selections.
export const PILLARS: Pillar[] = [
  {
    id: 'procesos',
    icon: '🔄',
    name: 'Procesos',
    description: 'Capacidad organizacional de gestión y mejora de procesos',
    notesLabel: 'Problemas del proceso identificado',
    notesPlaceholder:
      'Ej. Onboarding de clientes tarda 5 días por falta de automatización; doble captura de datos entre CRM y ERP; cuellos de botella en aprobaciones manuales…',
    evidenceGroups: [
      {
        id: 'documentedProcesses',
        label: 'Procesos documentados',
        options: [
          'Onboarding de clientes',
          'Facturación/Cobranza (Order-to-Cash)',
          'Compras/Proveedores (Procure-to-Pay)',
          'Atención al cliente/Soporte',
          'RRHH (contratación, nómina)',
          'Logística/Inventario',
          'Cierre contable/Financiero',
        ],
        allowOther: true,
      },
      {
        id: 'documentationTool',
        label: 'Herramienta de documentación',
        options: ['Signavio', 'Bizagi', 'Visio', 'Confluence', 'Ninguna'],
        allowOther: true,
      },
      {
        id: 'documentationStatus',
        label: 'Estado de documentación',
        options: [
          'Escritos/documentados',
          'Formalizados y aprobados oficialmente',
          'Personal entrenado en su uso',
          'Actualizados recientemente',
        ],
        allowOther: true,
      },
      {
        id: 'documentationCoverage',
        label: 'Cobertura estimada de procesos core documentados',
        options: [
          '0-25% de procesos core',
          '25-50% de procesos core',
          '50-75% de procesos core',
          '75-100% de procesos core',
        ],
        allowOther: true,
      },
    ],
  },
  {
    id: 'datos',
    icon: '📊',
    name: 'Datos',
    description: '¿Existe estructura y gobierno de datos?',
    evidenceGroups: [
      {
        id: 'dataSources',
        label: 'Fuentes de datos',
        options: ['Data Warehouse', 'Data Lake', 'Bases relacionales', 'Excel/hojas dispersas'],
        allowOther: true,
      },
      {
        id: 'biTools',
        label: 'Herramientas BI/Analítica',
        options: ['Power BI', 'Tableau', 'Looker', 'Qlik', 'Ninguna'],
        allowOther: true,
      },
      {
        id: 'dataGovernance',
        label: 'Gobierno de datos',
        options: [
          'Catálogo de datos',
          'Políticas de calidad',
          'Data owner definido',
          'Cumplimiento (GDPR/LFPDPPP)',
          'Sin gobierno formal',
        ],
        allowOther: true,
      },
    ],
  },
  {
    id: 'tecnologia',
    icon: '💻',
    name: 'Tecnología',
    description: '¿La arquitectura permite integrar agentes?',
    evidenceGroups: [
      {
        id: 'erpCrm',
        label: 'Sistemas ERP/CRM',
        options: ['SAP', 'Oracle', 'Microsoft Dynamics', 'Salesforce', 'NetSuite', 'Odoo', 'HubSpot'],
        allowOther: true,
      },
      {
        id: 'collaboration',
        label: 'Colaboración/Productividad',
        options: ['Microsoft 365', 'Google Workspace', 'Slack'],
        allowOther: true,
      },
      {
        id: 'cloudInfra',
        label: 'Infraestructura Cloud',
        options: ['AWS', 'Azure', 'Google Cloud', 'On-premise', 'Híbrido'],
        allowOther: true,
      },
      {
        id: 'integration',
        label: 'Integración',
        options: ['APIs REST', 'MuleSoft', 'Zapier', 'Sin integración'],
        allowOther: true,
      },
    ],
  },
  {
    id: 'ia-agentes',
    icon: '🤖',
    name: 'IA & Agentes',
    description: 'Madurez actual en inteligencia artificial y agentes',
    evidenceGroups: [
      {
        id: 'aiInitiatives',
        label: 'Iniciativas de IA existentes',
        options: ['Chatbots', 'RPA (automatización)', 'Modelos ML propios', 'Copilots (GitHub/M365)', 'Ninguna'],
        allowOther: true,
      },
      {
        id: 'llmUsage',
        label: 'Uso de LLMs/GenAI',
        options: [
          'ChatGPT/Claude (uso informal)',
          'API integrada en productos',
          'Casos productivos',
          'Solo exploración',
          'Nada aún',
        ],
        allowOther: true,
      },
    ],
  },
  {
    id: 'personas',
    icon: '👥',
    name: 'Personas & Cultura',
    description: '¿La organización y su gente están listas para el cambio?',
    evidenceGroups: [
      {
        id: 'orgReadiness',
        label: 'Preparación organizacional',
        options: [
          'Sponsor ejecutivo claro',
          'Equipo de transformación digital',
          'Presupuesto asignado a innovación',
          'Experiencia previa en cambio',
          'Resistencia cultural conocida',
        ],
        allowOther: true,
      },
      {
        id: 'talent',
        label: 'Capacidades/Talento',
        options: ['Perfiles técnicos internos (data/dev)', 'Dependencia de terceros', 'Programa de upskilling activo'],
        allowOther: true,
      },
    ],
  },
  {
    id: 'gobernanza',
    icon: '🛡️',
    name: 'Gobernanza & Seguridad',
    description: '¿Pueden operar con control y cumplimiento?',
    evidenceGroups: [
      {
        id: 'governanceFramework',
        label: 'Marco de gobierno',
        options: [
          'Políticas de seguridad formales',
          'Comité de riesgos/IT governance',
          'Certificaciones (ISO 27001, SOC 2)',
          'Gestión de accesos (IAM)',
        ],
        allowOther: true,
      },
      {
        id: 'compliance',
        label: 'Cumplimiento aplicable',
        options: ['GDPR', 'LFPDPPP (México)', 'HIPAA', 'PCI-DSS'],
        allowOther: true,
      },
    ],
  },
]

