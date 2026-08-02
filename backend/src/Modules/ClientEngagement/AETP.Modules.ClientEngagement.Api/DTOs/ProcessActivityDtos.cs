namespace AETP.Modules.ClientEngagement.Api.DTOs
{
    public class CreateProcessActivityRequest
    {
        public int SequenceOrder { get; set; }
        public string Name { get; set; } = string.Empty;
        public Guid? PerformedByRoleId { get; set; }
        public string? DecisionDescription { get; set; }
        public bool RequiresApproval { get; set; }
        public Guid? ApprovedByRoleId { get; set; }
        public int? EstimatedDurationMinutes { get; set; }
        public int? ActualDurationMinutes { get; set; }
        public int? WaitTimeMinutes { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public string? BlockerNotes { get; set; }
        public string? DocumentedWay { get; set; }
        public string? RealWay { get; set; }
        public string? GapNotes { get; set; }
    }

    public class ProcessActivityDto
    {
        public Guid Id { get; set; }
        public Guid EngagementId { get; set; }
        public Guid ProcessId { get; set; }
        public int SequenceOrder { get; set; }
        public string Name { get; set; } = string.Empty;
        public Guid? PerformedByRoleId { get; set; }
        public string? DecisionDescription { get; set; }
        public bool RequiresApproval { get; set; }
        public Guid? ApprovedByRoleId { get; set; }
        public int? EstimatedDurationMinutes { get; set; }
        public int? ActualDurationMinutes { get; set; }
        public int? WaitTimeMinutes { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public string? BlockerNotes { get; set; }
        public string? DocumentedWay { get; set; }
        public string? RealWay { get; set; }
        public string? GapNotes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateActivityInteractionRequest
    {
        public int SequenceOrder { get; set; }
        public string Channel { get; set; } = string.Empty;
        public Guid? SystemUsedId { get; set; }
        public Guid? FromRoleId { get; set; }
        public Guid? ToRoleId { get; set; }
        public string? ContentExample { get; set; }
        public int? ResponseTimeMinutes { get; set; }
    }

    public class ActivityInteractionDto
    {
        public Guid Id { get; set; }
        public Guid EngagementId { get; set; }
        public Guid ActivityId { get; set; }
        public int SequenceOrder { get; set; }
        public string Channel { get; set; } = string.Empty;
        public Guid? SystemUsedId { get; set; }
        public Guid? FromRoleId { get; set; }
        public Guid? ToRoleId { get; set; }
        public string? ContentExample { get; set; }
        public int? ResponseTimeMinutes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateActivityDependencyRequest
    {
        public Guid DependsOnActivityId { get; set; }
        public string? DependencyType { get; set; }
        public string? Notes { get; set; }
    }

    public class ActivityDependencyDto
    {
        public Guid Id { get; set; }
        public Guid EngagementId { get; set; }
        public Guid ActivityId { get; set; }
        public Guid DependsOnActivityId { get; set; }
        public string? DependencyType { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
