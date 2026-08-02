export interface MadurezCategory {
  id: string
  code: string
  title: string
  items: string[]
}

// The 9 dimensions of the "02. Diagnóstico y Madurez Actual" assessment
// (Step 2 · Fundamento). Each renders as a card on the overview page and has
// its own detail page reachable via madurezCategoryPath(id).
export const madurezCategories: MadurezCategory[] = [
  { id: 'negocio', code: '2.1', title: 'Negocio', items: ['Objetivos', 'Estrategia', 'Modelo de negocio', 'KPIs'] },
  {
    id: 'capacidades',
    code: '2.2',
    title: 'Capacidades Empresariales',
    items: ['Marketing', 'Ventas', 'Operaciones', 'Finanzas', 'RRHH', 'Customer Service', 'Innovación'],
  },
  {
    id: 'procesos',
    code: '2.3',
    title: 'Procesos',
    items: ['Inventario de procesos', 'Madurez', 'Estandarización', 'Automatización'],
  },
  {
    id: 'decisiones',
    code: '2.4',
    title: 'Decisiones',
    items: ['Estratégicas', 'Tácticas', 'Operativas', 'Automatizables'],
  },
  { id: 'datos', code: '2.5', title: 'Datos', items: ['Calidad', 'Integración', 'Disponibilidad', 'Gobernanza'] },
  { id: 'tecnologia', code: '2.6', title: 'Tecnología', items: ['ERP', 'CRM', 'APIs', 'Cloud', 'Integraciones'] },
  { id: 'personas', code: '2.7', title: 'Personas', items: ['Skills', 'Talento', 'Cultura', 'Cambio'] },
  {
    id: 'ia-agentes',
    code: '2.8',
    title: 'IA y Agentes',
    items: ['Casos de uso', 'Copilots', 'Agentes', 'Automatización', 'Orquestación'],
  },
  {
    id: 'governance',
    code: '2.9',
    title: 'Governance',
    items: ['Data Governance', 'AI Governance', 'Security', 'Compliance', 'Risk'],
  },
]

export const madurezCategoryPath = (categoryId: string) => `/madurez/${categoryId}`
