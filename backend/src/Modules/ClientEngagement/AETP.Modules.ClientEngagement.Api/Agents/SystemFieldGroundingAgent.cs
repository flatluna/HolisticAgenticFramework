using Azure.AI.Projects;
using Azure.AI.Projects.Agents;
using Azure.Identity;
using Microsoft.Agents.AI;
using Microsoft.Agents.AI.Foundry;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Configuration;

namespace AETP.Modules.ClientEngagement.Api.Agents
{
    /// <summary>Enriquecimiento fundamentado en Bing de UN campo — segundo
    /// paso del flujo de "📸 Extraer campos desde captura de pantalla" (ver
    /// <see cref="SystemScreenshotExtractionAgent"/> para el primer paso,
    /// solo visión). Mismo contrato de 6 campos que
    /// <see cref="SapFieldEnrichmentResult"/>, pero generalizado a
    /// CUALQUIER sistema (no solo SAP) — el nombre del sistema es un
    /// parámetro de <see cref="SystemFieldGroundingAgent.EnrichAsync"/>.</summary>
    public sealed class SystemFieldGroundingResult
    {
        public string Descripcion { get; set; } = string.Empty;

        public string Formato { get; set; } = string.Empty;

        public string ReglaNegocio { get; set; } = string.Empty;

        public string FuenteGrounding { get; set; } = string.Empty;

        public bool EncontradoEnGrounding { get; set; }
    }

    /// <summary>
    /// Dado el nombre de un sistema (ej. "SAP", "Salesforce", "Oracle
    /// NetSuite" — lo que el asesor ya seleccionó como "🖥 Sistema" en
    /// http://localhost:3000/deep-dive/p1/paso/nuevo) y el nombre de un
    /// campo visto en una captura de pantalla, busca en la web vía
    /// "Grounding with Bing Search" (ej. "SAP campo Solicitante", "Salesforce
    /// field Importe neto") y produce una explicación estructurada
    /// fundamentada en fuentes reales — usado por
    /// <see cref="SystemScreenshotExtractionOrchestrator"/> para enriquecer
    /// CADA campo que <see cref="SystemScreenshotExtractionAgent"/> detectó
    /// solo visualmente.
    ///
    /// MISMO patrón Azure AI Foundry + Bing Grounding que
    /// <see cref="SapFieldEnrichmentAgent"/> y
    /// <see cref="DataDictionarySuggestionAgent"/> — reutiliza la MISMA
    /// infraestructura ya existente (proyecto "twinet" + conexión Bing
    /// "twinbing"), nada nuevo aprovisionado. Si Foundry/Bing no están
    /// configurados, <see cref="IsConfigured"/> es false y el orquestador
    /// simplemente se queda con la propuesta solo-visión (degradación
    /// controlada, nunca bloquea la extracción completa).
    /// </summary>
    public sealed class SystemFieldGroundingAgent
    {
        private const string Instructions = """
            You are an enterprise-systems functional/technical expert
            helping a business consultant (asesor) understand a field they
            just saw on a screen of an enterprise system (SAP, Salesforce,
            Oracle, Dynamics, or any other ERP/CRM/internal system) while
            mapping a business process.

            For the given system name and field name/label:
            - Use the Bing search tool to find out what this field typically
              means in that specific system (official documentation,
              vendor community forums, reputable consulting/training
              sources). Never rely solely on your own memory — ground your
              answer in real search results.
            - Descripcion: one or two clear sentences explaining what this
              field represents in that system and where it's typically used
              (which module/screen/table if you can determine it).
            - Formato: the expected technical format if you can determine it
              (e.g. "CHAR(2)", "numeric, 2 decimals", "fecha AAAAMMDD").
            - ReglaNegocio: a concrete, checkable business rule commonly
              associated with this field if search results support one; if
              none is clearly supported by search, return an empty string.
            - FuenteGrounding: the actual source(s) you found via search
              (e.g. "SAP Help Portal", "Salesforce Help", a specific
              URL/title) — never invent a source.
            - EncontradoEnGrounding: true ONLY if the Bing search tool
              actually returned relevant results you used; false if the
              search found nothing useful (this is EXPECTED for internal/
              custom fields specific to one client, which won't appear in
              public documentation — in that case, say so plainly in
              Descripcion instead of guessing, and leave Formato/
              ReglaNegocio empty).

            Never fabricate documentation details that the search didn't
            actually support. This is always a proposal for a human to
            review before accepting.
            """;

        private readonly AIAgent? _agent;

        public SystemFieldGroundingAgent(IConfiguration configuration)
        {
            var projectEndpoint = configuration["AzureAIFoundryProjectEndpoint"];
            var bingConnectionId = configuration["BingGroundingConnectionId"];
            var deploymentName = configuration["AzureOpenAIDeploymentName"];

            if (string.IsNullOrWhiteSpace(projectEndpoint)
                || string.IsNullOrWhiteSpace(bingConnectionId)
                || string.IsNullOrWhiteSpace(deploymentName))
            {
                _agent = null;
                return;
            }

            // Ver SapFieldEnrichmentAgent/DataDictionarySuggestionAgent para
            // la explicación completa de por qué se excluye Managed Identity
            // en desarrollo local (sondeo lento a IMDS que hace parecer la
            // llamada "colgada").
            var runningInAzure = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("WEBSITE_INSTANCE_ID"));
            var credentialOptions = new DefaultAzureCredentialOptions
            {
                ExcludeManagedIdentityCredential = !runningInAzure,
            };

            AIProjectClient projectClient = new(new Uri(projectEndpoint), new DefaultAzureCredential(credentialOptions));

            BingGroundingSearchToolOptions bingOptions = new(
                searchConfigurations: [new BingGroundingSearchConfiguration(bingConnectionId)]);

            _agent = projectClient.AsAIAgent(
                deploymentName,
                instructions: Instructions,
                name: "SystemFieldGroundingAgent",
                tools: [FoundryAITool.CreateBingGroundingTool(bingOptions)]);
        }

        public bool IsConfigured => _agent is not null;

        public async Task<SystemFieldGroundingResult> EnrichAsync(
            string systemName,
            string fieldName,
            string visualContext,
            CancellationToken cancellationToken = default)
        {
            if (_agent is null)
            {
                throw new InvalidOperationException(
                    "El agente de enriquecimiento de campos no está configurado. Configura " +
                    "'AzureAIFoundryProjectEndpoint', 'BingGroundingConnectionId' y 'AzureOpenAIDeploymentName'.");
            }

            var systemLabel = string.IsNullOrWhiteSpace(systemName) ? "un sistema empresarial" : systemName;

            var prompt = $"""
                Sistema: {systemLabel}
                Campo/etiqueta visto en pantalla: {fieldName}
                Contexto visual ya inferido (mejor esfuerzo, sin fundamentar aún): {visualContext}

                Investiga qué es este campo en ese sistema usando la búsqueda de Bing y
                produce la explicación estructurada fundamentada en fuentes reales, como
                se indicó en tus instrucciones.
                """;

            ChatMessage message = new(ChatRole.User, prompt);

            var response = await _agent.RunAsync<SystemFieldGroundingResult>(message, cancellationToken: cancellationToken);

            return response.Result;
        }
    }
}
