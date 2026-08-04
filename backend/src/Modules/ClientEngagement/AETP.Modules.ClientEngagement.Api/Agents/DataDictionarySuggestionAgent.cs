using Azure.AI.Projects;
using Azure.AI.Projects.Agents;
using Azure.Identity;
using Microsoft.Agents.AI;
using Microsoft.Agents.AI.Foundry;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Configuration;

namespace AETP.Modules.ClientEngagement.Api.Agents
{
    /// <summary>One candidate business rule proposed for a canonical data
    /// item (e.g. "La fecha de nacimiento no puede ser posterior a hoy").
    /// Shaped to map directly onto the frontend's BusinessRule editor.</summary>
    public sealed class DataDictionaryRuleSuggestion
    {
        public string Description { get; set; } = string.Empty;

        /// <summary>Who typically owns/authorizes this rule (role, not a
        /// person), e.g. "Área de Cumplimiento".</summary>
        public string? Owner { get; set; }

        /// <summary>Where the rule comes from — a law/regulation, an
        /// internal policy, or general best practice.</summary>
        public string? Source { get; set; }
    }

    /// <summary>The full set of suggestions the agent proposes for one
    /// canonical data item, from a short natural-language description
    /// (e.g. "RFC en México" or "fecha de nacimiento"). Always a proposal
    /// for a human to review/edit before saving — nothing is auto-applied.</summary>
    public sealed class DataDictionarySuggestionResult
    {
        public string OfficialName { get; set; } = string.Empty;

        public string? TechnicalName { get; set; }

        public List<string> Synonyms { get; set; } = [];

        /// <summary>One of: texto, numero, fecha, booleano, identificador, monto, documento, otro.</summary>
        public string DataType { get; set; } = "texto";

        public string? Description { get; set; }

        public string? Format { get; set; }

        public bool IsPII { get; set; }

        /// <summary>Suggested role/area that should own this data (e.g.
        /// "Recursos Humanos"), not a person's name.</summary>
        public string? SuggestedOwner { get; set; }

        /// <summary>Systems where this kind of data is commonly captured
        /// or stored (e.g. "SAP", "Salesforce"), best-effort.</summary>
        public List<string> PossibleSourceSystems { get; set; } = [];

        /// <summary>Legal/regulatory references grounded in real, current
        /// sources (e.g. "Ley Federal de Protección de Datos Personales en
        /// Posesión de los Particulares (México)"), found via web search —
        /// never invented.</summary>
        public List<string> LegalReferences { get; set; } = [];

        /// <summary>General data-governance best practices for this kind
        /// of data (validation, retention, masking, etc.).</summary>
        public List<string> BestPractices { get; set; } = [];

        public List<DataDictionaryRuleSuggestion> BusinessRules { get; set; } = [];
    }

