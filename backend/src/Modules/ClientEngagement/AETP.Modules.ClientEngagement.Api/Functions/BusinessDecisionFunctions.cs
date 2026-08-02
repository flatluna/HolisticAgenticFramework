using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AETP.Modules.Decision.Domain;
using AETP.Modules.Decision.Infrastructure;
using AETP.Modules.Process.Infrastructure;
using AETP.Modules.ClientEngagement.Api.Agents;
using AETP.Modules.ClientEngagement.Api.DTOs;
using AETP.Modules.ClientEngagement.Api.Utilities;
using System.Text.Json;

namespace AETP.Modules.ClientEngagement.Api.Functions
{
    /// <summary>
    /// Endpoints for the "Decisiones" intake form — dimension 2.4 of the
    /// "Diagnóstico y Madurez Actual" assessment. Cada decisión pertenece a
    /// exactamente un Business Process (el proceso donde ocurre).
    /// </summary>
    public class BusinessDecisionFunctions
    {
        private readonly DecisionDbContext _dbContext;
        private readonly ProcessDbContext _processDbContext;
        private readonly DecisionExtractionAgent _extractionAgent;
        private readonly ILogger<BusinessDecisionFunctions> _logger;

        public BusinessDecisionFunctions(
            DecisionDbContext dbContext,
            ProcessDbContext processDbContext,
            DecisionExtractionAgent extractionAgent,
            ILogger<BusinessDecisionFunctions> logger)
        {
            _dbContext = dbContext;
            _processDbContext = processDbContext;
            _extractionAgent = extractionAgent;
            _logger = logger;
        }

