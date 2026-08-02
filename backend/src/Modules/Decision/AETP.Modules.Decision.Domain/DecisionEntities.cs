using AETP.BuildingBlocks.Domain;

namespace AETP.Modules.Decision.Domain
{
    /// <summary>
    /// A single business decision point captured during the "02. Diagnóstico y
    /// Madurez Actual" assessment (dimension 2.4 - Decisiones). Cada decisión
    /// pertenece a exactamente un Business Process (el proceso donde ocurre),
    /// FK lógica sin constraint físico entre módulos, igual que CapabilityId
    /// en BusinessProcess.
    /// </summary>
    public class BusinessDecision : AggregateRoot
    {
        /// <summary>Proceso donde ocurre esta decisión (FK lógica a BusinessProcess).</summary>
        public Guid ProcessId { get; set; }

        // Información General
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Owner { get; set; } // Decision Owner

        // Clasificación
        public string DecisionType { get; set; } = "Operativa"; // Estratégica/Táctica/Operativa
        public string Frequency { get; set; } = "Mensual"; // Diaria/Semanal/Mensual/Trimestral/Ad-hoc
        public string Complexity { get; set; } = "Media"; // Baja/Media/Alta

        // Estado Actual
        public string DecisionMaker { get; set; } = "Humano"; // Humano/Humano + IA/IA supervisada/IA autónoma
        public string CurrentAutonomyLevel { get; set; } = "L0"; // L0-L5
        public string IsRuleBased { get; set; } = "No"; // Sí/No/Parcial - ¿se basa en reglas claras?
        public string? RulesDescription { get; set; } // Reglas de negocio aplicadas (criterios/umbrales)
        public string? RulesSource { get; set; } // Dónde viven hoy las reglas (política, tácito, ERP, Excel...)
        public string DataAvailability { get; set; } = "No"; // Sí/No/Parcial - ¿datos disponibles y confiables?
        public string? InputDataUsed { get; set; } // Datos de entrada utilizados

        // Potencial de Automatización
        public string TargetAutonomyLevel { get; set; } = "L0"; // L0-L5
        public string AutomationPotential { get; set; } = "Media"; // Baja/Media/Alta/Crítica
        public string? AutomationRisk { get; set; } // Riesgo/impacto de automatizar

        // Hallazgos
        public string? MainProblems { get; set; }
        public string? MainOpportunities { get; set; }
        public string? Observations { get; set; }

        public string Status { get; set; } = "Borrador"; // Sugerido/Borrador/Completo/Validado/Archivado

        public BusinessDecision() : base() { }

        public static BusinessDecision Create(Guid engagementId, Guid processId, string name)
        {
            return new BusinessDecision
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                ProcessId = processId,
                Name = name,
                Status = "Borrador",
                CreatedAt = DateTime.UtcNow
            };
        }
    }
}
