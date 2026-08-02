using AETP.BuildingBlocks.Domain;

namespace AETP.Modules.ClientEngagement.Domain
{
    /// <summary>
    /// Represents a client organization (multi-tenant root).
    /// </summary>
    public class ClientOrganization : AggregateRoot
    {
        public string Name { get; set; } = string.Empty;
        public string? Industry { get; set; }
        public string? Country { get; set; }
        public int? EmployeeCount { get; set; }
        public string Status { get; set; } = "Active"; // Active, Inactive, Prospect

        public ICollection<Engagement> Engagements { get; set; } = new List<Engagement>();

        public ClientOrganization() : base() { }

        public static ClientOrganization Create(string name, string? industry = null, string? country = null)
        {
            return new ClientOrganization
            {
                Id = Guid.NewGuid(),
                EngagementId = Guid.Empty, // Client is parent of Engagement
                Name = name,
                Industry = industry,
                Country = country,
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            };
        }
    }

    /// <summary>
    /// Represents a specific consulting engagement with a client.
    /// All other domain models are scoped to an Engagement (via EngagementId).
    /// Captures transformation mandate, business context, and strategic decisions.
    /// </summary>
    public class Engagement : AggregateRoot
    {
        public Guid ClientOrganizationId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string Status { get; set; } = "Planning"; // Planning, Active, Completed, On-Hold
        public decimal? Budget { get; set; }

        // Transformation Context
        public string? TransformationMandate { get; set; } // Why the transformation started
        public string? BusinessProblem { get; set; } // What problem we're solving
        public string? ExpectedDecision { get; set; } // Decision expected from engagement
        public string? ExecutiveSponsor { get; set; } // Executive sponsor name/role
        public DateTime? TargetDecisionDate { get; set; } // When decision is needed
        
        // Scope Definition
        public string? Scope { get; set; } // What's included
        public string? OutOfScope { get; set; } // What's explicitly excluded
        public string? SponsorResponsibilities { get; set; } // Sponsor key responsibilities
        public string? ExpectedOutcomes { get; set; } // Expected outcomes / deliverables
        public string? SuccessCriteria { get; set; } // Success criteria
        public int? HorizonMinMonths { get; set; } // Roadmap min horizon
        public int? HorizonMaxMonths { get; set; } // Roadmap max horizon
        public decimal? RevenueGrowthTargetPct { get; set; } // Revenue growth target percentage
        public decimal? CostReductionTargetPct { get; set; } // Cost reduction target percentage
        public decimal? ProductivityImprovementTargetPct { get; set; } // Productivity improvement target percentage
        public decimal? SlaImprovementTargetPct { get; set; } // SLA improvement target percentage
        public string? StrategyTitle { get; set; }
        public string? StrategyCompanyName { get; set; }
        public string? StrategySector { get; set; }
        public string? StrategyDirectionGeneral { get; set; }
        public string? MissionStatement { get; set; } // Current business mission
        public string? VisionStatement { get; set; } // Target vision
        public string? VisionObjetivo { get; set; }
        public decimal? AutoTargetAtencionClientePct { get; set; }
        public decimal? AutoTargetFinanzasPct { get; set; }
        public decimal? AutoTargetRecursosHumanosPct { get; set; }
        public decimal? AutoTargetMarketingPct { get; set; }
        public decimal? AutoTargetVentasPct { get; set; }
        public decimal? AutoTargetOperacionesPct { get; set; }
        public decimal? AutoTargetAnaliticaReportesPct { get; set; }
        public string? TransformationPrinciples { get; set; } // Newline-separated principles
        public string? StrategicFinalDeclaration { get; set; }

        public ClientOrganization? ClientOrganization { get; set; }
        public ICollection<Stakeholder> Stakeholders { get; set; } = new List<Stakeholder>();
        public ICollection<MandateStakeholder> MandateStakeholders { get; set; } = new List<MandateStakeholder>();
        public ICollection<StrategicListItem> StrategicListItems { get; set; } = new List<StrategicListItem>();

        public Engagement() : base() { }

        public static Engagement Create(
            Guid clientId, 
            string name, 
            string? description = null,
            string? transformationMandate = null,
            string? businessProblem = null)
        {
            var engagementId = Guid.NewGuid();
            return new Engagement
            {
                Id = engagementId,
                EngagementId = engagementId,
                ClientOrganizationId = clientId,
                Name = name,
                Description = description,
                TransformationMandate = transformationMandate,
                BusinessProblem = businessProblem,
                StartDate = DateTime.UtcNow,
                Status = "Planning",
                CreatedAt = DateTime.UtcNow
            };
        }
    }

    /// <summary>
    /// Represents list-based structured strategy items grouped by category.
    /// </summary>
    public class StrategicListItem : Entity
    {
        public Guid EngagementId { get; set; }
        public string Category { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }

        public StrategicListItem() : base() { }

        public static StrategicListItem Create(Guid engagementId, string category, string value, int displayOrder)
        {
            return new StrategicListItem
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                Category = category,
                Value = value,
                DisplayOrder = displayOrder,
                CreatedAt = DateTime.UtcNow,
            };
        }
    }

    /// <summary>
    /// Represents a stakeholder participating in engagement mandate definition.
    /// Kept separate from Org Design stakeholders to avoid mixing concerns.
    /// </summary>
    public class MandateStakeholder : Entity
    {
        public Guid EngagementId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;

        public MandateStakeholder() : base() { }

        public static MandateStakeholder Create(Guid engagementId, string name, string role)
        {
            return new MandateStakeholder
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                Name = name,
                Role = role,
                CreatedAt = DateTime.UtcNow,
            };
        }
    }

    /// <summary>
    /// Represents a stakeholder involved in an engagement.
    /// </summary>
    public class Stakeholder : Entity
    {
        public Guid EngagementId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Role { get; set; } // Sponsor, Lead Consultor, etc.
        public string Status { get; set; } = "Active"; // Active, Inactive

        // Org Design (org-chart) fields — populated either manually or by the
        // org-chart image extraction agent. Kept optional so this entity still
        // works for the original "engagement team stakeholder" use case.
        public string? Position { get; set; } // Puesto
        public string? HierarchyLevel { get; set; } // Nivel jerárquico (Ejecutivo, Director, Gerente, ...)
        public string? ReportsTo { get; set; } // Reporta a (nombre del rol/persona superior)
        public string? ReplicaTo { get; set; } // Réplica a
        public string? Responsibilities { get; set; } // Responsabilidades principales

        public Stakeholder() : base() { }

        public static Stakeholder Create(Guid engagementId, string name, string email, string? role = null)
        {
            return new Stakeholder
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                Name = name,
                Email = email,
                Role = role,
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            };
        }

        // Creates a Stakeholder from an Org Design role (manually entered or
        // extracted by the org-chart AI agent). Email isn't captured by Org
        // Design, so it's left blank.
        public static Stakeholder CreateFromOrgRole(
            Guid engagementId,
            string name,
            string? position,
            string? hierarchyLevel,
            string? reportsTo,
            string? replicaTo,
            string? responsibilities)
        {
            return new Stakeholder
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                Name = name,
                Email = string.Empty,
                Position = position,
                HierarchyLevel = hierarchyLevel,
                ReportsTo = reportsTo,
                ReplicaTo = replicaTo,
                Responsibilities = responsibilities,
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            };
        }
    }
}
