import { READINESS_COLORS } from '@/modules/madurez/assessmentTheme'
import { Quadrant } from '../hooks/useDomainDiscovery'

export const QUADRANT_LABELS: Record<Quadrant, string> = {
  'do-now': 'Hazlo ya',
  plan: 'Planifica',
  'quick-win': 'Quick win',
  later: 'Requiere Preparación',
}

// Explicación corta de cada cuadrante, mostrada como tooltip sobre el badge
// en las vistas de Ranking/Grid/Business Case — para que el significado no
// dependa de recordar la matriz valor/complejidad de memoria.
export const QUADRANT_DESCRIPTIONS: Record<Quadrant, string> = {
  'do-now': 'Alto valor y baja complejidad: el mejor candidato para ejecutar primero.',
  plan: 'Alto valor pero alta complejidad: vale la pena, pero necesita más tiempo/recursos planeados.',
  'quick-win': 'Bajo valor pero baja complejidad: fácil de hacer, útil para generar tracción rápida.',
  later:
    'Todavía no es un buen candidato: su valor es bajo o su complejidad es alta (a veces por baja madurez de procesos/tecnología/datos). No significa "nunca" — resuelve primero lo que lo hace complejo o reevalúa su valor antes de priorizarlo.',
}

export const QUADRANT_COLORS: Record<Quadrant, string> = {
  'do-now': READINESS_COLORS.green,
  plan: READINESS_COLORS.blue,
  'quick-win': READINESS_COLORS.cyan,
  later: READINESS_COLORS.textMuted,
}

export const QUADRANT_ICONS: Record<Quadrant, string> = {
  'do-now': '🎯',
  plan: '🗓️',
  'quick-win': '⚡',
  later: '🕒',
}
