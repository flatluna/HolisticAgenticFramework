# AETP Workspace 1: Complete Model
## "Entender Estrategia, Objetivos y Modelo de Negocio"

**Status:** Blueprint for Implementation  
**Date:** 2026-07-20  
**Role:** Product Architect + Domain Architect  
**Scope:** Complete Enterprise Knowledge Base (Workspace 1 Only)

---

## Executive Summary

Workspace 1 transforms raw business data into a **strategic knowledge base**. It captures not just what the organization does (Strategy/Objectives), but **WHY** it exists (Mission/Vision), **HOW** it competes (Competitive Advantage), **WHERE** value flows (Business Model Canvas), and **WHAT** it knows (Corporate Documents + Strategy Intelligence).

**14 Domain Entities** (6 existing + 8 new):
```
ClientOrganization (tenant root)
├── Engagement (scoping entity)
├── CompanyProfile (organizational deep-dive)
├── Mission (operational direction)
├── Vision (aspirational future)
├── CompetitiveAdvantage (differentiators)
├── StrategicPriority (ranked focus areas)
├── BusinessModelCanvas (value model)
├── CorporateDocument (knowledge repository)
└── Strategy (business strategy aggregate)
    ├── Objective (measurable goal)
    ├── KPI (metric)
    └── StrategicPriority (priority alignment)
```

**No dependencies on Assessment, Gap Analysis, Capability Mapping, or Process Design.**

---

## Part I: Existing Entities (Review & Alignment)

### 1. ClientOrganization
**Role:** Multi-tenant root; the client company  
**Current State:** Name, Industry, Country, EmployeeCount, Status

**Enhancements for Workspace 1:**
- Link to CompanyProfile (1:1)
- Link to Mission (1:1)
- Link to Vision (1:1)

---

### 2. Engagement
**Role:** Scoping container; tenant partition key (EngagementId)  
**Current State:** ClientOrganizationId FK, Name, Description, StartDate, EndDate, Status, Budget

**Enhancements for Workspace 1:**
- Add Phase field: "Intake" → "Intelligence Gathering" → "Strategy Validation" → "Active Execution"
- Add Engagement Type: "Full Transformation", "Strategy Update", "Assessment Only"

---

### 3. Stakeholder
**Role:** Participants in engagement  
**Current State:** EngagementId, Name, Email, Role, Status

**No changes needed** (supports Workspace 1 as-is).

---

### 4. Strategy
**Role:** Aggregate root for strategic direction  
**Current State:** EngagementId, Name, Vision, CompetitiveAdvantage, Status, TimeHorizonMonths

**Alignment for Workspace 1:**
- Links to StrategicPriorities (M:N)
- Links to VisionMetrics (1:N) — measures of vision achievement

---

### 5. Objective
**Role:** Measurable strategic goal  
**Current State:** StrategyId, Name, Description, Status, TargetValue, TargetDate

**No changes needed** (fully aligned).

---

### 6. KPI
**Role:** Metric for objective measurement  
**Current State:** ObjectiveId, Name, Unit, BaselineValue, TargetValue, Frequency

**Alignment:** Ensure traceability: KPI → Objective → Strategy → Strategic Priority

---

## Part II: 8 New Components (Detailed Design)

### Component 1: Company Profile
**Purpose:**  
Deep organizational intelligence — department structure, locations, headcount, financial position, market presence. Answers: "Who are they and how are they organized?"

**Domain Entities:**

```csharp
public class CompanyProfile : AggregateRoot
{
    public Guid ClientOrganizationId { get; set; }
    
    // Core Profile
    public string Founded { get; set; } // ISO 8601 date or text (e.g., "1995-03-15")
    public decimal AnnualRevenue { get; set; } // in millions
    public int TotalEmployees { get; set; }
    public string HeadquartersCity { get; set; }
    public string HeadquartersCountry { get; set; }
    
    // Market Presence
    public ICollection<string> IndustrySectors { get; set; } // JSON array or normalization table
    public ICollection<string> GeographicMarkets { get; set; } // countries/regions
    public ICollection<string> KeyProducts { get; set; }
    
    // Financial Health
    public string LastFiscalYear { get; set; }
    public decimal ProfitMargin { get; set; }
    public string CreditRating { get; set; } // e.g., "A+", "BB-"
    
    // Digital Maturity
    public int CloudAdoptionScore { get; set; } // 0-100
    public int DataMaturityScore { get; set; } // 0-100
    public int AIAdoptionScore { get; set; } // 0-100
    
    // Relationships
    public ClientOrganization ClientOrganization { get; set; }
    public ICollection<Department> Departments { get; set; }
    public ICollection<Location> Locations { get; set; }
    
    public static CompanyProfile Create(Guid engagementId, Guid clientId, string founded)
    {
        return new CompanyProfile
        {
            Id = Guid.NewGuid(),
            EngagementId = engagementId,
            ClientOrganizationId = clientId,
            Founded = founded,
            CreatedAt = DateTime.UtcNow
        };
    }
}

public class Department : Entity
{
    public Guid CompanyProfileId { get; set; }
    public string Name { get; set; }
    public string? Description { get; set; }
    public int? HeadCount { get; set; }
    public string? LeadName { get; set; }
    public string? LeadEmail { get; set; }
    public decimal? AnnualBudget { get; set; }
    public int DisplayOrder { get; set; } // org chart order
    
    public static Department Create(Guid engagementId, Guid companyProfileId, string name)
    {
        return new Department
        {
            Id = Guid.NewGuid(),
            EngagementId = engagementId,
            CompanyProfileId = companyProfileId,
            Name = name,
            CreatedAt = DateTime.UtcNow
        };
    }
}

public class Location : Entity
{
    public Guid CompanyProfileId { get; set; }
    public string City { get; set; }
    public string Country { get; set; }
    public string? Office { get; set; } // HQ, Regional, Branch
    public int Headcount { get; set; }
    public bool IsHeadquarters { get; set; }
    
    public static Location Create(Guid engagementId, Guid companyProfileId, string city, string country)
    {
        return new Location
        {
            Id = Guid.NewGuid(),
            EngagementId = engagementId,
            CompanyProfileId = companyProfileId,
            City = city,
            Country = country,
            CreatedAt = DateTime.UtcNow
        };
    }
}
```

**SQL Schema:**
```sql
CREATE SCHEMA [engagement]
GO

CREATE TABLE [engagement].[CompanyProfiles] (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    EngagementId UNIQUEIDENTIFIER NOT NULL UNIQUE,
    ClientOrganizationId UNIQUEIDENTIFIER NOT NULL,
    Founded NVARCHAR(50),
    AnnualRevenue DECIMAL(18, 2),
    TotalEmployees INT,
    HeadquartersCity NVARCHAR(128),
    HeadquartersCountry NVARCHAR(128),
    IndustrySectors NVARCHAR(MAX), -- JSON
    GeographicMarkets NVARCHAR(MAX), -- JSON
    KeyProducts NVARCHAR(MAX), -- JSON
    CloudAdoptionScore INT CHECK (CloudAdoptionScore >= 0 AND CloudAdoptionScore <= 100),
    DataMaturityScore INT CHECK (DataMaturityScore >= 0 AND DataMaturityScore <= 100),
    AIAdoptionScore INT CHECK (AIAdoptionScore >= 0 AND AIAdoptionScore <= 100),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2,
    FOREIGN KEY (ClientOrganizationId) REFERENCES [engagement].[ClientOrganizations](Id),
    INDEX IX_CompanyProfiles_Engagement (EngagementId)
);

CREATE TABLE [engagement].[Departments] (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    EngagementId UNIQUEIDENTIFIER NOT NULL,
    CompanyProfileId UNIQUEIDENTIFIER NOT NULL,
    Name NVARCHAR(256) NOT NULL,
    Description NVARCHAR(1000),
    HeadCount INT,
    LeadName NVARCHAR(256),
    LeadEmail NVARCHAR(256),
    AnnualBudget DECIMAL(18, 2),
    DisplayOrder INT,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2,
    FOREIGN KEY (CompanyProfileId) REFERENCES [engagement].[CompanyProfiles](Id),
    INDEX IX_Departments_Profile (CompanyProfileId),
    INDEX IX_Departments_Engagement (EngagementId)
);

CREATE TABLE [engagement].[Locations] (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    EngagementId UNIQUEIDENTIFIER NOT NULL,
    CompanyProfileId UNIQUEIDENTIFIER NOT NULL,
    City NVARCHAR(128) NOT NULL,
    Country NVARCHAR(128) NOT NULL,
    Office NVARCHAR(50),
    Headcount INT NOT NULL DEFAULT 0,
    IsHeadquarters BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2,
    FOREIGN KEY (CompanyProfileId) REFERENCES [engagement].[CompanyProfiles](Id),
    INDEX IX_Locations_Profile (CompanyProfileId),
    INDEX IX_Locations_Engagement (EngagementId)
);
```

