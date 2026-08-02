using Microsoft.EntityFrameworkCore;
using AETP.BuildingBlocks.Infrastructure.Persistence;
using AETP.Modules.Capability.Domain;

namespace AETP.Modules.Capability.Infrastructure
{
    public class CapabilityDbContext : AetpDbContextBase
    {
        public DbSet<BusinessCapability> BusinessCapabilities { get; set; } = null!;
        public DbSet<CapabilityKpi> CapabilityKpis { get; set; } = null!;

        public CapabilityDbContext(DbContextOptions<CapabilityDbContext> options)
            : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.HasDefaultSchema("capability");

            modelBuilder.Entity<BusinessCapability>(entity =>
            {
                entity.ToTable("BusinessCapabilities");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.BusinessDomain).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.Owner).HasMaxLength(200);
                entity.Property(e => e.ResponsibleArea).HasMaxLength(200);
                entity.Property(e => e.Status).HasMaxLength(50).HasDefaultValue("Borrador");
                entity.Property(e => e.TargetAutonomyLevel).HasMaxLength(10).HasDefaultValue("L0");
                entity.Property(e => e.MainProblems).HasMaxLength(2000);
                entity.Property(e => e.MainOpportunities).HasMaxLength(2000);
                entity.Property(e => e.Observations).HasMaxLength(2000);

                entity.HasIndex(e => new { e.EngagementId, e.Name }).IsUnique();

                entity.HasMany(e => e.Kpis)
                    .WithOne()
                    .HasForeignKey(k => k.BusinessCapabilityId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<CapabilityKpi>(entity =>
            {
                entity.ToTable("CapabilityKpis");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Unit).HasMaxLength(50);
                entity.Property(e => e.CurrentValue).HasColumnType("decimal(18,4)");
                entity.Property(e => e.Target).HasColumnType("decimal(18,4)");
            });
        }
    }
}
