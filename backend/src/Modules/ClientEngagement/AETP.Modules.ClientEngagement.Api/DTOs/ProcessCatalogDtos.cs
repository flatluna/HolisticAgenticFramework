namespace AETP.Modules.ClientEngagement.Api.DTOs
{
    public class RoleDto
    {
        public Guid Id { get; set; }
        public Guid EngagementId { get; set; }
        public string Name { get; set; } = string.Empty;
        public Guid? RoleCategoryId { get; set; }
        public string? Description { get; set; }
        public string Status { get; set; } = "Activo";
    }

    public class EnterpriseSystemDto
    {
        public Guid Id { get; set; }
        public Guid EngagementId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Category { get; set; }
        public string? Description { get; set; }
        public string Status { get; set; } = "Activo";
    }
}
