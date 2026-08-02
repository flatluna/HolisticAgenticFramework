using Microsoft.EntityFrameworkCore;
using AETP.BuildingBlocks.Infrastructure.Persistence;
using StrategyDomain = AETP.Modules.Strategy.Domain;
using AETP.Modules.Strategy.Domain;

namespace AETP.Modules.Strategy.Infrastructure
{
    public class StrategyDbContext : AetpDbContextBase
    {
        public DbSet<StrategyDomain.Strategy> Strategies { get; set; } = null!;
        public DbSet<Objective> Objectives { get; set; } = null!;
        public DbSet<KPI> KPIs { get; set; } = null!;

        public StrategyDbContext(DbContextOptions<StrategyDbContext> options)
            : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure schema
            modelBuilder.HasDefaultSchema("strategy");

            // Strategy
            modelBuilder.Entity<StrategyDomain.Strategy>(entity =>
            {
                entity.ToTable("Strategies");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.EngagementId).IsRequired();
                entity.Property(e => e.Name).IsRequired().HasMaxLength(256);
                entity.Property(e => e.Vision).HasMaxLength(1000);
                entity.Property(e => e.CompetitiveAdvantage).HasMaxLength(1000);
                entity.Property(e => e.Status).HasMaxLength(50).HasDefaultValue("Draft");
                entity.HasIndex(e => e.EngagementId);
                entity.HasMany(e => e.Objectives)
                    .WithOne(o => o.Strategy)
                    .HasForeignKey(o => o.StrategyId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Objective
            modelBuilder.Entity<Objective>(entity =>
            {
                entity.ToTable("Objectives");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.EngagementId).IsRequired();
                entity.Property(e => e.StrategyId).IsRequired();
                entity.Property(e => e.Name).IsRequired().HasMaxLength(256);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.Status).HasMaxLength(50).HasDefaultValue("Draft");
                
                // Business Context
                entity.Property(e => e.BusinessValueCategory).HasMaxLength(50);
                entity.Property(e => e.Owner).HasMaxLength(256);
                entity.Property(e => e.Priority).HasDefaultValue(3);
                entity.Property(e => e.Rationale).HasMaxLength(1000);
                
                entity.HasIndex(e => e.EngagementId);
                entity.HasIndex(e => e.StrategyId);
                entity.HasMany(e => e.KPIs)
                    .WithOne(k => k.Objective)
                    .HasForeignKey(k => k.ObjectiveId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // KPI
            modelBuilder.Entity<KPI>(entity =>
            {
                entity.ToTable("KPIs");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.EngagementId).IsRequired();
                entity.Property(e => e.ObjectiveId).IsRequired();
                entity.Property(e => e.Name).IsRequired().HasMaxLength(256);
                entity.Property(e => e.Unit).HasMaxLength(50);
                entity.Property(e => e.MeasurementFrequency).HasMaxLength(50).HasDefaultValue("Monthly");
                entity.Property(e => e.DataSource).HasMaxLength(256);
                entity.HasIndex(e => e.EngagementId);
                entity.HasIndex(e => e.ObjectiveId);
            });
        }
    }
}
