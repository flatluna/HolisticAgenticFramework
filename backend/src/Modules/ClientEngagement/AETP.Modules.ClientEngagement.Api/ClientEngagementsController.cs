using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AETP.Modules.ClientEngagement.Infrastructure;
using AETP.Modules.ClientEngagement.Domain;

namespace AETP.Modules.ClientEngagement.Api
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClientEngagementsController : ControllerBase
    {
        private readonly ClientEngagementDbContext _dbContext;
        private readonly ILogger<ClientEngagementsController> _logger;

        public ClientEngagementsController(
            ClientEngagementDbContext dbContext,
            ILogger<ClientEngagementsController> logger)
        {
            _dbContext = dbContext;
            _logger = logger;
        }

        /// <summary>
        /// Get all client organizations
        /// </summary>
        [HttpGet("clients")]
        public async Task<IActionResult> GetClients()
        {
            try
            {
                var clients = await _dbContext.ClientOrganizations.ToListAsync();
                return Ok(clients);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching clients");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>
        /// Lookup client organization by name and return its most recent engagement and company profile IDs
        /// GET /api/clientengagements/clients/lookup/{name}
        /// </summary>
        [HttpGet("clients/lookup/{name}")]
        public async Task<IActionResult> LookupClientByName(string name)
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
                    var profileQuery = _dbContext.Set<dynamic>();
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

        /// <summary>
        /// Create a new client organization
        /// </summary>
        [HttpPost("clients")]
        public async Task<IActionResult> CreateClient([FromBody] CreateClientRequest request)
        {
            try
            {
                var client = ClientOrganization.Create(
                    request.Name,
                    request.Industry,
                    request.Country);

                _dbContext.ClientOrganizations.Add(client);
                await _dbContext.SaveChangesAsync();

                return CreatedAtAction(nameof(GetClientById), new { id = client.Id }, client);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating client");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>
        /// Get client by ID
        /// </summary>
        [HttpGet("clients/{id}")]
        public async Task<IActionResult> GetClientById(Guid id)
        {
            try
            {
                var client = await _dbContext.ClientOrganizations
                    .Include(c => c.Engagements)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (client == null)
                    return NotFound();

                return Ok(client);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching client");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>
        /// Get all engagements for a client
        /// </summary>
        [HttpGet("engagements")]
        public async Task<IActionResult> GetEngagements([FromQuery] Guid? clientId = null)
        {
            try
            {
                var query = _dbContext.Engagements.AsQueryable();

                if (clientId.HasValue)
                    query = query.Where(e => e.ClientOrganizationId == clientId);

                var engagements = await query.ToListAsync();
                return Ok(engagements);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching engagements");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>
        /// Create a new engagement
        /// </summary>
        [HttpPost("engagements")]
        public async Task<IActionResult> CreateEngagement([FromBody] CreateEngagementRequest request)
        {
            try
            {
                var engagement = Engagement.Create(
                    request.ClientOrganizationId,
                    request.Name,
                    request.Description);

                _dbContext.Engagements.Add(engagement);
                await _dbContext.SaveChangesAsync();

                return CreatedAtAction(nameof(GetEngagementById), new { id = engagement.Id }, engagement);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating engagement");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>
        /// Get engagement by ID
        /// </summary>
        [HttpGet("engagements/{id}")]
        public async Task<IActionResult> GetEngagementById(Guid id)
        {
            try
            {
                var engagement = await _dbContext.Engagements
                    .Include(e => e.Stakeholders)
                    .FirstOrDefaultAsync(e => e.Id == id);

                if (engagement == null)
                    return NotFound();

                return Ok(engagement);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching engagement");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>
        /// Add a stakeholder to an engagement
        /// </summary>
        [HttpPost("engagements/{engagementId}/stakeholders")]
        public async Task<IActionResult> AddStakeholder(Guid engagementId, [FromBody] AddStakeholderRequest request)
        {
            try
            {
                var engagement = await _dbContext.Engagements.FindAsync(engagementId);
                if (engagement == null)
                    return NotFound("Engagement not found");

                var stakeholder = Stakeholder.Create(
                    engagementId,
                    request.Name,
                    request.Email,
                    request.Role);

                _dbContext.Stakeholders.Add(stakeholder);
                await _dbContext.SaveChangesAsync();

                return CreatedAtAction(nameof(GetEngagementById), new { id = engagementId }, stakeholder);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding stakeholder");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }
    }

    // DTOs
    public class CreateClientRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Industry { get; set; }
        public string? Country { get; set; }
    }

    public class CreateEngagementRequest
    {
        public Guid ClientOrganizationId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class AddStakeholderRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Role { get; set; }
    }
}
