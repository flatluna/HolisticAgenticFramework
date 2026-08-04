namespace AETP.Modules.ClientEngagement.Api.DTOs
{
    public class DataRepresentationDto
    {
        public string Id { get; set; } = string.Empty;
        public string System { get; set; } = string.Empty;
        public string FieldName { get; set; } = string.Empty;
        public string ScreenOrTable { get; set; } = string.Empty;
    }

    public class DictionaryBusinessRuleDto
    {
        public string Id { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Owner { get; set; } = string.Empty;
        public string Source { get; set; } = string.Empty;
        public string Origin { get; set; } = string.Empty;
        public bool IsDocumented { get; set; }
        public string Flexibility { get; set; } = string.Empty;
    }

    public class DataDictionaryEntryDto
    {
        public Guid Id { get; set; }
        public Guid EngagementId { get; set; }
        public string OfficialName { get; set; } = string.Empty;
        public string Context { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string TechnicalName { get; set; } = string.Empty;
        public string DataType { get; set; } = string.Empty;
        public string Format { get; set; } = string.Empty;
        public bool IsPII { get; set; }
        public string Owner { get; set; } = string.Empty;
        public string QualityOwner { get; set; } = string.Empty;
        public List<string> Synonyms { get; set; } = new();
        public List<DataRepresentationDto> Representations { get; set; } = new();
        public List<DictionaryBusinessRuleDto> GlobalRules { get; set; } = new();
    }

    /// <summary>
    /// Body de PUT /api/engagements/{engagementId}/data-dictionary/{id} —
    /// UPSERT real: si el id todavía no existe para este engagement se crea,
    /// si ya existe se reemplazan todos sus campos. El frontend siempre
    /// manda el objeto completo (mismo patrón que
    /// DataDictionaryEntryDialog.tsx onSave), así que no hay PATCH parcial.
    /// </summary>
    public class UpsertDataDictionaryEntryRequest
    {
        public string OfficialName { get; set; } = string.Empty;
        public string? Context { get; set; }
        public string? Description { get; set; }
        public string? TechnicalName { get; set; }
        public string? DataType { get; set; }
        public string? Format { get; set; }
        public bool IsPII { get; set; }
        public string? Owner { get; set; }
        public string? QualityOwner { get; set; }
        public List<string>? Synonyms { get; set; }
        public List<DataRepresentationDto>? Representations { get; set; }
        public List<DictionaryBusinessRuleDto>? GlobalRules { get; set; }
    }
}
