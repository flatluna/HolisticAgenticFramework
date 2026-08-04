using System.Text.Json;
using AETP.Modules.Process.Domain;
using AETP.Modules.ClientEngagement.Api.DTOs;

namespace AETP.Modules.ClientEngagement.Api.Utilities
{
    /// <summary>
    /// Converts between <see cref="DataDictionaryEntry"/> (JSON-blob columns
    /// for Synonyms/Representations/GlobalRules — same convention as
    /// <see cref="DocumentExtraction"/>) and the flat list-based
    /// <see cref="DataDictionaryEntryDto"/> the frontend's CanonicalDataEntry
    /// expects. No async DB calls needed here (unlike EnterpriseSystemMapper)
    /// since there are no child tables to join.
    /// </summary>
    public static class DataDictionaryEntryMapper
    {
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

        public static DataDictionaryEntryDto MapToDto(DataDictionaryEntry entity)
        {
            return new DataDictionaryEntryDto
            {
                Id = entity.Id,
                EngagementId = entity.EngagementId,
                OfficialName = entity.OfficialName,
                Context = entity.Context ?? string.Empty,
                Description = entity.Description ?? string.Empty,
                TechnicalName = entity.TechnicalName ?? string.Empty,
                DataType = entity.DataType ?? string.Empty,
                Format = entity.Format ?? string.Empty,
                IsPII = entity.IsPII,
                Owner = entity.Owner ?? string.Empty,
                QualityOwner = entity.QualityOwner ?? string.Empty,
                Synonyms = DeserializeOrDefault<List<string>>(entity.SynonymsJson) ?? new(),
                Representations = DeserializeOrDefault<List<DataRepresentationDto>>(entity.RepresentationsJson) ?? new(),
                GlobalRules = DeserializeOrDefault<List<DictionaryBusinessRuleDto>>(entity.GlobalRulesJson) ?? new(),
            };
        }

        public static void ApplyRequest(DataDictionaryEntry entity, UpsertDataDictionaryEntryRequest request)
        {
            entity.OfficialName = request.OfficialName;
            entity.Context = request.Context;
            entity.Description = request.Description;
            entity.TechnicalName = request.TechnicalName;
            entity.DataType = request.DataType;
            entity.Format = request.Format;
            entity.IsPII = request.IsPII;
            entity.Owner = request.Owner;
            entity.QualityOwner = request.QualityOwner;
            entity.SynonymsJson = JsonSerializer.Serialize(request.Synonyms ?? new List<string>(), JsonOptions);
            entity.RepresentationsJson = JsonSerializer.Serialize(request.Representations ?? new List<DataRepresentationDto>(), JsonOptions);
            entity.GlobalRulesJson = JsonSerializer.Serialize(request.GlobalRules ?? new List<DictionaryBusinessRuleDto>(), JsonOptions);
        }

        private static T? DeserializeOrDefault<T>(string? json) where T : class
        {
            if (string.IsNullOrWhiteSpace(json)) return null;
            try
            {
                return JsonSerializer.Deserialize<T>(json, JsonOptions);
            }
            catch
            {
                return null;
            }
        }
    }
}
