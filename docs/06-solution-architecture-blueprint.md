# 06 · Solution Architecture Blueprint (MVP)

> Alcance: **arquitectura física de implementación** (Solution Architecture, Repository
> Structure, Modular Monolith design, MVP scope, Frontend structure, Database scope,
> Roadmap de desarrollo). NO incluye tablas SQL, contratos de API, configuración de EF
> Core ni componentes React detallados — eso se diseña en documentos posteriores, una
> vez validado este blueprint.
>
> Deriva directamente de [05-context-map.md](./05-context-map.md): cada módulo del
> monolito modular corresponde 1:1 a un Bounded Context ya definido, para que la
> futura extracción a microservicios (si el negocio lo justifica) sea un ejercicio de
> mover un módulo, no de re-diseñar el dominio.

---

## Opinión como CTO / Principal Architect (antes del blueprint)

- **Modular Monolith es la decisión correcta para el MVP.** AETP tiene 14 Bounded
  Contexts ya identificados pero solo 7 son Core Domain — desplegar microservicios
  ahora sería pagar el costo de latencia de red, consistencia distribuida y
  observabilidad distribuida por un dominio que todavía va a cambiar de forma
  (estamos en V1, sin usuarios reales todavía). Un monolito modular con límites de
  módulo estrictos (enforced con tests de arquitectura) da el 90% del beneficio de
  microservicios (aislamiento, independencia de equipos futura) al 10% del costo
  operativo.
- **Un solo SQL Server con un schema por módulo** (no una base de datos por módulo)
  es la elección correcta en V1: preserva transacciones ACID cross-módulo cuando
  todavía son necesarias (ej. aprobar una `Initiative` y registrar su
  `TransformationOutcome` en la misma transacción), y no complica el failover/backup.
  La frontera de módulo se preserva a nivel de **schema + capa de aplicación**, no a
  nivel de motor de base de datos — eso se revisita solo si un módulo necesita
  escalar independientemente.
- **Entra ID para usuarios internos y externos**: usar **tenants separados o external
  ID (CIAM)** para usuarios del cliente vs. usuarios de la consultora es una decisión
  que debe tomarse ahora (afecta el modelo de `ClientOrganization`/`Engagement`), no
  después. Recomendación: Entra ID (consultora, empleados internos) + Entra External
  ID (clientes, multi-organización) con **App Roles** mapeados a los roles RACI ya
  definidos en [03-raci-governance.md](./03-raci-governance.md).
- **Riesgo principal a vigilar**: que el "Golden Thread" (trazabilidad end-to-end) se
  implemente como una vista de solo lectura que agrega IDs entre módulos — **nunca**
  como FKs de base de datos cruzando schemas de módulos distintos. Eso rompería el
  aislamiento modular desde el día 1.

---

## 1. Solution Architecture (.NET 9)

Clean Architecture aplicada **por módulo** (cada Bounded Context tiene sus propias 4
capas), más un host API delgado que compone todos los módulos, y una capa de
`BuildingBlocks` compartida (shared kernel técnico, no de dominio).

