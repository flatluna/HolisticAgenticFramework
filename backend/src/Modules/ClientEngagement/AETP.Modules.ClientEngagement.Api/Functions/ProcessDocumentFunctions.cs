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
    /// Endpoint to upload a full process document (PDF) so an AI agent can
    /// read it in one pass and propose an executive summary, mentioned
    /// entities, and every candidate decision found — dimension 2.4
    /// "Decisiones" of the "Diagnóstico y Madurez Actual" assessment.
    ///
    /// The AI extraction itself runs as a BACKGROUND task via
    /// <see cref="ProcessDocumentExtractionOrchestrator"/> — UploadProcessDocument
    /// only does the fast synchronous part (validate, store, parse PDF text/
    /// images) and returns immediately with a RunId; the frontend polls
    /// GetProcessDocumentExtractionStatus for progress and the eventual
    /// result. This fixes a recurring "zombie Functions host" bug
    /// (2026-07-24): awaiting the multi-minute AI call directly inside this
    /// HTTP trigger handler repeatedly left the host's port open but unable
    /// to route any further request.
    /// </summary>
    public class ProcessDocumentFunctions
    {
        private const long MaxPdfBytes = 20 * 1024 * 1024; // 20 MB

        private readonly ProcessDbContext _processDbContext;
        private readonly ProcessDocumentStorageService _storageService;
        private readonly ProcessDocumentExtractionOrchestrator _orchestrator;
        private readonly ILogger<ProcessDocumentFunctions> _logger;

        public ProcessDocumentFunctions(
            ProcessDbContext processDbContext,
            ProcessDocumentStorageService storageService,
            ProcessDocumentExtractionOrchestrator orchestrator,
            ILogger<ProcessDocumentFunctions> logger)
        {
            _processDbContext = processDbContext;
            _storageService = storageService;
            _orchestrator = orchestrator;
            _logger = logger;
        }

        /// <summary>
        /// Uploads a process document (PDF), stores it in Data Lake/Blob
        /// Storage, extracts its text and embedded images, and STARTS the AI
        /// extraction in the background — returns immediately (HTTP 202)
        /// with a RunId. Poll GetProcessDocumentExtractionStatus for
        /// progress and the eventual Completed/Failed result. Nothing is
        /// auto-saved as a real Business Decision — the final result is a
        /// proposal for the human to review, same as SuggestDecisions.
        /// POST /api/processes/{processId}/documents (multipart/form-data, field "file")
        /// </summary>
        [Function("UploadProcessDocument")]
        public async Task<IActionResult> UploadProcessDocument(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", "options",
                Route = "processes/{processId}/documents")] HttpRequest req,
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
                        error = "El agente de extracción de documentos no está configurado. " +
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

                var document = ProcessDocument.Create(process.EngagementId, process.Id, file.FileName);

                // Storage is best-effort: extraction can still proceed even
                // if the Data Lake connection isn't configured/reachable —
                // we just won't be able to re-download the raw file later.
                if (_storageService.IsConfigured)
                {
                    try
                    {
                        using var uploadStream = new MemoryStream(fileBytes);
                        document.BlobPath = await _storageService.UploadAsync(
                            process.EngagementId, process.Id, file.FileName, uploadStream, contentType);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to upload process document to Data Lake, continuing with extraction only");
                    }
                }

                using var textStream = new MemoryStream(fileBytes);
                var pages = PdfTextExtractor.ExtractPagesWithImages(textStream);
                document.PageCount = pages.Count;
                document.ExtractedText = string.Join("\n\n", pages.Select(p => p.Text).Where(t => !string.IsNullOrWhiteSpace(t)));

                var hasAnyText = pages.Any(p => !string.IsNullOrWhiteSpace(p.Text));
                var hasAnyImages = pages.Any(p => p.Images.Count > 0);

                if (!hasAnyText && !hasAnyImages)
                {
                    document.ExtractionStatus = "Error";
                    document.ExtractionError = "No se pudo extraer texto ni imágenes del PDF";
                    _processDbContext.ProcessDocuments.Add(document);
                    await _processDbContext.SaveChangesAsync();

                    return new ObjectResult(new { error = document.ExtractionError })
                    { StatusCode = 422 };
                }

                _processDbContext.ProcessDocuments.Add(document);
                await _processDbContext.SaveChangesAsync();

                _logger.LogInformation(
                    "Starting background extraction for process document {FileName} ({PageCount} pages, {ImageCount} embedded images) for process {ProcessId}",
                    file.FileName, pages.Count, pages.Sum(p => p.Images.Count), processGuid);

                var runStatus = _orchestrator.Start(document.Id, process.Name, pages);

                return new AcceptedResult((string?)null, new
                {
                    runId = runStatus.RunId,
                    documentId = document.Id,
                    stage = runStatus.Stage.ToString(),
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading process document");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Polls the live status of a background PDF extraction run started
        /// by UploadProcessDocument: Running (with a short progress
        /// description), Completed (with the final ProcessDocumentDto), or
        /// Failed.
        /// GET /api/processes/{processId}/documents/status/{runId}
        /// </summary>
        [Function("GetProcessDocumentExtractionStatus")]
        public Task<IActionResult> GetProcessDocumentExtractionStatus(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", "options",
                Route = "processes/{processId}/documents/status/{runId}")] HttpRequest req,
            string processId,
            string runId)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return Task.FromResult<IActionResult>(preflight);

            if (!Guid.TryParse(runId, out var runGuid))
                return Task.FromResult<IActionResult>(new BadRequestObjectResult(new { error = "Invalid run ID" }));

            try
            {
                var status = _orchestrator.GetStatus(runGuid);

                return Task.FromResult<IActionResult>(new OkObjectResult(new
                {
                    runId = status.RunId,
                    stage = status.Stage.ToString(),
                    step = status.Step,
                    errorMessage = status.ErrorMessage,
                    result = status.Result,
                }));
            }
            catch (InvalidOperationException ex)
            {
                return Task.FromResult<IActionResult>(new NotFoundObjectResult(new { error = ex.Message }));
            }
        }
    }
}