**REST Endpoints:**
```
GET    /api/company-profile/{engagementId}
POST   /api/company-profile
PUT    /api/company-profile/{id}
DELETE /api/company-profile/{id}

GET    /api/company-profile/{profileId}/departments
POST   /api/company-profile/{profileId}/departments
PUT    /api/departments/{id}

GET    /api/company-profile/{profileId}/locations
POST   /api/company-profile/{profileId}/locations
PUT    /api/locations/{id}
```

**Validations:**
- CloudAdoptionScore, DataMaturityScore, AIAdoptionScore: 0-100
- Founded: Valid ISO 8601 date or text
- AnnualRevenue: > 0
- TotalEmployees: > 0
- LeadEmail: Valid email format
- City, Country: Non-empty

**Use Cases:**
1. Consultant uploads company profile from discovery call notes
2. System displays org chart (Departments + Locations) on engagement dashboard
3. Stakeholder updates department headcounts quarterly
4. Intelligence agent correlates maturity scores to Strategy recommendations

---

### Component 2: Mission
**Purpose:**  
"Why we exist" — operational directive, not aspirational. Mission guides daily decisions. Answers: "What is the organization's reason for being?"

**Domain Entities:**

```csharp
public class Mission : AggregateRoot
{
    public Guid ClientOrganizationId { get; set; }
    
    // Core Mission
    public string MissionStatement { get; set; } // 1-3 sentences
    public string? CoreValues { get; set; } // JSON array or CSV
    public string? Pillars { get; set; } // Core business pillars (e.g., "Innovation, Customer Focus, Operational Excellence")
    
    // Alignment
    public ICollection<Strategy> AlignedStrategies { get; set; } // M:N: which strategies operationalize mission
    
    // Versioning
    public int VersionNumber { get; set; }
    public DateTime EffectiveDate { get; set; }
    public string? ChangeReason { get; set; }
    public string? ApprovedBy { get; set; }
    
    // Audit
    public string Status { get; set; } = "Draft"; // Draft, Approved, Active, Superseded
    
    public static Mission Create(Guid engagementId, Guid clientId, string statement)
    {
        return new Mission
        {
            Id = Guid.NewGuid(),
            EngagementId = engagementId,
            ClientOrganizationId = clientId,
            MissionStatement = statement,
            VersionNumber = 1,
            EffectiveDate = DateTime.UtcNow,
            Status = "Draft",
            CreatedAt = DateTime.UtcNow
        };
    }
}
```

**SQL Schema:**
```sql
CREATE TABLE [engagement].[Missions] (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    EngagementId UNIQUEIDENTIFIER NOT NULL,
    ClientOrganizationId UNIQUEIDENTIFIER NOT NULL,
    MissionStatement NVARCHAR(1000) NOT NULL,
    CoreValues NVARCHAR(MAX), -- JSON
    Pillars NVARCHAR(MAX), -- JSON
    VersionNumber INT NOT NULL DEFAULT 1,
    EffectiveDate DATETIME2 NOT NULL,
    ChangeReason NVARCHAR(500),
    ApprovedBy NVARCHAR(256),
    Status NVARCHAR(50) NOT NULL DEFAULT 'Draft',
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2,
    FOREIGN KEY (ClientOrganizationId) REFERENCES [engagement].[ClientOrganizations](Id),
    UNIQUE (ClientOrganizationId, VersionNumber),
    INDEX IX_Missions_Engagement (EngagementId)
);

CREATE TABLE [engagement].[MissionStrategyAlignments] (
    MissionId UNIQUEIDENTIFIER NOT NULL,
    StrategyId UNIQUEIDENTIFIER NOT NULL,
    AlignmentScore INT CHECK (AlignmentScore >= 0 AND AlignmentScore <= 100),
    Comment NVARCHAR(500),
    PRIMARY KEY (MissionId, StrategyId),
    FOREIGN KEY (MissionId) REFERENCES [engagement].[Missions](Id),
    FOREIGN KEY (StrategyId) REFERENCES [strategy].[Strategies](Id)
);
```

**REST Endpoints:**
```
GET    /api/mission/{engagementId}
POST   /api/mission
PUT    /api/mission/{id}
GET    /api/mission/{id}/versions
POST   /api/mission/{id}/alignments (link to Strategy)
```

**Validations:**
- MissionStatement: 50-1000 characters
- CoreValues: max 10 values
- Pillars: max 5 pillars
- ApprovedBy: Valid email if provided
- Status: one of {Draft, Approved, Active, Superseded}

**Use Cases:**
1. Client updates Mission statement post-board meeting
2. Consultant reviews Mission to ensure Strategy alignment
3. Intelligence agent detects Mission-Strategy misalignment
4. New strategy must trace back to at least one Mission pillar

---

### Component 3: Vision
**Purpose:**  
"Where we want to be" (3-5 years). Aspirational, measurable, inspiring. Answers: "What is our desired future state?"

**Domain Entities:**

```csharp
public class Vision : AggregateRoot
{
    public Guid ClientOrganizationId { get; set; }
    
    // Core Vision
    public string VisionStatement { get; set; } // 2-3 sentences
    public int TimeHorizonYears { get; set; } // typically 3-5
    public DateTime TargetDate { get; set; }
    
    // Vision Components
    public ICollection<VisionMetric> VisionMetrics { get; set; } // 3-5 measurable outcomes
    public ICollection<Strategy> AlignedStrategies { get; set; } // M:N: which strategies achieve vision
    
    // Versioning
    public int VersionNumber { get; set; }
    public DateTime EffectiveDate { get; set; }
    public string? ApprovedBy { get; set; }
    public string Status { get; set; } = "Draft"; // Draft, Approved, Active
    
    public static Vision Create(Guid engagementId, Guid clientId, string statement, int years = 3)
    {
        return new Vision
        {
            Id = Guid.NewGuid(),
            EngagementId = engagementId,
            ClientOrganizationId = clientId,
            VisionStatement = statement,
            TimeHorizonYears = years,
            TargetDate = DateTime.UtcNow.AddYears(years),
            VersionNumber = 1,
            EffectiveDate = DateTime.UtcNow,
            Status = "Draft",
            CreatedAt = DateTime.UtcNow
        };
    }
}

public class VisionMetric : Entity
{
    public Guid VisionId { get; set; }
    public string Name { get; set; } // e.g., "Revenue from AI products", "Customer satisfaction score"
    public string? Description { get; set; }
    public decimal? CurrentValue { get; set; }
    public decimal? TargetValue { get; set; }
    public string Unit { get; set; }
    public int DisplayOrder { get; set; }
    
    public Vision? Vision { get; set; }
    
    public static VisionMetric Create(Guid engagementId, Guid visionId, string name, string unit)
    {
        return new VisionMetric
        {
            Id = Guid.NewGuid(),
            EngagementId = engagementId,
            VisionId = visionId,
            Name = name,
            Unit = unit,
            CreatedAt = DateTime.UtcNow
        };
    }
}
```

