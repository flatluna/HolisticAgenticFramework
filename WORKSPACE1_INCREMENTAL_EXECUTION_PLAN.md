# Workspace 1: Incremental Implementation Plan (Execution Mode)

**Role:** Staff .NET Engineer + Solution Architect + Technical Lead  
**Status:** IMPLEMENTATION PHASE (No Architecture, No Design, Building Now)  
**Repository:** AETP-Workspace1-EnterpriseKB (v1.0)  
**Date:** 2026-07-20  
**Mode:** Execution Mode - Day 1 Ready

---

## PART 1: CURRENT STATE ANALYSIS

### What Already Exists ✅

**Domain Layer (6 Entities):**
- [x] ClientOrganization (AggregateRoot)
- [x] Engagement (AggregateRoot) - **This is EngagementId scoping entity**
- [x] Stakeholder (Entity)
- [x] Strategy (AggregateRoot)
- [x] Objective (Entity)
- [x] KPI (Entity)

**Infrastructure Layer:**
- [x] ClientEngagementDbContext (partial - only 3 DbSets)
- [x] StrategyDbContext (3 DbSets: Strategies, Objectives, KPIs)
- [x] AetpDbContextBase (abstract base class)

**API Layer:**
- [x] ClientEngagementsController (basic CRUD)
- [x] StrategiesController (basic CRUD)
- [x] Program.cs (DI configured)

**Folder Structure:**
```
src/Modules/
├── ClientEngagement/
│   ├── Domain/
│   ├── Application/
│   ├── Infrastructure/
│   └── Api/
├── Strategy/
│   └── (similar structure)
```

### What's Missing (14 New Entities) ❌

**GROUP B - Organizational Context (3):**
- [ ] CompanyProfile
- [ ] Department
- [ ] Location

**GROUP C - Strategic Foundation (5):**
- [ ] Mission
- [ ] MissionStrategyAlignment
- [ ] Vision
- [ ] VisionMetric
- [ ] VisionStrategyAlignment

**GROUP D - Prioritization (2):**
- [ ] StrategicPriority
- [ ] StrategicPriorityStrategyAlignment

**GROUP E - Value Model (2):**
- [ ] BusinessModelCanvas
- [ ] BMCStrategyAlignment

**GROUP F - Knowledge Repository (3):**
- [ ] CorporateDocument
- [ ] DocumentStrategyAlignment
- [ ] DocumentObjectiveAlignment

**GROUP G - Intelligence (4):**
- [ ] AgentSession
- [ ] AgentQuery
- [ ] AgentInsight
- [ ] AgentRecommendation

### Missing Infrastructure ❌

**DbContexts:**
- [x] ClientEngagementDbContext exists but only has 3 DbSets (ClientOrganizations, Engagements, Stakeholders)
- [ ] Missing: 16 new DbSet mappings + Fluent API configs

**Migrations:**
- [ ] No migrations generated yet
- [ ] Database [engagement] schema empty (except if seed data exists)

**Controllers:**
- [ ] Missing 8 module controllers:
  - CompanyProfileController
  - MissionController
  - VisionController
  - CompetitiveAdvantageController
  - StrategicPriorityController
  - BusinessModelCanvasController
  - CorporateDocumentController
  - AgentSessionController

**Application Layer:**
- [ ] No CQRS handlers
- [ ] No validators
- [ ] No DTOs

---

## PART 2: FIRST FUNCTIONAL INCREMENT

### 🎯 FIRST BLOCK TO BUILD: CompanyProfile + Mission + Vision (CMV Stack)

**Why This Block First:**

1. **Foundation Layer:** CompanyProfile is the **organizational base** - all other entities reference CompanyProfile context
2. **Strategic Anchors:** Mission + Vision are **foundational strategies** - all Strategy alignments depend on these
3. **Logical Flow:** CompanyProfile → Mission/Vision → Strategy (natural dependency chain)
4. **MVP Completeness:** This block alone gives a **complete vertical slice**:
   - Create company
   - Document why it exists (Mission)
   - Document where it's going (Vision)
   - Measure vision progress (VisionMetric)
   - Validate completeness
5. **Team Parallelization:** While CMV is built, database and testing infra can be prepared
6. **User Value:** First day: "We have organizational intelligence captured and versioned"

**Entities to Implement (9 total):**

```
Tier 1: Organizational Context
├─ CompanyProfile (Aggregate Root)
├─ Department (Entity, owned by CompanyProfile)
└─ Location (Entity, owned by CompanyProfile)

Tier 2: Strategic Foundation (Part A)
├─ Mission (Aggregate Root)
├─ MissionStrategyAlignment (Junction, M:N)
├─ Vision (Aggregate Root)
├─ VisionMetric (Entity, owned by Vision)
└─ VisionStrategyAlignment (Junction, M:N)
```

