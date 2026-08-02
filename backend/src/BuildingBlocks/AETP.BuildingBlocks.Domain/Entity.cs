namespace AETP.BuildingBlocks.Domain
{
    public abstract class Entity
    {
        public Guid Id { get; protected set; }
        public Guid EngagementId { get; protected set; }
        public DateTime CreatedAt { get; protected set; }
        public DateTime? UpdatedAt { get; protected set; }

        protected Entity()
        {
            Id = Guid.NewGuid();
            CreatedAt = DateTime.UtcNow;
        }

        protected Entity(Guid engagementId)
        {
            Id = Guid.NewGuid();
            EngagementId = engagementId;
            CreatedAt = DateTime.UtcNow;
        }

        // Call this whenever an entity's mutable fields are changed so
        // UpdatedAt reflects the real last-modified time in SQL (instead of
        // relying on any client-side tracking).
        public void Touch() => UpdatedAt = DateTime.UtcNow;
    }

    public abstract class AggregateRoot : Entity
    {
        protected AggregateRoot() : base() { }
        protected AggregateRoot(Guid engagementId) : base(engagementId) { }
    }
}