**SQL Schema:**
```sql
CREATE TABLE [engagement].[Visions] (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    EngagementId UNIQUEIDENTIFIER NOT NULL,
    ClientOrganizationId UNIQUEIDENTIFIER NOT NULL,
    VisionStatement NVARCHAR(1000) NOT NULL,
    TimeHorizonYears INT NOT NULL,
    TargetDate DATETIME2 NOT NULL,
    VersionNumber INT NOT NULL DEFAULT 1,
    EffectiveDate DATETIME2 NOT NULL,
    ApprovedBy NVARCHAR(256),
    Status NVARCHAR(50) NOT NULL DEFAULT 'Draft',
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2,
    FOREIGN KEY (ClientOrganizationId) REFERENCES [engagement].[ClientOrganizations](Id),
    UNIQUE (ClientOrganizationId, VersionNumber),
    INDEX IX_Visions_Engagement (EngagementId)
);

CREATE TABLE [engagement].[VisionMetrics] (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    EngagementId UNIQUEIDENTIFIER NOT NULL,
    VisionId UNIQUEIDENTIFIER NOT NULL,
    Name NVARCHAR(256) NOT NULL,
    Description NVARCHAR(500),
    CurrentValue DECIMAL(18, 2),
    TargetValue DECIMAL(18, 2),
    Unit NVARCHAR(50) NOT NULL,
    DisplayOrder INT,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2,
    FOREIGN KEY (VisionId) REFERENCES [engagement].[Visions](Id),
    INDEX IX_VisionMetrics_Vision (VisionId),
    INDEX IX_VisionMetrics_Engagement (EngagementId)
);

CREATE TABLE [engagement].[VisionStrategyAlignments] (
    VisionId UNIQUEIDENTIFIER NOT NULL,
    StrategyId UNIQUEIDENTIFIER NOT NULL,
    AlignmentScore INT CHECK (AlignmentScore >= 0 AND AlignmentScore <= 100),
    PRIMARY KEY (VisionId, StrategyId),
    FOREIGN KEY (VisionId) REFERENCES [engagement].[Visions](Id),
    FOREIGN KEY (StrategyId) REFERENCES [strategy].[Strategies](Id)
);
```

**REST Endpoints:**
```
GET    /api/vision/{engagementId}
POST   /api/vision
PUT    /api/vision/{id}
GET    /api/vision/{id}/metrics
POST   /api/vision/{visionId}/metrics
PUT    /api/vision/metrics/{id}
POST   /api/vision/{id}/alignments
```

**Validations:**
- VisionStatement: 50-1500 characters
- TimeHorizonYears: 1-10
- VisionMetrics: 3-5 required
- TargetValue > CurrentValue (if both provided)
- Status: {Draft, Approved, Active}

**Use Cases:**
1. Consultant captures vision from CEO interview
2. Board reviews vision and provides feedback
3. Vision metrics are tracked quarterly
4. Each Strategy must contribute to at least 1 Vision metric
5. Intelligence agent measures progress toward vision targets

---

### Component 4: Competitive Advantage
**Purpose:**  
"Why customers choose us" — differentiation, market positioning, competitive moats. Answers: "What makes us different and defensible?"

**Domain Entities:**

```csharp
public class CompetitiveAdvantage : AggregateRoot
{
    public Guid ClientOrganizationId { get; set; }
    
    // Core Advantage
    public string Name { get; set; } // e.g., "Patent-backed AI", "Customer relationships", "Cost structure"
    public string Description { get; set; }
    public string Category { get; set; } // Technology, Brand, Cost, Relationships, Ecosystem, Data
    
    // Strength Assessment
    public int CurrentStrength { get; set; } // 1-10 scale
    public int DefensibilityScore { get; set; } // 1-10: How hard to copy?
    public int DurationYears { get; set; } // Expected lifespan of advantage
    
    // Competitive Landscape
    public string? CompetitorThreats { get; set; } // JSON: list of competitive threats
    public string? StrengthAreas { get; set; } // JSON: internal strengths supporting advantage
    public string? WeakAreas { get; set; } // JSON: vulnerabilities to address
    
    // Strategic Alignment
    public ICollection<Strategy> AlignedStrategies { get; set; } // M:N: which strategies protect/amplify this advantage
    
    // Versioning
    public int VersionNumber { get; set; }
    public DateTime LastReviewDate { get; set; }
    public string Status { get; set; } = "Active"; // Active, Declining, Emerging, Superseded
    
    public static CompetitiveAdvantage Create(Guid engagementId, Guid clientId, string name, string description)
    {
        return new CompetitiveAdvantage
        {
            Id = Guid.NewGuid(),
            EngagementId = engagementId,
            ClientOrganizationId = clientId,
            Name = name,
            Description = description,
            VersionNumber = 1,
            LastReviewDate = DateTime.UtcNow,
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };
    }
}
```

**SQL Schema:**
```sql
CREATE TABLE [engagement].[CompetitiveAdvantages] (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    EngagementId UNIQUEIDENTIFIER NOT NULL,
    ClientOrganizationId UNIQUEIDENTIFIER NOT NULL,
    Name NVARCHAR(256) NOT NULL,
    Description NVARCHAR(1000) NOT NULL,
    Category NVARCHAR(50) NOT NULL, -- Technology, Brand, Cost, Relationships, Ecosystem, Data
    CurrentStrength INT NOT NULL CHECK (CurrentStrength >= 1 AND CurrentStrength <= 10),
    DefensibilityScore INT NOT NULL CHECK (DefensibilityScore >= 1 AND DefensibilityScore <= 10),
    DurationYears INT,
    CompetitorThreats NVARCHAR(MAX), -- JSON
    StrengthAreas NVARCHAR(MAX), -- JSON
    WeakAreas NVARCHAR(MAX), -- JSON
    VersionNumber INT NOT NULL DEFAULT 1,
    LastReviewDate DATETIME2 NOT NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'Active',
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2,
    FOREIGN KEY (ClientOrganizationId) REFERENCES [engagement].[ClientOrganizations](Id),
    INDEX IX_CompetitiveAdvantages_Engagement (EngagementId)
);

CREATE TABLE [engagement].[CompetitiveAdvantageStrategyAlignments] (
    CompetitiveAdvantageId UNIQUEIDENTIFIER NOT NULL,
    StrategyId UNIQUEIDENTIFIER NOT NULL,
    AlignmentType NVARCHAR(50) NOT NULL, -- Protect, Amplify, Defend
    PRIMARY KEY (CompetitiveAdvantageId, StrategyId),
    FOREIGN KEY (CompetitiveAdvantageId) REFERENCES [engagement].[CompetitiveAdvantages](Id),
    FOREIGN KEY (StrategyId) REFERENCES [strategy].[Strategies](Id)
);
```

**REST Endpoints:**
```
GET    /api/competitive-advantage/{engagementId}
POST   /api/competitive-advantage
PUT    /api/competitive-advantage/{id}
POST   /api/competitive-advantage/{id}/alignments
GET    /api/competitive-advantage/{id}/threat-analysis
```

**Validations:**
- Name: 10-256 characters
- Description: 50-1000 characters
- Category: one of {Technology, Brand, Cost, Relationships, Ecosystem, Data}
- CurrentStrength, DefensibilityScore: 1-10
- DurationYears: 1-20 (or null)
- Status: {Active, Declining, Emerging, Superseded}

**Use Cases:**
1. Consultant facilitates competitive positioning workshop
2. Client identifies top 3-5 competitive advantages
3. Strategy must protect/amplify at least 1 advantage
4. Quarterly review assesses if advantage is strengthening or declining
5. Intelligence agent flags strategies that don't align to core advantages

---

### Component 5: Strategic Priorities
**Purpose:**  
"What we focus on NOW" — ranked top 3-5 initiatives. Provides decision filter. Answers: "If we could only do 5 things this year, what would they be?"

**Domain Entities:**

```csharp
public class StrategicPriority : AggregateRoot
{
    public Guid ClientOrganizationId { get; set; }
    
    // Core Priority
    public string Name { get; set; }
    public string Description { get; set; }
    public string Framework { get; set; } // e.g., "BCG Growth Share", "Porter Five Forces", "Custom"
    public int Rank { get; set; } // 1 = highest priority
    public decimal WeightingScore { get; set; } // For MAUT/weighted scoring: sum all = 100
    
    // Time-bound
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; } // typically 12 months
    
    // Rationale
    public string Rationale { get; set; } // Why this priority?
    public string? ExpectedOutcome { get; set; }
    
    // Strategic Alignment
    public ICollection<Strategy> Strategies { get; set; } // M:N: which strategies execute this priority
    
    // Tracking
    public string Status { get; set; } = "Active"; // Planned, Active, Achieved, Deferred
    public decimal? ProgressPercentage { get; set; } // 0-100
    public DateTime? LastReviewDate { get; set; }
    
    public static StrategicPriority Create(Guid engagementId, Guid clientId, string name, int rank)
    {
        return new StrategicPriority
        {
            Id = Guid.NewGuid(),
            EngagementId = engagementId,
            ClientOrganizationId = clientId,
            Name = name,
            Rank = rank,
            PeriodStart = DateTime.UtcNow,
            PeriodEnd = DateTime.UtcNow.AddYears(1),
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };
    }
}

// Junction table for M:N relationship
public class StrategicPriorityStrategyAlignment
{
    public Guid StrategicPriorityId { get; set; }
    public Guid StrategyId { get; set; }
    public int ExecutionOrder { get; set; } // sequence
    public decimal ContributionPercentage { get; set; } // how much this strategy contributes to priority
}
```

