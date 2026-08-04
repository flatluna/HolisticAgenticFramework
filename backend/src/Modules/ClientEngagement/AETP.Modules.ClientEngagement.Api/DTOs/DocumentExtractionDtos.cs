using System.Text.Json;
using AETP.Modules.Process.Domain;

namespace AETP.Modules.ClientEngagement.Api.DTOs
{
    /// <summary>2️⃣ Un dato clave del negocio extraído del documento (ej.
    /// score, deuda total, días de mora, RUC/ID, monto solicitado), tipado
    /// pero sin normalizar a columnas relacionales (el universo de campos
    /// varía demasiado según el tipo de documento) — ver
    /// AETP.Modules.ClientEngagement.Api.Agents.DocumentExtractionAgent.</summary>
    public class ExtractedDataPointDto
    {
        public string Key { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;

        /// <summary>"string", "number", "date", "currency" or "boolean" —
        /// best-effort type tag, not enforced.</summary>
        public string DataType { get; set; } = "string";
    }

    /// <summary>3️⃣ Una entidad reconocida (NER) en el documento — persona,
    /// compañía, fecha, monto, ubicación o identificador — con el texto
    /// exacto detectado.</summary>
    public class ExtractedEntityDto
    {
        public string Type { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
    }

    /// <summary>Una regla de negocio explícita del documento (política,
    /// umbral, criterio de autorización) — ver
    /// AETP.Modules.ClientEngagement.Api.Agents.DocumentExtractionAgent.BusinessRule.</summary>
    public class BusinessRuleDto
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    /// <summary>Una arista del "grafo" del documento — cómo se conecta un
    /// nodo (entidad o regla de negocio) con otro — ver
    /// AETP.Modules.ClientEngagement.Api.Agents.DocumentExtractionAgent.ExtractedRelationship.</summary>
    public class ExtractedRelationshipDto
    {
        public string FromNode { get; set; } = string.Empty;
        public string RelationType { get; set; } = string.Empty;
        public string ToNode { get; set; } = string.Empty;
    }

    /// <summary>Resultado completo de leer UN documento no estructurado
    /// (los 6 bloques pedidos) junto con la trazabilidad Proceso → Paso →
    /// Fuente → Empresa y la referencia al archivo original en el Data
    /// Lake — ver <see cref="DocumentExtraction"/>.</summary>
    public class DocumentExtractionDto
    {
        public Guid Id { get; set; }

        // -------- Trazabilidad --------
        public Guid EngagementId { get; set; }
        public Guid ProcessId { get; set; }
        public Guid ActivityId { get; set; }
        public Guid SourceId { get; set; }

        // -------- Archivo original --------
        public string FileName { get; set; } = string.Empty;
        public string? ContentType { get; set; }
        public long FileSizeBytes { get; set; }
        public string? BlobPath { get; set; }

        // -------- 1️⃣ Metadatos --------
        public string? DocumentFormat { get; set; }
        public DateTime? DocumentCreatedAt { get; set; }
        public DateTime? DocumentModifiedAt { get; set; }
        public string? Author { get; set; }
        public string? DetectedLanguage { get; set; }

        // -------- 2️⃣ Datos extraídos --------
        public List<ExtractedDataPointDto> ExtractedData { get; set; } = [];

        // -------- 3️⃣ Entidades (NER) --------
        public List<ExtractedEntityDto> Entities { get; set; } = [];

        /// <summary>Reglas de negocio explícitas del documento (políticas,
        /// umbrales, matriz de autorización, excepciones).</summary>
        public List<BusinessRuleDto> BusinessRules { get; set; } = [];

        /// <summary>El grafo del documento: relaciones entre las Entities y
        /// las BusinessRules (ej. quién autoriza qué regla).</summary>
        public List<ExtractedRelationshipDto> Relationships { get; set; } = [];

        // -------- 4️⃣ Descripción del contenido --------
        public string? ContentDescription { get; set; }

        // -------- 5️⃣ Total de páginas --------
        public int PageCount { get; set; }

        // -------- 6️⃣ Sumario ejecutivo --------
        public string? ExecutiveSummary { get; set; }

        public string ExtractionStatus { get; set; } = "Subido";
        public string? ExtractionError { get; set; }
        public DateTime? ExtractedAt { get; set; }
        public string? ExtractionModel { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>Maps the persisted <see cref="DocumentExtraction"/> entity
    /// to its API DTO — shared by
    /// AETP.Modules.ClientEngagement.Api.Agents.DocumentExtractionOrchestrator
    /// (background completion) and
    /// AETP.Modules.ClientEngagement.Api.Functions.DocumentExtractionFunctions
    /// (list/get endpoints), so both always serialize the JSON blocks the
    /// same way.</summary>
    public static class DocumentExtractionMapper
    {
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

        public static DocumentExtractionDto ToDto(DocumentExtraction entity)
        {
            return new DocumentExtractionDto
            {
                Id = entity.Id,
                EngagementId = entity.EngagementId,
                ProcessId = entity.ProcessId,
                ActivityId = entity.ActivityId,
                SourceId = entity.SourceId,
                FileName = entity.FileName,
                ContentType = entity.ContentType,
                FileSizeBytes = entity.FileSizeBytes,
                BlobPath = entity.BlobPath,
                DocumentFormat = entity.DocumentFormat,
                DocumentCreatedAt = entity.DocumentCreatedAt,
                DocumentModifiedAt = entity.DocumentModifiedAt,
                Author = entity.Author,
                DetectedLanguage = entity.DetectedLanguage,
                ExtractedData = string.IsNullOrWhiteSpace(entity.ExtractedDataJson)
                    ? []
                    : JsonSerializer.Deserialize<List<ExtractedDataPointDto>>(entity.ExtractedDataJson, JsonOptions) ?? [],
                Entities = string.IsNullOrWhiteSpace(entity.EntitiesJson)
                    ? []
                    : JsonSerializer.Deserialize<List<ExtractedEntityDto>>(entity.EntitiesJson, JsonOptions) ?? [],
                BusinessRules = string.IsNullOrWhiteSpace(entity.BusinessRulesJson)
                    ? []
                    : JsonSerializer.Deserialize<List<BusinessRuleDto>>(entity.BusinessRulesJson, JsonOptions) ?? [],
                Relationships = string.IsNullOrWhiteSpace(entity.RelationshipsJson)
                    ? []
                    : JsonSerializer.Deserialize<List<ExtractedRelationshipDto>>(entity.RelationshipsJson, JsonOptions) ?? [],
                ContentDescription = entity.ContentDescription,
                PageCount = entity.PageCount,
                ExecutiveSummary = entity.ExecutiveSummary,
                ExtractionStatus = entity.ExtractionStatus,
                ExtractionError = entity.ExtractionError,
                ExtractedAt = entity.ExtractedAt,
                ExtractionModel = entity.ExtractionModel,
                CreatedAt = entity.CreatedAt,
            };
        }
    }
}
