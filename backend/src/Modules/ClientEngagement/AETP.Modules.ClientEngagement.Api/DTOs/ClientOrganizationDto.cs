namespace AETP.Modules.ClientEngagement.Api.DTOs
{
    /// <summary>
    /// DTO for ClientOrganization response
    /// </summary>
    public class ClientOrganizationDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Industry { get; set; }
        public string? Country { get; set; }
        public int? EmployeeCount { get; set; }
        public string Status { get; set; } = "Active";
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// DTO for creating a ClientOrganization
    /// </summary>
    public class CreateClientOrganizationRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Industry { get; set; }
        public string? Country { get; set; }
        public int? EmployeeCount { get; set; }
    }

    /// <summary>
    /// DTO for Engagement response
    /// </summary>
    public class EngagementDto
    {
        public Guid Id { get; set; }
        public Guid ClientOrganizationId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Status { get; set; } = "Planning";
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// DTO for creating an Engagement
    /// </summary>
    public class CreateEngagementRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}
