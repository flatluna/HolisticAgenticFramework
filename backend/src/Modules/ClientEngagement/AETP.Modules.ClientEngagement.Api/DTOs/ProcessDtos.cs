namespace AETP.Modules.ClientEngagement.Api.DTOs
{
    public class CreateProcessRequest
    {
        // Información General
        public Guid CapabilityId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Owner { get; set; }

        // Estado de Documentación
        public string IsDocumented { get; set; } = "No";
        public string IsFormalized { get; set; } = "No";

        // Estado Actual
        public string CurrentAutonomyLevel { get; set; } = "L0";
        public string Criticality { get; set; } = "Media";

        /// <summary>Sistema origen de los datos del proceso (ej. SAP, Oracle,
        /// Dynamics 365, "Sistema propio" para desarrollos internos, etc.).</summary>
        public string? DataSourceSystem { get; set; }
        public string? DataSourceSystemOther { get; set; }

        // Hallazgos
        public string? MainProblems { get; set; }
        public string? MainOpportunities { get; set; }
        public string? Observations { get; set; }

        public string? Status { get; set; }
    }

    public class ProcessDto
    {
        public Guid Id { get; set; }
        public Guid EngagementId { get; set; }
        public Guid CapabilityId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Owner { get; set; }

        public string IsDocumented { get; set; } = "No";
        public string IsFormalized { get; set; } = "No";

        public string CurrentAutonomyLevel { get; set; } = "L0";
        public string Criticality { get; set; } = "Media";

        public string? DataSourceSystem { get; set; }
        public string? DataSourceSystemOther { get; set; }

        public string? MainProblems { get; set; }
        public string? MainOpportunities { get; set; }
        public string? Observations { get; set; }

        public string Status { get; set; } = "Borrador";
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
