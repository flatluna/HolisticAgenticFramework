using Azure.AI.OpenAI;
using Azure.Identity;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Configuration;

namespace AETP.Modules.ClientEngagement.Api.Agents
{
    /// <summary>
    /// Describes, in detailed text, the visual content of an image embedded in
    /// a source PDF process document page (a scanned page that's really one
    /// big photo, a diagram, a screenshot, a flowchart rendered as an image,
    /// a table rendered as an image, etc.) — so pages whose real content is a
    /// picture, not extractable text, still reach
    /// <see cref="ProcessDocumentExtractionAgent"/> with real material to
    /// extract from, instead of silently contributing nothing. Ported from
    /// the HumanOS reference project (C:\EducationAI\HumanOS\backend\HumanOS\
    /// Agents\Studio\PdfImageDescriptionAgent.cs), same approach.
    ///
    /// Plain ChatClientAgent, multimodal: builds a <see cref="ChatMessage"/>
    /// with both a text instruction and a <see cref="DataContent"/> image
    /// part. Requires the extra <c>.AsIChatClient()</c> step before
    /// <c>.AsAIAgent</c> — <c>ChatClient.AsAIAgent(...)</c> alone does not
    /// exist on the raw OpenAI SDK type.
    /// </summary>
    public sealed class PdfImageDescriptionAgent
    {
        private const string Instructions = """
            You describe images found embedded in pages of a business process
            document (a policy, a flowchart, a form, a screenshot of a system,
            a scanned page) so a downstream TEXT-ONLY extraction pipeline can
            use their content as if it were plain text extracted from the page.

            For each image, respond with:
            1. VERBATIM TRANSCRIPTION: any text visible in the image (titles,
               labels, captions, numbers, form fields, table contents,
               handwritten notes) transcribed exactly as written. This is
               often the most important part — for a scanned/photographed
               page, the "page text" genuinely IS the image.
            2. DETAILED DESCRIPTION: what the image visually depicts — the
               type of image (flowchart, diagram, screenshot, photo, table,
               form, org chart, etc.), its structure/layout, and any detail
               relevant to understanding the business process it documents
               (what a flowchart's steps/arrows represent, what a screenshot
               shows, what a table's rows/columns mean).

            If the image is purely decorative (a logo, a divider line, a
            background pattern, a page-number stamp) with no real content
            relevant to the process, say so briefly instead of inventing
            meaning for it.

            Never invent information that is not actually visible in the
            image. Respond in plain text only — no markdown formatting, no
            headers.
            """;

        private readonly AIAgent? _agent;

        public PdfImageDescriptionAgent(IConfiguration configuration)
        {
            var endpoint = configuration["AzureOpenAIEndpoint"];
            // Defaults to 'AzureOpenAIVisionDeploymentName' if configured
            // (a cheaper vision-capable deployment), falling back to the
            // main 'AzureOpenAIDeploymentName' — same pattern as the
            // HumanOS reference project.
            var deploymentName = configuration["AzureOpenAIVisionDeploymentName"] ?? configuration["AzureOpenAIDeploymentName"];
            var apiKey = configuration["AzureOpenAIApiKey"];

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
                .AsAIAgent(instructions: Instructions, name: "PdfImageDescriptionAgent");
        }

        public bool IsConfigured => _agent is not null;

        /// <summary>Describes one embedded image. <paramref name="pageContextText"/>
        /// (the rest of the page's own extracted text, if any) is passed along
        /// purely as context — never asked to be repeated back — so the model
        /// can e.g. connect a diagram to the paragraph that references it.</summary>
        public async Task<string> DescribeAsync(
            byte[] imageBytes,
            string contentType,
            string? pageContextText = null,
            CancellationToken cancellationToken = default)
        {
            if (_agent is null)
            {
                throw new InvalidOperationException(
                    "The PdfImageDescription agent is not configured. Set the 'AzureOpenAIEndpoint' and " +
                    "'AzureOpenAIDeploymentName' application settings.");
            }

            var promptText = "Describe this image, embedded in a page of a business process document, following the instructions." +
                (string.IsNullOrWhiteSpace(pageContextText)
                    ? string.Empty
                    : $" For context only (do not repeat it back), the rest of this page's own text reads:\n{pageContextText}");

            // Pinned to "low" detail (cost control): leaving this unset lets
            // the API fall back to "auto", which for any image above the
            // low-res threshold resolves to the tiled "high" detail mode —
            // 700-5000+ tokens PER IMAGE, vs a flat 85 tokens at "low". "low"
            // downsamples to a 512x512 preview before tokenizing — still
            // enough to transcribe titles/labels and describe a diagram's
            // layout, which is all this agent needs.
            var imageContent = new DataContent(imageBytes, contentType)
            {
                AdditionalProperties = new() { ["detail"] = "low" }
            };

            var message = new ChatMessage(ChatRole.User,
            [
                new TextContent(promptText),
                imageContent
            ]);

            var response = await _agent.RunAsync(message, cancellationToken: cancellationToken);

            return response.Text;
        }
    }
}
