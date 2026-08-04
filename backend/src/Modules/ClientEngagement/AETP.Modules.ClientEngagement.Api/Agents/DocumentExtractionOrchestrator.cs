using System.Collections.Concurrent;
using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using AETP.Modules.ClientEngagement.Api.DTOs;
using AETP.Modules.Process.Domain;
using AETP.Modules.Process.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UglyToad.PdfPig;

namespace AETP.Modules.ClientEngagement.Api.Agents
{
    public enum DocumentExtractionStage
    {
        Running,
        Completed,
        Failed
    }

    /// <summary>Point-in-time status of one background source-document
    /// extraction run, returned by
    /// <see cref="DocumentExtractionOrchestrator.GetStatus"/>.</summary>
    public sealed class DocumentExtractionRunStatus
    {
        public Guid RunId { get; set; }

        public DocumentExtractionStage Stage { get; set; }

        public string? Step { get; set; }

        public DocumentExtractionDto? Result { get; set; }

        public string? ErrorMessage { get; set; }

        public static DocumentExtractionRunStatus Running(Guid runId, string step) =>
            new() { RunId = runId, Stage = DocumentExtractionStage.Running, Step = step };

        public static DocumentExtractionRunStatus Completed(Guid runId, DocumentExtractionDto result) =>
            new() { RunId = runId, Stage = DocumentExtractionStage.Completed, Result = result };

        public static DocumentExtractionRunStatus Failed(Guid runId, string errorMessage) =>
            new() { RunId = runId, Stage = DocumentExtractionStage.Failed, ErrorMessage = errorMessage };
    }

    /// <summary>
    /// Runs the <see cref="DocumentExtractionAgent"/> call as a background
    /// task — same non-blocking start/poll pattern as
    /// <see cref="ProcessDocumentExtractionOrchestrator"/> (which itself
    /// fixed a recurring "zombie Functions host" bug: awaiting a
    /// multi-minute AI call directly inside an HTTP trigger handler
    /// repeatedly killed the isolated worker's channel to the host).
    ///
    /// Saves the completed 6-block result onto the SAME
    /// <see cref="DocumentExtraction"/> row created by the caller (Subido →
    /// Procesado/Error), preserving its Proceso/Paso/Fuente/Empresa
    /// traceability the whole time.
    /// </summary>
    public sealed class DocumentExtractionOrchestrator
    {
        /// <summary>Caps how many embedded page images get sent to
        /// <see cref="PdfImageDescriptionAgent"/> per run — same budget
        /// rationale as ProcessDocumentExtractionOrchestrator.</summary>
        private const int MaxImagesToDescribe = 40;

        /// <summary>Caps how many DISTINCT images get described PER PAGE.</summary>
        private const int MaxImagesPerPage = 8;

        private static readonly JsonSerializerOptions EnumAsStringJson = new()
        {
            Converters = { new JsonStringEnumConverter() }
        };

        private readonly DocumentExtractionAgent _extractionAgent;
        private readonly PdfImageDescriptionAgent _pdfImageDescription;
        private readonly IDbContextFactory<ProcessDbContext> _dbContextFactory;
        private readonly ILogger<DocumentExtractionOrchestrator> _logger;
        private readonly ConcurrentDictionary<Guid, DocumentExtractionRunStatus> _runs = new();

        public DocumentExtractionOrchestrator(
            DocumentExtractionAgent extractionAgent,
            PdfImageDescriptionAgent pdfImageDescriptionAgent,
            IDbContextFactory<ProcessDbContext> dbContextFactory,
            ILogger<DocumentExtractionOrchestrator> logger)
        {
            _extractionAgent = extractionAgent;
            _pdfImageDescription = pdfImageDescriptionAgent;
            _dbContextFactory = dbContextFactory;
            _logger = logger;
        }

        public bool IsConfigured => _extractionAgent.IsConfigured;

        /// <summary>Reads a PDF's technical metadata (1️⃣ bloque de
        /// metadatos: autor y fechas de creación/modificación) directly via
        /// PdfPig's own <c>Information</c> dictionary — deterministic, not
        /// AI-derived. Best-effort: a PDF with no/garbled metadata simply
        /// yields nulls rather than failing the whole extraction.</summary>
        public static (string? Author, DateTime? CreatedAt, DateTime? ModifiedAt) ReadDocumentMetadata(Stream pdfContent)
        {
            try
            {
                using var document = PdfDocument.Open(pdfContent);
                var info = document.Information;
                return (
                    string.IsNullOrWhiteSpace(info.Author) ? null : info.Author,
                    TryParsePdfDate(info.CreationDate),
                    TryParsePdfDate(info.ModifiedDate));
            }
            catch
            {
                return (null, null, null);
            }
        }

        /// <summary>Parses a raw PDF date string (ISO/PDF format, e.g.
        /// "D:20210115120000+00'00'" or a plain ISO string) into a
        /// <see cref="DateTime"/>. Returns null for anything it can't parse
        /// confidently rather than throwing.</summary>
        private static DateTime? TryParsePdfDate(string? raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) return null;