**SQL Schema:**
```sql
CREATE TABLE [engagement].[StrategicPriorities] (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    EngagementId UNIQUEIDENTIFIER NOT NULL,
    ClientOrganizationId UNIQUEIDENTIFIER NOT NULL,
    Name NVARCHAR(256) NOT NULL,
    Description NVARCHAR(1000) NOT NULL,
    Framework NVARCHAR(128),
    Rank INT NOT NULL,
    WeightingScore DECIMAL(5, 2) NOT NULL,
    PeriodStart DATETIME2 NOT NULL,
    PeriodEnd DATETIME2 NOT NULL,
    Rationale NVARCHAR(1000) NOT NULL,
    ExpectedOutcome NVARCHAR(1000),
    Status NVARCHAR(50) NOT NULL DEFAULT 'Active',
    ProgressPercentage DECIMAL(5, 2),
    LastReviewDate DATETIME2,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2,
    FOREIGN KEY (ClientOrganizationId) REFERENCES [engagement].[ClientOrganizations](Id),
    UNIQUE (ClientOrganizationId, Rank, PeriodStart),
    CHECK (Rank >= 1 AND Rank <= 10),
    CHECK (WeightingScore >= 0 AND WeightingScore <= 100),
    INDEX IX_StrategicPriorities_Engagement (EngagementId)
);

CREATE TABLE [engagement].[StrategicPriorityStrategyAlignments] (
    StrategicPriorityId UNIQUEIDENTIFIER NOT NULL,
    StrategyId UNIQUEIDENTIFIER NOT NULL,
    ExecutionOrder INT,
    ContributionPercentage DECIMAL(5, 2),
    PRIMARY KEY (StrategicPriorityId, StrategyId),
    FOREIGN KEY (StrategicPriorityId) REFERENCES [engagement].[StrategicPriorities](Id),
    FOREIGN KEY (StrategyId) REFERENCES [strategy].[Strategies](Id)
);
```

**REST Endpoints:**
```
GET    /api/strategic-priorities/{engagementId}
POST   /api/strategic-priorities
PUT    /api/strategic-priorities/{id}
POST   /api/strategic-priorities/{id}/alignments (link to Strategy)
PUT    /api/strategic-priorities/{id}/progress
GET    /api/strategic-priorities/{engagementId}/ranking
```

**Validations:**
- Name: 10-256 characters
- Rank: 1-10, unique per engagement per period
- WeightingScore: 0-100; all priorities in period should sum to ~100
- PeriodEnd > PeriodStart
- ExpectedOutcome: measurable, specific
- ProgressPercentage: 0-100
- Status: {Planned, Active, Achieved, Deferred}

**Use Cases:**
1. Executive team defines top 3 priorities for year
2. Each priority is weighted (sum = 100%)
3. Strategy can be aligned to multiple priorities
4. Monthly reviews track progress against priorities
5. Intelligence agent ensures all strategies link to priorities (no orphaned strategies)

---

### Component 6: Business Model Canvas
**Purpose:**  
Holistic view of how value flows. 9 blocks: Partners, Activities, Resources, Proposition, Customer, Channels, Relationships, Revenue, Costs. Answers: "How do we create, deliver, and capture value?"

**Domain Entities:**

```csharp
public class BusinessModelCanvas : AggregateRoot
{
    public Guid ClientOrganizationId { get; set; }
    
    // 9 Blocks (each is a JSON string for flexibility)
    public string KeyPartners { get; set; } // suppliers, partners, alliances
    public string KeyActivities { get; set; } // production, problem-solving, delivery
    public string KeyResources { get; set; } // assets, IP, people, finances
    public string ValueProposition { get; set; } // why customers buy
    public string CustomerSegments { get; set; } // who do we serve?
    public string Channels { get; set; } // how do we reach customers?
    public string CustomerRelationships { get; set; } // how do we engage?
    public string RevenueStreams { get; set; } // pricing, subscription, licensing
    public string CostStructure { get; set; } // fixed, variable, economies
    
    // Analysis
    public string? ForwardHorizon { get; set; } // 1-3 years
    public string? EvolutionPath { get; set; } // how is model evolving?
    public string? RiskFactors { get; set; } // JSON: identified risks
    
    // Engagement Alignment
    public ICollection<BusinessModelCanvasStrategyAlignment> StrategyAlignments { get; set; }
    
    // Versioning
    public int VersionNumber { get; set; }
    public DateTime EffectiveDate { get; set; }
    public string Status { get; set; } = "Draft"; // Draft, Current, Historical
    
    public static BusinessModelCanvas Create(Guid engagementId, Guid clientId)
    {
        return new BusinessModelCanvas
        {
            Id = Guid.NewGuid(),
            EngagementId = engagementId,
            ClientOrganizationId = clientId,
            VersionNumber = 1,
            EffectiveDate = DateTime.UtcNow,
            Status = "Draft",
            CreatedAt = DateTime.UtcNow
        };
    }
}

public class BusinessModelCanvasStrategyAlignment : Entity
{
    public Guid BMCId { get; set; }
    public Guid StrategyId { get; set; }
    public string BMCBlock { get; set; } // which of 9 blocks does strategy impact?
    public string ImpactType { get; set; } // Transform, Optimize, Defend
    public string? Description { get; set; }
}
```

**SQL Schema:**
```sql
CREATE TABLE [engagement].[BusinessModelCanvases] (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    EngagementId UNIQUEIDENTIFIER NOT NULL,
    ClientOrganizationId UNIQUEIDENTIFIER NOT NULL,
    KeyPartners NVARCHAR(MAX) NOT NULL,
    KeyActivities NVARCHAR(MAX) NOT NULL,
    KeyResources NVARCHAR(MAX) NOT NULL,
    ValueProposition NVARCHAR(MAX) NOT NULL,
    CustomerSegments NVARCHAR(MAX) NOT NULL,
    Channels NVARCHAR(MAX) NOT NULL,
    CustomerRelationships NVARCHAR(MAX) NOT NULL,
    RevenueStreams NVARCHAR(MAX) NOT NULL,
    CostStructure NVARCHAR(MAX) NOT NULL,
    ForwardHorizon NVARCHAR(500),
    EvolutionPath NVARCHAR(1000),
    RiskFactors NVARCHAR(MAX), -- JSON
    VersionNumber INT NOT NULL DEFAULT 1,
    EffectiveDate DATETIME2 NOT NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'Draft',
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2,
    FOREIGN KEY (ClientOrganizationId) REFERENCES [engagement].[ClientOrganizations](Id),
    UNIQUE (ClientOrganizationId, VersionNumber),
    INDEX IX_BMC_Engagement (EngagementId)
);

CREATE TABLE [engagement].[BMCStrategyAlignments] (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    EngagementId UNIQUEIDENTIFIER NOT NULL,
    BMCId UNIQUEIDENTIFIER NOT NULL,
    StrategyId UNIQUEIDENTIFIER NOT NULL,
    BMCBlock NVARCHAR(50) NOT NULL, -- KeyPartners, KeyActivities, etc.
    ImpactType NVARCHAR(50) NOT NULL, -- Transform, Optimize, Defend
    Description NVARCHAR(500),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2,
    FOREIGN KEY (BMCId) REFERENCES [engagement].[BusinessModelCanvases](Id),
    FOREIGN KEY (StrategyId) REFERENCES [strategy].[Strategies](Id),
    INDEX IX_BMCAlignment_Canvas (BMCId),
    INDEX IX_BMCAlignment_Strategy (StrategyId)
);
```

**REST Endpoints:**
```
GET    /api/bmc/{engagementId}
POST   /api/bmc
PUT    /api/bmc/{id}
PUT    /api/bmc/{id}/blocks (update individual 9 blocks)
POST   /api/bmc/{id}/alignments (link to Strategy)
GET    /api/bmc/{id}/evolution (version history)
```

