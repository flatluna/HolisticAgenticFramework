namespace AETP.Modules.ClientEngagement.Api.DTOs
{
    public class CreateCapabilityRequest
    {
        // Información General
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string BusinessDomain { get; set; } = string.Empty;
        public string? Owner { get; set; }
        public string? ResponsibleArea { get; set; }

        // Alineación Estratégica
        public string? RelatedStrategicObjective { get; set; }
        public string? StrategicPriority { get; set; }
        public string? BusinessContribution { get; set; }
        public string? ExpectedImpact { get; set; }

        // Estado Actual
        public int MaturityLevel { get; set; }
        public int PerformanceLevel { get; set; }
        public int DigitalizationLevel { get; set; }

        // KPIs
        public List<CapabilityKpiRequest> Kpis { get; set; } = new();

        // Preparación Agentic
        public int AutomationPotentialPercent { get; set; }
        public string? AiAgentPotential { get; set; }
        public string TargetAutonomyLevel { get; set; } = "L0";

        // Hallazgos
        public string? MainProblems { get; set; }
        public string? MainOpportunities { get; set; }
        public string? Observations { get; set; }

        public string? Status { get; set; }
    }

    public class CapabilityKpiRequest
    {
        public string Name { get; set; } = string.Empty;
        public decimal? CurrentValue { get; set; }
        public decimal? Target { get; set; }
        public string? Unit { get; set; }
    }

    public class CapabilityDto
    {
        public Guid Id { get; set; }
        public Guid EngagementId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string BusinessDomain { get; set; } = string.Empty;
        public string? Owner { get; set; }
        public string? ResponsibleArea { get; set; }

        public string? RelatedStrategicObjective { get; set; }
        public string? StrategicPriority { get; set; }
        public string? BusinessContribution { get; set; }
        public string? ExpectedImpact { get; set; }

        public int MaturityLevel { get; set; }
        public int PerformanceLevel { get; set; }
        public int DigitalizationLevel { get; set; }

        public List<CapabilityKpiDto> Kpis { get; set; } = new();

        public int AutomationPotentialPercent { get; set; }
        public string? AiAgentPotential { get; set; }
        public string TargetAutonomyLevel { get; set; } = "L0";

        public string? MainProblems { get; set; }
        public string? MainOpportunities { get; set; }
        public string? Observations { get; set; }

        public string Status { get; set; } = "Borrador";
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CapabilityKpiDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal? CurrentValue { get; set; }
        public decimal? Target { get; set; }
        public string? Unit { get; set; }
    }
}