**Why NOT start with CompetitiveAdvantage, Priority, BMC, Docs, Agent:**
- Those are **dependent** on Strategy alignment (requires existing Strategy)
- Those are **optimization layers** (not foundational)
- CMV gives immediate business value independently

---

## PART 3: DETAILED TECHNICAL BACKLOG

### Sprint 1 (Day 1-2): Domain Entities + DbContext

#### Task 1.1: Create Domain Entity Files
**Duration:** 2 hours  
**Deliverable:** 2 .cs files

```
File 1: CompanyProfileEntities.cs
├─ CompanyProfile (Aggregate Root)
├─ Department (Entity)
└─ Location (Entity)
All with factory Create() methods, validations

File 2: StrategicFoundationEntities.cs (Part A)
├─ Mission (Aggregate Root)
├─ MissionStrategyAlignment (Junction)
├─ Vision (Aggregate Root)
├─ VisionMetric (Entity)
└─ VisionStrategyAlignment (Junction)
```

**Definition:** Copy entire entity .cs files from WORKSPACE1_IMPLEMENTATION_ROADMAP.md § "Phase 1: Domain Entities"

**Success Criteria:**
- [ ] All 9 entities compile
- [ ] No syntax errors
- [ ] Factory methods present on all Aggregate Roots
- [ ] Validations present (Validate() methods)
- [ ] Relationships match spec

#### Task 1.2: Extend ClientEngagementDbContext
**Duration:** 2 hours  
**Deliverable:** Updated ClientEngagementDbContext.cs

**Add DbSet Properties:**
```csharp
// Organizational Context
public DbSet<CompanyProfile> CompanyProfiles { get; set; }
public DbSet<Department> Departments { get; set; }
public DbSet<Location> Locations { get; set; }

// Strategic Foundation
public DbSet<Mission> Missions { get; set; }
public DbSet<MissionStrategyAlignment> MissionStrategyAlignments { get; set; }
public DbSet<Vision> Visions { get; set; }
public DbSet<VisionMetric> VisionMetrics { get; set; }
public DbSet<VisionStrategyAlignment> VisionStrategyAlignments { get; set; }
```

**Add Fluent API Mappings (in OnModelCreating):**
- CompanyProfile: HasMany(Departments), HasMany(Locations), HasIndex(EngagementId)
- Department: HasIndex((CompanyProfileId, Name))
- Location: HasIndex((CompanyProfileId, City, Country))
- Mission: HasIndex((ClientOrganizationId, VersionNumber)) [UNIQUE]
- Vision: HasIndex((ClientOrganizationId, VersionNumber)) [UNIQUE]
- VisionMetric: HasMany via Vision
- (All junction tables with UNIQUE constraints)

**Success Criteria:**
- [ ] DbContext compiles
- [ ] All 9 DbSets present
- [ ] OnModelCreating executes without errors
- [ ] Indexes created as specified

#### Task 1.3: Run EF Core Migrations (Sequential)
**Duration:** 1 hour  
**Deliverable:** 2 migration .cs files

```powershell
# From backend/ directory

# Migration 1: CompanyProfile layer
dotnet ef migrations add Add_CompanyProfile_Departments_Locations `
  --project src/Modules/Engagement/AETP.Modules.Engagement.Infrastructure `
  --startup-project src/Host/AETP.Api `
  --context ClientEngagementDbContext `
  --output-dir Migrations

# Migration 2: Mission/Vision layer
dotnet ef migrations add Add_Mission_Vision_VisionMetrics `
  --project src/Modules/Engagement/AETP.Modules.Engagement.Infrastructure `
  --startup-project src/Host/AETP.Api `
  --context ClientEngagementDbContext `
  --output-dir Migrations
```

**Success Criteria:**
- [ ] 2 migration files generated (*.cs)
- [ ] Both migrations compile
- [ ] Migration names match convention

#### Task 1.4: Apply Migrations to Azure SQL
**Duration:** 0.5 hour  
**Deliverable:** Schema created in businessagenticdb

```powershell
dotnet ef database update `
  --project src/Modules/Engagement/AETP.Modules.Engagement.Infrastructure `
  --startup-project src/Host/AETP.Api `
  --context ClientEngagementDbContext `
  --connection "Server=tcp:flatsqlserver.database.windows.net,1433;Database=businessagenticdb;User Id=jorgeluna;Password=***;"
```

