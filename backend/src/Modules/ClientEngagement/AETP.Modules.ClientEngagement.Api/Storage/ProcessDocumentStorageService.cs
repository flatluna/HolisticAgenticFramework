using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Configuration;

namespace AETP.Modules.ClientEngagement.Api.Storage
{
    /// <summary>
    /// Stores process source documents (PDF) in Azure Data Lake / Blob
    /// Storage, one container per engagement, so a future re-processing or
    /// re-download need never re-ask the user for the file. Configured via
    /// the "DataLakeStorage" connection string application setting — same
    /// resource/pattern used by the HumanOS reference project's
    /// RoleDocumentStorageService.
    /// </summary>
    public sealed class ProcessDocumentStorageService
    {
        private readonly BlobServiceClient? _blobServiceClient;

        public ProcessDocumentStorageService(IConfiguration configuration)
        {
            var connectionString = configuration["DataLakeStorage"];

            _blobServiceClient = string.IsNullOrWhiteSpace(connectionString)
                ? null
                : new BlobServiceClient(connectionString);
        }

        public bool IsConfigured => _blobServiceClient is not null;

        /// <summary>
        /// Uploads a process document PDF using a per-engagement container
        /// (container name = engagementId, lowercase — Azure Blob Storage
        /// container name requirement) and returns its blob path. Throws
        /// <see cref="InvalidOperationException"/> if storage is not
        /// configured; callers should check <see cref="IsConfigured"/> first.
        /// </summary>
        public async Task<string> UploadAsync(
            Guid engagementId,
            Guid processId,
            string fileName,
            Stream content,
            string contentType,
            CancellationToken cancellationToken = default)
        {
            if (_blobServiceClient is null)
            {
                throw new InvalidOperationException(
                    "Data Lake storage is not configured. Set the 'DataLakeStorage' " +
                    "connection string application setting once credentials are provided.");
            }

            var containerClient = _blobServiceClient.GetBlobContainerClient(engagementId.ToString("D").ToLowerInvariant());
            await containerClient.CreateIfNotExistsAsync(cancellationToken: cancellationToken);

            var blobPath = $"processes/{processId}/{Guid.NewGuid()}-{fileName}";
            var blobClient = containerClient.GetBlobClient(blobPath);

            await blobClient.UploadAsync(
                content,
                new BlobUploadOptions
                {
                    HttpHeaders = new BlobHttpHeaders { ContentType = contentType },
                },
                cancellationToken);

            return blobPath;
        }

        /// <summary>
        /// Deletes a single blob (a process document's raw PDF file) given
        /// its container (engagementId) and blob path. Best-effort: does
        /// nothing if storage isn't configured, and swallows "not found"
        /// (blob may never have been uploaded, e.g. storage was down at
        /// upload time) — callers should not treat that as a failure.
        /// </summary>
        public async Task DeleteAsync(
            Guid engagementId,
            string blobPath,
            CancellationToken cancellationToken = default)
        {
            if (_blobServiceClient is null) return;

            var containerClient = _blobServiceClient.GetBlobContainerClient(engagementId.ToString("D").ToLowerInvariant());
            var blobClient = containerClient.GetBlobClient(blobPath);
            await blobClient.DeleteIfExistsAsync(cancellationToken: cancellationToken);
        }

        /// <summary>
        /// Uploads the original org chart image (used by
        /// <see cref="OrgChartFunctions.ExtractOrgChart"/> before AI
        /// extraction) using the same per-engagement container convention,
        /// so the source image stays available for audit/re-processing
        /// even though only the extracted people/roles are kept as
        /// authoritative data (in Stakeholders). Throws
        /// <see cref="InvalidOperationException"/> if storage is not
        /// configured; callers should check <see cref="IsConfigured"/> first.
        /// </summary>
        public async Task<string> UploadOrgChartImageAsync(
            Guid engagementId,
            string fileName,
            Stream content,
            string contentType,
            CancellationToken cancellationToken = default)
        {
            if (_blobServiceClient is null)
            {
                throw new InvalidOperationException(
                    "Data Lake storage is not configured. Set the 'DataLakeStorage' " +
                    "connection string application setting once credentials are provided.");
            }

            var containerClient = _blobServiceClient.GetBlobContainerClient(engagementId.ToString("D").ToLowerInvariant());
            await containerClient.CreateIfNotExistsAsync(cancellationToken: cancellationToken);

            var blobPath = $"org-chart/{Guid.NewGuid()}-{fileName}";
            var blobClient = containerClient.GetBlobClient(blobPath);

            await blobClient.UploadAsync(
                content,
                new BlobUploadOptions
                {
                    HttpHeaders = new BlobHttpHeaders { ContentType = contentType },
                },
                cancellationToken);

            return blobPath;
        }

        /// <summary>
        /// Downloads the most recently uploaded org chart image for an
        /// engagement (blobs under the "org-chart/" prefix in its
        /// container), so the user can view/download the original file
        /// they extracted roles from. Returns null if storage isn't
        /// configured or no org chart image has been uploaded yet.
        /// </summary>
        public async Task<(byte[] Content, string ContentType, string FileName)?> GetLatestOrgChartImageAsync(
            Guid engagementId,
            CancellationToken cancellationToken = default)
        {
            if (_blobServiceClient is null) return null;

            var containerClient = _blobServiceClient.GetBlobContainerClient(engagementId.ToString("D").ToLowerInvariant());
            if (!await containerClient.ExistsAsync(cancellationToken)) return null;

            BlobItem? latest = null;
            await foreach (var blobItem in containerClient.GetBlobsAsync(prefix: "org-chart/", cancellationToken: cancellationToken))
            {
                if (latest is null || blobItem.Properties.LastModified > latest.Properties.LastModified)
                    latest = blobItem;
            }

            if (latest is null) return null;

            var blobClient = containerClient.GetBlobClient(latest.Name);
            var download = await blobClient.DownloadContentAsync(cancellationToken);

            var fileName = latest.Name.Contains('-')
                ? latest.Name[(latest.Name.LastIndexOf('-') + 1)..]
                : latest.Name;

            return (download.Value.Content.ToArray(), download.Value.Details.ContentType, fileName);
        }
    }
}
