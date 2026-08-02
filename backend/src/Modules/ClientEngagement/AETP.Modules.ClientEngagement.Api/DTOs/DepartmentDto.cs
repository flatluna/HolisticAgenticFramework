namespace AETP.Modules.ClientEngagement.Api.DTOs
{
    /// <summary>
    /// DTO for Department response
    /// </summary>
    public class DepartmentDto
    {
        public Guid Id { get; set; }
        public Guid EngagementId { get; set; }
        public Guid CompanyProfileId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? HeadCount { get; set; }
        public string? LeadName { get; set; }
        public string? LeadEmail { get; set; }
        public decimal? AnnualBudget { get; set; }
        public int DisplayOrder { get; set; }
        public string Status { get; set; } = "Active";
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    /// <summary>
    /// DTO for creating a Department
    /// </summary>
    public class CreateDepartmentRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? HeadCount { get; set; }
        public string? LeadName { get; set; }
        public string? LeadEmail { get; set; }
        public decimal? AnnualBudget { get; set; }
        public int DisplayOrder { get; set; } = 0;
    }

    /// <summary>
    /// DTO for updating a Department
    /// </summary>
    public class UpdateDepartmentRequest
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public int? HeadCount { get; set; }
        public string? LeadName { get; set; }
        public string? LeadEmail { get; set; }
        public decimal? AnnualBudget { get; set; }
        public int? DisplayOrder { get; set; }
        public string? Status { get; set; }
    }
}
