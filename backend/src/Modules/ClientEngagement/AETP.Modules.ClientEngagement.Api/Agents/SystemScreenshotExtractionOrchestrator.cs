using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;

namespace AETP.Modules.ClientEngagement.Api.Agents
{
    public enum SystemScreenshotExtractionStage
    {
        Running,
        Completed,
        Failed
    }

    /// <summary>UN campo final propuesto al asesor — combina la lectura
    /// visual (<see cref="SystemFieldVisualCandidate"/>) con el
    /// enriquecimiento fundamentado en Bing (<see cref="SystemFieldGroundingResult"/>),
    /// cuando este último está disponible. Nunca incluye el valor realmente
    /// capturado en el campo (por diseño, ver
    /// <see cref="SystemScreenshotExtractionAgent"/>).</summary>
    public sealed class SystemFieldCandidateResult
    {
        public string NombreCampo { get; set; } = string.Empty;

        public string CampoTecnico { get; set; } = string.Empty;

        public string Descripcion { get; set; } = string.Empty;

        public string Formato { get; set; } = string.Empty;

        public string ReglaNegocio { get; set; } = string.Empty;

        public string FuenteGrounding { get; set; } = string.Empty;

        public bool EncontradoEnGrounding { get; set; }

        /// <summary>Cómo se usa este campo en la pantalla — "lee",
        /// "captura", "modifica" o "valida" (ver
        /// <see cref="SystemFieldVisualCandidate.Accion"/>) — se usa para
        /// pre-llenar "Origen del dato" y "Uso en pantalla" del
        /// StepDataItem sin que el asesor tenga que adivinarlo.</summary>
        public string Accion { get; set; } = string.Empty;
    }

    public sealed class SystemScreenshotExtractionRunStatus
    {
        public Guid RunId { get; set; }

        public SystemScreenshotExtractionStage Stage { get; set; }

        public string? Step { get; set; }

        public string? SistemaDetectado { get; set; }

        public List<SystemFieldCandidateResult>? Result { get; set; }

        public string? ErrorMessage { get; set; }

        public static SystemScreenshotExtractionRunStatus Running(Guid runId, string step) =>
            new() { RunId = runId, Stage = SystemScreenshotExtractionStage.Running, Step = step };

        public static SystemScreenshotExtractionRunStatus Completed(Guid runId, string? sistemaDetectado, List<SystemFieldCandidateResult> result) =>
            new() { RunId = runId, Stage = SystemScreenshotExtractionStage.Completed, SistemaDetectado = sistemaDetectado, Result = result };

        public static SystemScreenshotExtractionRunStatus Failed(Guid runId, string errorMessage) =>
            new() { RunId = runId, Stage = SystemScreenshotExtractionStage.Failed, ErrorMessage = errorMessage };
    }

    /// <summary>
    /// Orquesta el flujo completo de "📸 Extraer campos desde captura de
    /// pantalla" en dos pasos, corriendo en BACKGROUND (mismo patrón
    /// start/poll que <see cref="DocumentExtractionOrchestrator"/> — nunca
    /// se espera la llamada de IA dentro del handler HTTP, para evitar el
    /// bug conocido de "zombie Functions host"):
    ///
    /// 1. <see cref="SystemScreenshotExtractionAgent"/> lee la imagen y
    ///    propone la lista cruda de campos visibles (solo visión).
    /// 2. Para cada campo detectado, <see cref="SystemFieldGroundingAgent"/>
    ///    lo investiga con Bing Grounding (con un límite de concurrencia,
    ///    para no disparar demasiadas búsquedas en paralelo) y mejora su
    ///    descripción/formato/regla de negocio cuando encuentra algo útil —
    ///    si el agente de grounding no está configurado, o una búsqueda
    ///    individual falla, se conserva silenciosamente la propuesta
    ///    solo-visión para ese campo (degradación controlada, nunca hace
    ///    fallar toda la extracción).
    /// </summary>
    public sealed class SystemScreenshotExtractionOrchestrator
    {
        /// <summary>Tope de campos que se enriquecen con Bing por corrida —
        /// una captura con demasiados campos detectados no debe disparar un
        /// número descontrolado de búsquedas.</summary>
        private const int MaxFieldsToGround = 25;

        /// <summary>Cuántas búsquedas de Bing corren en paralelo a la vez.</summary>
        private const int GroundingConcurrency = 4;

        private readonly SystemScreenshotExtractionAgent _visionAgent;
        private readonly SystemFieldGroundingAgent _groundingAgent;
        private readonly ILogger<SystemScreenshotExtractionOrchestrator> _logger;
        private readonly ConcurrentDictionary<Guid, SystemScreenshotExtractionRunStatus> _runs = new();

        public SystemScreenshotExtractionOrchestrator(
            SystemScreenshotExtractionAgent visionAgent,
            SystemFieldGroundingAgent groundingAgent,
            ILogger<SystemScreenshotExtractionOrchestrator> logger)
        {
            _visionAgent = visionAgent;
            _groundingAgent = groundingAgent;
            _logger = logger;
        }

        public bool IsConfigured => _visionAgent.IsConfigured;

