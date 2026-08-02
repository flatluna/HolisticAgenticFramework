namespace AETP.Modules.ClientEngagement.Api.DTOs
{
    /// <summary>
    /// DTO for one domain's evaluation, returned to and sent from the
    /// frontend's Paso 2 · Descubrimiento y Priorización de Dominios.
    /// </summary>
    public class DomainAssessmentDto
    {
        public Guid Id { get; set; }
        public Guid EngagementId { get; set; }
        public string DomainId { get; set; } = string.Empty;
        public string? BusinessContext { get; set; }
        public string ProcessInventoryJson { get; set; } = "[]";
        public string SystemsInventoryJson { get; set; } = "[]";
        public int? StrategicValue { get; set; }
        public int? TransformPotential { get; set; }
        public int? Roi { get; set; }
        public int? Complexity { get; set; }
        public int? Urgency { get; set; }
        public int? ComplexityAdjustmentOverride { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class DomainAssessmentRequest
    {
        public string DomainId { get; set; } = string.Empty;
        public string? BusinessContext { get; set; }
        public string ProcessInventoryJson { get; set; } = "[]";
        public string SystemsInventoryJson { get; set; } = "[]";
        public int? StrategicValue { get; set; }
        public int? TransformPotential { get; set; }
        public int? Roi { get; set; }
        public int? Complexity { get; set; }
        public int? Urgency { get; set; }
        public int? ComplexityAdjustmentOverride { get; set; }
    }

    /// <summary>
    /// Response for GET /domain-discovery: the selected industry plus all
    /// domain evaluations captured so far for the engagement.
    /// </summary>
    public class DomainDiscoveryResponseDto
    {
        public string? SelectedIndustryId { get; set; }
        public List<DomainAssessmentDto> Domains { get; set; } = new();
    }

    /// <summary>
    /// Request body for PUT /domain-discovery/industry (just the industry
    /// combo box selection, saved separately from the per-domain bulk save).
    /// </summary>
    public class SaveIndustryRequest
    {
        public string? SelectedIndustryId { get; set; }
    }

    /// <summary>
    /// Request body for replacing ALL domain evaluations of an engagement in
    /// one call (autosave) — same "replace" pattern as
    /// BulkSaveOrganizationalReadinessRequest.
    /// </summary>
    public class BulkSaveDomainAssessmentsRequest
    {
        public List<DomainAssessmentRequest> Domains { get; set; } = new();
    }
}
