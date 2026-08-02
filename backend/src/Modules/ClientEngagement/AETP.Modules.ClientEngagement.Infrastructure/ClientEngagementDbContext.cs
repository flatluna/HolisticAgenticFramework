using Microsoft.EntityFrameworkCore;
using AETP.BuildingBlocks.Infrastructure.Persistence;
using AETP.Modules.ClientEngagement.Domain;

namespace AETP.Modules.ClientEngagement.Infrastructure
{
    public class ClientEngagementDbContext : AetpDbContextBase
    {
        public DbSet<ClientOrganization> ClientOrganizations { get; set; } = null!;
        public DbSet<Engagement> Engagements { get; set; } = null!;
        public DbSet<Stakeholder> Stakeholders { get; set; } = null!;
        public DbSet<MandateStakeholder> MandateStakeholders { get; set; } = null!;
        public DbSet<StrategicListItem> StrategicListItems { get; set; } = null!;
        public DbSet<CompanyProfile> CompanyProfiles { get; set; } = null!;
        public DbSet<Department> Departments { get; set; } = null!;
        public DbSet<Location> Locations { get; set; } = null!;
        public DbSet<OrganizationalReadinessPillar> OrganizationalReadinessPillars { get; set; } = null!;
        public DbSet<DomainDiscoverySettings> DomainDiscoverySettings { get; set; } = null!;
        public DbSet<DomainAssessment> DomainAssessments { get; set; } = null!;

        public ClientEngagementDbContext(DbContextOptions<ClientEngagementDbContext> options)
            : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure schema
            modelBuilder.HasDefaultSchema("engagement");

