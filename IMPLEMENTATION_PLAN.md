# Workspace 1: Implementation Plan (Phase 1-2)

**Date:** 2026-07-20  
**Scope:** Domain Entities + Database Schema  
**Duration:** 2 weeks  

---

## Phase 1: Domain Entities (Week 1)

### 1.1 Create Domain Entity Classes

**Location:** `backend/src/BuildingBlocks/AETP.BuildingBlocks.Domain/`

Create file: `CompanyProfileEntities.cs`
```csharp
// CompanyProfile : AggregateRoot
// Department : Entity
// Location : Entity
```

**Location:** `backend/src/Modules/ClientEngagement/AETP.Modules.ClientEngagement.Domain/`

Create file: `EnterpriseKnowledgeBaseEntities.cs`
```csharp
// Mission : AggregateRoot
// Vision : AggregateRoot
// VisionMetric : Entity
// CompetitiveAdvantage : AggregateRoot
// StrategicPriority : AggregateRoot
// BusinessModelCanvas : AggregateRoot
```

**Location:** `backend/src/Modules/ClientEngagement/AETP.Modules.ClientEngagement.Domain/`

Create file: `DocumentRepositoryEntities.cs`
```csharp
// CorporateDocument : AggregateRoot
// DocumentStrategyAlignment : Entity
// DocumentObjectiveAlignment : Entity
```

**Location:** `backend/src/Modules/ClientEngagement/AETP.Modules.ClientEngagement.Domain/`

Create file: `AgentIntelligenceEntities.cs`
```csharp
// AgentSession : AggregateRoot
// AgentQuery : Entity
// AgentInsight : Entity
// AgentRecommendation : Entity
```

---

### 1.2 Update Project References

File: `backend/src/Host/AETP.Api/AETP.Api.csproj`

Add project references for:
- ClientEngagement.Domain

File: `backend/src/Modules/ClientEngagement/AETP.Modules.ClientEngagement.Infrastructure/AETP.Modules.ClientEngagement.Infrastructure.csproj`

Verify references:
- AETP.BuildingBlocks.Domain
- AETP.BuildingBlocks.Infrastructure

---

## Phase 2: Database Schema & Migrations (Week 2)

### 2.1 Extend ClientEngagementDbContext

**Location:** `backend/src/Modules/ClientEngagement/AETP.Modules.ClientEngagement.Infrastructure/`

Update file: `ClientEngagementDbContext.cs`

Add DbSet properties:
```csharp
// Company Profile
public DbSet<CompanyProfile> CompanyProfiles { get; set; }
public DbSet<Department> Departments { get; set; }
public DbSet<Location> Locations { get; set; }

// Enterprise Knowledge Base
public DbSet<Mission> Missions { get; set; }
public DbSet<Vision> Visions { get; set; }
public DbSet<VisionMetric> VisionMetrics { get; set; }
public DbSet<CompetitiveAdvantage> CompetitiveAdvantages { get; set; }
public DbSet<StrategicPriority> StrategicPriorities { get; set; }
public DbSet<BusinessModelCanvas> BusinessModelCanvases { get; set; }

// Corporate Documents
public DbSet<CorporateDocument> CorporateDocuments { get; set; }
public DbSet<DocumentStrategyAlignment> DocumentStrategyAlignments { get; set; }
public DbSet<DocumentObjectiveAlignment> DocumentObjectiveAlignments { get; set; }

// Agent Intelligence
public DbSet<AgentSession> AgentSessions { get; set; }
public DbSet<AgentQuery> AgentQueries { get; set; }
public DbSet<AgentInsight> AgentInsights { get; set; }
public DbSet<AgentRecommendation> AgentRecommendations { get; set; }
```

Extend `OnModelCreating()`:
```csharp
// Company Profile mappings
modelBuilder.Entity<CompanyProfile>(entity => { ... });
modelBuilder.Entity<Department>(entity => { ... });
modelBuilder.Entity<Location>(entity => { ... });

// Enterprise Knowledge Base mappings
modelBuilder.Entity<Mission>(entity => { ... });
modelBuilder.Entity<Vision>(entity => { ... });
// ... etc for all 8 components
```

---

### 2.2 Create EF Core Migrations

**Command:** 
```bash
cd backend
.\..\..\scripts\create-migrations.ps1
```

This will generate:
- `Migrations/` folder in ClientEngagement.Infrastructure
- `Migrations/yyyyMMddhhmmss_Initial.cs`
- `Migrations/yyyyMMddhhmmss_Initial.Designer.cs`

**Verify:**
```bash
# Check migration file was created
dir src/Modules/ClientEngagement/AETP.Modules.ClientEngagement.Infrastructure/Migrations
```

---

### 2.3 Apply Migrations to Database

**Prerequisites:**
- Update `appsettings.json` with real SQL password
- Ensure connection to `flatsqlserver.database.windows.net / businessagenticdb`

**Command:**
```bash
.\..\..\scripts\run-migrations.ps1
```

**Verify:**
Connect to Azure SQL and query:
```sql
-- Verify tables created in [engagement] schema
SELECT TABLE_SCHEMA, TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'engagement' 
ORDER BY TABLE_NAME;

-- Expected ~20 tables:
-- CompanyProfiles, Departments, Locations
-- Missions, MissionStrategyAlignments
-- Visions, VisionMetrics, VisionStrategyAlignments
-- CompetitiveAdvantages, CompetitiveAdvantageStrategyAlignments
-- StrategicPriorities, StrategicPriorityStrategyAlignments
-- BusinessModelCanvases, BMCStrategyAlignments
-- CorporateDocuments, DocumentStrategyAlignments, DocumentObjectiveAlignments
-- AgentSessions, AgentQueries, AgentInsights, AgentRecommendations
```

