import { FundamentoSectionPage } from '../components/FundamentoSectionPage'
import { getSectionCatalogItem } from '../sectionCatalog'
import { OrgDesignSection } from '../sections/OrgDesignSection'

const meta = getSectionCatalogItem('org-design')

export const OrgDesignPage = () => (
  <FundamentoSectionPage
    icon={meta.icon}
    gradient={meta.gradient}
    shadowColor={meta.shadowColor}
    title={meta.title}
    description={meta.description}
    previousPath="/fundamento/empresa"
    nextPath="/fundamento/mandato"
  >
    <OrgDesignSection />
  </FundamentoSectionPage>
)
