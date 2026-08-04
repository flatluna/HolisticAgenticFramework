using Azure.AI.OpenAI;
using Azure.Identity;
using AETP.Modules.Process.Domain;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Configuration;

namespace AETP.Modules.ClientEngagement.Api.Agents
{
    /// <summary>2️⃣ Un dato clave del negocio, tal como lo propone el
    /// agente — ver <see cref="DocumentExtractionAgentResult.ExtractedData"/>.</summary>
    public sealed class ExtractedDataPoint
    {
        public string Key { get; set; } = string.Empty;

        public string Value { get; set; } = string.Empty;

        /// <summary>"string", "number", "date", "currency", "boolean" or
        /// "identifier" (account/reference/folio/SSN numbers, including
        /// partially-masked ones, e.g. "XXXXXXXX1234").</summary>
        public string DataType { get; set; } = "string";
    }

    /// <summary>3️⃣ Una entidad reconocida (NER), tal como la propone el
    /// agente — ver <see cref="DocumentExtractionAgentResult.Entities"/>.</summary>
    public sealed class ExtractedEntity
    {
        public ExtractedEntityType Type { get; set; }

        public string Text { get; set; } = string.Empty;
    }

    /// <summary>Una regla de negocio EXPLÍCITA propuesta por el agente (una
    /// política, umbral, criterio de autorización o restricción que el
    /// documento establece literalmente) — ver
    /// <see cref="DocumentExtractionAgentResult.BusinessRules"/>. Ej.: Name
    /// = "Cotizaciones mínimas", Description = "Toda compra mayor a $50,000
    /// MXN requiere mínimo 3 cotizaciones de proveedores distintos".</summary>
    public sealed class DocumentBusinessRule
    {
        /// <summary>Nombre corto e identificable de la regla (sirve también
        /// como el texto del nodo en <see cref="ExtractedRelationship"/>).</summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>Descripción completa de la regla, tal como aplica en el
        /// documento (incluye montos/umbrales/condiciones exactos si el
        /// documento los da).</summary>
        public string Description { get; set; } = string.Empty;
    }

    /// <summary>Una arista del "grafo" del documento propuesta por el agente:
    /// cómo se conecta un nodo (persona, compañía, artículo, regla de
    /// negocio, monto...) con otro — ver
    /// <see cref="DocumentExtractionAgentResult.Relationships"/>. Ej.:
    /// FromNode = "Director de Compras", RelationType = "autoriza", ToNode =
    /// "Cotizaciones mínimas".</summary>
    public sealed class ExtractedRelationship
    {
        /// <summary>Texto EXACTO de un <see cref="ExtractedEntity.Text"/> o
        /// <see cref="DocumentBusinessRule.Name"/> ya propuesto — el nodo origen.</summary>
        public string FromNode { get; set; } = string.Empty;

        /// <summary>Verbo/etiqueta de la relación, en minúsculas, ej.
        /// "autoriza", "aplica_a", "requiere", "reporta_a", "aprueba",
        /// "genera", "pertenece_a".</summary>
        public string RelationType { get; set; } = string.Empty;

        /// <summary>Texto EXACTO de un <see cref="ExtractedEntity.Text"/> o
        /// <see cref="DocumentBusinessRule.Name"/> ya propuesto — el nodo destino.</summary>
        public string ToNode { get; set; } = string.Empty;
    }

    /// <summary>
    /// The 4 AI-derived blocks of a <see cref="DocumentExtraction"/> (idioma
    /// detectado, datos clave, entidades NER, descripción + sumario
    /// ejecutivo) — los otros 2 bloques del pedido (metadatos técnicos del
    /// archivo y total de páginas) se obtienen determinísticamente del PDF
    /// (ver <see cref="Storage.PdfTextExtractor"/> y el bloque de metadatos
    /// leído directamente vía PdfPig en <see cref="DocumentExtractionOrchestrator"/>),
    /// no vía IA.
    /// </summary>
    public sealed class DocumentExtractionAgentResult
    {
        public string DetectedLanguage { get; set; } = string.Empty;

