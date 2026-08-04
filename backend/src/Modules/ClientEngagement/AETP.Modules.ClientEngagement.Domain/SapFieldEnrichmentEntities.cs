using AETP.BuildingBlocks.Domain;

namespace AETP.Modules.ClientEngagement.Domain
{
    /// <summary>
    /// 🎯 Agente de Enriquecimiento de Campos SAP — resultado CACHEADO de una
    /// consulta de enriquecimiento (fundamentada en Bing Grounding) para un
    /// campo técnico de SAP (ej. "KLIMK", "CTLPC", "SKFOR"), usado en
    /// http://localhost:3000/deep-dive/p1/paso/nuevo cuando el sistema
    /// capturado es SAP (ver SapFieldEnrichmentAgent para el patrón de
    /// Azure AI Foundry + Bing Grounding reutilizado, calcado de
    /// DataDictionarySuggestionAgent).
    ///
    /// CLAVE DE CACHÉ (decisión de diseño, 2026-08-03, confirmada por el
    /// usuario):
    /// - Campo ESTÁNDAR SAP (no empieza con "Z") → conocimiento GLOBAL,
    ///   significa lo mismo en cualquier cliente/engagement (ej. KLIMK
    ///   siempre es "clase de límite de crédito") → EngagementId se guarda
    ///   como Guid.Empty, se cachea UNA sola vez para TODOS los engagements.
    /// - Campo CUSTOM (empieza con "Z", convención SAP para desarrollos a la
    ///   medida) → propio de CADA cliente, NO es global → EngagementId es el
    ///   del engagement activo. Si Bing no encuentra nada (esperable para un
    ///   campo Z interno del cliente), igual se cachea con
    ///   EncontradoEnGrounding=false para no re-consultar en cada carga.
    /// Índice único real: (EngagementId, FieldName) en
    /// ClientEngagementDbContext.
    /// </summary>
    public class SapFieldEnrichment : Entity
    {
        public string FieldName { get; set; } = string.Empty; // ej. "KLIMK", "ZCREDLIMIT"

        public bool IsCustomField { get; set; }

        public string Descripcion { get; set; } = string.Empty;

        public string Formato { get; set; } = string.Empty;

        public string ReglaNegocio { get; set; } = string.Empty;

        public string FuenteGrounding { get; set; } = string.Empty;

        public bool EncontradoEnGrounding { get; set; }

        // Preparado para diferenciar ECC vs S/4HANA en el futuro (pedido
        // explícito del usuario, 2026-08-03) — SOLO el campo, SIN lógica
        // todavía: no se lee, no participa en la clave de caché, no se le
        // pide nada al agente. Cuando se implemente, probablemente pase a
        // formar parte de la clave de caché (un mismo campo puede diferir
        // entre ECC y S/4HANA).
        public string? SapVersion { get; set; }

        public SapFieldEnrichment() : base() { }

        public static SapFieldEnrichment Create(
            Guid engagementId,
            string fieldName,
            bool isCustomField,
            string descripcion,
            string formato,
            string reglaNegocio,
            string fuenteGrounding,
            bool encontradoEnGrounding)
        {
            return new SapFieldEnrichment
            {
                Id = Guid.NewGuid(),
                // Solo los campos custom (Z*) se guardan scoped al engagement;
                // los estándar se cachean globalmente bajo Guid.Empty.
                EngagementId = isCustomField ? engagementId : Guid.Empty,
                FieldName = fieldName,
                IsCustomField = isCustomField,
                Descripcion = descripcion,
                Formato = formato,
                ReglaNegocio = reglaNegocio,
                FuenteGrounding = fuenteGrounding,
                EncontradoEnGrounding = encontradoEnGrounding,
                CreatedAt = DateTime.UtcNow,
            };
        }

        // Usado por forceRefresh: sobreescribe una entrada ya cacheada con
        // una nueva consulta a Bing en vez de crear un duplicado.
        public void Refresh(
            string descripcion,
            string formato,
            string reglaNegocio,
            string fuenteGrounding,
            bool encontradoEnGrounding)
        {
            Descripcion = descripcion;
            Formato = formato;
            ReglaNegocio = reglaNegocio;
            FuenteGrounding = fuenteGrounding;
            EncontradoEnGrounding = encontradoEnGrounding;
            Touch();
        }
    }
}
