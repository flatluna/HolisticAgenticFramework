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
using static AETP.Modules.ClientEngagement.Api.Utilities.JsonOptionsHelper;

namespace AETP.Modules.ClientEngagement.Api.Functions
{
    public class ClientOrganizationFunctions
    {
        private readonly ClientEngagementDbContext _dbContext;
        private readonly ILogger<ClientOrganizationFunctions> _logger;

        public ClientOrganizationFunctions(
            ClientEngagementDbContext dbContext,
            ILogger<ClientOrganizationFunctions> logger)
        {
            _dbContext = dbContext;
            _logger = logger;
        }

        /// <summary>
        /// Creates a new ClientOrganization (the company being profiled).
        /// Rejects duplicate company names (case-insensitive, trimmed) with 409 Conflict.
        /// POST /api/clients
        /// </summary>
        [Function("CreateClientOrganization")]
        public async Task<IActionResult> CreateClientOrganization(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", "options", Route = "clients")] HttpRequest req)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
                var request = JsonSerializer.Deserialize<CreateClientOrganizationRequest>(requestBody, CaseInsensitive);

                if (request == null || string.IsNullOrWhiteSpace(request.Name))
                    return new BadRequestObjectResult(new { error = "El nombre de la empresa es requerido" });

                var normalizedName = request.Name.Trim();

                // Prevent duplicate company names. This check is the fast path;
                // the unique index on ClientOrganizations.Name is the source of
                // truth in case of a race between two concurrent requests.
                var exists = await _dbContext.ClientOrganizations
                    .AnyAsync(c => c.Name.ToLower() == normalizedName.ToLower());
                if (exists)
                    return new ConflictObjectResult(new { error = $"Ya existe una empresa registrada con el nombre '{normalizedName}'" });

                var client = ClientOrganization.Create(normalizedName, request.Industry, request.Country);
                if (request.EmployeeCount.HasValue)
                    client.EmployeeCount = request.EmployeeCount;

                _dbContext.ClientOrganizations.Add(client);

                try
                {
                    await _dbContext.SaveChangesAsync();
                }
                catch (DbUpdateException)
                {
                    // Lost a race with another concurrent request for the same name
                    // (the unique index rejected the insert).
                    var duplicateAfterAll = await _dbContext.ClientOrganizations
                        .AnyAsync(c => c.Name.ToLower() == normalizedName.ToLower() && c.Id != client.Id);
                    if (duplicateAfterAll)
                        return new ConflictObjectResult(new { error = $"Ya existe una empresa registrada con el nombre '{normalizedName}'" });
                    throw;
                }

                var dto = MapToDto(client);
                return new CreatedResult($"/api/clients/{client.Id}", dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating ClientOrganization");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Looks up a ClientOrganization by (case-insensitive) name, along with
        /// its most recent Engagement and CompanyProfile IDs if they exist.
        /// Used by the frontend to detect "this company already exists" and
        /// switch straight into edit mode instead of creating a duplicate.
        /// GET /api/clients/lookup/{name}
        /// </summary>
        [Function("LookupClientOrganizationByName")]
        public async Task<IActionResult> LookupClientOrganizationByName(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "clients/lookup/{name}")] HttpRequest req,
            string name)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                var normalizedName = name.Trim();

                var client = await _dbContext.ClientOrganizations
                    .FirstOrDefaultAsync(c => c.Name.ToLower() == normalizedName.ToLower());
                if (client == null)
                    return new NotFoundObjectResult(new { error = $"No existe una empresa con el nombre '{normalizedName}'" });

                var engagement = await _dbContext.Engagements
                    .Where(e => e.ClientOrganizationId == client.Id)
                    .OrderByDescending(e => e.CreatedAt)
                    .FirstOrDefaultAsync();

                Guid? companyProfileId = null;
                if (engagement != null)
                {
                    var profile = await _dbContext.CompanyProfiles
                        .Where(cp => cp.EngagementId == engagement.Id)
                        .FirstOrDefaultAsync();
                    companyProfileId = profile?.Id;
                }

                return new OkObjectResult(new
                {
                    clientOrganizationId = client.Id,
                    engagementId = engagement?.Id,
                    companyProfileId,
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error looking up ClientOrganization by name");
                return new StatusCodeResult(500);
            }
        }

        private static ClientOrganizationDto MapToDto(ClientOrganization client)
        {
            return new ClientOrganizationDto
            {
                Id = client.Id,
                Name = client.Name,
                Industry = client.Industry,
                Country = client.Country,
                EmployeeCount = client.EmployeeCount,
                Status = client.Status,
                CreatedAt = client.CreatedAt,
            };
        }
    }
}
