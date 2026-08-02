using Azure.AI.OpenAI;
using Azure.Identity;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Configuration;

namespace AETP.Modules.ClientEngagement.Api.Agents
{
    /// <summary>One person/box detected in the org chart image.</summary>
    public sealed class OrgChartPersonNode
    {
        public string Name { get; set; } = string.Empty;

        public string Position { get; set; } = string.Empty;

        /// <summary>The exact Name of this person's manager, as it appears
        /// elsewhere in <see cref="OrgChartExtractionResult.People"/>. Empty
        /// for the top of the chart (e.g. the CEO), who reports to no one.</summary>
        public string? ReportsTo { get; set; }

        /// <summary>Hierarchy depth: 0 for the top of the chart (CEO/root),
        /// 1 for people who report directly to the top, 2 for the next
        /// level down, and so on.</summary>
        public int Level { get; set; }
    }

    /// <summary>The structured organization hierarchy the extraction agent
    /// proposes from an uploaded org chart image. A proposal for a human to
    /// review — nothing here is auto-applied as an authoritative record.</summary>
    public sealed class OrgChartExtractionResult
    {
        public List<OrgChartPersonNode> People { get; set; } = [];
    }

    /// <summary>
    /// Reads an uploaded org chart image and asks a real, vision-capable
    /// LLM, via Microsoft Agent Framework
    /// (https://learn.microsoft.com/en-us/agent-framework/), to extract the
    /// full organization hierarchy from it: every person's name, position,
    /// who they report to, and their level in the hierarchy starting from
    /// the CEO/top box.
    ///
    /// Built on the Azure OpenAI Chat Completion provider
    /// (<c>Microsoft.Agents.AI.OpenAI</c>) — same configuration pattern as
    /// HumanOS's JobDescriptionExtractionAgent/TocExtractionAgent, extended
    /// with multimodal image input (see
    /// https://learn.microsoft.com/en-us/agent-framework/agents/multimodal).
    /// The agent only extracts what is explicitly visible in the image; it
    /// must never invent people, positions, or reporting lines.
    ///
    /// Requires a vision-capable deployment (e.g. "gpt-4o", "gpt-4o-mini")
    /// configured via the "AzureOpenAIDeploymentName" application setting.
    /// Set "AzureOpenAIEndpoint" and "AzureOpenAIDeploymentName" once real
    /// credentials are provided. Optionally set "AzureOpenAIApiKey" for
    /// key-based auth; otherwise falls back to
    /// <see cref="DefaultAzureCredential"/> (Managed Identity in Azure).
    /// Until configured, <see cref="IsConfigured"/> is false and extraction
    /// is rejected with a clear error.
    /// </summary>
    public sealed class OrgChartExtractionAgent
    {
        private const string ExtractionInstructions = """
            You extract the organization hierarchy from an org chart image
            (a diagram of boxes connected by lines showing who reports to
            whom). For every person/box you can see in the image, extract:

            - Name: the person's name as written in the box. If only a
              position/title is shown with no name, leave Name empty.
            - Position: the job title/role as written in the box.
            - ReportsTo: the exact Name of the person directly above them
              in the hierarchy (their manager), matching another entry's
              Name exactly. Leave empty for the top of the chart (e.g. the
              CEO), who reports to no one shown in the image.
            - Level: 0 for the top/root box of the chart, 1 for boxes that
              report directly to the top, 2 for the next level down, and
              so on, based on the visual hierarchy in the image.

            Only extract people and positions that are explicitly visible
            in the image. Never invent people, positions, or reporting
            lines that aren't shown. This is a provisional extraction for
            a human to review and confirm — it is not an authoritative
            record.
            """;

        private readonly AIAgent? _agent;

        public OrgChartExtractionAgent(IConfiguration configuration)
        {
            var endpoint = configuration["AzureOpenAIEndpoint"];
            var deploymentName = configuration["AzureOpenAIDeploymentName"];
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
                    name: "OrgChartExtractionAgent");
        }

        public bool IsConfigured => _agent is not null;

        /// <summary>The deployment/model name used for extraction (e.g.
        /// "gpt-4o"), for diagnostics/audit purposes.</summary>
        public string? DeploymentName { get; }

        public async Task<OrgChartExtractionResult> ExtractAsync(
            byte[] imageBytes,
            string contentType,
            CancellationToken cancellationToken = default)
        {
            if (_agent is null)
            {
                throw new InvalidOperationException(
                    "The Org Chart extraction agent is not configured. Set the " +
                    "'AzureOpenAIEndpoint' and 'AzureOpenAIDeploymentName' (a vision-capable " +
                    "deployment, e.g. 'gpt-4o') application settings once credentials are provided.");
            }

            ChatMessage message = new(ChatRole.User,
            [
                new TextContent("Extract the full organization hierarchy from this org chart image."),
                new DataContent(imageBytes, contentType),
            ]);

            var response = await _agent.RunAsync<OrgChartExtractionResult>(message, cancellationToken: cancellationToken);

            return response.Result;
        }
    }
}