```
AETP.sln
│
├── src/
│   ├── Host/
│   │   └── AETP.Api                         # ASP.NET Core Web API — composition root
│   │                                         # Registra todos los módulos, middleware
│   │                                         # Entra ID, Swagger, health checks, CORS
│   │
│   ├── BuildingBlocks/                      # Shared kernel TÉCNICO (no de dominio)
│   │   ├── AETP.BuildingBlocks.Domain        # Entity, AggregateRoot, ValueObject,
│   │   │                                     # IDomainEvent base, Result<T>
│   │   ├── AETP.BuildingBlocks.Application   # ICommand/IQuery, pipeline behaviors
│   │   │                                     # (validation, logging, transacción),
│   │   │                                     # IUnitOfWork, ICurrentEngagementContext
│   │   ├── AETP.BuildingBlocks.Infrastructure# DbContext base, Outbox pattern base,
│   │   │                                     # interceptores EF (auditoría, tenant)
│   │   └── AETP.BuildingBlocks.EventBus      # Bus de eventos de dominio IN-PROCESS
│   │                                         # (MediatR notifications) — base para
│   │                                         # futura extracción a bus real (Service Bus)
│   │
│   └── Modules/                             # 1 carpeta por Bounded Context (05)
│       │
│       ├── ClientEngagement/                # Generic Domain — MVP
│       │   ├── AETP.Modules.ClientEngagement.Domain
│       │   ├── AETP.Modules.ClientEngagement.Application
│       │   ├── AETP.Modules.ClientEngagement.Infrastructure
│       │   └── AETP.Modules.ClientEngagement.Api   # extension methods + endpoints
│       │
│       ├── Strategy/                        # Core Domain — MVP
│       │   ├── AETP.Modules.Strategy.Domain
│       │   ├── AETP.Modules.Strategy.Application
│       │   ├── AETP.Modules.Strategy.Infrastructure
│       │   └── AETP.Modules.Strategy.Api
│       │
│       ├── Capability/                      # Core Domain — MVP
│       │   ├── AETP.Modules.Capability.Domain
│       │   ├── AETP.Modules.Capability.Application
│       │   ├── AETP.Modules.Capability.Infrastructure
│       │   └── AETP.Modules.Capability.Api
│       │
│       ├── Process/                         # Core Domain — MVP
│       │   ├── AETP.Modules.Process.Domain
│       │   ├── AETP.Modules.Process.Application
│       │   ├── AETP.Modules.Process.Infrastructure
│       │   └── AETP.Modules.Process.Api
│       │
│       ├── Opportunity/                     # Core Domain — MVP
│       │   ├── AETP.Modules.Opportunity.Domain
│       │   ├── AETP.Modules.Opportunity.Application
│       │   ├── AETP.Modules.Opportunity.Infrastructure
│       │   └── AETP.Modules.Opportunity.Api
│       │
│       ├── TransformationProgram/            # Core Domain — MVP (Initiative+Roadmap)
│       │   ├── AETP.Modules.TransformationProgram.Domain
│       │   ├── AETP.Modules.TransformationProgram.Application
│       │   ├── AETP.Modules.TransformationProgram.Infrastructure
│       │   └── AETP.Modules.TransformationProgram.Api
│       │
│       ├── Identity/                        # Cross-cutting — MVP (no es un BC de negocio)
│       │   ├── AETP.Modules.Identity.Application    # mapeo Entra ID → roles/permiso
│       │   └── AETP.Modules.Identity.Infrastructure # integración Microsoft.Identity.Web
│       │
│       └── _Future/                         # Post-MVP — solo esqueleto de carpeta,
│           ├── Assessment/                   # sin código todavía (ver §4 MVP Scope)
│           ├── AgentNetworkDesign/
│           ├── EnterpriseArchitecture/
│           ├── Governance/
│           ├── OrganizationWorkforce/
│           ├── ChangeManagement/
│           ├── ValueRealization/
│           └── Methodology/
│
└── tests/
    ├── UnitTests/                            # 1 proyecto de test por módulo
    │   ├── AETP.Modules.Strategy.UnitTests
    │   ├── AETP.Modules.Capability.UnitTests
    │   └── ... (uno por módulo activo)
    ├── IntegrationTests/
    │   └── AETP.IntegrationTests             # Testcontainers + SQL Server, por módulo
    └── ArchitectureTests/
        └── AETP.ArchitectureTests             # NetArchTest/ArchUnitNET: fuerza que
                                                # Domain no referencie Infrastructure,
                                                # que un módulo no referencie el
                                                # Infrastructure de otro módulo, etc.
```

### Reglas de dependencia (Clean Architecture, enforced por AETP.ArchitectureTests)

- `*.Domain` no referencia nada (ni siquiera `BuildingBlocks.Application`).
- `*.Application` referencia `*.Domain` + `BuildingBlocks.Application/Domain`.
- `*.Infrastructure` referencia `*.Application` + `BuildingBlocks.Infrastructure`.
- `*.Api` (por módulo) referencia `*.Application` — **nunca** `*.Infrastructure`
  directamente (se inyecta vía DI desde `AETP.Api`).
- **Ningún módulo referencia el `Domain`/`Application`/`Infrastructure` de otro
  módulo.** La única comunicación entre módulos es vía:
  1. Eventos de dominio (`BuildingBlocks.EventBus`), o
  2. Contratos públicos explícitos expuestos en `*.Api` (interfaces "públicas" de
     consulta, ej. `IObjectiveReadOnlyLookup`, registradas por el módulo dueño).
