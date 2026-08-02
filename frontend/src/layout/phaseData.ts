export type StepStatus = 'completed' | 'current' | 'locked' | 'pending'

export interface PhaseStep {
  id: string
  code: string
  label: string
  deliverable: string
  status: StepStatus
  path: string
}

export interface Phase {
  id: string
  code: string
  label: string
  steps: PhaseStep[]
}

// Route for a phase's overview page (the card grid listing its steps).
export const phasePath = (phase: Pick<Phase, 'id'>) => `/fase/${phase.id}`

// Aggregate status for a whole phase, used to color/label its entry in the
// collapsed sidebar (one row per phase instead of one row per step).
export const getPhaseStatus = (phase: Phase): StepStatus => {
  if (phase.steps.some((s) => s.status === 'current')) return 'current'
  if (phase.steps.length > 0 && phase.steps.every((s) => s.status === 'completed')) return 'completed'
  if (phase.steps.length > 0 && phase.steps.every((s) => s.status === 'locked')) return 'locked'
  return 'pending'
}

// NOTE (2026-08-01): The full H0-H6 / 21-step roadmap that used to live here
// was intentionally removed — it was all placeholder content
// (StepPlaceholderPage) that didn't reflect the real methodology. Only Fase 0
// survives, reframed around "Executive Alignment & Customer Intimacy" (the
// actual first step of the real flow: understand the business before
// talking about processes, agents or architecture). The other phases will
// be redesigned and re-added one at a time as their real content is defined.
export const phases: Phase[] = [
  {
    id: 'h0',
    code: 'L1',
    label: 'Executive Alignment',
    steps: [
      {
        id: 'h0-01',
        code: '00',
        label: 'Executive Alignment & Customer Intimacy',
        deliverable: 'Documento de alineación ejecutiva y estrategia validado',
        status: 'current',
        path: '/',
      },
      {
        id: 'h0-02',
        code: '01',
        label: 'Assessment de Preparación Organizacional',
        deliverable: 'Reporte de preparación organizacional (6 pilares)',
        status: 'pending',
        path: '/madurez',
      },
    ],
  },
  {
    id: 'h1',
    code: 'L2',
    label: 'Descubrimiento y Priorización de Dominios de Negocio',
    steps: [
      {
        id: 'h1-01',
        code: '00',
        label: 'Descubrimiento y Priorización de Dominios de Negocio',
        deliverable: 'Matriz de priorización de dominios de negocio',
        status: 'pending',
        path: '/dominios',
      },
    ],
  },
]

export interface FlatNavItem {
  id: string
  label: string
  path: string
}

export const flatNavItems: FlatNavItem[] = [
  { id: 'trazabilidad', label: 'Trazabilidad', path: '/trazabilidad' },
  { id: 'entregables', label: 'Entregables', path: '/entregables' },
  { id: 'decisiones', label: 'Decisiones', path: '/decisiones' },
  { id: 'administracion', label: 'Administración', path: '/admin' },
]