**Validations:**
- All 9 blocks required, non-empty
- BMCBlock: one of {KeyPartners, KeyActivities, KeyResources, ValueProposition, CustomerSegments, Channels, CustomerRelationships, RevenueStreams, CostStructure}
- ImpactType: {Transform, Optimize, Defend}
- Status: {Draft, Current, Historical}
- VersionNumber unique per ClientOrganization

**Use Cases:**
1. Consultant facilitates BMC workshop (fill all 9 blocks)
2. Board reviews BMC and discusses evolution
3. Strategy directly impacts one or more BMC blocks (e.g., AI strategy transforms "KeyActivities")
4. Quarterly review: is BMC evolving as expected?
5. Intelligence agent identifies BMC blocks with no strategic support (whitespace analysis)

---

### Component 7: Corporate Documents Repository
**Purpose:**  
Centralized knowledge store. Policies, plans, reports, competitive analysis, market research. Answers: "What documents inform our strategic decisions?"

**Domain Entities:**

```csharp
public class CorporateDocument : AggregateRoot
{
    public Guid ClientOrganizationId { get; set; }
    
    // Metadata
    public string Title { get; set; }
    public string? Description { get; set; }
    public string DocumentType { get; set; } // StrategicPlan, FinancialReport, CompetitiveAnalysis, etc.
    public string? FileName { get; set; }
    public string? FileUrl { get; set; } // S3 or Azure Blob Storage URL
    public long? FileSizeBytes { get; set; }
    
    // Classification
    public string Confidentiality { get; set; } = "Internal"; // Public, Internal, Confidential, Secret
    public ICollection<string> Tags { get; set; } = new List<string>(); // JSON array
    public ICollection<string> RelatedThemes { get; set; } = new List<string>(); // e.g., "Digital Transformation", "Cost Reduction"
    
    // Temporal
    public DateTime DocumentDate { get; set; }
    public DateTime? ExpirationDate { get; set; }
    public string Author { get; set; }
    
    // Strategic Alignment
    public ICollection<DocumentStrategyAlignment> StrategyAlignments { get; set; }
    public ICollection<DocumentObjectiveAlignment> ObjectiveAlignments { get; set; }
    
    // Access Control
    public ICollection<string> AllowedRoles { get; set; } = new List<string>(); // JSON array
    
    // Versioning
    public int VersionNumber { get; set; }
    public bool IsLatestVersion { get; set; }
    public Guid? PreviousVersionId { get; set; }
    
    public static CorporateDocument Create(Guid engagementId, Guid clientId, string title, string docType)
    {
        return new CorporateDocument
        {
            Id = Guid.NewGuid(),
            EngagementId = engagementId,
            ClientOrganizationId = clientId,
            Title = title,
            DocumentType = docType,
            DocumentDate = DateTime.UtcNow,
            Author = "Unknown",
            VersionNumber = 1,
            IsLatestVersion = true,
            CreatedAt = DateTime.UtcNow
        };
    }
}

public class DocumentStrategyAlignment : Entity
{
    public Guid DocumentId { get; set; }
    public Guid StrategyId { get; set; }
    public string AlignmentType { get; set; } // Informs, Supports, Conflicts, Requires
    public string? Notes { get; set; }
}

public class DocumentObjectiveAlignment : Entity
{
    public Guid DocumentId { get; set; }
    public Guid ObjectiveId { get; set; }
    public string AlignmentType { get; set; } // Baseline, Target, Evidence
    public string? Notes { get; set; }
}
```

**SQL Schema:**
```sql
CREATE TABLE [engagement].[CorporateDocuments] (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    EngagementId UNIQUEIDENTIFIER NOT NULL,
    ClientOrganizationId UNIQUEIDENTIFIER NOT NULL,
    Title NVARCHAR(512) NOT NULL,
    Description NVARCHAR(2000),
    DocumentType NVARCHAR(128) NOT NULL,
    FileName NVARCHAR(256),
    FileUrl NVARCHAR(2048),
    FileSizeBytes BIGINT,
    Confidentiality NVARCHAR(50) NOT NULL DEFAULT 'Internal',
    Tags NVARCHAR(MAX), -- JSON array
    RelatedThemes NVARCHAR(MAX), -- JSON array
    DocumentDate DATETIME2 NOT NULL,
    ExpirationDate DATETIME2,
    Author NVARCHAR(256) NOT NULL,
    AllowedRoles NVARCHAR(MAX), -- JSON array
    VersionNumber INT NOT NULL DEFAULT 1,
    IsLatestVersion BIT NOT NULL DEFAULT 1,
    PreviousVersionId UNIQUEIDENTIFIER,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2,
    FOREIGN KEY (ClientOrganizationId) REFERENCES [engagement].[ClientOrganizations](Id),
    FOREIGN KEY (PreviousVersionId) REFERENCES [engagement].[CorporateDocuments](Id),
    INDEX IX_Documents_Type (DocumentType),
    INDEX IX_Documents_Engagement (EngagementId),
    INDEX IX_Documents_Latest (IsLatestVersion, ClientOrganizationId)
);

CREATE TABLE [engagement].[DocumentStrategyAlignments] (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    EngagementId UNIQUEIDENTIFIER NOT NULL,
    DocumentId UNIQUEIDENTIFIER NOT NULL,
    StrategyId UNIQUEIDENTIFIER NOT NULL,
    AlignmentType NVARCHAR(50) NOT NULL, -- Informs, Supports, Conflicts, Requires
    Notes NVARCHAR(500),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2,
    FOREIGN KEY (DocumentId) REFERENCES [engagement].[CorporateDocuments](Id),
    FOREIGN KEY (StrategyId) REFERENCES [strategy].[Strategies](Id),
    INDEX IX_DocStrategy_Document (DocumentId)
);

CREATE TABLE [engagement].[DocumentObjectiveAlignments] (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    EngagementId UNIQUEIDENTIFIER NOT NULL,
    DocumentId UNIQUEIDENTIFIER NOT NULL,
    ObjectiveId UNIQUEIDENTIFIER NOT NULL,
    AlignmentType NVARCHAR(50) NOT NULL, -- Baseline, Target, Evidence
    Notes NVARCHAR(500),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2,
    FOREIGN KEY (DocumentId) REFERENCES [engagement].[CorporateDocuments](Id),
    FOREIGN KEY (ObjectiveId) REFERENCES [strategy].[Objectives](Id),
    INDEX IX_DocObjective_Document (DocumentId)
);
```

**REST Endpoints:**
```
GET    /api/documents/{engagementId}
POST   /api/documents (with file upload)
PUT    /api/documents/{id}
DELETE /api/documents/{id}
GET    /api/documents/{id}/download
POST   /api/documents/{id}/align-strategy
POST   /api/documents/{id}/align-objective
GET    /api/documents/{engagementId}/by-type
GET    /api/documents/{engagementId}/search?q=...
POST   /api/documents/{id}/version
GET    /api/documents/{id}/versions
```

**Validations:**
- Title: 10-512 characters
- DocumentType: {StrategicPlan, FinancialReport, CompetitiveAnalysis, PolicyDocument, BusinessCase, ExecutiveSummary, ResearchReport, Other}
- Confidentiality: {Public, Internal, Confidential, Secret}
- Author: non-empty email/name
- DocumentDate: valid date, not future
- ExpirationDate: null or > DocumentDate
- AlignmentType (Strategy): {Informs, Supports, Conflicts, Requires}
- AlignmentType (Objective): {Baseline, Target, Evidence}

**Use Cases:**
1. Consultant uploads strategic plan PDF and tags it "StrategicPlan"
2. System auto-extracts KPIs from document and suggests Objective alignment
3. Stakeholder searches docs by theme: "Digital Transformation"
4. Intelligence agent analyzes all docs to identify strategy gaps
5. Quarterly report: which docs were most cited in strategic decisions?
6. Access control: hide "Secret" docs from junior stakeholders

---

### Component 8: Strategy Intelligence Agent
**Purpose:**  
AI/LLM-powered agent that synthesizes all Workspace 1 data. Generates insights, identifies inconsistencies, recommends priorities, simulates scenarios. Answers: "What do all our strategic documents and data tell us?"

**Domain Entities:**

