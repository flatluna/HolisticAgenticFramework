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
    public class DomainDiscoveryFunctions
    {
        private readonly ClientEngagementDbContext _dbContext;
        private readonly ILogger<DomainDiscoveryFunctions> _logger;

        public DomainDiscoveryFunctions(
            ClientEngagementDbContext dbContext,
            ILogger<DomainDiscoveryFunctions> logger)
        {
            _dbContext = dbContext;
            _logger = logger;
        }

        /// <summary>
        /// Gets the selected industry and all domain evaluations (Paso 2 ·
        /// Descubrimiento y Priorización de Dominios) for an engagement.
        /// GET /api/engagements/{engagementId}/domain-discovery
        /// </summary>
        [Function("GetDomainDiscovery")]
        public async Task<IActionResult> GetDomainDiscovery(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get",
                Route = "engagements/{engagementId}/domain-discovery")] HttpRequest req,
            string engagementId)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                if (!Guid.TryParse(engagementId, out var engagementGuid))
                    return new BadRequestObjectResult(new { error = "Invalid engagement ID" });

                var settings = await _dbContext.DomainDiscoverySettings
                    .FirstOrDefaultAsync(s => s.EngagementId == engagementGuid);

                var domains = await _dbContext.DomainAssessments
                    .Where(d => d.EngagementId == engagementGuid)
                    .OrderBy(d => d.CreatedAt)
                    .ToListAsync();

                return new OkObjectResult(new DomainDiscoveryResponseDto
                {
                    SelectedIndustryId = settings?.SelectedIndustryId,
                    Domains = domains.Select(MapToDto).ToList(),
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching domain discovery assessment");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Saves (creates or updates) the selected industry for an
        /// engagement.
        /// PUT /api/engagements/{engagementId}/domain-discovery/industry
        /// </summary>
        [Function("SaveDomainDiscoveryIndustry")]
        public async Task<IActionResult> SaveDomainDiscoveryIndustry(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", "options",
                Route = "engagements/{engagementId}/domain-discovery/industry")] HttpRequest req,
            string engagementId)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                if (!Guid.TryParse(engagementId, out var engagementGuid))
                    return new BadRequestObjectResult(new { error = "Invalid engagement ID" });

                var engagement = await _dbContext.Engagements.FindAsync(engagementGuid);
                if (engagement == null)
                    return new NotFoundObjectResult(new { error = "Engagement not found" });

                string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
                var request = JsonSerializer.Deserialize<SaveIndustryRequest>(requestBody, JsonOptionsHelper.CaseInsensitive);
                if (request == null)
                    return new BadRequestObjectResult(new { error = "Request body is required" });

                var settings = await _dbContext.DomainDiscoverySettings
                    .FirstOrDefaultAsync(s => s.EngagementId == engagementGuid);

                if (settings == null)
                {
                    settings = DomainDiscoverySettings.Create(engagementGuid, request.SelectedIndustryId);
                    await _dbContext.DomainDiscoverySettings.AddAsync(settings);
                }
                else
                {
                    settings.UpdateIndustry(request.SelectedIndustryId);
                }

                await _dbContext.SaveChangesAsync();

                return new OkObjectResult(new { selectedIndustryId = settings.SelectedIndustryId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving domain discovery industry selection");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Replaces ALL domain evaluations of an engagement with the given
        /// set (autosave). Used by the Paso 2 Screen A/B.
        /// POST /api/engagements/{engagementId}/domain-discovery/bulk
        /// </summary>
        [Function("BulkSaveDomainAssessments")]
        public async Task<IActionResult> BulkSaveDomainAssessments(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", "options",
                Route = "engagements/{engagementId}/domain-discovery/bulk")] HttpRequest req,
            string engagementId)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                if (!Guid.TryParse(engagementId, out var engagementGuid))
                    return new BadRequestObjectResult(new { error = "Invalid engagement ID" });

                var engagement = await _dbContext.Engagements.FindAsync(engagementGuid);
                if (engagement == null)
                    return new NotFoundObjectResult(new { error = "Engagement not found" });

                string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
                var request = JsonSerializer.Deserialize<BulkSaveDomainAssessmentsRequest>(requestBody, JsonOptionsHelper.CaseInsensitive);
                if (request == null)
                    return new BadRequestObjectResult(new { error = "Request body is required" });

                var existing = await _dbContext.DomainAssessments
                    .Where(d => d.EngagementId == engagementGuid)
                    .ToListAsync();
                _dbContext.DomainAssessments.RemoveRange(existing);

                var newDomains = request.Domains.Select(d => DomainAssessment.Create(
                    engagementGuid,
                    d.DomainId,
                    d.BusinessContext,
                    d.ProcessInventoryJson,
                    d.SystemsInventoryJson,
                    d.StrategicValue,
                    d.TransformPotential,
                    d.Roi,
                    d.Complexity,
                    d.Urgency,
                    d.ComplexityAdjustmentOverride)).ToList();

                await _dbContext.DomainAssessments.AddRangeAsync(newDomains);
                await _dbContext.SaveChangesAsync();

                return new OkObjectResult(newDomains.Select(MapToDto).ToList());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error bulk-saving domain assessments");
                return new StatusCodeResult(500);
            }
        }

        private static DomainAssessmentDto MapToDto(DomainAssessment domain) => new()
        {
            Id = domain.Id,
            EngagementId = domain.EngagementId,
            DomainId = domain.DomainId,
            BusinessContext = domain.BusinessContext,
            ProcessInventoryJson = domain.ProcessInventoryJson,
            SystemsInventoryJson = domain.SystemsInventoryJson,
            StrategicValue = domain.StrategicValue,
            TransformPotential = domain.TransformPotential,
            Roi = domain.Roi,
            Complexity = domain.Complexity,
            Urgency = domain.Urgency,
            ComplexityAdjustmentOverride = domain.ComplexityAdjustmentOverride,
            CreatedAt = domain.CreatedAt,
            UpdatedAt = domain.UpdatedAt,
        };
    }
}
