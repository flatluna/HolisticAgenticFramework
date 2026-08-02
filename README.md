# AETP - Autonomous Enterprise Transformation Platform

**AETP** is a SaaS platform for enterprise transformation consulting that combines strategic planning, AI governance, and autonomous process design into a single, integrated platform.

**What AETP is NOT:**
- ❌ An agent builder or deployment platform
- ❌ An automation engine for business processes
- ❌ A code generation tool

**What AETP is:**
- ✅ A consulting framework and methodology (21 phases across 7 horizons)
- ✅ A domain-driven design model for enterprise transformation
- ✅ A SaaS application for capturing, governing, and executing transformation initiatives
- ✅ A traceability engine linking strategy → objectives → capabilities → processes → initiatives → outcomes

## Quick Start

### Prerequisites
- .NET 9
- Node.js 20+
- SQL Server (local or cloud)
- Visual Studio Code (recommended) or Visual Studio 2022

### Development Environment Setup

```bash
# Run the setup script (Windows)
.\scripts\setup-dev-environment.ps1

# Or manually:

# Backend
cd backend
dotnet restore
dotnet build
dotnet run --project src/Host/AETP.Api/AETP.Api.csproj

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

### Docker Compose (Local Development)

```bash
docker-compose -f deployment/docker/docker-compose.yml up -d
```

This starts:
- 🗄️ SQL Server on `localhost:1433`
- 🔙 Backend API on `http://localhost:5000`
- 🔵 Frontend on `http://localhost:3000`

## Project Structure

```
AETP/
├── backend/                          # .NET 9 solution (Modular Monolith)
│   ├── src/
│   │   ├── Host/
│   │   │   └── AETP.Api/            # Composition root & Web API host
│   │   ├── BuildingBlocks/           # Shared Domain, Application, Infrastructure
│   │   └── Modules/                  # Business modules (Identity, Strategy, Capability, etc.)
│   ├── tests/
│   ├── AETP.sln
│   └── Directory.Build.props         # Shared project configuration
│
├── frontend/                         # React + TypeScript + Vite
│   ├── src/
│   │   ├── app/                      # Main App component & routing
│   │   ├── layout/                   # Main layout with navigation
│   │   ├── modules/                  # Feature modules (Strategy, Capability, etc.)
│   │   ├── shared/                   # Shared components, hooks, API client
│   │   └── types/                    # TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
│
├── docs/                             # Architecture & design documentation
│   ├── 00-overview-and-principles.md
│   ├── 01-methodology-horizons.md
│   ├── 02-traceability-model.md
│   ├── 03-raci-governance.md
│   ├── 04-domain-model-v1.md
│   ├── 05-context-map.md
│   ├── 06-solution-architecture-blueprint.md
│   └── README.md                     # Documentation index
│
├── deployment/
│   ├── bicep/                        # IaC (Infrastructure as Code)
│   ├── pipelines/                    # GitHub Actions CI/CD
│   └── docker/                       # Docker images & compose
│
└── scripts/                          # PowerShell automation
    ├── setup-dev-environment.ps1
    ├── run-migrations.ps1
    ├── seed-demo-engagement.ps1
    └── run-all-tests.ps1
```

## Architecture

### Backend: Modular Monolith (.NET 9)

**Clean Architecture per Module:**
```
Module/
├── Domain/              # Business entities, aggregates, value objects
├── Application/         # Use cases, commands, queries, validators
├── Infrastructure/      # Data persistence, external integrations
└── Api/                 # HTTP endpoints & DTOs
```

**Modules (MVP):**
1. **Identity** (Transversal) - AAD integration, app roles, user management
2. **ClientEngagement** - Client orgs, engagements, stakeholders
3. **Strategy** - Business strategies, objectives, KPIs
4. **Capability** - Capability maps, gaps, assessments
5. **Process** - Business processes, steps, decision points
6. **Opportunity** - Opportunities, scoring, innovation tracking
7. **TransformationProgram** - Initiatives, roadmaps, programs

