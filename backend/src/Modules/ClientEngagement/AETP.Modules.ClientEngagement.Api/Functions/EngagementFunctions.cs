using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using AETP.Modules.ClientEngagement.Domain;
using AETP.Modules.ClientEngagement.Infrastructure;
using AETP.Modules.ClientEngagement.Api.DTOs;
using AETP.Modules.ClientEngagement.Api.Utilities;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace AETP.Modules.ClientEngagement.Api.Functions
{
    internal static class StrategicListCategories
    {
        public const string ValorActual = "valorActual";
        public const string ClientesObjetivo = "clientesObjetivo";
        public const string Crecimiento = "crecimiento";
        public const string Eficiencia = "eficiencia";
        public const string Calidad = "calidad";
        public const string Innovacion = "innovacion";
        public const string Principles = "principles";
    }

    public class EngagementFunctions
    {
        private readonly ClientEngagementDbContext _dbContext;
        private readonly ILogger<EngagementFunctions> _logger;

        public EngagementFunctions(
            ClientEngagementDbContext dbContext,
            ILogger<EngagementFunctions> logger)
        {
            _dbContext = dbContext;
            _logger = logger;
        }

        /// <summary>
        /// Creates a new Engagement for a ClientOrganization.
        /// POST /api/clients/{clientId}/engagements
        /// </summary>
        [Function("CreateEngagement")]
        public async Task<IActionResult> CreateEngagement(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", "options", Route = "clients/{clientId}/engagements")] HttpRequest req,
            string clientId)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                if (!Guid.TryParse(clientId, out var clientGuid))
                    return new BadRequestObjectResult(new { error = "Invalid client ID" });

                var client = await _dbContext.ClientOrganizations.FindAsync(clientGuid);
                if (client == null)
                    return new NotFoundObjectResult(new { error = "Client organization not found" });

                string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
                var request = JsonSerializer.Deserialize<CreateEngagementRequest>(requestBody, AETP.Modules.ClientEngagement.Api.Utilities.JsonOptionsHelper.CaseInsensitive);

                if (request == null || string.IsNullOrWhiteSpace(request.Name))
                    return new BadRequestObjectResult(new { error = "El nombre del engagement es requerido" });

                var engagement = Engagement.Create(clientGuid, request.Name.Trim(), request.Description);

                _dbContext.Engagements.Add(engagement);
                await _dbContext.SaveChangesAsync();

                var dto = new EngagementDto
                {
                    Id = engagement.Id,
                    ClientOrganizationId = engagement.ClientOrganizationId,
                    Name = engagement.Name,
                    Description = engagement.Description,
                    Status = engagement.Status,
                    CreatedAt = engagement.CreatedAt,
                };
                return new CreatedResult($"/api/clients/{clientId}/engagements/{engagement.Id}", dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating Engagement");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Gets mission/vision data for an Engagement.
        /// GET /api/engagements/{engagementId}/mission-vision
        /// </summary>
        [Function("GetEngagementMissionVision")]
        public async Task<IActionResult> GetEngagementMissionVision(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "engagements/{engagementId}/mission-vision")] HttpRequest req,
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

                var listItems = await _dbContext.StrategicListItems
                    .Where(i => i.EngagementId == engagementGuid)
                    .OrderBy(i => i.DisplayOrder)
                    .ToListAsync();

                List<string> GetCategory(string category) => listItems
                    .Where(i => i.Category == category)
                    .Select(i => i.Value)
                    .ToList();

                var principles = GetCategory(StrategicListCategories.Principles);
                if (!principles.Any() && !string.IsNullOrWhiteSpace(engagement.TransformationPrinciples))
                {
                    principles = engagement.TransformationPrinciples
                        .Split('\n', StringSplitOptions.RemoveEmptyEntries)
                        .Select(p => p.Trim())
                        .Where(p => !string.IsNullOrWhiteSpace(p))
                        .ToList();
                }

                return new OkObjectResult(new EngagementMissionVisionDto
                {
                    EngagementId = engagement.Id,
                    StrategyTitle = engagement.StrategyTitle,
                    CompanyName = engagement.StrategyCompanyName,
                    Sector = engagement.StrategySector,
                    DirectionGeneral = engagement.StrategyDirectionGeneral,
                    Mission = engagement.MissionStatement,
                    Vision = engagement.VisionStatement,
                    VisionObjetivo = engagement.VisionObjetivo,
                    AutomationTargets = new AutomationTargetsDto
                    {
                        AtencionCliente = engagement.AutoTargetAtencionClientePct,
                        Finanzas = engagement.AutoTargetFinanzasPct,
                        RecursosHumanos = engagement.AutoTargetRecursosHumanosPct,
                        Marketing = engagement.AutoTargetMarketingPct,
                        Ventas = engagement.AutoTargetVentasPct,
                        Operaciones = engagement.AutoTargetOperacionesPct,
                        AnaliticaReportes = engagement.AutoTargetAnaliticaReportesPct,
                    },
                    ValorActual = GetCategory(StrategicListCategories.ValorActual),
                    ClientesObjetivo = GetCategory(StrategicListCategories.ClientesObjetivo),
                    Crecimiento = GetCategory(StrategicListCategories.Crecimiento),
                    Eficiencia = GetCategory(StrategicListCategories.Eficiencia),
                    Calidad = GetCategory(StrategicListCategories.Calidad),
                    Innovacion = GetCategory(StrategicListCategories.Innovacion),
                    Principles = principles,
                    DeclaracionFinal = engagement.StrategicFinalDeclaration,
                    CreatedAt = engagement.CreatedAt,
                    UpdatedAt = engagement.UpdatedAt,
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting engagement mission vision");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Saves mission/vision data for an Engagement.
        /// PUT /api/engagements/{engagementId}/mission-vision
        /// </summary>
        [Function("SaveEngagementMissionVision")]
        public async Task<IActionResult> SaveEngagementMissionVision(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", "options", Route = "engagements/{engagementId}/mission-vision")] HttpRequest req,
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
                var request = JsonSerializer.Deserialize<SaveEngagementMissionVisionRequest>(requestBody, JsonOptionsHelper.CaseInsensitive);

                if (request == null)
                    return new BadRequestObjectResult(new { error = "Invalid request body" });

                if (string.IsNullOrWhiteSpace(request.Mission))
                    return new BadRequestObjectResult(new { error = "Mission is required" });

                if (string.IsNullOrWhiteSpace(request.Vision))
                    return new BadRequestObjectResult(new { error = "Vision is required" });

                request.AutomationTargets ??= new AutomationTargetsDto();

                engagement.StrategyTitle = request.StrategyTitle?.Trim();
                engagement.StrategyCompanyName = request.CompanyName?.Trim();
                engagement.StrategySector = request.Sector?.Trim();
                engagement.StrategyDirectionGeneral = request.DirectionGeneral?.Trim();
                engagement.MissionStatement = request.Mission.Trim();
                engagement.VisionStatement = request.Vision.Trim();
                engagement.VisionObjetivo = request.VisionObjetivo?.Trim();
                engagement.AutoTargetAtencionClientePct = request.AutomationTargets.AtencionCliente;
                engagement.AutoTargetFinanzasPct = request.AutomationTargets.Finanzas;
                engagement.AutoTargetRecursosHumanosPct = request.AutomationTargets.RecursosHumanos;
                engagement.AutoTargetMarketingPct = request.AutomationTargets.Marketing;
                engagement.AutoTargetVentasPct = request.AutomationTargets.Ventas;
                engagement.AutoTargetOperacionesPct = request.AutomationTargets.Operaciones;
                engagement.AutoTargetAnaliticaReportesPct = request.AutomationTargets.AnaliticaReportes;
                engagement.TransformationPrinciples = string.Join("\n", request.Principles
                    .Where(p => !string.IsNullOrWhiteSpace(p))
                    .Select(p => p.Trim()));
                engagement.StrategicFinalDeclaration = request.DeclaracionFinal?.Trim();
                engagement.Touch();

                var existingItems = await _dbContext.StrategicListItems
                    .Where(i => i.EngagementId == engagementGuid)
                    .ToListAsync();
                _dbContext.StrategicListItems.RemoveRange(existingItems);

                List<StrategicListItem> BuildItems(IEnumerable<string> values, string category)
                {
                    return values
                        .Where(v => !string.IsNullOrWhiteSpace(v))
                        .Select(v => v.Trim())
                        .Select((v, idx) => StrategicListItem.Create(engagementGuid, category, v, idx + 1))
                        .ToList();
                }

                var allItems = new List<StrategicListItem>();
                allItems.AddRange(BuildItems(request.ValorActual, StrategicListCategories.ValorActual));
                allItems.AddRange(BuildItems(request.ClientesObjetivo, StrategicListCategories.ClientesObjetivo));
                allItems.AddRange(BuildItems(request.Crecimiento, StrategicListCategories.Crecimiento));
                allItems.AddRange(BuildItems(request.Eficiencia, StrategicListCategories.Eficiencia));
                allItems.AddRange(BuildItems(request.Calidad, StrategicListCategories.Calidad));
                allItems.AddRange(BuildItems(request.Innovacion, StrategicListCategories.Innovacion));
                allItems.AddRange(BuildItems(request.Principles, StrategicListCategories.Principles));
                await _dbContext.StrategicListItems.AddRangeAsync(allItems);

                await _dbContext.SaveChangesAsync();

                return new OkObjectResult(new EngagementMissionVisionDto
                {
                    EngagementId = engagement.Id,
                    StrategyTitle = engagement.StrategyTitle,
                    CompanyName = engagement.StrategyCompanyName,
                    Sector = engagement.StrategySector,
                    DirectionGeneral = engagement.StrategyDirectionGeneral,
                    Mission = engagement.MissionStatement,
                    Vision = engagement.VisionStatement,
                    VisionObjetivo = engagement.VisionObjetivo,
                    AutomationTargets = new AutomationTargetsDto
                    {
                        AtencionCliente = engagement.AutoTargetAtencionClientePct,
                        Finanzas = engagement.AutoTargetFinanzasPct,
                        RecursosHumanos = engagement.AutoTargetRecursosHumanosPct,
                        Marketing = engagement.AutoTargetMarketingPct,
                        Ventas = engagement.AutoTargetVentasPct,
                        Operaciones = engagement.AutoTargetOperacionesPct,
                        AnaliticaReportes = engagement.AutoTargetAnaliticaReportesPct,
                    },
                    ValorActual = request.ValorActual.Where(v => !string.IsNullOrWhiteSpace(v)).Select(v => v.Trim()).ToList(),
                    ClientesObjetivo = request.ClientesObjetivo.Where(v => !string.IsNullOrWhiteSpace(v)).Select(v => v.Trim()).ToList(),
                    Crecimiento = request.Crecimiento.Where(v => !string.IsNullOrWhiteSpace(v)).Select(v => v.Trim()).ToList(),
                    Eficiencia = request.Eficiencia.Where(v => !string.IsNullOrWhiteSpace(v)).Select(v => v.Trim()).ToList(),
                    Calidad = request.Calidad.Where(v => !string.IsNullOrWhiteSpace(v)).Select(v => v.Trim()).ToList(),
                    Innovacion = request.Innovacion.Where(v => !string.IsNullOrWhiteSpace(v)).Select(v => v.Trim()).ToList(),
                    Principles = request.Principles
                        .Where(p => !string.IsNullOrWhiteSpace(p))
                        .Select(p => p.Trim())
                        .ToList(),
                    DeclaracionFinal = engagement.StrategicFinalDeclaration,
                    CreatedAt = engagement.CreatedAt,
                    UpdatedAt = engagement.UpdatedAt,
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving engagement mission vision");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Gets mandate data for an Engagement.
        /// GET /api/engagements/{engagementId}/mandate
        /// </summary>
        [Function("GetEngagementMandate")]
        public async Task<IActionResult> GetEngagementMandate(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "engagements/{engagementId}/mandate")] HttpRequest req,
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

                var stakeholders = await _dbContext.MandateStakeholders
                    .Where(s => s.EngagementId == engagementGuid)
                    .OrderBy(s => s.CreatedAt)
                    .Select(s => new MandateStakeholderItemDto
                    {
                        Stakeholder = s.Name,
                        Role = s.Role,
                    })
                    .ToListAsync();

                var dto = new EngagementMandateDto
                {
                    EngagementId = engagement.Id,
                    Title = engagement.Name,
                    Objective = engagement.TransformationMandate,
                    IncludedScope = engagement.Scope,
                    ExcludedScope = engagement.OutOfScope,
                    ExecutiveSponsor = engagement.ExecutiveSponsor,
                    SponsorResponsibilities = engagement.SponsorResponsibilities,
                    ExpectedOutcomes = engagement.ExpectedOutcomes,
                    SuccessCriteria = engagement.SuccessCriteria,
                    HorizonMinMonths = engagement.HorizonMinMonths,
                    HorizonMaxMonths = engagement.HorizonMaxMonths,
                    RevenueGrowthTargetPct = engagement.RevenueGrowthTargetPct,
                    CostReductionTargetPct = engagement.CostReductionTargetPct,
                    ProductivityImprovementTargetPct = engagement.ProductivityImprovementTargetPct,
                    SlaImprovementTargetPct = engagement.SlaImprovementTargetPct,
                    Stakeholders = stakeholders,
                    CreatedAt = engagement.CreatedAt,
                    UpdatedAt = engagement.UpdatedAt,
                };

                return new OkObjectResult(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting engagement mandate");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Saves mandate data for an Engagement.
        /// PUT /api/engagements/{engagementId}/mandate
        /// </summary>
        [Function("SaveEngagementMandate")]
        public async Task<IActionResult> SaveEngagementMandate(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", "options", Route = "engagements/{engagementId}/mandate")] HttpRequest req,
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
                var request = JsonSerializer.Deserialize<SaveEngagementMandateRequest>(requestBody, JsonOptionsHelper.CaseInsensitive);

                if (request == null)
                    return new BadRequestObjectResult(new { error = "Invalid request body" });

                if (request.HorizonMinMonths.HasValue && request.HorizonMinMonths.Value < 1)
                    return new BadRequestObjectResult(new { error = "HorizonMinMonths must be >= 1" });

                if (request.HorizonMaxMonths.HasValue && request.HorizonMaxMonths.Value < 1)
                    return new BadRequestObjectResult(new { error = "HorizonMaxMonths must be >= 1" });

                if (request.HorizonMinMonths.HasValue && request.HorizonMaxMonths.HasValue &&
                    request.HorizonMinMonths.Value > request.HorizonMaxMonths.Value)
                    return new BadRequestObjectResult(new { error = "HorizonMaxMonths must be >= HorizonMinMonths" });

                engagement.Name = string.IsNullOrWhiteSpace(request.Title) ? engagement.Name : request.Title.Trim();
                engagement.TransformationMandate = request.Objective?.Trim();
                engagement.Scope = request.IncludedScope?.Trim();
                engagement.OutOfScope = request.ExcludedScope?.Trim();
                engagement.ExecutiveSponsor = request.ExecutiveSponsor?.Trim();
                engagement.SponsorResponsibilities = request.SponsorResponsibilities?.Trim();
                engagement.ExpectedOutcomes = request.ExpectedOutcomes?.Trim();
                engagement.SuccessCriteria = request.SuccessCriteria?.Trim();
                engagement.HorizonMinMonths = request.HorizonMinMonths;
                engagement.HorizonMaxMonths = request.HorizonMaxMonths;
                engagement.RevenueGrowthTargetPct = request.RevenueGrowthTargetPct;
                engagement.CostReductionTargetPct = request.CostReductionTargetPct;
                engagement.ProductivityImprovementTargetPct = request.ProductivityImprovementTargetPct;
                engagement.SlaImprovementTargetPct = request.SlaImprovementTargetPct;
                engagement.Touch();

                var existingStakeholders = await _dbContext.MandateStakeholders
                    .Where(s => s.EngagementId == engagementGuid)
                    .ToListAsync();
                _dbContext.MandateStakeholders.RemoveRange(existingStakeholders);

                var cleanStakeholders = request.Stakeholders
                    .Where(s => !string.IsNullOrWhiteSpace(s.Stakeholder) && !string.IsNullOrWhiteSpace(s.Role))
                    .Select(s => MandateStakeholder.Create(engagementGuid, s.Stakeholder.Trim(), s.Role.Trim()))
                    .ToList();

                await _dbContext.MandateStakeholders.AddRangeAsync(cleanStakeholders);
                await _dbContext.SaveChangesAsync();

                var response = new EngagementMandateDto
                {
                    EngagementId = engagement.Id,
                    Title = engagement.Name,
                    Objective = engagement.TransformationMandate,
                    IncludedScope = engagement.Scope,
                    ExcludedScope = engagement.OutOfScope,
                    ExecutiveSponsor = engagement.ExecutiveSponsor,
                    SponsorResponsibilities = engagement.SponsorResponsibilities,
                    ExpectedOutcomes = engagement.ExpectedOutcomes,
                    SuccessCriteria = engagement.SuccessCriteria,
                    HorizonMinMonths = engagement.HorizonMinMonths,
                    HorizonMaxMonths = engagement.HorizonMaxMonths,
                    RevenueGrowthTargetPct = engagement.RevenueGrowthTargetPct,
                    CostReductionTargetPct = engagement.CostReductionTargetPct,
                    ProductivityImprovementTargetPct = engagement.ProductivityImprovementTargetPct,
                    SlaImprovementTargetPct = engagement.SlaImprovementTargetPct,
                    Stakeholders = cleanStakeholders.Select(s => new MandateStakeholderItemDto
                    {
                        Stakeholder = s.Name,
                        Role = s.Role,
                    }).ToList(),
                    CreatedAt = engagement.CreatedAt,
                    UpdatedAt = engagement.UpdatedAt,
                };

                return new OkObjectResult(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving engagement mandate");
                return new StatusCodeResult(500);
            }
        }
    }
}
