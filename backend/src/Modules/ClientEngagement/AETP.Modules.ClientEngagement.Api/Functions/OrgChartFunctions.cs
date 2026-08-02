using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using AETP.Modules.ClientEngagement.Api.Agents;
using AETP.Modules.ClientEngagement.Api.Storage;
using AETP.Modules.ClientEngagement.Api.Utilities;

namespace AETP.Modules.ClientEngagement.Api.Functions
{
    public class OrgChartFunctions
    {
        private const long MaxImageBytes = 10 * 1024 * 1024; // 10 MB

        private readonly OrgChartExtractionAgent _orgChartAgent;
        private readonly ProcessDocumentStorageService _storageService;
        private readonly ILogger<OrgChartFunctions> _logger;

        public OrgChartFunctions(
            OrgChartExtractionAgent orgChartAgent,
            ProcessDocumentStorageService storageService,
            ILogger<OrgChartFunctions> logger)
        {
            _orgChartAgent = orgChartAgent;
            _storageService = storageService;
            _logger = logger;
        }

        /// <summary>
        /// Extracts the organization hierarchy (people, positions, reporting
        /// lines) from an uploaded org chart image using an AI agent, and
        /// (best-effort) stores the original image in Data Lake/Blob Storage
        /// for audit/traceability. Storage failures never block the
        /// extraction itself — only the AI result matters to the caller.
        /// POST /api/engagements/{engagementId}/org-chart/extract
        /// (multipart/form-data, field "file")
        /// </summary>
        [Function("ExtractOrgChart")]
        public async Task<IActionResult> ExtractOrgChart(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", "options",
                Route = "engagements/{engagementId}/org-chart/extract")] HttpRequest req,
            string engagementId)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;

            try
            {
                if (!_orgChartAgent.IsConfigured)
                {
                    return new ObjectResult(new
                    {
                        error = "El agente de extracción de organigramas no está configurado. " +
                                "Configura 'AzureOpenAIEndpoint' y 'AzureOpenAIDeploymentName' " +
                                "(un despliegue con visión, p. ej. 'gpt-4o') en el backend.",
                    })
                    { StatusCode = 501 };
                }

                if (!Guid.TryParse(engagementId, out var engagementGuid))
                    return new BadRequestObjectResult(new { error = "engagementId inválido" });

                if (!req.HasFormContentType || req.Form.Files.Count == 0)
                    return new BadRequestObjectResult(new { error = "Se requiere una imagen (multipart/form-data, campo 'file')" });

                var file = req.Form.Files[0];

                if (file.Length == 0)
                    return new BadRequestObjectResult(new { error = "El archivo está vacío" });

                if (file.Length > MaxImageBytes)
                    return new BadRequestObjectResult(new { error = "La imagen no debe exceder 10 MB" });

                var contentType = file.ContentType;
                if (string.IsNullOrWhiteSpace(contentType) || !contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
                    return new BadRequestObjectResult(new { error = "El archivo debe ser una imagen (image/png, image/jpeg, etc.)" });

                using var memoryStream = new MemoryStream();
                await file.CopyToAsync(memoryStream);
                var imageBytes = memoryStream.ToArray();

                _logger.LogInformation("Extracting org chart from uploaded image ({Length} bytes, {ContentType})", imageBytes.Length, contentType);

                if (_storageService.IsConfigured)
                {
                    try
                    {
                        using var uploadStream = new MemoryStream(imageBytes);
                        var imagePath = await _storageService.UploadOrgChartImageAsync(
                            engagementGuid, file.FileName, uploadStream, contentType);
                        _logger.LogInformation("Org chart image stored at {ImagePath}", imagePath);
                    }
                    catch (Exception ex)
                    {
                        // Best-effort: never block the extraction if Data Lake upload fails.
                        _logger.LogWarning(ex, "Failed to store org chart image for engagement {EngagementId}", engagementGuid);
                    }
                }

                var result = await _orgChartAgent.ExtractAsync(imageBytes, contentType);

                return new OkObjectResult(result);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Org chart extraction agent not configured");
                return new ObjectResult(new { error = ex.Message }) { StatusCode = 501 };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error extracting org chart");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Downloads the most recently uploaded org chart image for an
        /// engagement, so the user can view/save the original file that was
        /// used to extract the current roles.
        /// GET /api/engagements/{engagementId}/org-chart/image
        /// </summary>
        [Function("GetOrgChartImage")]
        public async Task<IActionResult> GetOrgChartImage(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", "options",
                Route = "engagements/{engagementId}/org-chart/image")] HttpRequest req,
            string engagementId)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;

            try
            {
                if (!Guid.TryParse(engagementId, out var engagementGuid))
                    return new BadRequestObjectResult(new { error = "engagementId inválido" });

                var image = await _storageService.GetLatestOrgChartImageAsync(engagementGuid);
                if (image is null)
                    return new NotFoundObjectResult(new { error = "No hay ninguna imagen de organigrama guardada para este engagement." });

                return new FileContentResult(image.Value.Content, image.Value.ContentType)
                {
                    FileDownloadName = image.Value.FileName,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching org chart image");
                return new StatusCodeResult(500);
            }
        }
    }
}