        /// <summary>
        /// Creates a new Business Decision.
        /// POST /api/engagements/{engagementId}/decisions
        /// </summary>
        [Function("CreateDecision")]
        public async Task<IActionResult> CreateDecision(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", "options",
                Route = "engagements/{engagementId}/decisions")] HttpRequest req,
            string engagementId)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                if (!Guid.TryParse(engagementId, out var engagementGuid))
                    return new BadRequestObjectResult(new { error = "Invalid engagement ID" });

                var body = await new StreamReader(req.Body).ReadToEndAsync();
                var request = JsonSerializer.Deserialize<CreateDecisionRequest>(body, JsonOptionsHelper.CaseInsensitive);

                if (request == null || string.IsNullOrWhiteSpace(request.Name))
                    return new BadRequestObjectResult(new { error = "El nombre de la decisión es obligatorio" });

                if (request.ProcessId == Guid.Empty)
                    return new BadRequestObjectResult(new { error = "Debes seleccionar el proceso relacionado" });

                var processExists = await _processDbContext.BusinessProcesses
                    .AnyAsync(p => p.Id == request.ProcessId && p.EngagementId == engagementGuid);
                if (!processExists)
                    return new BadRequestObjectResult(new { error = "El proceso seleccionado no existe o no pertenece a este engagement" });

                var decision = BusinessDecision.Create(engagementGuid, request.ProcessId, request.Name);
                ApplyRequestToDecision(decision, request);

                _dbContext.BusinessDecisions.Add(decision);
                await _dbContext.SaveChangesAsync();

                var dto = MapToDto(decision);
                return new CreatedResult($"/api/decisions/{decision.Id}", dto);
            }
            catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("IX_") == true || ex.InnerException?.Message.Contains("duplicate", StringComparison.OrdinalIgnoreCase) == true)
            {
                _logger.LogWarning(ex, "Duplicate decision name for process");
                return new ConflictObjectResult(new { error = "Ya existe una decisión con ese nombre en este proceso" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating decision");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Lists all Business Decisions for an engagement (across all procesos).
        /// GET /api/engagements/{engagementId}/decisions
        /// </summary>
        [Function("ListDecisions")]
        public async Task<IActionResult> ListDecisions(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get",
                Route = "engagements/{engagementId}/decisions")] HttpRequest req,
            string engagementId)
        {
            CorsHelper.SetCorsHeaders(req.HttpContext.Response);
            try
            {
                if (!Guid.TryParse(engagementId, out var engagementGuid))
                    return new BadRequestObjectResult(new { error = "Invalid engagement ID" });

                var decisions = await _dbContext.BusinessDecisions
                    .Where(d => d.EngagementId == engagementGuid)
                    .OrderBy(d => d.Name)
                    .ToListAsync();

                return new OkObjectResult(decisions.Select(MapToDto));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error listing decisions");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Gets a single Business Decision by ID.
        /// GET /api/decisions/{id}
        /// </summary>
        [Function("GetDecision")]
        public async Task<IActionResult> GetDecision(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get",
                Route = "decisions/{id}")] HttpRequest req,
            string id)
        {
            CorsHelper.SetCorsHeaders(req.HttpContext.Response);
            try
            {
                if (!Guid.TryParse(id, out var decisionGuid))
                    return new BadRequestObjectResult(new { error = "Invalid decision ID" });

                var decision = await _dbContext.BusinessDecisions.FirstOrDefaultAsync(d => d.Id == decisionGuid);

                if (decision == null)
                    return new NotFoundObjectResult(new { error = "Decision not found" });

                return new OkObjectResult(MapToDto(decision));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting decision");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Updates a Business Decision (full-form-save semantics).
        /// PUT /api/decisions/{id}
        /// </summary>
        [Function("UpdateDecision")]
        public async Task<IActionResult> UpdateDecision(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", "options",
                Route = "decisions/{id}")] HttpRequest req,
            string id)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                if (!Guid.TryParse(id, out var decisionGuid))
                    return new BadRequestObjectResult(new { error = "Invalid decision ID" });

                var decision = await _dbContext.BusinessDecisions.FirstOrDefaultAsync(d => d.Id == decisionGuid);

                if (decision == null)
                    return new NotFoundObjectResult(new { error = "Decision not found" });

                var body = await new StreamReader(req.Body).ReadToEndAsync();
                var request = JsonSerializer.Deserialize<CreateDecisionRequest>(body, JsonOptionsHelper.CaseInsensitive);

                if (request == null || string.IsNullOrWhiteSpace(request.Name))
                    return new BadRequestObjectResult(new { error = "El nombre de la decisión es obligatorio" });

                if (request.ProcessId == Guid.Empty)
                    return new BadRequestObjectResult(new { error = "Debes seleccionar el proceso relacionado" });

                var processExists = await _processDbContext.BusinessProcesses
                    .AnyAsync(p => p.Id == request.ProcessId && p.EngagementId == decision.EngagementId);
                if (!processExists)
                    return new BadRequestObjectResult(new { error = "El proceso seleccionado no existe o no pertenece a este engagement" });

                decision.Name = request.Name;
                decision.ProcessId = request.ProcessId;
                ApplyRequestToDecision(decision, request);

                await _dbContext.SaveChangesAsync();

                return new OkObjectResult(MapToDto(decision));
            }
            catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("IX_") == true || ex.InnerException?.Message.Contains("duplicate", StringComparison.OrdinalIgnoreCase) == true)
            {
                _logger.LogWarning(ex, "Duplicate decision name for process");
                return new ConflictObjectResult(new { error = "Ya existe una decisión con ese nombre en este proceso" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating decision");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Suggests candidate decision points for a Business Process using
        /// an AI agent, from the process's captured text. Suggestions only —
        /// nothing is saved; the human reviews/edits and saves via
        /// CreateDecision.
        /// POST /api/processes/{processId}/decisions/suggest
        /// </summary>
        [Function("SuggestDecisions")]
        public async Task<IActionResult> SuggestDecisions(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", "options",
                Route = "processes/{processId}/decisions/suggest")] HttpRequest req,
            string processId)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                if (!_extractionAgent.IsConfigured)
                {
                    return new ObjectResult(new
                    {
                        error = "El agente de sugerencia de decisiones no está configurado. " +
                                "Configura 'AzureOpenAIEndpoint' y 'AzureOpenAIDeploymentName' en el backend.",
                    })
                    { StatusCode = 501 };
                }

                if (!Guid.TryParse(processId, out var processGuid))
                    return new BadRequestObjectResult(new { error = "Invalid process ID" });

                var process = await _processDbContext.BusinessProcesses.FirstOrDefaultAsync(p => p.Id == processGuid);
                if (process == null)
                    return new NotFoundObjectResult(new { error = "Process not found" });

                var result = await _extractionAgent.ExtractAsync(
                    process.Name,
                    process.Description,
                    process.MainProblems,
                    process.MainOpportunities);

                var response = new ExtractDecisionsResponse
                {
                    Suggestions = result.Decisions.Select(d => new DecisionSuggestionDto
                    {
                        Name = d.Name,
                        Description = d.Description,
                        DecisionType = d.DecisionType,
                        Frequency = d.Frequency,
                        Complexity = d.Complexity,
                        IsRuleBased = d.IsRuleBased,
                        RulesDescription = d.RulesDescription,
                        InputDataUsed = d.InputDataUsed,
                        DataAvailability = d.DataAvailability,
                    }).ToList(),
                };

                return new OkObjectResult(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error suggesting decisions");
                return new StatusCodeResult(500);
            }
        }

        private static void ApplyRequestToDecision(BusinessDecision decision, CreateDecisionRequest request)
        {
            decision.Description = request.Description;
            decision.Owner = request.Owner;

            decision.DecisionType = request.DecisionType;
            decision.Frequency = request.Frequency;
            decision.Complexity = request.Complexity;

            decision.DecisionMaker = request.DecisionMaker;
            decision.CurrentAutonomyLevel = request.CurrentAutonomyLevel;
            decision.IsRuleBased = request.IsRuleBased;
            decision.RulesDescription = request.RulesDescription;
            decision.RulesSource = request.RulesSource;
            decision.DataAvailability = request.DataAvailability;
            decision.InputDataUsed = request.InputDataUsed;

            decision.TargetAutonomyLevel = request.TargetAutonomyLevel;
            decision.AutomationPotential = request.AutomationPotential;
            decision.AutomationRisk = request.AutomationRisk;

            decision.MainProblems = request.MainProblems;
            decision.MainOpportunities = request.MainOpportunities;
            decision.Observations = request.Observations;

            if (!string.IsNullOrWhiteSpace(request.Status))
                decision.Status = request.Status;
        }

        private static DecisionDto MapToDto(BusinessDecision decision) => new()
        {
            Id = decision.Id,
            EngagementId = decision.EngagementId,
            ProcessId = decision.ProcessId,
            Name = decision.Name,
            Description = decision.Description,
            Owner = decision.Owner,

            DecisionType = decision.DecisionType,
            Frequency = decision.Frequency,
            Complexity = decision.Complexity,

            DecisionMaker = decision.DecisionMaker,
            CurrentAutonomyLevel = decision.CurrentAutonomyLevel,
            IsRuleBased = decision.IsRuleBased,
            RulesDescription = decision.RulesDescription,
            RulesSource = decision.RulesSource,
            DataAvailability = decision.DataAvailability,
            InputDataUsed = decision.InputDataUsed,

            TargetAutonomyLevel = decision.TargetAutonomyLevel,
            AutomationPotential = decision.AutomationPotential,
            AutomationRisk = decision.AutomationRisk,

            MainProblems = decision.MainProblems,
            MainOpportunities = decision.MainOpportunities,
            Observations = decision.Observations,

            Status = decision.Status,
            CreatedAt = decision.CreatedAt,
            UpdatedAt = decision.UpdatedAt,
        };
    }
}
