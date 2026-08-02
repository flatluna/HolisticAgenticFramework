# Workspace 1: Complete Technical Implementation Roadmap

**Lead Architect Role:** Provide detailed execution plan for building entire Workspace 1  
**Status:** Ready for Immediate Implementation  
**Date:** 2026-07-20  
**Target Platform:** .NET 9 + Azure SQL + Azure Functions (HTTP triggers)  
**Duration:** 10 weeks (6 phases)  

---

## Index

1. [Phase 1: Domain Entities](#phase-1-domain-entities)
2. [Phase 2: EF Core DbContext & Configurations](#phase-2-ef-core-dbcontext--configurations)
3. [Phase 3: Database Migrations](#phase-3-database-migrations)
4. [Phase 4: Application Layer (CQRS)](#phase-4-application-layer-cqrs)
5. [Phase 5: Azure Functions REST APIs](#phase-5-azure-functions-rest-apis)
6. [Phase 6: Testing](#phase-6-testing)
7. [Deployment & Go-Live](#deployment--go-live)

---

# PHASE 1: DOMAIN ENTITIES

**Duration:** Week 1  
**Deliverables:** 16 new .cs files in Domain layer  
**Files to Create:** 4 domain files with 16 entities total  

## File 1: CompanyProfileEntities.cs

**Path:** `src/Modules/Engagement/AETP.Modules.Engagement.Domain/CompanyProfileEntities.cs`  
**Namespace:** `AETP.Modules.Engagement.Domain.Entities`

### Entities: CompanyProfile, Department, Location

```csharp
namespace AETP.Modules.Engagement.Domain.Entities;

/// <summary>
/// Deep organizational intelligence; company fundamentals and maturity assessment.
/// Aggregate Root for organizational context layer.
/// 1:1 with ClientOrganization; 1:N with Department, Location.
/// </summary>
public class CompanyProfile : AggregateRoot
{
    // Organizational basics
    public string? Founded { get; set; } // Year or date
    public decimal AnnualRevenue { get; set; } // USD
    public int TotalEmployees { get; set; }
    public string? HeadquartersCity { get; set; }
    public string? HeadquartersCountry { get; set; }

    // Maturity scores (0-100)
    public int CloudAdoptionScore { get; set; } // 0-100
    public int DataMaturityScore { get; set; } // 0-100
    public int AIAdoptionScore { get; set; } // 0-100

    // JSON fields (stored as NVARCHAR(MAX))
    public string IndustrySectors { get; set; } = "[]"; // JSON array
    public string GeographicMarkets { get; set; } = "[]"; // JSON array
    public string KeyProducts { get; set; } = "[]"; // JSON array

    // Financial
    public int LastFiscalYear { get; set; }
    public decimal ProfitMargin { get; set; } // %
    public string? CreditRating { get; set; } // AAA, AA, A, BBB, etc.

    // Navigation
    public Guid ClientOrganizationId { get; set; }
    public ICollection<Department> Departments { get; set; } = [];
    public ICollection<Location> Locations { get; set; } = [];

    /// <summary>
    /// Factory method for creating new CompanyProfile.
    /// </summary>
    public static CompanyProfile Create(
        Guid engagementId,
        Guid clientOrganizationId,
        decimal annualRevenue,
        int totalEmployees)
    {
        return new CompanyProfile
        {
            Id = Guid.NewGuid(),
            EngagementId = engagementId,
            ClientOrganizationId = clientOrganizationId,
            AnnualRevenue = annualRevenue,
            TotalEmployees = totalEmployees,
            CreatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Validate maturity scores are 0-100.
    /// </summary>
    public bool ValidateMaturityScores()
    {
        return CloudAdoptionScore >= 0 && CloudAdoptionScore <= 100
            && DataMaturityScore >= 0 && DataMaturityScore <= 100
            && AIAdoptionScore >= 0 && AIAdoptionScore <= 100;
    }
}

/// <summary>
/// Organizational structure; functional unit.
/// Entity (not Aggregate Root); owned by CompanyProfile.
/// </summary>
public class Department : Entity
{
    public Guid CompanyProfileId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int HeadCount { get; set; }
    public string? LeadName { get; set; }
    public string? LeadEmail { get; set; }
    public decimal AnnualBudget { get; set; }
    public int DisplayOrder { get; set; }

    // Navigation
    public CompanyProfile? CompanyProfile { get; set; }

    /// <summary>
    /// Factory method.
    /// </summary>
    public static Department Create(
        Guid engagementId,
        Guid companyProfileId,
        string name,
        string? description = null,
        int headCount = 0)
    {
        return new Department
        {
            Id = Guid.NewGuid(),
            EngagementId = engagementId,
            CompanyProfileId = companyProfileId,
            Name = name,
            Description = description,
            HeadCount = headCount,
            CreatedAt = DateTime.UtcNow
        };
    }
}

/// <summary>
/// Geographic footprint; company location/office.
/// Entity (not Aggregate Root); owned by CompanyProfile.
/// </summary>
public class Location : Entity
{
    public Guid CompanyProfileId { get; set; }
    public string City { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string Office { get; set; } = "Regional"; // HQ, Regional, Branch
    public int Headcount { get; set; }
    public bool IsHeadquarters { get; set; }

    // Navigation
    public CompanyProfile? CompanyProfile { get; set; }

    /// <summary>
    /// Factory method.
    /// </summary>
    public static Location Create(
        Guid engagementId,
        Guid companyProfileId,
        string city,
        string country,
        string office = "Regional",
        bool isHeadquarters = false)
    {
        return new Location
        {
            Id = Guid.NewGuid(),
            EngagementId = engagementId,
            CompanyProfileId = companyProfileId,
            City = city,
            Country = country,
            Office = office,
            IsHeadquarters = isHeadquarters,
            CreatedAt = DateTime.UtcNow
        };
    }
}
```

---

## File 2: StrategicFoundationEntities.cs

**Path:** `src/Modules/Engagement/AETP.Modules.Engagement.Domain/StrategicFoundationEntities.cs`  
**Namespace:** `AETP.Modules.Engagement.Domain.Entities`

### Entities: Mission, Vision, VisionMetric, CompetitiveAdvantage

```csharp
namespace AETP.Modules.Engagement.Domain.Entities;

/// <summary>
/// "Why we exist" - operational direction guiding daily decisions.
/// Aggregate Root; versioned; 1:1 with ClientOrganization (but EngagementId scoped).
/// Status: Draft → Approved → Active → Superseded
/// </summary>
public class Mission : AggregateRoot
{
    public string MissionStatement { get; set; } = string.Empty; // 50-1000 chars
    public string CoreValues { get; set; } = "[]"; // JSON array, max 10
    public string Pillars { get; set; } = "[]"; // JSON array, max 5
    
    public int VersionNumber { get; set; } = 1;
    public DateTime EffectiveDate { get; set; }
    public string? ChangeReason { get; set; }
    public string? ApprovedBy { get; set; } // User email
    public string Status { get; set; } = "Draft"; // Draft, Approved, Active, Superseded

    // Unique: ClientOrganizationId + VersionNumber per engagement
    public Guid ClientOrganizationId { get; set; }

    // Navigation
    public ICollection<MissionStrategyAlignment> StrategyAlignments { get; set; } = [];

    /// <summary>
    /// Factory method.
    /// </summary>
    public static Mission Create(
        Guid engagementId,
        Guid clientOrganizationId,
        string missionStatement)
    {
        return new Mission
        {
            Id = Guid.NewGuid(),
            EngagementId = engagementId,
            ClientOrganizationId = clientOrganizationId,
            MissionStatement = missionStatement,
            EffectiveDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Validate mission statement length and structure.
    /// </summary>
    public bool Validate()
    {
        return !string.IsNullOrEmpty(MissionStatement)
            && MissionStatement.Length >= 50
            && MissionStatement.Length <= 1000;
    }
}

/// <summary>
/// Junction table: Mission ↔ Strategy (M:N).
/// Semantics: Strategy aligned to specific Mission version.
/// </summary>
public class MissionStrategyAlignment : Entity
{
    public Guid MissionId { get; set; }
    public Guid StrategyId { get; set; }
    public string? Notes { get; set; }

    public static MissionStrategyAlignment Create(
        Guid engagementId,
        Guid missionId,
        Guid strategyId,
        string? notes = null)
    {
        return new MissionStrategyAlignment
        {
            Id = Guid.NewGuid(),
            EngagementId = engagementId,
            MissionId = missionId,
            StrategyId = strategyId,
            Notes = notes,
            CreatedAt = DateTime.UtcNow
        };
    }
}

/// <summary>
/// "Where in 3-5 years" - aspirational future state.
/// Aggregate Root; versioned; 1:1 with ClientOrganization (EngagementId scoped).
/// Status: Draft → Approved → Active → Superseded
/// RULE: Cannot mark "Approved" until ≥3 VisionMetrics defined.
/// </summary>
public class Vision : AggregateRoot
{
    public string VisionStatement { get; set; } = string.Empty; // 2-3 sentences
    public int TimeHorizonYears { get; set; } = 3; // 1-10
    public DateTime TargetDate { get; set; }
    
    public int VersionNumber { get; set; } = 1;
    public DateTime EffectiveDate { get; set; }
    public string? ApprovedBy { get; set; }
    public string Status { get; set; } = "Draft"; // Draft, Approved, Active, Superseded

    // Unique: ClientOrganizationId + VersionNumber
    public Guid ClientOrganizationId { get; set; }

    // Navigation
    public ICollection<VisionMetric> Metrics { get; set; } = [];
    public ICollection<VisionStrategyAlignment> StrategyAlignments { get; set; } = [];

    /// <summary>
    /// Factory method.
    /// </summary>
    public static Vision Create(
        Guid engagementId,
        Guid clientOrganizationId,
        string visionStatement,
        int timeHorizonYears = 3)
    {
        return new Vision
        {
            Id = Guid.NewGuid(),
            EngagementId = engagementId,
            ClientOrganizationId = clientOrganizationId,
            VisionStatement = visionStatement,
            TimeHorizonYears = timeHorizonYears,
            TargetDate = DateTime.UtcNow.AddYears(timeHorizonYears),
            EffectiveDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Validate: TargetDate must be future; requires 3-5 VisionMetrics to approve.
    /// </summary>
    public bool CanApprove()
    {
        return TargetDate > DateTime.UtcNow
            && Metrics.Count >= 3
            && Metrics.Count <= 10;
    }
}

/// <summary>
/// Measurable outcome of Vision (3-5 per Vision).
/// Entity; owned by Vision.
/// Example: "Revenue from AI = 40% by 2028" (Current: 5%, Target: 40%).
/// </summary>
public class VisionMetric : Entity
{
    public Guid VisionId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal CurrentValue { get; set; }
    public decimal TargetValue { get; set; }
    public string Unit { get; set; } = string.Empty; // %, USD, headcount, etc.
    public int DisplayOrder { get; set; }

    // Navigation
    public Vision? Vision { get; set; }

    /// <summary>
    /// Factory method.
    /// </summary>
    public static VisionMetric Create(
        Guid engagementId,
        Guid visionId,
        string name,
        decimal currentValue,
        decimal targetValue,
        string unit)
    {
        return new VisionMetric
        {
            Id = Guid.NewGuid(),
            EngagementId = engagementId,
            VisionId = visionId,
            Name = name,
            CurrentValue = currentValue,
            TargetValue = targetValue,
            Unit = unit,
            CreatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Validate: TargetValue > CurrentValue.
    /// </summary>
    public bool Validate()
    {
        return TargetValue > CurrentValue;
    }
}

/// <summary>
/// Junction table: Vision ↔ Strategy (M:N).
/// </summary>
public class VisionStrategyAlignment : Entity
{
    public Guid VisionId { get; set; }
    public Guid StrategyId { get; set; }
    public string? Notes { get; set; }

    public static VisionStrategyAlignment Create(
        Guid engagementId,
        Guid visionId,
        Guid strategyId,
        string? notes = null)
    {
        return new VisionStrategyAlignment
        {
            Id = Guid.NewGuid(),
            EngagementId = engagementId,
            VisionId = visionId,
            StrategyId = strategyId,
            Notes = notes,
            CreatedAt = DateTime.UtcNow
        };
    }
}

/// <summary>
/// Core differentiators and competitive moats.
/// Aggregate Root; versioned; 1:N with ClientOrganization.
/// Status: Active → Declining → Emerging → Superseded
/// RULE: Strategy must protect/amplify ≥1 CompAdvantage.
/// </summary>
public class CompetitiveAdvantage : AggregateRoot
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = "Technology"; // Technology, Brand, Cost, Relationships, Ecosystem, Data
    
    public int CurrentStrength { get; set; } = 5; // 1-10
    public int DefensibilityScore { get; set; } = 5; // 1-10
    public int DurationYears { get; set; } = 5; // 1-20; flag if > 10 as "unsustainable"

    public string CompetitorThreats { get; set; } = "[]"; // JSON
    public string StrengthAreas { get; set; } = "[]"; // JSON
    public string WeakAreas { get; set; } = "[]"; // JSON

    public int VersionNumber { get; set; } = 1;
    public DateTime LastReviewDate { get; set; }
    public string Status { get; set; } = "Active"; // Active, Declining, Emerging, Superseded

    public Guid ClientOrganizationId { get; set; }

    // Navigation
    public ICollection<CompetitiveAdvantageStrategyAlignment> StrategyAlignments { get; set; } = [];

    /// <summary>
    /// Factory method.
    /// </summary>
    public static CompetitiveAdvantage Create(
        Guid engagementId,
        Guid clientOrganizationId,
        string name,
        string category,
        int currentStrength,
        int defensibilityScore,
        int durationYears)
    {
        return new CompetitiveAdvantage
        {
            Id = Guid.NewGuid(),
            EngagementId = engagementId,
            ClientOrganizationId = clientOrganizationId,
            Name = name,
            Category = category,
            CurrentStrength = currentStrength,
            DefensibilityScore = defensibilityScore,
            DurationYears = durationYears,
            LastReviewDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Flag if duration > 10 years as unsustainable.
    /// </summary>
    public bool IsUnsustainable() => DurationYears > 10;

    /// <summary>
    /// Validate scores 1-10.
    /// </summary>
    public bool Validate()
    {
        return CurrentStrength >= 1 && CurrentStrength <= 10
            && DefensibilityScore >= 1 && DefensibilityScore <= 10;
    }
}

/// <summary>
/// Junction table: CompetitiveAdvantage ↔ Strategy (M:N).
/// AlignmentType: Protect, Amplify, Defend
/// </summary>
public class CompetitiveAdvantageStrategyAlignment : Entity
{
    public Guid CompetitiveAdvantageId { get; set; }
    public Guid StrategyId { get; set; }
    public string AlignmentType { get; set; } = "Protect"; // Protect, Amplify, Defend
    public string? Notes { get; set; }

    public static CompetitiveAdvantageStrategyAlignment Create(
        Guid engagementId,
        Guid competitiveAdvantageId,
        Guid strategyId,
        string alignmentType = "Protect")
    {
        return new CompetitiveAdvantageStrategyAlignment
        {
            Id = Guid.NewGuid(),
            EngagementId = engagementId,
            CompetitiveAdvantageId = competitiveAdvantageId,
            StrategyId = strategyId,
            AlignmentType = alignmentType,
            CreatedAt = DateTime.UtcNow
        };
    }
}
```

---

## File 3: PrioritizationAndValueEntities.cs

**Path:** `src/Modules/Engagement/AETP.Modules.Engagement.Domain/PrioritizationAndValueEntities.cs`  
**Namespace:** `AETP.Modules.Engagement.Domain.Entities`

### Entities: StrategicPriority, BusinessModelCanvas

```csharp
namespace AETP.Modules.Engagement.Domain.Entities;

/// <summary>
/// Top 3-5 ranked focus areas for engagement period.
/// Aggregate Root; ranked per engagement/period.
/// RULE: Top 3 priorities must have ≥1 aligned Strategy each; no gaps (1,2,4 with no 3).
/// </summary>
public class StrategicPriority : AggregateRoot
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Framework { get; set; } = "Custom"; // BCG, Porter, Custom
    
    public int Rank { get; set; } = 1; // 1-5 (unique per period)
    public decimal WeightingScore { get; set; } = 20; // 0-100; sum ≈ 100%
    
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    
    public string? Rationale { get; set; }
    public string? ExpectedOutcome { get; set; }
    public int ProgressPercentage { get; set; } = 0; // 0-100

    public string Status { get; set; } = "Planned"; // Planned, Active, Achieved, Deferred
    public DateTime LastReviewDate { get; set; }

    public Guid ClientOrganizationId { get; set; }

    // Navigation
    public ICollection<StrategicPriorityStrategyAlignment> StrategyAlignments { get; set; } = [];

    /// <summary>
    /// Factory method.
    /// </summary>
    public static StrategicPriority Create(
        Guid engagementId,
        Guid clientOrganizationId,
        string name,
        int rank,
        decimal weightingScore,
        DateTime periodStart,
        DateTime periodEnd)
    {
        return new StrategicPriority
        {
            Id = Guid.NewGuid(),
            EngagementId = engagementId,
            ClientOrganizationId = clientOrganizationId,
            Name = name,
            Rank = rank,
            WeightingScore = weightingScore,
            PeriodStart = periodStart,
            PeriodEnd = periodEnd,
            LastReviewDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Validate: Rank 1-5, Weighting 90-110% range is acceptable.
    /// </summary>
    public bool Validate()
    {
        return Rank >= 1 && Rank <= 5;
    }
}

/// <summary>
/// Junction table: StrategicPriority ↔ Strategy (M:N).
/// </summary>
public class StrategicPriorityStrategyAlignment : Entity
{
    public Guid StrategicPriorityId { get; set; }
    public Guid StrategyId { get; set; }
    public int ExecutionOrder { get; set; } // Priority within strategy
    public decimal ContributionPercentage { get; set; } // % of strategy effort

    public static StrategicPriorityStrategyAlignment Create(
        Guid engagementId,
        Guid strategicPriorityId,
        Guid strategyId,
        int executionOrder = 1,
        decimal contributionPercentage = 100)
    {
        return new StrategicPriorityStrategyAlignment
        {
            Id = Guid.NewGuid(),
            EngagementId = engagementId,
            StrategicPriorityId = strategicPriorityId,
            StrategyId = strategyId,
            ExecutionOrder = executionOrder,
            ContributionPercentage = contributionPercentage,
            CreatedAt = DateTime.UtcNow
        };
    }
}

/// <summary>
/// 9-block value model (Osterwalder & Pigneur).
/// Aggregate Root; versioned; 1:1 with ClientOrganization.
/// RULE: Strategy must annotate which BMC blocks it transforms.
/// Used to identify white space (blocks with no strategic support).
/// </summary>
public class BusinessModelCanvas : AggregateRoot
{
    // 9 Blocks (NVARCHAR(MAX))
    public string KeyPartners { get; set; } = string.Empty; // Suppliers, partners, alliances
    public string KeyActivities { get; set; } = string.Empty; // Production, problem-solving, delivery
    public string KeyResources { get; set; } = string.Empty; // Assets, IP, people, finances
    public string ValueProposition { get; set; } = string.Empty; // Why customers buy
    public string CustomerSegments { get; set; } = string.Empty; // Who do we serve
    public string Channels { get; set; } = string.Empty; // How to reach customers
    public string CustomerRelationships { get; set; } = string.Empty; // Engagement, support, loyalty
    public string RevenueStreams { get; set; } = string.Empty; // Pricing, subscription, licensing
    public string CostStructure { get; set; } = string.Empty; // Fixed, variable, economies of scale

    public string? ForwardHorizon { get; set; }
    public string? EvolutionPath { get; set; }
    public string RiskFactors { get; set; } = "[]"; // JSON

    public int VersionNumber { get; set; } = 1;
    public string Status { get; set; } = "Draft"; // Draft, Current, Historical
    public Guid ClientOrganizationId { get; set; }

    // Navigation
    public ICollection<BMCStrategyAlignment> StrategyAlignments { get; set; } = [];

    /// <summary>
    /// Factory method.
    /// </summary>
    public static BusinessModelCanvas Create(
        Guid engagementId,
        Guid clientOrganizationId)
    {
        return new BusinessModelCanvas
        {
            Id = Guid.NewGuid(),
            EngagementId = engagementId,
            ClientOrganizationId = clientOrganizationId,
            CreatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Check if all 9 blocks are complete (non-empty).
    /// </summary>
    public bool AreAllBlocksComplete()
    {
        return !string.IsNullOrWhiteSpace(KeyPartners)
            && !string.IsNullOrWhiteSpace(KeyActivities)
            && !string.IsNullOrWhiteSpace(KeyResources)
            && !string.IsNullOrWhiteSpace(ValueProposition)
            && !string.IsNullOrWhiteSpace(CustomerSegments)
            && !string.IsNullOrWhiteSpace(Channels)
            && !string.IsNullOrWhiteSpace(CustomerRelationships)
            && !string.IsNullOrWhiteSpace(RevenueStreams)
            && !string.IsNullOrWhiteSpace(CostStructure);
    }
}

/// <summary>
/// Junction table: BusinessModelCanvas ↔ Strategy (M:N).
/// Tracks which BMC blocks each strategy transforms.
/// </summary>
public class BMCStrategyAlignment : Entity
{
    public Guid BusinessModelCanvasId { get; set; }
    public Guid StrategyId { get; set; }
    public string BMCBlock { get; set; } = string.Empty; // KeyPartners, KeyActivities, etc.
    public string ImpactType { get; set; } = "Transform"; // Transform, Optimize, Protect, Create

    public static BMCStrategyAlignment Create(
        Guid engagementId,
        Guid businessModelCanvasId,
        Guid strategyId,
        string bmcBlock,
        string impactType = "Transform")
    {
        return new BMCStrategyAlignment
        {
            Id = Guid.NewGuid(),
            EngagementId = engagementId,
            BusinessModelCanvasId = businessModelCanvasId,
            StrategyId = strategyId,
            BMCBlock = bmcBlock,
            ImpactType = impactType,
            CreatedAt = DateTime.UtcNow
        };
    }
}
```

---

## File 4: KnowledgeAndIntelligenceEntities.cs

**Path:** `src/Modules/Engagement/AETP.Modules.Engagement.Domain/KnowledgeAndIntelligenceEntities.cs`  
**Namespace:** `AETP.Modules.Engagement.Domain.Entities`

### Entities: CorporateDocument, Alignments, Agent Entities

```csharp
namespace AETP.Modules.Engagement.Domain.Entities;

/// <summary>
/// Centralized knowledge store (strategic plans, research, reports, policies).
/// Aggregate Root; versioned; file stored in Azure Blob Storage.
/// RULE: Must align to ≥1 Entity (no orphaned documents).
/// </summary>
public class CorporateDocument : AggregateRoot
{
    public string Title { get; set; } = string.Empty; // 10-512 chars
    public string? Description { get; set; }
    public string DocumentType { get; set; } = "StrategicPlan"; // StrategicPlan, FinancialReport, CompAnalysis, etc.
    
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty; // Azure Blob URL
    public long FileSizeBytes { get; set; }

    public string Confidentiality { get; set; } = "Internal"; // Public, Internal, Confidential, Secret
    public string Tags { get; set; } = "[]"; // JSON array
    public string RelatedThemes { get; set; } = "[]"; // JSON array; ≥1 required

    public DateTime DocumentDate { get; set; }
    public DateTime? ExpirationDate { get; set; }
    public string Author { get; set; } = string.Empty;
    public string AllowedRoles { get; set; } = "[]"; // JSON array for RBAC

    public int VersionNumber { get; set; } = 1;
    public bool IsLatestVersion { get; set; } = true;
    public Guid? PreviousVersionId { get; set; }

    public Guid ClientOrganizationId { get; set; }

    // Navigation
    public ICollection<DocumentStrategyAlignment> StrategyAlignments { get; set; } = [];
    public ICollection<DocumentObjectiveAlignment> ObjectiveAlignments { get; set; } = [];

    /// <summary>
    /// Factory method.
    /// </summary>
    public static CorporateDocument Create(
        Guid engagementId,
        Guid clientOrganizationId,
        string title,
        string fileName,
        string fileUrl,
        string documentType)
    {
        return new CorporateDocument
        {
            Id = Guid.NewGuid(),
            EngagementId = engagementId,
            ClientOrganizationId = clientOrganizationId,
            Title = title,
            FileName = fileName,
            FileUrl = fileUrl,
            DocumentType = documentType,
            DocumentDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Validate title length and themes.
    /// </summary>
    public bool Validate()
    {
        return !string.IsNullOrEmpty(Title)
            && Title.Length >= 10
            && Title.Length <= 512;
    }
}

/// <summary>
/// Junction table: CorporateDocument ↔ Strategy (M:N).
/// AlignmentType: Informs, Supports, Conflicts, Requires
/// Informs: Document provides input/context (e.g., market research)
/// Supports: Document validates/proves strategy (e.g., business case)
/// Conflicts: Document contradicts strategy (alert!)
/// Requires: Document needed before executing strategy
/// </summary>
public class DocumentStrategyAlignment : Entity
{
    public Guid DocumentId { get; set; }
    public Guid StrategyId { get; set; }
    public string AlignmentType { get; set; } = "Informs"; // Informs, Supports, Conflicts, Requires
    public string? Notes { get; set; }

    public static DocumentStrategyAlignment Create(
        Guid engagementId,
        Guid documentId,
        Guid strategyId,
        string alignmentType = "Informs",
        string? notes = null)
    {
        return new DocumentStrategyAlignment
        {
            Id = Guid.NewGuid(),
            EngagementId = engagementId,
            DocumentId = documentId,
            StrategyId = strategyId,
            AlignmentType = alignmentType,
            Notes = notes,
            CreatedAt = DateTime.UtcNow
        };
    }
}

/// <summary>
/// Junction table: CorporateDocument ↔ Objective (M:N).
/// AlignmentType: Baseline, Target, Evidence
/// Baseline: Document establishes baseline (current state)
/// Target: Document specifies target (future state design)
/// Evidence: Document proves achievement
/// </summary>
public class DocumentObjectiveAlignment : Entity
{
    public Guid DocumentId { get; set; }
    public Guid ObjectiveId { get; set; }
    public string AlignmentType { get; set; } = "Baseline"; // Baseline, Target, Evidence
    public string? Notes { get; set; }

    public static DocumentObjectiveAlignment Create(
        Guid engagementId,
        Guid documentId,
        Guid objectiveId,
        string alignmentType = "Baseline",
        string? notes = null)
    {
        return new DocumentObjectiveAlignment
        {
            Id = Guid.NewGuid(),
            EngagementId = engagementId,
            DocumentId = documentId,
            ObjectiveId = objectiveId,
            AlignmentType = alignmentType,
            Notes = notes,
            CreatedAt = DateTime.UtcNow
        };
    }
}

/// <summary>
/// Context container for AI-powered strategic analysis sessions.
/// Aggregate Root; 1:1 with Engagement.
/// SessionType: StrategySynthesis, GapAnalysis, ConflictDetection, Scenario, Review
/// </summary>
public class AgentSession : AggregateRoot
{
    public string SessionType { get; set; } = "StrategySynthesis"; // StrategySynthesis, GapAnalysis, ConflictDetection, ScenarioSimulation, StrategicReview
    public string Status { get; set; } = "Active"; // Active, Completed, Error, Archived
    
    public DateTime SessionStartTime { get; set; }
    public DateTime? SessionEndTime { get; set; }
    
    public string InitialPrompt { get; set; } = string.Empty;
    public string ExecutedBy { get; set; } = string.Empty; // User email
    public string LLMModel { get; set; } = "GPT-4"; // GPT-4, Claude-3, etc.
    public decimal CostUSD { get; set; } = 0;

    public Guid EngagementId { get; set; }

    // Navigation
    public ICollection<AgentQuery> Queries { get; set; } = [];
    public ICollection<AgentInsight> Insights { get; set; } = [];
    public ICollection<AgentRecommendation> Recommendations { get; set; } = [];

    /// <summary>
    /// Factory method.
    /// </summary>
    public static AgentSession Create(
        Guid engagementId,
        string sessionType,
        string initialPrompt,
        string executedBy)
    {
        return new AgentSession
        {
            Id = Guid.NewGuid(),
            EngagementId = engagementId,
            SessionType = sessionType,
            InitialPrompt = initialPrompt,
            ExecutedBy = executedBy,
            SessionStartTime = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Mark session as completed.
    /// </summary>
    public void Complete()
    {
        Status = "Completed";
        SessionEndTime = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }
}

/// <summary>
/// Single question/query within an AgentSession.
/// Entity; owned by AgentSession.
/// Tracks LLM reasoning and data sources accessed.
/// </summary>
public class AgentQuery : Entity
{
    public Guid AgentSessionId { get; set; }
    public string Query { get; set; } = string.Empty;
    public string DataSources { get; set; } = "[]"; // JSON: ["Mission", "Strategy", "VisionMetric"]
    public string ResponseSummary { get; set; } = string.Empty;
    public int ConfidenceScore { get; set; } = 50; // 0-100
    public DateTime ExecutedAt { get; set; }

    // Navigation
    public AgentSession? AgentSession { get; set; }

    public static AgentQuery Create(
        Guid engagementId,
        Guid agentSessionId,
        string query,
        string dataSources)
    {
        return new AgentQuery
        {
            Id = Guid.NewGuid(),
            EngagementId = engagementId,
            AgentSessionId = agentSessionId,
            Query = query,
            DataSources = dataSources,
            ExecutedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
    }
}

/// <summary>
/// Finding/observation from agent analysis.
/// Category: Alignment, Gap, Risk, Opportunity, Conflict
/// IsActionable: Can we do something about it?
/// </summary>
public class AgentInsight : Entity
{
    public Guid AgentSessionId { get; set; }
    public string Category { get; set; } = "Alignment"; // Alignment, Gap, Risk, Opportunity, Conflict
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int SeverityScore { get; set; } = 5; // 1-10
    public string AffectedEntities { get; set; } = "[]"; // JSON: Strategy/Objective/Priority IDs
    public bool IsActionable { get; set; } = false;

    // Navigation
    public AgentSession? AgentSession { get; set; }

    public static AgentInsight Create(
        Guid engagementId,
        Guid agentSessionId,
        string category,
        string title,
        string description,
        int severityScore)
    {
        return new AgentInsight
        {
            Id = Guid.NewGuid(),
            EngagementId = engagementId,
            AgentSessionId = agentSessionId,
            Category = category,
            Title = title,
            Description = description,
            SeverityScore = severityScore,
            CreatedAt = DateTime.UtcNow
        };
    }
}

/// <summary>
/// Recommended action item from agent.
/// RecommendationType: Priority, NewStrategy, DocumentNeeded, RiskMitigation, ProcessImprovement
/// Status: Pending → Approved → InProgress → Completed
/// </summary>
public class AgentRecommendation : Entity
{
    public Guid AgentSessionId { get; set; }
    public string RecommendationType { get; set; } = "Priority"; // Priority, NewStrategy, DocumentNeeded, RiskMitigation, ProcessImprovement
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int UrgencyScore { get; set; } = 5; // 1-10
    public int EstimatedEffortPersonDays { get; set; } = 5;
    public string ImplementationPath { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending"; // Pending, Approved, InProgress, Completed

    // Navigation
    public AgentSession? AgentSession { get; set; }

    public static AgentRecommendation Create(
        Guid engagementId,
        Guid agentSessionId,
        string recommendationType,
        string title,
        string description,
        int urgencyScore,
        int estimatedEffortPersonDays)
    {
        return new AgentRecommendation
        {
            Id = Guid.NewGuid(),
            EngagementId = engagementId,
            AgentSessionId = agentSessionId,
            RecommendationType = recommendationType,
            Title = title,
            Description = description,
            UrgencyScore = urgencyScore,
            EstimatedEffortPersonDays = estimatedEffortPersonDays,
            CreatedAt = DateTime.UtcNow
        };
    }
}
```

---

# PHASE 2: EF CORE DBCONTEXT & CONFIGURATIONS

**Duration:** Week 2  
**Deliverables:** Extended ClientEngagementDbContext with 16 new DbSets + Fluent API mappings  

## Overview

The existing `ClientEngagementDbContext` will be extended to include all 16 new entities.

**Current DbSets (to keep):**
- ClientOrganizations
- Engagements
- Stakeholders

**New DbSets to add:**
- CompanyProfiles, Departments, Locations
- Missions, MissionStrategyAlignments, Visions, VisionMetrics, VisionStrategyAlignments
- CompetitiveAdvantages, CompetitiveAdvantageStrategyAlignments
- StrategicPriorities, StrategicPriorityStrategyAlignments
- BusinessModelCanvases, BMCStrategyAlignments
- CorporateDocuments, DocumentStrategyAlignments, DocumentObjectiveAlignments
- AgentSessions, AgentQueries, AgentInsights, AgentRecommendations

## Update ClientEngagementDbContext.cs

**Path:** `src/Modules/Engagement/AETP.Modules.Engagement.Infrastructure/ClientEngagementDbContext.cs`

Add all 16 new DbSet properties and OnModelCreating configurations:

```csharp
// ADD THESE DbSet PROPERTIES to existing context:

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

// Competitive Positioning
public DbSet<CompetitiveAdvantage> CompetitiveAdvantages { get; set; }
public DbSet<CompetitiveAdvantageStrategyAlignment> CompetitiveAdvantageStrategyAlignments { get; set; }
public DbSet<StrategicPriority> StrategicPriorities { get; set; }
public DbSet<StrategicPriorityStrategyAlignment> StrategicPriorityStrategyAlignments { get; set; }

// Value Model
public DbSet<BusinessModelCanvas> BusinessModelCanvases { get; set; }
public DbSet<BMCStrategyAlignment> BMCStrategyAlignments { get; set; }

// Knowledge Repository
public DbSet<CorporateDocument> CorporateDocuments { get; set; }
public DbSet<DocumentStrategyAlignment> DocumentStrategyAlignments { get; set; }
public DbSet<DocumentObjectiveAlignment> DocumentObjectiveAlignments { get; set; }

// Intelligence Layer
public DbSet<AgentSession> AgentSessions { get; set; }
public DbSet<AgentQuery> AgentQueries { get; set; }
public DbSet<AgentInsight> AgentInsights { get; set; }
public DbSet<AgentRecommendation> AgentRecommendations { get; set; }
```

### OnModelCreating Configuration

Add fluent configurations in OnModelCreating (summary):

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);
    modelBuilder.HasDefaultSchema("engagement");

    // ─── ORGANIZATIONAL CONTEXT ───
    
    modelBuilder.Entity<CompanyProfile>(entity =>
    {
        entity.ToTable("CompanyProfiles", "engagement");
        entity.HasKey(e => e.Id);
        entity.HasIndex(e => e.EngagementId);
        entity.HasIndex(e => e.ClientOrganizationId).IsUnique();
        
        entity.Property(e => e.CloudAdoptionScore).IsRequired();
        entity.Property(e => e.DataMaturityScore).IsRequired();
        entity.Property(e => e.AIAdoptionScore).IsRequired();
        entity.Property(e => e.IndustrySectors).HasColumnType("NVARCHAR(MAX)");
        entity.Property(e => e.GeographicMarkets).HasColumnType("NVARCHAR(MAX)");
        entity.Property(e => e.KeyProducts).HasColumnType("NVARCHAR(MAX)");

        entity.HasMany(e => e.Departments).WithOne().OnDelete(DeleteBehavior.Cascade);
        entity.HasMany(e => e.Locations).WithOne().OnDelete(DeleteBehavior.Cascade);
    });

    modelBuilder.Entity<Department>(entity =>
    {
        entity.ToTable("Departments", "engagement");
        entity.HasKey(e => e.Id);
        entity.HasIndex(e => e.EngagementId);
        entity.HasIndex(e => new { e.CompanyProfileId, e.Name }).IsUnique();
        entity.Property(e => e.Name).HasMaxLength(255).IsRequired();
    });

    modelBuilder.Entity<Location>(entity =>
    {
        entity.ToTable("Locations", "engagement");
        entity.HasKey(e => e.Id);
        entity.HasIndex(e => e.EngagementId);
        entity.HasIndex(e => new { e.CompanyProfileId, e.City, e.Country });
        entity.Property(e => e.City).HasMaxLength(100).IsRequired();
        entity.Property(e => e.Country).HasMaxLength(100).IsRequired();
        entity.Property(e => e.Office).HasMaxLength(50);
    });

    // ─── STRATEGIC FOUNDATION ───

    modelBuilder.Entity<Mission>(entity =>
    {
        entity.ToTable("Missions", "engagement");
        entity.HasKey(e => e.Id);
        entity.HasIndex(e => e.EngagementId);
        entity.HasIndex(e => new { e.ClientOrganizationId, e.VersionNumber }).IsUnique();
        entity.Property(e => e.MissionStatement).HasColumnType("NVARCHAR(MAX)").IsRequired();
        entity.Property(e => e.CoreValues).HasColumnType("NVARCHAR(MAX)");
        entity.Property(e => e.Pillars).HasColumnType("NVARCHAR(MAX)");
        entity.Property(e => e.Status).HasMaxLength(50);
    });

    modelBuilder.Entity<MissionStrategyAlignment>(entity =>
    {
        entity.ToTable("MissionStrategyAlignments", "engagement");
        entity.HasKey(e => e.Id);
        entity.HasIndex(e => e.EngagementId);
        entity.HasIndex(e => new { e.MissionId, e.StrategyId }).IsUnique();
    });

    modelBuilder.Entity<Vision>(entity =>
    {
        entity.ToTable("Visions", "engagement");
        entity.HasKey(e => e.Id);
        entity.HasIndex(e => e.EngagementId);
        entity.HasIndex(e => new { e.ClientOrganizationId, e.VersionNumber }).IsUnique();
        entity.Property(e => e.VisionStatement).HasColumnType("NVARCHAR(MAX)").IsRequired();
        entity.Property(e => e.Status).HasMaxLength(50);
        entity.HasMany(e => e.Metrics).WithOne().OnDelete(DeleteBehavior.Cascade);
    });

    modelBuilder.Entity<VisionMetric>(entity =>
    {
        entity.ToTable("VisionMetrics", "engagement");
        entity.HasKey(e => e.Id);
        entity.HasIndex(e => e.EngagementId);
        entity.HasIndex(e => e.VisionId);
        entity.Property(e => e.Name).HasMaxLength(255).IsRequired();
        entity.Property(e => e.Unit).HasMaxLength(50).IsRequired();
    });

    modelBuilder.Entity<VisionStrategyAlignment>(entity =>
    {
        entity.ToTable("VisionStrategyAlignments", "engagement");
        entity.HasKey(e => e.Id);
        entity.HasIndex(e => e.EngagementId);
        entity.HasIndex(e => new { e.VisionId, e.StrategyId }).IsUnique();
    });

    // ─── COMPETITIVE POSITIONING ───

    modelBuilder.Entity<CompetitiveAdvantage>(entity =>
    {
        entity.ToTable("CompetitiveAdvantages", "engagement");
        entity.HasKey(e => e.Id);
        entity.HasIndex(e => e.EngagementId);
        entity.HasIndex(e => e.ClientOrganizationId);
        entity.Property(e => e.Name).HasMaxLength(255).IsRequired();
        entity.Property(e => e.Category).HasMaxLength(50);
        entity.Property(e => e.Status).HasMaxLength(50);
        entity.Property(e => e.CompetitorThreats).HasColumnType("NVARCHAR(MAX)");
        entity.Property(e => e.StrengthAreas).HasColumnType("NVARCHAR(MAX)");
        entity.Property(e => e.WeakAreas).HasColumnType("NVARCHAR(MAX)");
    });

    modelBuilder.Entity<CompetitiveAdvantageStrategyAlignment>(entity =>
    {
        entity.ToTable("CompetitiveAdvantageStrategyAlignments", "engagement");
        entity.HasKey(e => e.Id);
        entity.HasIndex(e => e.EngagementId);
        entity.HasIndex(e => new { e.CompetitiveAdvantageId, e.StrategyId }).IsUnique();
        entity.Property(e => e.AlignmentType).HasMaxLength(50);
    });

    modelBuilder.Entity<StrategicPriority>(entity =>
    {
        entity.ToTable("StrategicPriorities", "engagement");
        entity.HasKey(e => e.Id);
        entity.HasIndex(e => e.EngagementId);
        entity.HasIndex(e => new { e.ClientOrganizationId, e.Rank, e.PeriodStart }).IsUnique();
        entity.Property(e => e.Name).HasMaxLength(255).IsRequired();
        entity.Property(e => e.Status).HasMaxLength(50);
        entity.Property(e => e.Framework).HasMaxLength(50);
    });

    modelBuilder.Entity<StrategicPriorityStrategyAlignment>(entity =>
    {
        entity.ToTable("StrategicPriorityStrategyAlignments", "engagement");
        entity.HasKey(e => e.Id);
        entity.HasIndex(e => e.EngagementId);
        entity.HasIndex(e => new { e.StrategicPriorityId, e.StrategyId }).IsUnique();
    });

    // ─── VALUE MODEL ───

    modelBuilder.Entity<BusinessModelCanvas>(entity =>
    {
        entity.ToTable("BusinessModelCanvases", "engagement");
        entity.HasKey(e => e.Id);
        entity.HasIndex(e => e.EngagementId);
        entity.HasIndex(e => new { e.ClientOrganizationId, e.VersionNumber }).IsUnique();
        entity.Property(e => e.KeyPartners).HasColumnType("NVARCHAR(MAX)");
        entity.Property(e => e.KeyActivities).HasColumnType("NVARCHAR(MAX)");
        entity.Property(e => e.KeyResources).HasColumnType("NVARCHAR(MAX)");
        entity.Property(e => e.ValueProposition).HasColumnType("NVARCHAR(MAX)");
        entity.Property(e => e.CustomerSegments).HasColumnType("NVARCHAR(MAX)");
        entity.Property(e => e.Channels).HasColumnType("NVARCHAR(MAX)");
        entity.Property(e => e.CustomerRelationships).HasColumnType("NVARCHAR(MAX)");
        entity.Property(e => e.RevenueStreams).HasColumnType("NVARCHAR(MAX)");
        entity.Property(e => e.CostStructure).HasColumnType("NVARCHAR(MAX)");
        entity.Property(e => e.RiskFactors).HasColumnType("NVARCHAR(MAX)");
        entity.Property(e => e.Status).HasMaxLength(50);
    });

    modelBuilder.Entity<BMCStrategyAlignment>(entity =>
    {
        entity.ToTable("BMCStrategyAlignments", "engagement");
        entity.HasKey(e => e.Id);
        entity.HasIndex(e => e.EngagementId);
        entity.HasIndex(e => new { e.BusinessModelCanvasId, e.StrategyId, e.BMCBlock }).IsUnique();
        entity.Property(e => e.BMCBlock).HasMaxLength(50);
        entity.Property(e => e.ImpactType).HasMaxLength(50);
    });

    // ─── KNOWLEDGE REPOSITORY ───

    modelBuilder.Entity<CorporateDocument>(entity =>
    {
        entity.ToTable("CorporateDocuments", "engagement");
        entity.HasKey(e => e.Id);
        entity.HasIndex(e => e.EngagementId);
        entity.HasIndex(e => e.ClientOrganizationId);
        entity.Property(e => e.Title).HasMaxLength(512).IsRequired();
        entity.Property(e => e.Description).HasColumnType("NVARCHAR(MAX)");
        entity.Property(e => e.DocumentType).HasMaxLength(50);
        entity.Property(e => e.FileName).HasMaxLength(255).IsRequired();
        entity.Property(e => e.FileUrl).HasMaxLength(2048).IsRequired();
        entity.Property(e => e.Confidentiality).HasMaxLength(50);
        entity.Property(e => e.Tags).HasColumnType("NVARCHAR(MAX)");
        entity.Property(e => e.RelatedThemes).HasColumnType("NVARCHAR(MAX)");
        entity.Property(e => e.Author).HasMaxLength(255);
        entity.Property(e => e.AllowedRoles).HasColumnType("NVARCHAR(MAX)");
    });

    modelBuilder.Entity<DocumentStrategyAlignment>(entity =>
    {
        entity.ToTable("DocumentStrategyAlignments", "engagement");
        entity.HasKey(e => e.Id);
        entity.HasIndex(e => e.EngagementId);
        entity.HasIndex(e => new { e.DocumentId, e.StrategyId }).IsUnique();
        entity.Property(e => e.AlignmentType).HasMaxLength(50);
    });

    modelBuilder.Entity<DocumentObjectiveAlignment>(entity =>
    {
        entity.ToTable("DocumentObjectiveAlignments", "engagement");
        entity.HasKey(e => e.Id);
        entity.HasIndex(e => e.EngagementId);
        entity.HasIndex(e => new { e.DocumentId, e.ObjectiveId }).IsUnique();
        entity.Property(e => e.AlignmentType).HasMaxLength(50);
    });

    // ─── INTELLIGENCE LAYER ───

    modelBuilder.Entity<AgentSession>(entity =>
    {
        entity.ToTable("AgentSessions", "engagement");
        entity.HasKey(e => e.Id);
        entity.HasIndex(e => e.EngagementId).IsUnique();
        entity.Property(e => e.SessionType).HasMaxLength(50);
        entity.Property(e => e.Status).HasMaxLength(50);
        entity.Property(e => e.InitialPrompt).HasColumnType("NVARCHAR(MAX)");
        entity.Property(e => e.ExecutedBy).HasMaxLength(255);
        entity.Property(e => e.LLMModel).HasMaxLength(100);
        entity.HasMany(e => e.Queries).WithOne().OnDelete(DeleteBehavior.Cascade);
        entity.HasMany(e => e.Insights).WithOne().OnDelete(DeleteBehavior.Cascade);
        entity.HasMany(e => e.Recommendations).WithOne().OnDelete(DeleteBehavior.Cascade);
    });

    modelBuilder.Entity<AgentQuery>(entity =>
    {
        entity.ToTable("AgentQueries", "engagement");
        entity.HasKey(e => e.Id);
        entity.HasIndex(e => e.EngagementId);
        entity.HasIndex(e => e.AgentSessionId);
        entity.Property(e => e.Query).HasColumnType("NVARCHAR(MAX)");
        entity.Property(e => e.DataSources).HasColumnType("NVARCHAR(MAX)");
        entity.Property(e => e.ResponseSummary).HasColumnType("NVARCHAR(MAX)");
    });

    modelBuilder.Entity<AgentInsight>(entity =>
    {
        entity.ToTable("AgentInsights", "engagement");
        entity.HasKey(e => e.Id);
        entity.HasIndex(e => e.EngagementId);
        entity.HasIndex(e => e.AgentSessionId);
        entity.Property(e => e.Category).HasMaxLength(50);
        entity.Property(e => e.Title).HasMaxLength(512);
        entity.Property(e => e.Description).HasColumnType("NVARCHAR(MAX)");
        entity.Property(e => e.AffectedEntities).HasColumnType("NVARCHAR(MAX)");
    });

    modelBuilder.Entity<AgentRecommendation>(entity =>
    {
        entity.ToTable("AgentRecommendations", "engagement");
        entity.HasKey(e => e.Id);
        entity.HasIndex(e => e.EngagementId);
        entity.HasIndex(e => e.AgentSessionId);
        entity.Property(e => e.RecommendationType).HasMaxLength(50);
        entity.Property(e => e.Title).HasMaxLength(512);
        entity.Property(e => e.Description).HasColumnType("NVARCHAR(MAX)");
        entity.Property(e => e.ImplementationPath).HasColumnType("NVARCHAR(MAX)");
        entity.Property(e => e.Status).HasMaxLength(50);
    });
}
```

---

# PHASE 3: DATABASE MIGRATIONS

**Duration:** 3-4 days  
**Order:** Sequential execution

## Migration Order (CRITICAL)

**Why Sequential?** Foreign key dependencies and unique constraints must be applied in correct order.

### Migration 1: Create Base Organizational Context
```
Initial_CreateCompanyProfile_Departments_Locations
├─ CompanyProfiles table (PK: Id, FK: ClientOrganizationId)
├─ Departments table (PK: Id, FK: CompanyProfileId, EngagementId)
└─ Locations table (PK: Id, FK: CompanyProfileId, EngagementId)
```

### Migration 2: Create Strategic Foundation Layer
```
Add_MissionsVisionsAndMetrics
├─ Missions table (PK: Id, UNIQUE: ClientOrganizationId + VersionNumber)
├─ MissionStrategyAlignments junction
├─ Visions table (PK: Id, UNIQUE: ClientOrganizationId + VersionNumber)
├─ VisionMetrics table (PK: Id, FK: VisionId)
└─ VisionStrategyAlignments junction
```

### Migration 3: Create Competitive Positioning Layer
```
Add_CompetitiveAdvantagesAndPriorities
├─ CompetitiveAdvantages table (PK: Id, FK: ClientOrganizationId)
├─ CompetitiveAdvantageStrategyAlignments junction
├─ StrategicPriorities table (PK: Id, FK: ClientOrganizationId, UNIQUE: Rank+Period)
└─ StrategicPriorityStrategyAlignments junction
```

### Migration 4: Create Value Model Layer
```
Add_BusinessModelCanvas
├─ BusinessModelCanvases table (PK: Id, UNIQUE: ClientOrganizationId + VersionNumber)
└─ BMCStrategyAlignments junction
```

### Migration 5: Create Knowledge Repository Layer
```
Add_CorporateDocuments
├─ CorporateDocuments table (PK: Id, FK: ClientOrganizationId)
├─ DocumentStrategyAlignments junction
└─ DocumentObjectiveAlignments junction
```

### Migration 6: Create Intelligence Layer
```
Add_AgentSessions_Queries_Insights_Recommendations
├─ AgentSessions table (PK: Id, UNIQUE: EngagementId, FK: EngagementId)
├─ AgentQueries table (PK: Id, FK: AgentSessionId)
├─ AgentInsights table (PK: Id, FK: AgentSessionId)
└─ AgentRecommendations table (PK: Id, FK: AgentSessionId)
```

## PowerShell Command Sequence

```powershell
# From: backend/ directory

# Migration 1
dotnet ef migrations add Add_CompanyProfile_Departments_Locations `
  --project src/Modules/Engagement/AETP.Modules.Engagement.Infrastructure `
  --startup-project src/Host/AETP.Api `
  --context ClientEngagementDbContext `
  --output-dir Migrations

# Migration 2
dotnet ef migrations add Add_Missions_Visions_VisionMetrics `
  --project src/Modules/Engagement/AETP.Modules.Engagement.Infrastructure `
  --startup-project src/Host/AETP.Api `
  --context ClientEngagementDbContext `
  --output-dir Migrations

# ... (repeat for Migrations 3-6)

# Apply all migrations to database
dotnet ef database update `
  --project src/Modules/Engagement/AETP.Modules.Engagement.Infrastructure `
  --startup-project src/Host/AETP.Api `
  --context ClientEngagementDbContext
```

---

# PHASE 4: APPLICATION LAYER (CQRS)

**Duration:** Weeks 3-4  
**Pattern:** MediatR (CQRS) + FluentValidation  
**Namespace:** `AETP.Modules.Engagement.Application`

## Folder Structure

```
src/Modules/Engagement/AETP.Modules.Engagement.Application/
├── Commands/
│   ├── CompanyProfile/
│   │   ├── CreateCompanyProfileCommand.cs
│   │   ├── CreateCompanyProfileHandler.cs
│   │   ├── CreateCompanyProfileValidator.cs
│   │   ├── UpdateCompanyProfileCommand.cs
│   │   └── ...
│   ├── Mission/
│   │   ├── CreateMissionCommand.cs
│   │   ├── ApproveMissionCommand.cs
│   │   └── ...
│   └── ... (1 folder per entity)
├── Queries/
│   ├── CompanyProfile/
│   │   ├── GetCompanyProfileByIdQuery.cs
│   │   ├── GetCompanyProfileByIdHandler.cs
│   │   ├── ListCompanyProfilesQuery.cs
│   │   └── ...
│   └── ... (1 folder per entity)
└── DTOs/
    ├── CompanyProfileDto.cs
    ├── MissionDto.cs
    └── ... (1 file per entity)
```

## Example CQRS Pattern: CompanyProfile

### Command: CreateCompanyProfileCommand.cs

```csharp
namespace AETP.Modules.Engagement.Application.Commands.CompanyProfile;

public class CreateCompanyProfileCommand : IRequest<CompanyProfileDto>
{
    public Guid EngagementId { get; set; }
    public Guid ClientOrganizationId { get; set; }
    public decimal AnnualRevenue { get; set; }
    public int TotalEmployees { get; set; }
    public string? HeadquartersCity { get; set; }
    public string? HeadquartersCountry { get; set; }
    public int CloudAdoptionScore { get; set; }
    public int DataMaturityScore { get; set; }
    public int AIAdoptionScore { get; set; }
}

public class CreateCompanyProfileHandler : IRequestHandler<CreateCompanyProfileCommand, CompanyProfileDto>
{
    private readonly ClientEngagementDbContext _dbContext;
    private readonly IMapper _mapper;
    private readonly ILogger<CreateCompanyProfileHandler> _logger;

    public CreateCompanyProfileHandler(
        ClientEngagementDbContext dbContext,
        IMapper mapper,
        ILogger<CreateCompanyProfileHandler> logger)
    {
        _dbContext = dbContext;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<CompanyProfileDto> Handle(CreateCompanyProfileCommand request, CancellationToken cancellationToken)
    {
        var companyProfile = Domain.Entities.CompanyProfile.Create(
            request.EngagementId,
            request.ClientOrganizationId,
            request.AnnualRevenue,
            request.TotalEmployees);

        companyProfile.HeadquartersCity = request.HeadquartersCity;
        companyProfile.HeadquartersCountry = request.HeadquartersCountry;
        companyProfile.CloudAdoptionScore = request.CloudAdoptionScore;
        companyProfile.DataMaturityScore = request.DataMaturityScore;
        companyProfile.AIAdoptionScore = request.AIAdoptionScore;

        if (!companyProfile.ValidateMaturityScores())
            throw new ValidationException("Maturity scores must be between 0-100");

        _dbContext.CompanyProfiles.Add(companyProfile);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("CompanyProfile created: {Id}", companyProfile.Id);

        return _mapper.Map<CompanyProfileDto>(companyProfile);
    }
}
```

### Validator: CreateCompanyProfileValidator.cs

```csharp
namespace AETP.Modules.Engagement.Application.Commands.CompanyProfile;

public class CreateCompanyProfileValidator : AbstractValidator<CreateCompanyProfileCommand>
{
    public CreateCompanyProfileValidator()
    {
        RuleFor(x => x.EngagementId).NotEmpty().WithMessage("EngagementId is required");
        RuleFor(x => x.ClientOrganizationId).NotEmpty().WithMessage("ClientOrganizationId is required");
        RuleFor(x => x.AnnualRevenue).GreaterThan(0).WithMessage("AnnualRevenue must be > 0");
        RuleFor(x => x.TotalEmployees).GreaterThan(0).WithMessage("TotalEmployees must be > 0");
        RuleFor(x => x.CloudAdoptionScore).InclusiveBetween(0, 100).WithMessage("Score must be 0-100");
        RuleFor(x => x.DataMaturityScore).InclusiveBetween(0, 100).WithMessage("Score must be 0-100");
        RuleFor(x => x.AIAdoptionScore).InclusiveBetween(0, 100).WithMessage("Score must be 0-100");
    }
}
```

### Query: GetCompanyProfileByIdQuery.cs

```csharp
namespace AETP.Modules.Engagement.Application.Queries.CompanyProfile;

public class GetCompanyProfileByIdQuery : IRequest<CompanyProfileDto>
{
    public Guid Id { get; set; }
    public Guid EngagementId { get; set; }
}

public class GetCompanyProfileByIdHandler : IRequestHandler<GetCompanyProfileByIdQuery, CompanyProfileDto>
{
    private readonly ClientEngagementDbContext _dbContext;
    private readonly IMapper _mapper;

    public GetCompanyProfileByIdHandler(ClientEngagementDbContext dbContext, IMapper mapper)
    {
        _dbContext = dbContext;
        _mapper = mapper;
    }

    public async Task<CompanyProfileDto> Handle(GetCompanyProfileByIdQuery request, CancellationToken cancellationToken)
    {
        var companyProfile = await _dbContext.CompanyProfiles
            .Include(cp => cp.Departments)
            .Include(cp => cp.Locations)
            .FirstOrDefaultAsync(cp => cp.Id == request.Id && cp.EngagementId == request.EngagementId, cancellationToken);

        if (companyProfile == null)
            throw new NotFoundException($"CompanyProfile {request.Id} not found");

        return _mapper.Map<CompanyProfileDto>(companyProfile);
    }
}
```

### DTO: CompanyProfileDto.cs

```csharp
namespace AETP.Modules.Engagement.Application.DTOs;

public class CompanyProfileDto
{
    public Guid Id { get; set; }
    public Guid EngagementId { get; set; }
    public Guid ClientOrganizationId { get; set; }
    public string? Founded { get; set; }
    public decimal AnnualRevenue { get; set; }
    public int TotalEmployees { get; set; }
    public string? HeadquartersCity { get; set; }
    public string? HeadquartersCountry { get; set; }
    public int CloudAdoptionScore { get; set; }
    public int DataMaturityScore { get; set; }
    public int AIAdoptionScore { get; set; }
    public List<DepartmentDto> Departments { get; set; } = [];
    public List<LocationDto> Locations { get; set; } = [];
}
```

**Repeat this pattern for all 16 entities.**

---

# PHASE 5: AZURE FUNCTIONS REST APIs

**Duration:** Weeks 5-7  
**Platform:** Azure Functions (HTTP Triggers)  
**Pattern:** Orchestration layer calling MediatR commands/queries  

## Important: Azure Functions Instead of Controllers

Each module will have Azure Functions organized by entity type. This replaces traditional ASP.NET Core Controllers.

### Project Structure

```
src/Modules/Engagement/
├── AETP.Modules.Engagement.Api/
│   └── Functions/
│       ├── CompanyProfile/
│       │   ├── CreateCompanyProfileFunction.cs
│       │   ├── GetCompanyProfileFunction.cs
│       │   ├── ListCompanyProfilesFunction.cs
│       │   ├── UpdateCompanyProfileFunction.cs
│       │   └── DeleteCompanyProfileFunction.cs
│       ├── Mission/
│       │   ├── CreateMissionFunction.cs
│       │   ├── GetMissionFunction.cs
│       │   ├── ListMissionsFunction.cs
│       │   ├── ApproveMissionFunction.cs
│       │   └── DeleteMissionFunction.cs
│       ├── Vision/
│       ├── StrategicPriority/
│       ├── CorporateDocument/
│       ├── AgentSession/
│       └── ... (1 folder per entity)
```

### Example Azure Function: CreateCompanyProfileFunction.cs

```csharp
namespace AETP.Modules.Engagement.Api.Functions.CompanyProfile;

public class CreateCompanyProfileFunction
{
    private readonly IMediator _mediator;
    private readonly ILogger<CreateCompanyProfileFunction> _logger;

    public CreateCompanyProfileFunction(IMediator mediator, ILogger<CreateCompanyProfileFunction> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    [Function("CreateCompanyProfile")]
    public async Task<IActionResult> Run(
        [HttpTrigger(AuthorizationLevel.Function, "post", Route = "engagements/{engagementId}/company-profile")] 
        HttpRequest req,
        string engagementId,
        CancellationToken cancellationToken)
    {
        try
        {
            if (!Guid.TryParse(engagementId, out var engagementIdGuid))
                return new BadRequestObjectResult(new { error = "Invalid engagementId" });

            var requestBody = await req.ReadAsAsync<CreateCompanyProfileRequest>(cancellationToken);
            
            var command = new CreateCompanyProfileCommand
            {
                EngagementId = engagementIdGuid,
                ClientOrganizationId = requestBody.ClientOrganizationId,
                AnnualRevenue = requestBody.AnnualRevenue,
                TotalEmployees = requestBody.TotalEmployees,
                HeadquartersCity = requestBody.HeadquartersCity,
                HeadquartersCountry = requestBody.HeadquartersCountry,
                CloudAdoptionScore = requestBody.CloudAdoptionScore,
                DataMaturityScore = requestBody.DataMaturityScore,
                AIAdoptionScore = requestBody.AIAdoptionScore
            };

            var result = await _mediator.Send(command, cancellationToken);
            return new CreatedResult($"/api/engagements/{engagementId}/company-profile/{result.Id}", result);
        }
        catch (ValidationException ex)
        {
            _logger.LogWarning("Validation error: {Message}", ex.Message);
            return new BadRequestObjectResult(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating company profile");
            return new StatusCodeResult(500);
        }
    }
}

public class CreateCompanyProfileRequest
{
    public Guid ClientOrganizationId { get; set; }
    public decimal AnnualRevenue { get; set; }
    public int TotalEmployees { get; set; }
    public string? HeadquartersCity { get; set; }
    public string? HeadquartersCountry { get; set; }
    public int CloudAdoptionScore { get; set; }
    public int DataMaturityScore { get; set; }
    public int AIAdoptionScore { get; set; }
}
```

### Example Azure Function: GetCompanyProfileFunction.cs

```csharp
namespace AETP.Modules.Engagement.Api.Functions.CompanyProfile;

public class GetCompanyProfileFunction
{
    private readonly IMediator _mediator;
    private readonly ILogger<GetCompanyProfileFunction> _logger;

    public GetCompanyProfileFunction(IMediator mediator, ILogger<GetCompanyProfileFunction> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    [Function("GetCompanyProfile")]
    public async Task<IActionResult> Run(
        [HttpTrigger(AuthorizationLevel.Function, "get", Route = "engagements/{engagementId}/company-profile/{id}")] 
        HttpRequest req,
        string engagementId,
        string id,
        CancellationToken cancellationToken)
    {
        try
        {
            if (!Guid.TryParse(engagementId, out var engagementIdGuid) || !Guid.TryParse(id, out var idGuid))
                return new BadRequestObjectResult(new { error = "Invalid IDs" });

            var query = new GetCompanyProfileByIdQuery 
            { 
                Id = idGuid, 
                EngagementId = engagementIdGuid 
            };

            var result = await _mediator.Send(query, cancellationToken);
            return new OkObjectResult(result);
        }
        catch (NotFoundException ex)
        {
            _logger.LogWarning("Not found: {Message}", ex.Message);
            return new NotFoundObjectResult(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting company profile");
            return new StatusCodeResult(500);
        }
    }
}
```

## REST API Endpoints Summary (Phase 5 Deliverables)

### CompanyProfile Module (12 endpoints)
- POST `/api/engagements/{engagementId}/company-profile` → CreateCompanyProfile
- GET `/api/engagements/{engagementId}/company-profile/{id}` → GetCompanyProfile
- GET `/api/engagements/{engagementId}/company-profile` → ListCompanyProfiles (paginated)
- PUT `/api/engagements/{engagementId}/company-profile/{id}` → UpdateCompanyProfile
- DELETE `/api/engagements/{engagementId}/company-profile/{id}` → DeleteCompanyProfile
- POST `/api/engagements/{engagementId}/company-profile/{id}/departments` → AddDepartment
- GET `/api/engagements/{engagementId}/company-profile/{id}/departments` → ListDepartments
- POST `/api/engagements/{engagementId}/company-profile/{id}/locations` → AddLocation
- GET `/api/engagements/{engagementId}/company-profile/{id}/locations` → ListLocations
- PATCH `/api/engagements/{engagementId}/company-profile/{id}/scores` → UpdateMaturityScores
- GET `/api/engagements/{engagementId}/company-profile/{id}/org-chart` → GetOrgChart
- GET `/api/engagements/{engagementId}/company-profile/{id}/geographic-reach` → GetGeographicReach

### Mission Module (11 endpoints)
- POST `/api/engagements/{engagementId}/missions` → CreateMission
- GET `/api/engagements/{engagementId}/missions/{id}` → GetMission
- GET `/api/engagements/{engagementId}/missions` → ListMissions (with version history)
- PUT `/api/engagements/{engagementId}/missions/{id}` → UpdateMission
- POST `/api/engagements/{engagementId}/missions/{id}/approve` → ApproveMission
- DELETE `/api/engagements/{engagementId}/missions/{id}` → DeleteMission
- POST `/api/engagements/{engagementId}/missions/{id}/align-strategy` → AlignStrategy
- GET `/api/engagements/{engagementId}/missions/{id}/aligned-strategies` → ListAlignedStrategies
- GET `/api/engagements/{engagementId}/missions/{id}/version-history` → GetVersionHistory
- GET `/api/engagements/{engagementId}/missions/validate-alignment/{strategyId}` → ValidateStrategyAlignment
- GET `/api/engagements/{engagementId}/missions/latest` → GetLatestApprovedMission

### Vision Module (15 endpoints)
- POST `/api/engagements/{engagementId}/visions` → CreateVision
- GET `/api/engagements/{engagementId}/visions/{id}` → GetVision
- GET `/api/engagements/{engagementId}/visions` → ListVisions
- PUT `/api/engagements/{engagementId}/visions/{id}` → UpdateVision
- DELETE `/api/engagements/{engagementId}/visions/{id}` → DeleteVision
- POST `/api/engagements/{engagementId}/visions/{id}/approve` → ApproveVision
- POST `/api/engagements/{engagementId}/visions/{id}/metrics` → AddVisionMetric
- GET `/api/engagements/{engagementId}/visions/{id}/metrics` → ListVisionMetrics
- PUT `/api/engagements/{engagementId}/visions/{visionId}/metrics/{metricId}` → UpdateVisionMetric
- DELETE `/api/engagements/{engagementId}/visions/{visionId}/metrics/{metricId}` → DeleteVisionMetric
- POST `/api/engagements/{engagementId}/visions/{id}/align-strategy` → AlignStrategy
- GET `/api/engagements/{engagementId}/visions/{id}/aligned-strategies` → ListAlignedStrategies
- GET `/api/engagements/{engagementId}/visions/{id}/progress` → GetVisionProgress
- GET `/api/engagements/{engagementId}/visions/{id}/metric-tracking` → GetMetricTracking
- GET `/api/engagements/{engagementId}/visions/latest` → GetLatestApprovedVision

### CompetitiveAdvantage Module (12 endpoints)
- POST `/api/engagements/{engagementId}/competitive-advantages` → CreateAdvantage
- GET `/api/engagements/{engagementId}/competitive-advantages/{id}` → GetAdvantage
- GET `/api/engagements/{engagementId}/competitive-advantages` → ListAdvantages
- PUT `/api/engagements/{engagementId}/competitive-advantages/{id}` → UpdateAdvantage
- DELETE `/api/engagements/{engagementId}/competitive-advantages/{id}` → DeleteAdvantage
- PATCH `/api/engagements/{engagementId}/competitive-advantages/{id}/defensibility` → UpdateDefensibilityScore
- POST `/api/engagements/{engagementId}/competitive-advantages/{id}/align-strategy` → AlignStrategy
- GET `/api/engagements/{engagementId}/competitive-advantages/{id}/aligned-strategies` → ListAlignedStrategies
- GET `/api/engagements/{engagementId}/competitive-advantages/by-category/{category}` → ListByCategory
- GET `/api/engagements/{engagementId}/competitive-advantages/at-risk` → ListAtRiskAdvantages
- GET `/api/engagements/{engagementId}/competitive-advantages/{id}/threat-analysis` → GetThreatAnalysis
- POST `/api/engagements/{engagementId}/competitive-advantages/{id}/review` → ScheduleReview

### StrategicPriority Module (14 endpoints)
- POST `/api/engagements/{engagementId}/strategic-priorities` → CreatePriority
- GET `/api/engagements/{engagementId}/strategic-priorities/{id}` → GetPriority
- GET `/api/engagements/{engagementId}/strategic-priorities` → ListPriorities (filtered by period)
- PUT `/api/engagements/{engagementId}/strategic-priorities/{id}` → UpdatePriority
- DELETE `/api/engagements/{engagementId}/strategic-priorities/{id}` → DeletePriority
- POST `/api/engagements/{engagementId}/strategic-priorities/{id}/activate` → ActivatePriority
- PATCH `/api/engagements/{engagementId}/strategic-priorities/{id}/progress` → UpdateProgress
- POST `/api/engagements/{engagementId}/strategic-priorities/{id}/align-strategy` → AlignStrategy
- GET `/api/engagements/{engagementId}/strategic-priorities/{id}/aligned-strategies` → ListAlignedStrategies
- GET `/api/engagements/{engagementId}/strategic-priorities/current-period` → GetCurrentPeriodPriorities
- GET `/api/engagements/{engagementId}/strategic-priorities/portfolio` → GetPriorityPortfolio
- POST `/api/engagements/{engagementId}/strategic-priorities/validate-gaps` → ValidateRankGaps
- GET `/api/engagements/{engagementId}/strategic-priorities/validate-weighting` → ValidateWeighting
- GET `/api/engagements/{engagementId}/strategic-priorities/roadmap` → GetPriorityRoadmap

### BusinessModelCanvas Module (13 endpoints)
- POST `/api/engagements/{engagementId}/bmc` → CreateBMC
- GET `/api/engagements/{engagementId}/bmc/{id}` → GetBMC
- GET `/api/engagements/{engagementId}/bmc` → ListBMC
- PUT `/api/engagements/{engagementId}/bmc/{id}` → UpdateBMC
- PATCH `/api/engagements/{engagementId}/bmc/{id}/block/{blockName}` → UpdateBlock
- POST `/api/engagements/{engagementId}/bmc/{id}/approve` → ApproveAsCurrentVersion
- DELETE `/api/engagements/{engagementId}/bmc/{id}` → DeleteBMC
- POST `/api/engagements/{engagementId}/bmc/{id}/align-strategy` → AlignStrategy
- GET `/api/engagements/{engagementId}/bmc/{id}/aligned-strategies` → ListAlignedStrategies
- GET `/api/engagements/{engagementId}/bmc/{id}/completeness` → GetCompletenessStatus
- GET `/api/engagements/{engagementId}/bmc/{id}/white-space` → IdentifyWhiteSpace
- GET `/api/engagements/{engagementId}/bmc/version-history` → GetVersionHistory
- POST `/api/engagements/{engagementId}/bmc/{id}/evolution-path` → UpdateEvolutionPath

### CorporateDocument Module (18 endpoints)
- POST `/api/engagements/{engagementId}/documents` → UploadDocument
- GET `/api/engagements/{engagementId}/documents/{id}` → GetDocument
- GET `/api/engagements/{engagementId}/documents` → ListDocuments (paginated, searchable)
- PUT `/api/engagements/{engagementId}/documents/{id}` → UpdateDocument (metadata)
- DELETE `/api/engagements/{engagementId}/documents/{id}` → DeleteDocument
- POST `/api/engagements/{engagementId}/documents/{id}/version` → CreateNewVersion
- GET `/api/engagements/{engagementId}/documents/{id}/versions` → ListVersions
- GET `/api/engagements/{engagementId}/documents/{id}/download` → DownloadDocument
- POST `/api/engagements/{engagementId}/documents/{id}/align-strategy` → AlignToStrategy
- POST `/api/engagements/{engagementId}/documents/{id}/align-objective` → AlignToObjective
- GET `/api/engagements/{engagementId}/documents/{id}/alignments` → GetAlignments
- GET `/api/engagements/{engagementId}/documents/by-theme/{theme}` → ListByTheme
- GET `/api/engagements/{engagementId}/documents/by-type/{type}` → ListByType
- GET `/api/engagements/{engagementId}/documents/search` → SearchDocuments (full-text)
- GET `/api/engagements/{engagementId}/documents/{id}/access-control` → CheckAccess
- PATCH `/api/engagementId}/documents/{id}/confidentiality` → UpdateConfidentiality
- POST `/api/engagements/{engagementId}/documents/{id}/tag` → AddTags
- GET `/api/engagements/{engagementId}/documents/orphaned` → ListOrphanedDocuments

### AgentSession Module (8 endpoints)
- POST `/api/engagements/{engagementId}/agent/sessions` → StartSession
- GET `/api/engagements/{engagementId}/agent/sessions/{sessionId}` → GetSession
- GET `/api/engagements/{engagementId}/agent/sessions` → ListSessions
- POST `/api/engagements/{engagementId}/agent/sessions/{sessionId}/query` → ExecuteQuery
- GET `/api/engagements/{engagementId}/agent/sessions/{sessionId}/insights` → GetInsights
- GET `/api/engagements/{engagementId}/agent/sessions/{sessionId}/recommendations` → GetRecommendations
- POST `/api/engagements/{engagementId}/agent/sessions/{sessionId}/complete` → CompleteSession
- GET `/api/engagements/{engagementId}/agent/sessions/latest` → GetLatestSession

**Total Phase 5: 103+ Azure Function endpoints**

---

# PHASE 6: TESTING

**Duration:** Weeks 8-10  
**Coverage:** Unit Tests (Commands, Validators, Queries) + Integration Tests (E2E scenarios)

## Unit Tests

**Projects:**
- `AETP.Modules.Engagement.Domain.Tests` → Domain entity tests
- `AETP.Modules.Engagement.Application.Tests` → CQRS handler + validator tests
- `AETP.Modules.Engagement.Api.Tests` → Azure Function tests

### Example Unit Test: CreateCompanyProfileCommandTests.cs

```csharp
namespace AETP.Modules.Engagement.Application.Tests.Commands.CompanyProfile;

[TestClass]
public class CreateCompanyProfileCommandTests
{
    private readonly IMediator _mediator;
    private readonly ClientEngagementDbContext _dbContext;
    private readonly IMapper _mapper;

    public CreateCompanyProfileCommandTests()
    {
        var services = new ServiceCollection();
        // ... DI setup
    }

    [TestMethod]
    public async Task Handle_ValidCommand_CreatesCompanyProfile()
    {
        // Arrange
        var command = new CreateCompanyProfileCommand
        {
            EngagementId = Guid.NewGuid(),
            ClientOrganizationId = Guid.NewGuid(),
            AnnualRevenue = 1_000_000,
            TotalEmployees = 100,
            CloudAdoptionScore = 65
        };

        // Act
        var result = await _mediator.Send(command);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual(command.AnnualRevenue, result.AnnualRevenue);
        var dbRecord = await _dbContext.CompanyProfiles.FirstOrDefaultAsync(cp => cp.Id == result.Id);
        Assert.IsNotNull(dbRecord);
    }

    [TestMethod]
    public async Task Handle_InvalidMaturityScores_ThrowsValidationException()
    {
        // Arrange
        var command = new CreateCompanyProfileCommand
        {
            EngagementId = Guid.NewGuid(),
            ClientOrganizationId = Guid.NewGuid(),
            AnnualRevenue = 1_000_000,
            TotalEmployees = 100,
            CloudAdoptionScore = 150 // Invalid: > 100
        };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ValidationException>(() => _mediator.Send(command));
    }
}
```

### Example Unit Test: CreateCompanyProfileValidatorTests.cs

```csharp
namespace AETP.Modules.Engagement.Application.Tests.Commands.CompanyProfile;

[TestClass]
public class CreateCompanyProfileValidatorTests
{
    private readonly CreateCompanyProfileValidator _validator;

    public CreateCompanyProfileValidatorTests()
    {
        _validator = new CreateCompanyProfileValidator();
    }

    [TestMethod]
    public void Validate_ValidCommand_IsValid()
    {
        // Arrange
        var command = new CreateCompanyProfileCommand
        {
            EngagementId = Guid.NewGuid(),
            ClientOrganizationId = Guid.NewGuid(),
            AnnualRevenue = 1_000_000,
            TotalEmployees = 100,
            CloudAdoptionScore = 65,
            DataMaturityScore = 50,
            AIAdoptionScore = 40
        };

        // Act
        var result = _validator.Validate(command);

        // Assert
        Assert.IsTrue(result.IsValid);
    }

    [TestMethod]
    public void Validate_MissingEngagementId_IsInvalid()
    {
        // Arrange
        var command = new CreateCompanyProfileCommand
        {
            EngagementId = Guid.Empty, // Invalid
            ClientOrganizationId = Guid.NewGuid(),
            AnnualRevenue = 1_000_000,
            TotalEmployees = 100
        };

        // Act
        var result = _validator.Validate(command);

        // Assert
        Assert.IsFalse(result.IsValid);
        Assert.IsTrue(result.Errors.Any(e => e.PropertyName == "EngagementId"));
    }
}
```

## Integration Tests

**File:** `AETP.Modules.Engagement.Api.Tests/CompanyProfileFunctionTests.cs`

```csharp
namespace AETP.Modules.Engagement.Api.Tests.Functions;

[TestClass]
public class CompanyProfileFunctionIntegrationTests
{
    private readonly HttpClient _httpClient;
    private readonly string _baseUrl;

    public CompanyProfileFunctionIntegrationTests()
    {
        // Setup: point to local Azure Functions emulator or test instance
        _baseUrl = "http://localhost:7071/api";
        _httpClient = new HttpClient();
    }

    [TestMethod]
    public async Task CreateCompanyProfile_ValidRequest_Returns201Created()
    {
        // Arrange
        var engagementId = Guid.NewGuid();
        var request = new CreateCompanyProfileRequest
        {
            ClientOrganizationId = Guid.NewGuid(),
            AnnualRevenue = 1_000_000,
            TotalEmployees = 100,
            CloudAdoptionScore = 65,
            DataMaturityScore = 50,
            AIAdoptionScore = 40
        };

        // Act
        var response = await _httpClient.PostAsJsonAsync(
            $"{_baseUrl}/engagements/{engagementId}/company-profile",
            request);

        // Assert
        Assert.AreEqual(System.Net.HttpStatusCode.Created, response.StatusCode);
        var content = await response.Content.ReadAsAsync<CompanyProfileDto>();
        Assert.IsNotNull(content);
        Assert.AreEqual(request.AnnualRevenue, content.AnnualRevenue);
    }

    [TestMethod]
    public async Task GetCompanyProfile_ExistingId_Returns200OK()
    {
        // Arrange
        var engagementId = Guid.NewGuid();
        var companyProfileId = Guid.NewGuid(); // Pre-seeded in test DB

        // Act
        var response = await _httpClient.GetAsync(
            $"{_baseUrl}/engagements/{engagementId}/company-profile/{companyProfileId}");

        // Assert
        Assert.AreEqual(System.Net.HttpStatusCode.OK, response.StatusCode);
    }
}
```

---

# DEPLOYMENT & GO-LIVE

**Duration:** Week 10+

## Pre-Deployment Checklist

- [ ] All 16 domain entities created and tested
- [ ] DbContext fully configured; migrations applied to Azure SQL
- [ ] All CQRS commands, queries, validators implemented
- [ ] All 103+ Azure Function endpoints implemented and tested
- [ ] Unit test coverage ≥80%
- [ ] Integration tests passing
- [ ] Swagger/OpenAPI documentation generated
- [ ] Security policies (CORS, RBAC, rate limiting) configured
- [ ] Error handling and logging configured
- [ ] Performance tests passed (latency, throughput)

## Deployment Steps

### 1. Publish Azure Functions

```powershell
cd src/Modules/Engagement/AETP.Modules.Engagement.Api

func azure functionapp publish <function-app-name> --dotnet-isolated
```

### 2. Run Migrations on Production Azure SQL

```powershell
dotnet ef database update `
  --project src/Modules/Engagement/AETP.Modules.Engagement.Infrastructure `
  --startup-project src/Host/AETP.Api `
  --context ClientEngagementDbContext `
  --connection "Server=tcp:flatsqlserver.database.windows.net,1433;Database=businessagenticdb;..."
```

### 3. Seed Demo Data

```powershell
.\scripts\seed-workspace1-demo.ps1 `
  -EngagementId "00000000-0000-0000-0000-000000000001" `
  -ClientOrganizationId "00000000-0000-0000-0000-000000000002"
```

### 4. Smoke Tests

```powershell
# Test CompanyProfile creation
Invoke-RestMethod -Method Post `
  -Uri "https://<function-app-name>.azurewebsites.net/api/engagements/00000000-0000-0000-0000-000000000001/company-profile" `
  -Body @{
      ClientOrganizationId = "00000000-0000-0000-0000-000000000002"
      AnnualRevenue = 1000000
      TotalEmployees = 100
      CloudAdoptionScore = 65
  } | ConvertTo-Json
```

---

# QUICK REFERENCE: Phase Completion Checklist

| Phase | Week | Deliverable | Status |
|-------|------|-------------|--------|
| **1** | 1 | 16 Domain entities (4 .cs files) | ⬜ Not Started |
| **2** | 2 | Extended DbContext + Fluent configs | ⬜ Not Started |
| **3** | 2-3 | 6 EF Core migrations applied to Azure SQL | ⬜ Not Started |
| **4** | 3-4 | CQRS handlers (Commands, Queries, Validators) for all 16 entities | ⬜ Not Started |
| **5** | 5-7 | 103+ Azure Function endpoints | ⬜ Not Started |
| **6** | 8-10 | Unit + Integration tests (≥80% coverage) | ⬜ Not Started |
| **Release** | 10+ | Deploy to Azure; smoke tests | ⬜ Not Started |

---

**End of Workspace 1 Implementation Roadmap**  
**Lead Architect:** Ready for Team Execution  
**Questions?** Refer to WORKSPACE1_SPECIFICATION.md for entity specifications
