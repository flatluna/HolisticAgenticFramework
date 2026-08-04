using Microsoft.EntityFrameworkCore;
using AETP.BuildingBlocks.Infrastructure.Persistence;
using AETP.Modules.Process.Domain;

namespace AETP.Modules.Process.Infrastructure
{
    public class ProcessDbContext : AetpDbContextBase
    {
        public DbSet<BusinessProcess> BusinessProcesses { get; set; } = null!;
        public DbSet<ProcessDocument> ProcessDocuments { get; set; } = null!;
        public DbSet<AgentReadinessAssessment> AgentReadinessAssessments { get; set; } = null!;
        public DbSet<BusinessDomain> BusinessDomains { get; set; } = null!;
        public DbSet<EnterpriseSystem> EnterpriseSystems { get; set; } = null!;
        public DbSet<EnterpriseSystemModule> EnterpriseSystemModules { get; set; } = null!;
        public DbSet<EnterpriseSystemTransaction> EnterpriseSystemTransactions { get; set; } = null!;
        public DbSet<ProcessDependency> ProcessDependencies { get; set; } = null!;
        public DbSet<ProcessSystem> ProcessSystems { get; set; } = null!;
        public DbSet<RoleCategory> RoleCategories { get; set; } = null!;
        public DbSet<SkillCategory> SkillCategories { get; set; } = null!;
        public DbSet<Role> Roles { get; set; } = null!;
        public DbSet<Skill> Skills { get; set; } = null!;
        public DbSet<ProcessRole> ProcessRoles { get; set; } = null!;
        public DbSet<RoleSkill> RoleSkills { get; set; } = null!;
        public DbSet<ProcessRequiredSkill> ProcessRequiredSkills { get; set; } = null!;
        public DbSet<KpiDefinition> KpiDefinitions { get; set; } = null!;
        public DbSet<ProcessKPI> ProcessKPIs { get; set; } = null!;
        public DbSet<BusinessRule> BusinessRules { get; set; } = null!;
        public DbSet<ProcessBusinessRule> ProcessBusinessRules { get; set; } = null!;
        public DbSet<ProcessActivity> ProcessActivities { get; set; } = null!;
        public DbSet<ActivityInteraction> ActivityInteractions { get; set; } = null!;
        public DbSet<ActivityDependency> ActivityDependencies { get; set; } = null!;
        public DbSet<ProcessGapFinding> ProcessGapFindings { get; set; } = null!;
        public DbSet<DocumentExtraction> DocumentExtractions { get; set; } = null!;
        public DbSet<DataDictionaryEntry> DataDictionaryEntries { get; set; } = null!;

        public ProcessDbContext(DbContextOptions<ProcessDbContext> options)
            : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.HasDefaultSchema("process");

