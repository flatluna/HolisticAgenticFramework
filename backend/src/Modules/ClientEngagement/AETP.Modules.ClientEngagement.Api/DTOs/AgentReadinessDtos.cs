using AETP.Modules.ClientEngagement.Api.Agents;

namespace AETP.Modules.ClientEngagement.Api.DTOs
{
    /// <summary>
    /// Envelope returned for a saved Agent-Readiness assessment. Metadata
    /// fields use the app's usual camelCase convention; <see cref="Result"/>
    /// itself keeps the exact snake_case field names defined by the
    /// Agent-Readiness JSON contract (see
    /// <see cref="Agents.AgentReadinessResult"/>) since that shape is a
    /// fixed, dedicated contract shared with the frontend.
    /// </summary>
    public sealed class AgentReadinessAssessmentDto
    {
        public Guid Id { get; set; }
        public Guid ProcessId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public int PageCount { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? ErrorMessage { get; set; }
        public AgentReadinessResult? Result { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
