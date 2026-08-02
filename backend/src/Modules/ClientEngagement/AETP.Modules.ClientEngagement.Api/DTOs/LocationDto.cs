namespace AETP.Modules.ClientEngagement.Api.DTOs
{
    /// <summary>
    /// DTO for Location response
    /// </summary>
    public class LocationDto
    {
        public Guid Id { get; set; }
        public Guid EngagementId { get; set; }
        public Guid CompanyProfileId { get; set; }
        public string City { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string Office { get; set; } = "Branch"; // HQ, Regional, Branch
        public int? Headcount { get; set; }
        public bool IsHeadquarters { get; set; }
        public string Status { get; set; } = "Active";
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    /// <summary>
    /// DTO for creating a Location
    /// </summary>
    public class CreateLocationRequest
    {
        public string City { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string Office { get; set; } = "Branch"; // HQ, Regional, Branch
        public int? Headcount { get; set; }
        public bool IsHeadquarters { get; set; } = false;
    }

    /// <summary>
    /// DTO for updating a Location
    /// </summary>
    public class UpdateLocationRequest
    {
        public string? City { get; set; }
        public string? Country { get; set; }
        public string? Office { get; set; }
        public int? Headcount { get; set; }
        public bool? IsHeadquarters { get; set; }
        public string? Status { get; set; }
    }
}
