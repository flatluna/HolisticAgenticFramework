using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AETP.Modules.Process.Domain;
using AETP.Modules.Process.Infrastructure;
using AETP.Modules.Capability.Infrastructure;
using AETP.Modules.ClientEngagement.Api.DTOs;
using AETP.Modules.ClientEngagement.Api.Storage;
using AETP.Modules.ClientEngagement.Api.Utilities;
using System.Text.Json;

namespace AETP.Modules.ClientEngagement.Api.Functions
{
    /// <summary>
    /// Endpoints for the "Procesos" intake form — dimension 2.3 of the
    /// "Diagnóstico y Madurez Actual" assessment. Each proceso pertenece a
    /// exactamente una Business Capability (capacidad dueña, ej. "Marketing"),
    /// aunque en la práctica pueda tocar más de un área.
    /// </summary>
    public class BusinessProcessFunctions
    {
        private readonly ProcessDbContext _dbContext;
        private readonly CapabilityDbContext _capabilityDbContext;
        private readonly ProcessDocumentStorageService _storageService;
        private readonly ILogger<BusinessProcessFunctions> _logger;

        public BusinessProcessFunctions(
            ProcessDbContext dbContext,
            CapabilityDbContext capabilityDbContext,
            ProcessDocumentStorageService storageService,
            ILogger<BusinessProcessFunctions> logger)
        {
            _dbContext = dbContext;
            _capabilityDbContext = capabilityDbContext;
            _storageService = storageService;
            _logger = logger;
        }

