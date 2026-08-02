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
    public class LocationFunctions
    {
        private readonly ClientEngagementDbContext _dbContext;
        private readonly ILogger<LocationFunctions> _logger;

        public LocationFunctions(
            ClientEngagementDbContext dbContext,
            ILogger<LocationFunctions> logger)
        {
            _dbContext = dbContext;
            _logger = logger;
        }

        /// <summary>
        /// Adds a new Location to a CompanyProfile
        /// POST /api/engagements/{engagementId}/company-profile/{companyProfileId}/locations
        /// </summary>
        [Function("AddLocation")]
        public async Task<IActionResult> AddLocation(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", "options",
                Route = "engagements/{engagementId}/company-profile/{companyProfileId}/locations")] HttpRequest req,
            string engagementId,
            string companyProfileId)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                _logger.LogInformation("Adding location to CompanyProfile {companyProfileId}", companyProfileId);

                if (!Guid.TryParse(engagementId, out var engagementGuid))
                    return new BadRequestObjectResult(new { error = "Invalid engagement ID" });

                if (!Guid.TryParse(companyProfileId, out var profileGuid))
                    return new BadRequestObjectResult(new { error = "Invalid company profile ID" });

                // Verify CompanyProfile exists and belongs to engagement
                var companyProfile = await _dbContext.CompanyProfiles.FindAsync(profileGuid);
                if (companyProfile == null)
                    return new NotFoundObjectResult(new { error = "CompanyProfile not found" });

                if (companyProfile.EngagementId != engagementGuid)
                    return new BadRequestObjectResult(new { error = "Engagement ID mismatch" });

                // Read request body
                string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
                var request = JsonSerializer.Deserialize<CreateLocationRequest>(requestBody, AETP.Modules.ClientEngagement.Api.Utilities.JsonOptionsHelper.CaseInsensitive);

                if (request == null || string.IsNullOrWhiteSpace(request.City) || string.IsNullOrWhiteSpace(request.Country))
                    return new BadRequestObjectResult(new { error = "City and Country are required" });

                // Create Location
                var location = Location.Create(
                    engagementGuid,
                    profileGuid,
                    request.City,
                    request.Country,
                    request.Office,
                    request.IsHeadquarters,
                    request.Headcount);

                // Validate
                if (!location.Validate())
                    return new BadRequestObjectResult(new { error = "Invalid Location data" });

                // Save
                _dbContext.Locations.Add(location);
                await _dbContext.SaveChangesAsync();

                var dto = MapToDto(location);
                return new CreatedResult($"/api/engagements/{engagementId}/locations/{location.Id}", dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding location");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Updates a Location
        /// PUT /api/engagements/{engagementId}/locations/{locationId}
        /// </summary>
        [Function("UpdateLocation")]
        public async Task<IActionResult> UpdateLocation(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put",
                Route = "engagements/{engagementId}/locations/{locationId}")] HttpRequest req,
            string engagementId,
            string locationId)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                _logger.LogInformation("Updating location {locationId} in engagement {engagementId}", locationId, engagementId);

                if (!Guid.TryParse(engagementId, out var engagementGuid))
                    return new BadRequestObjectResult(new { error = "Invalid engagement ID" });

                if (!Guid.TryParse(locationId, out var locGuid))
                    return new BadRequestObjectResult(new { error = "Invalid location ID" });

                // Find and validate ownership
                var location = await _dbContext.Locations.FindAsync(locGuid);
                if (location == null)
                    return new NotFoundObjectResult(new { error = "Location not found" });

                if (location.EngagementId != engagementGuid)
                    return new BadRequestObjectResult(new { error = "Engagement ID mismatch" });

                // Read request body
                string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
                var request = JsonSerializer.Deserialize<UpdateLocationRequest>(requestBody, AETP.Modules.ClientEngagement.Api.Utilities.JsonOptionsHelper.CaseInsensitive);

                if (request == null)
                    return new BadRequestObjectResult(new { error = "Invalid request body" });

                // Update fields
                if (!string.IsNullOrEmpty(request.City))
                    location.City = request.City;
                if (!string.IsNullOrEmpty(request.Country))
                    location.Country = request.Country;
                if (!string.IsNullOrEmpty(request.Office))
                    location.Office = request.Office;
                if (request.Headcount.HasValue)
                    location.Headcount = request.Headcount;
                if (request.IsHeadquarters.HasValue)
                    location.IsHeadquarters = request.IsHeadquarters.Value;
                if (!string.IsNullOrEmpty(request.Status))
                    location.Status = request.Status;

                // Validate and save
                if (!location.Validate())
                    return new BadRequestObjectResult(new { error = "Invalid Location data" });

                _dbContext.Locations.Update(location);
                await _dbContext.SaveChangesAsync();

                var dto = MapToDto(location);
                return new OkObjectResult(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating location");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Deletes a Location
        /// DELETE /api/engagements/{engagementId}/locations/{locationId}
        /// </summary>
        [Function("DeleteLocation")]
        public async Task<IActionResult> DeleteLocation(
            [HttpTrigger(AuthorizationLevel.Anonymous, "delete", "options",
                Route = "engagements/{engagementId}/locations/{locationId}")] HttpRequest req,
            string engagementId,
            string locationId)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                _logger.LogInformation("Deleting location {locationId} from engagement {engagementId}", locationId, engagementId);

                if (!Guid.TryParse(engagementId, out var engagementGuid))
                    return new BadRequestObjectResult(new { error = "Invalid engagement ID" });

                if (!Guid.TryParse(locationId, out var locGuid))
                    return new BadRequestObjectResult(new { error = "Invalid location ID" });

                // Find and validate ownership
                var location = await _dbContext.Locations.FindAsync(locGuid);
                if (location == null)
                    return new NotFoundObjectResult(new { error = "Location not found" });

                if (location.EngagementId != engagementGuid)
                    return new BadRequestObjectResult(new { error = "Engagement ID mismatch" });

                // Delete
                _dbContext.Locations.Remove(location);
                await _dbContext.SaveChangesAsync();

                return new NoContentResult();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting location");
                return new StatusCodeResult(500);
            }
        }

        private LocationDto MapToDto(Location entity)
        {
            return new LocationDto
            {
                Id = entity.Id,
                EngagementId = entity.EngagementId,
                CompanyProfileId = entity.CompanyProfileId,
                City = entity.City,
                Country = entity.Country,
                Office = entity.Office,
                Headcount = entity.Headcount,
                IsHeadquarters = entity.IsHeadquarters,
                Status = entity.Status,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt
            };
        }
    }
}
