# 07 · Technical Foundations & Workspace #1 Readiness

> Alcance: **blueprint técnico de implementación inmediata** — árbol de repositorio,
> solución .NET, módulos MVP, alcance SQL (sin tablas), estructura frontend, plan de
> construcción semana a semana y checklist de "listo para empezar" el Workspace #1
> ("Entender estrategia, objetivos y modelo de negocio"). NO incluye tablas SQL,
> entidades detalladas, contratos de API ni componentes React específicos.
>
> Este documento **opera** el blueprint arquitectónico de
> [06-solution-architecture-blueprint.md](./06-solution-architecture-blueprint.md) —
> no lo reemplaza. 06 explica el *qué y el por qué* de toda la arquitectura MVP (7
> módulos, 10 sprints); 07 responde *"¿qué hago la próxima semana para poder empezar a
> construir Workspace #1 mañana mismo?"*, acotando la primera rebanada vertical
> (Identity → ClientEngagement → Strategy) a un plan semanal concreto.

---

## 1. Repository Structure

Árbol completo de carpetas, listo para `git init`:

```
/aetp
├── /backend
│   ├── AETP.sln
│   ├── Directory.Build.props          # target framework, nullable, langversion comunes
│   ├── Directory.Packages.props       # Central Package Management (versiones NuGet)
│   ├── .editorconfig
│   ├── /src
│   │   ├── /Host
│   │   │   └── /AETP.Api
│   │   ├── /BuildingBlocks
│   │   │   ├── /AETP.BuildingBlocks.Domain
│   │   │   ├── /AETP.BuildingBlocks.Application
│   │   │   ├── /AETP.BuildingBlocks.Infrastructure
│   │   │   └── /AETP.BuildingBlocks.EventBus
│   │   └── /Modules
│   │       ├── /Identity
│   │       │   └── AETP.Modules.Identity.Infrastructure   # solo Infra: envuelve Entra ID
│   │       ├── /ClientEngagement
│   │       │   ├── AETP.Modules.ClientEngagement.Domain
│   │       │   ├── AETP.Modules.ClientEngagement.Application
│   │       │   ├── AETP.Modules.ClientEngagement.Infrastructure
│   │       │   └── AETP.Modules.ClientEngagement.Api
│   │       ├── /Strategy
│   │       │   ├── AETP.Modules.Strategy.Domain
│   │       │   ├── AETP.Modules.Strategy.Application
│   │       │   ├── AETP.Modules.Strategy.Infrastructure
│   │       │   └── AETP.Modules.Strategy.Api
│   │       └── /_Future                # stubs vacíos, ver 06 §3-4
│   │           ├── Capability/ Process/ Opportunity/ TransformationProgram/
│   │           └── Assessment/ AgentNetworkDesign/ EnterpriseArchitecture/
│   │               Governance/ OrganizationWorkforce/ ChangeManagement/
│   │               ValueRealization/ Methodology/
│   └── /tests
│       ├── /UnitTests
│       │   ├── AETP.Modules.ClientEngagement.UnitTests
│       │   └── AETP.Modules.Strategy.UnitTests
│       ├── /IntegrationTests
│       │   └── AETP.IntegrationTests         # Testcontainers (SQL Server)
│       └── /ArchitectureTests
│           └── AETP.ArchitectureTests        # NetArchTest — reglas de capas/módulos
│
├── /frontend
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── /public
│   ├── /src
│   │   ├── main.tsx
│   │   ├── /app                 # AppProviders (MSAL, QueryClient, Theme), AppRouter
│   │   ├── /layout               # TopBar, Sidebar, AppShell
│   │   ├── /modules
│   │   │   ├── /client-engagement
│   │   │   └── /strategy
│   │   ├── /shared
│   │   │   ├── /components
│   │   │   ├── /hooks
│   │   │   ├── /api-client       # cliente HTTP + interceptor MSAL token
│   │   │   └── /theme            # MUI theme AETP
│   │   └── /types
│   └── /tests
│
├── /docs                         # 00-07 (este árbol) + /adr
│   └── /adr
│
├── /deployment
│   ├── /bicep
│   │   ├── main.bicep
│   │   ├── /modules              # sqlServer.bicep, appService.bicep, entra.bicep...
│   │   └── /environments         # dev.bicepparam, staging.bicepparam
│   ├── /pipelines                # ci-backend.yml, ci-frontend.yml, cd-release.yml
│   └── /docker
│       └── docker-compose.local.yml   # SQL Server local para dev
│
└── /scripts
    ├── setup-dev-environment.ps1
    ├── run-migrations.ps1
    ├── seed-demo-engagement.ps1
    └── run-all-tests.ps1
```

