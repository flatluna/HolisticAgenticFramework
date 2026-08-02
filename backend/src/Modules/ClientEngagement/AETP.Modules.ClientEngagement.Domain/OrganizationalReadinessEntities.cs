using AETP.BuildingBlocks.Domain;

namespace AETP.Modules.ClientEngagement.Domain
{
    /// <summary>
    /// One pillar's evaluation within the Paso 1 · Assessment de Preparación
    /// Organizacional (6 pillars: procesos, datos, tecnologia, ia-agentes,
    /// personas, gobernanza). This is a qualitative executive diagnostic —
    /// EvidenceGroupsJson holds the structured evidence chip selections
    /// (JSON array of {groupId, selected: string[]}, opaque to the backend),
    /// Level (1-4) is always the human evaluator's judgement call, never
    /// auto-derived from the selected evidence.
    /// </summary>
    public class OrganizationalReadinessPillar : Entity
    {
        public string PillarId { get; set; } = string.Empty;
        public int? Level { get; set; }
        public string? Notes { get; set; }
        public string EvidenceGroupsJson { get; set; } = "[]";

        public OrganizationalReadinessPillar() : base() { }

        public static OrganizationalReadinessPillar Create(
            Guid engagementId,
            string pillarId,
            int? level,
            string? notes,
            string evidenceGroupsJson)
        {
            return new OrganizationalReadinessPillar
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                PillarId = pillarId,
                Level = level,
                Notes = notes,
                EvidenceGroupsJson = string.IsNullOrWhiteSpace(evidenceGroupsJson) ? "[]" : evidenceGroupsJson,
                CreatedAt = DateTime.UtcNow,
            };
        }
    }
}
