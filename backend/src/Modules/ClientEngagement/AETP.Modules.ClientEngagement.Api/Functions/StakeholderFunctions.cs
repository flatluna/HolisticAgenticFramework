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
    public class StakeholderFunctions
    {
        private readonly ClientEngagementDbContext _dbContext;
        private readonly ILogger<StakeholderFunctions> _logger;

        public StakeholderFunctions(
            ClientEngagementDbContext dbContext,
            ILogger<StakeholderFunctions> logger)
        {
            _dbContext = dbContext;
            _logger = logger;
        }

        /// <summary>
        /// Gets all Stakeholders (Org Design roles) for an engagement
        /// GET /api/engagements/{engagementId}/stakeholders
        /// </summary>
        [Function("GetStakeholders")]
        public async Task<IActionResult> GetStakeholders(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get",
                Route = "engagements/{engagementId}/stakeholders")] HttpRequest req,
            string engagementId)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                if (!Guid.TryParse(engagementId, out var engagementGuid))
                    return new BadRequestObjectResult(new { error = "Invalid engagement ID" });

                var stakeholders = await _dbContext.Stakeholders
                    .Where(s => s.EngagementId == engagementGuid)
                    .OrderBy(s => s.CreatedAt)
                    .ToListAsync();

                return new OkObjectResult(stakeholders.Select(MapToDto).ToList());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching stakeholders");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Replaces ALL Org Design roles of an engagement with the given set
        /// ("Guardar todos"). Used both for manually-edited roles and for the
        /// roles extracted from an org-chart image by the AI agent.
        /// POST /api/engagements/{engagementId}/stakeholders/bulk
        /// </summary>
        [Function("BulkSaveStakeholders")]
        public async Task<IActionResult> BulkSaveStakeholders(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", "options",
                Route = "engagements/{engagementId}/stakeholders/bulk")] HttpRequest req,
            string engagementId)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                _logger.LogInformation("Bulk-saving Org Design roles for engagement {engagementId}", engagementId);

                if (!Guid.TryParse(engagementId, out var engagementGuid))
                    return new BadRequestObjectResult(new { error = "Invalid engagement ID" });

                var engagement = await _dbContext.Engagements.FindAsync(engagementGuid);
                if (engagement == null)
                    return new NotFoundObjectResult(new { error = "Engagement not found" });

                string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
                var request = JsonSerializer.Deserialize<BulkSaveStakeholdersRequest>(requestBody, JsonOptionsHelper.CaseInsensitive);

                if (request == null || request.Roles.Count == 0)
                    return new BadRequestObjectResult(new { error = "At least one role is required" });

                if (request.Roles.Any(r => string.IsNullOrWhiteSpace(r.Name)))
                    return new BadRequestObjectResult(new { error = "Every role must have a name" });

                // Replace: remove the engagement's existing roles, then insert
                // the new set, so the table always matches exactly what's on screen.
                var existing = await _dbContext.Stakeholders
                    .Where(s => s.EngagementId == engagementGuid)
                    .ToListAsync();
                _dbContext.Stakeholders.RemoveRange(existing);

                var newStakeholders = request.Roles.Select(r => Stakeholder.CreateFromOrgRole(
                    engagementGuid,
                    r.Name,
                    r.Position,
                    r.HierarchyLevel,
                    r.ReportsTo,
                    r.ReplicaTo,
                    r.Responsibilities)).ToList();

                await _dbContext.Stakeholders.AddRangeAsync(newStakeholders);
                await _dbContext.SaveChangesAsync();

                return new OkObjectResult(newStakeholders.Select(MapToDto).ToList());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error bulk-saving stakeholders");
                return new StatusCodeResult(500);
            }
        }

        private static StakeholderDto MapToDto(Stakeholder stakeholder) => new()
        {
            Id = stakeholder.Id,
            EngagementId = stakeholder.EngagementId,
            Name = stakeholder.Name,
            Email = stakeholder.Email,
            Role = stakeholder.Role,
            Position = stakeholder.Position,
            HierarchyLevel = stakeholder.HierarchyLevel,
            ReportsTo = stakeholder.ReportsTo,
            ReplicaTo = stakeholder.ReplicaTo,
            Responsibilities = stakeholder.Responsibilities,
            Status = stakeholder.Status,
            CreatedAt = stakeholder.CreatedAt,
            UpdatedAt = stakeholder.UpdatedAt,
        };
    }
}
