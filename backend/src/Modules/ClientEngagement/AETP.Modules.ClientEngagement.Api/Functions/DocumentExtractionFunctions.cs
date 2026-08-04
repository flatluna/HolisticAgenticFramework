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

namespace AETP.Modules.ClientEngagement.Api.Functions
{
    /// <summary>
    /// The DocumentExtractionAgent endpoint: uploads an UNSTRUCTURED source
    /// document (📄 — e.g. a credit report PDF attached to an email) that
    /// arrived as a 📥 Fuente (<see cref="ActivityInteraction"/>) within a 🪜
    /// Paso (<see cref="ProcessActivity"/>), stores the original file in
    /// Data Lake/Blob Storage (per-empresa container, see
    /// <see cref="ProcessDocumentStorageService.UploadSourceDocumentAsync"/>),
    /// and runs <see cref="DocumentExtractionAgent"/> in the BACKGROUND (via
    /// <see cref="DocumentExtractionOrchestrator"/>) to produce the 6
    /// structured blocks (metadatos, datos, entidades, descripción, páginas,
    /// sumario) — same non-blocking start/poll pattern as
    /// <see cref="ProcessDocumentFunctions"/>, to avoid the "zombie
    /// Functions host" bug from awaiting a multi-minute AI call inline.
    ///
    /// Every persisted <see cref="DocumentExtraction"/> keeps the full
    /// Proceso → Paso → Fuente → Empresa traceability — see
    /// <see cref="DocumentExtraction"/>.
    /// </summary>
    public class DocumentExtractionFunctions
    {
        private const long MaxFileBytes = 20 * 1024 * 1024; // 20 MB

        private readonly ProcessDbContext _dbContext;
        private readonly ProcessDocumentStorageService _storageService;
        private readonly DocumentExtractionOrchestrator _orchestrator;
        private readonly ILogger<DocumentExtractionFunctions> _logger;

        public DocumentExtractionFunctions(
            ProcessDbContext dbContext,
            ProcessDocumentStorageService storageService,
            DocumentExtractionOrchestrator orchestrator,
            ILogger<DocumentExtractionFunctions> logger)
        {
            _dbContext = dbContext;
            _storageService = storageService;
            _orchestrator = orchestrator;
            _logger = logger;
        }

