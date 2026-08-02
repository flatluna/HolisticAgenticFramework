import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded'
import FlagRoundedIcon from '@mui/icons-material/FlagRounded'

export type SectionKey = 'empresa' | 'org-design' | 'mandato' | 'business-strategy'

export interface SectionCatalogItem {
  key: SectionKey
  path: string
  title: string
  shortLabel: string
  description: string
  icon: JSX.Element
  gradient: string
  shadowColor: string
}

// Single source of truth for the 4 Fundamento sub-sections: their route,
// copy, icon and color scheme. Used by both the colorful card grid
// (FundamentoOverviewPage) and each dedicated section page so the visual
// identity of a section stays consistent everywhere it's referenced.
//
// Design note (2026-08-01): all 4 cards now share ONE institutional accent
// (indigo, theme.palette.primary) instead of a different bright gradient
// per card — sections are told apart by icon + copy only. Color is reserved
// for status (Pendiente/En progreso/Completo), matching how enterprise
// change-management tools (not consumer SaaS) use color.
// Flat solid accent, no gradient/glow — matches the clean, document-like
// palette from the reference CSS (flat link color, thin gray borders,
// subtle header backgrounds), not a glossy consumer-SaaS look.
const ENTERPRISE_GRADIENT = '#3247D6'
const ENTERPRISE_SHADOW = 'transparent'

export const sectionCatalog: SectionCatalogItem[] = [
  {
    key: 'empresa',
    path: '/fundamento/empresa',
    title: 'Empresa',
    shortLabel: 'Empresa',
    description: 'Datos generales, ubicación, contacto y modelo de negocio de la empresa.',
    icon: <BusinessRoundedIcon />,
    gradient: ENTERPRISE_GRADIENT,
    shadowColor: ENTERPRISE_SHADOW,
  },
  {
    key: 'org-design',
    path: '/fundamento/org-design',
    title: 'Org Design',
    shortLabel: 'Org Design',
    description: 'Organigrama, roles, jerarquías y responsabilidades clave.',
    icon: <GroupsRoundedIcon />,
    gradient: ENTERPRISE_GRADIENT,
    shadowColor: ENTERPRISE_SHADOW,
  },
  {
    key: 'mandato',
    path: '/fundamento/mandato',
    title: 'Mandato',
    shortLabel: 'Mandato',
    description: 'Objetivo, alcance, patrocinador ejecutivo y metas del mandato — las prioridades ejecutivas.',
    icon: <AssignmentRoundedIcon />,
    gradient: ENTERPRISE_GRADIENT,
    shadowColor: ENTERPRISE_SHADOW,
  },
  {
    key: 'business-strategy',
    path: '/fundamento/business-strategy',
    title: 'Business Strategy & Future-State Definition',
    shortLabel: 'Business Strategy',
    description: 'Misión, visión, metas de automatización y drivers de transformación.',
    icon: <FlagRoundedIcon />,
    gradient: ENTERPRISE_GRADIENT,
    shadowColor: ENTERPRISE_SHADOW,
  },
]

export const getSectionCatalogItem = (key: SectionKey): SectionCatalogItem =>
  sectionCatalog.find((s) => s.key === key)!

export const formatSectionDate = (iso: string): string =>
  new Date(iso).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

