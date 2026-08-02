using Microsoft.EntityFrameworkCore;

namespace AETP.BuildingBlocks.Infrastructure.Persistence
{
    public abstract class AetpDbContextBase : DbContext
    {
        protected AetpDbContextBase(DbContextOptions options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Global query filters: all queries must include EngagementId
            // This will be overridden per DbContext for specific schemas
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            // Add audit timestamps, domain events, etc. here
            return await base.SaveChangesAsync(cancellationToken);
        }
    }
}
