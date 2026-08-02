using System.Text;
using UglyToad.PdfPig;

namespace AETP.Modules.ClientEngagement.Api.Storage
{
    /// <summary>
    /// Extracts raw text from a PDF process document so it can be handed to
    /// <see cref="Agents.ProcessDocumentExtractionAgent"/> in a single pass.
    /// Uses UglyToad.PdfPig — a real, pure-.NET PDF parser (no native
    /// dependencies) — same approach used in the HumanOS reference project.
    /// </summary>
    public static class PdfTextExtractor
    {
        /// <summary>Result of extracting a PDF's full text together with its
        /// page count, so callers can enforce size policies without a second
        /// pass over the document.</summary>
        public sealed class ExtractionResult
        {
            public string Text { get; set; } = string.Empty;

            public int PageCount { get; set; }
        }

        public static ExtractionResult ExtractTextWithPageCount(Stream pdfContent)
        {
            using var document = PdfDocument.Open(pdfContent);
            var builder = new StringBuilder();
            var pageCount = 0;

            foreach (var page in document.GetPages())
            {
                builder.AppendLine(page.Text);
                pageCount++;
            }

            return new ExtractionResult { Text = builder.ToString(), PageCount = pageCount };
        }

        /// <summary>An image embedded in a PDF page, extracted in whatever byte
        /// form it can actually be read in (see <see cref="ExtractPagesWithImages"/>).</summary>
        public sealed class ExtractedPageImage
        {
            public byte[] Bytes { get; set; } = [];

            /// <summary>MIME type of <see cref="Bytes"/> — "image/png" or
            /// "image/jpeg", suitable for sending directly to a vision-capable
            /// chat model.</summary>
            public string ContentType { get; set; } = "image/png";
        }

        /// <summary>One page's extracted text plus any embedded images worth
        /// describing (see <see cref="ExtractPagesWithImages"/>).</summary>
        public sealed class PageExtractionResult
        {
            /// <summary>1-based page number, matching PdfPig's own numbering.</summary>
            public int PageNumber { get; set; }

            public string Text { get; set; } = string.Empty;

            public List<ExtractedPageImage> Images { get; set; } = [];
        }

        /// <summary>Below this pixel size (in either dimension) an embedded
        /// image is almost certainly a decorative icon/bullet/rule rather than
        /// real content — not worth a vision-model call.</summary>
        private const int MinImageDimensionPixels = 100;

        /// <summary>An image whose ON-PAGE placement covers at least this
        /// fraction of the page's width AND height, on a page that also has
        /// OTHER images, is treated as a full-bleed decorative background/
        /// template layer rather than real content — see
        /// <see cref="ExtractPagesWithImages"/>.</summary>
        private const double FullBleedCoverageThreshold = 0.9;

        /// <summary>
        /// Extracts BOTH the real text AND every embedded image (above a
        /// minimum size, to skip decorative icons/bullets/rules) for each page —
        /// ported from the HumanOS reference project (C:\EducationAI\HumanOS\
        /// backend\HumanOS\Storage\PdfTextExtractor.cs), same approach. This is
        /// what lets a scanned/image-only process document page — where
        /// PdfPig's own <c>page.Text</c> is empty because the "page" is really
        /// one big embedded photo of a diagram/form/screenshot — still
        /// contribute real content: callers send each
        /// <see cref="PageExtractionResult.Images"/> entry to a vision-capable
        /// model (see Agents.PdfImageDescriptionAgent) to get a text
        /// description, then fold that back into the page's material alongside
        /// its (possibly empty) real text.
        ///
        /// <see cref="UglyToad.PdfPig.Content.IPdfImage.TryGetPng"/> is tried
        /// first (handles most raster encodings); when it fails, the image's
        /// raw encoded bytes are used directly as a JPEG IF they actually start
        /// with a JPEG SOI marker (0xFFD8) — anything else is skipped rather
        /// than sent to a vision model as garbage bytes.
        /// </summary>
        public static List<PageExtractionResult> ExtractPagesWithImages(Stream pdfContent)
        {
            using var document = PdfDocument.Open(pdfContent);
            var pages = new List<PageExtractionResult>();

            foreach (var page in document.GetPages())
            {
                var pageResult = new PageExtractionResult
                {
                    PageNumber = page.Number,
                    Text = page.Text
                };

                var candidateImages = page.GetImages()
                    .Where(image => image.WidthInSamples >= MinImageDimensionPixels && image.HeightInSamples >= MinImageDimensionPixels)
                    .ToList();

                foreach (var image in candidateImages)
                {
                    var isFullBleed = page.Width > 0 && page.Height > 0
                        && image.Bounds.Width >= page.Width * FullBleedCoverageThreshold
                        && image.Bounds.Height >= page.Height * FullBleedCoverageThreshold;

                    if (isFullBleed && candidateImages.Count > 1)
                    {
                        // Likely a decorative background/template layer sitting
                        // behind other, more meaningful images on this page —
                        // not worth a vision-model call.
                        continue;
                    }

                    if (image.TryGetPng(out var pngBytes) && pngBytes is { Length: > 0 })
                    {
                        pageResult.Images.Add(new ExtractedPageImage { Bytes = pngBytes, ContentType = "image/png" });
                        continue;
                    }

                    byte[] raw;
                    try
                    {
                        raw = image.RawBytes.ToArray();
                    }
                    catch
                    {
                        continue;
                    }

                    if (IsJpeg(raw))
                    {
                        pageResult.Images.Add(new ExtractedPageImage { Bytes = raw, ContentType = "image/jpeg" });
                    }
                }

                pages.Add(pageResult);
            }

            return pages;
        }

        private static bool IsJpeg(byte[] bytes) => bytes.Length > 2 && bytes[0] == 0xFF && bytes[1] == 0xD8;
    }
}
