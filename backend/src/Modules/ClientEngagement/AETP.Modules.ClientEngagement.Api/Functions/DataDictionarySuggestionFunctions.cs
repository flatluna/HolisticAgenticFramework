using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using AETP.Modules.ClientEngagement.Api.Agents;
using AETP.Modules.ClientEngagement.Api.Utilities;
using System.Text.Json;

namespace AETP.Modules.ClientEngagement.Api.Functions
{
    public sealed class SuggestDataDictionaryEntryRequest
    {
        public string Description { get; set; } = string.Empty;
    }

    /// <summary>
    /// Endpoint backing the "✨ Sugerir con IA" action in the "Crear nuevo
    /// dato en diccionario" dialog — given a short natural-language
    /// description of a data item, returns a proposed data-dictionary entry
    /// (names, type, PII, owner, source systems, legal references, best
    /// practices, business rules), grounded in a real Bing web search via
    /// <see cref="DataDictionarySuggestionAgent"/>. Always a proposal for a
    /// human to review/edit before saving — nothing is persisted here.
    /// </summary>
    public class DataDictionarySuggestionFunctions
    {
        private readonly DataDictionarySuggestionAgent _agent;
        private readonly ILogger<DataDictionarySuggestionFunctions> _logger;

        public DataDictionarySuggestionFunctions(
            DataDictionarySuggestionAgent agent,
            ILogger<DataDictionarySuggestionFunctions> logger)
        {
            _agent = agent;
            _logger = logger;
        }

        /// <summary>
        /// POST /api/data-dictionary/suggest
        /// Body: { "description": "RFC en México" }
        /// </summary>
        [Function("SuggestDataDictionaryEntry")]
        public async Task<IActionResult> SuggestDataDictionaryEntry(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", "options",
                Route = "data-dictionary/suggest")] HttpRequest req)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;

            try
            {
                if (!_agent.IsConfigured)
                {
                    return new ObjectResult(new
                    {
                        error = "El agente de sugerencias del diccionario de datos no está configurado. " +
                                "Configura 'AzureAIFoundryProjectEndpoint', 'BingGroundingConnectionId' y " +
                                "'AzureOpenAIDeploymentName' en el backend.",
                    })
                    { StatusCode = 501 };
                }

                var body = await new StreamReader(req.Body).ReadToEndAsync();
                var request = JsonSerializer.Deserialize<SuggestDataDictionaryEntryRequest>(body, JsonOptionsHelper.CaseInsensitive);

                if (request == null || string.IsNullOrWhiteSpace(request.Description))
                    return new BadRequestObjectResult(new { error = "Se requiere una descripción del dato" });

                // El SDK preview de Azure AI Foundry Agents + Bing grounding puede
                // tardar (búsqueda + razonamiento) o, en casos observados, quedarse
                // colgado indefinidamente sin abrir conexión de red. Se acota con un
                // timeout explícito para que el usuario siempre reciba una respuesta
                // en vez de un spinner infinito.
                using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(90));
                using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(req.HttpContext.RequestAborted, timeoutCts.Token);

                try
                {
                    var result = await _agent.SuggestAsync(request.Description, linkedCts.Token);
                    return new OkObjectResult(result);
                }
                catch (OperationCanceledException) when (timeoutCts.IsCancellationRequested)
                {
                    _logger.LogError(
                        "DataDictionarySuggestionAgent.SuggestAsync timed out after 90s for description '{Description}'",
                        request.Description);
                    return new ObjectResult(new
                    {
                        error = "La generación de la sugerencia tardó demasiado (búsqueda con Bing). Intenta de nuevo con una descripción más corta o vuelve a intentarlo en unos momentos.",
                    })
                    { StatusCode = 504 };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating data dictionary suggestion");
                return new ObjectResult(new { error = "No se pudo generar la sugerencia. Intenta de nuevo." })
                {
                    StatusCode = 500,
                };
            }
        }
    }
}
