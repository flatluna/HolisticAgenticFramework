namespace AETP.Modules.ClientEngagement.Api.DTOs
{
    public class MandateStakeholderItemDto
    {
        public string Stakeholder { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }

    public class EngagementMandateDto
    {
        public Guid EngagementId { get; set; }
        public string? Title { get; set; }
        public string? Objective { get; set; }
        public string? IncludedScope { get; set; }
        public string? ExcludedScope { get; set; }
        public string? ExecutiveSponsor { get; set; }
        public string? SponsorResponsibilities { get; set; }
        public string? ExpectedOutcomes { get; set; }
        public string? SuccessCriteria { get; set; }
        public int? HorizonMinMonths { get; set; }
        public int? HorizonMaxMonths { get; set; }
        public decimal? RevenueGrowthTargetPct { get; set; }
        public decimal? CostReductionTargetPct { get; set; }
        public decimal? ProductivityImprovementTargetPct { get; set; }
        public decimal? SlaImprovementTargetPct { get; set; }
        public List<MandateStakeholderItemDto> Stakeholders { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class SaveEngagementMandateRequest
    {
        public string? Title { get; set; }
        public string? Objective { get; set; }
        public string? IncludedScope { get; set; }
        public string? ExcludedScope { get; set; }
        public string? ExecutiveSponsor { get; set; }
        public string? SponsorResponsibilities { get; set; }
        public string? ExpectedOutcomes { get; set; }
        public string? SuccessCriteria { get; set; }
        public int? HorizonMinMonths { get; set; }
        public int? HorizonMaxMonths { get; set; }
        public decimal? RevenueGrowthTargetPct { get; set; }
        public decimal? CostReductionTargetPct { get; set; }
        public decimal? ProductivityImprovementTargetPct { get; set; }
        public decimal? SlaImprovementTargetPct { get; set; }
        public List<MandateStakeholderItemDto> Stakeholders { get; set; } = new();
    }
}