            modelBuilder.Entity<BusinessProcess>(entity =>
            {
                entity.ToTable("BusinessProcesses");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.Owner).HasMaxLength(200);
                entity.Property(e => e.IsDocumented).HasMaxLength(20).HasDefaultValue("No");
                entity.Property(e => e.IsFormalized).HasMaxLength(20).HasDefaultValue("No");
                entity.Property(e => e.CurrentAutonomyLevel).HasMaxLength(10).HasDefaultValue("L0");
                entity.Property(e => e.Criticality).HasMaxLength(20).HasDefaultValue("Media");
                entity.Property(e => e.DataSourceSystem).HasMaxLength(100);
                entity.Property(e => e.DataSourceSystemOther).HasMaxLength(200);
                entity.Property(e => e.MainProblems).HasMaxLength(2000);
                entity.Property(e => e.MainOpportunities).HasMaxLength(2000);
                entity.Property(e => e.Observations).HasMaxLength(2000);
                entity.Property(e => e.Status).HasMaxLength(50).HasDefaultValue("Borrador");
                entity.Property(e => e.PriorityLevel).HasConversion<string>().HasMaxLength(20);

                entity.HasIndex(e => e.CapabilityId);
                entity.HasIndex(e => new { e.CapabilityId, e.Name }).IsUnique();
                entity.HasIndex(e => e.DomainId);
                entity.HasIndex(e => e.OwnerRoleId);

                entity.HasOne<Role>()
                    .WithMany()
                    .HasForeignKey(e => e.OwnerRoleId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<ProcessDocument>(entity =>
            {
                entity.ToTable("ProcessDocuments");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.FileName).IsRequired().HasMaxLength(300);
                entity.Property(e => e.BlobPath).HasMaxLength(500);
                entity.Property(e => e.ExtractedText).HasColumnType("nvarchar(max)");
                entity.Property(e => e.ExecutiveSummary).HasColumnType("nvarchar(max)");
                entity.Property(e => e.EntitiesJson).HasColumnType("nvarchar(max)");
                entity.Property(e => e.ExtractionStatus).HasMaxLength(20).HasDefaultValue("Subido");
                entity.Property(e => e.ExtractionError).HasMaxLength(2000);
                entity.Property(e => e.Source).HasConversion<string>().HasMaxLength(20).HasDefaultValue(ProcessDocumentSource.Cliente);

                entity.HasIndex(e => e.ProcessId);
            });

            modelBuilder.Entity<AgentReadinessAssessment>(entity =>
            {
                entity.ToTable("AgentReadinessAssessments");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.FileName).IsRequired().HasMaxLength(300);
                entity.Property(e => e.BlobPath).HasMaxLength(500);
                entity.Property(e => e.ResultJson).HasColumnType("nvarchar(max)");
                entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Subido");
                entity.Property(e => e.ErrorMessage).HasMaxLength(2000);

                entity.HasIndex(e => e.ProcessId);
            });

            modelBuilder.Entity<BusinessDomain>(entity =>
            {
                entity.ToTable("BusinessDomains");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Code).HasMaxLength(20);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Activo");

                entity.HasIndex(e => new { e.EngagementId, e.Name }).IsUnique();
            });

