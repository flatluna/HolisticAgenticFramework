using Azure.AI.OpenAI;
using Azure.Identity;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Configuration;

namespace AETP.Modules.ClientEngagement.Api.Agents
{
    /// <summary>UN campo candidato detectado visualmente en la captura de
    /// pantalla, tal como lo propone el agente de visión — SIN el valor
    /// capturado (nunca se pide/expone, por decisión explícita del pedido:
    /// esto describe la ESTRUCTURA del campo, no datos reales de un
    /// cliente). Ver <see cref="SystemScreenshotExtractionResult.Campos"/>.</summary>
    public sealed class SystemFieldVisualCandidate
    {
        /// <summary>La etiqueta/nombre EXACTO tal como aparece en pantalla
        /// (ej. "Solicitante", "Importe neto", "Clase de límite").</summary>
        public string CampoVisible { get; set; } = string.Empty;

        /// <summary>El nombre TÉCNICO del campo SI es visible en la propia
        /// captura (ej. un tooltip, un código de transacción, un ID de
        /// control) — vacío si no hay forma de saberlo solo con la imagen.</summary>
        public string CampoTecnico { get; set; } = string.Empty;

        /// <summary>Descripción breve de qué es este campo y para qué
        /// sirve, inferida del contexto visual (título de pantalla, sección,
        /// campos vecinos) — mejor esfuerzo, sin inventar certeza que la
        /// imagen no sostiene.</summary>
        public string Descripcion { get; set; } = string.Empty;

        /// <summary>Formato/tipo de dato esperado inferido visualmente (ej.
        /// "numérico", "fecha DD/MM/AAAA", "texto libre", "lista
        /// desplegable", "moneda").</summary>
        public string Formato { get; set; } = string.Empty;

        /// <summary>true si `CampoVisible` en sí ya parece un código técnico
        /// (ej. todo mayúsculas/abreviado tipo "KUNNR", "BUKRS") — ayuda al
        /// paso de enriquecimiento con Bing a decidir qué campos vale la
        /// pena investigar más a fondo.</summary>
        public bool PareceCodigoTecnico { get; set; }

        /// <summary>Cómo se usa este campo EN ESTA pantalla — uno de "lee",
        /// "captura", "modifica", "valida" (mismo catálogo que
        /// `DataSystemLocation.accion` en el frontend). Inferido de si el
        /// campo se ve editable (input/select vacío o con placeholder),
        /// de solo lectura/calculado, o es un control de validación
        /// (checkbox/semáforo de estatus).</summary>
        public string Accion { get; set; } = string.Empty;
    }

    /// <summary>Resultado crudo (solo visión, sin Bing todavía) de leer una
    /// captura de pantalla de un sistema — ver
    /// <see cref="SystemScreenshotExtractionAgent"/>.</summary>
    public sealed class SystemScreenshotExtractionResult
    {
        /// <summary>Nombre del sistema que el agente reconoce en la propia
        /// captura (ej. "SAP", "Salesforce") si es identificable
        /// visualmente — puede quedar vacío.</summary>
        public string SistemaDetectado { get; set; } = string.Empty;

        public List<SystemFieldVisualCandidate> Campos { get; set; } = [];
    }

