using System.Collections.Concurrent;
using System.Text.Json;
using AETP.Modules.Process.Domain;
using AETP.Modules.Process.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AETP.Modules.ClientEngagement.Api.Agents
{
    public enum AgentReadinessExtractionStage
    {
        Running,
        Completed,
        Failed
    }

    /// <summary>Point-in-time status of one background Agent-Readiness run,
    /// returned by <see cref="AgentReadinessExtractionOrchestrator.GetStatus"/>.</summary>
    public sealed class AgentReadinessExtractionRunStatus
    {
        public Guid RunId { get; set; }

        public AgentReadinessExtractionStage Stage { get; set; }

        public string? Step { get; set; }

        public Guid? AssessmentId { get; set; }

        public AgentReadinessResult? Result { get; set; }

        public string? ErrorMessage { get; set; }

        public static AgentReadinessExtractionRunStatus Running(Guid runId, string step) =>
            new() { RunId = runId, Stage = AgentReadinessExtractionStage.Running, Step = step };

        public static AgentReadinessExtractionRunStatus Completed(Guid runId, Guid assessmentId, AgentReadinessResult result) =>
            new() { RunId = runId, Stage = AgentReadinessExtractionStage.Completed, AssessmentId = assessmentId, Result = result };

        public static AgentReadinessExtractionRunStatus Failed(Guid runId, string errorMessage) =>
            new() { RunId = runId, Stage = AgentReadinessExtractionStage.Failed, ErrorMessage = errorMessage };
    }

    /// <summary>
    /// Runs the (potentially multi-minute) Agent-Readiness AI extraction
    /// call as a background task, independent of any single HTTP
    /// request/response cycle — same non-blocking start/poll pattern as
    /// <see cref="ProcessDocumentExtractionOrchestrator"/> (which itself
    /// fixed a recurring "zombie Functions host" bug: awaiting a
    /// multi-minute AI call directly inside an HTTP trigger handler
    /// silently kills the isolated-worker host mid-call).
    ///
    /// Prototype-scoped, same trade-off as its sibling: run state lives
    /// only in this process's memory (no Durable Functions) — acceptable
    /// for local/dev use. The final result is always persisted to
    /// <see cref="AgentReadinessAssessment"/> regardless, so a page reload
    /// after completion can still fetch it via GetLatestAgentReadinessAssessment.
    /// </summary>
    public sealed class AgentReadinessExtractionOrchestrator
    {
        private readonly AgentReadinessExtractionAgent _extractionAgent;
        private readonly IDbContextFactory<ProcessDbContext> _dbContextFactory;
        private readonly ILogger<AgentReadinessExtractionOrchestrator> _logger;
        private readonly ConcurrentDictionary<Guid, AgentReadinessExtractionRunStatus> _runs = new();

        public AgentReadinessExtractionOrchestrator(
            AgentReadinessExtractionAgent extractionAgent,
            IDbContextFactory<ProcessDbContext> dbContextFactory,
            ILogger<AgentReadinessExtractionOrchestrator> logger)
        {
            _extractionAgent = extractionAgent;
            _dbContextFactory = dbContextFactory;
            _logger = logger;
        }

        public bool IsConfigured => _extractionAgent.IsConfigured;

        /// <summary>Starts extraction in the background and returns
        /// IMMEDIATELY (Stage.Running) — never awaits the AI call. The
        /// AgentReadinessAssessment row referenced by <paramref name="assessmentId"/>
        /// must already be saved by the caller (Status="Subido") before
        /// calling this, so its Id is stable and known up front.</summary>
        public AgentReadinessExtractionRunStatus Start(
            Guid assessmentId,
            string processName,
            string documentText,
            string? dataSourceSystem = null,
            string? dataSourceSystemOther = null)
        {
            var runId = Guid.NewGuid();
            _runs[runId] = AgentReadinessExtractionRunStatus.Running(runId, "Analizando el proceso completo");

            _ = Task.Run(async () =>
            {
                try
                {
                    var result = await _extractionAgent.ExtractAsync(
                        processName,
                        documentText,
                        dataSourceSystem,
                        dataSourceSystemOther);

                    await using var dbContext = await _dbContextFactory.CreateDbContextAsync();
                    var assessment = await dbContext.AgentReadinessAssessments.FirstOrDefaultAsync(a => a.Id == assessmentId);
                    if (assessment is null)
                    {
                        _runs[runId] = AgentReadinessExtractionRunStatus.Failed(runId, "La evaluación ya no existe.");
                        return;
                    }

                    assessment.ResultJson = JsonSerializer.Serialize(result);
                    assessment.Status = "Completado";
                    await dbContext.SaveChangesAsync();

                    _runs[runId] = AgentReadinessExtractionRunStatus.Completed(runId, assessment.Id, result);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Background Agent-Readiness extraction failed for assessment {AssessmentId}", assessmentId);

                    try
                    {
                        await using var dbContext = await _dbContextFactory.CreateDbContextAsync();
                        var assessment = await dbContext.AgentReadinessAssessments.FirstOrDefaultAsync(a => a.Id == assessmentId);
                        if (assessment is not null)
                        {
                            assessment.Status = "Error";
                            assessment.ErrorMessage = ex.Message;
                            await dbContext.SaveChangesAsync();
                        }
                    }
                    catch (Exception saveEx)
                    {
                        _logger.LogError(saveEx, "Failed to persist Agent-Readiness extraction error for assessment {AssessmentId}", assessmentId);
                    }

                    _runs[runId] = AgentReadinessExtractionRunStatus.Failed(runId, ex.Message);
                }
            });

            return _runs[runId];
        }

        public AgentReadinessExtractionRunStatus GetStatus(Guid runId)
        {
            if (_runs.TryGetValue(runId, out var status))
                return status;

            throw new InvalidOperationException($"No se encontró una extracción en curso con RunId '{runId}'.");
        }
    }
}
