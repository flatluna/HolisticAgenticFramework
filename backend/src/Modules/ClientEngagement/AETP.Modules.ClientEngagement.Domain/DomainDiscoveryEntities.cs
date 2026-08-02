using AETP.BuildingBlocks.Domain;

namespace AETP.Modules.ClientEngagement.Domain
{
    /// <summary>
    /// Paso 2 · Descubrimiento y Priorización de Dominios de Negocio — la
    /// industria seleccionada para un engagement (una fila por engagement).
    /// Determina qué dominios de Capa 2 (por industria) se muestran además
    /// de los universales (Capa 1, siempre visibles).
    /// </summary>
    public class DomainDiscoverySettings : Entity
    {
        public string? SelectedIndustryId { get; set; }

        public DomainDiscoverySettings() : base() { }

        public static DomainDiscoverySettings Create(Guid engagementId, string? selectedIndustryId)
        {
            return new DomainDiscoverySettings
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                SelectedIndustryId = selectedIndustryId,
                CreatedAt = DateTime.UtcNow,
            };
        }

        public void UpdateIndustry(string? selectedIndustryId)
        {
            SelectedIndustryId = selectedIndustryId;
            Touch();
        }
    }

    /// <summary>
    /// One domain's evaluation within Paso 2 · Descubrimiento y Priorización
    /// de Dominios de Negocio (5 dimensiones 1-5 + inventarios). Igual que
    /// Fase 1, el sistema sugiere/calcula el priorityScore/cuadrante en el
    /// FRONTEND — el backend solo persiste los inputs crudos; el criterio
    /// final (incluyendo el ajuste de complejidad heredado de Fase 1) puede
    /// ser sobreescrito por el evaluador humano vía
    /// <see cref="ComplexityAdjustmentOverride"/>.
    /// </summary>
    public class DomainAssessment : Entity
    {
        public string DomainId { get; set; } = string.Empty;
        public string? BusinessContext { get; set; }
        public string ProcessInventoryJson { get; set; } = "[]";
        public string SystemsInventoryJson { get; set; } = "[]";

        public int? StrategicValue { get; set; }
        public int? TransformPotential { get; set; }
        public int? Roi { get; set; }
        public int? Complexity { get; set; }
        public int? Urgency { get; set; }

        // Override humano del ajuste de complejidad heredado de Fase 1
        // (null = usar el valor auto-calculado por el frontend a partir de
        // los niveles de madurez de Fase 1).
        public int? ComplexityAdjustmentOverride { get; set; }

        public DomainAssessment() : base() { }

        public static DomainAssessment Create(
            Guid engagementId,
            string domainId,
            string? businessContext,
            string processInventoryJson,
            string systemsInventoryJson,
            int? strategicValue,
            int? transformPotential,
            int? roi,
            int? complexity,
            int? urgency,
            int? complexityAdjustmentOverride)
        {
            return new DomainAssessment
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                DomainId = domainId,
                BusinessContext = businessContext,
                ProcessInventoryJson = string.IsNullOrWhiteSpace(processInventoryJson) ? "[]" : processInventoryJson,
                SystemsInventoryJson = string.IsNullOrWhiteSpace(systemsInventoryJson) ? "[]" : systemsInventoryJson,
                StrategicValue = strategicValue,
                TransformPotential = transformPotential,
                Roi = roi,
                Complexity = complexity,
                Urgency = urgency,
                ComplexityAdjustmentOverride = complexityAdjustmentOverride,
                CreatedAt = DateTime.UtcNow,
            };
        }
    }
}
