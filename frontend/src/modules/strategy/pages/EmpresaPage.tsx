import { FundamentoSectionPage } from '../components/FundamentoSectionPage'
import { getSectionCatalogItem } from '../sectionCatalog'
import { EmpresaSection } from '../sections/EmpresaSection'

const meta = getSectionCatalogItem('empresa')

export const EmpresaPage = () => (
  <FundamentoSectionPage
    icon={meta.icon}
    gradient={meta.gradient}
    shadowColor={meta.shadowColor}
    title={meta.title}
    description={meta.description}
    previousPath="/"
    nextPath="/fundamento/org-design"
  >
    <EmpresaSection />
  </FundamentoSectionPage>
)