- `AETP.Api` (host) es el único proyecto que referencia `*.Infrastructure` de todos
  los módulos (para el registro de DI y EF Core).

---

## 2. Repository Structure

```
/ (raíz del repositorio)
│
├── /backend
│   ├── AETP.sln
│   ├── /src                     # ver estructura de proyectos en §1
│   │   ├── /Host
│   │   ├── /BuildingBlocks
│   │   └── /Modules
│   ├── /tests
│   │   ├── /UnitTests
│   │   ├── /IntegrationTests
│   │   └── /ArchitectureTests
│   ├── Directory.Build.props     # versión .NET, nullable, analyzers comunes
│   └── .editorconfig
│
├── /frontend
│   ├── /src                      # ver estructura en §5
│   ├── /public
│   ├── /tests                    # Vitest + React Testing Library
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── /docs                         # este framework de consultoría (00-06 y siguientes)
│   ├── README.md
│   ├── 00-overview-and-principles.md
│   ├── 01-methodology-horizons.md
│   ├── 02-traceability-model.md
│   ├── 03-raci-governance.md
│   ├── 04-domain-model-v1.md
│   ├── 05-context-map.md
│   ├── 06-solution-architecture-blueprint.md   # este documento
│   └── /adr                      # Architecture Decision Records (uno por decisión clave)
│
├── /deployment
│   ├── /bicep                    # Infraestructura como código (Azure)
│   │   ├── main.bicep
│   │   ├── /modules              # app-service.bicep, sql.bicep, entra-id.bicep, etc.
│   │   └── /environments         # dev.bicepparam, staging.bicepparam, prod.bicepparam
│   ├── /pipelines                # Azure DevOps / GitHub Actions workflows
│   │   ├── ci-backend.yml
│   │   ├── ci-frontend.yml
│   │   └── cd-release.yml
│   └── /docker                   # Dockerfiles (App Service contenedorizado, opcional)
│
└── /scripts
    ├── setup-dev-environment.ps1  # bootstrap local (dotnet restore, npm install)
    ├── run-migrations.ps1
    ├── seed-demo-engagement.ps1   # datos de ejemplo para demo del golden thread
    └── run-all-tests.ps1
```

---

## 3. Modular Monolith Design (todos los módulos, alcance completo del producto)

Módulos identificados — **1:1 con los Bounded Contexts** de
[05-context-map.md](./05-context-map.md), más el módulo transversal de Identity:

| # | Módulo | Bounded Context origen | Tipo |
|---|---|---|---|
| 1 | `Identity` | (transversal, no es BC de negocio) | Infraestructura de plataforma |
| 2 | `ClientEngagement` | Client & Engagement Context | Generic Domain |
| 3 | `Strategy` | Strategy & Objectives Context | **Core Domain** |
| 4 | `Assessment` | Assessment Context | Supporting Domain |
| 5 | `Capability` | Capability Context | **Core Domain** |
| 6 | `Process` | Process Context | **Core Domain** |
| 7 | `Opportunity` | Opportunity & Innovation Context | **Core Domain** |
| 8 | `AgentNetworkDesign` | Agent Network Design Context | **Core Domain** |
| 9 | `EnterpriseArchitecture` | Enterprise Architecture Context | Supporting Domain |
| 10 | `Governance` | Governance Context | Supporting Domain |
| 11 | `OrganizationWorkforce` | Organization & Workforce Context | Supporting Domain |
| 12 | `ChangeManagement` | Change Management Context | Supporting Domain |
| 13 | `TransformationProgram` | Transformation Program & Portfolio Context | **Core Domain** |
| 14 | `ValueRealization` | Value Realization Context | **Core Domain** |
| 15 | `Methodology` | Knowledge & Methodology Context | Generic Domain |

Cada módulo activo se registra en `AETP.Api` mediante un método de extensión propio
(`AddStrategyModule()`, `AddCapabilityModule()`, ...) que encapsula su propia
composición de DI, su propio `DbContext` (con su propio schema SQL) y sus propios
endpoints — el host no conoce el interior de ningún módulo.

---

