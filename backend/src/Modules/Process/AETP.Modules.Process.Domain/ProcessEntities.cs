using AETP.BuildingBlocks.Domain;

namespace AETP.Modules.Process.Domain
{
    /// <summary>Qualitative business priority of a <see cref="BusinessProcess"/>
    /// for transformation sequencing (Level 1 - Domain Transformation Loop:
    /// "the client selects the highest priority process within the domain").
    /// Intentionally qualitative, not a numeric score — future versions can
    /// add BusinessValueScore/AutomationPotentialScore/ComplexityScore/
    /// StrategicAlignmentScore without breaking this model.</summary>
    public enum ProcessPriorityLevel
    {
        Low,
        Medium,
        High,
        Critical
    }

    /// <summary>Nature of a <see cref="ProcessDependency"/> edge, so the
    /// Process Dependency Graph can be filtered/visualized by dependency
    /// kind (upstream/downstream flow vs. data/approval/system coupling).</summary>
    public enum ProcessDependencyType
    {
        Upstream,
        Downstream,
        DataDependency,
        ApprovalDependency,
        SystemDependency
    }

    /// <summary>How well a <see cref="Role"/> masters a <see cref="Skill"/> (via
    /// <see cref="RoleSkill"/>), or how well a <see cref="BusinessProcess"/>
    /// needs a skill to be executed (via <see cref="ProcessRequiredSkill"/>).
    /// Shared by both so gap analysis can directly compare the two levels.</summary>
    public enum SkillProficiencyLevel
    {
        Basico,
        Intermedio,
        Avanzado,
        Experto
    }

    /// <summary>RACI-style nature of a <see cref="Role"/>'s participation in a
    /// <see cref="BusinessProcess"/>, captured via <see cref="ProcessRole"/>.</summary>
    public enum ProcessRoleInvolvementType
    {
        Ejecutor,
        Aprobador,
        Consultado,
        Informado
    }

    /// <summary>How critical a required <see cref="Skill"/> is for successful
    /// execution of a <see cref="BusinessProcess"/>, captured via
    /// <see cref="ProcessRequiredSkill"/>.</summary>
    public enum SkillRequirementCriticality
    {
        Baja,
        Media,
        Alta,
        Critica
    }

    /// <summary>Classification of a <see cref="BusinessRule"/>.</summary>
    public enum BusinessRuleType
    {
        UmbralAprobacion,
        ValidacionDatos,
        SegregacionFunciones,
        Cumplimiento,
        CriterioElegibilidad,
        Otro
    }

    /// <summary>Where a <see cref="BusinessRule"/> is documented/lives today.</summary>
    public enum BusinessRuleSource
    {
        PoliticaCorporativa,
        ConfiguracionSistema,
        NormativaRegulatoria,
        ConocimientoTacito,
        ManualProcedimiento,
        Otro
    }

    /// <summary>Canal de comunicación/interacción usado en un
    /// <see cref="ActivityInteraction"/>. Fijo y universal (no varía por
    /// cliente/industria), a diferencia de <see cref="EnterpriseSystem"/> que
    /// sí es un catálogo extensible por cliente.</summary>
    public enum InteractionChannel
    {
        Email,
        WhatsApp,
        Slack,
        Teams,
        Phone,
        InPerson,
        EnterpriseSystem,
        Other
    }

    /// <summary>Origen de un <see cref="ProcessDocument"/>: subido por el
    /// cliente/asesor, o generado por un Agente de IA a partir del
    /// levantamiento as-is (<see cref="ProcessActivity"/>) cuando no existía
    /// un proceso escrito previo.</summary>
    public enum ProcessDocumentSource
    {
        Cliente,
        IAGenerado
    }

    /// <summary>Categoría de una brecha encontrada por el Gap Analysis (real
    /// vs. documentado) en un <see cref="ProcessGapFinding"/>.</summary>
    public enum GapCategory
    {
        PasoNoDocumentado,
        RolNoCoincide,
        SistemaNoUtilizado,
        CanalNoAutorizado,
        IneficienciaTiempo,
        DesviacionDeControl,
        Otro
    }

    /// <summary>Severidad de un <see cref="ProcessGapFinding"/>, para
    /// priorizar el reengineering posterior.</summary>
    public enum GapSeverity
    {
        Baja,
        Media,
        Alta,
        Critica
    }