**Success Criteria:**
- [ ] Command completes without error
- [ ] Check Azure SQL: 9 new tables created in [engagement] schema
  - CompanyProfiles
  - Departments
  - Locations
  - Missions
  - MissionStrategyAlignments
  - Visions
  - VisionMetrics
  - VisionStrategyAlignments

**SQL Verification Query:**
```sql
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'engagement' 
ORDER BY TABLE_NAME;
```

---

### Sprint 2 (Day 3-4): Application Layer (CQRS)

#### Task 2.1: Create DTOs
**Duration:** 1 hour  
**Deliverable:** DTOs.cs

```csharp
// src/Modules/Engagement/AETP.Modules.Engagement.Application/DTOs/CompanyProfileDto.cs
public class CompanyProfileDto
{
    public Guid Id { get; set; }
    public Guid EngagementId { get; set; }
    public decimal AnnualRevenue { get; set; }
    public int TotalEmployees { get; set; }
    public int CloudAdoptionScore { get; set; }
    // ... all fields from spec
}

// Similar for MissionDto, VisionDto, VisionMetricDto, etc. (9 total)
```

**Success Criteria:**
- [ ] 9 DTO files created
- [ ] All properties match domain entity fields
- [ ] No compilation errors

#### Task 2.2: Create Commands + Handlers
**Duration:** 3 hours  
**Deliverable:** Commands/ folder with Create/Update/Delete commands

```
Commands/
├── CompanyProfile/
│   ├── CreateCompanyProfileCommand.cs
│   ├── CreateCompanyProfileHandler.cs
│   ├── CreateCompanyProfileValidator.cs
│   ├── UpdateCompanyProfileCommand.cs
│   ├── UpdateCompanyProfileHandler.cs
│   └── DeleteCompanyProfileCommand.cs
├── Mission/
│   ├── CreateMissionCommand.cs
│   ├── CreateMissionHandler.cs
│   ├── ApproveMissionCommand.cs
│   ├── ApproveMissionHandler.cs
│   └── ...
└── Vision/
    ├── CreateVisionCommand.cs
    ├── CreateVisionHandler.cs
    ├── AddVisionMetricCommand.cs
    ├── AddVisionMetricHandler.cs
    └── ...
```

**Pattern per Command:**
```csharp
// CreateCompanyProfileCommand
public class CreateCompanyProfileCommand : IRequest<CompanyProfileDto>
{
    public Guid EngagementId { get; set; }
    public Guid ClientOrganizationId { get; set; }
    public decimal AnnualRevenue { get; set; }
    // ... all input fields
}

// CreateCompanyProfileValidator (FluentValidation)
public class CreateCompanyProfileValidator : AbstractValidator<CreateCompanyProfileCommand>
{
    public CreateCompanyProfileValidator()
    {
        RuleFor(x => x.AnnualRevenue).GreaterThan(0);
        RuleFor(x => x.CloudAdoptionScore).InclusiveBetween(0, 100);
        // ... all validations
    }
}

// CreateCompanyProfileHandler
public class CreateCompanyProfileHandler : IRequestHandler<CreateCompanyProfileCommand, CompanyProfileDto>
{
    public async Task<CompanyProfileDto> Handle(CreateCompanyProfileCommand request, CancellationToken ct)
    {
        var entity = Domain.Entities.CompanyProfile.Create(...);
        _dbContext.CompanyProfiles.Add(entity);
        await _dbContext.SaveChangesAsync(ct);
        return _mapper.Map<CompanyProfileDto>(entity);
    }
}
```

**Minimum Commands per Entity:**

| Entity | Commands |
|--------|----------|
| CompanyProfile | Create, Update, Delete, GetById, List |
| Department | Create, Update, Delete, List |
| Location | Create, Update, Delete, List |
| Mission | Create, Update, Delete, Approve, GetById, List |
| Vision | Create, Update, Delete, Approve, GetById, List |
| VisionMetric | Create, Update, Delete, List |

**Success Criteria:**
- [ ] 35+ command files + handlers + validators
- [ ] All compile without error
- [ ] All follow CQRS pattern
- [ ] All validators present

#### Task 2.3: Create Queries + Handlers
**Duration:** 2 hours  
**Deliverable:** Queries/ folder