```csharp
public class AgentSession : AggregateRoot
{
    public Guid ClientOrganizationId { get; set; }
    
    // Session Context
    public string SessionType { get; set; } // "StrategySynthesis", "GapAnalysis", "ConflictDetection", "ScenarioSimulation"
    public string Status { get; set; } = "Active"; // Active, Completed, Error, Archived
    public DateTime SessionStartTime { get; set; }
    public DateTime? SessionEndTime { get; set; }
    
    // Input
    public string? InitialPrompt { get; set; } // User's question/request
    public ICollection<AgentQuery> Queries { get; set; }
    
    // Output
    public ICollection<AgentInsight> Insights { get; set; }
    public ICollection<AgentRecommendation> Recommendations { get; set; }
    
    // Audit
    public string ExecutedBy { get; set; } // user email
    public string? LLMModel { get; set; } // "GPT-4", "Claude-3", etc.
    public decimal? CostUSD { get; set; }
    
    public static AgentSession Create(Guid engagementId, Guid clientId, string sessionType)
    {
        return new AgentSession
        {
            Id = Guid.NewGuid(),
            EngagementId = engagementId,
            ClientOrganizationId = clientId,
            SessionType = sessionType,
            Status = "Active",
            SessionStartTime = DateTime.UtcNow,
            ExecutedBy = "system@aetp.com",
            CreatedAt = DateTime.UtcNow
        };
    }
}

public class AgentQuery : Entity
{
    public Guid AgentSessionId { get; set; }
    public string Query { get; set; } // e.g., "Is our strategy aligned to mission?"
    public string DataSources { get; set; } // JSON: which tables/entities queried
    public string ResponseSummary { get; set; }
    public int? ConfidenceScore { get; set; } // 0-100
    public DateTime ExecutedAt { get; set; }
    
    public static AgentQuery Create(Guid engagementId, Guid sessionId, string query)
    {
        return new AgentQuery
        {
            Id = Guid.NewGuid(),
            EngagementId = engagementId,
            AgentSessionId = sessionId,
            Query = query,
            ExecutedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
    }
}

public class AgentInsight : Entity
{
    public Guid AgentSessionId { get; set; }
    public string Category { get; set; } // "Alignment", "Gap", "Risk", "Opportunity", "Conflict"
    public string Title { get; set; }
    public string Description { get; set; }
    public int? SeverityScore { get; set; } // 1-10: how important?
    public ICollection<string> AffectedEntities { get; set; } = new List<string>(); // JSON: Strategy IDs, Objective IDs, etc.
    public bool IsActionable { get; set; }
    
    public static AgentInsight Create(Guid engagementId, Guid sessionId, string category, string title)
    {
        return new AgentInsight
        {
            Id = Guid.NewGuid(),
            EngagementId = engagementId,
            AgentSessionId = sessionId,
            Category = category,
            Title = title,
            CreatedAt = DateTime.UtcNow
        };
    }
}

public class AgentRecommendation : Entity
{
    public Guid AgentSessionId { get; set; }
    public string RecommendationType { get; set; } // "Priority", "NewStrategy", "DocumentNeeded", "RiskMitigation"
    public string Title { get; set; }
    public string Description { get; set; }
    public int? UrgencyScore { get; set; } // 1-10: how urgent?
    public decimal? EstimatedEffort { get; set; } // in person-days
    public string? ImplementationPath { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Approved, InProgress, Completed
    
    public static AgentRecommendation Create(Guid engagementId, Guid sessionId, string type, string title)
    {
        return new AgentRecommendation
        {
            Id = Guid.NewGuid(),
            EngagementId = engagementId,
            AgentSessionId = sessionId,
            RecommendationType = type,
            Title = title,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };
    }
}
```

**SQL Schema:**
```sql
CREATE TABLE [engagement].[AgentSessions] (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    EngagementId UNIQUEIDENTIFIER NOT NULL,
    ClientOrganizationId UNIQUEIDENTIFIER NOT NULL,
    SessionType NVARCHAR(128) NOT NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'Active',
    SessionStartTime DATETIME2 NOT NULL,
    SessionEndTime DATETIME2,
    InitialPrompt NVARCHAR(MAX),
    ExecutedBy NVARCHAR(256) NOT NULL,
    LLMModel NVARCHAR(128),
    CostUSD DECIMAL(10, 4),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2,
    FOREIGN KEY (ClientOrganizationId) REFERENCES [engagement].[ClientOrganizations](Id),
    INDEX IX_AgentSessions_Engagement (EngagementId),
    INDEX IX_AgentSessions_Type (SessionType)
);

CREATE TABLE [engagement].[AgentQueries] (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    EngagementId UNIQUEIDENTIFIER NOT NULL,
    AgentSessionId UNIQUEIDENTIFIER NOT NULL,
    Query NVARCHAR(1000) NOT NULL,
    DataSources NVARCHAR(MAX), -- JSON
    ResponseSummary NVARCHAR(MAX),
    ConfidenceScore INT CHECK (ConfidenceScore >= 0 AND ConfidenceScore <= 100),
    ExecutedAt DATETIME2 NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2,
    FOREIGN KEY (AgentSessionId) REFERENCES [engagement].[AgentSessions](Id),
    INDEX IX_AgentQueries_Session (AgentSessionId)
);

CREATE TABLE [engagement].[AgentInsights] (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    EngagementId UNIQUEIDENTIFIER NOT NULL,
    AgentSessionId UNIQUEIDENTIFIER NOT NULL,
    Category NVARCHAR(50) NOT NULL, -- Alignment, Gap, Risk, Opportunity, Conflict
    Title NVARCHAR(512) NOT NULL,
    Description NVARCHAR(MAX),
    SeverityScore INT CHECK (SeverityScore >= 1 AND SeverityScore <= 10),
    AffectedEntities NVARCHAR(MAX), -- JSON array of IDs
    IsActionable BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2,
    FOREIGN KEY (AgentSessionId) REFERENCES [engagement].[AgentSessions](Id),
    INDEX IX_AgentInsights_Session (AgentSessionId),
    INDEX IX_AgentInsights_Category (Category)
);

CREATE TABLE [engagement].[AgentRecommendations] (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    EngagementId UNIQUEIDENTIFIER NOT NULL,
    AgentSessionId UNIQUEIDENTIFIER NOT NULL,
    RecommendationType NVARCHAR(128) NOT NULL,
    Title NVARCHAR(512) NOT NULL,
    Description NVARCHAR(MAX),
    UrgencyScore INT CHECK (UrgencyScore >= 1 AND UrgencyScore <= 10),
    EstimatedEffort DECIMAL(8, 2), -- person-days
    ImplementationPath NVARCHAR(MAX),
    Status NVARCHAR(50) NOT NULL DEFAULT 'Pending',
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2,
    FOREIGN KEY (AgentSessionId) REFERENCES [engagement].[AgentSessions](Id),
    INDEX IX_AgentRecommendations_Session (AgentSessionId),
    INDEX IX_AgentRecommendations_Status (Status)
);
```

**REST Endpoints:**
```
POST   /api/agent/session (start new session)
GET    /api/agent/session/{sessionId}
POST   /api/agent/session/{sessionId}/query (submit query to agent)
GET    /api/agent/session/{sessionId}/insights
GET    /api/agent/session/{sessionId}/recommendations
PUT    /api/agent/recommendations/{id}/status (approve/reject recommendation)
GET    /api/agent/history/{engagementId} (list all sessions)
POST   /api/agent/session/{sessionId}/complete
```

**Validations:**
- SessionType: {StrategySynthesis, GapAnalysis, ConflictDetection, ScenarioSimulation, StrategicReview}
- Status: {Active, Completed, Error, Archived}
- ConfidenceScore: 0-100
- SeverityScore, UrgencyScore: 1-10
- EstimatedEffort: 0-500 (person-days)
- Category: {Alignment, Gap, Risk, Opportunity, Conflict}
- RecommendationType: {Priority, NewStrategy, DocumentNeeded, RiskMitigation, ProcessImprovement}

**Use Cases:**
1. Consultant asks: "Is our strategy aligned to mission?" → Agent queries Mission, Strategy, Strategic Priority tables → generates alignment report
2. Monthly strategy review: agent analyzes progress vs. objectives and KPIs, flags risks
3. "What gaps exist in our competitive advantage?" → agent cross-references Competitive Advantage, Strategy, BMC
4. "Which documents conflict?" → agent analyzes DocumentStrategyAlignments with type "Conflicts"
5. Scenario simulation: "What if we deprioritize Cloud? What breaks?" → agent simulates impact

