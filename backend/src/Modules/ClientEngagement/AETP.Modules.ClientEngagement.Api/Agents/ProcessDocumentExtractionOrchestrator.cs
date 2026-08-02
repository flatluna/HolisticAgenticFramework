using System.Collections.Concurrent;
using System.Text.Json;
using AETP.Modules.ClientEngagement.Api.DTOs;
using AETP.Modules.Process.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AETP.Modules.ClientEngagement.Api.Agents
{
    public enum ProcessDocumentExtractionStage
    {
        Running,
        Completed,
        Failed
    }

    /// <summary>Point-in-time status of one background extraction run,
    /// returned by <see cref="ProcessDocumentExtractionOrchestrator.GetStatus"/>.</summary>
    public sealed class ProcessDocumentExtractionRunStatus
    {
        public Guid RunId { get; set; }

        public ProcessDocumentExtractionStage Stage { get; set; }

        public string? Step { get; set; }

        public ProcessDocumentDto? Result { get; set; }

        public string? ErrorMessage { get; set; }

        public static ProcessDocumentExtractionRunStatus Running(Guid runId, string step) =>
            new() { RunId = runId, Stage = ProcessDocumentExtractionStage.Running, Step = step };

        public static ProcessDocumentExtractionRunStatus Completed(Guid runId, ProcessDocumentDto result) =>
            new() { RunId = runId, Stage = ProcessDocumentExtractionStage.Completed, Result = result };

        public static ProcessDocumentExtractionRunStatus Failed(Guid runId, string errorMessage) =>
            new() { RunId = runId, Stage = ProcessDocumentExtractionStage.Failed, ErrorMessage = errorMessage };
    }

    /// <summary>
    /// Runs the (potentially multi-minute) process-document AI extraction
    /// call as a background task, independent of any single HTTP
    /// request/response cycle — same non-blocking start/poll pattern as
    /// HumanOS.Services.PdfCapabilityGraphOrchestrator (see
    /// C:\EducationAI\HumanOS\backend\HumanOS\Services\PdfCapabilityGraphOrchestrator.cs
    /// and its paired StartPdfCapabilityGraphFunction/GetPdfCapabilityGraphStatusFunction).
    ///
    /// Root cause this fixes (2026-07-24): awaiting the full AI extraction
    /// call directly inside the Functions HTTP trigger handler repeatedly
    /// left the Azure Functions host in a "zombie" state — the port stayed
    /// open/listening, but every subsequent request (even ones whose code
    /// always returns 200) got a generic, empty-body Kestrel 404, proving
    /// the isolated worker's channel to the host had silently died mid-call.
    /// Returning immediately with a RunId and polling <see cref="GetStatus"/>
    /// keeps every single HTTP request short-lived, regardless of how long
    /// the AI call itself takes.
    ///
    /// Prototype-scoped, same trade-off as the HumanOS reference: runs live
    /// only in this process's memory (no Durable Functions, no persistence
    /// of in-flight runs) — acceptable for local/dev use.
    /// </summary>
    public sealed class ProcessDocumentExtractionOrchestrator
    {
        /// <summary>Caps how many embedded page images get sent to
        /// <see cref="PdfImageDescriptionAgent"/> per run, so a PDF with an
        /// unusually large number of embedded images can't blow up run
        /// time/cost.</summary>
        private const int MaxImagesToDescribe = 40;

        /// <summary>Caps how many DISTINCT images get described PER PAGE, so
        /// one image-heavy page can't consume the entire
        /// <see cref="MaxImagesToDescribe"/> budget and starve every later
        /// page of any description.</summary>
        private const int MaxImagesPerPage = 8;

        private readonly ProcessDocumentExtractionAgent _extractionAgent;
        private readonly PdfImageDescriptionAgent _pdfImageDescription;
        private readonly IDbContextFactory<ProcessDbContext> _dbContextFactory;
        private readonly ILogger<ProcessDocumentExtractionOrchestrator> _logger;
        private readonly ConcurrentDictionary<Guid, ProcessDocumentExtractionRunStatus> _runs = new();

        public ProcessDocumentExtractionOrchestrator(
            ProcessDocumentExtractionAgent extractionAgent,
            PdfImageDescriptionAgent pdfImageDescriptionAgent,
            IDbContextFactory<ProcessDbContext> dbContextFactory,
            ILogger<ProcessDocumentExtractionOrchestrator> logger)
        {
            _extractionAgent = extractionAgent;
            _pdfImageDescription = pdfImageDescriptionAgent;
            _dbContextFactory = dbContextFactory;
            _logger = logger;
        }

        public bool IsConfigured => _extractionAgent.IsConfigured;

        /// <summary>Starts extraction in the background and returns
        /// IMMEDIATELY (Stage.Running) — never awaits the AI call. The
        /// ProcessDocument row referenced by <paramref name="documentId"/>
        /// must already be saved by the caller (ExtractionStatus="Subido")
        /// before calling this, so its Id is stable and known up front for
        /// the background task to update later. <paramref name="pages"/>
        /// comes from <see cref="Storage.PdfTextExtractor.ExtractPagesWithImages"/>
        /// — embedded images (above a minimum size) are described by
        /// <see cref="PdfImageDescriptionAgent"/> and folded back into each
        /// page's own text BEFORE the combined text is handed to
        /// <see cref="ProcessDocumentExtractionAgent"/>, so scanned/image-only
        /// pages still contribute real content.</summary>
        public ProcessDocumentExtractionRunStatus Start(
            Guid documentId,
            string processName,
            List<Storage.PdfTextExtractor.PageExtractionResult> pages)
        {
            var runId = Guid.NewGuid();
            _runs[runId] = ProcessDocumentExtractionRunStatus.Running(runId, "Leyendo PDF completo");

            _ = Task.Run(async () =>
            {
                try
                {
                    if (_pdfImageDescription.IsConfigured)
                    {
                        await DescribeEmbeddedImagesAsync(runId, pages);
                    }

                    var documentText = string.Join(
                        "\n\n",
                        pages.Select(p => p.Text).Where(t => !string.IsNullOrWhiteSpace(t)));

                    _runs[runId] = ProcessDocumentExtractionRunStatus.Running(runId, "Analizando documento completo");

                    var result = await _extractionAgent.ExtractAsync(processName, documentText);

                    await using var dbContext = await _dbContextFactory.CreateDbContextAsync();
                    var document = await dbContext.ProcessDocuments.FirstOrDefaultAsync(d => d.Id == documentId);
                    if (document is null)
                    {
                        _runs[runId] = ProcessDocumentExtractionRunStatus.Failed(runId, "El documento ya no existe.");
                        return;
                    }

                    document.ExtractedText = documentText;
                    document.ExecutiveSummary = result.ExecutiveSummary;
                    document.EntitiesJson = JsonSerializer.Serialize(result.Entities);
                    document.ExtractionStatus = "Procesado";
                    await dbContext.SaveChangesAsync();

                    var dto = new ProcessDocumentDto
                    {
                        Id = document.Id,
                        ProcessId = document.ProcessId,
                        FileName = document.FileName,
                        PageCount = document.PageCount,
                        ExtractionStatus = document.ExtractionStatus,
                        ExecutiveSummary = result.ExecutiveSummary,
                        People = result.Entities.People.Select(p => new ExtractedPersonDto { Name = p.Name, Role = p.Role }).ToList(),
                        Departments = result.Entities.Departments.Select(d => d.Name).ToList(),
                        Suggestions = result.Decisions.Select(d => new DecisionSuggestionDto
                        {
                            Name = d.Name,
                            Description = d.Description,
                            DecisionType = d.DecisionType,
                            Frequency = d.Frequency,
                            Complexity = d.Complexity,
                            IsRuleBased = d.IsRuleBased,
                            RulesDescription = d.RulesDescription,
                            InputDataUsed = d.InputDataUsed,
                            DataAvailability = d.DataAvailability,
                        }).ToList(),
                        CreatedAt = document.CreatedAt,
                    };

                    _runs[runId] = ProcessDocumentExtractionRunStatus.Completed(runId, dto);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Background process document extraction failed for document {DocumentId}", documentId);

                    try
                    {
                        await using var dbContext = await _dbContextFactory.CreateDbContextAsync();
                        var document = await dbContext.ProcessDocuments.FirstOrDefaultAsync(d => d.Id == documentId);
                        if (document is not null)
                        {
                            document.ExtractionStatus = "Error";
                            document.ExtractionError = ex.Message;
                            await dbContext.SaveChangesAsync();
                        }
                    }
                    catch (Exception saveEx)
                    {
                        _logger.LogError(saveEx, "Failed to persist extraction error for document {DocumentId}", documentId);
                    }

                    _runs[runId] = ProcessDocumentExtractionRunStatus.Failed(runId, ex.Message);
                }
            });

            return _runs[runId];
        }

        public ProcessDocumentExtractionRunStatus GetStatus(Guid runId)
        {
            if (_runs.TryGetValue(runId, out var status))
                return status;

            throw new InvalidOperationException($"No se encontró una extracción en curso con RunId '{runId}'.");
        }

        /// <summary>Describes every embedded image (above a minimum size)
        /// across all pages and folds each description back into its own
        /// page's text — ported from HumanOS's PdfCapabilityGraphPipelineService
        /// (C:\EducationAI\HumanOS\backend\HumanOS\Services\
        /// PdfCapabilityGraphPipelineService.cs), same dedup/budget approach.
        ///
        /// PdfPig's page.GetImages() yields one entry PER PLACEMENT in the
        /// content stream, not one per unique embedded resource — a single
        /// image drawn more than once (or reused across pages, e.g. a
        /// repeated logo/letterhead) shows up as several identical byte
        /// arrays. Each image's bytes are hashed and the vision model is only
        /// ever called once per unique hash; every occurrence still gets the
        /// resulting description folded into ITS OWN page's text.
        ///
        /// A PER-PAGE cap is enforced on top of the global budget so one
        /// image-heavy page can't consume the whole run's image budget and
        /// starve every later page. Best-effort throughout — one bad/
        /// unsupported image never fails the whole run.</summary>
        private async Task DescribeEmbeddedImagesAsync(Guid runId, List<Storage.PdfTextExtractor.PageExtractionResult> pages)
        {
            var descriptionsByHash = new Dictionary<string, string>();
            var describedImageCount = 0;

            var totalUniqueImages = pages
                .SelectMany(p => p.Images)
                .Select(image => Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(image.Bytes)))
                .Distinct()
                .Count();
            var progressTotal = Math.Min(MaxImagesToDescribe, totalUniqueImages);

            foreach (var page in pages)
            {
                var describedOnThisPage = 0;

                foreach (var image in page.Images)
                {
                    var hash = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(image.Bytes));

                    if (descriptionsByHash.TryGetValue(hash, out var cachedDescription))
                    {
                        page.Text = AppendImageDescription(page.Text, page.PageNumber, cachedDescription);
                        continue;
                    }

                    if (describedImageCount >= MaxImagesToDescribe || describedOnThisPage >= MaxImagesPerPage)
                    {
                        continue;
                    }

                    try
                    {
                        _runs[runId] = ProcessDocumentExtractionRunStatus.Running(
                            runId, $"Describiendo imagen {describedImageCount + 1}/{progressTotal} (página {page.PageNumber})");

                        var description = await _pdfImageDescription.DescribeAsync(image.Bytes, image.ContentType, page.Text);

                        descriptionsByHash[hash] = description;
                        page.Text = AppendImageDescription(page.Text, page.PageNumber, description);

                        describedImageCount++;
                        describedOnThisPage++;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to describe an embedded image on page {PageNumber} — continuing", page.PageNumber);
                    }
                }
            }
        }

        private static string AppendImageDescription(string pageText, int pageNumber, string description) =>
            string.IsNullOrWhiteSpace(pageText)
                ? $"[Descripción de imagen — página {pageNumber}]\n{description}"
                : $"{pageText}\n\n[Descripción de imagen — página {pageNumber}]\n{description}";
    }
}
