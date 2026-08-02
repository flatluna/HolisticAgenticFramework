namespace AETP.Modules.ClientEngagement.Api.DTOs
{
    /// <summary>
    /// DTO for CompanyProfile response
    /// </summary>
    public class CompanyProfileDto
    {
        public Guid Id { get; set; }
        public Guid EngagementId { get; set; }
        public Guid ClientOrganizationId { get; set; }
        public DateTime? Founded { get; set; }
        public decimal? AnnualRevenue { get; set; }
        public int? TotalEmployees { get; set; }
        public string? HeadquartersStreet { get; set; }
        public string? HeadquartersNeighborhood { get; set; }
        public string? HeadquartersCity { get; set; }
        public string? HeadquartersState { get; set; }
        public string? HeadquartersCountry { get; set; }
        public string? HeadquartersPostalCode { get; set; }
        public string? PhoneCountryCode { get; set; }
        public string? Phone { get; set; }
        public int CloudAdoptionScore { get; set; }
        public int DataMaturityScore { get; set; }
        public int AIAdoptionScore { get; set; }
        public string? IndustrySectors { get; set; }
        public string? GeographicMarkets { get; set; }
        public string? KeyProducts { get; set; }
        public int? LastFiscalYear { get; set; }
        public decimal? ProfitMargin { get; set; }
        public string? CreditRating { get; set; }
        public string Status { get; set; } = "Active";
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Related entities
        public List<DepartmentDto> Departments { get; set; } = new();
        public List<LocationDto> Locations { get; set; } = new();
    }

    /// <summary>
    /// DTO for creating a CompanyProfile
    /// </summary>
    public class CreateCompanyProfileRequest
    {
        public Guid ClientOrganizationId { get; set; }
        public string? HeadquartersStreet { get; set; }
        public string? HeadquartersNeighborhood { get; set; }
        public string? HeadquartersCity { get; set; }
        public string? HeadquartersState { get; set; }
        public string? HeadquartersCountry { get; set; }
        public string? HeadquartersPostalCode { get; set; }
        public string? PhoneCountryCode { get; set; }
        public string? Phone { get; set; }
        public decimal? AnnualRevenue { get; set; }
        public int? TotalEmployees { get; set; }
        public int? CloudAdoptionScore { get; set; } = 0;
        public int? DataMaturityScore { get; set; } = 0;
        public int? AIAdoptionScore { get; set; } = 0;
        public string? GeographicMarkets { get; set; }
        public string? KeyProducts { get; set; }
    }

    /// <summary>
    /// DTO for updating a CompanyProfile
    /// </summary>
    public class UpdateCompanyProfileRequest
    {
        public string? HeadquartersStreet { get; set; }
        public string? HeadquartersNeighborhood { get; set; }
        public string? HeadquartersCity { get; set; }
        public string? HeadquartersState { get; set; }
        public string? HeadquartersCountry { get; set; }
        public string? HeadquartersPostalCode { get; set; }
        public string? PhoneCountryCode { get; set; }
        public string? Phone { get; set; }
        public decimal? AnnualRevenue { get; set; }
        public int? TotalEmployees { get; set; }
        public int? CloudAdoptionScore { get; set; }
        public int? DataMaturityScore { get; set; }
        public int? AIAdoptionScore { get; set; }
        public string? GeographicMarkets { get; set; }
        public string? KeyProducts { get; set; }
        public string? Status { get; set; }
    }
}