    /// <summary>
    /// Lee una captura de pantalla (screenshot) de una pantalla de un
    /// sistema empresarial (SAP u otro) y propone, campo por campo, TODOS
    /// los campos/etiquetas visibles con una descripción y formato
    /// inferidos — el primer paso (visión) del flujo de "📸 Extraer campos
    /// desde captura de pantalla" en
    /// http://localhost:3000/deep-dive/p1/paso/nuevo (Etapa ③, tipo
    /// Sistema/Aplicación). El segundo paso (enriquecimiento fundamentado en
    /// Bing) vive en <see cref="SystemFieldGroundingAgent"/> — ver
    /// <see cref="SystemScreenshotExtractionOrchestrator"/> para cómo se
    /// combinan.
    ///
    /// Mismo patrón de construcción que <see cref="OrgChartExtractionAgent"/>
    /// (Azure OpenAI Chat directo + <c>.AsIChatClient().AsAIAgent(...)</c>,
    /// multimodal vía <see cref="DataContent"/>) — NUNCA se le pide ni se
    /// expone el VALOR realmente capturado en un campo, solo su nombre/
    /// estructura, para no filtrar datos reales de un cliente vía este
    /// agente. Siempre una propuesta para que el asesor revise antes de
    /// aceptar cada campo.
    /// </summary>
    public sealed class SystemScreenshotExtractionAgent
    {
        private const string ExtractionInstructions = """
            Eres un analista experto en sistemas empresariales (SAP, Oracle,
            Salesforce, Dynamics, y en general cualquier ERP/CRM/sistema
            interno). Vas a leer la captura de pantalla de UNA pantalla de un
            sistema y a identificar TODOS los campos/etiquetas visibles, para
            documentar la ESTRUCTURA de esa pantalla — NUNCA el valor real
            capturado en cada campo. Ignora por completo cualquier dato
            personal/sensible que puedas ver (nombres, montos, cuentas,
            etc.) — no lo transcribas ni lo menciones, solo interesa el
            NOMBRE del campo y su propósito.

            Para cada campo/etiqueta visible en la imagen, produce:
            - CampoVisible: el texto EXACTO de la etiqueta tal como aparece
              en pantalla (ej. "Solicitante", "Importe neto", "Fecha de
              vencimiento").
            - CampoTecnico: el nombre técnico del campo SOLO si es visible en
              la propia imagen (un tooltip, un código junto al campo, un
              nombre de columna técnico) — si no se puede saber con certeza
              solo mirando la imagen, déjalo vacío. NO ADIVINES un código
              técnico que no esté realmente visible.
            - Descripcion: 1-2 oraciones explicando qué es este campo y para
              qué sirve, basándote en el título de la pantalla, la sección
              donde aparece y los campos vecinos.
            - Formato: el tipo/formato de dato que parece esperar (ej.
              "numérico", "fecha DD/MM/AAAA", "texto libre", "lista
              desplegable", "moneda", "casilla de verificación").
            - PareceCodigoTecnico: true si el propio CampoVisible ya se ve
              como un código técnico abreviado (ej. todo en mayúsculas tipo
              "KUNNR", "BUKRS") en vez de una etiqueta legible en español/
              inglés normal.
            - Accion: cómo se usa este campo EN ESTA pantalla — exactamente
              uno de "lee", "captura", "modifica", "valida":
              * "captura": el campo se ve vacío/editable, listo para que el
                usuario escriba un valor nuevo (input de texto vacío,
                combo sin selección, checkbox sin marcar destinado a
                llenarse).
              * "modifica": el campo ya tiene un valor visible Y se ve
                editable (el usuario puede cambiarlo).
              * "lee": el campo muestra información de solo lectura,
                calculada o traída de otro lado (texto plano sin borde de
                input, un total/subtotal, un campo deshabilitado/gris).
              * "valida": el campo es un control de verificación/estatus
                (checkbox de confirmación, semáforo, ícono de validado).
              Si no puedes determinarlo con confianza, usa "captura" por
              defecto.

            SÉ EXHAUSTIVO: identifica CADA campo visible en la pantalla, no
            solo los 2-3 más obvios — incluye también checkboxes, selects,
            pestañas de sección si tienen su propio campo, y botones de
            acción NO cuentan (solo campos de DATOS). Si logras reconocer de
            qué sistema es la pantalla (por el logo, la paleta de colores,
            el estilo de la interfaz), indícalo en SistemaDetectado; si no,
            déjalo vacío. Esta es siempre una propuesta para que un humano
            la revise y acepte/rechace campo por campo antes de guardarla.
            """;

        private readonly AIAgent? _agent;

        public SystemScreenshotExtractionAgent(IConfiguration configuration)
        {
            var endpoint = configuration["AzureOpenAIEndpoint"];
            var deploymentName = configuration["AzureOpenAIDeploymentName"];
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
                    name: "SystemScreenshotExtractionAgent");
        }

        public bool IsConfigured => _agent is not null;

        public string? DeploymentName { get; }

        public async Task<SystemScreenshotExtractionResult> ExtractAsync(
            byte[] imageBytes,
            string contentType,
            CancellationToken cancellationToken = default)
        {
            if (_agent is null)
            {
                throw new InvalidOperationException(
                    "El agente de extracción de captura de pantalla no está configurado. Configura " +
                    "'AzureOpenAIEndpoint' y 'AzureOpenAIDeploymentName' (un despliegue con visión, ej. 'gpt-4o').");
            }

            ChatMessage message = new(ChatRole.User,
            [
                new TextContent("Identifica todos los campos visibles en esta captura de pantalla, siguiendo tus instrucciones."),
                new DataContent(imageBytes, contentType),
            ]);

            var response = await _agent.RunAsync<SystemScreenshotExtractionResult>(message, cancellationToken: cancellationToken);

            return response.Result;
        }
    }
}