            modelBuilder.Entity<EnterpriseSystem>(entity =>
            {
                entity.ToTable("EnterpriseSystems");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Category).HasMaxLength(100);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Activo");
                entity.Property(e => e.EsSuite).HasDefaultValue(false);
                entity.Property(e => e.TieneAPI).HasDefaultValue(false);
                entity.Property(e => e.TipoAPI).HasMaxLength(100);
                entity.Property(e => e.NotasAPI).HasMaxLength(1000);
                entity.Property(e => e.Hosting).HasConversion<string>().HasMaxLength(20);
                entity.Property(e => e.ProveedorNube).HasMaxLength(100);
                entity.Property(e => e.NotasHosting).HasMaxLength(1000);

                entity.HasIndex(e => new { e.EngagementId, e.Name }).IsUnique();
            });

            modelBuilder.Entity<EnterpriseSystemModule>(entity =>
            {
                entity.ToTable("EnterpriseSystemModules");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);

                entity.HasIndex(e => e.SystemId);

                entity.HasOne<EnterpriseSystem>()
                    .WithMany()
                    .HasForeignKey(e => e.SystemId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<EnterpriseSystemTransaction>(entity =>
            {
                entity.ToTable("EnterpriseSystemTransactions");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Codigo).HasMaxLength(50);
                entity.Property(e => e.Nombre).HasMaxLength(200);

                entity.HasIndex(e => e.SystemId);

                entity.HasOne<EnterpriseSystem>()
                    .WithMany()
                    .HasForeignKey(e => e.SystemId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ProcessDependency>(entity =>
            {
                entity.ToTable("ProcessDependencies");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.DependencyType).HasConversion<string>().HasMaxLength(30);
                entity.Property(e => e.Notes).HasMaxLength(1000);

                entity.HasIndex(e => new { e.SourceProcessId, e.TargetProcessId }).IsUnique();
                entity.HasIndex(e => e.TargetProcessId);

                entity.HasOne<BusinessProcess>()
                    .WithMany()
                    .HasForeignKey(e => e.SourceProcessId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne<BusinessProcess>()
                    .WithMany()
                    .HasForeignKey(e => e.TargetProcessId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<ProcessSystem>(entity =>
            {
                entity.ToTable("ProcessSystems");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UsageType).HasMaxLength(100);

                entity.HasIndex(e => new { e.ProcessId, e.SystemId }).IsUnique();
                entity.HasIndex(e => e.SystemId);

                entity.HasOne<BusinessProcess>()
                    .WithMany()
                    .HasForeignKey(e => e.ProcessId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne<EnterpriseSystem>()
                    .WithMany()
                    .HasForeignKey(e => e.SystemId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ================= Human Capability Foundation (Sprint 2) =================

            modelBuilder.Entity<RoleCategory>(entity =>
            {
                entity.ToTable("RoleCategories");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Activo");

                entity.HasIndex(e => new { e.EngagementId, e.Name }).IsUnique();
            });

            modelBuilder.Entity<SkillCategory>(entity =>
            {
                entity.ToTable("SkillCategories");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Activo");

                entity.HasIndex(e => new { e.EngagementId, e.Name }).IsUnique();
            });

            modelBuilder.Entity<Role>(entity =>
            {
                entity.ToTable("Roles");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Activo");

                entity.HasIndex(e => new { e.EngagementId, e.Name }).IsUnique();
                entity.HasIndex(e => e.RoleCategoryId);

                entity.HasOne<RoleCategory>()
                    .WithMany()
                    .HasForeignKey(e => e.RoleCategoryId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Skill>(entity =>
            {
                entity.ToTable("Skills");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Activo");

                entity.HasIndex(e => new { e.EngagementId, e.Name }).IsUnique();
                entity.HasIndex(e => e.SkillCategoryId);

                entity.HasOne<SkillCategory>()
                    .WithMany()
                    .HasForeignKey(e => e.SkillCategoryId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<ProcessRole>(entity =>
            {
                entity.ToTable("ProcessRoles");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.InvolvementType).HasConversion<string>().HasMaxLength(20);
                entity.Property(e => e.Notes).HasMaxLength(1000);

                entity.HasIndex(e => new { e.ProcessId, e.RoleId }).IsUnique();
                entity.HasIndex(e => e.RoleId);

                entity.HasOne<BusinessProcess>()
                    .WithMany()
                    .HasForeignKey(e => e.ProcessId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne<Role>()
                    .WithMany()
                    .HasForeignKey(e => e.RoleId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<RoleSkill>(entity =>
            {
                entity.ToTable("RoleSkills");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ProficiencyLevel).HasConversion<string>().HasMaxLength(20);

                entity.HasIndex(e => new { e.RoleId, e.SkillId }).IsUnique();
                entity.HasIndex(e => e.SkillId);

                entity.HasOne<Role>()
                    .WithMany()
                    .HasForeignKey(e => e.RoleId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne<Skill>()
                    .WithMany()
                    .HasForeignKey(e => e.SkillId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<ProcessRequiredSkill>(entity =>
            {
                entity.ToTable("ProcessRequiredSkills");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.RequiredProficiencyLevel).HasConversion<string>().HasMaxLength(20);
                entity.Property(e => e.Criticality).HasConversion<string>().HasMaxLength(20);

                entity.HasIndex(e => new { e.ProcessId, e.SkillId }).IsUnique();
                entity.HasIndex(e => e.SkillId);

                entity.HasOne<BusinessProcess>()
                    .WithMany()
                    .HasForeignKey(e => e.ProcessId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne<Skill>()
                    .WithMany()
                    .HasForeignKey(e => e.SkillId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<KpiDefinition>(entity =>
            {
                entity.ToTable("KpiDefinitions");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.Unit).HasMaxLength(50);
                entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Activo");

                entity.HasIndex(e => new { e.EngagementId, e.Name }).IsUnique();
            });

            modelBuilder.Entity<ProcessKPI>(entity =>
            {
                entity.ToTable("ProcessKPIs");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.BaselineValue).HasColumnType("decimal(18,4)");
                entity.Property(e => e.TargetValue).HasColumnType("decimal(18,4)");

                entity.HasIndex(e => new { e.ProcessId, e.KpiDefinitionId }).IsUnique();
                entity.HasIndex(e => e.KpiDefinitionId);

                entity.HasOne<BusinessProcess>()
                    .WithMany()
                    .HasForeignKey(e => e.ProcessId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne<KpiDefinition>()
                    .WithMany()
                    .HasForeignKey(e => e.KpiDefinitionId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<BusinessRule>(entity =>
            {
                entity.ToTable("BusinessRules");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Description).HasMaxLength(2000);
                entity.Property(e => e.RuleType).HasConversion<string>().HasMaxLength(30);
                entity.Property(e => e.Source).HasConversion<string>().HasMaxLength(30);
                entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Activo");

                entity.HasIndex(e => new { e.EngagementId, e.Name }).IsUnique();
            });

            modelBuilder.Entity<ProcessBusinessRule>(entity =>
            {
                entity.ToTable("ProcessBusinessRules");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ApplicationNotes).HasMaxLength(1000);

                entity.HasIndex(e => new { e.ProcessId, e.BusinessRuleId }).IsUnique();
                entity.HasIndex(e => e.BusinessRuleId);

                entity.HasOne<BusinessProcess>()
                    .WithMany()
                    .HasForeignKey(e => e.ProcessId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne<BusinessRule>()
                    .WithMany()
                    .HasForeignKey(e => e.BusinessRuleId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ================= Human-Agent Operating Model Foundation (Sprint 3) =================

            modelBuilder.Entity<ProcessActivity>(entity =>
            {
                entity.ToTable("ProcessActivities");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(300);
                entity.Property(e => e.DecisionDescription).HasMaxLength(2000);
                entity.Property(e => e.BlockerNotes).HasMaxLength(2000);
                entity.Property(e => e.DocumentedWay).HasMaxLength(2000);
                entity.Property(e => e.RealWay).HasMaxLength(2000);
                entity.Property(e => e.GapNotes).HasMaxLength(2000);

                entity.HasIndex(e => new { e.ProcessId, e.SequenceOrder }).IsUnique();
                entity.HasIndex(e => e.PerformedByRoleId);
                entity.HasIndex(e => e.ApprovedByRoleId);

                entity.HasOne<BusinessProcess>()
                    .WithMany()
                    .HasForeignKey(e => e.ProcessId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne<Role>()
                    .WithMany()
                    .HasForeignKey(e => e.PerformedByRoleId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne<Role>()
                    .WithMany()
                    .HasForeignKey(e => e.ApprovedByRoleId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<ActivityInteraction>(entity =>
            {
                entity.ToTable("ActivityInteractions");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Channel).HasConversion<string>().HasMaxLength(20);
                entity.Property(e => e.ContentExample).HasMaxLength(4000);

                entity.HasIndex(e => new { e.ActivityId, e.SequenceOrder }).IsUnique();
                entity.HasIndex(e => e.SystemUsedId);
                entity.HasIndex(e => e.FromRoleId);
                entity.HasIndex(e => e.ToRoleId);

                entity.HasOne<ProcessActivity>()
                    .WithMany()
                    .HasForeignKey(e => e.ActivityId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne<EnterpriseSystem>()
                    .WithMany()
                    .HasForeignKey(e => e.SystemUsedId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne<Role>()
                    .WithMany()
                    .HasForeignKey(e => e.FromRoleId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne<Role>()
                    .WithMany()
                    .HasForeignKey(e => e.ToRoleId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<ActivityDependency>(entity =>
            {
                entity.ToTable("ActivityDependencies");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.DependencyType).HasConversion<string>().HasMaxLength(20);
                entity.Property(e => e.Notes).HasMaxLength(1000);

                entity.HasIndex(e => new { e.ActivityId, e.DependsOnActivityId }).IsUnique();
                entity.HasIndex(e => e.DependsOnActivityId);

                entity.HasOne<ProcessActivity>()
                    .WithMany()
                    .HasForeignKey(e => e.ActivityId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne<ProcessActivity>()
                    .WithMany()
                    .HasForeignKey(e => e.DependsOnActivityId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<ProcessGapFinding>(entity =>
            {
                entity.ToTable("ProcessGapFindings");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.GapCategory).HasConversion<string>().HasMaxLength(30);
                entity.Property(e => e.Severity).HasConversion<string>().HasMaxLength(20);
                entity.Property(e => e.Description).IsRequired().HasMaxLength(2000);
                entity.Property(e => e.IdentifiedBy).HasConversion<string>().HasMaxLength(20);
                entity.Property(e => e.RecommendedAction).HasMaxLength(2000);

                entity.HasIndex(e => e.ActivityId);
                entity.HasIndex(e => e.Severity);

                entity.HasOne<ProcessActivity>()
                    .WithMany()
                    .HasForeignKey(e => e.ActivityId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ================= Document Extraction Agent =================

            modelBuilder.Entity<DocumentExtraction>(entity =>
            {
                entity.ToTable("DocumentExtractions");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.FileName).IsRequired().HasMaxLength(300);
                entity.Property(e => e.ContentType).HasMaxLength(150);
                entity.Property(e => e.BlobPath).HasMaxLength(500);
                entity.Property(e => e.DocumentFormat).HasMaxLength(50);
                entity.Property(e => e.Author).HasMaxLength(300);
                entity.Property(e => e.DetectedLanguage).HasMaxLength(50);
                entity.Property(e => e.ExtractedDataJson).HasColumnType("nvarchar(max)");
                entity.Property(e => e.EntitiesJson).HasColumnType("nvarchar(max)");
                entity.Property(e => e.ContentDescription).HasColumnType("nvarchar(max)");
                entity.Property(e => e.ExecutiveSummary).HasColumnType("nvarchar(max)");
                entity.Property(e => e.ExtractionStatus).HasMaxLength(20).HasDefaultValue("Subido");
                entity.Property(e => e.ExtractionError).HasMaxLength(2000);
                entity.Property(e => e.ExtractionModel).HasMaxLength(100);

                entity.HasIndex(e => e.ProcessId);
                entity.HasIndex(e => e.ActivityId);
                entity.HasIndex(e => e.SourceId);

                entity.HasOne<ProcessActivity>()
                    .WithMany()
                    .HasForeignKey(e => e.ActivityId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne<ActivityInteraction>()
                    .WithMany()
                    .HasForeignKey(e => e.SourceId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ================= Data Dictionary =================

            modelBuilder.Entity<DataDictionaryEntry>(entity =>
            {
                entity.ToTable("DataDictionaryEntries");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.OfficialName).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Context).HasMaxLength(200);
                entity.Property(e => e.Description).HasMaxLength(2000);
                entity.Property(e => e.TechnicalName).HasMaxLength(200);
                entity.Property(e => e.DataType).HasMaxLength(30);
                entity.Property(e => e.Format).HasMaxLength(500);
                entity.Property(e => e.Owner).HasMaxLength(200);
                entity.Property(e => e.QualityOwner).HasMaxLength(200);
                entity.Property(e => e.SynonymsJson).HasColumnType("nvarchar(max)");
                entity.Property(e => e.RepresentationsJson).HasColumnType("nvarchar(max)");
                entity.Property(e => e.GlobalRulesJson).HasColumnType("nvarchar(max)");

                entity.HasIndex(e => new { e.EngagementId, e.OfficialName, e.Context });
            });
        }
    }
}
