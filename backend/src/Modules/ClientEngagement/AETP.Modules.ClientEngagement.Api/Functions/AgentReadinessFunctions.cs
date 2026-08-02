using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AETP.Modules.Process.Domain;
using AETP.Modules.Process.Infrastructure;
using AETP.Modules.ClientEngagement.Api.Agents;
using AETP.Modules.ClientEngagement.Api.DTOs;
using AETP.Modules.ClientEngagement.Api.Storage;
using AETP.Modules.ClientEngagement.Api.Utilities;
using System.Text.Json;

namespace AETP.Modules.ClientEngagement.Api.Functions
{
    /// <summary>
    /// Endpoint to upload a business process document (PDF, any industry)
    /// so an "Agent-Readiness Process Architect" AI agent can read it in one
    /// pass and produce a complete Agent-Readiness assessment: process
    /// model, ontology, business rules, roles/handoffs, data + AI
    /// governance, agent design (skills/tools) and an 8-dimension
    /// assessment instrument with its gap engine — see
    /// <see cref="AgentReadinessExtractionAgent"/>.
    ///
    /// Same non-blocking start/poll pattern as
    /// <see cref="ProcessDocumentFunctions"/>: the AI call runs as a
    /// BACKGROUND task via <see cref="AgentReadinessExtractionOrchestrator"/>
    /// — UploadAgentReadinessDocument only does the fast synchronous part
    /// (validate, store, parse PDF text) and returns immediately with a
    /// RunId; the frontend polls GetAgentReadinessExtractionStatus.
    /// </summary>
    public class AgentReadinessFunctions
    {
        private const long MaxPdfBytes = 20 * 1024 * 1024; // 20 MB

        private readonly ProcessDbContext _processDbContext;
        private readonly ProcessDocumentStorageService _storageService;
        private readonly AgentReadinessExtractionOrchestrator _orchestrator;
        private readonly ILogger<AgentReadinessFunctions> _logger;

        public AgentReadinessFunctions(
            ProcessDbContext processDbContext,
            ProcessDocumentStorageService storageService,
            AgentReadinessExtractionOrchestrator orchestrator,
            ILogger<AgentReadinessFunctions> logger)
        {
            _processDbContext = processDbContext;
            _storageService = storageService;
            _orchestrator = orchestrator;
            _logger = logger;
        }

        private static AgentReadinessAssessmentDto MapToDto(AgentReadinessAssessment assessment)
        {
            return new AgentReadinessAssessmentDto
            {
                Id = assessment.Id,
                ProcessId = assessment.ProcessId,
                FileName = assessment.FileName,
                PageCount = assessment.PageCount,
                Status = assessment.Status,
                ErrorMessage = assessment.ErrorMessage,
                Result = string.IsNullOrWhiteSpace(assessment.ResultJson)
                    ? null
                    : JsonSerializer.Deserialize<AgentReadinessResult>(assessment.ResultJson),
                CreatedAt = assessment.CreatedAt,
            };
        }

