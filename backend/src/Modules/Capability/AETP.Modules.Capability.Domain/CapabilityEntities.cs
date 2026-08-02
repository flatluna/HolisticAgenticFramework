using AETP.BuildingBlocks.Domain;

namespace AETP.Modules.Capability.Domain
{
    /// <summary>
    /// A single Business Capability captured during the "02. Diagnóstico y Madurez
    /// Actual" assessment (dimension 2.2 - Capacidades Empresariales). One row per
    /// capability (e.g. "Marketing", "Gestión de Pedidos").
    /// </summary>
    public class BusinessCapability : AggregateRoot
    {
        // Información General
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string BusinessDomain { get; set; } = string.Empty;
        public string? Owner { get; set; }
        public string? ResponsibleArea { get; set; }

        // Alineación Estratégica
        public string? RelatedStrategicObjective { get; set; }
        public string? StrategicPriority { get; set; } // Crítica/Alta/Media/Baja
        public string? BusinessContribution { get; set; } // Diferenciadora/Habilitadora/Soporte/Commodity
        public string? ExpectedImpact { get; set; }

        // Estado Actual (escala 1-5)
        public int MaturityLevel { get; set; }
        public int PerformanceLevel { get; set; }
        public int DigitalizationLevel { get; set; }

        // Preparación Agentic
        public int AutomationPotentialPercent { get; set; }
        public string? AiAgentPotential { get; set; } // Bajo/Medio/Alto/Muy Alto
        public string TargetAutonomyLevel { get; set; } = "L0"; // L0-L5

        // Hallazgos
        public string? MainProblems { get; set; }
        public string? MainOpportunities { get; set; }
        public string? Observations { get; set; }

        public string Status { get; set; } = "Borrador"; // Borrador/Completo/Validado/Archivado

        public ICollection<CapabilityKpi> Kpis { get; set; } = new List<CapabilityKpi>();

        public BusinessCapability() : base() { }

        public static BusinessCapability Create(Guid engagementId, string name, string businessDomain)
        {
            return new BusinessCapability
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                Name = name,
                BusinessDomain = businessDomain,
                Status = "Borrador",
                CreatedAt = DateTime.UtcNow
            };
        }
    }

    /// <summary>KPI asociado a una Business Capability (registro repetible).</summary>
    public class CapabilityKpi : Entity
    {
        public Guid BusinessCapabilityId { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal? CurrentValue { get; set; }
        public decimal? Target { get; set; }
        public string? Unit { get; set; }

        public CapabilityKpi() : base() { }

        public static CapabilityKpi Create(Guid engagementId, Guid capabilityId, string name)
        {
            return new CapabilityKpi
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                BusinessCapabilityId = capabilityId,
                Name = name,
                CreatedAt = DateTime.UtcNow
            };
        }
    }
}