            // ClientOrganization
            modelBuilder.Entity<ClientOrganization>(entity =>
            {
                entity.ToTable("ClientOrganizations");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(256);
                entity.Property(e => e.Industry).HasMaxLength(128);
                entity.Property(e => e.Country).HasMaxLength(128);
                entity.Property(e => e.Status).HasMaxLength(50).HasDefaultValue("Active");
                // Prevent two companies from being registered with the same name.
                // SQL Server's default collation is case-insensitive, so this also
                // rejects names that only differ by casing.
                entity.HasIndex(e => e.Name).IsUnique();
                entity.HasMany(e => e.Engagements)
                    .WithOne(e => e.ClientOrganization)
                    .HasForeignKey(e => e.ClientOrganizationId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Engagement
            modelBuilder.Entity<Engagement>(entity =>
            {
                entity.ToTable("Engagements");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.EngagementId).IsRequired();
                entity.Property(e => e.Name).IsRequired().HasMaxLength(256);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.Status).HasMaxLength(50).HasDefaultValue("Planning");
                
                // Transformation Context
                entity.Property(e => e.TransformationMandate).HasMaxLength(500);
                entity.Property(e => e.BusinessProblem).HasMaxLength(1000);
                entity.Property(e => e.ExpectedDecision).HasMaxLength(1000);
                entity.Property(e => e.ExecutiveSponsor).HasMaxLength(256);
                entity.Property(e => e.Scope).HasMaxLength(1000);
                entity.Property(e => e.OutOfScope).HasMaxLength(1000);
                entity.Property(e => e.SponsorResponsibilities).HasMaxLength(2000);
                entity.Property(e => e.ExpectedOutcomes).HasMaxLength(3000);
                entity.Property(e => e.SuccessCriteria).HasMaxLength(2000);
                entity.Property(e => e.HorizonMinMonths);
                entity.Property(e => e.HorizonMaxMonths);
                entity.Property(e => e.RevenueGrowthTargetPct).HasPrecision(5, 2);
                entity.Property(e => e.CostReductionTargetPct).HasPrecision(5, 2);
                entity.Property(e => e.ProductivityImprovementTargetPct).HasPrecision(5, 2);
                entity.Property(e => e.SlaImprovementTargetPct).HasPrecision(5, 2);
                entity.Property(e => e.StrategyTitle).HasMaxLength(300);
                entity.Property(e => e.StrategyCompanyName).HasMaxLength(256);
                entity.Property(e => e.StrategySector).HasMaxLength(256);
                entity.Property(e => e.StrategyDirectionGeneral).HasMaxLength(3000);
                entity.Property(e => e.MissionStatement).HasMaxLength(2000);
                entity.Property(e => e.VisionStatement).HasMaxLength(2000);
                entity.Property(e => e.VisionObjetivo).HasMaxLength(3000);
                entity.Property(e => e.AutoTargetAtencionClientePct).HasPrecision(5, 2);
                entity.Property(e => e.AutoTargetFinanzasPct).HasPrecision(5, 2);
                entity.Property(e => e.AutoTargetRecursosHumanosPct).HasPrecision(5, 2);
                entity.Property(e => e.AutoTargetMarketingPct).HasPrecision(5, 2);
                entity.Property(e => e.AutoTargetVentasPct).HasPrecision(5, 2);
                entity.Property(e => e.AutoTargetOperacionesPct).HasPrecision(5, 2);
                entity.Property(e => e.AutoTargetAnaliticaReportesPct).HasPrecision(5, 2);
                entity.Property(e => e.TransformationPrinciples).HasMaxLength(3000);
                entity.Property(e => e.StrategicFinalDeclaration).HasMaxLength(3000);
                
                entity.HasIndex(e => e.EngagementId).IsUnique();
                entity.HasMany(e => e.Stakeholders)
                    .WithOne()
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasMany(e => e.MandateStakeholders)
                    .WithOne()
                    .HasForeignKey(s => s.EngagementId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasMany(e => e.StrategicListItems)
                    .WithOne()
                    .HasForeignKey(s => s.EngagementId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Stakeholder
            modelBuilder.Entity<Stakeholder>(entity =>
            {
                entity.ToTable("Stakeholders");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.EngagementId).IsRequired();
                entity.Property(e => e.Name).IsRequired().HasMaxLength(256);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(256);
                entity.Property(e => e.Role).HasMaxLength(128);
                entity.Property(e => e.Status).HasMaxLength(50).HasDefaultValue("Active");
                entity.Property(e => e.Position).HasMaxLength(256);
                entity.Property(e => e.HierarchyLevel).HasMaxLength(50);
                entity.Property(e => e.ReportsTo).HasMaxLength(256);
                entity.Property(e => e.ReplicaTo).HasMaxLength(256);
                entity.Property(e => e.Responsibilities).HasMaxLength(1000);
                entity.HasIndex(e => e.EngagementId);
            });

            // MandateStakeholder
            modelBuilder.Entity<MandateStakeholder>(entity =>
            {
                entity.ToTable("MandateStakeholders");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.EngagementId).IsRequired();
                entity.Property(e => e.Name).IsRequired().HasMaxLength(256);
                entity.Property(e => e.Role).IsRequired().HasMaxLength(256);
                entity.HasIndex(e => e.EngagementId);
            });

            // StrategicListItem
            modelBuilder.Entity<StrategicListItem>(entity =>
            {
                entity.ToTable("StrategicListItems");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.EngagementId).IsRequired();
                entity.Property(e => e.Category).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Value).IsRequired().HasMaxLength(1000);
                entity.Property(e => e.DisplayOrder).IsRequired();
                entity.HasIndex(e => e.EngagementId);
                entity.HasIndex(e => new { e.EngagementId, e.Category, e.DisplayOrder });
            });

            // CompanyProfile
            modelBuilder.Entity<CompanyProfile>(entity =>
            {
                entity.ToTable("CompanyProfiles");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.EngagementId).IsRequired();
                entity.Property(e => e.ClientOrganizationId).IsRequired();
                entity.Property(e => e.HeadquartersStreet).HasMaxLength(256);
                entity.Property(e => e.HeadquartersNeighborhood).HasMaxLength(256);
                entity.Property(e => e.HeadquartersCity).HasMaxLength(256);
                entity.Property(e => e.HeadquartersState).HasMaxLength(256);
                entity.Property(e => e.HeadquartersCountry).HasMaxLength(256);
                entity.Property(e => e.HeadquartersPostalCode).HasMaxLength(20);
                entity.Property(e => e.PhoneCountryCode).HasMaxLength(5);
                entity.Property(e => e.Phone).HasMaxLength(20);
                entity.Property(e => e.CloudAdoptionScore).HasDefaultValue(0);
                entity.Property(e => e.DataMaturityScore).HasDefaultValue(0);
                entity.Property(e => e.AIAdoptionScore).HasDefaultValue(0);
                entity.Property(e => e.IndustrySectors).HasColumnType("nvarchar(max)");
                entity.Property(e => e.GeographicMarkets).HasColumnType("nvarchar(max)");
                entity.Property(e => e.KeyProducts).HasColumnType("nvarchar(max)");
                entity.Property(e => e.CreditRating).HasMaxLength(50);
                entity.Property(e => e.Status).HasMaxLength(50).HasDefaultValue("Active");
                entity.HasIndex(e => e.EngagementId);
                entity.HasIndex(e => e.ClientOrganizationId);
                entity.HasMany(e => e.Departments)
                    .WithOne()
                    .HasForeignKey(d => d.CompanyProfileId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasMany(e => e.Locations)
                    .WithOne()
                    .HasForeignKey(l => l.CompanyProfileId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Department
            modelBuilder.Entity<Department>(entity =>
            {
                entity.ToTable("Departments");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.EngagementId).IsRequired();
                entity.Property(e => e.CompanyProfileId).IsRequired();
                entity.Property(e => e.Name).IsRequired().HasMaxLength(256);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.LeadName).HasMaxLength(256);
                entity.Property(e => e.LeadEmail).HasMaxLength(256);
                entity.Property(e => e.Status).HasMaxLength(50).HasDefaultValue("Active");
                entity.HasIndex(e => new { e.CompanyProfileId, e.Name }).IsUnique();
                entity.HasIndex(e => e.EngagementId);
            });

            // Location
            modelBuilder.Entity<Location>(entity =>
            {
                entity.ToTable("Locations");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.EngagementId).IsRequired();
                entity.Property(e => e.CompanyProfileId).IsRequired();
                entity.Property(e => e.City).IsRequired().HasMaxLength(256);
                entity.Property(e => e.Country).IsRequired().HasMaxLength(256);
                entity.Property(e => e.Office).HasMaxLength(50).HasDefaultValue("Branch");
                entity.Property(e => e.Status).HasMaxLength(50).HasDefaultValue("Active");
                entity.HasIndex(e => new { e.CompanyProfileId, e.City, e.Country }).IsUnique();
                entity.HasIndex(e => e.EngagementId);
            });

            // OrganizationalReadinessPillar (Paso 1 · Assessment de Preparación Organizacional)
            modelBuilder.Entity<OrganizationalReadinessPillar>(entity =>
            {
                entity.ToTable("OrganizationalReadinessPillars");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.EngagementId).IsRequired();
                entity.Property(e => e.PillarId).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Notes).HasMaxLength(2000);
                entity.Property(e => e.EvidenceGroupsJson).HasColumnType("nvarchar(max)");
                entity.HasIndex(e => new { e.EngagementId, e.PillarId }).IsUnique();
            });

            // DomainDiscoverySettings (Paso 2 · industria seleccionada, 1 fila/engagement)
            modelBuilder.Entity<DomainDiscoverySettings>(entity =>
            {
                entity.ToTable("DomainDiscoverySettings");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.EngagementId).IsRequired();
                entity.Property(e => e.SelectedIndustryId).HasMaxLength(100);
                entity.HasIndex(e => e.EngagementId).IsUnique();
            });

            // DomainAssessment (Paso 2 · Descubrimiento y Priorización de Dominios)
            modelBuilder.Entity<DomainAssessment>(entity =>
            {
                entity.ToTable("DomainAssessments");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.EngagementId).IsRequired();
                entity.Property(e => e.DomainId).IsRequired().HasMaxLength(100);
                entity.Property(e => e.BusinessContext).HasMaxLength(4000);
                entity.Property(e => e.ProcessInventoryJson).HasColumnType("nvarchar(max)");
                entity.Property(e => e.SystemsInventoryJson).HasColumnType("nvarchar(max)");
                entity.HasIndex(e => new { e.EngagementId, e.DomainId }).IsUnique();
            });
        }
    }
}