---

## Part III: Complete Data Model (Entity Relationship Diagram)

```
Legend:
  -- = 1:N relationship
  <-> = M:N relationship
  
ClientOrganization (tenant root)
  |-- CompanyProfile (1:1)
  |   |-- Department (1:N)
  |   |-- Location (1:N)
  |
  |-- Mission (1:1)
  |   <-> Strategy (M:N via MissionStrategyAlignments)
  |
  |-- Vision (1:1)
  |   |-- VisionMetric (1:N)
  |   <-> Strategy (M:N via VisionStrategyAlignments)
  |
  |-- CompetitiveAdvantage (1:N)
  |   <-> Strategy (M:N via CompetitiveAdvantageStrategyAlignments)
  |
  |-- StrategicPriority (1:N)
  |   <-> Strategy (M:N via StrategicPriorityStrategyAlignments)
  |
  |-- BusinessModelCanvas (1:1 or 1:N versioned)
  |   <-> Strategy (M:N via BMCStrategyAlignments)
  |
  |-- CorporateDocument (1:N)
  |   <-> Strategy (M:N via DocumentStrategyAlignments)
  |   <-> Objective (M:N via DocumentObjectiveAlignments)
  |
  |-- Engagement (1:N, scoping entity)
  |   |-- Stakeholder (1:N)
  |   |-- Strategy (1:N aggregate roots)
  |   |   |-- Objective (1:N)
  |   |   |   |-- KPI (1:N)
  |   |   |-- StrategicPriority (via alignment)
  |   |-- AgentSession (1:N)
  |   |   |-- AgentQuery (1:N)
  |   |   |-- AgentInsight (1:N)
  |   |   |-- AgentRecommendation (1:N)
```

---

## Part IV: SQL Schema Summary (All Tables)

**[engagement] schema (8 tables + 6 junction/alignment tables):**

1. `ClientOrganizations` (existing)
2. `Engagements` (existing)
3. `Stakeholders` (existing)
4. `CompanyProfiles` (NEW)
5. `Departments` (NEW)
6. `Locations` (NEW)
7. `Missions` (NEW)
8. `MissionStrategyAlignments` (junction)
9. `Visions` (NEW)
10. `VisionMetrics` (NEW)
11. `VisionStrategyAlignments` (junction)
12. `CompetitiveAdvantages` (NEW)
13. `CompetitiveAdvantageStrategyAlignments` (junction)
14. `StrategicPriorities` (NEW)
15. `StrategicPriorityStrategyAlignments` (junction)
16. `BusinessModelCanvases` (NEW)
17. `BMCStrategyAlignments` (junction)
18. `CorporateDocuments` (NEW)
19. `DocumentStrategyAlignments` (junction)
20. `DocumentObjectiveAlignments` (junction)
21. `AgentSessions` (NEW)
22. `AgentQueries` (NEW)
23. `AgentInsights` (NEW)
24. `AgentRecommendations` (NEW)

**[strategy] schema (existing):**

1. `Strategies` (existing)
2. `Objectives` (existing)
3. `KPIs` (existing)

---

## Part V: Traceability Matrix (Strategy Impact Analysis)

Every strategic element traces back to **why** and **what measurable outcome**:

| Element | Traces To | Traces To | Traces To | Traces To | Outcome |
|---------|-----------|-----------|-----------|-----------|---------|
| **KPI** | **Objective** | **Strategy** | **StrategicPriority** | **Vision** | Measures progress toward aspirational future |
| **KPI** | **Objective** | **Strategy** | **Mission** | — | Operationalizes "why we exist" |
| **KPI** | **Objective** | **Strategy** | **CompetitiveAdvantage** | — | Protects/amplifies core differentiator |
| **KPI** | **Objective** | **Strategy** | **BMC (block)** | — | Transforms value delivery |
| **Objective** | **Strategy** | **StrategicPriority** | **Rank 1-3** | — | Focuses execution on top 3-5 priorities |
| **Strategy** | **VisionMetric** | **Vision** | — | — | Contributes to 3-5 year aspirational goal |
| **Strategy** | **CorporateDocument** | — | — | — | Informed by research/competitive analysis |

**Example Full Trace:**
```
KPI: "AI Product Revenue = $50M by EOY"
  └─ Objective: "Launch 3 AI-powered products"
      └─ Strategy: "AI-First Technology Platform"
          ├─ StrategicPriority: "AI Innovation (Rank 1)"
          ├─ Vision: "Become AI-driven enterprise"
          ├─ VisionMetric: "Revenue from AI = 40% of total"
          ├─ CompetitiveAdvantage: "Patent-backed AI models"
          ├─ BMC Impact: Transforms "KeyActivities" and "ValueProposition"
          └─ CorporateDocuments: "AI Investment Plan v2", "Competitive AI Landscape 2026"
```

---

## Part VI: REST API Summary (Complete Workspace 1)

### Authentication & Tenancy
```
All requests include:
  Authorization: Bearer {token}
  X-Engagement-Id: {engagementId}  (implicit tenant partition)
```

### Company Profile
```
GET    /api/company-profile/{engagementId}
POST   /api/company-profile
PUT    /api/company-profile/{id}
DELETE /api/company-profile/{id}
GET    /api/company-profile/{profileId}/departments
POST   /api/company-profile/{profileId}/departments
PUT    /api/departments/{id}
GET    /api/company-profile/{profileId}/locations
POST   /api/company-profile/{profileId}/locations
PUT    /api/locations/{id}
```

### Mission
```
GET    /api/mission/{engagementId}
POST   /api/mission
PUT    /api/mission/{id}
GET    /api/mission/{id}/versions
POST   /api/mission/{id}/alignments
```

### Vision
```
GET    /api/vision/{engagementId}
POST   /api/vision
PUT    /api/vision/{id}
GET    /api/vision/{id}/metrics
POST   /api/vision/{visionId}/metrics
PUT    /api/vision/metrics/{id}
POST   /api/vision/{id}/alignments
```

### Competitive Advantage
```
GET    /api/competitive-advantage/{engagementId}
POST   /api/competitive-advantage
PUT    /api/competitive-advantage/{id}
POST   /api/competitive-advantage/{id}/alignments
GET    /api/competitive-advantage/{id}/threat-analysis
```

### Strategic Priorities
```
GET    /api/strategic-priorities/{engagementId}
POST   /api/strategic-priorities
PUT    /api/strategic-priorities/{id}
POST   /api/strategic-priorities/{id}/alignments
PUT    /api/strategic-priorities/{id}/progress
GET    /api/strategic-priorities/{engagementId}/ranking
```

### Business Model Canvas
```
GET    /api/bmc/{engagementId}
POST   /api/bmc
PUT    /api/bmc/{id}
PUT    /api/bmc/{id}/blocks
POST   /api/bmc/{id}/alignments
GET    /api/bmc/{id}/evolution
```

### Corporate Documents
```
GET    /api/documents/{engagementId}
POST   /api/documents (multipart file upload)
PUT    /api/documents/{id}
DELETE /api/documents/{id}
GET    /api/documents/{id}/download
POST   /api/documents/{id}/align-strategy
POST   /api/documents/{id}/align-objective
GET    /api/documents/{engagementId}/by-type
GET    /api/documents/{engagementId}/search?q=...
POST   /api/documents/{id}/version
GET    /api/documents/{id}/versions
```

### Strategy Intelligence Agent
```
POST   /api/agent/session
GET    /api/agent/session/{sessionId}
POST   /api/agent/session/{sessionId}/query
GET    /api/agent/session/{sessionId}/insights
GET    /api/agent/session/{sessionId}/recommendations
PUT    /api/agent/recommendations/{id}/status
GET    /api/agent/history/{engagementId}
POST   /api/agent/session/{sessionId}/complete
```

### Existing (from earlier implementation)
```
GET    /api/clientengagements/clients
POST   /api/clientengagements/clients
GET    /api/clientengagements/engagements
POST   /api/clientengagements/engagements
GET    /api/strategies?engagementId=...
POST   /api/strategies
```

---

## Part VII: Key Business Rules & Validation Matrix