        /// <summary>
        /// Uploads a process document (PDF), stores it in Data Lake/Blob
        /// Storage (best-effort), extracts its text, and STARTS the
        /// Agent-Readiness AI extraction in the background — returns
        /// immediately (HTTP 202) with a RunId. Poll
        /// GetAgentReadinessExtractionStatus for progress and the eventual
        /// Completed/Failed result.
        /// POST /api/processes/{processId}/agent-readiness (multipart/form-data, field "file")
        /// </summary>
        [Function("UploadAgentReadinessDocument")]
        public async Task<IActionResult> UploadAgentReadinessDocument(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", "options",
                Route = "processes/{processId}/agent-readiness")] HttpRequest req,
            string processId)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;

            try
            {
                if (!_orchestrator.IsConfigured)
                {
                    return new ObjectResult(new
                    {
                        error = "El agente de Agent-Readiness no está configurado. " +
                                "Configura 'AzureOpenAIEndpoint' y 'AzureOpenAIDeploymentName' en el backend.",
                    })
                    { StatusCode = 501 };
                }

                if (!Guid.TryParse(processId, out var processGuid))
                    return new BadRequestObjectResult(new { error = "Invalid process ID" });

                var process = await _processDbContext.BusinessProcesses.FirstOrDefaultAsync(p => p.Id == processGuid);
                if (process == null)
                    return new NotFoundObjectResult(new { error = "Process not found" });

                if (!req.HasFormContentType || req.Form.Files.Count == 0)
                    return new BadRequestObjectResult(new { error = "Se requiere un archivo PDF (multipart/form-data, campo 'file')" });

                var file = req.Form.Files[0];

                if (file.Length == 0)
                    return new BadRequestObjectResult(new { error = "El archivo está vacío" });

                if (file.Length > MaxPdfBytes)
                    return new BadRequestObjectResult(new { error = "El PDF no debe exceder 20 MB" });

                var contentType = file.ContentType;
                if (string.IsNullOrWhiteSpace(contentType) || !contentType.Contains("pdf", StringComparison.OrdinalIgnoreCase))
                    return new BadRequestObjectResult(new { error = "El archivo debe ser un PDF (application/pdf)" });

                using var memoryStream = new MemoryStream();
                await file.CopyToAsync(memoryStream);
                var fileBytes = memoryStream.ToArray();

                var assessment = AgentReadinessAssessment.Create(process.EngagementId, process.Id, file.FileName);

                // Storage is best-effort: extraction can still proceed even
                // if the Data Lake connection isn't configured/reachable.
                if (_storageService.IsConfigured)
                {
                    try
                    {
                        using var uploadStream = new MemoryStream(fileBytes);
                        assessment.BlobPath = await _storageService.UploadAsync(
                            process.EngagementId, process.Id, file.FileName, uploadStream, contentType);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to upload Agent-Readiness document to Data Lake, continuing with extraction only");
                    }
                }

                using var textStream = new MemoryStream(fileBytes);
                var extraction = PdfTextExtractor.ExtractTextWithPageCount(textStream);
                assessment.PageCount = extraction.PageCount;

                if (string.IsNullOrWhiteSpace(extraction.Text))
                {
                    assessment.Status = "Error";
                    assessment.ErrorMessage = "No se pudo extraer texto del PDF";
                    _processDbContext.AgentReadinessAssessments.Add(assessment);
                    await _processDbContext.SaveChangesAsync();

                    return new ObjectResult(new { error = assessment.ErrorMessage })
                    { StatusCode = 422 };
                }

                assessment.Status = "Procesando";
                _processDbContext.AgentReadinessAssessments.Add(assessment);
                await _processDbContext.SaveChangesAsync();

                _logger.LogInformation(
                    "Starting background Agent-Readiness extraction for document {FileName} ({PageCount} pages) for process {ProcessId}",
                    file.FileName, extraction.PageCount, processGuid);

                var runStatus = _orchestrator.Start(
                    assessment.Id,
                    process.Name,
                    extraction.Text,
                    process.DataSourceSystem,
                    process.DataSourceSystemOther);

                return new AcceptedResult((string?)null, new
                {
                    runId = runStatus.RunId,
                    assessmentId = assessment.Id,
                    stage = runStatus.Stage.ToString(),
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading Agent-Readiness document");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Polls the live status of a background Agent-Readiness extraction
        /// run started by UploadAgentReadinessDocument: Running (with a
        /// short progress description), Completed (with the final
        /// AgentReadinessAssessmentDto), or Failed.
        /// GET /api/processes/{processId}/agent-readiness/status/{runId}
        /// </summary>
        [Function("GetAgentReadinessExtractionStatus")]
        public async Task<IActionResult> GetAgentReadinessExtractionStatus(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", "options",
                Route = "processes/{processId}/agent-readiness/status/{runId}")] HttpRequest req,
            string processId,
            string runId)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;

            if (!Guid.TryParse(runId, out var runGuid))
                return new BadRequestObjectResult(new { error = "Invalid run ID" });

            try
            {
                var status = _orchestrator.GetStatus(runGuid);

                AgentReadinessAssessmentDto? resultDto = null;
                if (status.Stage == AgentReadinessExtractionStage.Completed && status.AssessmentId is Guid assessmentId)
                {
                    var assessment = await _processDbContext.AgentReadinessAssessments.FirstOrDefaultAsync(a => a.Id == assessmentId);
                    if (assessment is not null) resultDto = MapToDto(assessment);
                }

                return new OkObjectResult(new
                {
                    runId = status.RunId,
                    stage = status.Stage.ToString(),
                    step = status.Step,
                    errorMessage = status.ErrorMessage,
                    result = resultDto,
                });
            }
            catch (InvalidOperationException ex)
            {
                return new NotFoundObjectResult(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Returns the most recent saved Agent-Readiness assessment for a
        /// process (if any), so reloading the page after a completed
        /// extraction still shows the result without re-uploading the PDF.
        /// GET /api/processes/{processId}/agent-readiness
        /// </summary>
        [Function("GetLatestAgentReadinessAssessment")]
        public async Task<IActionResult> GetLatestAgentReadinessAssessment(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get",
                Route = "processes/{processId}/agent-readiness")] HttpRequest req,
            string processId)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;

            if (!Guid.TryParse(processId, out var processGuid))
                return new BadRequestObjectResult(new { error = "Invalid process ID" });

            var assessment = await _processDbContext.AgentReadinessAssessments
                .Where(a => a.ProcessId == processGuid)
                .OrderByDescending(a => a.CreatedAt)
                .FirstOrDefaultAsync();

            if (assessment is null)
                return new NotFoundObjectResult(new { error = "No hay ninguna evaluación de Agent-Readiness para este proceso" });

            return new OkObjectResult(MapToDto(assessment));
        }
    }
}
