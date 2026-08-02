namespace AETP.Modules.ClientEngagement.Api.DTOs
{
    public class AutomationTargetsDto
    {
        public decimal? AtencionCliente { get; set; }
        public decimal? Finanzas { get; set; }
        public decimal? RecursosHumanos { get; set; }
        public decimal? Marketing { get; set; }
        public decimal? Ventas { get; set; }
        public decimal? Operaciones { get; set; }
        public decimal? AnaliticaReportes { get; set; }
    }

    public class EngagementMissionVisionDto
    {
        public Guid EngagementId { get; set; }
        public string? StrategyTitle { get; set; }
        public string? CompanyName { get; set; }
        public string? Sector { get; set; }
        public string? DirectionGeneral { get; set; }
        public string? Mission { get; set; }
        public string? Vision { get; set; }
        public string? VisionObjetivo { get; set; }
        public AutomationTargetsDto AutomationTargets { get; set; } = new();
        public List<string> ValorActual { get; set; } = new();
        public List<string> ClientesObjetivo { get; set; } = new();
        public List<string> Crecimiento { get; set; } = new();
        public List<string> Eficiencia { get; set; } = new();
        public List<string> Calidad { get; set; } = new();
        public List<string> Innovacion { get; set; } = new();
        public List<string> Principles { get; set; } = new();
        public string? DeclaracionFinal { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class SaveEngagementMissionVisionRequest
    {
        public string? StrategyTitle { get; set; }
        public string? CompanyName { get; set; }
        public string? Sector { get; set; }
        public string? DirectionGeneral { get; set; }
        public string? Mission { get; set; }
        public string? Vision { get; set; }
        public string? VisionObjetivo { get; set; }
        public AutomationTargetsDto AutomationTargets { get; set; } = new();
        public List<string> ValorActual { get; set; } = new();
        public List<string> ClientesObjetivo { get; set; } = new();
        public List<string> Crecimiento { get; set; } = new();
        public List<string> Eficiencia { get; set; } = new();
        public List<string> Calidad { get; set; } = new();
        public List<string> Innovacion { get; set; } = new();
        public List<string> Principles { get; set; } = new();
        public string? DeclaracionFinal { get; set; }
    }
}
