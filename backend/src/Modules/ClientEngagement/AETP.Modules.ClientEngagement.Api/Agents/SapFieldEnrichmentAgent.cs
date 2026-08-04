using Azure.AI.Projects;
using Azure.AI.Projects.Agents;
using Azure.Identity;
using Microsoft.Agents.AI;
using Microsoft.Agents.AI.Foundry;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Configuration;

namespace AETP.Modules.ClientEngagement.Api.Agents
{
    /// <summary>One field's enrichment, exactly the 6-field JSON contract
    /// requested for the "🎯 Agente de Enriquecimiento de Campos SAP"
    /// feature — always a proposal for the FDE (asesor) to review before
    /// accepting, never auto-applied.</summary>
    public sealed class SapFieldEnrichmentResult
    {
        public string NombreCampo { get; set; } = string.Empty;

        public string Descripcion { get; set; } = string.Empty;

        public string Formato { get; set; } = string.Empty;

        public string ReglaNegocio { get; set; } = string.Empty;

        public string FuenteGrounding { get; set; } = string.Empty;

        public bool EncontradoEnGrounding { get; set; }
    }

    /// <summary>
    /// Given a SAP technical field name (e.g. "KLIMK", "CTLPC", "SKFOR",
    /// or a customer "Z*" custom field), searches the web via the
    /// "Grounding with Bing Search" tool and produces a structured, source-
    /// grounded explanation (description, format, business rule) — used
    /// when the asesor captures "🖥 Ubicación exacta en el sistema" for a
    /// dato at http://localhost:3000/deep-dive/p1/paso/nuevo and the
    /// sistema is SAP.
    ///
    /// SAME construction pattern as <see cref="DataDictionarySuggestionAgent"/>
    /// (the only other agent in this module using Azure AI Foundry + Bing
    /// Grounding instead of plain Azure OpenAI) — reuses the EXACT SAME
    /// Azure infrastructure, no new resources provisioned:
    /// - Foundry project "twinet" ("AzureAIFoundryProjectEndpoint").
    /// - Bing.Grounding connection "twinbing" ("BingGroundingConnectionId").
    /// - Model deployment "AzureOpenAIDeploymentName" (e.g. "gpt-4o").
    ///
    /// Results are cached by the caller (see SapFieldEnrichmentFunctions +
    /// SapFieldEnrichment entity) so a given field is only searched once
    /// (unless forceRefresh) — this agent itself does no caching/threading.
    /// </summary>
    public sealed class SapFieldEnrichmentAgent
    {
        private const string Instructions = """
            You are an SAP functional/technical expert helping a business
            consultant (asesor) understand a SAP technical field name they
            just captured while mapping a business process (e.g. "KLIMK",
            "CTLPC", "SKFOR", or a customer custom field starting with "Z").

            For the given field name:
            - Use the Bing search tool to find out what this field actually
              means in SAP (official SAP documentation, SAP Community,
              reputable SAP consulting/training sources). Never rely solely
              on your own memory — ground your answer in real search results.
            - NombreCampo: echo back the exact field name given.
            - Descripcion: one or two clear sentences explaining what this
              field represents in SAP and where it's typically used (e.g.
              which table/structure, which transaction/module).
            - Formato: the expected technical format if you can determine it
              (e.g. "CHAR(2)", "numeric, 2 decimals", "fecha AAAAMMDD").
            - ReglaNegocio: a concrete, checkable business rule commonly
              associated with this field if search results support one (e.g.
              a valid-values constraint or a validation rule); if none is
              clearly supported by search, return an empty string.
            - FuenteGrounding: the actual source(s) you found via search
              (e.g. "SAP Help Portal", "SAP Community", a specific URL/title)
              — never invent a source.
            - EncontradoEnGrounding: true ONLY if the Bing search tool
              actually returned relevant results you used; false if the
              search found nothing useful (this is EXPECTED and fine for
              customer-specific "Z*" custom fields, which are internal to
              each client and won't appear in public documentation — in that
              case, say so plainly in Descripcion instead of guessing, and
              leave Formato/ReglaNegocio empty).

            Never fabricate SAP documentation details that the search didn't
            actually support. This is always a proposal for a human to
            review before accepting.
            """;

        private readonly AIAgent? _agent;

        public SapFieldEnrichmentAgent(IConfiguration configuration)
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

            // Ver DataDictionarySuggestionAgent para la explicación completa
            // de por qué se excluye Managed Identity en desarrollo local
            // (sondeo lento a IMDS que hace parecer la llamada "colgada").
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
                name: "SapFieldEnrichmentAgent",
                tools: [FoundryAITool.CreateBingGroundingTool(bingOptions)]);
        }

        public bool IsConfigured => _agent is not null;

        public async Task<SapFieldEnrichmentResult> EnrichAsync(
            string fieldName,
            CancellationToken cancellationToken = default)
        {
            if (_agent is null)
            {
                throw new InvalidOperationException(
                    "The SAP field enrichment agent is not configured. Set the " +
                    "'AzureAIFoundryProjectEndpoint', 'BingGroundingConnectionId' and " +
                    "'AzureOpenAIDeploymentName' application settings once credentials are provided.");
            }

            var prompt = $"""
                Campo técnico de SAP: {fieldName}

                Investiga qué es este campo usando la búsqueda de Bing y produce
                la explicación estructurada fundamentada en fuentes reales, como
                se indicó en tus instrucciones.
                """;

            ChatMessage message = new(ChatRole.User, prompt);

            var response = await _agent.RunAsync<SapFieldEnrichmentResult>(message, cancellationToken: cancellationToken);

            response.Result.NombreCampo = fieldName;

            return response.Result;
        }
    }
}
