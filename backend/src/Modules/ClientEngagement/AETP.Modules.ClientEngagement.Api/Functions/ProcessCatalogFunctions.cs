using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AETP.Modules.Process.Domain;
using AETP.Modules.Process.Infrastructure;
using AETP.Modules.ClientEngagement.Api.DTOs;
using AETP.Modules.ClientEngagement.Api.Utilities;

namespace AETP.Modules.ClientEngagement.Api.Functions
{
    /// <summary>
    /// Read-only catalog endpoints (Role, EnterpriseSystem) used to populate
    /// combo boxes in the Process module's UIs (e.g. "quién lo hace", "qué
    /// sistema usa"). Full CRUD for these catalogs is out of scope here —
    /// only the GET-list needed by dependent forms.
    /// </summary>
    public class ProcessCatalogFunctions
    {
        private readonly ProcessDbContext _dbContext;
        private readonly ILogger<ProcessCatalogFunctions> _logger;

        public ProcessCatalogFunctions(ProcessDbContext dbContext, ILogger<ProcessCatalogFunctions> logger)
        {
            _dbContext = dbContext;
            _logger = logger;
        }

        /// <summary>
        /// Lists all active Roles for an engagement.
        /// GET /api/engagements/{engagementId}/roles
        /// </summary>
        [Function("ListRoles")]
        public async Task<IActionResult> ListRoles(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get",
                Route = "engagements/{engagementId}/roles")] HttpRequest req,
            string engagementId)
        {
            CorsHelper.SetCorsHeaders(req.HttpContext.Response);
            try
            {
                if (!Guid.TryParse(engagementId, out var engagementGuid))
                    return new BadRequestObjectResult(new { error = "Invalid engagement ID" });

                var roles = await _dbContext.Roles
                    .Where(r => r.EngagementId == engagementGuid)
                    .OrderBy(r => r.Name)
                    .ToListAsync();

                return new OkObjectResult(roles.Select(MapToDto));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error listing roles");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Lists all active Enterprise Systems for an engagement.
        /// GET /api/engagements/{engagementId}/enterprise-systems
        /// </summary>
        [Function("ListEnterpriseSystems")]
        public async Task<IActionResult> ListEnterpriseSystems(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get",
                Route = "engagements/{engagementId}/enterprise-systems")] HttpRequest req,
            string engagementId)
        {
            CorsHelper.SetCorsHeaders(req.HttpContext.Response);
            try
            {
                if (!Guid.TryParse(engagementId, out var engagementGuid))
                    return new BadRequestObjectResult(new { error = "Invalid engagement ID" });

                var systems = await _dbContext.EnterpriseSystems
                    .Where(s => s.EngagementId == engagementGuid)
                    .OrderBy(s => s.Name)
                    .ToListAsync();

                return new OkObjectResult(systems.Select(MapToDto));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error listing enterprise systems");
                return new StatusCodeResult(500);
            }
        }

        private static RoleDto MapToDto(Role r) => new()
        {
            Id = r.Id,
            EngagementId = r.EngagementId,
            Name = r.Name,
            RoleCategoryId = r.RoleCategoryId,
            Description = r.Description,
            Status = r.Status
        };

        private static EnterpriseSystemDto MapToDto(EnterpriseSystem s) => new()
        {
            Id = s.Id,
            EngagementId = s.EngagementId,
            Name = s.Name,
            Category = s.Category,
            Description = s.Description,
            Status = s.Status
        };
    }
}
