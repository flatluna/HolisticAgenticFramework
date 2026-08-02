namespace AETP.Modules.ClientEngagement.Api.DTOs
{
    public class CreateDecisionRequest
    {
        // Información General
        public Guid ProcessId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Owner { get; set; }

        // Clasificación
        public string DecisionType { get; set; } = "Operativa";
        public string Frequency { get; set; } = "Mensual";
        public string Complexity { get; set; } = "Media";

        // Estado Actual
        public string DecisionMaker { get; set; } = "Humano";
        public string CurrentAutonomyLevel { get; set; } = "L0";
        public string IsRuleBased { get; set; } = "No";
        public string? RulesDescription { get; set; }
        public string? RulesSource { get; set; }
        public string DataAvailability { get; set; } = "No";
        public string? InputDataUsed { get; set; }

        // Potencial de Automatización
        public string TargetAutonomyLevel { get; set; } = "L0";
        public string AutomationPotential { get; set; } = "Media";
        public string? AutomationRisk { get; set; }

        // Hallazgos
        public string? MainProblems { get; set; }
        public string? MainOpportunities { get; set; }
        public string? Observations { get; set; }

        public string? Status { get; set; }
    }

    public class DecisionDto
    {
        public Guid Id { get; set; }
        public Guid EngagementId { get; set; }
        public Guid ProcessId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Owner { get; set; }

        public string DecisionType { get; set; } = "Operativa";
        public string Frequency { get; set; } = "Mensual";
        public string Complexity { get; set; } = "Media";

        public string DecisionMaker { get; set; } = "Humano";
        public string CurrentAutonomyLevel { get; set; } = "L0";
        public string IsRuleBased { get; set; } = "No";
        public string? RulesDescription { get; set; }
        public string? RulesSource { get; set; }
        public string DataAvailability { get; set; } = "No";
        public string? InputDataUsed { get; set; }

        public string TargetAutonomyLevel { get; set; } = "L0";
        public string AutomationPotential { get; set; } = "Media";
        public string? AutomationRisk { get; set; }

        public string? MainProblems { get; set; }
        public string? MainOpportunities { get; set; }
        public string? Observations { get; set; }

        public string Status { get; set; } = "Borrador";
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    /// <summary>One AI-suggested candidate decision point, proposed by
    /// <see cref="Agents.DecisionExtractionAgent"/> from a Process's text.
    /// Never persisted directly — a human reviews/edits via the normal
    /// create form before it becomes a real <see cref="DecisionDto"/>.</summary>
    public class DecisionSuggestionDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string DecisionType { get; set; } = "Operativa";
        public string Frequency { get; set; } = "Mensual";
        public string Complexity { get; set; } = "Media";
        public string IsRuleBased { get; set; } = "No";
        public string? RulesDescription { get; set; }
        public string? InputDataUsed { get; set; }
        public string DataAvailability { get; set; } = "No";
    }

    public class ExtractDecisionsResponse
    {
        public List<DecisionSuggestionDto> Suggestions { get; set; } = [];
    }

    /// <summary>A person mentioned in an uploaded process document.</summary>
    public class ExtractedPersonDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Role { get; set; }
    }

    /// <summary>Result of uploading a process document (PDF): where it was
    /// stored, its extracted executive summary/entities, and every
    /// candidate decision found — all suggestions for a human to review.</summary>
    public class ProcessDocumentDto
    {
        public Guid Id { get; set; }
        public Guid ProcessId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public int PageCount { get; set; }
        public string ExtractionStatus { get; set; } = "Subido";
        public string? ExtractionError { get; set; }
        public string? ExecutiveSummary { get; set; }
        public List<ExtractedPersonDto> People { get; set; } = [];
        public List<string> Departments { get; set; } = [];
        public List<DecisionSuggestionDto> Suggestions { get; set; } = [];
        public DateTime CreatedAt { get; set; }
    }
}