## 4. MVP Scope (V1)

### Criterio de priorización
Construir **exclusivamente** lo necesario para demostrar el hilo dorado de extremo a
extremo:

```
Strategy → Objective → Capability → Process → Opportunity → Initiative → Roadmap
```

### Módulos incluidos en V1

| Módulo | Incluido en V1 | Justificación |
|---|---|---|
| `Identity` | ✅ Sí | Prerrequisito no negociable — sin auth no hay producto (Entra ID). |
| `ClientEngagement` | ✅ Sí | Prerrequisito no negociable — todo dato requiere `EngagementId`. |
| `Strategy` (incl. `Objective`, `KPI`) | ✅ Sí | Primer eslabón del hilo dorado. |
| `Capability` | ✅ Sí | Eslabón 2. |
| `Process` | ✅ Sí | Eslabón 3. |
| `Opportunity` | ✅ Sí | Eslabón 4 (sin distinguir aún `AIOpportunity`/`AgenticOpportunity` como
  módulos separados — se modelan como un campo de tipo en V1). |
| `TransformationProgram` (`Initiative` + `Roadmap`, `BusinessCase` simplificado) | ✅ Sí | Eslabones 5 y 6. |
| `Assessment` | ❌ No (V2) | No está en el hilo dorado mínimo; madurez puede capturarse como campo simple en `Capability` en V1 si es indispensable para la demo. |
| `AgentNetworkDesign` | ❌ No (V2) | Requiere `Governance` (aprobación) ya excluido de V1; sin eso no se puede completar su ciclo de vida. |
| `EnterpriseArchitecture` | ❌ No (V2) | No bloquea el hilo dorado. |
| `Governance` | ❌ No (V2) | Los gates se simulan en V1 como un simple campo `Status` en `Initiative` (`Approved` manual), sin marco de políticas todavía. |
| `OrganizationWorkforce` | ❌ No (V2) | No bloquea el hilo dorado. |
| `ChangeManagement` | ❌ No (V2) | Depende de Organization & Workforce. |
| `ValueRealization` | ❌ No (V2, o "V1.1") | El hilo dorado pedido termina en `Roadmap`; `TransformationOutcome` (cierre del ciclo) es el siguiente incremento natural inmediatamente después del MVP. |
| `Methodology` | ❌ No (V2) | Es un acelerador de contenido, no bloquea la demo funcional. |

### Entidades MVP por módulo (recordatorio — sin diseñar tablas todavía)

- **Identity**: perfil de usuario mínimo (nombre, email, rol por engagement — vía
  claims de Entra ID, no tabla propia si es posible).
- **ClientEngagement**: `ClientOrganization`, `Engagement`, `Stakeholder` (simplificado
  a nombre + rol).
- **Strategy**: `Strategy`, `Objective`, `KPI` (`BusinessModel` se puede diferir a V2
  si el tiempo aprieta — no es parte del hilo dorado).
- **Capability**: `Capability`, `CapabilityGap` (`CapabilityMap` como agregador
  puede ser una simple vista/lista en V1, no una entidad persistida separada).
- **Process**: `BusinessProcess`, `ProcessStep` (`DecisionPoint` puede diferirse a V1.1
  si no es indispensable para la demo).
- **Opportunity**: `Opportunity` (con campo `Type`: Generic/AI/Agentic),
  `OpportunityScore` (como value object embebido, no tabla separada).
- **TransformationProgram**: `Initiative`, `Roadmap`, `RoadmapPhase`, `BusinessCase`
  (simplificado: costo, beneficio, ROI — sin supuestos detallados).
  `TransformationProgram` como agregador puede ser opcional en V1 (una `Initiative`
  standalone sin programa formal), y `Pilot`/`Milestone` se difieren a V1.1.

---

## 5. Frontend Structure

### Stack
React + TypeScript + Vite + Material UI (MUI), React Router, TanStack Query (data
fetching/caching contra la Web API), Zustand o Context API para estado de UI ligero
(selección de engagement activo, tema).

### Layout principal

```
┌─────────────────────────────────────────────────────────────┐
│ TopBar: Logo AETP | Selector de Engagement | Perfil (Entra ID)│
├───────────────┬─────────────────────────────────────────────┤
│               │                                             │
│  Sidebar      │   Content Outlet (React Router <Outlet/>)   │
│  (navegación  │                                             │
│   por módulo) │                                             │
│               │                                             │
└───────────────┴─────────────────────────────────────────────┘
```

