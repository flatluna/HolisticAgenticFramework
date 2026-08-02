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
    public class OrganizationalReadinessFunctions
    {
        private readonly ClientEngagementDbContext _dbContext;
        private readonly ILogger<OrganizationalReadinessFunctions> _logger;

        public OrganizationalReadinessFunctions(
            ClientEngagementDbContext dbContext,
            ILogger<OrganizationalReadinessFunctions> logger)
        {
            _dbContext = dbContext;
            _logger = logger;
        }

        /// <summary>
        /// Gets all pillar evaluations (Paso 1 · Assessment de Preparación
        /// Organizacional) for an engagement.
        /// GET /api/engagements/{engagementId}/organizational-readiness
        /// </summary>
        [Function("GetOrganizationalReadiness")]
        public async Task<IActionResult> GetOrganizationalReadiness(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get",
                Route = "engagements/{engagementId}/organizational-readiness")] HttpRequest req,
            string engagementId)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                if (!Guid.TryParse(engagementId, out var engagementGuid))
                    return new BadRequestObjectResult(new { error = "Invalid engagement ID" });

                var pillars = await _dbContext.OrganizationalReadinessPillars
                    .Where(p => p.EngagementId == engagementGuid)
                    .OrderBy(p => p.CreatedAt)
                    .ToListAsync();

                return new OkObjectResult(pillars.Select(MapToDto).ToList());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching organizational readiness assessment");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Replaces ALL pillar evaluations of an engagement with the given
        /// set (autosave). Used by the Paso 1 assessment screen.
        /// POST /api/engagements/{engagementId}/organizational-readiness/bulk
        /// </summary>
        [Function("BulkSaveOrganizationalReadiness")]
        public async Task<IActionResult> BulkSaveOrganizationalReadiness(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", "options",
                Route = "engagements/{engagementId}/organizational-readiness/bulk")] HttpRequest req,
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
                var request = JsonSerializer.Deserialize<BulkSaveOrganizationalReadinessRequest>(requestBody, JsonOptionsHelper.CaseInsensitive);

                if (request == null)
                    return new BadRequestObjectResult(new { error = "Request body is required" });

                // Replace: remove the engagement's existing pillar rows, then
                // insert the new set, so the table always matches exactly what's
                // shown on screen (same pattern as Org Design "Guardar todos").
                var existing = await _dbContext.OrganizationalReadinessPillars
                    .Where(p => p.EngagementId == engagementGuid)
                    .ToListAsync();
                _dbContext.OrganizationalReadinessPillars.RemoveRange(existing);

                var newPillars = request.Pillars.Select(p => OrganizationalReadinessPillar.Create(
                    engagementGuid,
                    p.PillarId,
                    p.Level,
                    p.Notes,
                    p.EvidenceGroupsJson)).ToList();

                await _dbContext.OrganizationalReadinessPillars.AddRangeAsync(newPillars);
                await _dbContext.SaveChangesAsync();

                return new OkObjectResult(newPillars.Select(MapToDto).ToList());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error bulk-saving organizational readiness assessment");
                return new StatusCodeResult(500);
            }
        }

        private static OrganizationalReadinessPillarDto MapToDto(OrganizationalReadinessPillar pillar) => new()
        {
            Id = pillar.Id,
            EngagementId = pillar.EngagementId,
            PillarId = pillar.PillarId,
            Level = pillar.Level,
            Notes = pillar.Notes,
            EvidenceGroupsJson = pillar.EvidenceGroupsJson,
            CreatedAt = pillar.CreatedAt,
            UpdatedAt = pillar.UpdatedAt,
        };
    }
}
