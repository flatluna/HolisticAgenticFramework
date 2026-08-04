using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AETP.Modules.Process.Domain;
using AETP.Modules.Process.Infrastructure;
using AETP.Modules.ClientEngagement.Api.DTOs;
using AETP.Modules.ClientEngagement.Api.Utilities;
using System.Text.Json;

namespace AETP.Modules.ClientEngagement.Api.Functions
{
    /// <summary>
    /// CRUD real (SQL, no memoria/localStorage) para el "📚 Diccionario de
    /// Datos del Negocio" (<see cref="DataDictionaryEntry"/>). El frontend
    /// (dataDictionaryStore.ts) siempre manda el objeto CanonicalDataEntry
    /// COMPLETO al guardar (mismo patrón que DataDictionaryEntryDialog.tsx),
    /// así que el endpoint de escritura es un UPSERT por id (PUT) en vez de
    /// separar Create/Update — el id lo genera el frontend (GUID) apenas
    /// crea el borrador en memoria, para poder referenciarlo de inmediato
    /// desde StepDataItem.dictionaryId antes de que exista en SQL.
    /// </summary>
    public class DataDictionaryFunctions
    {
        private readonly ProcessDbContext _dbContext;
        private readonly ILogger<DataDictionaryFunctions> _logger;

        public DataDictionaryFunctions(ProcessDbContext dbContext, ILogger<DataDictionaryFunctions> logger)
        {
            _dbContext = dbContext;
            _logger = logger;
        }

        /// <summary>
        /// Lists all Data Dictionary entries for an engagement.
        /// GET /api/engagements/{engagementId}/data-dictionary
        /// </summary>
        [Function("ListDataDictionaryEntries")]
        public async Task<IActionResult> ListDataDictionaryEntries(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get",
                Route = "engagements/{engagementId}/data-dictionary")] HttpRequest req,
            string engagementId)
        {
            CorsHelper.SetCorsHeaders(req.HttpContext.Response);
            try
            {
                if (!Guid.TryParse(engagementId, out var engagementGuid))
                    return new BadRequestObjectResult(new { error = "Invalid engagement ID" });

                var entries = await _dbContext.DataDictionaryEntries
                    .Where(e => e.EngagementId == engagementGuid)
                    .OrderBy(e => e.OfficialName)
                    .ToListAsync();

                return new OkObjectResult(entries.Select(DataDictionaryEntryMapper.MapToDto));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error listing data dictionary entries");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Creates or fully replaces a Data Dictionary entry by id (real
        /// upsert): if the id doesn't exist yet for this engagement it's
        /// created with it, otherwise all fields/arrays are overwritten.
        /// PUT /api/engagements/{engagementId}/data-dictionary/{id}
        /// </summary>
        [Function("UpsertDataDictionaryEntry")]
        public async Task<IActionResult> UpsertDataDictionaryEntry(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", "options",
                Route = "engagements/{engagementId}/data-dictionary/{id}")] HttpRequest req,
            string engagementId,
            string id)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                if (!Guid.TryParse(engagementId, out var engagementGuid))
                    return new BadRequestObjectResult(new { error = "Invalid engagement ID" });
                if (!Guid.TryParse(id, out var entryGuid))
                    return new BadRequestObjectResult(new { error = "Invalid entry ID" });

                var body = await new StreamReader(req.Body).ReadToEndAsync();
                var request = JsonSerializer.Deserialize<UpsertDataDictionaryEntryRequest>(body, JsonOptionsHelper.CaseInsensitive);
                if (request == null || string.IsNullOrWhiteSpace(request.OfficialName))
                    return new BadRequestObjectResult(new { error = "El nombre oficial del dato es obligatorio" });

                var entry = await _dbContext.DataDictionaryEntries
                    .FirstOrDefaultAsync(e => e.Id == entryGuid && e.EngagementId == engagementGuid);

                var isNew = entry == null;
                if (entry == null)
                {
                    entry = DataDictionaryEntry.Create(engagementGuid, entryGuid, request.OfficialName);
                    _dbContext.DataDictionaryEntries.Add(entry);
                }

                DataDictionaryEntryMapper.ApplyRequest(entry, request);
                if (!isNew) entry.Touch();

                await _dbContext.SaveChangesAsync();

                var dto = DataDictionaryEntryMapper.MapToDto(entry);
                return isNew
                    ? new CreatedResult($"/api/data-dictionary/{entry.Id}", dto)
                    : new OkObjectResult(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error upserting data dictionary entry");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Deletes a Data Dictionary entry.
        /// DELETE /api/data-dictionary/{id}
        /// </summary>
        [Function("DeleteDataDictionaryEntry")]
        public async Task<IActionResult> DeleteDataDictionaryEntry(
            [HttpTrigger(AuthorizationLevel.Anonymous, "delete", "options",
                Route = "data-dictionary/{id}")] HttpRequest req,
            string id)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                if (!Guid.TryParse(id, out var entryGuid))
                    return new BadRequestObjectResult(new { error = "Invalid entry ID" });

                var entry = await _dbContext.DataDictionaryEntries.FirstOrDefaultAsync(e => e.Id == entryGuid);
                if (entry == null)
                    return new NotFoundObjectResult(new { error = "Data dictionary entry not found" });

                _dbContext.DataDictionaryEntries.Remove(entry);
                await _dbContext.SaveChangesAsync();

                return new OkObjectResult(new { deleted = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting data dictionary entry");
                return new StatusCodeResult(500);
            }
        }
    }
}