    /// <summary>Quién identificó un <see cref="ProcessGapFinding"/>.</summary>
    public enum GapIdentifiedBy
    {
        IA,
        Asesor,
        Cliente
    }

    /// <summary>
    /// A single Business Process captured during the "02. Diagnóstico y Madurez
    /// Actual" assessment (dimension 2.3 - Procesos). Each process belongs to
    /// exactly one Business Capability (e.g. "Marketing") — la capacidad dueña —
    /// aunque en la práctica pueda tocar más de un área.
    /// </summary>
    public class BusinessProcess : AggregateRoot
    {
        /// <summary>Capacidad dueña del proceso (FK lógica a BusinessCapability, sin
        /// constraint físico entre módulos, igual que EngagementId).</summary>
        public Guid CapabilityId { get; set; }

        /// <summary>Dominio de negocio al que pertenece este proceso (FK real a
        /// BusinessDomain — misma tabla/schema/módulo, a diferencia de
        /// CapabilityId que es cross-module). Nullable: procesos existentes no
        /// tienen dominio asignado hasta que se clasifiquen.</summary>
        public Guid? DomainId { get; set; }

        /// <summary>Prioridad de transformación del proceso dentro de su dominio
        /// (Level 1 - Domain Transformation Loop). Nullable: aún no priorizado.</summary>
        public ProcessPriorityLevel? PriorityLevel { get; set; }

        /// <summary>Rol formalmente responsable/accountable del proceso (FK real a
        /// Role — misma tabla/schema/módulo). Nullable: aún no asignado. Distinto
        /// del campo <see cref="Owner"/> (nombre de persona en texto libre): este
        /// es la clasificación estructurada del rol dueño.</summary>
        public Guid? OwnerRoleId { get; set; }

        // Información General
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Owner { get; set; } // Process Owner

        // Estado de Documentación
        public string IsDocumented { get; set; } = "No"; // Sí/No/Parcial
        public string IsFormalized { get; set; } = "No"; // Sí/No/Parcial

        // Estado Actual
        public string CurrentAutonomyLevel { get; set; } = "L0"; // L0-L5
        public string Criticality { get; set; } = "Media"; // Baja/Media/Alta/Crítica

        /// <summary>Sistema origen de los datos del proceso (ej. dónde vive la
        /// orden de compra u otro documento fuente): SAP, Oracle, Dynamics 365,
        /// etc., o "Sistema propio" si es un desarrollo interno de la empresa.</summary>
        public string? DataSourceSystem { get; set; }

        /// <summary>Texto libre cuando DataSourceSystem == "Otro".</summary>
        public string? DataSourceSystemOther { get; set; }

        // Hallazgos
        public string? MainProblems { get; set; }
        public string? MainOpportunities { get; set; }
        public string? Observations { get; set; }

        public string Status { get; set; } = "Borrador"; // Borrador/Completo/Validado/Archivado

        public BusinessProcess() : base() { }