        /// <summary>Inicia la extracción en background y regresa
        /// INMEDIATAMENTE (Stage.Running) — nunca espera la llamada de IA.</summary>
        public SystemScreenshotExtractionRunStatus Start(byte[] imageBytes, string contentType, string? systemNameHint)
        {
            var runId = Guid.NewGuid();
            _runs[runId] = SystemScreenshotExtractionRunStatus.Running(runId, "Leyendo la captura de pantalla");

            _ = Task.Run(async () =>
            {
                try
                {
                    var visionResult = await _visionAgent.ExtractAsync(imageBytes, contentType);
                    var systemName = !string.IsNullOrWhiteSpace(systemNameHint) ? systemNameHint : visionResult.SistemaDetectado;

                    var candidates = visionResult.Campos.Take(200).ToList();

                    if (candidates.Count == 0)
                    {
                        _runs[runId] = SystemScreenshotExtractionRunStatus.Completed(runId, systemName, []);
                        return;
                    }

                    var results = new List<SystemFieldCandidateResult>();
                    var toGround = candidates.Take(MaxFieldsToGround).ToList();
                    var overflow = candidates.Skip(MaxFieldsToGround).ToList();

                    if (_groundingAgent.IsConfigured && toGround.Count > 0)
                    {
                        _runs[runId] = SystemScreenshotExtractionRunStatus.Running(
                            runId, $"Investigando {toGround.Count} campos con Bing Grounding");

                        using var semaphore = new SemaphoreSlim(GroundingConcurrency);
                        var groundingTasks = toGround.Select(async candidate =>
                        {
                            await semaphore.WaitAsync();
                            try
                            {
                                return await GroundOneFieldAsync(systemName, candidate);
                            }
                            finally
                            {
                                semaphore.Release();
                            }
                        });

                        results.AddRange(await Task.WhenAll(groundingTasks));
                    }
                    else
                    {
                        results.AddRange(toGround.Select(c => ToVisionOnlyResult(c)));
                    }

                    // Campos por encima del tope: se conservan solo con la
                    // propuesta de visión (sin Bing), para que ninguno se
                    // pierda aunque no todos se investiguen a fondo.
                    results.AddRange(overflow.Select(ToVisionOnlyResult));

                    _runs[runId] = SystemScreenshotExtractionRunStatus.Completed(runId, systemName, results);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Background system screenshot extraction failed for run {RunId}", runId);
                    _runs[runId] = SystemScreenshotExtractionRunStatus.Failed(runId, ex.Message);
                }
            });

            return _runs[runId];
        }

        public SystemScreenshotExtractionRunStatus GetStatus(Guid runId)
        {
            if (_runs.TryGetValue(runId, out var status))
                return status;

            throw new InvalidOperationException($"No se encontró una extracción de captura de pantalla en curso con RunId '{runId}'.");
        }

        private async Task<SystemFieldCandidateResult> GroundOneFieldAsync(string? systemName, SystemFieldVisualCandidate candidate)
        {
            try
            {
                var grounding = await _groundingAgent.EnrichAsync(systemName ?? string.Empty, candidate.CampoVisible, candidate.Descripcion);

                return new SystemFieldCandidateResult
                {
                    NombreCampo = candidate.CampoVisible,
                    CampoTecnico = candidate.CampoTecnico,
                    // Prefiere la descripción/formato fundamentados en Bing
                    // cuando la búsqueda realmente encontró algo útil; si no,
                    // conserva la propuesta solo-visión en vez de un texto vacío.
                    Descripcion = grounding.EncontradoEnGrounding && !string.IsNullOrWhiteSpace(grounding.Descripcion)
                        ? grounding.Descripcion
                        : candidate.Descripcion,
                    Formato = grounding.EncontradoEnGrounding && !string.IsNullOrWhiteSpace(grounding.Formato)
                        ? grounding.Formato
                        : candidate.Formato,
                    ReglaNegocio = grounding.ReglaNegocio,
                    FuenteGrounding = grounding.FuenteGrounding,
                    EncontradoEnGrounding = grounding.EncontradoEnGrounding,
                    Accion = candidate.Accion,
                };
            }
            catch (Exception ex)
            {
                // Degradación controlada: si la búsqueda de UN campo falla
                // (timeout, error del SDK preview de Foundry, etc.), nunca
                // debe tirar toda la corrida — se conserva la propuesta
                // solo-visión para ese campo.
                _logger.LogWarning(ex, "Grounding failed for field '{FieldName}', falling back to vision-only proposal", candidate.CampoVisible);
                return ToVisionOnlyResult(candidate);
            }
        }

        private static SystemFieldCandidateResult ToVisionOnlyResult(SystemFieldVisualCandidate candidate) => new()
        {
            NombreCampo = candidate.CampoVisible,
            CampoTecnico = candidate.CampoTecnico,
            Descripcion = candidate.Descripcion,
            Formato = candidate.Formato,
            ReglaNegocio = string.Empty,
            FuenteGrounding = string.Empty,
            EncontradoEnGrounding = false,
            Accion = candidate.Accion,
        };
    }
}
