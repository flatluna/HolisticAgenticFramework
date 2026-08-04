using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using AETP.Modules.ClientEngagement.Api.Agents;
using AETP.Modules.ClientEngagement.Api.Utilities;

namespace AETP.Modules.ClientEngagement.Api.Functions
{
    /// <summary>
    /// Endpoint del feature "📸 Extraer campos desde captura de pantalla" en
    /// http://localhost:3000/deep-dive/p1/paso/nuevo (Etapa ③ Datos
    /// procesados, tipo Sistema/Aplicación): sube una imagen de una pantalla
    /// de un sistema y arranca en BACKGROUND (ver
    /// <see cref="SystemScreenshotExtractionOrchestrator"/>) un flujo de dos
    /// pasos — visión (qué campos hay) + Bing Grounding (qué significa cada
    /// uno) — devolviendo un RunId inmediatamente para que el frontend haga
    /// polling. Nunca se expone/pide el valor realmente capturado en cada
    /// campo, solo su nombre/estructura.
    /// </summary>
    public class SystemFieldScreenshotFunctions
    {
        private const long MaxImageBytes = 10 * 1024 * 1024; // 10 MB

        private readonly SystemScreenshotExtractionOrchestrator _orchestrator;
        private readonly ILogger<SystemFieldScreenshotFunctions> _logger;

        public SystemFieldScreenshotFunctions(
            SystemScreenshotExtractionOrchestrator orchestrator,
            ILogger<SystemFieldScreenshotFunctions> logger)
        {
            _orchestrator = orchestrator;
            _logger = logger;
        }

        /// <summary>
        /// POST /api/system-fields/extract-screenshot
        /// (multipart/form-data, campo "file" = imagen, campo opcional
        /// "systemName" = el sistema ya seleccionado en el wizard, ej. "SAP")
        /// </summary>
        [Function("ExtractSystemFieldsFromScreenshot")]
        public async Task<IActionResult> ExtractSystemFieldsFromScreenshot(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", "options",
                Route = "system-fields/extract-screenshot")] HttpRequest req)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;

            try
            {
                if (!_orchestrator.IsConfigured)
                {
                    return new ObjectResult(new
                    {
                        error = "El agente de extracción de captura de pantalla no está configurado. " +
                                "Configura 'AzureOpenAIEndpoint' y 'AzureOpenAIDeploymentName' (un despliegue con visión) en el backend.",
                    })
                    { StatusCode = 501 };
                }

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

                var systemName = req.Form.TryGetValue("systemName", out var systemNameValues) ? systemNameValues.ToString() : null;

                using var memoryStream = new MemoryStream();
                await file.CopyToAsync(memoryStream);
                var imageBytes = memoryStream.ToArray();

                _logger.LogInformation(
                    "Starting background system-field screenshot extraction ({Length} bytes, {ContentType}, systemName={SystemName})",
                    imageBytes.Length, contentType, systemName);

                var runStatus = _orchestrator.Start(imageBytes, contentType, systemName);

                return new AcceptedResult((string?)null, new
                {
                    runId = runStatus.RunId,
                    stage = runStatus.Stage.ToString(),
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting system field screenshot extraction");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// GET /api/system-fields/extract-screenshot/status/{runId}
        /// </summary>
        [Function("GetSystemFieldScreenshotExtractionStatus")]
        public Task<IActionResult> GetSystemFieldScreenshotExtractionStatus(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", "options",
                Route = "system-fields/extract-screenshot/status/{runId}")] HttpRequest req,
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
                    sistemaDetectado = status.SistemaDetectado,
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
