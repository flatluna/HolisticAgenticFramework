using AETP.BuildingBlocks.Domain;

namespace AETP.Modules.Strategy.Domain
{
    /// <summary>
    /// Represents a business strategy scoped to an engagement.
    /// </summary>
    public class Strategy : AggregateRoot
    {
        public string Name { get; set; } = string.Empty;
        public string? Vision { get; set; }
        public string? CompetitiveAdvantage { get; set; }
        public string Status { get; set; } = "Draft"; // Draft, Validated, Active, Superseded
        public int TimeHorizonMonths { get; set; } = 12;

        public ICollection<Objective> Objectives { get; set; } = new List<Objective>();

        public Strategy() : base() { }

        public static Strategy Create(Guid engagementId, string name, string? vision = null)
        {
            return new Strategy
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                Name = name,
                Vision = vision,
                Status = "Draft",
                CreatedAt = DateTime.UtcNow
            };
        }
    }

    /// <summary>
    /// Represents a measurable objective derived from a strategy.
    /// Captures business value category, ownership, and strategic rationale.
    /// </summary>
    public class Objective : Entity
    {
        public Guid StrategyId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Status { get; set; } = "Draft"; // Draft, Approved, Active, Achieved, Retired
        public int? TargetValue { get; set; }
        public DateTime? TargetDate { get; set; }

        // Business Context
        public string? BusinessValueCategory { get; set; } // Growth, Profitability, CostReduction, Efficiency, Productivity, CustomerExperience, RiskCompliance, Speed, Quality, ManagementControl, Innovation
        public string? Owner { get; set; } // Who owns this objective
        public int Priority { get; set; } = 3; // 1=Critical, 2=High, 3=Medium, 4=Low
        public string? Rationale { get; set; } // Why this objective matters

        public Strategy? Strategy { get; set; }
        public ICollection<KPI> KPIs { get; set; } = new List<KPI>();

        public Objective() : base() { }

        public static Objective Create(
            Guid engagementId, 
            Guid strategyId, 
            string name, 
            string? description = null,
            string? businessValueCategory = null,
            string? owner = null,
            int priority = 3)
        {
            return new Objective
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                StrategyId = strategyId,
                Name = name,
                Description = description,
                BusinessValueCategory = businessValueCategory,
                Owner = owner,
                Priority = priority,
                Status = "Draft",
                CreatedAt = DateTime.UtcNow
            };
        }
    }

    /// <summary>
    /// Represents a Key Performance Indicator (KPI) for an objective.
    /// Tracks baseline, target, and measurement approach for business metrics.
    /// </summary>
    public class KPI : Entity
    {
        public Guid ObjectiveId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Unit { get; set; }
        public decimal? BaselineValue { get; set; }
        public decimal? TargetValue { get; set; }
        public string? MeasurementFrequency { get; set; } = "Monthly"; // Monthly, Quarterly, Annual
        public string? DataSource { get; set; } // Where/how data is collected

        public Objective? Objective { get; set; }

        public KPI() : base() { }

        public static KPI Create(
            Guid engagementId, 
            Guid objectiveId, 
            string name, 
            string? unit = null,
            decimal? baselineValue = null,
            decimal? targetValue = null,
            string? dataSource = null)
        {
            return new KPI
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                ObjectiveId = objectiveId,
                Name = name,
                Unit = unit,
                BaselineValue = baselineValue,
                TargetValue = targetValue,
                MeasurementFrequency = "Monthly",
                DataSource = dataSource,
                CreatedAt = DateTime.UtcNow
            };
        }
    }
}
