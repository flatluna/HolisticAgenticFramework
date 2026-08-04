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
    /// Write endpoints for the "🖥 Catálogo de Sistemas" (<see cref="EnterpriseSystem"/>):
    /// get-or-create by name, field updates (API availability, hosting/cloud)
    /// and growing the módulos/transacciones sub-catalogs as an advisor
    /// captures them during Deep Dive de Procesos. Kept GLOBAL per
    /// engagement (not per-process/step) on purpose, so knowledge about a
    /// system accumulates once and feeds a future reference architecture
    /// instead of being duplicated across every process that touches it.
    /// Read-only listing stays in <see cref="ProcessCatalogFunctions"/>.
    /// </summary>
    public class EnterpriseSystemFunctions
    {
        private readonly ProcessDbContext _dbContext;
        private readonly ILogger<EnterpriseSystemFunctions> _logger;

        public EnterpriseSystemFunctions(ProcessDbContext dbContext, ILogger<EnterpriseSystemFunctions> logger)
        {
            _dbContext = dbContext;
            _logger = logger;
        }

        /// <summary>
        /// Gets an existing EnterpriseSystem by name (case-insensitive) for
        /// this engagement, or creates it if it doesn't exist yet.
        /// POST /api/engagements/{engagementId}/enterprise-systems
        /// </summary>
        [Function("CreateEnterpriseSystem")]
        public async Task<IActionResult> CreateEnterpriseSystem(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", "options",
                Route = "engagements/{engagementId}/enterprise-systems")] HttpRequest req,
            string engagementId)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                if (!Guid.TryParse(engagementId, out var engagementGuid))
                    return new BadRequestObjectResult(new { error = "Invalid engagement ID" });

                var body = await new StreamReader(req.Body).ReadToEndAsync();
                var request = JsonSerializer.Deserialize<CreateEnterpriseSystemRequest>(body, JsonOptionsHelper.CaseInsensitive);

                if (request == null || string.IsNullOrWhiteSpace(request.Name))
                    return new BadRequestObjectResult(new { error = "El nombre del sistema es obligatorio" });

                var name = request.Name.Trim();

                var existing = await _dbContext.EnterpriseSystems
                    .FirstOrDefaultAsync(s => s.EngagementId == engagementGuid && s.Name.ToLower() == name.ToLower());
                if (existing != null)
                    return new OkObjectResult(await EnterpriseSystemMapper.MapOneAsync(_dbContext, existing));

                var system = EnterpriseSystem.Create(engagementGuid, name);
                _dbContext.EnterpriseSystems.Add(system);
                await _dbContext.SaveChangesAsync();

                return new CreatedResult($"/api/enterprise-systems/{system.Id}", await EnterpriseSystemMapper.MapOneAsync(_dbContext, system));
            }
            catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("IX_") == true || ex.InnerException?.Message.Contains("duplicate", StringComparison.OrdinalIgnoreCase) == true)
            {
                _logger.LogWarning(ex, "Duplicate enterprise system name for engagement");
                return new ConflictObjectResult(new { error = "Ya existe un sistema con ese nombre en este engagement" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating enterprise system");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Patches an EnterpriseSystem's suite/API/hosting fields. Only the
        /// fields present in the body are updated (partial patch semantics),
        /// so distinct UI sections (API del sistema vs. Hosting del sistema)
        /// can save independently without clobbering each other.
        /// PUT /api/enterprise-systems/{id}
        /// </summary>
        [Function("UpdateEnterpriseSystem")]
        public async Task<IActionResult> UpdateEnterpriseSystem(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", "options",
                Route = "enterprise-systems/{id}")] HttpRequest req,
            string id)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                if (!Guid.TryParse(id, out var systemGuid))
                    return new BadRequestObjectResult(new { error = "Invalid system ID" });

                var system = await _dbContext.EnterpriseSystems.FirstOrDefaultAsync(s => s.Id == systemGuid);
                if (system == null)
                    return new NotFoundObjectResult(new { error = "Enterprise system not found" });

                var body = await new StreamReader(req.Body).ReadToEndAsync();
                var request = JsonSerializer.Deserialize<UpdateEnterpriseSystemRequest>(body, JsonOptionsHelper.CaseInsensitive);
                if (request == null)
                    return new BadRequestObjectResult(new { error = "Body inválido" });

                if (request.EsSuite.HasValue) system.EsSuite = request.EsSuite.Value;
                if (request.TieneAPI.HasValue) system.TieneAPI = request.TieneAPI.Value;
                if (request.TipoAPI != null) system.TipoAPI = request.TipoAPI;
                if (request.NotasAPI != null) system.NotasAPI = request.NotasAPI;
                if (request.Hosting != null) system.Hosting = EnterpriseSystemMapper.HostingFromFrontend(request.Hosting);
                if (request.ProveedorNube != null) system.ProveedorNube = request.ProveedorNube;
                if (request.NotasHosting != null) system.NotasHosting = request.NotasHosting;
                if (request.Category != null) system.Category = request.Category;
                if (request.Description != null) system.Description = request.Description;
                system.Touch();

                await _dbContext.SaveChangesAsync();

                return new OkObjectResult(await EnterpriseSystemMapper.MapOneAsync(_dbContext, system));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating enterprise system");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Adds a módulo to a suite system's sub-catalog if it doesn't
        /// already exist (case-insensitive dedupe).
        /// POST /api/enterprise-systems/{id}/modules
        /// </summary>
        [Function("AddEnterpriseSystemModule")]
        public async Task<IActionResult> AddEnterpriseSystemModule(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", "options",
                Route = "enterprise-systems/{id}/modules")] HttpRequest req,
            string id)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                if (!Guid.TryParse(id, out var systemGuid))
                    return new BadRequestObjectResult(new { error = "Invalid system ID" });

                var system = await _dbContext.EnterpriseSystems.FirstOrDefaultAsync(s => s.Id == systemGuid);
                if (system == null)
                    return new NotFoundObjectResult(new { error = "Enterprise system not found" });

                var body = await new StreamReader(req.Body).ReadToEndAsync();
                var request = JsonSerializer.Deserialize<AddSystemModuleRequest>(body, JsonOptionsHelper.CaseInsensitive);
                var name = request?.Name?.Trim();
                if (string.IsNullOrWhiteSpace(name))
                    return new BadRequestObjectResult(new { error = "El nombre del módulo es obligatorio" });

                var exists = await _dbContext.EnterpriseSystemModules
                    .AnyAsync(m => m.SystemId == systemGuid && m.Name.ToLower() == name.ToLower());
                if (!exists)
                {
                    _dbContext.EnterpriseSystemModules.Add(EnterpriseSystemModule.Create(system.EngagementId, systemGuid, name));
                    await _dbContext.SaveChangesAsync();
                }

                return new OkObjectResult(await EnterpriseSystemMapper.MapOneAsync(_dbContext, system));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding enterprise system module");
                return new StatusCodeResult(500);
            }
        }

        /// <summary>
        /// Adds a transacción to a suite system's sub-catalog if it doesn't
        /// already exist (dedupe by código, falling back to nombre when
        /// código is empty — same key rule as the frontend used to apply
        /// in-memory).
        /// POST /api/enterprise-systems/{id}/transactions
        /// </summary>
        [Function("AddEnterpriseSystemTransaction")]
        public async Task<IActionResult> AddEnterpriseSystemTransaction(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", "options",
                Route = "enterprise-systems/{id}/transactions")] HttpRequest req,
            string id)
        {
            var preflight = CorsHelper.HandlePreflight(req);
            if (preflight != null) return preflight;
            try
            {
                if (!Guid.TryParse(id, out var systemGuid))
                    return new BadRequestObjectResult(new { error = "Invalid system ID" });

                var system = await _dbContext.EnterpriseSystems.FirstOrDefaultAsync(s => s.Id == systemGuid);
                if (system == null)
                    return new NotFoundObjectResult(new { error = "Enterprise system not found" });

                var body = await new StreamReader(req.Body).ReadToEndAsync();
                var request = JsonSerializer.Deserialize<AddSystemTransactionRequest>(body, JsonOptionsHelper.CaseInsensitive);
                var codigo = request?.Codigo?.Trim() ?? string.Empty;
                var nombre = request?.Nombre?.Trim() ?? string.Empty;
                var key = (string.IsNullOrEmpty(codigo) ? nombre : codigo).ToLowerInvariant();
                if (string.IsNullOrEmpty(key))
                    return new BadRequestObjectResult(new { error = "Debes indicar código o nombre de la transacción" });

                var existingTransactions = await _dbContext.EnterpriseSystemTransactions
                    .Where(t => t.SystemId == systemGuid)
                    .ToListAsync();
                var alreadyExists = existingTransactions.Any(t =>
                    (string.IsNullOrEmpty(t.Codigo) ? (t.Nombre ?? string.Empty) : t.Codigo).Trim().ToLowerInvariant() == key);

                if (!alreadyExists)
                {
                    _dbContext.EnterpriseSystemTransactions.Add(
                        EnterpriseSystemTransaction.Create(system.EngagementId, systemGuid, codigo, nombre));
                    await _dbContext.SaveChangesAsync();
                }

                return new OkObjectResult(await EnterpriseSystemMapper.MapOneAsync(_dbContext, system));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding enterprise system transaction");
                return new StatusCodeResult(500);
            }
        }
    }
}