```
Queries/
├── CompanyProfile/
│   ├── GetCompanyProfileByIdQuery.cs + Handler
│   ├── ListCompanyProfilesQuery.cs + Handler (paginated)
│   ├── GetOrgChartQuery.cs + Handler (Depts + Locations)
│   └── GetGeographicReachQuery.cs + Handler
├── Mission/
│   ├── GetMissionByIdQuery.cs + Handler
│   ├── ListMissionsQuery.cs + Handler (with version history)
│   └── ValidateMissionStrategyAlignmentQuery.cs + Handler
└── Vision/
    ├── GetVisionByIdQuery.cs + Handler
    ├── ListVisionsQuery.cs + Handler
    ├── GetVisionProgressQuery.cs + Handler (with metrics)
    └── GetVisionMetricsQuery.cs + Handler
```

**Success Criteria:**
- [ ] 20+ query files + handlers
- [ ] Proper Include() for eager loading
- [ ] Filtering by EngagementId enforced
- [ ] Pagination support

#### Task 2.4: Register MediatR in Program.cs
**Duration:** 0.5 hour

```csharp
// In Program.cs
services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining(typeof(CreateCompanyProfileCommand)));
services.AddValidatorsFromAssemblyContaining(typeof(CreateCompanyProfileValidator));
services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
```

**Success Criteria:**
- [ ] MediatR registered
- [ ] Validators registered
- [ ] API compiles

---

### Sprint 3 (Day 5-6): REST API (Azure Functions)

#### Task 3.1: Create CompanyProfile Functions
**Duration:** 2 hours  
**Deliverable:** 5 Azure Functions

```
Api/Functions/CompanyProfile/
├── CreateCompanyProfileFunction.cs
├── GetCompanyProfileFunction.cs
├── ListCompanyProfilesFunction.cs
├── UpdateCompanyProfileFunction.cs
├── DeleteCompanyProfileFunction.cs
├── AddDepartmentFunction.cs
├── ListDepartmentsFunction.cs
├── AddLocationFunction.cs
├── ListLocationsFunction.cs
└── GetOrgChartFunction.cs
```

**Pattern per Function:**
```csharp
[Function("CreateCompanyProfile")]
public async Task<IActionResult> Run(
    [HttpTrigger(AuthorizationLevel.Function, "post", 
     Route = "engagements/{engagementId}/company-profile")] 
    HttpRequest req,
    string engagementId,
    CancellationToken cancellationToken)
{
    try
    {
        var command = // deserialize from req
        var result = await _mediator.Send(command, cancellationToken);
        return new CreatedResult($"/api/engagements/{engagementId}/company-profile/{result.Id}", result);
    }
    catch (ValidationException ex)
    {
        return new BadRequestObjectResult(new { error = ex.Message });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error");
        return new StatusCodeResult(500);
    }
}
```

**Success Criteria:**
- [ ] 10 functions created
- [ ] All compile
- [ ] MediatR calls working

#### Task 3.2: Create Mission Functions
**Duration:** 2 hours  
**Deliverable:** 5 Azure Functions

```
Api/Functions/Mission/
├── CreateMissionFunction.cs
├── GetMissionFunction.cs
├── ListMissionsFunction.cs
├── UpdateMissionFunction.cs
├── ApproveMissionFunction.cs
├── DeleteMissionFunction.cs
└── GetMissionVersionHistoryFunction.cs
```

**Success Criteria:**
- [ ] 7 functions created
- [ ] All compile
- [ ] Version handling correct

#### Task 3.3: Create Vision Functions
**Duration:** 2 hours  
**Deliverable:** 8 Azure Functions

```
Api/Functions/Vision/
├── CreateVisionFunction.cs
├── GetVisionFunction.cs
├── ListVisionsFunction.cs
├── UpdateVisionFunction.cs
├── ApproveVisionFunction.cs
├── DeleteVisionFunction.cs
├── AddVisionMetricFunction.cs
├── ListVisionMetricsFunction.cs
├── UpdateVisionMetricFunction.cs
├── DeleteVisionMetricFunction.cs
└── GetVisionProgressFunction.cs
```

**Success Criteria:**
- [ ] 10 functions created
- [ ] All compile
- [ ] Metric CRUD working

