import { phases } from '@/layout/phaseData'
import { FundamentoSectionPage } from '../components/FundamentoSectionPage'
import { getSectionCatalogItem } from '../sectionCatalog'
import { MisionVisionSection } from '../sections/MisionVisionSection'

const meta = getSectionCatalogItem('business-strategy')

// After the last Fundamento sub-section, "Siguiente" hands off to the next
// node of the 21-step pipeline (Assessment de madurez) instead of another
// Fundamento sub-section.
const allSteps = phases.flatMap((phase) => phase.steps)
const nextStepPath = allSteps[1]?.path ?? '/madurez'

export const BusinessStrategyPage = () => (
  <FundamentoSectionPage
    icon={meta.icon}
    gradient={meta.gradient}
    shadowColor={meta.shadowColor}
    title={meta.title}
    description={meta.description}
    previousPath="/fundamento/mandato"
    nextPath={nextStepPath}
  >
    <MisionVisionSection />
  </FundamentoSectionPage>
)
