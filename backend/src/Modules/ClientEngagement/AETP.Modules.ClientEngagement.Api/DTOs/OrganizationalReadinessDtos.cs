namespace AETP.Modules.ClientEngagement.Api.DTOs
{
    /// <summary>
    /// DTO for one pillar's evaluation, returned to and sent from the
    /// frontend's Paso 1 · Assessment de Preparación Organizacional.
    /// </summary>
    public class OrganizationalReadinessPillarDto
    {
        public Guid Id { get; set; }
        public Guid EngagementId { get; set; }
        public string PillarId { get; set; } = string.Empty;
        public int? Level { get; set; }
        public string? Notes { get; set; }
        public string EvidenceGroupsJson { get; set; } = "[]";
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    /// <summary>
    /// A single pillar's evaluation sent from the frontend when bulk-saving
    /// the whole assessment ("autosave").
    /// </summary>
    public class OrganizationalReadinessPillarRequest
    {
        public string PillarId { get; set; } = string.Empty;
        public int? Level { get; set; }
        public string? Notes { get; set; }
        public string EvidenceGroupsJson { get; set; } = "[]";
    }

    /// <summary>
    /// Request body for replacing ALL pillar evaluations of an engagement in
    /// one call. The existing rows are replaced with this new set so the
    /// table always reflects exactly what's shown on screen.
    /// </summary>
    public class BulkSaveOrganizationalReadinessRequest
    {
        public List<OrganizationalReadinessPillarRequest> Pillars { get; set; } = new();
    }
}