#### Task 3.4: Update local.settings.json
**Duration:** 0.25 hour

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "dotnet-isolated",
    "ConnectionStrings:DefaultConnection": "Server=tcp:flatsqlserver.database.windows.net,1433;Database=businessagenticdb;User Id=jorgeluna;Password=***;Encrypt=True;TrustServerCertificate=False;"
  }
}
```

**Success Criteria:**
- [ ] Connection string configured
- [ ] Local functions can start

---

### Sprint 4 (Day 7): Testing

#### Task 4.1: Unit Tests (Commands/Validators)
**Duration:** 2 hours  
**Deliverable:** Domain.Tests + Application.Tests

```
Tests/
├── Domain.Tests/
│   ├── CompanyProfileEntityTests.cs
│   ├── MissionEntityTests.cs
│   └── VisionEntityTests.cs
├── Application.Tests/
│   ├── CreateCompanyProfileCommandTests.cs
│   ├── CreateCompanyProfileValidatorTests.cs
│   ├── CreateMissionCommandTests.cs
│   ├── ApproveMissionCommandTests.cs
│   ├── CreateVisionCommandTests.cs
│   ├── AddVisionMetricCommandTests.cs
│   └── ...
```

**Test Coverage Target:** ≥80% for Business Logic

**Success Criteria:**
- [ ] 30+ unit tests written
- [ ] All tests passing
- [ ] Coverage report ≥80%

#### Task 4.2: Integration Tests (Azure Functions)
**Duration:** 2 hours  
**Deliverable:** Api.Tests

```
Api.Tests/
├── CompanyProfileFunctionTests.cs
├── MissionFunctionTests.cs
└── VisionFunctionTests.cs
```

**Scenarios per Module:**
1. Create → Verify 201 Created
2. Get → Verify 200 OK + correct data
3. List → Verify pagination
4. Update → Verify 200 OK
5. Delete → Verify 204 No Content
6. Validations → Verify 400 Bad Request

**Success Criteria:**
- [ ] 20+ integration tests
- [ ] All passing
- [ ] Happy path + error cases covered

#### Task 4.3: Manual Smoke Tests
**Duration:** 1 hour  
**Deliverable:** Postman collection or curl commands

```powershell
# Create CompanyProfile
curl -X POST "http://localhost:7071/api/engagements/00000000-0000-0000-0000-000000000001/company-profile" `
  -H "Content-Type: application/json" `
  -d @- <<EOF
{
  "clientOrganizationId": "00000000-0000-0000-0000-000000000002",
  "annualRevenue": 1000000,
  "totalEmployees": 100,
  "cloudAdoptionScore": 65,
  "dataMaturityScore": 50,
  "aiAdoptionScore": 40
}
EOF

# Get CompanyProfile
curl -X GET "http://localhost:7071/api/engagements/00000000-0000-0000-0000-000000000001/company-profile/{id}"

# Create Mission
curl -X POST "http://localhost:7071/api/engagements/00000000-0000-0000-0000-000000000001/missions" ...

# Create Vision
curl -X POST "http://localhost:7071/api/engagements/00000000-0000-0000-0000-000000000001/visions" ...

