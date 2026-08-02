namespace AETP.Modules.ClientEngagement.Api.DTOs
{
    /// <summary>
    /// DTO for Stakeholder / Org Design role response
    /// </summary>
    public class StakeholderDto
    {
        public Guid Id { get; set; }
        public Guid EngagementId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Role { get; set; }
        public string? Position { get; set; }
        public string? HierarchyLevel { get; set; }
        public string? ReportsTo { get; set; }
        public string? ReplicaTo { get; set; }
        public string? Responsibilities { get; set; }
        public string Status { get; set; } = "Active";
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    /// <summary>
    /// A single Org Design role sent from the frontend when bulk-saving the
    /// org chart table (either manually entered or extracted by the AI agent).
    /// </summary>
    public class OrgRoleRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Position { get; set; }
        public string? HierarchyLevel { get; set; }
        public string? ReportsTo { get; set; }
        public string? ReplicaTo { get; set; }
        public string? Responsibilities { get; set; }
    }

    /// <summary>
    /// Request body for replacing ALL Org Design roles of an engagement in one
    /// call ("Guardar todos"). The existing Stakeholders rows created from Org
    /// Design are replaced with this new set so the table always reflects
    /// exactly what's shown on screen.
    /// </summary>
    public class BulkSaveStakeholdersRequest
    {
        public List<OrgRoleRequest> Roles { get; set; } = new();
    }
}
