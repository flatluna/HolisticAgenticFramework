import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeModeProvider } from './ThemeModeContext'
import Layout from '@/layout/Layout'
import { AdminPage } from '@/modules/admin/pages/AdminPage'
import { StrategyFoundationPage } from '@/modules/strategy/pages/StrategyFoundationPage'
import { EmpresaPage } from '@/modules/strategy/pages/EmpresaPage'
import { OrgDesignPage } from '@/modules/strategy/pages/OrgDesignPage'
import { MandatoPage } from '@/modules/strategy/pages/MandatoPage'
import { BusinessStrategyPage } from '@/modules/strategy/pages/BusinessStrategyPage'
import { MadurezOverviewPage } from '@/modules/madurez/pages/MadurezOverviewPage'
import { DomainDiscoveryPage } from '@/modules/domains/pages/DomainDiscoveryPage'
import { PlaceholderPage } from '@/shared/components/PlaceholderPage'
import { StepPlaceholderPage } from '@/shared/components/StepPlaceholderPage'
import { PhaseOverviewPage } from '@/shared/components/PhaseOverviewPage'
import { LoginPage } from '@/modules/auth/pages/LoginPage'
import { isLoggedIn } from '@/modules/auth/authSession'
import { phases } from '@/layout/phaseData'

// Every step path other than the index ('/') gets a generic step page so
// every node in the pipeline can be opened and reviewed, even before its
// dedicated UI is built. '/madurez' (Paso 1 · Assessment de Preparación
// Organizacional) and '/dominios' (Paso 2 · Descubrimiento y Priorización de
// Dominios de Negocio) have their own dedicated pages so they're excluded here.
const otherStepPaths = phases
  .flatMap((phase) => phase.steps.map((step) => step.path))
  .filter((path) => path !== '/' && path !== '/madurez' && path !== '/dominios')

// Simulación de sesión: si aún no se ha "iniciado sesión" en esta pestaña,
// cualquier ruta dentro del panel redirige al login.
const RequireAuth = ({ children }: { children: JSX.Element }) => {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  return (
    <ThemeModeProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route index element={<StrategyFoundationPage />} />
            <Route path="fundamento/empresa" element={<EmpresaPage />} />
            <Route path="fundamento/org-design" element={<OrgDesignPage />} />
            <Route path="fundamento/mandato" element={<MandatoPage />} />
            <Route path="fundamento/business-strategy" element={<BusinessStrategyPage />} />
            <Route path="madurez" element={<MadurezOverviewPage />} />
            <Route path="dominios" element={<DomainDiscoveryPage />} />
            {otherStepPaths.map((path) => (
              <Route key={path} path={path.slice(1)} element={<StepPlaceholderPage />} />
            ))}
            <Route path="fase/:phaseId" element={<PhaseOverviewPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="trazabilidad" element={<PlaceholderPage title="Trazabilidad" />} />
            <Route path="entregables" element={<PlaceholderPage title="Entregables" />} />
            <Route path="decisiones" element={<PlaceholderPage title="Decisiones" />} />
          </Route>
        </Routes>
      </Router>
    </ThemeModeProvider>
  )
}

export default App