        public List<ExtractedDataPoint> ExtractedData { get; set; } = [];

        public List<ExtractedEntity> Entities { get; set; } = [];

        /// <summary>Reglas de negocio explícitas del documento (políticas,
        /// umbrales, matrices de autorización, restricciones) — ver
        /// <see cref="DocumentBusinessRule"/>.</summary>
        public List<DocumentBusinessRule> BusinessRules { get; set; } = [];

        /// <summary>El "grafo" del documento: cómo se conectan entre sí las
        /// entidades y reglas de negocio propuestas — ver
        /// <see cref="ExtractedRelationship"/>.</summary>
        public List<ExtractedRelationship> Relationships { get; set; } = [];

        public string ContentDescription { get; set; } = string.Empty;

        public string ExecutiveSummary { get; set; } = string.Empty;
    }

    /// <summary>
    /// The core "un-structuring → structuring" agent of the Process
    /// framework: reads the full extracted text of an UNSTRUCTURED source
    /// document (📄 — a credit report, a financial statement, an email
    /// attachment, a legal/regulatory text...) that arrived as a 📥 Fuente
    /// (<see cref="ActivityInteraction"/>) inside a 🪜 Paso
    /// (<see cref="ProcessActivity"/>) of a 📂 Proceso
    /// (<see cref="BusinessProcess"/>), and proposes, in a single pass, the
    /// language, the key business data (typed key-value pairs), every named
    /// entity found, a natural-language description of the document, and an
    /// executive summary — see <see cref="DocumentExtractionAgentResult"/>.
    ///
    /// Deliberately reuses the SAME extraction pipeline already built for
    /// <see cref="ProcessDocumentExtractionAgent"/> (Storage.PdfTextExtractor
    /// for PDF text/images, PdfImageDescriptionAgent for embedded images) —
    /// this agent only adds a DIFFERENT structured-output shape suited to a
    /// single source document rather than a whole process write-up: typed
    /// data points + a broader entity taxonomy (people/companies/dates/
    /// amounts/locations/identifiers) instead of decisions.
    ///
    /// Uses the "economy" deployment when configured (bounded, structured
    /// extraction from already-provided text, not open-ended reasoning) —
    /// same rationale as every other extraction agent in this codebase.
    /// Always a proposal for a human to review — never auto-saved as an
    /// authoritative record beyond the DocumentExtraction row itself, which
    /// is explicitly a provisional/proposed extraction.
    /// </summary>
    public sealed class DocumentExtractionAgent
    {
        private const string ExtractionInstructions = """
            Eres un analista experto en procesos de negocio, gobierno
            corporativo y análisis documental. Lees el texto completo de UN
            documento NO ESTRUCTURADO — puede ser un reporte de crédito, un
            estado financiero, un correo, una política/manual/procedimiento
            interno, un contrato, una ley/norma o un formulario — que llegó
            como fuente de información dentro de un paso de un proceso de
            negocio. Tu trabajo NO es transcribir el texto: es MODELARLO
            como datos estructurados que un humano y otros sistemas puedan
            usar directamente, en un solo pase, con la mayor precisión y
            profundidad posibles. Nunca inventes información sin base en el
            texto — omite un campo o déjalo vacío antes que adivinar. Esta
            es una propuesta provisional para que un humano la revise,
            edite y confirme, no un registro autoritativo. Escribe siempre
            en el mismo idioma del documento.

            Produce EXACTAMENTE estos 7 bloques:

            1. DetectedLanguage: el nombre del idioma del documento (ej.
               "Español", "English").

            2. ExtractedData: cada valor de negocio explícito en el
               documento, como pares clave-valor tipados (Key, Value,
               DataType — uno de "string", "number", "date", "currency",
               "boolean", "identifier"). Ejemplos: para un reporte de
               crédito → score, deuda total, días de mora, número de cuenta
               (aunque esté enmascarado, ej. "1000000...."), número de
               seguro social (enmascarado o no), folios/referencias de
               consultas (inquiries); para una política/procedimiento →
               montos umbral de la matriz de autorización, plazos en horas/
               días, porcentajes, número mínimo de cotizaciones requeridas.
               Solo lo que esté explícito en el texto. SÉ EXHAUSTIVO: no te
               limites a 2-3 datos representativos — extrae CADA dato
               explícito distinto que encuentres, incluyendo los que
               parezcan menores (cada número de cuenta, cada fecha, cada
               folio, cada monto, cada porcentaje). REGLA DE CONSISTENCIA
               OBLIGATORIA con el bloque 5 (Relationships): todo valor
               concreto que uses como nodo (FromNode o ToNode) en
               Relationships — un número de cuenta, SSN, folio, monto,
               fecha o cualquier identificador — DEBE tener también su
               propia entrada aquí en ExtractedData con una Key descriptiva
               (ej. Key="AccountNumber" o "AccountNumber1" si hay varias,
               Value="1000000....", DataType="identifier"). Nunca dejes un
               valor de dato solo como nodo del grafo sin su entrada
               correspondiente en ExtractedData.

            3. Entities: cada entidad nombrada del documento, con un Type
               (uno de: Persona, Compania, Fecha, Monto, Ubicacion,
               Identificador, Articulo, ReglaNegocio) y el Text EXACTO tal
               como aparece:
               - Persona: nombres de personas o CARGOS/roles cuando el
                 documento no da un nombre propio (ej. "Director de
                 Compras", "Tesorería", "Gerente de Almacén") — en
                 documentos de política/procedimiento, los cargos SON los
                 "actores" del proceso y deben capturarse como Persona.
               - Compania: empresas, proveedores, áreas/departamentos
                 (ej. "Manufactura Industrial Nova, S.A. de C.V.",
                 "Departamento de Compras").
               - Fecha, Monto, Ubicacion, Identificador: como su nombre
                 indica (identificador incluye RUC/cédula/folio/número de
                 OC o factura).
               - Articulo: cada bien, refacción, insumo, servicio o activo
                 mencionado como objeto de compra/entrega/uso (ej.
                 "refacciones", "activos fijos", "insumos de oficina").
               - ReglaNegocio: NO uses este tipo para el texto libre de la
                 regla — solo úsalo si necesitas referenciar la regla como
                 nodo del grafo por su nombre corto; el detalle completo de
                 cada regla va en el bloque 4 (BusinessRules), nunca
                 duplicado aquí a menos que ayude a conectar el grafo.

            4. BusinessRules: TODA regla de negocio explícita — política,
               umbral, obligación, prohibición o criterio de autorización —
               como {Name, Description}. Un documento de proceso/política
               casi siempre trae varias: obligatoriedad de un documento
               previo (ej. "requisición y orden de compra obligatorias"),
               segregación de funciones, montos/umbrales de una matriz de
               autorización (una regla POR nivel/cargo si el documento los
               da), mínimo de cotizaciones requeridas, tolerancias de
               variación permitidas, prohibición de fraccionar para evadir
               autorización, requisitos de conciliación/matching antes de
               pago, excepciones y sus condiciones (compra urgente, único
               proveedor, factura sin orden previa), y cualquier otra regla
               explícita. Name = identificador corto y claro; Description =
               el texto completo de la regla, con los montos/plazos/
               condiciones EXACTOS que el documento menciona.

            5. Relationships: el GRAFO del documento — cómo se conectan
               entre sí las Entities y BusinessRules ya propuestas. Cada
               relación es {FromNode, RelationType, ToNode}, donde FromNode
               y ToNode deben ser EXACTAMENTE el mismo texto que un
               Entity.Text o un BusinessRule.Name ya listado arriba (nunca
               inventes un nodo nuevo aquí). RelationType es un verbo corto
               en minúsculas: "autoriza" (una Persona/cargo autoriza una
               BusinessRule o una operación), "aplica_a" (una BusinessRule
               aplica a un Articulo/Monto/Compania), "requiere" (un paso o
               regla requiere otro elemento), "reporta_a" (jerarquía entre
               Personas/cargos), "genera" (un rol genera un documento/
               identificador), "pertenece_a" (una Compania/área pertenece a
               otra), u otro verbo que describa fielmente la relación
               literal del texto. Piensa en esto como un grafo de nodos y
               aristas: cada cargo/rol es un nodo, cada regla es un nodo,
               cada monto/artículo relevante es un nodo, y las relaciones
               son las aristas que el documento describe explícitamente
               (quién autoriza qué, qué regla aplica a qué, quién reporta a
               quién). Prioriza capturar las relaciones de autorización y
               aprobación — son las más valiosas para trazabilidad y
               gobierno.

            6. ContentDescription: una o dos oraciones describiendo, en
               lenguaje natural, QUÉ ES este documento y de qué trata (ej.
               "Política de compras de Manufactura Industrial Nova que
               define el proceso de requisición, aprobación, recepción y
               pago, con su matriz de autorización por montos").

            7. ExecutiveSummary: un sumario ejecutivo legible (2-4 párrafos)
               que permita a un humano entender el contenido y los hallazgos
               clave del documento sin abrirlo — objetivo/alcance, actores y
               responsabilidades principales, las reglas de negocio más
               importantes (montos/umbrales, obligatoriedad de documentos,
               segregación de funciones), excepciones relevantes, y
               cualquier recomendación o riesgo que el documento señale.
            """;

