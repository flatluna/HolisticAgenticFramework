using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AETP.Modules.ClientEngagement.Api.Agents;
using AETP.Modules.ClientEngagement.Api.Utilities;
using AETP.Modules.ClientEngagement.Domain;
using AETP.Modules.ClientEngagement.Infrastructure;
using System.Text.Json;

namespace AETP.Modules.ClientEngagement.Api.Functions
{
    public sealed class EnrichSapFieldRequest
    {
        public string FieldName { get; set; } = string.Empty;

        // Requerido solo para campos custom (empiezan con "Z") — son
        // propios de cada cliente, así que el caché se scoped por
        // engagement. Para campos estándar SAP no hace falta (caché global).
        public string? EngagementId { get; set; }

        // Si true, ignora cualquier entrada ya cacheada y vuelve a
        // consultar Bing (botón "🔄 Volver a enriquecer" del frontend, por
        // si la primera respuesta salió incompleta/mala).
        public bool ForceRefresh { get; set; }
    }

    public sealed class SapFieldEnrichmentResponse
    {
        public string NombreCampo { get; set; } = string.Empty;

        public string Descripcion { get; set; } = string.Empty;

        public string Formato { get; set; } = string.Empty;

        public string ReglaNegocio { get; set; } = string.Empty;

        public string FuenteGrounding { get; set; } = string.Empty;

        public bool EncontradoEnGrounding { get; set; }

        // true si la respuesta vino del caché SQL (sin volver a llamar a
        // Bing) — informativo para el frontend/telemetría, no afecta UX.
        public bool FromCache { get; set; }
    }

    /// <summary>
    /// Endpoint backing the "🎯 Agente de Enriquecimiento de Campos SAP"
    /// feature at http://localhost:3000/deep-dive/p1/paso/nuevo ("🖥
    /// Ubicación exacta en el sistema" → "Nombre técnico del campo", cuando
    /// el sistema es SAP). Given a SAP technical field name, returns a
    /// structured, Bing-grounded explanation via
    /// <see cref="SapFieldEnrichmentAgent"/> — but ALWAYS checks a SQL
    /// cache (<see cref="SapFieldEnrichment"/>) first so a given field is
    /// only searched once (unless ForceRefresh=true):
    /// - Standard SAP fields (e.g. "KLIMK") are cached GLOBALLY
    ///   (EngagementId = Guid.Empty) since they mean the same thing for
    ///   every client.
    /// - Custom "Z*" fields are cached per-engagement, since they're
    ///   specific to each client and won't resolve the same way (often
    ///   EncontradoEnGrounding=false, which is expected and still cached).
    /// </summary>
    public class SapFieldEnrichmentFunctions
    {
        private readonly SapFieldEnrichmentAgent _agent;
        private readonly ClientEngagementDbContext _dbContext;
        private readonly ILogger<SapFieldEnrichmentFunctions> _logger;

        public SapFieldEnrichmentFunctions(
            SapFieldEnrichmentAgent agent,
            ClientEngagementDbContext dbContext,
            ILogger<SapFieldEnrichmentFunctions> logger)
        {
            _agent = agent;
            _dbContext = dbContext;
            _logger = logger;
        }

        /// <summary>
        /// POST /api/sap-fields/enrich
        /// Body: { "fieldName": "KLIMK", "engagementId": "...", "forceRefresh": false }
        /// </summary>
        [Function("EnrichSapField")]
        public async Task<IActionResult> EnrichSapField(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", "options",
                Route = "sap-fields/enrich")] HttpRequest req)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;

            try
            {
                var body = await new StreamReader(req.Body).ReadToEndAsync();
                var request = JsonSerializer.Deserialize<EnrichSapFieldRequest>(body, JsonOptionsHelper.CaseInsensitive);

                if (request == null || string.IsNullOrWhiteSpace(request.FieldName))
                    return new BadRequestObjectResult(new { error = "Se requiere el nombre técnico del campo (fieldName)" });

                var fieldName = request.FieldName.Trim().ToUpperInvariant();
                var isCustomField = fieldName.StartsWith("Z", StringComparison.OrdinalIgnoreCase);

                Guid cacheEngagementId = Guid.Empty;
                if (isCustomField)
                {
                    if (string.IsNullOrWhiteSpace(request.EngagementId) || !Guid.TryParse(request.EngagementId, out cacheEngagementId))
                    {
                        return new BadRequestObjectResult(new
                        {
                            error = $"'{fieldName}' es un campo custom (empieza con 'Z') — se requiere un engagementId válido " +
                                    "para cachearlo, ya que este tipo de campo es propio de cada cliente.",
                        });
                    }
                }

                var existing = await _dbContext.SapFieldEnrichments
                    .FirstOrDefaultAsync(e => e.EngagementId == cacheEngagementId && e.FieldName == fieldName);

                if (existing != null && !request.ForceRefresh)
                {
                    return new OkObjectResult(ToResponse(existing, fromCache: true));
                }

                if (!_agent.IsConfigured)
                {
                    return new ObjectResult(new
                    {
                        error = "El agente de enriquecimiento de campos SAP no está configurado. " +
                                "Configura 'AzureAIFoundryProjectEndpoint', 'BingGroundingConnectionId' y " +
                                "'AzureOpenAIDeploymentName' en el backend.",
                    })
                    { StatusCode = 501 };
                }

                // El SDK preview de Azure AI Foundry Agents + Bing grounding puede
                // tardar o quedarse colgado indefinidamente — mismo timeout
                // explícito que DataDictionarySuggestionFunctions.
                using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(90));
                using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(req.HttpContext.RequestAborted, timeoutCts.Token);

                try
                {
                    var result = await _agent.EnrichAsync(fieldName, linkedCts.Token);

                    if (existing != null)
                    {
                        existing.Refresh(result.Descripcion, result.Formato, result.ReglaNegocio, result.FuenteGrounding, result.EncontradoEnGrounding);
                    }
                    else
                    {
                        existing = SapFieldEnrichment.Create(
                            cacheEngagementId, fieldName, isCustomField,
                            result.Descripcion, result.Formato, result.ReglaNegocio,
                            result.FuenteGrounding, result.EncontradoEnGrounding);
                        _dbContext.SapFieldEnrichments.Add(existing);
                    }

                    await _dbContext.SaveChangesAsync();

                    return new OkObjectResult(ToResponse(existing, fromCache: false));
                }
                catch (OperationCanceledException) when (timeoutCts.IsCancellationRequested)
                {
                    _logger.LogError(
                        "SapFieldEnrichmentAgent.EnrichAsync timed out after 90s for field '{FieldName}'", fieldName);
                    return new ObjectResult(new
                    {
                        error = "La consulta de enriquecimiento tardó demasiado (búsqueda con Bing). Intenta de nuevo en unos momentos.",
                    })
                    { StatusCode = 504 };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error enriching SAP field");
                return new ObjectResult(new { error = "No se pudo enriquecer el campo. Intenta de nuevo." })
                {
                    StatusCode = 500,
                };
            }
        }

        private static SapFieldEnrichmentResponse ToResponse(SapFieldEnrichment entity, bool fromCache) => new()
        {
            NombreCampo = entity.FieldName,
            Descripcion = entity.Descripcion,
            Formato = entity.Formato,
            ReglaNegocio = entity.ReglaNegocio,
            FuenteGrounding = entity.FuenteGrounding,
            EncontradoEnGrounding = entity.EncontradoEnGrounding,
            FromCache = fromCache,
        };
    }
}
