using Azure.AI.OpenAI;
using Azure.Identity;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Configuration;

namespace AETP.Modules.ClientEngagement.Api.Agents
{
    /// <summary>A person mentioned in a process document, as identified by
    /// <see cref="ProcessDocumentExtractionAgent"/>.</summary>
    public sealed class ExtractedPersonEntity
    {
        public string Name { get; set; } = string.Empty;

        /// <summary>Role/title as mentioned in the text, if any (e.g.
        /// "Gerente de Crédito").</summary>
        public string? Role { get; set; }
    }

    /// <summary>A department/area mentioned in a process document, as
    /// identified by <see cref="ProcessDocumentExtractionAgent"/>.</summary>
    public sealed class ExtractedDepartmentEntity
    {
        public string Name { get; set; } = string.Empty;
    }

    /// <summary>Entities mentioned in a process document.</summary>
    public sealed class ProcessDocumentEntities
    {
        public List<ExtractedPersonEntity> People { get; set; } = [];

        public List<ExtractedDepartmentEntity> Departments { get; set; } = [];
    }

    /// <summary>
    /// The full structured result of reading an entire process document in
    /// one pass: an executive summary, the people/departments mentioned,
    /// and every candidate business decision found — all extracted together
    /// so decisions keep the context of the whole document (a decision
    /// described in one section may only make sense together with a rule
    /// stated elsewhere), instead of being extracted page-by-page.
    /// </summary>
    public sealed class ProcessDocumentExtractionResult
    {
        public string ExecutiveSummary { get; set; } = string.Empty;

        public ProcessDocumentEntities Entities { get; set; } = new();

        public List<DecisionSuggestion> Decisions { get; set; } = [];
    }

    /// <summary>
    /// Reads the FULL extracted text of a process document (typically a
    /// 10-50 page PDF, already converted to plain text via
    /// <see cref="Storage.PdfTextExtractor"/>) in a single agent call, and
    /// proposes: an executive summary, the people/departments mentioned, and
    /// every candidate decision point found in the document — dimension 2.4
    /// "Decisiones" of the "Diagnóstico y Madurez Actual" assessment.
    ///
    /// Deliberately a single call over the whole document rather than one
    /// call per page/chunk: a modern chat model's context window (128k+
    /// tokens) comfortably fits a 40-50 page business document (~20-35k
    /// tokens), and splitting would risk losing decisions whose full
    /// definition spans multiple sections, plus force a de-duplication pass.
    /// Chunking is only needed for a future embeddings/vector-search index,
    /// not for this extraction.
    ///
    /// Uses the "economy" deployment (e.g. gpt-5-mini) when configured,
    /// same pattern as <see cref="DecisionExtractionAgent"/> — this is
    /// bounded, structured-output extraction from already-provided text,
    /// not open-ended reasoning.
    ///
    /// Always a proposal for a human to review/edit — nothing is auto-saved
    /// as an authoritative record.
    /// </summary>
    public sealed class ProcessDocumentExtractionAgent
    {
        private const string ExtractionInstructions = """
            You read the full text of a business process document (a PDF
            converted to plain text, possibly 10-50 pages) and extract, in a
            single pass:

            1. ExecutiveSummary: a concise (4-8 sentence) executive summary
               of what the process is, its purpose, and its overall current
               state, based only on the document text.

            2. Entities: every person and department/area explicitly
               mentioned in the document.
               - People: Name and, if mentioned, Role/title (e.g. "Gerente
                 de Crédito"). Do not invent people not named in the text.
               - Departments: every distinct department/area/team name
                 mentioned.

            3. Decisions: every candidate business decision point ("punto de
               decisión") described or implied anywhere in the document —
               moments where someone chooses between options or
               approves/rejects something, producing a business outcome.
               For each candidate decision, propose:
               - Name: a short, specific name (e.g. "¿Aprobar o rechazar la
                 solicitud de crédito?").
               - Description: one or two sentences describing what is decided.
               - DecisionType: "Estratégica", "Táctica" or "Operativa".
               - Frequency: "Diaria", "Semanal", "Mensual", "Trimestral" or
                 "Ad-hoc".
               - Complexity: "Baja", "Media" or "Alta".
               - IsRuleBased: "Sí" if the text implies clear, explicit
                 criteria/thresholds already exist; "Parcial" if some
                 criteria are implied but likely incomplete/ambiguous; "No"
                 if it appears to rely mostly on human judgment/tacit
                 knowledge. Be conservative — default to "Parcial" or "No"
                 unless the text clearly states explicit rules.
               - RulesDescription: only if IsRuleBased is "Sí" or "Parcial",
                 describe the criteria/thresholds as implied by the text.
                 Never invent specific numeric thresholds not implied by the
                 source text.
               - InputDataUsed: the data/fields this decision likely needs,
                 inferred from the text.
               - DataAvailability: "Sí", "No" or "Parcial" — best guess of
                 whether that data is likely available/reliable today.

            Cover the WHOLE document — decisions may be described in any
            section, and a single decision's full definition (e.g. its
            rules) may span more than one section. Do not duplicate the same
            decision twice. Never invent decisions, entities, or data that
            have no basis in the provided text. This is a provisional result
            for a human to review, edit, and confirm — it is not an
            authoritative record.
            """;

        private readonly AIAgent? _agent;

        public ProcessDocumentExtractionAgent(IConfiguration configuration)
        {
            var endpoint = configuration["AzureOpenAIEndpoint"];
            // Economy tier: bounded, structured-output extraction from
            // already-provided text, not open-ended reasoning — falls back
            // to the main deployment if 'AzureOpenAIEconomyDeploymentName'
            // isn't set.
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
                    name: "ProcessDocumentExtractionAgent");
        }

        public bool IsConfigured => _agent is not null;

        /// <summary>The deployment/model name used for extraction, for
        /// diagnostics/audit purposes.</summary>
        public string? DeploymentName { get; }

        public async Task<ProcessDocumentExtractionResult> ExtractAsync(
            string processName,
            string documentText,
            CancellationToken cancellationToken = default)
        {
            if (_agent is null)
            {
                throw new InvalidOperationException(
                    "The Process Document extraction agent is not configured. Set the " +
                    "'AzureOpenAIEndpoint' and 'AzureOpenAIDeploymentName' application settings " +
                    "once credentials are provided.");
            }

            var prompt = $"""
                Proceso: {processName}

                Texto completo del documento:
                {documentText}

                Extrae el resumen ejecutivo, las entidades (personas y
                departamentos) mencionadas, y todas las decisiones de
                negocio candidatas de este documento.
                """;

            ChatMessage message = new(ChatRole.User, prompt);

            var response = await _agent.RunAsync<ProcessDocumentExtractionResult>(message, cancellationToken: cancellationToken);

            return response.Result;
        }
    }
}