**Communication Between Modules:**
- ✅ **Allowed:** EventBus (MediatR notifications), read-only public interfaces
- ❌ **Forbidden:** Cross-schema foreign keys, direct repository references

### Frontend: React + TypeScript

**Main Routes:**
- `/` - Dashboard / Overview
- `/strategy` - Strategy & Objectives
- `/capability` - Capabilities Map
- `/process` - Business Processes
- `/opportunity` - Opportunities & Innovation
- `/transformation-program` - Initiatives & Roadmap
- `/admin` - Administration

**State Management:** Zustand (lightweight) + TanStack Query (server state)

### Database: SQL Server (Single instance)

**Schema per Module:**
- `[identity]` - User & role management
- `[engagement]` - Client & engagement data
- `[strategy]` - Strategy, objectives, KPIs
- `[capability]` - Capabilities & gaps
- `[process]` - Processes & steps
- `[opportunity]` - Opportunities & scoring
- `[transformation]` - Programs, initiatives, roadmaps

**Design Principles:**
- 🔑 All tables partition by `EngagementId` (multi-tenancy)
- 📜 Golden Thread: read-only view across all schemas for traceability
- 🚫 No direct FKs across schemas (use EngagementId references only)

## Development Workflow

### Running Tests

```bash
# Unit tests
dotnet test backend --filter Category=Unit

# Integration tests (requires SQL Server)
dotnet test backend --filter Category=Integration

# Architecture tests (dependency rules, naming conventions)
dotnet test backend --filter Category=Architecture

# All tests with coverage
.\scripts\run-all-tests.ps1 -Coverage
```

### Code Quality

```bash
# Backend: EditorConfig + analyzer
dotnet build backend /p:EnforceCodeStyleInBuild=true

# Frontend: ESLint + TypeScript
npm run lint
npm run type-check
```

### Database Migrations

```bash
# Apply pending migrations
.\scripts\run-migrations.ps1

# Seed demo data
.\scripts\seed-demo-engagement.ps1
```

## Documentation

See [docs/README.md](./docs/README.md) for:
- **Strategic framework** - 21-phase methodology
- **Domain model** - DDD entities & contexts
- **Context map** - Bounded contexts & integrations
- **Solution architecture** - MVP scope, modules, sprints

## Deployment

### Local Docker

```bash
docker-compose -f deployment/docker/docker-compose.yml up
```

### Azure Deployment

```bash
# Deploy infrastructure with Bicep
az deployment group create \
  --resource-group aetp-rg \
  --template-file deployment/bicep/main.bicep \
  --parameters environment=dev

# Build and push Docker images
./deployment/docker/build-and-push.sh v0.1.0
```

### CI/CD Pipelines

GitHub Actions workflows:
- `.github/workflows/ci-backend.yml` - Build, test, lint backend
- `.github/workflows/ci-frontend.yml` - Build, test, lint frontend

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Backend** | .NET | 9.0 |
| **Web API** | ASP.NET Core | 9.0 |
| **ORM** | Entity Framework Core | 9.0 |
| **Database** | SQL Server | 2022+ |
| **Authentication** | Microsoft Entra ID | Latest |
| **Messaging** | MediatR | 12.x |
| **Validation** | FluentValidation | 11.x |
| | | |
| **Frontend** | React | 18.x |
| **Build Tool** | Vite | 5.x |
| **Routing** | React Router | 6.x |
| **UI Framework** | Material-UI | 5.x |
| **Data Fetching** | TanStack Query | 5.x |
| **State** | Zustand | 4.x |
| | | |
| **IaC** | Bicep | Latest |
| **Container** | Docker | 24.x |
| **CI/CD** | GitHub Actions | Latest |

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Commit changes: `git commit -m "feat: add my feature"`
3. Push: `git push origin feature/my-feature`
4. Open a Pull Request

## License

Proprietary - AETP Team

## Contact

For questions or support, contact the AETP team.
