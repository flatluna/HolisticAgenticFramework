import { FundamentoSectionPage } from '../components/FundamentoSectionPage'
import { getSectionCatalogItem } from '../sectionCatalog'
import { MandatoSection } from '../sections/MandatoSection'

const meta = getSectionCatalogItem('mandato')

export const MandatoPage = () => (
  <FundamentoSectionPage
    icon={meta.icon}
    gradient={meta.gradient}
    shadowColor={meta.shadowColor}
    title={meta.title}
    description={meta.description}
    previousPath="/fundamento/org-design"
    nextPath="/fundamento/business-strategy"
  >
    <MandatoSection />
  </FundamentoSectionPage>
)