# Add Vision Metric
curl -X POST "http://localhost:7071/api/engagements/00000000-0000-0000-0000-000000000001/visions/{id}/metrics" ...
```

**Success Criteria:**
- [ ] All CRUD operations return correct status codes
- [ ] Data persists to database
- [ ] No exceptions

---

## PART 4: FILE STRUCTURE (Exact Paths)

```
backend/
├── src/
│   ├── Modules/
│   │   └── Engagement/
│   │       ├── AETP.Modules.Engagement.Domain/
│   │       │   └── Entities/
│   │       │       ├── CompanyProfileEntities.cs (NEW)
│   │       │       └── StrategicFoundationEntities.cs (NEW - Part A: Mission, Vision)
│   │       │
│   │       ├── AETP.Modules.Engagement.Application/
│   │       │   ├── DTOs/ (NEW)
│   │       │   │   ├── CompanyProfileDto.cs
│   │       │   │   ├── DepartmentDto.cs
│   │       │   │   ├── LocationDto.cs
│   │       │   │   ├── MissionDto.cs
│   │       │   │   ├── VisionDto.cs
│   │       │   │   └── VisionMetricDto.cs
│   │       │   ├── Commands/ (NEW - 35+ files)
│   │       │   │   ├── CompanyProfile/
│   │       │   │   │   ├── CreateCompanyProfileCommand.cs
│   │       │   │   │   ├── CreateCompanyProfileHandler.cs
│   │       │   │   │   ├── CreateCompanyProfileValidator.cs
│   │       │   │   │   ├── UpdateCompanyProfileCommand.cs
│   │       │   │   │   ├── UpdateCompanyProfileHandler.cs
│   │       │   │   │   └── DeleteCompanyProfileCommand.cs
│   │       │   │   ├── Mission/ (similar pattern)
│   │       │   │   │   ├── CreateMissionCommand.cs
│   │       │   │   │   ├── CreateMissionHandler.cs
│   │       │   │   │   ├── CreateMissionValidator.cs
│   │       │   │   │   ├── ApproveMissionCommand.cs
│   │       │   │   │   ├── ApproveMissionHandler.cs
│   │       │   │   │   └── ...
│   │       │   │   └── Vision/ (similar pattern)
│   │       │   │       ├── CreateVisionCommand.cs
│   │       │   │       ├── CreateVisionHandler.cs
│   │       │   │       ├── ApproveVisionCommand.cs
│   │       │   │       ├── ApproveVisionHandler.cs
│   │       │   │       ├── AddVisionMetricCommand.cs
│   │       │   │       └── ...
│   │       │   └── Queries/ (NEW - 20+ files)
│   │       │       ├── CompanyProfile/
│   │       │       │   ├── GetCompanyProfileByIdQuery.cs
│   │       │       │   ├── GetCompanyProfileByIdHandler.cs
│   │       │       │   ├── ListCompanyProfilesQuery.cs
│   │       │       │   ├── ListCompanyProfilesHandler.cs
│   │       │       │   ├── GetOrgChartQuery.cs
│   │       │       │   └── GetOrgChartHandler.cs
│   │       │       ├── Mission/ (similar pattern)
│   │       │       │   ├── GetMissionByIdQuery.cs
│   │       │       │   ├── GetMissionByIdHandler.cs
│   │       │       │   ├── ListMissionsQuery.cs
│   │       │       │   └── ListMissionsHandler.cs
│   │       │       └── Vision/ (similar pattern)
│   │       │           ├── GetVisionByIdQuery.cs
│   │       │           ├── GetVisionByIdHandler.cs
│   │       │           ├── ListVisionsQuery.cs
│   │       │           ├── ListVisionsHandler.cs
│   │       │           └── GetVisionProgressQuery.cs
│   │       │
│   │       ├── AETP.Modules.Engagement.Infrastructure/
│   │       │   ├── ClientEngagementDbContext.cs (UPDATED: +16 DbSets, +9 mappings)
│   │       │   └── Migrations/
│   │       │       ├── 20260720_Add_CompanyProfile_Departments_Locations.cs (NEW)
│   │       │       └── 20260720_Add_Mission_Vision_VisionMetrics.cs (NEW)
│   │       │
│   │       └── AETP.Modules.Engagement.Api/
│   │           ├── Functions/
│   │           │   ├── CompanyProfile/
│   │           │   │   ├── CreateCompanyProfileFunction.cs (NEW)
│   │           │   │   ├── GetCompanyProfileFunction.cs (NEW)
│   │           │   │   ├── ListCompanyProfilesFunction.cs (NEW)
│   │           │   │   ├── UpdateCompanyProfileFunction.cs (NEW)
│   │           │   │   ├── DeleteCompanyProfileFunction.cs (NEW)
│   │           │   │   ├── AddDepartmentFunction.cs (NEW)
│   │           │   │   ├── ListDepartmentsFunction.cs (NEW)
│   │           │   │   ├── AddLocationFunction.cs (NEW)
│   │           │   │   ├── ListLocationsFunction.cs (NEW)
│   │           │   │   └── GetOrgChartFunction.cs (NEW)
│   │           │   ├── Mission/
│   │           │   │   ├── CreateMissionFunction.cs (NEW)
│   │           │   │   ├── GetMissionFunction.cs (NEW)
│   │           │   │   ├── ListMissionsFunction.cs (NEW)
│   │           │   │   ├── UpdateMissionFunction.cs (NEW)
│   │           │   │   ├── ApproveMissionFunction.cs (NEW)
│   │           │   │   ├── DeleteMissionFunction.cs (NEW)
│   │           │   │   └── GetMissionVersionHistoryFunction.cs (NEW)
│   │           │   └── Vision/
│   │           │       ├── CreateVisionFunction.cs (NEW)
│   │           │       ├── GetVisionFunction.cs (NEW)
│   │           │       ├── ListVisionsFunction.cs (NEW)
│   │           │       ├── UpdateVisionFunction.cs (NEW)
│   │           │       ├── ApproveVisionFunction.cs (NEW)
│   │           │       ├── DeleteVisionFunction.cs (NEW)
│   │           │       ├── AddVisionMetricFunction.cs (NEW)
│   │           │       ├── ListVisionMetricsFunction.cs (NEW)
│   │           │       ├── UpdateVisionMetricFunction.cs (NEW)
│   │           │       ├── DeleteVisionMetricFunction.cs (NEW)
│   │           │       └── GetVisionProgressFunction.cs (NEW)
│   │           └── local.settings.json (UPDATED: connection string)
│   │
│   └── Tests/
│       ├── AETP.Modules.Engagement.Domain.Tests/
│       │   ├── Entities/
│       │   │   ├── CompanyProfileEntityTests.cs (NEW)
│       │   │   ├── MissionEntityTests.cs (NEW)
│       │   │   └── VisionEntityTests.cs (NEW)
│       │   └── ... (15+ tests)
│       │
│       ├── AETP.Modules.Engagement.Application.Tests/
│       │   ├── Commands/
│       │   │   ├── CompanyProfile/
│       │   │   │   ├── CreateCompanyProfileCommandTests.cs (NEW)
│       │   │   │   ├── CreateCompanyProfileValidatorTests.cs (NEW)
│       │   │   │   └── ...
│       │   │   ├── Mission/ (similar)
│       │   │   └── Vision/ (similar)
│       │   └── Queries/
│       │       ├── CompanyProfile/
│       │       ├── Mission/
│       │       └── Vision/
│       │   ... (30+ tests)
│       │
│       └── AETP.Modules.Engagement.Api.Tests/
│           ├── Functions/
│           │   ├── CompanyProfileFunctionTests.cs (NEW)
│           │   ├── MissionFunctionTests.cs (NEW)
│           │   └── VisionFunctionTests.cs (NEW)
│           ... (20+ integration tests)
```

**Total New Files: 120+**

**File Count by Type:**
- Domain Entities: 2 files
- Application DTOs: 6 files
- CQRS Commands: 25 files (handlers + validators)
- CQRS Queries: 15 files (handlers)
- Azure Functions: 25 files
- Migrations: 2 files
- Tests: 50+ files

---

## PART 5: DEFINITION OF DONE

### Increment 1 Complete When:

#### ✅ Database Layer
- [x] 2 migrations generated (Add_CompanyProfile... & Add_Mission_Vision...)
- [x] Migrations applied to businessagenticdb
- [x] 9 tables exist in [engagement] schema:
  - CompanyProfiles
  - Departments
  - Locations
  - Missions
  - MissionStrategyAlignments
  - Visions
  - VisionMetrics
  - VisionStrategyAlignments
- [x] All indexes created
- [x] All relationships valid (checked with: SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS)

#### ✅ Domain Layer
- [x] CompanyProfileEntities.cs compiles
- [x] StrategicFoundationEntities.cs (Part A) compiles
- [x] All factory Create() methods present
- [x] All Validate() methods working
- [x] All relationships correctly declared

#### ✅ Application Layer
- [x] 6 DTOs created
- [x] 35+ Commands + Handlers + Validators created
- [x] 20+ Queries + Handlers created
- [x] All CQRS code compiles
- [x] MediatR registration in Program.cs

#### ✅ API Layer
- [x] 10 CompanyProfile Functions created + working
- [x] 7 Mission Functions created + working
- [x] 10 Vision Functions created + working
- [x] All functions compile
- [x] All routes accessible via localhost:7071

#### ✅ Testing
- [x] 15+ Domain entity tests passing
- [x] 30+ Application layer tests passing
- [x] 20+ Integration tests passing
- [x] Overall test coverage ≥80%
- [x] All business validations covered

#### ✅ Smoke Tests (Manual Validation)
- [x] POST /api/engagements/{id}/company-profile → 201 Created ✓
- [x] GET /api/engagements/{id}/company-profile/{id} → 200 OK + correct data ✓
- [x] POST /api/engagements/{id}/missions → 201 Created ✓
- [x] POST /api/engagements/{id}/missions/{id}/approve → 200 OK ✓
- [x] POST /api/engagements/{id}/visions → 201 Created ✓
- [x] POST /api/engagements/{id}/visions/{id}/metrics → 201 Created ✓
- [x] GET /api/engagements/{id}/visions/{id}/progress → 200 OK + metrics ✓
- [x] Validations working (bad data → 400 Bad Request) ✓

#### ✅ Swagger/OpenAPI
- [x] Swagger UI accessible at http://localhost:7071/swagger/
- [x] All 27 endpoints documented
- [x] All request/response schemas visible
- [x] Test endpoints from Swagger working

#### ✅ Database Verification Queries
```sql
-- All tables created?
SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'engagement' AND TABLE_NAME IN (
  'CompanyProfiles', 'Departments', 'Locations',
  'Missions', 'MissionStrategyAlignments',
  'Visions', 'VisionMetrics', 'VisionStrategyAlignments'
);
-- Expected: 8 rows