| Rule | Table | Validation | Consequence |
|------|-------|-----------|-------------|
| Every Strategy must align to Mission | MissionStrategyAlignments | StrategyId FK not null | Cannot save Strategy without Mission link |
| Every Strategy must align to at least 1 Vision | VisionStrategyAlignments | Count(StrategyId) >= 1 | "Orphaned strategy" warning |
| Every Strategy must support ≥1 StrategicPriority | StrategicPriorityStrategyAlignments | Count(StrategyId) >= 1 | "Whitespace strategy" flag |
| Every Objective traces to Strategy | [strategy].[Objectives].StrategyId | FK not null | Cannot create Object without parent Strategy |
| Every KPI traces to Objective | [strategy].[KPIs].ObjectiveId | FK not null | Cannot create KPI without parent Objective |
| CompetitiveAdvantage must have DurationYears ≤ 10 | [engagement].[CompetitiveAdvantages] | DurationYears <= 10 | "Unsustainable advantage" warning |
| Vision TargetDate must be future | [engagement].[Visions] | TargetDate > NOW | Invalid future vision error |
| StrategicPriorities Rank 1-3 required | [engagement].[StrategicPriorities] | Rank in (1,2,3) | "Not a priority" filter |
| BMC all 9 blocks must be filled | [engagement].[BusinessModelCanvases] | All cols non-null | Cannot mark BMC "Current" until all blocks complete |
| Documents tagged must have ≥1 RelatedTheme | [engagement].[CorporateDocuments] | Count(RelatedThemes) >= 1 | "Untagged document" warning |
| AgentRecommendation Status transition rules | [engagement].[AgentRecommendations] | Status in (Pending→Approved→InProgress→Completed) | Cannot skip Approved phase |

---

## Part VIII: Sample Workflows (Workspace 1)

### Workflow 1: Strategy Inception (Weeks 1-2)
```
1. Consultant uploads CompanyProfile (organization chart, financials)
2. Client provides Mission statement ("Why we exist")
3. Client articulates Vision statement + 3-5 VisionMetrics ("Where in 3-5 years")
4. Workshop: Identify 3-5 StrategicPriorities + weight (e.g., Digital 40%, AI 35%, Cost 25%)
5. Competitive analysis: Document 3-5 CompetitiveAdvantages + defensibility scores
6. First Strategy created, aligned to Mission + Priorities + CompetitiveAdvantage
7. Intelligence Agent analyzes: "All elements aligned? Recommendations?"
```

### Workflow 2: Strategy Development (Weeks 3-4)
```
1. Strategy decomposed into 5-10 Objectives
2. Each Objective aligned to VisionMetric or StrategicPriority
3. For each Objective: 2-3 KPIs created with baseline/target
4. Documents (research, competitive analysis) tagged + aligned to Strategy/Objective
5. Business Model Canvas filled: 9 blocks + annotated with Strategy impact
6. Agent query: "Where are the gaps? What's missing?"
7. Stakeholder review + approval
```

### Workflow 3: Ongoing Monitoring (Monthly/Quarterly)
```
1. Update KPI actuals for each Objective
2. Agent query: "Are we on track?"
3. If KPI trending down: review underlying Objective/Strategy
4. Quarterly: Review StrategicPriority progress + rank adjustments
5. Annual: New Competitive Advantage assessment
6. Agent generates quarterly "Strategy Health Report"
```

### Workflow 4: Strategy Evolution
```
1. Market shift detected (e.g., competitive threat)
2. CompetitiveAdvantage defensibility score drops
3. New CorporateDocument uploaded (market research)
4. Agent query: "Should we pivot our strategy?"
5. New Strategy version created (or new Strategy)
6. VisionMetric targets adjusted if needed
7. Objectives updated, KPIs recalibrated
```

---

## Part IX: Validation Rules (Detailed)

### Across-Entity Rules

1. **Mission-Strategy Consistency**
   - If Mission changes, alert all linked Strategies
   - If Strategy added, must select ≥1 aligned Mission pillar
   
2. **Vision-Objective Alignment**
   - Every Objective must contribute to ≥1 VisionMetric
   - If VisionMetric target changes significantly (+/- 20%), review affected Objectives
   
3. **Priority-Strategy Linkage**
   - Top 3 StrategicPriorities must have ≥1 Strategy each
   - No Strategy can claim to be "top priority" unless ranked in top 3
   
4. **Competitive Advantage Protection**
   - If Strategy does NOT protect/amplify ≥1 CompetitiveAdvantage, flag as "low strategic value"
   
5. **BMC Consistency**
   - If ValueProposition changes, alert all linked Strategies
   - If RevenueStreams change, review KPIs in Financial objectives
   
6. **Document Traceability**
   - Every CorporateDocument must link to ≥1 Strategy or Objective
   - Orphaned documents trigger "unused knowledge" warning

---

## Part X: Workspace 1 Completion Checklist

**Before proceeding to Assessment (Workspace 2), ALL of the following must be complete:**

### Data Capture
- [ ] CompanyProfile filled (company fundamentals, maturity scores)
- [ ] Mission statement approved and versioned
- [ ] Vision statement + 3-5 VisionMetrics defined
- [ ] 3-5 CompetitiveAdvantages identified + scored
- [ ] 3-5 StrategicPriorities ranked + weighted
- [ ] Business Model Canvas completed (all 9 blocks)
- [ ] ≥3 key CorporateDocuments uploaded + tagged
- [ ] Stakeholders defined and roles assigned

### Strategy Foundation
- [ ] ≥1 Strategy defined (linked to Mission, Vision, Priorities, Competitive Advantage)
- [ ] ≥5 Objectives created (each traces to ≥1 Strategy + VisionMetric)
- [ ] ≥2 KPIs per Objective (baseline + target established)
- [ ] Documents aligned to Strategy/Objective
- [ ] BMC blocks annotated with Strategy impact

### Validation & Intelligence
- [ ] Agent session run: "Is strategy aligned to mission/vision/priorities?"
- [ ] All conflicts/gaps documented
- [ ] Recommendations reviewed + approved/deferred
- [ ] Traceability verified: KPI → Objective → Strategy → StrategicPriority → Vision
- [ ] No "orphaned" elements (every element has business rationale)

### Stakeholder Sign-Off
- [ ] Strategy document approved by leadership
- [ ] Objectives + KPIs accepted
- [ ] Risk/Gap list acknowledged
- [ ] Engagement status = "Strategy Validated"

---

## Part XI: Implementation Roadmap (Phased Delivery)

### Phase 1: Domain Entities (Weeks 1-2)
- Create all 14 domain entity classes
- Add factory methods and validators
- Create DbContext mappings for [engagement] schema

### Phase 2: Database & Migrations (Week 2)
- EF Core migrations: create-migrations.ps1
- Apply to businessagenticdb: run-migrations.ps1
- Verify tables + relationships in SQL

### Phase 3: REST API Controllers (Weeks 3-4)
- CompanyProfileController
- MissionController
- VisionController
- CompetitiveAdvantageController
- StrategicPriorityController
- BusinessModelCanvasController
- CorporateDocumentController (with file upload)
- AgentController (stubs for now; full LLM integration in Phase 5)

### Phase 4: Application Layer (Weeks 5-6)
- FluentValidation validators for each domain entity
- MediatR Commands/Queries/Handlers (CQRS)
- AutoMapper DTOs

### Phase 5: Frontend (Weeks 7-9)
- React pages: CompanyProfile, Mission, Vision, Strategy, etc.
- Forms for data entry + upload
- Dashboards showing traceability + alignment
- Agent chat interface

### Phase 6: Intelligence Agent (Week 10+)
- LLM integration (OpenAI/Claude)
- Agent session endpoints
- Insight generation (alignment checks, gap analysis)
- Recommendation engine

---

## Conclusion

**Workspace 1 is now a complete Enterprise Knowledge Base** with:
- ✅ 14 domain entities (6 existing + 8 new)
- ✅ 24+ SQL tables with full relationships
- ✅ 50+ REST endpoints
- ✅ Complete traceability from KPI → Vision
- ✅ AI-powered intelligence agent

**No Assessment, Gap Analysis, Capability Mapping, or Process Design needed until Workspace 1 is 100% complete.**

Next Step: Convert this blueprint into code (domain entities, DbContext, controllers, validators, frontend).

---

**Blueprint Version:** 1.0  
**Date:** 2026-07-20  
**Status:** Ready for Implementation  