            var value = raw.StartsWith("D:", StringComparison.OrdinalIgnoreCase) ? raw[2..] : raw;
            // Keep just the YYYYMMDDHHmmSS numeric prefix — timezone suffixes
            // (+00'00', Z, etc.) vary too much to parse reliably and aren't
            // needed for this metadata field.
            var digits = new string(value.TakeWhile(char.IsDigit).ToArray());

            foreach (var format in new[] { "yyyyMMddHHmmss", "yyyyMMddHHmm", "yyyyMMdd" })
            {
                if (digits.Length >= format.Length &&
                    DateTime.TryParseExact(digits[..format.Length], format, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed))
                {
                    return DateTime.SpecifyKind(parsed, DateTimeKind.Utc);
                }
            }

            return DateTime.TryParse(raw, CultureInfo.InvariantCulture, DateTimeStyles.None, out var fallback)
                ? DateTime.SpecifyKind(fallback, DateTimeKind.Utc)
                : null;
        }

        /// <summary>Starts extraction in the background and returns
        /// IMMEDIATELY (Stage.Running) — never awaits the AI call. The
        /// <see cref="DocumentExtraction"/> row referenced by
        /// <paramref name="documentExtractionId"/> must already be saved by
        /// the caller (ExtractionStatus="Subido", with its Proceso/Paso/
        /// Fuente/Empresa traceability already set) before calling this.
        /// <paramref name="pages"/> comes from
        /// <see cref="Storage.PdfTextExtractor.ExtractPagesWithImages"/> —
        /// embedded images are described by <see cref="PdfImageDescriptionAgent"/>
        /// and folded back into each page's own text before the combined
        /// text is handed to <see cref="DocumentExtractionAgent"/>.</summary>
        public DocumentExtractionRunStatus Start(
            Guid documentExtractionId,
            List<Storage.PdfTextExtractor.PageExtractionResult> pages)
        {
            var runId = Guid.NewGuid();
            _runs[runId] = DocumentExtractionRunStatus.Running(runId, "Leyendo documento completo");

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

                    _runs[runId] = DocumentExtractionRunStatus.Running(runId, "Analizando documento completo");

                    var result = await _extractionAgent.ExtractAsync(documentText);

                    await using var dbContext = await _dbContextFactory.CreateDbContextAsync();
                    var document = await dbContext.DocumentExtractions.FirstOrDefaultAsync(d => d.Id == documentExtractionId);
                    if (document is null)
                    {
                        _runs[runId] = DocumentExtractionRunStatus.Failed(runId, "El documento ya no existe.");
                        return;
                    }

                    document.DetectedLanguage = result.DetectedLanguage;
                    document.ExtractedDataJson = JsonSerializer.Serialize(result.ExtractedData);
                    // Enums serialized as strings (Persona/Compania/...) so
                    // DocumentExtractionMapper can read EntitiesJson back
                    // straight into ExtractedEntityDto.Type (string).
                    document.EntitiesJson = JsonSerializer.Serialize(result.Entities, EnumAsStringJson);
                    document.BusinessRulesJson = JsonSerializer.Serialize(result.BusinessRules);
                    document.RelationshipsJson = JsonSerializer.Serialize(result.Relationships);
                    document.ContentDescription = result.ContentDescription;
                    document.ExecutiveSummary = result.ExecutiveSummary;
                    document.ExtractionStatus = "Procesado";
                    document.ExtractedAt = DateTime.UtcNow;
                    document.ExtractionModel = _extractionAgent.DeploymentName;
                    document.Touch();
                    await dbContext.SaveChangesAsync();

                    _runs[runId] = DocumentExtractionRunStatus.Completed(runId, DocumentExtractionMapper.ToDto(document));
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Background document extraction failed for {DocumentExtractionId}", documentExtractionId);

                    try
                    {
                        await using var dbContext = await _dbContextFactory.CreateDbContextAsync();
                        var document = await dbContext.DocumentExtractions.FirstOrDefaultAsync(d => d.Id == documentExtractionId);
                        if (document is not null)
                        {
                            document.ExtractionStatus = "Error";
                            document.ExtractionError = ex.Message;
                            document.Touch();
                            await dbContext.SaveChangesAsync();
                        }
                    }
                    catch (Exception saveEx)
                    {
                        _logger.LogError(saveEx, "Failed to persist extraction error for {DocumentExtractionId}", documentExtractionId);
                    }

                    _runs[runId] = DocumentExtractionRunStatus.Failed(runId, ex.Message);
                }
            });

            return _runs[runId];
        }

        public DocumentExtractionRunStatus GetStatus(Guid runId)
        {
            if (_runs.TryGetValue(runId, out var status))
                return status;

            throw new InvalidOperationException($"No se encontró una extracción en curso con RunId '{runId}'.");
        }

        /// <summary>Describes every embedded image (above a minimum size)
        /// across all pages and folds each description back into its own
        /// page's text — same dedup/budget approach as
        /// ProcessDocumentExtractionOrchestrator.DescribeEmbeddedImagesAsync
        /// (kept as its own copy here since each orchestrator owns its own
        /// run-status progress reporting).</summary>
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
                        _runs[runId] = DocumentExtractionRunStatus.Running(
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
