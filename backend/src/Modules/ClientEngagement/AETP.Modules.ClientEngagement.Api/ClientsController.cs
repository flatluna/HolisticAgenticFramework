using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AETP.Modules.ClientEngagement.Infrastructure;

namespace AETP.Modules.ClientEngagement.Api
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClientsController : ControllerBase
    {
        private readonly ClientEngagementDbContext _dbContext;
        private readonly ILogger<ClientsController> _logger;

        public ClientsController(
            ClientEngagementDbContext dbContext,
            ILogger<ClientsController> logger)
        {
            _dbContext = dbContext;
            _logger = logger;
        }

        /// <summary>
        /// Lookup client organization by name and return its most recent engagement and company profile IDs
        /// GET /api/clients/lookup/{name}
        /// </summary>
        [HttpGet("lookup/{name}")]
        public async Task<IActionResult> LookupByName(string name)
        {
            try
            {
                var normalizedName = name.Trim();

                var client = await _dbContext.ClientOrganizations
                    .FirstOrDefaultAsync(c => c.Name.ToLower() == normalizedName.ToLower());
                if (client == null)
                    return NotFound(new { error = $"No existe una empresa con el nombre '{normalizedName}'" });

                var engagement = await _dbContext.Engagements
                    .Where(e => e.ClientOrganizationId == client.Id)
                    .OrderByDescending(e => e.CreatedAt)
                    .FirstOrDefaultAsync();

                Guid? companyProfileId = null;
                if (engagement != null)
                {
                    // Try to load CompanyProfiles if this table exists in the context
                    // For now, we'll return null for companyProfileId since the table doesn't exist yet
                }

                return Ok(new
                {
                    clientOrganizationId = client.Id,
                    engagementId = engagement?.Id,
                    companyProfileId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error looking up client");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }
    }
}