---

## Deliverables Checklist

### Week 1 (Domain Entities)
- [ ] CompanyProfileEntities.cs created
- [ ] EnterpriseKnowledgeBaseEntities.cs created
- [ ] DocumentRepositoryEntities.cs created
- [ ] AgentIntelligenceEntities.cs created
- [ ] All entities have factory Create() methods
- [ ] All entities have proper validation attributes
- [ ] Project references updated in .csproj files

### Week 2 (Database Schema)
- [ ] ClientEngagementDbContext extended with all DbSet properties
- [ ] OnModelCreating() configured for all 14 entities
- [ ] create-migrations.ps1 executed successfully
- [ ] Migration files generated in Migrations/ folder
- [ ] run-migrations.ps1 executed successfully
- [ ] All tables created in `businessagenticdb` [engagement] schema
- [ ] Relationships (FK, indexes) verified in SQL

---

## Key Files to Create/Update

| File | Action | Lines |
|------|--------|-------|
| CompanyProfileEntities.cs | CREATE | ~100 |
| EnterpriseKnowledgeBaseEntities.cs | CREATE | ~250 |
| DocumentRepositoryEntities.cs | CREATE | ~100 |
| AgentIntelligenceEntities.cs | CREATE | ~150 |
| ClientEngagementDbContext.cs | UPDATE | +400 |
| create-migrations.ps1 | EXISTS | (verify) |
| run-migrations.ps1 | EXISTS | (verify) |

---

## Testing & Validation

### Unit Tests (Optional but Recommended)
```csharp
// Test: CompanyProfile.Create() initializes correctly
[Fact]
public void CompanyProfile_Create_SetsAllProperties()
{
    var profile = CompanyProfile.Create(Guid.NewGuid(), Guid.NewGuid(), "1995-03-15");
    Assert.NotNull(profile);
    Assert.Equal("1995-03-15", profile.Founded);
}

// Test: Validation rules
[Fact]
public void Mission_Create_RequiresMissionStatement()
{
    var mission = Mission.Create(Guid.NewGuid(), Guid.NewGuid(), "");
    // Should fail validation
}
```

### Integration Tests (Optional)
```csharp
// Test: Can save and retrieve CompanyProfile from DB
[Fact]
public async Task CompanyProfile_SaveAndRetrieve()
{
    var context = new ClientEngagementDbContext(options);
    var profile = CompanyProfile.Create(Guid.NewGuid(), Guid.NewGuid(), "2020-01-01");
    
    context.CompanyProfiles.Add(profile);
    await context.SaveChangesAsync();
    
    var retrieved = await context.CompanyProfiles.FindAsync(profile.Id);
    Assert.NotNull(retrieved);
}
```

---

## SQL Verification Queries

After migrations:

```sql
-- Count tables
SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'engagement';
-- Expected: ~20

-- Verify relationships
SELECT 
    CONSTRAINT_NAME, 
    TABLE_NAME, 
    REFERENCED_TABLE_NAME 
FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS 
WHERE TABLE_SCHEMA = 'engagement';

-- Verify indexes
SELECT TABLE_NAME, INDEX_NAME 
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = 'engagement';

-- Test insert (CompanyProfile)
INSERT INTO [engagement].[CompanyProfiles] 
(Id, EngagementId, ClientOrganizationId, Founded, TotalEmployees, Status, CreatedAt)
VALUES (NEWID(), NEWID(), (SELECT TOP 1 Id FROM [engagement].[ClientOrganizations]), '2020-01-01', 500, 'Active', GETUTCDATE());

-- Verify insert
SELECT * FROM [engagement].[CompanyProfiles];
```

---

## Common Issues & Troubleshooting

### Issue: "Type 'Mission' is not mapped"
**Cause:** DbSet property not added to DbContext  
**Fix:** Add `public DbSet<Mission> Missions { get; set; }` to ClientEngagementDbContext

### Issue: "Foreign key constraint failed"
**Cause:** Trying to insert Document without Strategy FK  
**Fix:** Ensure FK references exist; check migration order

### Issue: "Cannot find migration"
**Cause:** create-migrations.ps1 failed silently  
**Fix:** Check appsettings.json connection string; run dotnet build first

### Issue: "Schema 'engagement' does not exist"
**Cause:** OnModelCreating not calling HasDefaultSchema  
**Fix:** Verify `modelBuilder.HasDefaultSchema("engagement");` in each DbContext

---

## Next: Phase 3 (REST Controllers)

Once Phase 1-2 complete:

1. Create CompanyProfileController
2. Create MissionController
3. Create VisionController
4. Create CompetitiveAdvantageController
5. Create StrategicPriorityController
6. Create BusinessModelCanvasController
7. Create CorporateDocumentController
8. Create AgentController

Each controller will have:
- GET (all, by ID)
- POST (create)
- PUT (update)
- DELETE (remove)
- Custom endpoints (alignment, versioning, search)

---

## Sign-Off

- [ ] All 14 domain entities created
- [ ] Database migrations applied successfully
- [ ] All tables exist in businessagenticdb [engagement] schema
- [ ] Relationships verified
- [ ] Ready for Phase 3 (Controllers + API)

**Timeline:** 2 weeks (1 week entities, 1 week migrations + testing)
