namespace AETP.Modules.ClientEngagement.Api.DTOs
{
    public class RoleDto
    {
        public Guid Id { get; set; }
        public Guid EngagementId { get; set; }
        public string Name { get; set; } = string.Empty;
        public Guid? RoleCategoryId { get; set; }
        public string? Description { get; set; }
        public string Status { get; set; } = "Activo";
    }

    public class EnterpriseSystemDto
    {
        public Guid Id { get; set; }
        public Guid EngagementId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Category { get; set; }
        public string? Description { get; set; }
        public string Status { get; set; } = "Activo";
        public bool EsSuite { get; set; }
        public bool TieneAPI { get; set; }
        public string? TipoAPI { get; set; }
        public string? NotasAPI { get; set; }
        public string? Hosting { get; set; }
        public string? ProveedorNube { get; set; }
        public string? NotasHosting { get; set; }
        public List<string> Modulos { get; set; } = new();
        public List<SystemTransactionDto> Transacciones { get; set; } = new();
    }

    public class SystemTransactionDto
    {
        public string? Codigo { get; set; }
        public string? Nombre { get; set; }
    }

    public class CreateEnterpriseSystemRequest
    {
        public string Name { get; set; } = string.Empty;
    }

    public class UpdateEnterpriseSystemRequest
    {
        public bool? EsSuite { get; set; }
        public bool? TieneAPI { get; set; }
        public string? TipoAPI { get; set; }
        public string? NotasAPI { get; set; }
        public string? Hosting { get; set; }
        public string? ProveedorNube { get; set; }
        public string? NotasHosting { get; set; }
        public string? Category { get; set; }
        public string? Description { get; set; }
    }

    public class AddSystemModuleRequest
    {
        public string Name { get; set; } = string.Empty;
    }

    public class AddSystemTransactionRequest
    {
        public string? Codigo { get; set; }
        public string? Nombre { get; set; }
    }
}
