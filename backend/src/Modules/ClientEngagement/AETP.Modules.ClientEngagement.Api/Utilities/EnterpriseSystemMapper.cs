using Microsoft.EntityFrameworkCore;
using AETP.Modules.Process.Domain;
using AETP.Modules.Process.Infrastructure;
using AETP.Modules.ClientEngagement.Api.DTOs;

namespace AETP.Modules.ClientEngagement.Api.Utilities
{
    /// <summary>
    /// Builds <see cref="EnterpriseSystemDto"/> instances (with their nested
    /// Módulos/Transacciones sub-catalogs) from <see cref="EnterpriseSystem"/>
    /// entities, and converts the frontend's kebab-case hosting strings
    /// ("on-premises"/"nube"/"hibrido"/"no-se") to/from <see cref="SystemHostingType"/>.
    /// Shared by <see cref="Functions.ProcessCatalogFunctions"/> (read-only list)
    /// and <see cref="Functions.EnterpriseSystemFunctions"/> (writes) so both
    /// always return the exact same DTO shape.
    /// </summary>
    public static class EnterpriseSystemMapper
    {
        public static async Task<List<EnterpriseSystemDto>> MapManyAsync(ProcessDbContext db, List<EnterpriseSystem> systems)
        {
            var systemIds = systems.Select(s => s.Id).ToList();

            var modules = await db.EnterpriseSystemModules
                .Where(m => systemIds.Contains(m.SystemId))
                .ToListAsync();

            var transactions = await db.EnterpriseSystemTransactions
                .Where(t => systemIds.Contains(t.SystemId))
                .ToListAsync();

            return systems
                .Select(s => BuildDto(
                    s,
                    modules.Where(m => m.SystemId == s.Id).ToList(),
                    transactions.Where(t => t.SystemId == s.Id).ToList()))
                .ToList();
        }

        public static async Task<EnterpriseSystemDto> MapOneAsync(ProcessDbContext db, EnterpriseSystem system)
        {
            var modules = await db.EnterpriseSystemModules
                .Where(m => m.SystemId == system.Id)
                .ToListAsync();

            var transactions = await db.EnterpriseSystemTransactions
                .Where(t => t.SystemId == system.Id)
                .ToListAsync();

            return BuildDto(system, modules, transactions);
        }

        private static EnterpriseSystemDto BuildDto(
            EnterpriseSystem s, List<EnterpriseSystemModule> modules, List<EnterpriseSystemTransaction> transactions) => new()
        {
            Id = s.Id,
            EngagementId = s.EngagementId,
            Name = s.Name,
            Category = s.Category,
            Description = s.Description,
            Status = s.Status,
            EsSuite = s.EsSuite,
            TieneAPI = s.TieneAPI,
            TipoAPI = s.TipoAPI,
            NotasAPI = s.NotasAPI,
            Hosting = HostingToFrontend(s.Hosting),
            ProveedorNube = s.ProveedorNube,
            NotasHosting = s.NotasHosting,
            Modulos = modules.OrderBy(m => m.Name).Select(m => m.Name).ToList(),
            Transacciones = transactions
                .OrderBy(t => t.Nombre)
                .Select(t => new SystemTransactionDto { Codigo = t.Codigo, Nombre = t.Nombre })
                .ToList(),
        };

        public static string? HostingToFrontend(SystemHostingType? hosting) => hosting switch
        {
            SystemHostingType.OnPremises => "on-premises",
            SystemHostingType.Nube => "nube",
            SystemHostingType.Hibrido => "hibrido",
            SystemHostingType.NoSe => "no-se",
            _ => null,
        };

        public static SystemHostingType? HostingFromFrontend(string? hosting) => hosting switch
        {
            "on-premises" => SystemHostingType.OnPremises,
            "nube" => SystemHostingType.Nube,
            "hibrido" => SystemHostingType.Hibrido,
            "no-se" => SystemHostingType.NoSe,
            _ => null,
        };
    }
}
