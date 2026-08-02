using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AETP.Modules.Capability.Domain;
using AETP.Modules.Capability.Infrastructure;
using AETP.Modules.ClientEngagement.Api.DTOs;
using AETP.Modules.ClientEngagement.Api.Utilities;
using System.Text.Json;

namespace AETP.Modules.ClientEngagement.Api.Functions
{
    /// <summary>
    /// Endpoints for the "Capacidades Empresariales" (Business Capability) intake
    /// form — dimension 2.2 of the "Diagnóstico y Madurez Actual" assessment. Each
    /// capability (e.g. "Marketing", "Gestión de Pedidos") is stored as its own row.
    /// </summary>
    public class BusinessCapabilityFunctions
    {
        private readonly CapabilityDbContext _dbContext;
        private readonly ILogger<BusinessCapabilityFunctions> _logger;

        public BusinessCapabilityFunctions(CapabilityDbContext dbContext, ILogger<BusinessCapabilityFunctions> logger)
        {
            _dbContext = dbContext;
            _logger = logger;
        }

        /// <summary>
        /// Creates a new Business Capability with its Processes/KPIs/Findings.
        /// POST /api/engagements/{engagementId}/capabilities
        /// </summary>
        [Function("CreateCapability")]
        public async Task<IActionResult> CreateCapability(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", "options",
                Route = "engagements/{engagementId}/capabilities")] HttpRequest req,
            string engagementId)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                if (!Guid.TryParse(engagementId, out var engagementGuid))
                    return new BadRequestObjectResult(new { error = "Invalid engagement ID" });

                var body = await new StreamReader(req.Body).ReadToEndAsync();
                var request = JsonSerializer.Deserialize<CreateCapabilityRequest>(body, JsonOptionsHelper.CaseInsensitive);

                if (request == null || string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.BusinessDomain))
                    return new BadRequestObjectResult(new { error = "Name and BusinessDomain are required" });

                var capability = BusinessCapability.Create(engagementGuid, request.Name, request.BusinessDomain);
                ApplyRequestToCapability(capability, request);

                foreach (var k in request.Kpis)
                {
                    var kpi = CapabilityKpi.Create(engagementGuid, capability.Id, k.Name);
                    kpi.CurrentValue = k.CurrentValue;
                    kpi.Target = k.Target;
                    kpi.Unit = k.Unit;
                    capability.Kpis.Add(kpi);
                }

                _dbContext.BusinessCapabilities.Add(capability);
                await _dbContext.SaveChangesAsync();

                var dto = MapToDto(capability);
                return new CreatedResult($"/api/capabilities/{capability.Id}", dto);
            }
            catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("IX_") == true || ex.InnerException?.Message.Contains("duplicate", StringComparison.OrdinalIgnoreCase) == true)
            {
                _logger.LogWarning(ex, "Duplicate capability name for engagement {engagementId}", engagementId);
                return new ConflictObjectResult(new { error = "Ya existe una capacidad con ese nombre en este engagement" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating capability");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Lists all Business Capabilities for an engagement.
        /// GET /api/engagements/{engagementId}/capabilities
        /// </summary>
        [Function("ListCapabilities")]
        public async Task<IActionResult> ListCapabilities(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get",
                Route = "engagements/{engagementId}/capabilities")] HttpRequest req,
            string engagementId)
        {
            CorsHelper.SetCorsHeaders(req.HttpContext.Response);
            try
            {
                if (!Guid.TryParse(engagementId, out var engagementGuid))
                    return new BadRequestObjectResult(new { error = "Invalid engagement ID" });

                var capabilities = await _dbContext.BusinessCapabilities
                    .Include(c => c.Kpis)
                    .Where(c => c.EngagementId == engagementGuid)
                    .OrderBy(c => c.Name)
                    .ToListAsync();

                return new OkObjectResult(capabilities.Select(MapToDto));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error listing capabilities");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Gets a single Business Capability by ID.
        /// GET /api/capabilities/{id}
        /// </summary>
        [Function("GetCapability")]
        public async Task<IActionResult> GetCapability(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get",
                Route = "capabilities/{id}")] HttpRequest req,
            string id)
        {
            CorsHelper.SetCorsHeaders(req.HttpContext.Response);
            try
            {
                if (!Guid.TryParse(id, out var capabilityGuid))
                    return new BadRequestObjectResult(new { error = "Invalid capability ID" });

                var capability = await _dbContext.BusinessCapabilities
                    .Include(c => c.Kpis)
                    .FirstOrDefaultAsync(c => c.Id == capabilityGuid);

                if (capability == null)
                    return new NotFoundObjectResult(new { error = "Capability not found" });

                return new OkObjectResult(MapToDto(capability));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting capability");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Updates a Business Capability, replacing its Processes/KPIs/Findings
        /// with whatever is sent in the request (full-form-save semantics).
        /// PUT /api/capabilities/{id}
        /// </summary>
        [Function("UpdateCapability")]
        public async Task<IActionResult> UpdateCapability(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", "options",
                Route = "capabilities/{id}")] HttpRequest req,
            string id)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                if (!Guid.TryParse(id, out var capabilityGuid))
                    return new BadRequestObjectResult(new { error = "Invalid capability ID" });

                var capability = await _dbContext.BusinessCapabilities
                    .Include(c => c.Kpis)
                    .FirstOrDefaultAsync(c => c.Id == capabilityGuid);

                if (capability == null)
                    return new NotFoundObjectResult(new { error = "Capability not found" });

                var body = await new StreamReader(req.Body).ReadToEndAsync();
                var request = JsonSerializer.Deserialize<CreateCapabilityRequest>(body, JsonOptionsHelper.CaseInsensitive);

                if (request == null || string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.BusinessDomain))
                    return new BadRequestObjectResult(new { error = "Name and BusinessDomain are required" });

                capability.Name = request.Name;
                capability.BusinessDomain = request.BusinessDomain;
                ApplyRequestToCapability(capability, request);

                _dbContext.CapabilityKpis.RemoveRange(capability.Kpis);
                capability.Kpis.Clear();

                foreach (var k in request.Kpis)
                {
                    var kpi = CapabilityKpi.Create(capability.EngagementId, capability.Id, k.Name);
                    kpi.CurrentValue = k.CurrentValue;
                    kpi.Target = k.Target;
                    kpi.Unit = k.Unit;
                    capability.Kpis.Add(kpi);
                }

                await _dbContext.SaveChangesAsync();

                return new OkObjectResult(MapToDto(capability));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating capability");
                return new StatusCodeResult(500);
            }
        }

        private static void ApplyRequestToCapability(BusinessCapability capability, CreateCapabilityRequest request)
        {
            capability.Description = request.Description;
            capability.Owner = request.Owner;
            capability.ResponsibleArea = request.ResponsibleArea;

            capability.RelatedStrategicObjective = request.RelatedStrategicObjective;
            capability.StrategicPriority = request.StrategicPriority;
            capability.BusinessContribution = request.BusinessContribution;
            capability.ExpectedImpact = request.ExpectedImpact;

            capability.MaturityLevel = request.MaturityLevel;
            capability.PerformanceLevel = request.PerformanceLevel;
            capability.DigitalizationLevel = request.DigitalizationLevel;

            capability.AutomationPotentialPercent = request.AutomationPotentialPercent;
            capability.AiAgentPotential = request.AiAgentPotential;
            capability.TargetAutonomyLevel = request.TargetAutonomyLevel;

            capability.MainProblems = request.MainProblems;
            capability.MainOpportunities = request.MainOpportunities;
            capability.Observations = request.Observations;

            if (!string.IsNullOrWhiteSpace(request.Status))
                capability.Status = request.Status;
        }

        private static CapabilityDto MapToDto(BusinessCapability c) => new()
        {
            Id = c.Id,
            EngagementId = c.EngagementId,
            Name = c.Name,
            Description = c.Description,
            BusinessDomain = c.BusinessDomain,
            Owner = c.Owner,
            ResponsibleArea = c.ResponsibleArea,
            RelatedStrategicObjective = c.RelatedStrategicObjective,
            StrategicPriority = c.StrategicPriority,
            BusinessContribution = c.BusinessContribution,
            ExpectedImpact = c.ExpectedImpact,
            MaturityLevel = c.MaturityLevel,
            PerformanceLevel = c.PerformanceLevel,
            DigitalizationLevel = c.DigitalizationLevel,
            Kpis = c.Kpis.Select(k => new CapabilityKpiDto
            {
                Id = k.Id,
                Name = k.Name,
                CurrentValue = k.CurrentValue,
                Target = k.Target,
                Unit = k.Unit
            }).ToList(),
            AutomationPotentialPercent = c.AutomationPotentialPercent,
            AiAgentPotential = c.AiAgentPotential,
            TargetAutonomyLevel = c.TargetAutonomyLevel,
            MainProblems = c.MainProblems,
            MainOpportunities = c.MainOpportunities,
            Observations = c.Observations,
            Status = c.Status,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt
        };
    }
}
