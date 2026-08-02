# AETP Backend - .NET 9 API

## Quick Start

### Prerequisites
- .NET 9 SDK
- SQL Server (or Azure SQL)
- Visual Studio / VS Code

### Connection String
Update `src/Host/AETP.Api/appsettings.json`:
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=tcp:flatsqlserver.database.windows.net,1433;Initial Catalog=businessagenticdb;Persist Security Info=False;User ID=jorgeluna;Password=YOUR_PASSWORD_HERE;..."
}
```

### Build & Run

```bash
# Restore packages
dotnet restore

# Build solution
dotnet build

# Create migrations (first time only)
..\scripts\create-migrations.ps1

# Apply migrations to database
..\scripts\run-migrations.ps1

# Run API
dotnet run --project src/Host/AETP.Api/AETP.Api.csproj

# API will be available at:
# http://localhost:5000 (default)
# Swagger UI: http://localhost:5000/swagger
```

## Project Structure

```
src/
├── Host/
│   └── AETP.Api/              # Composition root & Web API host
│       ├── Program.cs
│       ├── appsettings.json
│       └── Controllers/        # (add module controllers here)
│
├── BuildingBlocks/
│   ├── Domain/                # Base entities (Entity, AggregateRoot)
│   ├── Application/           # Common DTOs, behaviors, exceptions
│   ├── Infrastructure/        # DbContextBase, Persistence abstractions
│   └── EventBus/              # MediatR-based in-process event bus
│
└── Modules/
    ├── ClientEngagement/      # Multi-tenant context
    │   ├── Domain/
    │   ├── Application/
    │   ├── Infrastructure/    # ClientEngagementDbContext
    │   └── Api/               # ClientEngagementsController
    │
    ├── Strategy/              # Business strategy & objectives
    │   ├── Domain/
    │   ├── Application/
    │   ├── Infrastructure/    # StrategyDbContext
    │   └── Api/               # StrategiesController
    │
    ├── Capability/            # (stub)
    ├── Process/               # (stub)
    ├── Opportunity/           # (stub)
    ├── TransformationProgram/ # (stub)
    └── Identity/              # (stub - AAD integration)
```

## Database Schema

**Schemas (one per module):**
- `engagement` - ClientOrganizations, Engagements, Stakeholders
- `strategy` - Strategies, Objectives, KPIs
- `capability` - (future)
- `process` - (future)
- `opportunity` - (future)
- `transformation` - (future)
- `identity` - (future)

**Multi-Tenancy:**
- All tables have `EngagementId` column
- Queries always filter by `EngagementId`
- No cross-schema foreign keys

## Entity Framework Core

### Create Migration
```bash
dotnet ef migrations add MigrationName `
    --project src/Modules/ClientEngagement/AETP.Modules.ClientEngagement.Infrastructure `
    --startup-project src/Host/AETP.Api `
    --context ClientEngagementDbContext `
    --output-dir Migrations
```

### Apply Migration
```bash
dotnet ef database update `
    --project src/Modules/ClientEngagement/AETP.Modules.ClientEngagement.Infrastructure `
    --startup-project src/Host/AETP.Api `
    --context ClientEngagementDbContext
```

## API Endpoints

### ClientEngagement Module

**Clients:**
- `GET /api/clientengagements/clients` - List all clients
- `POST /api/clientengagements/clients` - Create client
- `GET /api/clientengagements/clients/{id}` - Get client by ID

**Engagements:**
- `GET /api/clientengagements/engagements` - List engagements
- `POST /api/clientengagements/engagements` - Create engagement
- `GET /api/clientengagements/engagements/{id}` - Get engagement by ID
- `POST /api/clientengagements/engagements/{id}/stakeholders` - Add stakeholder

### Strategy Module

**Strategies:**
- `GET /api/strategies?engagementId=...` - List strategies
- `POST /api/strategies` - Create strategy
- `GET /api/strategies/{id}` - Get strategy with objectives & KPIs
- `POST /api/strategies/{id}/objectives` - Create objective
- `POST /api/strategies/objectives/{id}/kpis` - Create KPI

## Logging

Serilog is configured to write to console. Adjust in `Program.cs`:
```csharp
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()  // Debug, Information, Warning, Error
    .WriteTo.Console()
    .WriteTo.File("logs/aetp-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();
```

## Authentication

Currently using Microsoft.Identity.Web for Entra ID. Configure in `appsettings.json`:
```json
"AzureAd": {
  "TenantId": "YOUR_TENANT_ID",
  "ClientId": "YOUR_CLIENT_ID"
}
```

## Development Tips

1. **Hot Reload:** `dotnet watch run` (automatic restart on file changes)
2. **Entity Auditing:** Override `SaveChangesAsync()` in DbContextBase to add audit timestamps
3. **Domain Events:** Use `BuildingBlocks.EventBus` to decouple modules
4. **Validation:** Add FluentValidation validators in Application layer
5. **Error Handling:** Throw domain-specific exceptions in Domain, handle in API layer

## Common Issues

**Issue:** "Cannot connect to database"
- Verify connection string in `appsettings.json`
- Check firewall rules for Azure SQL
- Ensure username/password are correct

**Issue:** "Migration failed - context not found"
- Verify `--startup-project` is correct (must be AETP.Api)
- Ensure DbContext is in Infrastructure project

**Issue:** "EngagementId is required but not provided"
- All write operations must include `EngagementId`
- Add validation in DTOs

## References

- [Entity Framework Core Docs](https://learn.microsoft.com/en-us/ef/core/)
- [ASP.NET Core Docs](https://learn.microsoft.com/en-us/aspnet/core/)
- [Microsoft.Identity.Web](https://github.com/AzureAD/microsoft-identity-web)
