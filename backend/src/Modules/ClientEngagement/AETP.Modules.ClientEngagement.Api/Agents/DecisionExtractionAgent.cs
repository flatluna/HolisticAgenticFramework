using Azure.AI.OpenAI;
using Azure.Identity;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Configuration;

namespace AETP.Modules.ClientEngagement.Api.Agents
{
    /// <summary>One candidate decision point proposed by the agent from a
    /// Business Process's text. A suggestion for a human to review — nothing
    /// here is auto-saved as an authoritative record.</summary>
    public sealed class DecisionSuggestion
    {
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        /// <summary>Estratégica, Táctica or Operativa.</summary>
        public string DecisionType { get; set; } = "Operativa";

        /// <summary>Diaria, Semanal, Mensual, Trimestral or Ad-hoc.</summary>
        public string Frequency { get; set; } = "Mensual";

        /// <summary>Baja, Media or Alta.</summary>
        public string Complexity { get; set; } = "Media";

        /// <summary>Sí, No or Parcial — best guess of whether this decision
        /// already follows clear, documented rules.</summary>
        public string IsRuleBased { get; set; } = "No";

        /// <summary>If IsRuleBased is Sí/Parcial, the agent's best-effort
        /// description of the criteria/thresholds implied by the process
        /// text. Never invented specifics not implied by the source text.</summary>
        public string? RulesDescription { get; set; }

        /// <summary>Data fields/inputs this decision likely needs, inferred
        /// from the process text (e.g. "Edad, historial crediticio").</summary>
        public string? InputDataUsed { get; set; }

        /// <summary>Sí, No or Parcial — best guess of whether the data
        /// needed is likely available today, based on the process text.</summary>
        public string DataAvailability { get; set; } = "No";
    }

    /// <summary>The structured list of candidate decisions the extraction
    /// agent proposes for a single Business Process.</summary>
    public sealed class DecisionExtractionResult
    {
        public List<DecisionSuggestion> Decisions { get; set; } = [];
    }

    /// <summary>
    /// Reads a Business Process's captured text (name, description, main
    /// problems/opportunities) and asks a real LLM, via Microsoft Agent
    /// Framework (https://learn.microsoft.com/en-us/agent-framework/), to
    /// propose the candidate decision points ("puntos de decisión") that
    /// likely occur within that process — dimension 2.4 "Decisiones" of the
    /// "Diagnóstico y Madurez Actual" assessment.
    ///
    /// Built on the Azure OpenAI Chat Completion provider
    /// (<c>Microsoft.Agents.AI.OpenAI</c>) — same pattern as
    /// <see cref="OrgChartExtractionAgent"/> and the HumanOS reference
    /// project's JobDescriptionExtractionAgent, using an "economy" deployment
    /// when configured since this is bounded, structured-output extraction
    /// from already-provided text, not open-ended reasoning.
    ///
    /// This is always a proposal for a human to review/edit — nothing is
    /// auto-saved as an authoritative record.
    /// </summary>
    public sealed class DecisionExtractionAgent
    {
        private const string ExtractionInstructions = """
            You analyze the description of a business process and propose the
            candidate business decision points ("puntos de decisión") that
            likely occur within it — moments where someone chooses between
            options or approves/rejects something, producing a business
            outcome. For each candidate decision, propose:

            - Name: a short, specific name for the decision (e.g. "¿Aprobar o
              rechazar la solicitud de crédito?").
            - Description: one or two sentences describing what is decided.
            - DecisionType: "Estratégica" (long-term, high-impact),
              "Táctica" (mid-term, departmental) or "Operativa" (day-to-day,
              routine) — infer from the process context.
            - Frequency: "Diaria", "Semanal", "Mensual", "Trimestral" or
              "Ad-hoc" — how often this decision is likely made.
            - Complexity: "Baja", "Media" or "Alta".
            - IsRuleBased: "Sí" if the process text implies clear, explicit
              criteria/thresholds already exist for this decision; "Parcial"
              if some criteria are implied but likely incomplete/ambiguous;
              "No" if it appears to rely mostly on human judgment/tacit
              knowledge. Be conservative — default to "Parcial" or "No"
              unless the text clearly states explicit rules.
            - RulesDescription: only if IsRuleBased is "Sí" or "Parcial",
              describe the criteria/thresholds as implied by the text. Never
              invent specific numeric thresholds not implied by the source
              text — if unsure, describe the criteria qualitatively instead.
            - InputDataUsed: the data/fields this decision likely needs,
              inferred from the process text (e.g. "Edad, historial
              crediticio, score de buró").
            - DataAvailability: "Sí", "No" or "Parcial" — best guess of
              whether that data is likely available/reliable today, based on
              how the process is described (default to "Parcial" if unclear).

            Propose between 2 and 8 candidate decisions — only what is
            reasonably implied by the process text. Never invent decisions,
            criteria, or data that have no basis in the provided text. This
            is a provisional list for a human to review, edit, and confirm —
            it is not an authoritative record.
            """;

        private readonly AIAgent? _agent;

        public DecisionExtractionAgent(IConfiguration configuration)
        {
            var endpoint = configuration["AzureOpenAIEndpoint"];
            // Economy tier: bounded, structured-output extraction from
            // already-provided text ("only propose what's implied, never
            // invent"), not open-ended reasoning — falls back to the main
            // deployment if 'AzureOpenAIEconomyDeploymentName' isn't set.
            var deploymentName = configuration["AzureOpenAIEconomyDeploymentName"] ?? configuration["AzureOpenAIDeploymentName"];
            var apiKey = configuration["AzureOpenAIApiKey"];

            DeploymentName = deploymentName;

            if (string.IsNullOrWhiteSpace(endpoint) || string.IsNullOrWhiteSpace(deploymentName))
            {
                _agent = null;
                return;
            }

            AzureOpenAIClient client = string.IsNullOrWhiteSpace(apiKey)
                ? new AzureOpenAIClient(new Uri(endpoint), new DefaultAzureCredential())
                : new AzureOpenAIClient(new Uri(endpoint), new System.ClientModel.ApiKeyCredential(apiKey));

            _agent = client
                .GetChatClient(deploymentName)
                .AsIChatClient()
                .AsAIAgent(
                    instructions: ExtractionInstructions,
                    name: "DecisionExtractionAgent");
        }

        public bool IsConfigured => _agent is not null;

        /// <summary>The deployment/model name used for extraction, for
        /// diagnostics/audit purposes.</summary>
        public string? DeploymentName { get; }

        public async Task<DecisionExtractionResult> ExtractAsync(
            string processName,
            string? processDescription,
            string? mainProblems,
            string? mainOpportunities,
            CancellationToken cancellationToken = default)
        {
            if (_agent is null)
            {
                throw new InvalidOperationException(
                    "The Decision extraction agent is not configured. Set the " +
                    "'AzureOpenAIEndpoint' and 'AzureOpenAIDeploymentName' application settings " +
                    "once credentials are provided.");
            }

            var prompt = $"""
                Proceso: {processName}
                Descripción: {processDescription ?? "(no proporcionada)"}
                Principales problemas: {mainProblems ?? "(no proporcionados)"}
                Principales oportunidades: {mainOpportunities ?? "(no proporcionadas)"}

                Propón las decisiones de negocio candidatas para este proceso.
                """;

            ChatMessage message = new(ChatRole.User, prompt);

            var response = await _agent.RunAsync<DecisionExtractionResult>(message, cancellationToken: cancellationToken);

            return response.Result;
        }
    }
}