        /// <summary>
        /// Creates a new Business Process.
        /// POST /api/engagements/{engagementId}/processes
        /// </summary>
        [Function("CreateProcess")]
        public async Task<IActionResult> CreateProcess(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", "options",
                Route = "engagements/{engagementId}/processes")] HttpRequest req,
            string engagementId)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                if (!Guid.TryParse(engagementId, out var engagementGuid))
                    return new BadRequestObjectResult(new { error = "Invalid engagement ID" });

                var body = await new StreamReader(req.Body).ReadToEndAsync();
                var request = JsonSerializer.Deserialize<CreateProcessRequest>(body, JsonOptionsHelper.CaseInsensitive);

                if (request == null || string.IsNullOrWhiteSpace(request.Name))
                    return new BadRequestObjectResult(new { error = "El nombre del proceso es obligatorio" });

                if (request.CapabilityId == Guid.Empty)
                    return new BadRequestObjectResult(new { error = "Debes seleccionar la capacidad dueña del proceso" });

                var capabilityExists = await _capabilityDbContext.BusinessCapabilities
                    .AnyAsync(c => c.Id == request.CapabilityId && c.EngagementId == engagementGuid);
                if (!capabilityExists)
                    return new BadRequestObjectResult(new { error = "La capacidad seleccionada no existe o no pertenece a este engagement" });

                var process = BusinessProcess.Create(engagementGuid, request.CapabilityId, request.Name);
                ApplyRequestToProcess(process, request);

                _dbContext.BusinessProcesses.Add(process);
                await _dbContext.SaveChangesAsync();

                var dto = MapToDto(process);
                return new CreatedResult($"/api/processes/{process.Id}", dto);
            }
            catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("IX_") == true || ex.InnerException?.Message.Contains("duplicate", StringComparison.OrdinalIgnoreCase) == true)
            {
                _logger.LogWarning(ex, "Duplicate process name for capability");
                return new ConflictObjectResult(new { error = "Ya existe un proceso con ese nombre en esta capacidad" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating process");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Lists all Business Processes for an engagement (across all capacidades).
        /// GET /api/engagements/{engagementId}/processes
        /// </summary>
        [Function("ListProcesses")]
        public async Task<IActionResult> ListProcesses(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get",
                Route = "engagements/{engagementId}/processes")] HttpRequest req,
            string engagementId)
        {
            CorsHelper.SetCorsHeaders(req.HttpContext.Response);
            try
            {
                if (!Guid.TryParse(engagementId, out var engagementGuid))
                    return new BadRequestObjectResult(new { error = "Invalid engagement ID" });

                var processes = await _dbContext.BusinessProcesses
                    .Where(p => p.EngagementId == engagementGuid)
                    .OrderBy(p => p.Name)
                    .ToListAsync();

                return new OkObjectResult(processes.Select(MapToDto));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error listing processes");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Gets a single Business Process by ID.
        /// GET /api/processes/{id}
        /// </summary>
        [Function("GetProcess")]
        public async Task<IActionResult> GetProcess(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get",
                Route = "processes/{id}")] HttpRequest req,
            string id)
        {
            CorsHelper.SetCorsHeaders(req.HttpContext.Response);
            try
            {
                if (!Guid.TryParse(id, out var processGuid))
                    return new BadRequestObjectResult(new { error = "Invalid process ID" });

                var process = await _dbContext.BusinessProcesses.FirstOrDefaultAsync(p => p.Id == processGuid);

                if (process == null)
                    return new NotFoundObjectResult(new { error = "Process not found" });

                return new OkObjectResult(MapToDto(process));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting process");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Updates a Business Process (full-form-save semantics).
        /// PUT /api/processes/{id}
        /// </summary>
        [Function("UpdateProcess")]
        public async Task<IActionResult> UpdateProcess(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put",
                Route = "processes/{id}")] HttpRequest req,
            string id)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                if (!Guid.TryParse(id, out var processGuid))
                    return new BadRequestObjectResult(new { error = "Invalid process ID" });

                var process = await _dbContext.BusinessProcesses.FirstOrDefaultAsync(p => p.Id == processGuid);

                if (process == null)
                    return new NotFoundObjectResult(new { error = "Process not found" });

                var body = await new StreamReader(req.Body).ReadToEndAsync();
                var request = JsonSerializer.Deserialize<CreateProcessRequest>(body, JsonOptionsHelper.CaseInsensitive);

                if (request == null || string.IsNullOrWhiteSpace(request.Name))
                    return new BadRequestObjectResult(new { error = "El nombre del proceso es obligatorio" });

                if (request.CapabilityId == Guid.Empty)
                    return new BadRequestObjectResult(new { error = "Debes seleccionar la capacidad dueña del proceso" });

                var capabilityExists = await _capabilityDbContext.BusinessCapabilities
                    .AnyAsync(c => c.Id == request.CapabilityId && c.EngagementId == process.EngagementId);
                if (!capabilityExists)
                    return new BadRequestObjectResult(new { error = "La capacidad seleccionada no existe o no pertenece a este engagement" });

                process.Name = request.Name;
                process.CapabilityId = request.CapabilityId;
                ApplyRequestToProcess(process, request);

                await _dbContext.SaveChangesAsync();

                return new OkObjectResult(MapToDto(process));
            }
            catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("IX_") == true || ex.InnerException?.Message.Contains("duplicate", StringComparison.OrdinalIgnoreCase) == true)
            {
                _logger.LogWarning(ex, "Duplicate process name for capability");
                return new ConflictObjectResult(new { error = "Ya existe un proceso con ese nombre en esta capacidad" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating process");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Deletes a Business Process AND all of its extracted PDF data:
        /// every <see cref="ProcessDocument"/> row for this process (executive
        /// summary, extracted text, entities) plus the raw PDF file itself in
        /// Data Lake/Blob Storage (best-effort — missing/unreachable storage
        /// doesn't block deletion). Does NOT delete Business Decisions already
        /// registered for this process (they only carry a logical FK — no
        /// physical constraint across modules — so deleting the process won't
        /// fail, but any existing decisions referencing it will be orphaned).
        /// DELETE /api/processes/{id}
        /// </summary>
        [Function("DeleteProcess")]
        public async Task<IActionResult> DeleteProcess(
            [HttpTrigger(AuthorizationLevel.Anonymous, "delete", "options",
                Route = "processes/{id}")] HttpRequest req,
            string id)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                if (!Guid.TryParse(id, out var processGuid))
                    return new BadRequestObjectResult(new { error = "Invalid process ID" });

                var process = await _dbContext.BusinessProcesses.FirstOrDefaultAsync(p => p.Id == processGuid);
                if (process == null)
                    return new NotFoundObjectResult(new { error = "Process not found" });

                var documents = await _dbContext.ProcessDocuments
                    .Where(d => d.ProcessId == processGuid)
                    .ToListAsync();

                foreach (var document in documents)
                {
                    if (!string.IsNullOrWhiteSpace(document.BlobPath))
                    {
                        try
                        {
                            // Short timeout: blob deletion is best-effort here —
                            // a slow/unreachable Data Lake account (network
                            // issues, SDK retry backoff) must never make this
                            // HTTP request hang. The DB rows are removed
                            // regardless of whether the blob delete succeeds.
                            using var blobDeleteCts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
                            await _storageService.DeleteAsync(process.EngagementId, document.BlobPath, blobDeleteCts.Token);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to delete blob {BlobPath} for process document {DocumentId} (or timed out), continuing", document.BlobPath, document.Id);
                        }
                    }
                }

                if (documents.Count > 0)
                    _dbContext.ProcessDocuments.RemoveRange(documents);

                _dbContext.BusinessProcesses.Remove(process);
                await _dbContext.SaveChangesAsync();

                _logger.LogInformation("Deleted process {ProcessId} and {DocumentCount} associated document(s)", processGuid, documents.Count);

                return new NoContentResult();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting process");
                return new StatusCodeResult(500);
            }
        }

        private static void ApplyRequestToProcess(BusinessProcess process, CreateProcessRequest request)
        {
            process.Description = request.Description;
            process.Owner = request.Owner;

            process.IsDocumented = request.IsDocumented;
            process.IsFormalized = request.IsFormalized;

            process.CurrentAutonomyLevel = request.CurrentAutonomyLevel;
            process.Criticality = request.Criticality;

            process.DataSourceSystem = request.DataSourceSystem;
            process.DataSourceSystemOther = request.DataSourceSystemOther;

            process.MainProblems = request.MainProblems;
            process.MainOpportunities = request.MainOpportunities;
            process.Observations = request.Observations;

            if (!string.IsNullOrWhiteSpace(request.Status))
                process.Status = request.Status;
        }

        private static ProcessDto MapToDto(BusinessProcess p) => new()
        {
            Id = p.Id,
            EngagementId = p.EngagementId,
            CapabilityId = p.CapabilityId,
            Name = p.Name,
            Description = p.Description,
            Owner = p.Owner,
            IsDocumented = p.IsDocumented,
            IsFormalized = p.IsFormalized,
            CurrentAutonomyLevel = p.CurrentAutonomyLevel,
            Criticality = p.Criticality,
            DataSourceSystem = p.DataSourceSystem,
            DataSourceSystemOther = p.DataSourceSystemOther,
            MainProblems = p.MainProblems,
            MainOpportunities = p.MainOpportunities,
            Observations = p.Observations,
            Status = p.Status,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt
        };
    }
}