- **AppShell** (`/src/layout/AppShell.tsx`): compone TopBar + Sidebar + Outlet.
- **TopBar**: logo, selector de `Engagement` activo (multi-tenant switcher),
  notificaciones (post-MVP), menú de usuario (logout vía MSAL).
- **Sidebar**: navegación agrupada por el hilo dorado (ver menú abajo), colapsable.

### Navegación / Menú lateral (V1)

```
📊 Resumen del Engagement          (dashboard simple, golden thread breadcrumb)
🎯 Estrategia & Objetivos          (Strategy module)
🧩 Capacidades                     (Capability module)
🔁 Procesos                        (Process module)
💡 Oportunidades                   (Opportunity module)
🚀 Iniciativas & Roadmap           (TransformationProgram module)
⚙️ Administración del Engagement   (Stakeholders, configuración — ClientEngagement)
```

Módulos **no visibles** en V1 (ocultos, no eliminados — feature-flag
`FeatureFlags.ModuleEnabled["Assessment"] = false`, etc.): Assessment, Agent Network
Design, Enterprise Architecture, Governance, Organization & Workforce, Change
Management, Value Realization, Methodology.

### Páginas principales (V1)

| Página | Ruta | Módulo backend |
|---|---|---|
| Login / Callback Entra ID | `/auth/callback` | Identity |
| Selector de Engagement | `/engagements` | ClientEngagement |
| Resumen del Engagement (golden thread) | `/engagements/:id` | agregador de lectura (varios módulos) |
| Lista/Detalle de Estrategia | `/engagements/:id/strategy` | Strategy |
| Lista/Detalle de Objetivos | `/engagements/:id/strategy/objectives/:objectiveId` | Strategy |
| Mapa de Capacidades | `/engagements/:id/capabilities` | Capability |
| Detalle de Capacidad (con gaps) | `/engagements/:id/capabilities/:capId` | Capability |
| Lista de Procesos | `/engagements/:id/processes` | Process |
| Detalle de Proceso | `/engagements/:id/processes/:processId` | Process |
| Backlog de Oportunidades | `/engagements/:id/opportunities` | Opportunity |
| Detalle de Oportunidad | `/engagements/:id/opportunities/:oppId` | Opportunity |
| Iniciativas | `/engagements/:id/initiatives` | TransformationProgram |
| Roadmap (vista Gantt/timeline simple) | `/engagements/:id/roadmap` | TransformationProgram |
| Administración de Stakeholders | `/engagements/:id/settings` | ClientEngagement |

### Estructura de carpetas frontend (V1)

```
/frontend/src
├── /app                # bootstrap, providers (MSAL, QueryClient, ThemeProvider), router
├── /layout              # AppShell, TopBar, Sidebar
├── /modules
│   ├── /strategy         # páginas + hooks + api-client del módulo Strategy
│   ├── /capability
│   ├── /process
│   ├── /opportunity
│   ├── /transformation-program
│   └── /client-engagement
├── /shared
│   ├── /components       # componentes MUI reutilizables (breadcrumb de trazabilidad, etc.)
│   ├── /hooks
│   ├── /api-client        # cliente HTTP tipado, interceptor de auth (Entra ID token)
│   └── /theme             # tema MUI de AETP
└── /types                # tipos TS compartidos (contratos con el backend)
```

---

## 6. Database Scope (sin diseño de tablas)

**Un único SQL Server database para V1**, con **un schema por módulo con
persistencia**, para preservar el aislamiento modular sin la complejidad operativa de
múltiples bases de datos.

