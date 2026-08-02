using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AETP.Modules.Process.Domain;
using AETP.Modules.Process.Infrastructure;
using AETP.Modules.ClientEngagement.Api.DTOs;
using AETP.Modules.ClientEngagement.Api.Utilities;
using System.Text.Json;

namespace AETP.Modules.ClientEngagement.Api.Functions
{
    /// <summary>
    /// Endpoints for the "Human-Agent Operating Model Foundation" (Sprint 3):
    /// captures the real-life work performed inside a <see cref="BusinessProcess"/>,
    /// step by step (<see cref="ProcessActivity"/>) and, per step, every
    /// communication/interaction observed (<see cref="ActivityInteraction"/>).
    /// Intended to be filled in by an advisor interviewing/observing the
    /// client live.
    /// </summary>
    public class ProcessActivityFunctions
    {
        private readonly ProcessDbContext _dbContext;
        private readonly ILogger<ProcessActivityFunctions> _logger;

        public ProcessActivityFunctions(ProcessDbContext dbContext, ILogger<ProcessActivityFunctions> logger)
        {
            _dbContext = dbContext;
            _logger = logger;
        }

        // ------------------------------------------------------------------
        // ProcessActivity
        // ------------------------------------------------------------------

        /// <summary>
        /// Creates a new step (ProcessActivity) within a process.
        /// POST /api/processes/{processId}/activities
        /// </summary>
        [Function("CreateProcessActivity")]
        public async Task<IActionResult> CreateProcessActivity(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", "options",
                Route = "processes/{processId}/activities")] HttpRequest req,
            string processId)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                if (!Guid.TryParse(processId, out var processGuid))
                    return new BadRequestObjectResult(new { error = "Invalid process ID" });

                var process = await _dbContext.BusinessProcesses.FirstOrDefaultAsync(p => p.Id == processGuid);
                if (process == null)
                    return new NotFoundObjectResult(new { error = "Process not found" });

                var body = await new StreamReader(req.Body).ReadToEndAsync();
                var request = JsonSerializer.Deserialize<CreateProcessActivityRequest>(body, JsonOptionsHelper.CaseInsensitive);

                if (request == null || string.IsNullOrWhiteSpace(request.Name))
                    return new BadRequestObjectResult(new { error = "El nombre del paso es obligatorio" });

                var roleValidation = await ValidateRolesAsync(process.EngagementId, request.PerformedByRoleId, request.ApprovedByRoleId);
                if (roleValidation != null) return roleValidation;

                var activity = ProcessActivity.Create(process.EngagementId, processGuid, request.SequenceOrder, request.Name);
                ApplyRequestToActivity(activity, request);

                _dbContext.ProcessActivities.Add(activity);
                await _dbContext.SaveChangesAsync();

                return new CreatedResult($"/api/activities/{activity.Id}", MapToDto(activity));
            }
            catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("IX_") == true || ex.InnerException?.Message.Contains("duplicate", StringComparison.OrdinalIgnoreCase) == true)
            {
                _logger.LogWarning(ex, "Duplicate SequenceOrder for process");
                return new ConflictObjectResult(new { error = "Ya existe un paso con ese orden en este proceso" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating process activity");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Lists all steps of a process, in order.
        /// GET /api/processes/{processId}/activities
        /// </summary>
        [Function("ListProcessActivities")]
        public async Task<IActionResult> ListProcessActivities(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get",
                Route = "processes/{processId}/activities")] HttpRequest req,
            string processId)
        {
            CorsHelper.SetCorsHeaders(req.HttpContext.Response);
            try
            {
                if (!Guid.TryParse(processId, out var processGuid))
                    return new BadRequestObjectResult(new { error = "Invalid process ID" });

                var activities = await _dbContext.ProcessActivities
                    .Where(a => a.ProcessId == processGuid)
                    .OrderBy(a => a.SequenceOrder)
                    .ToListAsync();

                return new OkObjectResult(activities.Select(MapToDto));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error listing process activities");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Gets a single step by ID.
        /// GET /api/activities/{id}
        /// </summary>
        [Function("GetProcessActivity")]
        public async Task<IActionResult> GetProcessActivity(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get",
                Route = "activities/{id}")] HttpRequest req,
            string id)
        {
            CorsHelper.SetCorsHeaders(req.HttpContext.Response);
            try
            {
                if (!Guid.TryParse(id, out var activityGuid))
                    return new BadRequestObjectResult(new { error = "Invalid activity ID" });

                var activity = await _dbContext.ProcessActivities.FirstOrDefaultAsync(a => a.Id == activityGuid);
                if (activity == null)
                    return new NotFoundObjectResult(new { error = "Activity not found" });

                return new OkObjectResult(MapToDto(activity));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting process activity");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Updates a step (full-form-save semantics).
        /// PUT /api/activities/{id}
        /// </summary>
        [Function("UpdateProcessActivity")]
        public async Task<IActionResult> UpdateProcessActivity(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put",
                Route = "activities/{id}")] HttpRequest req,
            string id)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                if (!Guid.TryParse(id, out var activityGuid))
                    return new BadRequestObjectResult(new { error = "Invalid activity ID" });

                var activity = await _dbContext.ProcessActivities.FirstOrDefaultAsync(a => a.Id == activityGuid);
                if (activity == null)
                    return new NotFoundObjectResult(new { error = "Activity not found" });

                var body = await new StreamReader(req.Body).ReadToEndAsync();
                var request = JsonSerializer.Deserialize<CreateProcessActivityRequest>(body, JsonOptionsHelper.CaseInsensitive);

                if (request == null || string.IsNullOrWhiteSpace(request.Name))
                    return new BadRequestObjectResult(new { error = "El nombre del paso es obligatorio" });

                var roleValidation = await ValidateRolesAsync(activity.EngagementId, request.PerformedByRoleId, request.ApprovedByRoleId);
                if (roleValidation != null) return roleValidation;

                activity.SequenceOrder = request.SequenceOrder;
                activity.Name = request.Name;
                ApplyRequestToActivity(activity, request);
                activity.Touch();

                await _dbContext.SaveChangesAsync();

                return new OkObjectResult(MapToDto(activity));
            }
            catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("IX_") == true || ex.InnerException?.Message.Contains("duplicate", StringComparison.OrdinalIgnoreCase) == true)
            {
                _logger.LogWarning(ex, "Duplicate SequenceOrder for process");
                return new ConflictObjectResult(new { error = "Ya existe un paso con ese orden en este proceso" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating process activity");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Deletes a step, and every interaction/dependency edge referencing it
        /// (both incoming and outgoing) so the delete never fails on a
        /// restricted FK.
        /// DELETE /api/activities/{id}
        /// </summary>
        [Function("DeleteProcessActivity")]
        public async Task<IActionResult> DeleteProcessActivity(
            [HttpTrigger(AuthorizationLevel.Anonymous, "delete", "options",
                Route = "activities/{id}")] HttpRequest req,
            string id)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                if (!Guid.TryParse(id, out var activityGuid))
                    return new BadRequestObjectResult(new { error = "Invalid activity ID" });

                var activity = await _dbContext.ProcessActivities.FirstOrDefaultAsync(a => a.Id == activityGuid);
                if (activity == null)
                    return new NotFoundObjectResult(new { error = "Activity not found" });

                var interactions = await _dbContext.ActivityInteractions
                    .Where(i => i.ActivityId == activityGuid)
                    .ToListAsync();
                if (interactions.Count > 0)
                    _dbContext.ActivityInteractions.RemoveRange(interactions);

                var dependencies = await _dbContext.ActivityDependencies
                    .Where(d => d.ActivityId == activityGuid || d.DependsOnActivityId == activityGuid)
                    .ToListAsync();
                if (dependencies.Count > 0)
                    _dbContext.ActivityDependencies.RemoveRange(dependencies);

                var gapFindings = await _dbContext.ProcessGapFindings
                    .Where(g => g.ActivityId == activityGuid)
                    .ToListAsync();
                if (gapFindings.Count > 0)
                    _dbContext.ProcessGapFindings.RemoveRange(gapFindings);

                _dbContext.ProcessActivities.Remove(activity);
                await _dbContext.SaveChangesAsync();

                return new NoContentResult();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting process activity");
                return new StatusCodeResult(500);
            }
        }

        // ------------------------------------------------------------------
        // ActivityInteraction
        // ------------------------------------------------------------------

        /// <summary>
        /// Adds a communication/interaction to a step.
        /// POST /api/activities/{activityId}/interactions
        /// </summary>
        [Function("CreateActivityInteraction")]
        public async Task<IActionResult> CreateActivityInteraction(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", "options",
                Route = "activities/{activityId}/interactions")] HttpRequest req,
            string activityId)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                if (!Guid.TryParse(activityId, out var activityGuid))
                    return new BadRequestObjectResult(new { error = "Invalid activity ID" });

                var activity = await _dbContext.ProcessActivities.FirstOrDefaultAsync(a => a.Id == activityGuid);
                if (activity == null)
                    return new NotFoundObjectResult(new { error = "Activity not found" });

                var body = await new StreamReader(req.Body).ReadToEndAsync();
                var request = JsonSerializer.Deserialize<CreateActivityInteractionRequest>(body, JsonOptionsHelper.CaseInsensitive);

                if (request == null || string.IsNullOrWhiteSpace(request.Channel))
                    return new BadRequestObjectResult(new { error = "El canal de interacción es obligatorio" });

                if (!Enum.TryParse<InteractionChannel>(request.Channel, ignoreCase: true, out var channel))
                    return new BadRequestObjectResult(new { error = $"Canal inválido: {request.Channel}" });

                if (channel == InteractionChannel.EnterpriseSystem)
                {
                    if (request.SystemUsedId == null)
                        return new BadRequestObjectResult(new { error = "Debes seleccionar el sistema usado" });

                    var systemExists = await _dbContext.EnterpriseSystems
                        .AnyAsync(s => s.Id == request.SystemUsedId && s.EngagementId == activity.EngagementId);
                    if (!systemExists)
                        return new BadRequestObjectResult(new { error = "El sistema seleccionado no existe o no pertenece a este engagement" });
                }

                var roleValidation = await ValidateRolesAsync(activity.EngagementId, request.FromRoleId, request.ToRoleId);
                if (roleValidation != null) return roleValidation;

                var interaction = ActivityInteraction.Create(activity.EngagementId, activityGuid, request.SequenceOrder, channel);
                interaction.SystemUsedId = channel == InteractionChannel.EnterpriseSystem ? request.SystemUsedId : null;
                interaction.FromRoleId = request.FromRoleId;
                interaction.ToRoleId = request.ToRoleId;
                interaction.ContentExample = request.ContentExample;
                interaction.ResponseTimeMinutes = request.ResponseTimeMinutes;

                _dbContext.ActivityInteractions.Add(interaction);
                await _dbContext.SaveChangesAsync();

                return new CreatedResult($"/api/interactions/{interaction.Id}", MapToDto(interaction));
            }
            catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("IX_") == true || ex.InnerException?.Message.Contains("duplicate", StringComparison.OrdinalIgnoreCase) == true)
            {
                _logger.LogWarning(ex, "Duplicate SequenceOrder for activity");
                return new ConflictObjectResult(new { error = "Ya existe una interacción con ese orden en este paso" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating activity interaction");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Lists all interactions of a step, in order.
        /// GET /api/activities/{activityId}/interactions
        /// </summary>
        [Function("ListActivityInteractions")]
        public async Task<IActionResult> ListActivityInteractions(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get",
                Route = "activities/{activityId}/interactions")] HttpRequest req,
            string activityId)
        {
            CorsHelper.SetCorsHeaders(req.HttpContext.Response);
            try
            {
                if (!Guid.TryParse(activityId, out var activityGuid))
                    return new BadRequestObjectResult(new { error = "Invalid activity ID" });

                var interactions = await _dbContext.ActivityInteractions
                    .Where(i => i.ActivityId == activityGuid)
                    .OrderBy(i => i.SequenceOrder)
                    .ToListAsync();

                return new OkObjectResult(interactions.Select(MapToDto));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error listing activity interactions");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Deletes a single interaction.
        /// DELETE /api/interactions/{id}
        /// </summary>
        [Function("DeleteActivityInteraction")]
        public async Task<IActionResult> DeleteActivityInteraction(
            [HttpTrigger(AuthorizationLevel.Anonymous, "delete", "options",
                Route = "interactions/{id}")] HttpRequest req,
            string id)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                if (!Guid.TryParse(id, out var interactionGuid))
                    return new BadRequestObjectResult(new { error = "Invalid interaction ID" });

                var interaction = await _dbContext.ActivityInteractions.FirstOrDefaultAsync(i => i.Id == interactionGuid);
                if (interaction == null)
                    return new NotFoundObjectResult(new { error = "Interaction not found" });

                _dbContext.ActivityInteractions.Remove(interaction);
                await _dbContext.SaveChangesAsync();

                return new NoContentResult();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting activity interaction");
                return new StatusCodeResult(500);
            }
        }

        // ------------------------------------------------------------------
        // ActivityDependency
        // ------------------------------------------------------------------

        /// <summary>
        /// Registers that a step depends on / is blocked by another step.
        /// POST /api/activities/{activityId}/dependencies
        /// </summary>
        [Function("CreateActivityDependency")]
        public async Task<IActionResult> CreateActivityDependency(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", "options",
                Route = "activities/{activityId}/dependencies")] HttpRequest req,
            string activityId)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                if (!Guid.TryParse(activityId, out var activityGuid))
                    return new BadRequestObjectResult(new { error = "Invalid activity ID" });

                var activity = await _dbContext.ProcessActivities.FirstOrDefaultAsync(a => a.Id == activityGuid);
                if (activity == null)
                    return new NotFoundObjectResult(new { error = "Activity not found" });

                var body = await new StreamReader(req.Body).ReadToEndAsync();
                var request = JsonSerializer.Deserialize<CreateActivityDependencyRequest>(body, JsonOptionsHelper.CaseInsensitive);

                if (request == null || request.DependsOnActivityId == Guid.Empty)
                    return new BadRequestObjectResult(new { error = "Debes indicar de qué paso depende" });

                if (request.DependsOnActivityId == activityGuid)
                    return new BadRequestObjectResult(new { error = "Un paso no puede depender de sí mismo" });

                var dependsOnActivity = await _dbContext.ProcessActivities
                    .FirstOrDefaultAsync(a => a.Id == request.DependsOnActivityId && a.EngagementId == activity.EngagementId);
                if (dependsOnActivity == null)
                    return new BadRequestObjectResult(new { error = "El paso del cual depende no existe o no pertenece a este engagement" });

                ProcessDependencyType? dependencyType = null;
                if (!string.IsNullOrWhiteSpace(request.DependencyType))
                {
                    if (!Enum.TryParse<ProcessDependencyType>(request.DependencyType, ignoreCase: true, out var parsed))
                        return new BadRequestObjectResult(new { error = $"Tipo de dependencia inválido: {request.DependencyType}" });
                    dependencyType = parsed;
                }

                var dependency = ActivityDependency.Create(activity.EngagementId, activityGuid, request.DependsOnActivityId);
                dependency.DependencyType = dependencyType;
                dependency.Notes = request.Notes;

                _dbContext.ActivityDependencies.Add(dependency);
                await _dbContext.SaveChangesAsync();

                return new CreatedResult($"/api/dependencies/{dependency.Id}", MapToDto(dependency));
            }
            catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("IX_") == true || ex.InnerException?.Message.Contains("duplicate", StringComparison.OrdinalIgnoreCase) == true)
            {
                _logger.LogWarning(ex, "Duplicate ActivityDependency edge");
                return new ConflictObjectResult(new { error = "Esta dependencia ya existe" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating activity dependency");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Lists the dependencies of a step (what it depends on).
        /// GET /api/activities/{activityId}/dependencies
        /// </summary>
        [Function("ListActivityDependencies")]
        public async Task<IActionResult> ListActivityDependencies(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get",
                Route = "activities/{activityId}/dependencies")] HttpRequest req,
            string activityId)
        {
            CorsHelper.SetCorsHeaders(req.HttpContext.Response);
            try
            {
                if (!Guid.TryParse(activityId, out var activityGuid))
                    return new BadRequestObjectResult(new { error = "Invalid activity ID" });

                var dependencies = await _dbContext.ActivityDependencies
                    .Where(d => d.ActivityId == activityGuid)
                    .ToListAsync();

                return new OkObjectResult(dependencies.Select(MapToDto));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error listing activity dependencies");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Deletes a dependency edge.
        /// DELETE /api/dependencies/{id}
        /// </summary>
        [Function("DeleteActivityDependency")]
        public async Task<IActionResult> DeleteActivityDependency(
            [HttpTrigger(AuthorizationLevel.Anonymous, "delete", "options",
                Route = "dependencies/{id}")] HttpRequest req,
            string id)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                if (!Guid.TryParse(id, out var dependencyGuid))
                    return new BadRequestObjectResult(new { error = "Invalid dependency ID" });

                var dependency = await _dbContext.ActivityDependencies.FirstOrDefaultAsync(d => d.Id == dependencyGuid);
                if (dependency == null)
                    return new NotFoundObjectResult(new { error = "Dependency not found" });

                _dbContext.ActivityDependencies.Remove(dependency);
                await _dbContext.SaveChangesAsync();

                return new NoContentResult();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting activity dependency");
                return new StatusCodeResult(500);
            }
        }

        // ------------------------------------------------------------------
        // Helpers
        // ------------------------------------------------------------------

        private async Task<IActionResult?> ValidateRolesAsync(Guid engagementId, Guid? roleId1, Guid? roleId2)
        {
            var roleIds = new[] { roleId1, roleId2 }
                .Where(r => r.HasValue)
                .Select(r => r!.Value)
                .Distinct()
                .ToList();

            if (roleIds.Count == 0) return null;

            var existingCount = await _dbContext.Roles
                .CountAsync(r => roleIds.Contains(r.Id) && r.EngagementId == engagementId);

            if (existingCount != roleIds.Count)
                return new BadRequestObjectResult(new { error = "Uno o más roles seleccionados no existen o no pertenecen a este engagement" });

            return null;
        }

        private static void ApplyRequestToActivity(ProcessActivity activity, CreateProcessActivityRequest request)
        {
            activity.PerformedByRoleId = request.PerformedByRoleId;
            activity.DecisionDescription = request.DecisionDescription;
            activity.RequiresApproval = request.RequiresApproval;
            activity.ApprovedByRoleId = request.ApprovedByRoleId;
            activity.EstimatedDurationMinutes = request.EstimatedDurationMinutes;
            activity.ActualDurationMinutes = request.ActualDurationMinutes;
            activity.WaitTimeMinutes = request.WaitTimeMinutes;
            activity.StartedAt = request.StartedAt;
            activity.CompletedAt = request.CompletedAt;
            activity.BlockerNotes = request.BlockerNotes;
            activity.DocumentedWay = request.DocumentedWay;
            activity.RealWay = request.RealWay;
            activity.GapNotes = request.GapNotes;
        }

        private static ProcessActivityDto MapToDto(ProcessActivity a) => new()
        {
            Id = a.Id,
            EngagementId = a.EngagementId,
            ProcessId = a.ProcessId,
            SequenceOrder = a.SequenceOrder,
            Name = a.Name,
            PerformedByRoleId = a.PerformedByRoleId,
            DecisionDescription = a.DecisionDescription,
            RequiresApproval = a.RequiresApproval,
            ApprovedByRoleId = a.ApprovedByRoleId,
            EstimatedDurationMinutes = a.EstimatedDurationMinutes,
            ActualDurationMinutes = a.ActualDurationMinutes,
            WaitTimeMinutes = a.WaitTimeMinutes,
            StartedAt = a.StartedAt,
            CompletedAt = a.CompletedAt,
            BlockerNotes = a.BlockerNotes,
            DocumentedWay = a.DocumentedWay,
            RealWay = a.RealWay,
            GapNotes = a.GapNotes,
            CreatedAt = a.CreatedAt,
            UpdatedAt = a.UpdatedAt
        };

        private static ActivityInteractionDto MapToDto(ActivityInteraction i) => new()
        {
            Id = i.Id,
            EngagementId = i.EngagementId,
            ActivityId = i.ActivityId,
            SequenceOrder = i.SequenceOrder,
            Channel = i.Channel.ToString(),
            SystemUsedId = i.SystemUsedId,
            FromRoleId = i.FromRoleId,
            ToRoleId = i.ToRoleId,
            ContentExample = i.ContentExample,
            ResponseTimeMinutes = i.ResponseTimeMinutes,
            CreatedAt = i.CreatedAt,
            UpdatedAt = i.UpdatedAt
        };

        private static ActivityDependencyDto MapToDto(ActivityDependency d) => new()
        {
            Id = d.Id,
            EngagementId = d.EngagementId,
            ActivityId = d.ActivityId,
            DependsOnActivityId = d.DependsOnActivityId,
            DependencyType = d.DependencyType?.ToString(),
            Notes = d.Notes,
            CreatedAt = d.CreatedAt,
            UpdatedAt = d.UpdatedAt
        };
    }
}