        /// <summary>
        /// Uploads a source document (PDF) for a Fuente within a Paso,
        /// stores it in Data Lake/Blob Storage (best-effort), extracts its
        /// text/images/technical metadata, and STARTS the AI extraction in
        /// the background — returns immediately (HTTP 202) with a RunId.
        /// Poll GetDocumentExtractionStatus for progress and the eventual
        /// Completed/Failed result.
        /// POST /api/activities/{activityId}/sources/{sourceId}/documents (multipart/form-data, field "file")
        /// </summary>
        [Function("UploadSourceDocument")]
        public async Task<IActionResult> UploadSourceDocument(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", "options",
                Route = "activities/{activityId}/sources/{sourceId}/documents")] HttpRequest req,
            string activityId,
            string sourceId)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;

            try
            {
                if (!_orchestrator.IsConfigured)
                {
                    return new ObjectResult(new
                    {
                        error = "El DocumentExtractionAgent no está configurado. Configura " +
                                "'AzureOpenAIEndpoint' y 'AzureOpenAIDeploymentName' en el backend.",
                    })
                    { StatusCode = 501 };
                }

                if (!Guid.TryParse(activityId, out var activityGuid))
                    return new BadRequestObjectResult(new { error = "Invalid activity (paso) ID" });

                if (!Guid.TryParse(sourceId, out var sourceGuid))
                    return new BadRequestObjectResult(new { error = "Invalid source (fuente) ID" });

                var activity = await _dbContext.ProcessActivities.FirstOrDefaultAsync(a => a.Id == activityGuid);
                if (activity == null)
                    return new NotFoundObjectResult(new { error = "Paso (activity) not found" });

                var source = await _dbContext.ActivityInteractions
                    .FirstOrDefaultAsync(i => i.Id == sourceGuid && i.ActivityId == activityGuid);
                if (source == null)
                    return new NotFoundObjectResult(new { error = "Fuente (source) not found for this paso" });

                if (!req.HasFormContentType || req.Form.Files.Count == 0)
                    return new BadRequestObjectResult(new { error = "Se requiere un archivo (multipart/form-data, campo 'file')" });

                var file = req.Form.Files[0];

                if (file.Length == 0)
                    return new BadRequestObjectResult(new { error = "El archivo está vacío" });

                if (file.Length > MaxFileBytes)
                    return new BadRequestObjectResult(new { error = "El archivo no debe exceder 20 MB" });

                var contentType = file.ContentType;
                if (string.IsNullOrWhiteSpace(contentType) || !contentType.Contains("pdf", StringComparison.OrdinalIgnoreCase))
                    return new BadRequestObjectResult(new { error = "El archivo debe ser un PDF (application/pdf)" });

                using var memoryStream = new MemoryStream();
                await file.CopyToAsync(memoryStream);
                var fileBytes = memoryStream.ToArray();

                var document = DocumentExtraction.Create(
                    activity.EngagementId, activity.ProcessId, activityGuid, sourceGuid, file.FileName);
                document.ContentType = contentType;
                document.FileSizeBytes = fileBytes.LongLength;
                document.DocumentFormat = "pdf";

                // Storage is best-effort: extraction can still proceed even
                // if the Data Lake connection isn't configured/reachable —
                // we just won't be able to re-download the raw file later.
                if (_storageService.IsConfigured)
                {
                    try
                    {
                        using var uploadStream = new MemoryStream(fileBytes);
                        document.BlobPath = await _storageService.UploadSourceDocumentAsync(
                            activity.EngagementId, activity.ProcessId, activityGuid, sourceGuid, file.FileName, uploadStream, contentType);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to upload source document to Data Lake, continuing with extraction only");
                    }
                }

                // 1️⃣ Metadatos técnicos (autor, fechas) — determinístico, vía PdfPig.
                using (var metadataStream = new MemoryStream(fileBytes))
                {
                    var (author, createdAt, modifiedAt) = DocumentExtractionOrchestrator.ReadDocumentMetadata(metadataStream);
                    document.Author = author;
                    document.DocumentCreatedAt = createdAt;
                    document.DocumentModifiedAt = modifiedAt;
                }

                // Texto + imágenes embebidas — reutiliza el mismo extractor
                // que ProcessDocumentExtractionAgent (Storage.PdfTextExtractor).
                using var textStream = new MemoryStream(fileBytes);
                var pages = PdfTextExtractor.ExtractPagesWithImages(textStream);
                document.PageCount = pages.Count; // 5️⃣ Total de páginas

                var hasAnyText = pages.Any(p => !string.IsNullOrWhiteSpace(p.Text));
                var hasAnyImages = pages.Any(p => p.Images.Count > 0);

                if (!hasAnyText && !hasAnyImages)
                {
                    document.ExtractionStatus = "Error";
                    document.ExtractionError = "No se pudo extraer texto ni imágenes del documento";
                    _dbContext.DocumentExtractions.Add(document);
                    await _dbContext.SaveChangesAsync();

                    return new ObjectResult(new { error = document.ExtractionError })
                    { StatusCode = 422 };
                }

                _dbContext.DocumentExtractions.Add(document);
                await _dbContext.SaveChangesAsync();

                _logger.LogInformation(
                    "Starting background document extraction for {FileName} ({PageCount} pages) — proceso {ProcessId}, paso {ActivityId}, fuente {SourceId}",
                    file.FileName, pages.Count, activity.ProcessId, activityGuid, sourceGuid);

                var runStatus = _orchestrator.Start(document.Id, pages);

                return new AcceptedResult((string?)null, new
                {
                    runId = runStatus.RunId,
                    documentExtractionId = document.Id,
                    stage = runStatus.Stage.ToString(),
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading source document");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Polls the live status of a background extraction run started by
        /// UploadSourceDocument: Running (with a short progress
        /// description), Completed (with the final DocumentExtractionDto —
        /// the 6 blocks + traceability), or Failed.
        /// GET /api/activities/{activityId}/sources/{sourceId}/documents/status/{runId}
        /// </summary>
        [Function("GetDocumentExtractionStatus")]
        public Task<IActionResult> GetDocumentExtractionStatus(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", "options",
                Route = "activities/{activityId}/sources/{sourceId}/documents/status/{runId}")] HttpRequest req,
            string activityId,
            string sourceId,
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

        /// <summary>
        /// Lists every document extracted for a Fuente (a Fuente can carry
        /// more than one attached document over time, e.g. successive
        /// versions of a credit report).
        /// GET /api/activities/{activityId}/sources/{sourceId}/documents
        /// </summary>
        [Function("ListSourceDocuments")]
        public async Task<IActionResult> ListSourceDocuments(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get",
                Route = "activities/{activityId}/sources/{sourceId}/documents")] HttpRequest req,
            string activityId,
            string sourceId)
        {
            CorsHelper.SetCorsHeaders(req.HttpContext.Response);
            try
            {
                if (!Guid.TryParse(activityId, out var activityGuid))
                    return new BadRequestObjectResult(new { error = "Invalid activity (paso) ID" });

                if (!Guid.TryParse(sourceId, out var sourceGuid))
                    return new BadRequestObjectResult(new { error = "Invalid source (fuente) ID" });

                var documents = await _dbContext.DocumentExtractions
                    .Where(d => d.ActivityId == activityGuid && d.SourceId == sourceGuid)
                    .OrderByDescending(d => d.CreatedAt)
                    .ToListAsync();

                return new OkObjectResult(documents.Select(DocumentExtractionMapper.ToDto));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error listing source documents");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Gets a single extracted document by ID (the full 6-block result
        /// + traceability), regardless of whether its background run is
        /// still tracked in-memory — useful after an app restart or when
        /// reloading a previously completed extraction.
        /// GET /api/document-extractions/{id}
        /// </summary>
        [Function("GetDocumentExtraction")]
        public async Task<IActionResult> GetDocumentExtraction(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get",
                Route = "document-extractions/{id}")] HttpRequest req,
            string id)
        {
            CorsHelper.SetCorsHeaders(req.HttpContext.Response);
            try
            {
                if (!Guid.TryParse(id, out var documentGuid))
                    return new BadRequestObjectResult(new { error = "Invalid document extraction ID" });

                var document = await _dbContext.DocumentExtractions.FirstOrDefaultAsync(d => d.Id == documentGuid);
                if (document == null)
                    return new NotFoundObjectResult(new { error = "Document extraction not found" });

                return new OkObjectResult(DocumentExtractionMapper.ToDto(document));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting document extraction");
                return new StatusCodeResult(500);
            }
        }
    }
}