**Nota de alcance MVP-inmediato**: de los módulos listados en
[06 §3](./06-solution-architecture-blueprint.md#3-modular-monolith-design), solo
**Identity, ClientEngagement y Strategy** se construyen como código real en las
primeras 3 semanas (ver §6). El resto existe únicamente como carpeta vacía (`_Future`)
para fijar la convención de nombres desde el día 1 sin invertir esfuerzo prematuro.

---

## 2. .NET Solution Structure

| Proyecto | Capa | Referencia a | Propósito |
|---|---|---|---|
| `AETP.Api` | Host (composition root) | `Application` de cada módulo activo + `Infrastructure` de cada módulo activo | Único proyecto ejecutable; registra DI, middleware Entra ID, Swagger, health checks, CORS |
| `AETP.BuildingBlocks.Domain` | Shared kernel técnico | — | `Entity`, `AggregateRoot<TId>`, `ValueObject`, `IDomainEvent`, `Result<T>` |
| `AETP.BuildingBlocks.Application` | Shared kernel técnico | `BuildingBlocks.Domain` | `ICommand`/`IQuery` (MediatR), pipeline behaviors (validación FluentValidation, logging, transacción), `ICurrentEngagementContext`, `ICurrentUserContext` |
| `AETP.BuildingBlocks.Infrastructure` | Shared kernel técnico | `BuildingBlocks.Application` | `AetpDbContextBase`, interceptores EF (auditoría, `EngagementId` filter), patrón Outbox base |
| `AETP.BuildingBlocks.EventBus` | Shared kernel técnico | `BuildingBlocks.Domain` | Bus de eventos de dominio in-process (MediatR notifications) |
| `AETP.Modules.Identity.Infrastructure` | Infra (sin Domain propio) | `BuildingBlocks.Application` | Envuelve `Microsoft.Identity.Web`, resuelve `ICurrentUserContext` desde el token Entra ID |
| `AETP.Modules.ClientEngagement.Domain` | Domain | `BuildingBlocks.Domain` únicamente | `ClientOrganization`, `Engagement`, `Stakeholder` (aggregates) |
| `AETP.Modules.ClientEngagement.Application` | Application | `.Domain` + `BuildingBlocks.Application` | Commands/Queries: `CreateEngagement`, `AddStakeholder`, `GetEngagementById` |
| `AETP.Modules.ClientEngagement.Infrastructure` | Infrastructure | `.Application` + `BuildingBlocks.Infrastructure` | EF Core `DbContext` (schema `engagement`), repositorios |
| `AETP.Modules.ClientEngagement.Api` | Api (endpoints) | `.Application` únicamente | Minimal API endpoints, DTOs de entrada/salida, mapeo de rutas |
| `AETP.Modules.Strategy.Domain/.Application/.Infrastructure/.Api` | ídem patrón anterior | análogo | `Strategy`, `BusinessModel`, `Objective`, `KPI` (ver [04 §1](./04-domain-model-v1.md#1-core-domain)) |
| `AETP.ArchitectureTests` | Test | referencia todos los assemblies vía reflection | Reglas: `Domain` no referencia nada propio del framework; `Api` no referencia `Infrastructure` de OTRO módulo; solo `AETP.Api` referencia todos los `.Infrastructure` |

**Regla de dependencia no negociable** (enforced por `AETP.ArchitectureTests` desde el
Sprint 0): un módulo **nunca** referencia el `.Domain`/`.Infrastructure` de otro
módulo directamente. Solo puede:
1. Consumir un **contrato público de solo lectura** expuesto en el `.Application` del
   otro módulo (ej. `IEngagementReadOnlyService.GetEngagementSummary(id)`), o
2. Reaccionar a un **evento de dominio** publicado vía `BuildingBlocks.EventBus`.

---

## 3. Modular Monolith Structure — Módulos MVP y dependencias

| Módulo | Tipo | Depende de (solo vía contratos/eventos) | Contiene (ver [04](./04-domain-model-v1.md)/[05](./05-context-map.md)) |
|---|---|---|---|
| **Identity** | Transversal (infra) | — | Resolución de usuario/roles Entra ID; no es un Bounded Context de negocio |
| **ClientEngagement** | Generic Domain | Identity (usuario autenticado) | `ClientOrganization`, `Engagement`, `Stakeholder` |
| **Strategy** | Core Domain | ClientEngagement (`EngagementId`) | `Strategy`, `BusinessModel`, `Objective`, `KPI` |
| Capability *(_Future)* | Core Domain | Strategy (`ObjectiveId`) | `Capability`, `CapabilityGap`, `CapabilityMap` |
| Process *(_Future)* | Core Domain | Capability | `BusinessProcess`, `ProcessStep`, `DecisionPoint` |
| Opportunity *(_Future)* | Core Domain | Process | `Opportunity`, `AIOpportunity`, `AgenticOpportunity` |
| TransformationProgram *(_Future)* | Core Domain | Opportunity, ClientEngagement | `Initiative`, `Roadmap`, `BusinessCase` (simplificado) |

**Por qué este orden de dependencias**: replica exactamente el "hilo dorado" de
trazabilidad (04 §5) — cada módulo solo puede depender de módulos **aguas arriba** en
la cadena Strategy→Objective→Capability→Process→Opportunity→Initiative, nunca al
revés y nunca en diagonal (ej. Process no puede depender de Opportunity).

---

## 4. Initial SQL Scope (sin tablas)

| Base de datos | Schema | Módulo dueño | ¿Persistencia en esta fase (Semana 1-3)? |
|---|---|---|---|
| `AetpDb` (única, Azure SQL) | `identity` | Identity | No — Entra ID es el sistema de registro, no hay tablas propias de Identity en V1 |
| `AetpDb` | `engagement` | ClientEngagement | **Sí** — `ClientOrganization`, `Engagement`, `Stakeholder` |
| `AetpDb` | `strategy` | Strategy | **Sí** — `Strategy`, `BusinessModel`, `Objective`, `KPI` |
| `AetpDb` | `capability` / `process` / `opportunity` / `transformation` | módulos `_Future` | No — se crean cuando el módulo pasa de stub a código real (06 §7) |

- **Una sola base de datos** (`AetpDb`), **un schema SQL Server por módulo con
  persistencia** — decisión ya justificada en [06, sección "Opinión como
  CTO"](./06-solution-architecture-blueprint.md#opinión-como-cto--principal-architect-antes-del-blueprint).
- Migraciones EF Core **separadas por módulo** (una carpeta `Migrations/` por
  `.Infrastructure`), aplicadas en orden de dependencia (`engagement` antes que
  `strategy`) mediante `scripts/run-migrations.ps1`.
- Todas las tablas de `engagement`/`strategy` comparten `EngagementId` como columna de
  partición de tenant (no hay FKs cruzando `identity`→`engagement`→`strategy`; solo
  IDs referenciados a nivel de aplicación).

---

## 5. Frontend Structure

**Layout principal** (AppShell):
```
┌─────────────────────────────────────────────┐
│ TopBar: logo AETP · engagement activo · user │
├───────────┬─────────────────────────────────┤
│ Sidebar   │  <Outlet /> (contenido de ruta)  │
│ - Resumen │                                  │
│ - Estrategia & Objetivos                     │
│ - (resto de módulos: deshabilitado/"Próx.")  │
└───────────┴─────────────────────────────────┘
```

**Routing** (React Router, solo rutas activas en Semana 1-3):

| Ruta | Página | Módulo backend |
|---|---|---|
| `/login` | Redirección MSAL | Identity |
| `/` | Resumen del Engagement | ClientEngagement |
| `/engagements/:id` | Detalle de Engagement + Stakeholders | ClientEngagement |
| `/strategy` | Lista de Strategy del engagement activo | Strategy |
| `/strategy/:id` | Detalle: Objectives, KPIs, BusinessModel canvas | Strategy |

**Features / estructura de carpetas por módulo** (`/src/modules/<módulo>/`):
```
/strategy
├── api/            # hooks TanStack Query: useStrategies(), useCreateObjective()
├── components/     # StrategyCard, ObjectiveList, BusinessModelCanvas
├── pages/          # StrategyListPage, StrategyDetailPage
└── types.ts        # DTOs del módulo (espejo de los contratos del backend)
```

**Shared components** (`/src/shared/components`): `AppShell`, `PageHeader`,
`DataTable`, `ConfirmDialog`, `EmptyState`, `LoadingSpinner` — construidos una sola
vez en Semana 1-2, reutilizados por todos los módulos futuros.

---

## 6. MVP Build Order (semana a semana)

| Semana | Foco | Entregable concreto |
|---|---|---|
| **Semana 1** | Fundaciones de repo e infraestructura | `AETP.sln` compila con `Host` + `BuildingBlocks` (sin módulos de negocio aún); `AETP.Api` corre localmente y responde `/health`; `docker-compose.local.yml` levanta SQL Server local; Bicep `main.bicep` provisiona: Resource Group, Azure SQL, App Registrations Entra ID (API + SPA); pipeline CI (`ci-backend.yml`, `ci-frontend.yml`) corre build+test en cada PR; `AETP.ArchitectureTests` con las reglas de capas ya activas (aunque no haya módulos, valida `BuildingBlocks`) |
| **Semana 2** | Identity + ClientEngagement (vertical slice completo) | `Microsoft.Identity.Web` integrado en `AETP.Api`; `ICurrentUserContext` resuelve usuario+roles desde el token; módulo `ClientEngagement` completo (Domain→Api) con migración EF Core al schema `engagement`; endpoints `POST /engagements`, `GET /engagements/{id}`, `POST /engagements/{id}/stakeholders`; Frontend: login MSAL funcional, `AppShell` (TopBar+Sidebar) renderizado, página de Resumen de Engagement consumiendo la API real |
| **Semana 3** | Strategy & Objectives (vertical slice completo) — **cierra Workspace #1** | Módulo `Strategy` completo (Domain→Api) con migración EF Core al schema `strategy`; endpoints CRUD de `Strategy`, `Objective`, `KPI`, `BusinessModel`; Frontend: páginas `/strategy` y `/strategy/:id` funcionales (crear/editar Strategy, agregar Objectives+KPIs, capturar Business Model); pruebas de integración (Testcontainers) sobre el flujo `Engagement → Strategy → Objective`; demo end-to-end: crear un Engagement, definir su Strategy y sus Objectives desde la UI real |

A partir de Semana 4 continúa el roadmap completo de
[06 §7](./06-solution-architecture-blueprint.md#7-roadmap-de-desarrollo-sprints)
(Capability, Process, Opportunity, TransformationProgram, Golden Thread,
Hardening).

---

## 7. Workspace #1 Readiness

Checklist de lo que **debe existir y funcionar** antes de empezar a diseñar
funcionalmente el Workspace #1 ("Entender estrategia, objetivos y modelo de
negocio") a nivel de UX/negocio detallado:

- [ ] `AETP.sln` compila; `AETP.Api` corre localmente (`dotnet run`) y expone `/health`
- [ ] SQL Server accesible (Docker local o Azure Dev) con schemas `engagement` y
      `strategy` creados vía migraciones EF Core
- [ ] Entra ID: tenant configurado, App Registration de API + SPA, App Roles mapeados
      a roles de [03-raci-governance.md](./03-raci-governance.md) (mínimo: Lead
      Consultor, Sponsor Ejecutivo)
- [ ] `ICurrentUserContext` resuelve correctamente usuario + rol desde un token real
      (probado con un usuario de prueba en el tenant)
- [ ] Módulo `ClientEngagement`: se puede crear un `ClientOrganization` y un
      `Engagement` de prueba (vía API o script de seed)
- [ ] Módulo `Strategy`: CRUD de `Strategy`/`Objective`/`KPI`/`BusinessModel`
      funcionando contra la base real (no en memoria)
- [ ] Frontend: login MSAL funcional, `AppShell` renderiza, navegación a
      `/strategy` funciona y muestra datos reales del backend
- [ ] `AETP.ArchitectureTests` pasa en verde (ningún módulo viola las reglas de
      dependencia de la §2)
- [ ] Pipeline CI corre en verde en cada PR (backend + frontend)
- [ ] `scripts/seed-demo-engagement.ps1` deja un Engagement + Strategy de ejemplo
      listos para que el equipo de diseño funcional use en las demos de Workspace #1

Una vez marcados todos estos puntos, el equipo puede empezar el diseño funcional
detallado del Workspace #1 (pantallas, campos exactos, validaciones de negocio) con
la certeza de que el terreno técnico (auth, persistencia, módulos base, CI/CD,
frontend shell) ya no es un riesgo — solo queda construir sobre él.

---

## Referencias cruzadas

- Blueprint arquitectónico completo (7 módulos, 10 sprints): [06-solution-architecture-blueprint.md](./06-solution-architecture-blueprint.md)
- Modelo de dominio (entidades Strategy/Objective/KPI/BusinessModel): [04-domain-model-v1.md](./04-domain-model-v1.md)
- Context Map (Strategy & Objectives, Client & Engagement): [05-context-map.md](./05-context-map.md)
- RACI y roles mapeados a App Roles de Entra ID: [03-raci-governance.md](./03-raci-governance.md)