        private readonly AIAgent? _agent;

        public DocumentExtractionAgent(IConfiguration configuration)
        {
            var endpoint = configuration["AzureOpenAIEndpoint"];
            // Economy tier: bounded, structured-output extraction from
            // already-provided text, not open-ended reasoning — falls back
            // to the main deployment if 'AzureOpenAIEconomyDeploymentName'
            // isn't set, same pattern as ProcessDocumentExtractionAgent.
            var deploymentName = configuration["AzureOpenAIEconomyDeploymentName"] ?? configuration["AzureOpenAIDeploymentName"];
            var apiKey = configuration["AzureOpenAIApiKey"];

            DeploymentName = deploymentName;

            if (string.IsNullOrWhiteSpace(endpoint) || string.IsNullOrWhiteSpace(deploymentName))
            {
                _agent = null;
                return;
            }

            AzureOpenAIClient client = string.IsNullOrWhiteSpace(apiKey)
                ? new AzureOpenAIClient(new Uri(endpoint), new DefaultAzureCredential())
                : new AzureOpenAIClient(new Uri(endpoint), new System.ClientModel.ApiKeyCredential(apiKey));

            _agent = client
                .GetChatClient(deploymentName)
                .AsIChatClient()
                .AsAIAgent(
                    instructions: ExtractionInstructions,
                    name: "DocumentExtractionAgent");
        }

