using Microsoft.EntityFrameworkCore;
using AETP.BuildingBlocks.Infrastructure.Persistence;
using AETP.Modules.Decision.Domain;

namespace AETP.Modules.Decision.Infrastructure
{
    public class DecisionDbContext : AetpDbContextBase
    {
        public DbSet<BusinessDecision> BusinessDecisions { get; set; } = null!;

        public DecisionDbContext(DbContextOptions<DecisionDbContext> options)
            : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.HasDefaultSchema("decision");

            modelBuilder.Entity<BusinessDecision>(entity =>
            {
                entity.ToTable("BusinessDecisions");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.Owner).HasMaxLength(200);

                entity.Property(e => e.DecisionType).HasMaxLength(20).HasDefaultValue("Operativa");
                entity.Property(e => e.Frequency).HasMaxLength(20).HasDefaultValue("Mensual");
                entity.Property(e => e.Complexity).HasMaxLength(20).HasDefaultValue("Media");

                entity.Property(e => e.DecisionMaker).HasMaxLength(30).HasDefaultValue("Humano");
                entity.Property(e => e.CurrentAutonomyLevel).HasMaxLength(10).HasDefaultValue("L0");
                entity.Property(e => e.IsRuleBased).HasMaxLength(20).HasDefaultValue("No");
                entity.Property(e => e.RulesDescription).HasMaxLength(2000);
                entity.Property(e => e.RulesSource).HasMaxLength(500);
                entity.Property(e => e.DataAvailability).HasMaxLength(20).HasDefaultValue("No");
                entity.Property(e => e.InputDataUsed).HasMaxLength(1000);

                entity.Property(e => e.TargetAutonomyLevel).HasMaxLength(10).HasDefaultValue("L0");
                entity.Property(e => e.AutomationPotential).HasMaxLength(20).HasDefaultValue("Media");
                entity.Property(e => e.AutomationRisk).HasMaxLength(2000);

                entity.Property(e => e.MainProblems).HasMaxLength(2000);
                entity.Property(e => e.MainOpportunities).HasMaxLength(2000);
                entity.Property(e => e.Observations).HasMaxLength(2000);
                entity.Property(e => e.Status).HasMaxLength(50).HasDefaultValue("Borrador");

                entity.HasIndex(e => e.ProcessId);
                entity.HasIndex(e => new { e.ProcessId, e.Name }).IsUnique();
            });
        }
    }
}