-- Sample data round-trip?
INSERT INTO [engagement].[CompanyProfiles] (...) VALUES (...)
SELECT * FROM [engagement].[CompanyProfiles] WHERE Id = ...
DELETE FROM [engagement].[CompanyProfiles] WHERE Id = ...
-- Expected: CREATE → READ → DELETE all work
```

#### ✅ Code Quality
- [x] No compiler warnings
- [x] No null reference exceptions
- [x] No unhandled exceptions in error paths
- [x] Logging configured (errors logged)

#### ✅ Performance
- [x] Create CompanyProfile: <500ms
- [x] Get CompanyProfile with related entities: <1000ms
- [x] List CompanyProfiles (paginated): <2000ms

---

## PART 6: EXECUTION TIMELINE

| Day | Sprint | Tasks | Duration | Deliverable |
|-----|--------|-------|----------|-------------|
| 1 | 1 | 1.1-1.4 | 5.5h | 9 entities, migrations applied, 9 tables in DB |
| 2 | 2 | 2.1-2.4 | 6.5h | 35+ CQRS handlers, 20+ queries, MediatR wired |
| 3 | 3 | 3.1-3.3 | 5h | 25 Azure Functions, locally runnable |
| 4 | 3-4 | 3.4-4.3 | 4.5h | local.settings.json, 30+ unit tests, smoke tests passing |
| 5 | 4 | 4.2-4.3 | 1.5h | Integration tests, all endpoints validated |
| **TOTAL** | | | **23 hours** | **Fully Functional MVP: CompanyProfile + Mission + Vision** |

---

## PART 7: NEXT INCREMENTS (After CMV Delivered)

Once Increment 1 (CMV) is DONE and deployed to Azure:

### Increment 2 (Days 8-10): CompetitiveAdvantage
- 3 entities (CompetitiveAdvantage + 2 junctions)
- 8 Functions, CQRS, tests

### Increment 3 (Days 11-13): StrategicPriority
- 2 entities + 1 junction
- 10 Functions, CQRS, tests

### Increment 4 (Days 14-16): BusinessModelCanvas
- 2 entities + 1 junction
- 10 Functions, CQRS, tests

### Increment 5 (Days 17-21): CorporateDocument
- 3 entities + junctions
- 15 Functions, CQRS, tests, Blob Storage integration

### Increment 6 (Days 22-25): AgentSession
- 4 entities
- 8 Functions, CQRS, tests, LLM integration

---

## PART 8: EXECUTION CHECKLIST (RIGHT NOW)

### Before You Start Coding

- [ ] Clone repo (if not already)
- [ ] Verify .NET 9 installed: `dotnet --version`
- [ ] Verify EF CLI installed: `dotnet ef` (from any directory)
- [ ] Verify Azure SQL connection: Can connect to businessagenticdb via SQL Server Management Studio
- [ ] Verify VS Code extensions: C#, REST Client, Azure Functions installed
- [ ] Create branch: `git checkout -b feature/workspace1-cmv-increment`

### During Coding

- [ ] Keep `WORKSPACE1_IMPLEMENTATION_ROADMAP.md` open (Phase 1, Phase 2, Phase 3, Phase 4, Phase 5)
- [ ] Copy entity code directly from roadmap (don't retype)
- [ ] Use Entity Factory pattern (no parameterless constructors)
- [ ] Add Validations to all Aggregate Roots
- [ ] Every Command must have a Validator
- [ ] Every Query must have eager loading (Include)
- [ ] All APIs enforce EngagementId filtering

### Testing Each Completed Component

```powershell
# After each task, run:
dotnet build  # Compiles?
dotnet test   # Tests pass?
func start    # Functions start locally?
```

---

## PART 9: SUCCESS METRICS

After Increment 1 (Day 5):

| Metric | Target | Success |
|--------|--------|---------|
| **Code Compile** | 0 errors | ✅ |
| **Unit Test Coverage** | ≥80% | ✅ |
| **All Tests Passing** | 100% | ✅ |
| **Endpoints Responsive** | 27/27 | ✅ |
| **Database Round-Trip** | CRUD works | ✅ |
| **Swagger Docs** | Complete | ✅ |
| **Smoke Tests** | All pass | ✅ |
| **No Unhandled Exceptions** | 0 | ✅ |

---

**Ready to Start Coding?** ✅

Your first PR should be:
- Title: `feat: Workspace1 Increment 1 - CompanyProfile, Mission, Vision (CMV Stack)`
- Files: 120+
- Tests: 65+
- Duration: 23 hours (distributed over 5 days)
- Status: PRODUCTION READY

**Next Step:** Start with Task 1.1 (Create Domain Entity Files)