        public static BusinessProcess Create(Guid engagementId, Guid capabilityId, string name)
        {
            return new BusinessProcess
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                CapabilityId = capabilityId,
                Name = name,
                Status = "Borrador",
                CreatedAt = DateTime.UtcNow
            };
        }
    }

    /// <summary>
    /// A source document (typically a PDF describing a process in detail)
    /// uploaded for a <see cref="BusinessProcess"/>, so an AI agent can read
    /// the full text and extract an executive summary, mentioned
    /// people/departments and candidate decision points in a single pass —
    /// instead of relying only on the short Description/MainProblems fields.
    /// The raw file itself lives in Data Lake/Blob Storage (see
    /// <see cref="BlobPath"/>); only its extracted text and derived
    /// metadata are kept here.
    /// </summary>
    public class ProcessDocument : AggregateRoot
    {
        /// <summary>Proceso al que pertenece este documento (FK lógica a BusinessProcess).</summary>
        public Guid ProcessId { get; set; }

        public string FileName { get; set; } = string.Empty;

        /// <summary>Path of the raw file within its Data Lake/Blob Storage
        /// container (container name = EngagementId). Null if storage
        /// wasn't configured at upload time.</summary>
        public string? BlobPath { get; set; }

        public int PageCount { get; set; }

        /// <summary>Full plain text extracted from the PDF via PdfPig.</summary>
        public string? ExtractedText { get; set; }

        /// <summary>Agent-generated executive summary of the document.</summary>
        public string? ExecutiveSummary { get; set; }

        /// <summary>Agent-extracted entities (people/departments mentioned),
        /// serialized as JSON — see AETP.Modules.ClientEngagement.Api.Agents
        /// .ProcessDocumentExtractionResult.Entities.</summary>
        public string? EntitiesJson { get; set; }

        /// <summary>Subido, Procesado or Error.</summary>
        public string ExtractionStatus { get; set; } = "Subido";

        public string? ExtractionError { get; set; }

        /// <summary>De dónde vino este documento: subido por el cliente/asesor,
        /// o generado por IA a partir del levantamiento as-is cuando no
        /// existía un proceso escrito previo. Default Cliente (comportamiento
        /// histórico antes de esta feature).</summary>
        public ProcessDocumentSource Source { get; set; } = ProcessDocumentSource.Cliente;

        public ProcessDocument() : base() { }

        public static ProcessDocument Create(Guid engagementId, Guid processId, string fileName)
        {
            return new ProcessDocument
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                ProcessId = processId,
                FileName = fileName,
                ExtractionStatus = "Subido",
                Source = ProcessDocumentSource.Cliente,
                CreatedAt = DateTime.UtcNow
            };
        }
    }

    /// <summary>
    /// The "Agent-Readiness" assessment produced by
    /// AETP.Modules.ClientEngagement.Api.Agents.AgentReadinessExtractionAgent
    /// from a full process document (PDF) — a much richer, whole-process
    /// analysis than <see cref="ProcessDocument"/> (which only covers
    /// summary/entities/decisions): process model, ontology, business
    /// rules, roles/handoffs, data + AI governance, agent design and the
    /// 8-dimension assessment instrument with its gap engine.
    ///
    /// The full result is kept as a single JSON blob (<see cref="ResultJson"/>)
    /// since its shape is large and already fully defined by the agent's
    /// own structured-output contract — there is no need to normalize it
    /// into relational columns for this feature.
    /// </summary>
    public class AgentReadinessAssessment : AggregateRoot
    {
        /// <summary>Proceso al que pertenece esta evaluación (FK lógica a BusinessProcess).</summary>
        public Guid ProcessId { get; set; }

        public string FileName { get; set; } = string.Empty;

        /// <summary>Path of the raw file within its Data Lake/Blob Storage
        /// container (container name = EngagementId). Null if storage
        /// wasn't configured at upload time.</summary>
        public string? BlobPath { get; set; }

        public int PageCount { get; set; }

        /// <summary>Full agent result, serialized as JSON — see
        /// AETP.Modules.ClientEngagement.Api.Agents.AgentReadinessResult.</summary>
        public string? ResultJson { get; set; }

        /// <summary>Subido, Procesando, Completado or Error.</summary>
        public string Status { get; set; } = "Subido";

        public string? ErrorMessage { get; set; }

        public AgentReadinessAssessment() : base() { }

        public static AgentReadinessAssessment Create(Guid engagementId, Guid processId, string fileName)
        {
            return new AgentReadinessAssessment
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                ProcessId = processId,
                FileName = fileName,
                Status = "Subido",
                CreatedAt = DateTime.UtcNow
            };
        }
    }

    /// <summary>
    /// A business domain (e.g. Finance, Supply Chain, Sales) — the top level
    /// of the Process Dependency Graph foundation ("Domain HAS_PROCESS
    /// Process"). One domain groups many <see cref="BusinessProcess"/>
    /// records via <see cref="BusinessProcess.DomainId"/>. A domain is never
    /// transformed all at once (Level 1 - Domain Transformation Loop): the
    /// client selects one process at a time within it, by <see cref="ProcessPriorityLevel"/>.
    /// </summary>
    public class BusinessDomain : AggregateRoot
    {
        public string Name { get; set; } = string.Empty;

        /// <summary>Optional short code (e.g. "FIN", "SCM", "SALES").</summary>
        public string? Code { get; set; }

        public string? Description { get; set; }

        public string Status { get; set; } = "Activo"; // Activo/Inactivo

        public BusinessDomain() : base() { }

        public static BusinessDomain Create(Guid engagementId, string name)
        {
            return new BusinessDomain
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                Name = name,
                Status = "Activo",
                CreatedAt = DateTime.UtcNow
            };
        }
    }

    /// <summary>
    /// An enterprise application / system of record (e.g. SAP S/4HANA,
    /// Salesforce, Workday, ServiceNow) that one or more business processes
    /// use ("Process USES_SYSTEM System"). Represents the enterprise system
    /// itself — not technical infrastructure — per the platform's System
    /// Reuse Principle (Reuse → Integrate → Extend → Replace): these systems
    /// remain the Systems of Record; the platform only stores the
    /// relationship/knowledge that a process depends on them.
    /// </summary>
    public class EnterpriseSystem : AggregateRoot
    {
        public string Name { get; set; } = string.Empty; // e.g. "SAP S/4HANA", "Salesforce"

        /// <summary>e.g. ERP/CRM/HRIS/ITSM/Collaboration.</summary>
        public string? Category { get; set; }

        public string? Description { get; set; }

        public string Status { get; set; } = "Activo"; // Activo/Inactivo

        public EnterpriseSystem() : base() { }

        public static EnterpriseSystem Create(Guid engagementId, string name)
        {
            return new EnterpriseSystem
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                Name = name,
                Status = "Activo",
                CreatedAt = DateTime.UtcNow
            };
        }
    }

    /// <summary>
    /// A directed edge of the Process Dependency Graph: <see cref="SourceProcessId"/>
    /// DEPENDS_ON <see cref="TargetProcessId"/>. Both ends are real FKs to
    /// <see cref="BusinessProcess"/> (same schema/module, unlike the
    /// cross-module logical FKs such as CapabilityId). A process can depend
    /// on a process owned by a different domain — there is no domain
    /// restriction here by design (e.g. Procure-to-Pay depending on
    /// Treasury/Accounts Payable processes in other domains).
    /// </summary>
    public class ProcessDependency : AggregateRoot
    {
        /// <summary>The dependent process (the one that DEPENDS_ON the target).</summary>
        public Guid SourceProcessId { get; set; }

        /// <summary>The process being depended on.</summary>
        public Guid TargetProcessId { get; set; }

        public ProcessDependencyType? DependencyType { get; set; }

        public string? Notes { get; set; }

        public ProcessDependency() : base() { }

        public static ProcessDependency Create(
            Guid engagementId, Guid sourceProcessId, Guid targetProcessId, ProcessDependencyType? dependencyType = null)
        {
            return new ProcessDependency
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                SourceProcessId = sourceProcessId,
                TargetProcessId = targetProcessId,
                DependencyType = dependencyType,
                CreatedAt = DateTime.UtcNow
            };
        }
    }

    /// <summary>
    /// A many-to-many bridge: <see cref="ProcessId"/> USES_SYSTEM <see cref="SystemId"/>.
    /// One process can use several enterprise systems, and one system can
    /// serve several processes.
    /// </summary>
    public class ProcessSystem : AggregateRoot
    {
        public Guid ProcessId { get; set; }

        public Guid SystemId { get; set; }

        /// <summary>Optional free-text usage nature, e.g. "Fuente de datos",
        /// "Ejecución", "Notificación".</summary>
        public string? UsageType { get; set; }

        public ProcessSystem() : base() { }

        public static ProcessSystem Create(Guid engagementId, Guid processId, Guid systemId, string? usageType = null)
        {
            return new ProcessSystem
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                ProcessId = processId,
                SystemId = systemId,
                UsageType = usageType,
                CreatedAt = DateTime.UtcNow
            };
        }
    }

    // =====================================================================
    // Human Capability Foundation (Sprint 2): Process -> Role -> Skill
    // =====================================================================

    /// <summary>Extensible catalog of role categories (e.g. "Finanzas",
    /// "Procurement", "TI"). A table + FK instead of a fixed enum because the
    /// universe of categories varies per client/industry and must be
    /// extensible without a code deployment.</summary>
    public class RoleCategory : AggregateRoot
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Status { get; set; } = "Activo"; // Activo/Inactivo

        public RoleCategory() : base() { }

        public static RoleCategory Create(Guid engagementId, string name)
        {
            return new RoleCategory
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                Name = name,
                Status = "Activo",
                CreatedAt = DateTime.UtcNow
            };
        }
    }

    /// <summary>Extensible catalog of skill categories (e.g. "Técnica",
    /// "Funcional", "IA/Digital"). Same rationale as <see cref="RoleCategory"/>.</summary>
    public class SkillCategory : AggregateRoot
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Status { get; set; } = "Activo"; // Activo/Inactivo

        public SkillCategory() : base() { }

        public static SkillCategory Create(Guid engagementId, string name)
        {
            return new SkillCategory
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                Name = name,
                Status = "Activo",
                CreatedAt = DateTime.UtcNow
            };
        }
    }

    /// <summary>
    /// A job role that performs work within business processes (e.g. "Accounts
    /// Payable Analyst", "Buyer", "Procurement Manager"). Referenced by
    /// <see cref="ProcessRole"/> (PERFORMED_BY) and <see cref="RoleSkill"/>
    /// (HAS_SKILL).
    /// </summary>
    public class Role : AggregateRoot
    {
        public string Name { get; set; } = string.Empty;

        /// <summary>FK real a RoleCategory (mismo schema). Nullable: aún sin clasificar.</summary>
        public Guid? RoleCategoryId { get; set; }

        public string? Description { get; set; }

        public string Status { get; set; } = "Activo"; // Activo/Inactivo

        public Role() : base() { }

        public static Role Create(Guid engagementId, string name)
        {
            return new Role
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                Name = name,
                Status = "Activo",
                CreatedAt = DateTime.UtcNow
            };
        }
    }

    /// <summary>
    /// A competency that a <see cref="Role"/> can possess (via <see cref="RoleSkill"/>)
    /// and/or a <see cref="BusinessProcess"/> can require (via
    /// <see cref="ProcessRequiredSkill"/>) — e.g. "Financial Analysis", "SAP",
    /// "AI Literacy", "Agent Supervision".
    /// </summary>
    public class Skill : AggregateRoot
    {
        public string Name { get; set; } = string.Empty;

        /// <summary>FK real a SkillCategory (mismo schema). Nullable: aún sin clasificar.</summary>
        public Guid? SkillCategoryId { get; set; }

        public string? Description { get; set; }

        public string Status { get; set; } = "Activo"; // Activo/Inactivo

        public Skill() : base() { }

        public static Skill Create(Guid engagementId, string name)
        {
            return new Skill
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                Name = name,
                Status = "Activo",
                CreatedAt = DateTime.UtcNow
            };
        }
    }

    /// <summary>
    /// Bridge: <see cref="ProcessId"/> PERFORMED_BY <see cref="RoleId"/>. Defines
    /// which roles participate in a process and how (RACI-style, via
    /// <see cref="ProcessRoleInvolvementType"/>).
    /// </summary>
    public class ProcessRole : AggregateRoot
    {
        public Guid ProcessId { get; set; }

        public Guid RoleId { get; set; }

        public ProcessRoleInvolvementType? InvolvementType { get; set; }

        public string? Notes { get; set; }

        public ProcessRole() : base() { }

        public static ProcessRole Create(
            Guid engagementId, Guid processId, Guid roleId, ProcessRoleInvolvementType? involvementType = null)
        {
            return new ProcessRole
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                ProcessId = processId,
                RoleId = roleId,
                InvolvementType = involvementType,
                CreatedAt = DateTime.UtcNow
            };
        }
    }

    /// <summary>
    /// Bridge: <see cref="RoleId"/> HAS_SKILL <see cref="SkillId"/>. Defines which
    /// skills a role already possesses today, and at what proficiency.
    /// </summary>
    public class RoleSkill : AggregateRoot
    {
        public Guid RoleId { get; set; }

        public Guid SkillId { get; set; }

        public SkillProficiencyLevel? ProficiencyLevel { get; set; }

        public RoleSkill() : base() { }

        public static RoleSkill Create(
            Guid engagementId, Guid roleId, Guid skillId, SkillProficiencyLevel? proficiencyLevel = null)
        {
            return new RoleSkill
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                RoleId = roleId,
                SkillId = skillId,
                ProficiencyLevel = proficiencyLevel,
                CreatedAt = DateTime.UtcNow
            };
        }
    }

    /// <summary>
    /// Bridge: <see cref="ProcessId"/> REQUIRES_SKILL <see cref="SkillId"/>. Defines
    /// which skills are required for successful execution of a process, at what
    /// proficiency, and how critical the skill is. Comparing this against
    /// <see cref="RoleSkill"/> (via the roles in <see cref="ProcessRole"/>) is
    /// what powers future Skills Gap Analysis.
    /// </summary>
    public class ProcessRequiredSkill : AggregateRoot
    {
        public Guid ProcessId { get; set; }

        public Guid SkillId { get; set; }

        public SkillProficiencyLevel? RequiredProficiencyLevel { get; set; }

        public SkillRequirementCriticality? Criticality { get; set; }

        public ProcessRequiredSkill() : base() { }

        public static ProcessRequiredSkill Create(
            Guid engagementId,
            Guid processId,
            Guid skillId,
            SkillProficiencyLevel? requiredProficiencyLevel = null,
            SkillRequirementCriticality? criticality = null)
        {
            return new ProcessRequiredSkill
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                ProcessId = processId,
                SkillId = skillId,
                RequiredProficiencyLevel = requiredProficiencyLevel,
                Criticality = criticality,
                CreatedAt = DateTime.UtcNow
            };
        }
    }

    /// <summary>
    /// Catalog of process-level operational KPIs (e.g. "Tiempo de Ciclo de
    /// Aprobación", "Tasa de Error de Facturas"). Deliberately distinct from
    /// AETP.Modules.Strategy.Domain.KPI (strategic, tied to an Objective) and
    /// from AETP.Modules.Capability.Domain.CapabilityKpi (ad-hoc, nested in a
    /// BusinessCapability) — this one measures a specific business process.
    /// </summary>
    public class KpiDefinition : AggregateRoot
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Unit { get; set; }
        public string Status { get; set; } = "Activo"; // Activo/Inactivo

        public KpiDefinition() : base() { }

        public static KpiDefinition Create(Guid engagementId, string name)
        {
            return new KpiDefinition
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                Name = name,
                Status = "Activo",
                CreatedAt = DateTime.UtcNow
            };
        }
    }

    /// <summary>
    /// Bridge: <see cref="ProcessId"/> HAS_KPI <see cref="KpiDefinitionId"/>.
    /// Baseline/target live on the bridge (not on KpiDefinition) because the
    /// same KPI definition (e.g. "Cycle Time") can have different baseline/
    /// target values per process.
    /// </summary>
    public class ProcessKPI : AggregateRoot
    {
        public Guid ProcessId { get; set; }

        public Guid KpiDefinitionId { get; set; }

        public decimal? BaselineValue { get; set; }
        public decimal? TargetValue { get; set; }

        public ProcessKPI() : base() { }

        public static ProcessKPI Create(Guid engagementId, Guid processId, Guid kpiDefinitionId)
        {
            return new ProcessKPI
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                ProcessId = processId,
                KpiDefinitionId = kpiDefinitionId,
                CreatedAt = DateTime.UtcNow
            };
        }
    }

    /// <summary>
    /// Catalog of structured, reusable business rules (e.g. "Aprobación de
    /// Órdenes de Compra > $10,000"). Distinct from
    /// AETP.Modules.Decision.Domain.BusinessDecision.RulesDescription (free
    /// text, per-decision) — this is a shared, queryable rule that can apply
    /// to multiple processes.
    /// </summary>
    public class BusinessRule : AggregateRoot
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public BusinessRuleType? RuleType { get; set; }
        public BusinessRuleSource? Source { get; set; }
        public string Status { get; set; } = "Activo"; // Activo/Inactivo

        public BusinessRule() : base() { }

        public static BusinessRule Create(Guid engagementId, string name)
        {
            return new BusinessRule
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                Name = name,
                Status = "Activo",
                CreatedAt = DateTime.UtcNow
            };
        }
    }

    /// <summary>
    /// Bridge: <see cref="ProcessId"/> GOVERNED_BY <see cref="BusinessRuleId"/>.
    /// </summary>
    public class ProcessBusinessRule : AggregateRoot
    {
        public Guid ProcessId { get; set; }

        public Guid BusinessRuleId { get; set; }

        public string? ApplicationNotes { get; set; }

        public ProcessBusinessRule() : base() { }

        public static ProcessBusinessRule Create(Guid engagementId, Guid processId, Guid businessRuleId)
        {
            return new ProcessBusinessRule
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                ProcessId = processId,
                BusinessRuleId = businessRuleId,
                CreatedAt = DateTime.UtcNow
            };
        }
    }

    // ===== Human-Agent Operating Model Foundation (Sprint 3): As-Is Discovery =====
    // Captura el "trabajo real" dentro de un BusinessProcess: paso a paso, quién
    // lo hace, decisión/aprobación, tiempos reales, bloqueos, comunicaciones
    // (email/WhatsApp/Slack/Teams/sistema) con ejemplos reales, y dependencias
    // entre pasos. Diseñado para ser capturado por un asesor en campo con el
    // cliente (UI de entrevista/observación), y para eventualmente normalizar
    // los resultados de extracción por IA (ver ProcessStep DTO en
    // AgentReadinessExtractionAgent.cs) hacia este mismo modelo persistido.

    /// <summary>
    /// Un paso concreto dentro de un <see cref="BusinessProcess"/>, capturado
    /// durante el levantamiento "as-is": quién lo ejecuta hoy, si implica una
    /// decisión/aprobación, tiempos estimados vs. reales, bloqueos, y el gap
    /// entre lo documentado (SOP) y lo que realmente ocurre.
    /// </summary>
    public class ProcessActivity : AggregateRoot
    {
        /// <summary>Proceso al que pertenece este paso (FK real, mismo módulo/schema).</summary>
        public Guid ProcessId { get; set; }

        /// <summary>Orden del paso dentro del proceso.</summary>
        public int SequenceOrder { get; set; }

        public string Name { get; set; } = string.Empty;

        /// <summary>Quién ejecuta este paso hoy (FK real a Role). Nullable: aún no asignado.</summary>
        public Guid? PerformedByRoleId { get; set; }

        /// <summary>Qué se decide en este paso, si aplica (texto libre: las
        /// decisiones varían demasiado para clasificar con un enum).</summary>
        public string? DecisionDescription { get; set; }

        /// <summary>¿Este paso es un decision gate que requiere aprobación formal?</summary>
        public bool RequiresApproval { get; set; }

        /// <summary>Quién autoriza/aprueba este paso (FK real a Role). Solo aplica
        /// cuando <see cref="RequiresApproval"/> es true.</summary>
        public Guid? ApprovedByRoleId { get; set; }

        /// <summary>Duración esperada según el proceso documentado (SOP), en minutos.</summary>
        public int? EstimatedDurationMinutes { get; set; }

        /// <summary>Duración real observada, en minutos.</summary>
        public int? ActualDurationMinutes { get; set; }

        /// <summary>Tiempo muerto/espera (bloqueo) dentro de este paso, en minutos.</summary>
        public int? WaitTimeMinutes { get; set; }

        /// <summary>Día/hora real en que comenzó el paso (evidencia observada).</summary>
        public DateTime? StartedAt { get; set; }

        /// <summary>Día/hora real en que terminó el paso (evidencia observada).</summary>
        public DateTime? CompletedAt { get; set; }

        /// <summary>Qué bloqueos concretos hubo en este paso (texto libre).</summary>
        public string? BlockerNotes { get; set; }

        /// <summary>Cómo dice el proceso escrito/SOP que se hace este paso.</summary>
        public string? DocumentedWay { get; set; }

        /// <summary>Cómo se hace este paso en la realidad (según entrevista/observación).</summary>
        public string? RealWay { get; set; }

        /// <summary>Diferencia/gap entre <see cref="DocumentedWay"/> y <see cref="RealWay"/>.</summary>
        public string? GapNotes { get; set; }

        public ProcessActivity() : base() { }

        public static ProcessActivity Create(Guid engagementId, Guid processId, int sequenceOrder, string name)
        {
            return new ProcessActivity
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                ProcessId = processId,
                SequenceOrder = sequenceOrder,
                Name = name,
                RequiresApproval = false,
                CreatedAt = DateTime.UtcNow
            };
        }
    }

    /// <summary>
    /// Una comunicación/interacción concreta dentro de un <see cref="ProcessActivity"/>
    /// (0..N por paso): canal usado, de quién a quién, contenido real de ejemplo, y
    /// tiempo de respuesta (tiempos y movimientos).
    /// </summary>
    public class ActivityInteraction : AggregateRoot
    {
        /// <summary>Paso al que pertenece esta interacción (FK real, mismo módulo/schema).</summary>
        public Guid ActivityId { get; set; }

        /// <summary>Orden de la interacción dentro del paso (si hay varias).</summary>
        public int SequenceOrder { get; set; }

        public InteractionChannel Channel { get; set; }

        /// <summary>Sistema empresarial usado (FK real a EnterpriseSystem). Solo
        /// aplica cuando <see cref="Channel"/> es EnterpriseSystem (ej. SAP).</summary>
        public Guid? SystemUsedId { get; set; }

        /// <summary>Quién envía/inicia la interacción (FK real a Role).</summary>
        public Guid? FromRoleId { get; set; }

        /// <summary>A quién se dirige la interacción (FK real a Role).</summary>
        public Guid? ToRoleId { get; set; }

        /// <summary>Ejemplo real de contenido (ej. el email/mensaje real enviado).</summary>
        public string? ContentExample { get; set; }

        /// <summary>Cuánto tardó en responder, en minutos (tiempos y movimientos).</summary>
        public int? ResponseTimeMinutes { get; set; }

        public ActivityInteraction() : base() { }

        public static ActivityInteraction Create(Guid engagementId, Guid activityId, int sequenceOrder, InteractionChannel channel)
        {
            return new ActivityInteraction
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                ActivityId = activityId,
                SequenceOrder = sequenceOrder,
                Channel = channel,
                CreatedAt = DateTime.UtcNow
            };
        }
    }

    /// <summary>
    /// Bridge: <see cref="ActivityId"/> DEPENDS_ON <see cref="DependsOnActivityId"/>
    /// (mirror de <see cref="ProcessDependency"/> pero a nivel de paso). Captura
    /// bloqueos y dependencias explícitas entre pasos, incluyendo pasos nuevos
    /// que se suman durante el levantamiento.
    /// </summary>
    public class ActivityDependency : AggregateRoot
    {
        /// <summary>Paso dependiente (FK real a ProcessActivity).</summary>
        public Guid ActivityId { get; set; }

        /// <summary>Paso del cual depende (FK real a ProcessActivity).</summary>
        public Guid DependsOnActivityId { get; set; }

        public ProcessDependencyType? DependencyType { get; set; }

        /// <summary>Contexto del bloqueo/dependencia (ej. "espera aprobación de gerencia").</summary>
        public string? Notes { get; set; }

        public ActivityDependency() : base() { }

        public static ActivityDependency Create(Guid engagementId, Guid activityId, Guid dependsOnActivityId)
        {
            return new ActivityDependency
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                ActivityId = activityId,
                DependsOnActivityId = dependsOnActivityId,
                CreatedAt = DateTime.UtcNow
            };
        }
    }

    /// <summary>
    /// Un hallazgo estructurado del Gap Analysis (real vs. documentado) para un
    /// <see cref="ProcessActivity"/> puntual. Generado por un futuro Agente de
    /// IA que compara el levantamiento as-is contra el proceso escrito
    /// (<see cref="ProcessDocument"/>), o capturado manualmente por un asesor.
    /// Estructurado (no texto libre) para que el reengineering posterior pueda
    /// consultar/priorizar por categoría y severidad.
    /// </summary>
    public class ProcessGapFinding : AggregateRoot
    {
        /// <summary>Paso donde se detectó la brecha (FK real a ProcessActivity).</summary>
        public Guid ActivityId { get; set; }

        public GapCategory GapCategory { get; set; }

        public GapSeverity Severity { get; set; }

        /// <summary>El hallazgo en sí (generado por la IA o el asesor).</summary>
        public string Description { get; set; } = string.Empty;

        public GapIdentifiedBy IdentifiedBy { get; set; }

        /// <summary>Sugerencia de acción correctiva/reengineering (opcional).</summary>
        public string? RecommendedAction { get; set; }

        public ProcessGapFinding() : base() { }

        public static ProcessGapFinding Create(Guid engagementId, Guid activityId, GapCategory gapCategory, GapSeverity severity, string description, GapIdentifiedBy identifiedBy)
        {
            return new ProcessGapFinding
            {
                Id = Guid.NewGuid(),
                EngagementId = engagementId,
                ActivityId = activityId,
                GapCategory = gapCategory,
                Severity = severity,
                Description = description,
                IdentifiedBy = identifiedBy,
                CreatedAt = DateTime.UtcNow
            };
        }
    }
}