| Módulo | ¿Tiene persistencia en V1? | Schema SQL propuesto |
|---|---|---|
| Identity | Mínima (mapeo rol↔engagement, si no basta con claims de Entra ID) | `identity` |
| ClientEngagement | ✅ Sí | `engagement` |
| Strategy | ✅ Sí | `strategy` |
| Capability | ✅ Sí | `capability` |
| Process | ✅ Sí | `process` |
| Opportunity | ✅ Sí | `opportunity` |
| TransformationProgram | ✅ Sí | `transformation` |
| Assessment | ❌ No en V1 | — |
| AgentNetworkDesign | ❌ No en V1 | — |
| EnterpriseArchitecture | ❌ No en V1 | — |
| Governance | ❌ No en V1 | — |
| OrganizationWorkforce | ❌ No en V1 | — |
| ChangeManagement | ❌ No en V1 | — |
| ValueRealization | ❌ No en V1 | — |
| Methodology | ❌ No en V1 | — |

### Entidades MVP con persistencia (resumen — el detalle de tablas se diseña después)

`ClientOrganization`, `Engagement`, `Stakeholder`, `Strategy`, `Objective`, `KPI`,
`Capability`, `CapabilityGap`, `BusinessProcess`, `ProcessStep`, `Opportunity`,
`Initiative`, `Roadmap`, `RoadmapPhase`, `BusinessCase`.

Todas las tablas de módulos con persistencia comparten la columna `EngagementId`
(clave de partición tenant) — esto ya se anticipó en las notas de integración de
[05-context-map.md](./05-context-map.md#notas-de-integración-para-las-siguientes-fases).

---

## 7. Roadmap de Desarrollo (Sprints, 2 semanas c/u)

| Sprint | Foco | Entregable clave |
|---|---|---|
| **Sprint 0** | Fundaciones | Repo scaffolding (`/backend`, `/frontend`, `/deployment`, `/scripts`); solución .NET con `BuildingBlocks` y proyectos vacíos de los 6 módulos MVP; pipeline CI básico (build + test); infra Azure base (Bicep: Resource Group, App Service Plan, SQL Server, Entra ID App Registration) |
| **Sprint 1** | Identity + ClientEngagement | Login end-to-end con Entra ID (MSAL en React + `Microsoft.Identity.Web` en API); CRUD de `ClientOrganization`/`Engagement`/`Stakeholder`; AppShell + selector de engagement en frontend |
| **Sprint 2** | Strategy (vertical slice completo) | Domain + Application (CQRS) + Infrastructure (EF Core, schema `strategy`) + API + páginas React de Estrategia/Objetivos; primer componente de "breadcrumb de trazabilidad" |
| **Sprint 3** | Capability | Vertical slice completo de `Capability`/`CapabilityGap`, enlazado a `Objective` |
| **Sprint 4** | Process | Vertical slice completo de `BusinessProcess`/`ProcessStep`, enlazado a `Capability` |
| **Sprint 5** | Opportunity | Vertical slice completo de `Opportunity` (con tipo Generic/AI/Agentic), enlazado a `BusinessProcess` |
| **Sprint 6** | TransformationProgram | Vertical slice completo de `Initiative`/`BusinessCase`/`Roadmap`/`RoadmapPhase`, enlazado a `Opportunity` |
| **Sprint 7** | Golden Thread end-to-end | Vista agregada de trazabilidad (Strategy→...→Roadmap) como read-model de solo lectura cross-módulo; vista de Roadmap tipo timeline/Gantt simple |
| **Sprint 8** | Hardening | Seguridad (revisión OWASP, roles Entra ID por página/endpoint), logging/telemetría (App Insights), pruebas de integración end-to-end, despliegue automatizado a Azure (staging) |
| **Sprint 9** (buffer) | Estabilización & UAT | Corrección de hallazgos de UAT con el primer cliente/consultora piloto; preparación de demo; congelamiento de V1 |

### Después del MVP (orientativo, no comprometido aún)
V1.1: `ValueRealization` (cierre del ciclo con `TransformationOutcome`) — es el
siguiente incremento natural inmediatamente después de `Roadmap`.
V2: `Governance` (gates reales) → habilita `AgentNetworkDesign` → habilita
`Assessment`, `EnterpriseArchitecture`, `OrganizationWorkforce`, `ChangeManagement`,
`Methodology`.

---

## Referencias cruzadas

- Context Map (Bounded Contexts, Aggregates, patrones DDD): [05-context-map.md](./05-context-map.md)
- Domain Model V1 (catálogo de entidades): [04-domain-model-v1.md](./04-domain-model-v1.md)
- RACI y gates de gobierno: [03-raci-governance.md](./03-raci-governance.md)
