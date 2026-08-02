using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AETP.Modules.ClientEngagement.Domain;
using AETP.Modules.ClientEngagement.Infrastructure;
using AETP.Modules.ClientEngagement.Api.DTOs;
using AETP.Modules.ClientEngagement.Api.Utilities;
using System.Text.Json;

namespace AETP.Modules.ClientEngagement.Api.Functions
{
    public class CompanyProfileFunctions
    {
        private readonly ClientEngagementDbContext _dbContext;
        private readonly ILogger<CompanyProfileFunctions> _logger;

        public CompanyProfileFunctions(
            ClientEngagementDbContext dbContext,
            ILogger<CompanyProfileFunctions> logger)
        {
            _dbContext = dbContext;
            _logger = logger;
        }

        /// <summary>
        /// Creates a new CompanyProfile
        /// POST /api/engagements/{engagementId}/company-profile
        /// </summary>
        [Function("CreateCompanyProfile")]
        public async Task<IActionResult> CreateCompanyProfile(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", "options",
                Route = "engagements/{engagementId}/company-profile")] HttpRequest req,
            string engagementId)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                _logger.LogInformation("Creating CompanyProfile for engagement {engagementId}", engagementId);

                if (!Guid.TryParse(engagementId, out var engagementGuid))
                    return new BadRequestObjectResult(new { error = "Invalid engagement ID" });

                // Verify engagement exists
                var engagement = await _dbContext.Engagements.FindAsync(engagementGuid);
                if (engagement == null)
                    return new NotFoundObjectResult(new { error = "Engagement not found" });

                // Read request body
                string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
                var request = JsonSerializer.Deserialize<CreateCompanyProfileRequest>(requestBody, AETP.Modules.ClientEngagement.Api.Utilities.JsonOptionsHelper.CaseInsensitive);

                if (request == null)
                    return new BadRequestObjectResult(new { error = "Invalid request body" });

                // Create CompanyProfile
                var companyProfile = CompanyProfile.Create(
                    engagementGuid,
                    request.ClientOrganizationId,
                    request.HeadquartersCity,
                    request.HeadquartersCountry,
                    request.AnnualRevenue,
                    request.TotalEmployees,
                    request.HeadquartersStreet,
                    request.HeadquartersNeighborhood,
                    request.HeadquartersState,
                    request.HeadquartersPostalCode,
                    request.PhoneCountryCode,
                    request.Phone);

                // Apply additional fields
                if (request.CloudAdoptionScore.HasValue)
                    companyProfile.CloudAdoptionScore = request.CloudAdoptionScore.Value;
                if (request.DataMaturityScore.HasValue)
                    companyProfile.DataMaturityScore = request.DataMaturityScore.Value;
                if (request.AIAdoptionScore.HasValue)
                    companyProfile.AIAdoptionScore = request.AIAdoptionScore.Value;
                if (request.GeographicMarkets != null)
                    companyProfile.GeographicMarkets = request.GeographicMarkets;
                if (request.KeyProducts != null)
                    companyProfile.KeyProducts = request.KeyProducts;

                // Validate
                if (!companyProfile.Validate())
                    return new BadRequestObjectResult(new { error = "Invalid CompanyProfile data" });

                // Save
                _dbContext.CompanyProfiles.Add(companyProfile);
                await _dbContext.SaveChangesAsync();

                var dto = MapToDto(companyProfile);
                return new CreatedResult($"/api/engagements/{engagementId}/company-profile/{companyProfile.Id}", dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating CompanyProfile");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Gets a CompanyProfile with related Departments and Locations
        /// GET /api/engagements/{engagementId}/company-profile
        /// </summary>
        [Function("GetCompanyProfile")]
        public async Task<IActionResult> GetCompanyProfile(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get",
                Route = "engagements/{engagementId}/company-profile")] HttpRequest req,
            string engagementId)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                _logger.LogInformation("Getting CompanyProfile for engagement {engagementId}", engagementId);

                if (!Guid.TryParse(engagementId, out var engagementGuid))
                    return new BadRequestObjectResult(new { error = "Invalid engagement ID" });

                // Get first CompanyProfile for this engagement with related entities
                var companyProfile = await _dbContext.CompanyProfiles
                    .Where(cp => cp.EngagementId == engagementGuid)
                    .Include(cp => cp.Departments)
                    .Include(cp => cp.Locations)
                    .FirstOrDefaultAsync();

                if (companyProfile == null)
                    return new NotFoundObjectResult(new { error = "CompanyProfile not found" });

                var dto = MapToDto(companyProfile);
                return new OkObjectResult(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting CompanyProfile");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Updates a CompanyProfile
        /// PUT /api/engagements/{engagementId}/company-profile/{id}
        /// </summary>
        [Function("UpdateCompanyProfile")]
        public async Task<IActionResult> UpdateCompanyProfile(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", "options",
                Route = "engagements/{engagementId}/company-profile/{id}")] HttpRequest req,
            string engagementId,
            string id)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                _logger.LogInformation("Updating CompanyProfile {id} for engagement {engagementId}", id, engagementId);

                if (!Guid.TryParse(engagementId, out var engagementGuid))
                    return new BadRequestObjectResult(new { error = "Invalid engagement ID" });

                if (!Guid.TryParse(id, out var profileGuid))
                    return new BadRequestObjectResult(new { error = "Invalid profile ID" });

                // Find and validate ownership
                var companyProfile = await _dbContext.CompanyProfiles.FindAsync(profileGuid);
                if (companyProfile == null)
                    return new NotFoundObjectResult(new { error = "CompanyProfile not found" });

                if (companyProfile.EngagementId != engagementGuid)
                    return new BadRequestObjectResult(new { error = "Engagement ID mismatch" });

                // Read request body
                string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
                var request = JsonSerializer.Deserialize<UpdateCompanyProfileRequest>(requestBody, AETP.Modules.ClientEngagement.Api.Utilities.JsonOptionsHelper.CaseInsensitive);

                if (request == null)
                    return new BadRequestObjectResult(new { error = "Invalid request body" });

                // Update fields
                if (!string.IsNullOrEmpty(request.HeadquartersStreet))
                    companyProfile.HeadquartersStreet = request.HeadquartersStreet;
                if (!string.IsNullOrEmpty(request.HeadquartersNeighborhood))
                    companyProfile.HeadquartersNeighborhood = request.HeadquartersNeighborhood;
                if (!string.IsNullOrEmpty(request.HeadquartersCity))
                    companyProfile.HeadquartersCity = request.HeadquartersCity;
                if (!string.IsNullOrEmpty(request.HeadquartersState))
                    companyProfile.HeadquartersState = request.HeadquartersState;
                if (!string.IsNullOrEmpty(request.HeadquartersCountry))
                    companyProfile.HeadquartersCountry = request.HeadquartersCountry;
                if (!string.IsNullOrEmpty(request.HeadquartersPostalCode))
                    companyProfile.HeadquartersPostalCode = request.HeadquartersPostalCode;
                if (!string.IsNullOrEmpty(request.PhoneCountryCode))
                    companyProfile.PhoneCountryCode = request.PhoneCountryCode;
                if (!string.IsNullOrEmpty(request.Phone))
                    companyProfile.Phone = request.Phone;
                if (request.AnnualRevenue.HasValue)
                    companyProfile.AnnualRevenue = request.AnnualRevenue;
                if (request.TotalEmployees.HasValue)
                    companyProfile.TotalEmployees = request.TotalEmployees;
                if (request.CloudAdoptionScore.HasValue)
                    companyProfile.CloudAdoptionScore = request.CloudAdoptionScore.Value;
                if (request.DataMaturityScore.HasValue)
                    companyProfile.DataMaturityScore = request.DataMaturityScore.Value;
                if (request.AIAdoptionScore.HasValue)
                    companyProfile.AIAdoptionScore = request.AIAdoptionScore.Value;
                if (request.GeographicMarkets != null)
                    companyProfile.GeographicMarkets = request.GeographicMarkets;
                if (request.KeyProducts != null)
                    companyProfile.KeyProducts = request.KeyProducts;
                if (!string.IsNullOrEmpty(request.Status))
                    companyProfile.Status = request.Status;
                companyProfile.Touch();

                // Validate and save
                if (!companyProfile.Validate())
                    return new BadRequestObjectResult(new { error = "Invalid CompanyProfile data" });

                _dbContext.CompanyProfiles.Update(companyProfile);
                await _dbContext.SaveChangesAsync();

                // Return full profile with related entities
                var fullProfile = await _dbContext.CompanyProfiles
                    .Where(cp => cp.Id == profileGuid)
                    .Include(cp => cp.Departments)
                    .Include(cp => cp.Locations)
                    .FirstAsync();

                var dto = MapToDto(fullProfile);
                return new OkObjectResult(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating CompanyProfile: {Message}", ex.Message);
                return new BadRequestObjectResult(new { error = "Error updating company profile: " + ex.Message });
            }
        }

        private CompanyProfileDto MapToDto(CompanyProfile entity)
        {
            return new CompanyProfileDto
            {
                Id = entity.Id,
                EngagementId = entity.EngagementId,
                ClientOrganizationId = entity.ClientOrganizationId,
                Founded = entity.Founded,
                AnnualRevenue = entity.AnnualRevenue,
                TotalEmployees = entity.TotalEmployees,
                HeadquartersStreet = entity.HeadquartersStreet,
                HeadquartersNeighborhood = entity.HeadquartersNeighborhood,
                HeadquartersCity = entity.HeadquartersCity,
                HeadquartersState = entity.HeadquartersState,
                HeadquartersCountry = entity.HeadquartersCountry,
                HeadquartersPostalCode = entity.HeadquartersPostalCode,
                PhoneCountryCode = entity.PhoneCountryCode,
                Phone = entity.Phone,
                CloudAdoptionScore = entity.CloudAdoptionScore,
                DataMaturityScore = entity.DataMaturityScore,
                AIAdoptionScore = entity.AIAdoptionScore,
                IndustrySectors = entity.IndustrySectors,
                GeographicMarkets = entity.GeographicMarkets,
                KeyProducts = entity.KeyProducts,
                LastFiscalYear = entity.LastFiscalYear,
                ProfitMargin = entity.ProfitMargin,
                CreditRating = entity.CreditRating,
                Status = entity.Status,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt,
                Departments = entity.Departments.Select(d => new DepartmentDto
                {
                    Id = d.Id,
                    EngagementId = d.EngagementId,
                    CompanyProfileId = d.CompanyProfileId,
                    Name = d.Name,
                    Description = d.Description,
                    HeadCount = d.HeadCount,
                    LeadName = d.LeadName,
                    LeadEmail = d.LeadEmail,
                    AnnualBudget = d.AnnualBudget,
                    DisplayOrder = d.DisplayOrder,
                    Status = d.Status,
                    CreatedAt = d.CreatedAt,
                    UpdatedAt = d.UpdatedAt
                }).ToList(),
                Locations = entity.Locations.Select(l => new LocationDto
                {
                    Id = l.Id,
                    EngagementId = l.EngagementId,
                    CompanyProfileId = l.CompanyProfileId,
                    City = l.City,
                    Country = l.Country,
                    Office = l.Office,
                    Headcount = l.Headcount,
                    IsHeadquarters = l.IsHeadquarters,
                    Status = l.Status,
                    CreatedAt = l.CreatedAt,
                    UpdatedAt = l.UpdatedAt
                }).ToList()
            };
        }
    }
}