        public bool IsConfigured => _agent is not null;

        /// <summary>The deployment/model used for extraction, recorded on
        /// <see cref="DocumentExtraction.ExtractionModel"/> for audit
        /// purposes.</summary>
        public string? DeploymentName { get; }

        public async Task<DocumentExtractionAgentResult> ExtractAsync(
            string documentText,
            CancellationToken cancellationToken = default)
        {
            if (_agent is null)
            {
                throw new InvalidOperationException(
                    "The Document extraction agent is not configured. Set the 'AzureOpenAIEndpoint' " +
                    "and 'AzureOpenAIDeploymentName' application settings once credentials are provided.");
            }

            var prompt = $"""
                Texto completo del documento:
                {documentText}

                Extrae el idioma detectado, los datos clave del negocio, las
                entidades (personas/cargos, compañías, fechas, montos,
                ubicaciones, identificadores y artículos), TODAS las reglas
                de negocio explícitas (políticas, umbrales, matriz de
                autorización, excepciones), el grafo de relaciones entre
                esas entidades y reglas (quién autoriza qué, qué regla
                aplica a qué, jerarquías), la descripción del contenido y el
                sumario ejecutivo de este documento.
                """;

            ChatMessage message = new(ChatRole.User, prompt);

            var response = await _agent.RunAsync<DocumentExtractionAgentResult>(message, cancellationToken: cancellationToken);

            return response.Result;
        }
    }
}
