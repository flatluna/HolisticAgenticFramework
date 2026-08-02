using AETP.BuildingBlocks.Domain;

namespace AETP.Modules.ClientEngagement.Domain
{
    /// <summary>
    /// Represents a company profile scoped to an engagement.
    /// Contains organizational metadata, maturity scores, and business context.
    /// This is the aggregate root for organizational context data.
    /// </summary>
    public class CompanyProfile : AggregateRoot
    {
        public Guid ClientOrganizationId { get; set; }
        public DateTime? Founded { get; set; }
        public decimal? AnnualRevenue { get; set; }
        public int? TotalEmployees { get; set; }

        // Headquarters address, stored as independent fields (not a single
        // freeform string) so each component can be edited/queried on its own.
        public string? HeadquartersStreet { get; set; } // Calle y número
        public string? HeadquartersNeighborhood { get; set; } // Colonia
        public string? HeadquartersCity { get; set; }
        public string? HeadquartersState { get; set; } // Estado
        public string? HeadquartersCountry { get; set; }
        public string? HeadquartersPostalCode { get; set; }

        // Phone, split so the country code (e.g. "52" Mexico, "1" USA) is
        // stored independently from the national number.
        public string? PhoneCountryCode { get; set; }
        public string? Phone { get; set; }
        
        // Maturity Scores (0-100)
        public int CloudAdoptionScore { get; set; } = 0;
        public int DataMaturityScore { get; set; } = 0;
        public int AIAdoptionScore { get; set; } = 0;
        
        // Business Context (JSON-serialized)
        public string? IndustrySectors { get; set; } // JSON array
        public string? GeographicMarkets { get; set; } // JSON array
        public string? KeyProducts { get; set; } // JSON array
        
        // Financial & Operational
        public int? LastFiscalYear { get; set; }
        public decimal? ProfitMargin { get; set; }
        public string? CreditRating { get; set; }
        
        public string Status { get; set; } = "Active"; // Active, Inactive, Prospect

        // Related entities
        public ICollection<Department> Departments { get; set; } = new List<Department>();
        public ICollection<Location> Locations { get; set; } = new List<Location>();

        public CompanyProfile() : base() { }

        public static CompanyProfile Create(
            Guid engagementId,
            Guid clientOrganizationId,
            string? headquartersCity = null,
            string? headquartersCountry = null,
            decimal? annualRevenue = null,
            int? totalEmployees = null,
            string? headquartersStreet = null,
            string? headquartersNeighborhood = null,
            string? headquartersState = null,
            string? headquartersPostalCode = null,
            string? phoneCountryCode = null,
            string? phone = null)
        {
            return new CompanyProfile
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                ClientOrganizationId = clientOrganizationId,
                HeadquartersStreet = headquartersStreet,
                HeadquartersNeighborhood = headquartersNeighborhood,
                HeadquartersCity = headquartersCity,
                HeadquartersState = headquartersState,
                HeadquartersCountry = headquartersCountry,
                HeadquartersPostalCode = headquartersPostalCode,
                PhoneCountryCode = phoneCountryCode,
                Phone = phone,
                AnnualRevenue = annualRevenue,
                TotalEmployees = totalEmployees,
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            };
        }

        public bool Validate()
        {
            // Validate maturity scores are between 0-100
            if (CloudAdoptionScore < 0 || CloudAdoptionScore > 100)
                return false;
            if (DataMaturityScore < 0 || DataMaturityScore > 100)
                return false;
            if (AIAdoptionScore < 0 || AIAdoptionScore > 100)
                return false;

            // Validate revenue and employees are positive if set
            if (AnnualRevenue.HasValue && AnnualRevenue < 0)
                return false;
            if (TotalEmployees.HasValue && TotalEmployees < 0)
                return false;

            return true;
        }
    }

    /// <summary>
    /// Represents an organizational department within a company profile.
    /// Owned by CompanyProfile aggregate root.
    /// </summary>
    public class Department : Entity
    {
        public Guid CompanyProfileId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? HeadCount { get; set; }
        public string? LeadName { get; set; }
        public string? LeadEmail { get; set; }
        public decimal? AnnualBudget { get; set; }
        public int DisplayOrder { get; set; } = 0;
        public string Status { get; set; } = "Active"; // Active, Inactive

        public Department() : base() { }

        public static Department Create(
            Guid engagementId,
            Guid companyProfileId,
            string name,
            string? description = null,
            int? headCount = null,
            int displayOrder = 0)
        {
            return new Department
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                CompanyProfileId = companyProfileId,
                Name = name,
                Description = description,
                HeadCount = headCount,
                DisplayOrder = displayOrder,
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            };
        }

        public bool Validate()
        {
            // Name is required
            if (string.IsNullOrWhiteSpace(Name))
                return false;

            // HeadCount must be non-negative if set
            if (HeadCount.HasValue && HeadCount < 0)
                return false;

            return true;
        }
    }

    /// <summary>
    /// Represents a physical or virtual location of a company.
    /// Owned by CompanyProfile aggregate root.
    /// </summary>
    public class Location : Entity
    {
        public Guid CompanyProfileId { get; set; }
        public string City { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string Office { get; set; } = "Branch"; // HQ, Regional, Branch
        public int? Headcount { get; set; }
        public bool IsHeadquarters { get; set; } = false;
        public string Status { get; set; } = "Active"; // Active, Inactive

        public Location() : base() { }

        public static Location Create(
            Guid engagementId,
            Guid companyProfileId,
            string city,
            string country,
            string office = "Branch",
            bool isHeadquarters = false,
            int? headcount = null)
        {
            return new Location
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                CompanyProfileId = companyProfileId,
                City = city,
                Country = country,
                Office = office,
                IsHeadquarters = isHeadquarters,
                Headcount = headcount,
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            };
        }

        public bool Validate()
        {
            // City and Country are required
            if (string.IsNullOrWhiteSpace(City) || string.IsNullOrWhiteSpace(Country))
                return false;

            // Headcount must be non-negative if set
            if (Headcount.HasValue && Headcount < 0)
                return false;

            return true;
        }
    }
}