    /// <summary>
    /// Given a short natural-language description of a data item (e.g. "RFC
    /// en México", "fecha de nacimiento del empleado"), proposes a complete
    /// data-dictionary entry: official/technical names, synonyms, data
    /// type, PII flag, likely owner, likely source systems, and — grounded
    /// in a real Bing web search rather than the model's own memory — the
    /// applicable legal/regulatory references and business rules (e.g. "la
    /// fecha de nacimiento no puede ser posterior a hoy").
    ///
    /// Unlike every other agent in this module (plain
    /// <c>Azure.AI.OpenAI</c> + <c>Microsoft.Agents.AI.OpenAI</c>), this one
    /// runs through an Azure AI Foundry PROJECT
    /// (<c>Azure.AI.Projects</c> + <c>Microsoft.Agents.AI.Foundry</c>) so it
    /// can use the "Grounding with Bing Search" tool
    /// (https://learn.microsoft.com/en-us/azure/ai-foundry/agents/how-to/tools/bing-grounding).
    /// This reuses EXISTING Azure infrastructure — no new resources were
    /// provisioned for this feature:
    /// - Foundry project: "twinet" under the "twinet-resource" account (the
    ///   same account already used for AzureOpenAIEndpoint elsewhere in
    ///   this module) — endpoint via "AzureAIFoundryProjectEndpoint".
    /// - A "Bing.Grounding" resource ("twinbing") already connected to that
    ///   project as connection "twinbing" — its full connection resource ID
    ///   is set via "BingGroundingConnectionId".
    /// - Model deployment: reuses "AzureOpenAIDeploymentName" (e.g. "gpt-4o"),
    ///   since it's deployed on the same underlying account.
    ///
    /// Auth is always via <see cref="DefaultAzureCredential"/> (Foundry
    /// project data-plane requires Entra ID, not API keys) — falls back to
    /// the developer's `az login` session locally, Managed Identity in Azure.
    /// Until "AzureAIFoundryProjectEndpoint" and "BingGroundingConnectionId"
    /// are configured, <see cref="IsConfigured"/> is false.
    /// </summary>
    public sealed class DataDictionarySuggestionAgent
    {
        private const string Instructions = """
            You are an expert data governance analyst helping a business
            consultant fill out a canonical data-dictionary entry. Given a
            short description of a data item (often just a name, e.g. "RFC
            en México" or "fecha de nacimiento del empleado"), propose a
            complete entry:

            - OfficialName: a clear, official business name for the data.
            - TechnicalName: how it's commonly named technically (e.g. a
              typical field/column name).
            - Synonyms: other names/aliases business users might use.
            - DataType: one of texto, numero, fecha, booleano, identificador,
              monto, documento, otro — pick the single best fit.
            - Description: one or two sentences describing what the data
              represents.
            - Format: expected format/length if relevant (e.g. "13 caracteres
              alfanuméricos").
            - IsPII: true if this is personal/sensitive data.
            - SuggestedOwner: the role/area that should own this data (e.g.
              "Recursos Humanos", "Cumplimiento") — a role, never a person's
              name.
            - PossibleSourceSystems: common enterprise systems where this
              kind of data is typically captured/stored (e.g. SAP,
              Salesforce, Workday) — general knowledge, not invented specifics.
            - LegalReferences: use the Bing search tool to find REAL, current
              laws/regulations that govern this data (include the country
              when the description implies one, e.g. Mexican RFC → cite the
              actual applicable Mexican tax/data-protection law). Only cite
              what you actually found via search — never invent a law name.
              If search finds nothing directly applicable, return an empty
              list rather than guessing.
            - BestPractices: general data-governance best practices for this
              kind of data (validation, masking, retention), grounded in
              search results where possible.
            - BusinessRules: concrete, checkable capture/validation rules for
              this data (e.g. for a birth date: "La fecha de nacimiento no
              puede ser posterior a la fecha actual"). For each rule, also
              suggest Owner (role that authorizes it) and Source (law,
              internal policy, or "mejor práctica general").

            Always use the Bing search tool to ground LegalReferences and
            BestPractices in real, current sources — do not rely solely on
            your own memory for legal/regulatory claims. This is always a
            proposal for a human to review and edit before saving — never
            claim more certainty than the search results support.
            """;

        private readonly AIAgent? _agent;

        public DataDictionarySuggestionAgent(IConfiguration configuration)
        {
            var projectEndpoint = configuration["AzureAIFoundryProjectEndpoint"];
            var bingConnectionId = configuration["BingGroundingConnectionId"];
            var deploymentName = configuration["AzureOpenAIDeploymentName"];

            DeploymentName = deploymentName;

            if (string.IsNullOrWhiteSpace(projectEndpoint)
                || string.IsNullOrWhiteSpace(bingConnectionId)
                || string.IsNullOrWhiteSpace(deploymentName))
            {
                _agent = null;
                return;
            }

            // NOTA: ManagedIdentityCredential se excluye explícitamente porque en
            // esta máquina de desarrollo local su sondeo a IMDS (169.254.169.254)
            // no falla rápido — reintenta 2-3 veces a ~21s cada una (>40s en
            // total) antes de ceder el turno a AzureCliCredential/VisualStudio
            // Credential, lo cual hacía que CUALQUIER llamada al agente pareciera
            // "colgada" indefinidamente. Verificado con un probe aislado usando
            // AzureEventSourceListener: sin esta exclusión, DefaultAzureCredential
            // nunca llega a intentar las credenciales de desarrollador dentro de
            // un timeout razonable. En Azure real (WEBSITE_INSTANCE_ID presente)
            // Managed Identity sí se usa normalmente.
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
                name: "DataDictionarySuggestionAgent",
                tools: [FoundryAITool.CreateBingGroundingTool(bingOptions)]);
        }

        public bool IsConfigured => _agent is not null;

        /// <summary>The deployment/model name used, for diagnostics/audit purposes.</summary>
        public string? DeploymentName { get; }

        public async Task<DataDictionarySuggestionResult> SuggestAsync(
            string description,
            CancellationToken cancellationToken = default)
        {
            if (_agent is null)
            {
                throw new InvalidOperationException(
                    "The Data Dictionary suggestion agent is not configured. Set the " +
                    "'AzureAIFoundryProjectEndpoint', 'BingGroundingConnectionId' and " +
                    "'AzureOpenAIDeploymentName' application settings once credentials are provided.");
            }

            var prompt = $"""
                Descripción del dato: {description}

                Propón la entrada completa del diccionario de datos para este dato,
                usando la búsqueda de Bing para fundamentar las referencias legales
                y mejores prácticas en fuentes reales y actuales.
                """;

            ChatMessage message = new(ChatRole.User, prompt);

            var response = await _agent.RunAsync<DataDictionarySuggestionResult>(message, cancellationToken: cancellationToken);

            return response.Result;
        }
    }
}
