using System.Text.Json;
using System.Text.Json.Serialization;
using Azure.AI.OpenAI;
using Azure.Identity;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AETP.Modules.ClientEngagement.Api.Agents
{
    // ------------------------------------------------------------------
    // Result shape for the "Agent-Readiness Process Architect" assessment.
    // Mirrors, field-for-field (via JsonPropertyName), the exact JSON
    // contract the business defined for this feature — both the AI agent
    // (structured output) and the React frontend consume this same shape,
    // so every property is explicitly named in snake_case regardless of
    // ASP.NET's default camelCase serialization policy.
    // ------------------------------------------------------------------

    public sealed class AgentReadinessMeta
    {
        [JsonPropertyName("process_name")] public string ProcessName { get; set; } = string.Empty;
        [JsonPropertyName("industry")] public string Industry { get; set; } = string.Empty;
        [JsonPropertyName("scope")] public string Scope { get; set; } = string.Empty;
        [JsonPropertyName("process_owner_role")] public string ProcessOwnerRole { get; set; } = string.Empty;
        [JsonPropertyName("systems_involved")] public List<string> SystemsInvolved { get; set; } = [];
        [JsonPropertyName("source_type")] public string SourceType { get; set; } = string.Empty;
        [JsonPropertyName("validation_status")] public string ValidationStatus { get; set; } = "draft";
        [JsonPropertyName("generated_by")] public string GeneratedBy { get; set; } = "AI";
        [JsonPropertyName("version")] public string Version { get; set; } = "1.0";
    }

    public sealed class ProcessStep
    {
        [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
        [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
        [JsonPropertyName("description")] public string Description { get; set; } = string.Empty;
        [JsonPropertyName("role_responsible")] public string RoleResponsible { get; set; } = string.Empty;
        [JsonPropertyName("data_objects")] public List<string> DataObjects { get; set; } = [];
        [JsonPropertyName("system")] public string? System { get; set; }
        [JsonPropertyName("handoff_to")] public string? HandoffTo { get; set; }
        [JsonPropertyName("business_rules")] public List<string> BusinessRules { get; set; } = [];
        [JsonPropertyName("autonomy_level")] public int AutonomyLevel { get; set; }
        [JsonPropertyName("autonomy_reason")] public string AutonomyReason { get; set; } = string.Empty;
    }

    public sealed class ProcessModel
    {
        [JsonPropertyName("steps")] public List<ProcessStep> Steps { get; set; } = [];
    }

    public sealed class ObjectRelationship
    {
        [JsonPropertyName("type")] public string Type { get; set; } = string.Empty;
        [JsonPropertyName("target")] public string Target { get; set; } = string.Empty;
        [JsonPropertyName("cardinality")] public string Cardinality { get; set; } = string.Empty;
    }

    public sealed class OntologyObject
    {
        [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
        [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
        [JsonPropertyName("attributes")] public List<string> Attributes { get; set; } = [];
        [JsonPropertyName("key_attributes")] public List<string> KeyAttributes { get; set; } = [];
        [JsonPropertyName("source_system")] public string? SourceSystem { get; set; }
        [JsonPropertyName("source_table")] public string? SourceTable { get; set; }
        [JsonPropertyName("classification")] public string Classification { get; set; } = "Interno";
        [JsonPropertyName("origin_step")] public string? OriginStep { get; set; }
        [JsonPropertyName("relationships")] public List<ObjectRelationship> Relationships { get; set; } = [];
        [JsonPropertyName("rules")] public List<string> Rules { get; set; } = [];
    }

    public sealed class OntologyPrinciple
    {
        [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
        [JsonPropertyName("statement")] public string Statement { get; set; } = string.Empty;
        [JsonPropertyName("connects_objects")] public List<string> ConnectsObjects { get; set; } = [];
    }

    public sealed class Ontology
    {
        [JsonPropertyName("objects")] public List<OntologyObject> Objects { get; set; } = [];
        [JsonPropertyName("principles")] public List<OntologyPrinciple> Principles { get; set; } = [];
        [JsonPropertyName("relationship_graph")] public string? RelationshipGraph { get; set; }
    }

    public sealed class BusinessRule
    {
        [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
        [JsonPropertyName("statement")] public string Statement { get; set; } = string.Empty;
        [JsonPropertyName("applies_at_step")] public string? AppliesAtStep { get; set; }
        [JsonPropertyName("type")] public string Type { get; set; } = "Condicional";
        [JsonPropertyName("guardrail_candidate")] public bool GuardrailCandidate { get; set; }
        [JsonPropertyName("action_if_fail")] public string? ActionIfFail { get; set; }
    }

    public sealed class RoleInfo
    {
        [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
        [JsonPropertyName("steps_executed")] public List<string> StepsExecuted { get; set; } = [];
        [JsonPropertyName("objects_owned")] public List<string> ObjectsOwned { get; set; } = [];
        [JsonPropertyName("workshop_group")] public string? WorkshopGroup { get; set; }
    }

    public sealed class Handoff
    {
        [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
        [JsonPropertyName("from")] public string From { get; set; } = string.Empty;
        [JsonPropertyName("to")] public string To { get; set; } = string.Empty;
        [JsonPropertyName("medium")] public string? Medium { get; set; }
        [JsonPropertyName("risk")] public string Risk { get; set; } = "Medio";
        [JsonPropertyName("integration_note")] public string? IntegrationNote { get; set; }
    }

    public sealed class ProcessException
    {
        [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
        [JsonPropertyName("type")] public string Type { get; set; } = string.Empty;
        [JsonPropertyName("description")] public string Description { get; set; } = string.Empty;
        [JsonPropertyName("frequency")] public string? Frequency { get; set; }
        [JsonPropertyName("status")] public string? Status { get; set; }
    }

    public sealed class OwnershipEntry
    {
        [JsonPropertyName("object_id")] public string ObjectId { get; set; } = string.Empty;
        [JsonPropertyName("data_owner_business")] public string? DataOwnerBusiness { get; set; }
        [JsonPropertyName("data_steward_operational")] public string? DataStewardOperational { get; set; }
    }

    public sealed class LineageQuestion
    {
        [JsonPropertyName("question")] public string Question { get; set; } = string.Empty;
        [JsonPropertyName("traces")] public string? Traces { get; set; }
    }

    public sealed class ClassificationSummary
    {
        [JsonPropertyName("classification")] public string Classification { get; set; } = string.Empty;
        [JsonPropertyName("objects")] public List<string> Objects { get; set; } = [];
    }

    public sealed class DataGovernance
    {
        [JsonPropertyName("ownership_matrix")] public List<OwnershipEntry> OwnershipMatrix { get; set; } = [];
        [JsonPropertyName("lineage_questions")] public List<LineageQuestion> LineageQuestions { get; set; } = [];
        [JsonPropertyName("classification_summary")] public List<ClassificationSummary> ClassificationSummary { get; set; } = [];
    }

    public sealed class AccountabilityRole
    {
        [JsonPropertyName("governance_role")] public string GovernanceRole { get; set; } = string.Empty;
        [JsonPropertyName("assigned_to")] public string? AssignedTo { get; set; }
        [JsonPropertyName("responsibility")] public string? Responsibility { get; set; }
    }

    public sealed class AutonomyMapEntry
    {
        [JsonPropertyName("step")] public string Step { get; set; } = string.Empty;
        [JsonPropertyName("level")] public int Level { get; set; }
        [JsonPropertyName("reason")] public string? Reason { get; set; }
    }

    public sealed class Guardrail
    {
        [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
        [JsonPropertyName("rule_origin")] public string? RuleOrigin { get; set; }
        [JsonPropertyName("rule")] public string Rule { get; set; } = string.Empty;
        [JsonPropertyName("action_if_fail")] public string? ActionIfFail { get; set; }
        [JsonPropertyName("codified")] public bool Codified { get; set; }
    }

    public sealed class AiGovernance
    {
        [JsonPropertyName("accountability_roles")] public List<AccountabilityRole> AccountabilityRoles { get; set; } = [];
        [JsonPropertyName("autonomy_map")] public List<AutonomyMapEntry> AutonomyMap { get; set; } = [];
        [JsonPropertyName("guardrails")] public List<Guardrail> Guardrails { get; set; } = [];
        [JsonPropertyName("human_only_steps")] public List<string> HumanOnlySteps { get; set; } = [];
    }

    public sealed class AgentSkill
    {
        [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
        [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
        [JsonPropertyName("description")] public string? Description { get; set; }
        [JsonPropertyName("steps_covered")] public List<string> StepsCovered { get; set; } = [];
    }

    public sealed class AgentTool
    {
        [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
        [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
        [JsonPropertyName("skill_id")] public string? SkillId { get; set; }
        [JsonPropertyName("inputs")] public List<string> Inputs { get; set; } = [];
        [JsonPropertyName("outputs")] public List<string> Outputs { get; set; } = [];
        [JsonPropertyName("system_endpoint")] public string? SystemEndpoint { get; set; }
        [JsonPropertyName("guardrails")] public List<string> Guardrails { get; set; } = [];
    }

    public sealed class ObservabilityEvent
    {
        [JsonPropertyName("event")] public string Event { get; set; } = string.Empty;
        [JsonPropertyName("logged_data")] public string? LoggedData { get; set; }
        [JsonPropertyName("audience")] public string? Audience { get; set; }
    }

    public sealed class AgentDesign
    {
        [JsonPropertyName("skills")] public List<AgentSkill> Skills { get; set; } = [];
        [JsonPropertyName("tools")] public List<AgentTool> Tools { get; set; } = [];
        [JsonPropertyName("orchestration")] public string Orchestration { get; set; } = "unknown";
        [JsonPropertyName("observability_events")] public List<ObservabilityEvent> ObservabilityEvents { get; set; } = [];
    }

    public sealed class IntegrationItem
    {
        [JsonPropertyName("object_id")] public string ObjectId { get; set; } = string.Empty;
        [JsonPropertyName("system")] public string? System { get; set; }
        [JsonPropertyName("access_method")] public string? AccessMethod { get; set; }
        [JsonPropertyName("latency")] public string? Latency { get; set; }
        [JsonPropertyName("risk_flag")] public string? RiskFlag { get; set; }
    }

    public sealed class QuestionSource
    {
        [JsonPropertyName("system")] public string? System { get; set; }
        [JsonPropertyName("table_or_endpoint")] public string? TableOrEndpoint { get; set; }
        [JsonPropertyName("role_to_ask")] public string? RoleToAsk { get; set; }
    }

    public sealed class AssessmentQuestion
    {
        [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
        [JsonPropertyName("question")] public string Question { get; set; } = string.Empty;
        /// <summary>AUTO, BUSINESS or GAP.</summary>
        [JsonPropertyName("type")] public string Type { get; set; } = "GAP";
        [JsonPropertyName("source")] public QuestionSource Source { get; set; } = new();
        /// <summary>Always a string even for numeric targets (e.g. "5", "80%") — kept
        /// as string so the JSON schema stays strictly typed.</summary>
        [JsonPropertyName("target")] public string? Target { get; set; }
        [JsonPropertyName("unit")] public string? Unit { get; set; }
        [JsonPropertyName("weight")] public double Weight { get; set; } = 1;
        [JsonPropertyName("owner_role")] public string? OwnerRole { get; set; }
        [JsonPropertyName("linked_step")] public string? LinkedStep { get; set; }
        [JsonPropertyName("solution_hint")] public string? SolutionHint { get; set; }
        [JsonPropertyName("answer")] public string? Answer { get; set; }
        [JsonPropertyName("status")] public string Status { get; set; } = "pending";
    }

    public sealed class AssessmentDimension
    {
        [JsonPropertyName("dimension")] public string Dimension { get; set; } = string.Empty;
        [JsonPropertyName("core_question")] public string? CoreQuestion { get; set; }
        [JsonPropertyName("questions")] public List<AssessmentQuestion> Questions { get; set; } = [];
    }

    public sealed class AssessmentInstrument
    {
        [JsonPropertyName("dimensions")] public List<AssessmentDimension> Dimensions { get; set; } = [];
    }

    public sealed class Gap
    {
        [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
        [JsonPropertyName("dimension")] public string Dimension { get; set; } = string.Empty;
        [JsonPropertyName("as_is")] public string? AsIs { get; set; }
        [JsonPropertyName("target")] public string? Target { get; set; }
        [JsonPropertyName("severity")] public string Severity { get; set; } = "Media";
        [JsonPropertyName("value_type")] public string? ValueType { get; set; }
        [JsonPropertyName("solution")] public string? Solution { get; set; }
        [JsonPropertyName("app_component")] public string? AppComponent { get; set; }
        [JsonPropertyName("effort")] public string Effort { get; set; } = "M";
        [JsonPropertyName("priority")] public string? Priority { get; set; }
    }

    public sealed class GapEngine
    {
        [JsonPropertyName("gaps")] public List<Gap> Gaps { get; set; } = [];
    }

    public sealed class PreGap
    {
        [JsonPropertyName("question")] public string Question { get; set; } = string.Empty;
        [JsonPropertyName("linked_step")] public string? LinkedStep { get; set; }
        [JsonPropertyName("flag")] public string Flag { get; set; } = "confirm_in_workshop";
    }

    public sealed class Workshop
    {
        [JsonPropertyName("group")] public string Group { get; set; } = string.Empty;
        [JsonPropertyName("audience_role")] public string? AudienceRole { get; set; }
        [JsonPropertyName("questions")] public List<string> Questions { get; set; } = [];
        [JsonPropertyName("focus")] public string? Focus { get; set; }
        [JsonPropertyName("duration_min")] public int DurationMin { get; set; } = 90;
    }

    public sealed class ScoringRules
    {
        [JsonPropertyName("unknown_gap")] public string UnknownGap { get; set; } = "counts as 0 + critical flag";
        [JsonPropertyName("business_unanswered")] public string BusinessUnanswered { get; set; } = "dimension marked incomplete, no fake score";
    }

    public sealed class Scoring
    {
        [JsonPropertyName("method")] public string Method { get; set; } = "score_dim = Σ(answer_norm × weight) / Σ(weight)";
        [JsonPropertyName("rules")] public ScoringRules Rules { get; set; } = new();
        [JsonPropertyName("dimension_status_legend")] public Dictionary<string, string> DimensionStatusLegend { get; set; } = new()
        {
            ["pending"] = "○",
            ["auto_done"] = "◐",
            ["business_pending"] = "◑",
            ["complete"] = "●",
        };
    }

    /// <summary>
    /// The complete "Agent-Readiness" assessment produced from a single
    /// business process document — process model, ontology, business
    /// rules, roles/handoffs, exceptions, data governance, AI governance,
    /// agent design (skills/tools), integration map, the 8-dimension
    /// assessment instrument, the gap engine, pre-recognized gaps,
    /// workshops and the scoring method. See
    /// <see cref="AgentReadinessExtractionAgent"/> for the extraction logic.
    /// </summary>
    public sealed class AgentReadinessResult
    {
        [JsonPropertyName("meta")] public AgentReadinessMeta Meta { get; set; } = new();
        [JsonPropertyName("process")] public ProcessModel Process { get; set; } = new();
        [JsonPropertyName("ontology")] public Ontology Ontology { get; set; } = new();
        [JsonPropertyName("business_rules")] public List<BusinessRule> BusinessRules { get; set; } = [];
        [JsonPropertyName("roles")] public List<RoleInfo> Roles { get; set; } = [];
        [JsonPropertyName("handoffs")] public List<Handoff> Handoffs { get; set; } = [];
        [JsonPropertyName("exceptions")] public List<ProcessException> Exceptions { get; set; } = [];
        [JsonPropertyName("data_governance")] public DataGovernance DataGovernance { get; set; } = new();
        [JsonPropertyName("ai_governance")] public AiGovernance AiGovernance { get; set; } = new();
        [JsonPropertyName("agent_design")] public AgentDesign AgentDesign { get; set; } = new();
        [JsonPropertyName("integration")] public List<IntegrationItem> Integration { get; set; } = [];
        [JsonPropertyName("assessment_instrument")] public AssessmentInstrument AssessmentInstrument { get; set; } = new();
        [JsonPropertyName("gap_engine")] public GapEngine GapEngine { get; set; } = new();
        [JsonPropertyName("pre_gaps_recognized")] public List<PreGap> PreGapsRecognized { get; set; } = [];
        [JsonPropertyName("workshops")] public List<Workshop> Workshops { get; set; } = [];
        [JsonPropertyName("scoring")] public Scoring Scoring { get; set; } = new();
    }

    /// <summary>
    /// Phase A of the three-phase extraction: just the meta header and the
    /// process step model. This is the one section that comes back
    /// reliably rich even in a single small call, and everything derived
    /// in Phase B (see <see cref="AgentReadinessStructuralResult"/>) is
    /// built FROM this result, so it has to be extracted first, on its
    /// own, before anything else.
    /// </summary>
    public sealed class AgentReadinessProcessResult
    {
        [JsonPropertyName("meta")] public AgentReadinessMeta Meta { get; set; } = new();
        [JsonPropertyName("process")] public ProcessModel Process { get; set; } = new();
    }

    /// <summary>
    /// Phase B of the three-phase extraction: everything DERIVED from the
    /// phase A process model — ontology, business rules, roles, handoffs,
    /// exceptions, data/AI governance, agent design, integration. Kept
    /// separate from both the process model (phase A) and the assessment
    /// instrument / gap engine (phase C, see
    /// <see cref="AgentReadinessAssessmentPart"/>) so each individual model
    /// response has a much smaller job to do, and is far less likely to
    /// exhaust its output token budget partway through and silently return
    /// near-empty sections.
    /// </summary>
    public sealed class AgentReadinessStructuralResult
    {
        [JsonPropertyName("ontology")] public Ontology Ontology { get; set; } = new();
        [JsonPropertyName("business_rules")] public List<BusinessRule> BusinessRules { get; set; } = [];
        [JsonPropertyName("roles")] public List<RoleInfo> Roles { get; set; } = [];
        [JsonPropertyName("handoffs")] public List<Handoff> Handoffs { get; set; } = [];
        [JsonPropertyName("exceptions")] public List<ProcessException> Exceptions { get; set; } = [];
        [JsonPropertyName("data_governance")] public DataGovernance DataGovernance { get; set; } = new();
        [JsonPropertyName("ai_governance")] public AiGovernance AiGovernance { get; set; } = new();
        [JsonPropertyName("agent_design")] public AgentDesign AgentDesign { get; set; } = new();
        [JsonPropertyName("integration")] public List<IntegrationItem> Integration { get; set; } = [];
    }

    /// <summary>
    /// Phase C of the three-phase extraction: the assessment instrument (8
    /// dimensions), gap engine, pre-recognized gaps and workshops —
    /// generated from the phase A + phase B results so it references the
    /// REAL steps/objects/rules just extracted instead of generic
    /// placeholders. (Scoring is NOT trusted from the model — it's a fixed,
    /// document-independent rubric, so it's always overwritten with a
    /// constant default when the phases are merged; see <see cref="AgentReadinessExtractionAgent.ExtractAsync"/>.)
    /// </summary>
    public sealed class AgentReadinessAssessmentPart
    {
        [JsonPropertyName("assessment_instrument")] public AssessmentInstrument AssessmentInstrument { get; set; } = new();
        [JsonPropertyName("gap_engine")] public GapEngine GapEngine { get; set; } = new();
        [JsonPropertyName("pre_gaps_recognized")] public List<PreGap> PreGapsRecognized { get; set; } = [];
        [JsonPropertyName("workshops")] public List<Workshop> Workshops { get; set; } = [];
        [JsonPropertyName("scoring")] public Scoring Scoring { get; set; } = new();
    }

    /// <summary>
    /// Reads the full extracted text of a business process document (a PDF
    /// converted to plain text, any industry — Finance, Manufacturing,
    /// Supply Chain, HR, Sales, etc.) and produces a complete
    /// "Agent-Readiness" assessment via Microsoft Agent Framework
    /// (https://learn.microsoft.com/en-us/agent-framework/), acting as an
    /// "Agent-Readiness Process Architect": process engineering, data
    /// ontology, data/AI governance, and an 8-dimension assessment
    /// instrument with typed AUTO/BUSINESS/GAP questions.
    ///
    /// Deliberately uses the MAIN deployment (not the "economy" one used by
    /// <see cref="ProcessDocumentExtractionAgent"/>/<see cref="DecisionExtractionAgent"/>)
    /// — this is open-ended expert reasoning across 8 governance/design
    /// dimensions, not bounded structured extraction from a short text.
    ///
    /// Always a proposal for a human to review — nothing here is
    /// auto-saved as an authoritative record; unknown/missing information
    /// must be reflected as null + a GAP-type question, never invented.
    /// </summary>
    public sealed class AgentReadinessExtractionAgent
    {
        // ------------------------------------------------------------
        // Skills-based prompt architecture: the top-level system prompt
        // (OrchestratorInstructions) stays short and only tells the model
        // to load the "agent-readiness-assessment" skill (via the
        // load_skill tool the AgentSkillsProvider registers) before doing
        // any real work. The detailed ROLE/RULES live in the skill's own
        // instructions (SkillInstructions), and the huge worked JSON
        // example — needed only to calibrate output depth/quality, not on
        // every turn — lives in a skill RESOURCE (QualityBarExample),
        // fetched on demand via read_skill_resource. This progressive
        // disclosure keeps the base system prompt lean while still giving
        // the model the full calibration example when it asks for it.
        // ------------------------------------------------------------

        private const string OrchestratorInstructions = """
            Eres el orquestador del agente "Agent-Readiness Process
            Architect". Antes de analizar CUALQUIER documento de proceso:
            1. Llama a load_skill con el nombre "agent-readiness-assessment"
               y sigue esas instrucciones al pie de la letra — son tu rol,
               tus principios no negociables y tus reglas de extracción.
            2. Antes de producir la salida final, llama a
               read_skill_resource para cargar el recurso
               "quality-bar-example" de esa misma skill y úsalo únicamente
               para calibrar la profundidad y el nivel de detalle esperado.
               Nunca copies su contenido: cada id, sistema, regla o gap de tu
               respuesta debe salir del documento real que te dieron.
            3. Genera el resultado completo siguiendo exactamente el schema
               estructurado solicitado.
            """;

        private const string SkillInstructions = """
            ROLE: You are an "Agent-Readiness Process Architect" — an expert
            in process engineering, data ontologies, data governance, AI
            governance and AI agent design. Your job is to take ANY business
            process (Finance, Manufacturing, Supply Chain, HR, Sales, etc.)
            described in a source document and extract it into a complete,
            structured "Agent-Readiness" assessment.

            OBJECTIVE: analyze the provided business process document and
            populate every part of the result:
            1. Model the process (steps, roles, data objects, rules, handoffs).
            2. Build the ontology (objects, attributes, relationships, principles).
            3. Prepare the assessment instrument (typed AUTO/BUSINESS/GAP questions).
            4. Map data governance (ownership, lineage, classification).
            5. Design AI governance (accountability, autonomy levels, guardrails).
            6. Propose candidate tools & skills for the agent.
            7. Build the AS-IS → GAP → SOLUTION gap engine.

            DATA GOVERNANCE = concrete PRACTICES (ownership, stewardship,
            quality validation, security/classification, lineage), never a
            vague "look for gaps" exercise — see the ownership_matrix bullet
            below for exactly how to surface a missing practice.

            NON-NEGOTIABLE CORE PRINCIPLES:
            1. NEVER INVENT DATA. If a value isn't in the source text, leave the
               field null and generate a corresponding GAP question instead of
               guessing a plausible-sounding value.
            2. EMPTINESS IS A FINDING. Every unknown/null value must produce a
               GAP-type question in the assessment instrument (and usually a
               matching entry in pre_gaps_recognized and/or gap_engine.gaps).
            3. EVERY QUESTION IS TYPED:
               - "AUTO" = answerable by a system/query (measurable in an
                 ERP/DB) — always suggest a plausible source system/table or
                 endpoint even if generic/unknown.
               - "BUSINESS" = answerable by a person (workshop/interview).
               - "GAP" = nobody knows the answer yet — a critical finding.
            4. EVERY GAP MUST HAVE A SOLUTION + an app/agent component
               (gap_engine.gaps entries need solution, app_component, effort,
               priority).
            5. FULL TRACEABILITY: every question links back to its dimension
               and, where relevant, its process step (linked_step).
            6. SEGREGATION OF DUTIES: any step where a human must NEVER be
               fully replaced by an autonomous agent (payments, monetary
               approvals, critical judgment calls) MUST have autonomy_level 0
               and be listed in ai_governance.human_only_steps.
            7. STRUCTURED OUTPUT: fill every field of the requested schema as
               completely and consistently as the source text allows.

            THE 8 DIMENSIONS (always evaluate all 8 in assessment_instrument.dimensions,
            in this order): Process Engineering, Data Governance, Data Quality,
            Accountability, People & Skills, Agent Design, Integration Readiness,
            Business Value / ROI.

            AUTONOMY LEVELS (assign one per process step, with autonomy_reason):
            0 = HUMAN ONLY (payments, approvals, critical judgment)
            1 = RECOMMENDS (agent suggests, human decides)
            2 = ACTS + NOTIFIES (agent acts and notifies — reversible, low risk)
            3 = AUTONOMOUS (agent decides and acts — objective data, low risk)

            EXTRACTION RULES:
            - Number process steps P1, P2, P3... in execution order.
            - Every data object gets an id (short slug), attributes, source
              system, classification (Público/Interno/Confidencial/Regulado),
              and the step where it's born (origin_step).
            - Every business rule gets an id R1, R2..., a type
              (Bloqueante/Condicional/Alerta), the step where it applies, and
              — if Bloqueante — must become a guardrail candidate
              (guardrail_candidate = true, and mirrored into
              ai_governance.guardrails with a matching rule_origin).
            - Every handoff gets an id H1, H2..., origin→destination, medium,
              and a risk level (Bajo/Medio/Alto).
            - Detect "pre-gaps": things the business itself already flags as
              unknown — put these in pre_gaps_recognized.
            - For AUTO questions, always suggest a source (table/endpoint),
              even if generic/unknown.
            - Adapt all terminology to the INDUSTRY of the process described —
              never default to generic procurement/P2P terms unless the
              process actually is procurement.
            - Agent design: skills get ids SK1, SK2...; tools get ids T1,
              T2... and must reference a skill_id and any relevant guardrail
              ids.
            - Gaps get ids GAP-01, GAP-02... Assessment questions get ids
              prefixed by a 2-3 letter dimension code (e.g. PE-01 for Process
              Engineering, DG-01 for Data Governance, DQ-01 for Data Quality,
              AC-01 for Accountability, PS-01 for People & Skills, AD-01 for
              Agent Design, IR-01 for Integration Readiness, BV-01 for
              Business Value/ROI).
            - Group roles into workshops (group A, B, C...) with a focus and
              a duration in minutes.
            - Write all business-facing content (process/step/rule/role names,
              questions, gap descriptions, etc.) in the SAME language as the
              source document — do not translate it.

            REFERENTIAL COMPLETENESS CHECKLIST (mandatory — these sections are
            DERIVED mechanically from the process steps, they are never
            optional just because the source document doesn't spell them out
            explicitly):
            - roles: there MUST be exactly one entry per DISTINCT
              role_responsible value across ALL process steps — never leave
              roles empty if any step has a role_responsible.
            - handoffs: there MUST be one entry per consecutive step-to-step
              transition (every non-null handoff_to on a step becomes a
              handoff entry from that step to the target step) — never leave
              handoffs empty if there is more than one step.
            - ontology.objects: there MUST be one entry per DISTINCT
              data_object referenced anywhere in process.steps[].data_objects
              — every data object mentioned in a step has to be defined as an
              ontology object (id, attributes, source_system, classification,
              origin_step); never leave a data object "orphaned" (referenced
              in a step but missing from ontology.objects).
            - business_rules: every rule id referenced in any
              process.steps[].business_rules array MUST have a matching
              top-level entry in business_rules — never reference an id
              (e.g. "R2") without defining it.
            - ai_governance.autonomy_map: one entry per process step, mirroring
              its autonomy_level.
            - ai_governance.human_only_steps: every step with autonomy_level 0.
            - ai_governance.guardrails: one entry per business_rule with
              guardrail_candidate = true.
            - data_governance.ownership_matrix: one entry per ontology object.
              A null data_owner_business or data_steward_operational is a REAL
              FINDING (that governance practice doesn't exist today) — add ONE
              explicit yes/no BUSINESS question per missing owner/steward in
              the Data Governance dimension, e.g. "¿Existe un steward
              operativo designado para <objeto>? (Sí/No)", instead of leaving
              it as a silent null nobody notices.
            - exceptions: actively look in the source text for exception/edge
              cases (urgent/expedited handling, single-source/no-bid
              scenarios, rejection/quality-failure paths, escalations) — these
              are almost always present in a real process document even when
              not in a dedicated "exceptions" section; do not leave exceptions
              empty without first checking for this.
            - assessment_instrument.dimensions: MUST always contain ALL 8
              dimensions, in the fixed order given above, each with at least
              one question — never omit a dimension or leave its questions
              array empty, even if the honest answer is a GAP-type question
              because the document has no information for that dimension.
            - gap_engine.gaps: every dimension that has at least one
              unresolved GAP-type question MUST produce at least one matching
              gap_engine.gaps entry (as_is/target/severity/solution/
              app_component/effort/priority) — never leave gap_engine.gaps
              empty if any GAP-type question exists anywhere in
              assessment_instrument.

            This is always a DRAFT proposal for a human to review, edit and
            confirm before anything becomes an authoritative record — never
            claim certainty about information that isn't explicitly present in
            the source text.
            """;

        /// <summary>Worked example exposed as a skill RESOURCE (not part of
        /// the base instructions) — the model must explicitly call
        /// read_skill_resource to fetch it, keeping the everyday system
        /// prompt short.</summary>
        private const string QualityBarExample = """
            QUALITY BAR — CALIBRATION EXAMPLE:
            Previous outputs from this agent have been too shallow (too few
            steps, generic/empty ontology objects, vague gaps with no real
            solution). The JSON below is a worked example of a Procure-to-Pay
            process — study its STRUCTURE, DEPTH and LEVEL OF DETAIL and match
            or exceed it for every field, for ANY process/industry you are
            given. DO NOT COPY ITS CONTENT — every id, name, system, rule,
            step, gap, etc. in your actual output must come from (or be a
            well-reasoned GAP about) the REAL source document you were given,
            never from this example. Use it only to calibrate quality:
            - Multiple concrete process steps (not just 1-2), each with a
              real system, real data_objects and a specific autonomy_reason.
            - Ontology objects with REAL attributes/key_attributes and a
              plausible source_system/source_table, not "unknown" unless the
              document truly gives no clue.
            - Business rules that are specific and actionable, tied to a real
              step, with guardrail_candidate correctly set.
            - Every gap has a concrete solution + app_component + effort +
              priority — never a vague "revisar con negocio".
            - Assessment questions across ALL 8 dimensions, correctly typed
              AUTO/BUSINESS/GAP, each with a plausible source or role_to_ask.

            EXAMPLE (Procure-to-Pay, illustrative structure only):
            ```json
            {
              "meta": {
                "process_name": "Procure-to-Pay (P2P)",
                "industry": "Supply Chain",
                "scope": "Detección de necesidad → pago y cierre",
                "process_owner_role": "Coordinador de Compras",
                "systems_involved": ["ERP", "Portal Proveedores", "Correo"],
                "source_type": "doc",
                "validation_status": "draft",
                "generated_by": "AI",
                "version": "1.0"
              },
              "process": {
                "steps": [
                  {
                    "id": "P9",
                    "name": "Crear Orden de Compra",
                    "description": "Generar OC con el proveedor seleccionado",
                    "role_responsible": "Comprador",
                    "data_objects": ["purchase_order"],
                    "system": "ERP",
                    "handoff_to": "P10",
                    "business_rules": ["R1", "R6"],
                    "autonomy_level": 2,
                    "autonomy_reason": "Crea OC solo si supplier homologado y req aprobada"
                  },
                  {
                    "id": "P17",
                    "name": "Programar y ejecutar pago",
                    "description": "Autorizar y liberar el pago",
                    "role_responsible": "Tesorería",
                    "data_objects": ["payment"],
                    "system": "ERP-Tesorería",
                    "handoff_to": "P18",
                    "business_rules": ["R2", "R5"],
                    "autonomy_level": 0,
                    "autonomy_reason": "Salida de dinero con responsabilidad legal; humano siempre"
                  }
                ]
              },
              "ontology": {
                "objects": [
                  {
                    "id": "supplier",
                    "name": "Maestro de proveedores",
                    "attributes": ["supplier_id", "name", "homologation_status", "bank_data"],
                    "key_attributes": ["supplier_id", "homologation_status"],
                    "source_system": "ERP",
                    "source_table": "LFA1",
                    "classification": "Confidencial",
                    "origin_step": "P8",
                    "relationships": [
                      { "type": "references", "target": "purchase_order", "cardinality": "1:N" }
                    ],
                    "rules": ["R6"]
                  },
                  {
                    "id": "purchase_order",
                    "name": "Orden de compra",
                    "attributes": ["po_id", "req_id", "supplier_id", "price", "delivery_date", "status"],
                    "key_attributes": ["po_id", "supplier_id", "status"],
                    "source_system": "ERP",
                    "source_table": "EKKO/EKPO",
                    "classification": "Confidencial",
                    "origin_step": "P9",
                    "relationships": [
                      { "type": "inherits", "target": "purchase_requisition", "cardinality": "N:1" },
                      { "type": "references", "target": "invoice", "cardinality": "1:N" }
                    ],
                    "rules": ["R1", "R6"]
                  }
                ],
                "principles": [
                  { "id": "PR2", "statement": "No pago sin OC", "connects_objects": ["purchase_order", "payment"] },
                  { "id": "PR6", "statement": "Solo proveedor homologado recibe OC", "connects_objects": ["supplier", "purchase_order"] }
                ],
                "relationship_graph": "requisition -> purchase_order -> invoice -> three_way_match -> payment"
              },
              "business_rules": [
                { "id": "R1", "statement": "No OC sin requisición aprobada", "applies_at_step": "P9", "type": "Bloqueante", "guardrail_candidate": true, "action_if_fail": "Bloquear OC" },
                { "id": "R6", "statement": "Solo proveedor homologado recibe OC", "applies_at_step": "P9", "type": "Bloqueante", "guardrail_candidate": true, "action_if_fail": "Bloquear OC y notificar" }
              ],
              "roles": [
                { "name": "Comprador", "steps_executed": ["P9", "P11"], "objects_owned": ["purchase_order"], "workshop_group": "A" },
                { "name": "Tesorería", "steps_executed": ["P17"], "objects_owned": ["payment"], "workshop_group": "B" }
              ],
              "handoffs": [
                { "id": "H5", "from": "Proveedor", "to": "AP (P15)", "medium": "Correo/PDF", "risk": "Alto", "integration_note": "Factura no estructurada requiere OCR" }
              ],
              "exceptions": [
                { "id": "E2", "type": "Compra retroactiva", "description": "OC emitida tras recibir mercancía", "frequency": "unknown", "status": "A cuantificar" }
              ],
              "data_governance": {
                "ownership_matrix": [
                  { "object_id": "supplier", "data_owner_business": "unknown", "data_steward_operational": "unknown" }
                ],
                "lineage_questions": [
                  { "question": "¿Se rastrea de qué requisición nació una OC?", "traces": "purchase_order.req_id → purchase_requisition.req_id" }
                ],
                "classification_summary": [
                  { "classification": "Regulado", "objects": ["invoice", "payment"] }
                ]
              },
              "ai_governance": {
                "accountability_roles": [
                  { "governance_role": "Agent Owner", "assigned_to": "unknown", "responsibility": "Responde por decisiones del agente" }
                ],
                "autonomy_map": [
                  { "step": "P9", "level": 2, "reason": "Crea OC con guardrails" },
                  { "step": "P17", "level": 0, "reason": "Pago = humano siempre" }
                ],
                "guardrails": [
                  { "id": "G1", "rule_origin": "R1", "rule": "No OC sin requisición aprobada", "action_if_fail": "Bloquear OC", "codified": false }
                ],
                "human_only_steps": ["P10", "P13", "P17"]
              },
              "agent_design": {
                "skills": [
                  { "id": "SK3", "name": "PO Management", "description": "Crea, valida y transmite OC", "steps_covered": ["P8", "P9", "P11"] }
                ],
                "tools": [
                  { "id": "T6", "name": "create_po()", "skill_id": "SK3", "inputs": ["req_id", "supplier_id", "price"], "outputs": ["po_id"], "system_endpoint": "unknown", "guardrails": ["G1"] }
                ],
                "orchestration": "multi-agente",
                "observability_events": [
                  { "event": "po_created", "logged_data": "po_id, supplier_id, amount", "audience": "Auditor" }
                ]
              },
              "integration": [
                { "object_id": "invoice", "system": "ERP", "access_method": "unknown", "latency": "unknown", "risk_flag": "Requiere OCR para PDF" }
              ],
              "assessment_instrument": {
                "dimensions": [
                  {
                    "dimension": "Data Quality",
                    "core_question": "¿El dato es confiable para el agente?",
                    "questions": [
                      { "id": "DQ-01", "question": "¿% proveedores con status homologado?", "type": "AUTO", "source": { "system": "ERP", "table_or_endpoint": "LFA1", "role_to_ask": null }, "target": 97, "unit": "%", "weight": 5, "owner_role": "Compras", "linked_step": "P9", "solution_hint": "Campaña homologación + bloqueo OC", "answer": null, "status": "pending" },
                      { "id": "DQ-03", "question": "¿La delivery_date es veraz o solo existe?", "type": "BUSINESS", "source": { "system": null, "table_or_endpoint": null, "role_to_ask": "Almacén" }, "target": "Confiable", "unit": null, "weight": 5, "owner_role": "Almacén", "linked_step": "P12", "solution_hint": "Control de veracidad de fechas", "answer": null, "status": "pending" },
                      { "id": "DQ-09", "question": "¿Alguien mide la calidad del dato hoy?", "type": "GAP", "source": { "system": null, "table_or_endpoint": null, "role_to_ask": "TI" }, "target": "DQ dashboard", "unit": null, "weight": 4, "owner_role": "TI", "linked_step": null, "solution_hint": "Implementar dashboard de calidad", "answer": null, "status": "pending" }
                    ]
                  },
                  {
                    "dimension": "Accountability",
                    "core_question": "¿Quién responde por qué (dato y agente)?",
                    "questions": [
                      { "id": "AC-02", "question": "¿Quién responde si el agente emite una OC mal?", "type": "GAP", "source": { "system": null, "table_or_endpoint": null, "role_to_ask": "Dirección" }, "target": "Agent Owner", "unit": null, "weight": 5, "owner_role": "Dirección", "linked_step": "P9", "solution_hint": "Definir rol Agent Owner", "answer": null, "status": "pending" }
                    ]
                  }
                ]
              },
              "gap_engine": {
                "gaps": [
                  {
                    "id": "GAP-01",
                    "dimension": "Data Quality",
                    "as_is": "unknown",
                    "target": "97% proveedores homologados",
                    "severity": "Alta",
                    "value_type": "Riesgo evitado",
                    "solution": "Campaña de homologación + bloqueo sistémico de OC",
                    "app_component": "Motor de validación de proveedores",
                    "effort": "M",
                    "priority": "Alta (alto valor / esfuerzo medio)"
                  },
                  {
                    "id": "GAP-02",
                    "dimension": "Accountability",
                    "as_is": "unknown",
                    "target": "Agent Owner definido",
                    "severity": "Alta",
                    "value_type": "Compliance",
                    "solution": "Definir roles de gobernanza de IA",
                    "app_component": "Módulo de gobernanza de agente",
                    "effort": "S",
                    "priority": "Quick Win"
                  }
                ]
              },
              "pre_gaps_recognized": [
                { "question": "¿% real de proveedores homologados?", "linked_step": "P9", "flag": "confirm_in_workshop" },
                { "question": "¿Existe definición única de homologado?", "linked_step": "P8", "flag": "confirm_in_workshop" }
              ],
              "workshops": [
                { "group": "A", "audience_role": "Compras", "questions": ["DQ-01", "AC-01"], "focus": "Homologación, ownership, consolidación", "duration_min": 90 },
                { "group": "B", "audience_role": "Finanzas/Contraloría", "questions": ["AC-02"], "focus": "SoD, roles de riesgo, ROI", "duration_min": 90 }
              ],
              "scoring": {
                "method": "score_dim = Σ(answer_norm × weight) / Σ(weight)",
                "rules": {
                  "unknown_gap": "counts as 0 + critical flag",
                  "business_unanswered": "dimension marked incomplete, no fake score"
                },
                "dimension_status_legend": { "pending": "○", "auto_done": "◐", "business_pending": "◑", "complete": "●" }
              }
            }
            ```
            Note: this example only shows 2 steps/objects/gaps/etc. to keep it
            readable — your REAL output must be much more complete: cover
            EVERY step, object, rule, role, handoff and exception you can find
            or reasonably infer from the actual source document, and evaluate
            ALL 8 assessment dimensions with several questions each, not just
            the 2 shown here.
            """;

        private static readonly AgentInlineSkill AgentReadinessSkill = new AgentInlineSkill(
            name: "agent-readiness-assessment",
            description: "Transforma un documento de proceso de negocio (de cualquier industria) en una evaluación completa de Agent-Readiness: modelo de proceso, ontología, reglas de negocio, gobierno de datos, gobierno de IA, diseño de agentes, instrumento de evaluación de 8 dimensiones y motor de brechas AS-IS -> GAP -> SOLUTION. Usa esta skill SIEMPRE que debas generar una evaluación de Agent-Readiness a partir de un documento fuente.",
            instructions: SkillInstructions)
            .AddResource(
                name: "quality-bar-example",
                value: QualityBarExample,
                description: "Ejemplo completo, ilustrativo (Procure-to-Pay) del nivel de profundidad y detalle esperado en cada sección del resultado. Cárgalo antes de producir la salida final para calibrar calidad — nunca copies su contenido en la respuesta real.");

        private readonly AIAgent? _agent;
        private readonly ILogger<AgentReadinessExtractionAgent>? _logger;

        public AgentReadinessExtractionAgent(IConfiguration configuration, ILogger<AgentReadinessExtractionAgent>? logger = null)
        {
            _logger = logger;
            var endpoint = configuration["AzureOpenAIEndpoint"];
            // Main deployment: this is open-ended, multi-dimension expert
            // reasoning (process engineering + governance + agent design),
            // not bounded structured extraction — deliberately NOT using
            // 'AzureOpenAIEconomyDeploymentName' here.
            var deploymentName = configuration["AzureOpenAIDeploymentName"];
            var apiKey = configuration["AzureOpenAIApiKey"];

            DeploymentName = deploymentName;

            if (string.IsNullOrWhiteSpace(endpoint) || string.IsNullOrWhiteSpace(deploymentName))
            {
                _agent = null;
                return;
            }

            AzureOpenAIClient client = string.IsNullOrWhiteSpace(apiKey)
                ? new AzureOpenAIClient(new Uri(endpoint), new DefaultAzureCredential())
                : new AzureOpenAIClient(new Uri(endpoint), new System.ClientModel.ApiKeyCredential(apiKey));

            // Skills are advertised via the load_skill/read_skill_resource
            // tools this AIContextProvider registers — the model must call
            // them itself (agentic tool use) rather than everything being
            // force-fed in one static prompt. Approval is disabled for both
            // since this only ever reads our own inline content, never runs
            // a script or touches anything external.
            var skillsProvider = new AgentSkillsProvider(
                new Microsoft.Agents.AI.AgentSkill[] { AgentReadinessSkill },
                new AgentSkillsProviderOptions
                {
                    DisableLoadSkillApproval = true,
                    DisableReadSkillResourceApproval = true,
                },
                loggerFactory: null);

            _agent = client
                .GetChatClient(deploymentName)
                .AsIChatClient()
                .AsAIAgent(new ChatClientAgentOptions
                {
                    Name = "AgentReadinessExtractionAgent",
                    ChatOptions = new ChatOptions { Instructions = OrchestratorInstructions },
                    AIContextProviders = [skillsProvider],
                });
        }

        public bool IsConfigured => _agent is not null;

        /// <summary>The deployment/model name used for extraction, for
        /// diagnostics/audit purposes.</summary>
        public string? DeploymentName { get; }

        public async Task<AgentReadinessResult> ExtractAsync(
            string processName,
            string documentText,
            string? dataSourceSystem = null,
            string? dataSourceSystemOther = null,
            CancellationToken cancellationToken = default)
        {
            if (_agent is null)
            {
                throw new InvalidOperationException(
                    "The Agent-Readiness extraction agent is not configured. Set the " +
                    "'AzureOpenAIEndpoint' and 'AzureOpenAIDeploymentName' application settings " +
                    "once credentials are provided.");
            }

            string sourceSystemHint;
            if (string.IsNullOrWhiteSpace(dataSourceSystem) && string.IsNullOrWhiteSpace(dataSourceSystemOther))
            {
              sourceSystemHint = "No especificado";
            }
            else
            {
              var lines = new List<string>();
              if (!string.IsNullOrWhiteSpace(dataSourceSystem))
                lines.Add($"Sistema principal: {dataSourceSystem}");

              if (!string.IsNullOrWhiteSpace(dataSourceSystemOther))
                lines.Add($"Paquetes/sistemas adicionales reportados por negocio:\n{dataSourceSystemOther}");

              sourceSystemHint = string.Join("\n\n", lines);
            }

            // ------------------------------------------------------------
            // Three focused calls instead of one giant one (or even two).
            // A single request asking for the FULL combined schema (process
            // model + ontology + governance + agent design + the 8
            // assessment dimensions + gap engine, all at once) reliably ran
            // out of output-token budget partway through: valid JSON, but
            // everything after the first 1-2 process steps came back empty.
            // Splitting into three narrower, sequential steps — each one
            // grounded on the previous step's real output — keeps every
            // individual response small AND makes phase B/C closer to a
            // mechanical derivation task than open-ended generation, which
            // in turn lets a validator (see ValidateStructural/
            // ValidateAssessment below) catch and correct the most common
            // failure mode: a syntactically valid but referentially
            // incomplete response (e.g. a business rule id referenced in a
            // step but never defined, or a dimension silently dropped).
            // ------------------------------------------------------------

            var phaseAPrompt = $"""
                Proceso de negocio: {processName}

                Sistema fuente principal reportado por el equipo:
                {sourceSystemHint}

                Texto completo del documento fuente:
                {documentText}

                NOW ANALYZE THIS PROCESS — PARTE 1 DE 3 (META + MODELO DE
                PROCESO): genera ÚNICAMENTE meta y process. Identifica TODOS
                los pasos que puedas encontrar en el documento (no te
                detengas en 1 o 2), en orden de ejecución, cada uno con
                description, role_responsible, data_objects, system,
                handoff_to (el id del paso siguiente, o null si es el
                último), business_rules (ids que tú mismo asignarás, p. ej.
                R1, R2... — se definirán en detalle en un paso posterior),
                autonomy_level (0-3) y autonomy_reason. No inventes datos:
                usa null si algo no está en el documento.

                NO generes ontology, el detalle de business_rules, roles,
                handoffs, exceptions, data_governance, ai_governance,
                agent_design, integration, assessment_instrument, gap_engine,
                pre_gaps_recognized, workshops ni scoring en esta respuesta —
                eso se pide en pasos separados.
                """;

            var processResult = await RunPhaseAsync<AgentReadinessProcessResult>(
                phaseAPrompt, processName, "meta + modelo de proceso (Parte 1/3)", cancellationToken);

            // Deterministic backfill: the model frequently leaves
            // meta.systems_involved empty even when individual steps do
            // report a system (e.g. "ERP" on one step) — rather than rely
            // on the model to remember to aggregate its own per-step data,
            // just derive it directly here, same rationale as the
            // hardcoded Scoring below.
            if (processResult.Meta.SystemsInvolved.Count == 0)
            {
                processResult.Meta.SystemsInvolved = processResult.Process.Steps
                    .Select(s => s.System)
                    .Where(sys => !string.IsNullOrWhiteSpace(sys))
                    .Distinct()
                    .Select(sys => sys!)
                    .ToList();
            }

            var processJson = JsonSerializer.Serialize(processResult);

            var phaseBPrompt = $"""
                Proceso de negocio: {processName}

                Sistema fuente principal reportado por el equipo:
                {sourceSystemHint}

                Ya se generó el modelo de proceso (meta + pasos). Aquí está
                en JSON — es tu ÚNICA fuente real de pasos/roles/ids, no
                inventes otros:
                {processJson}

                Texto completo del documento fuente (para extraer detalles
                que no quedaron en el modelo de pasos: reglas de negocio,
                excepciones, sistemas, etc.):
                {documentText}

                NOW ANALYZE THIS PROCESS — PARTE 2 DE 3 (MODELO DERIVADO):
                usando el modelo de proceso de arriba, genera COMPLETAMENTE:
                ontology, business_rules, roles, handoffs, exceptions,
                data_governance, ai_governance, agent_design e integration.

                Sigue al pie de la letra el CHECKLIST DE COMPLETITUD
                REFERENCIAL de tus instrucciones de rol: un role por cada
                role_responsible distinto, un handoff por cada transición
                entre pasos, un objeto de ontología por cada data_object
                distinto mencionado en los pasos, una entrada en
                business_rules por cada id referenciado en los pasos,
                autonomy_map y human_only_steps derivados del autonomy_level
                de cada paso, y guardrails por cada business_rule con
                guardrail_candidate=true. Revisa también el documento en
                busca de excepciones/casos borde (compras urgentes,
                proveedor único, rechazos de calidad, escalaciones) aunque no
                estén en una sección dedicada.

                NO generes assessment_instrument, gap_engine,
                pre_gaps_recognized, workshops ni scoring en esta respuesta —
                esos se piden en un paso separado.
                """;

            var structural = await RunPhaseWithCorrectionAsync<AgentReadinessStructuralResult>(
                phaseBPrompt, processName, "modelo derivado (Parte 2/3)",
                result => ValidateStructural(processResult, result), cancellationToken);

            var combinedJson = JsonSerializer.Serialize(new
            {
                meta = processResult.Meta,
                process = processResult.Process,
                ontology = structural.Ontology,
                business_rules = structural.BusinessRules,
                roles = structural.Roles,
                handoffs = structural.Handoffs,
                exceptions = structural.Exceptions,
                data_governance = structural.DataGovernance,
                ai_governance = structural.AiGovernance,
                agent_design = structural.AgentDesign,
                integration = structural.Integration,
            });

            var phaseCPrompt = $"""
                Proceso de negocio: {processName}

                Sistema fuente principal reportado por el equipo:
                {sourceSystemHint}

                Ya se generaron el modelo de proceso y el modelo derivado
                (ontología, reglas de negocio, roles, handoffs, excepciones,
                gobierno de datos, gobierno de IA y diseño del agente) de
                este proceso. Aquí está todo en JSON — úsalo como la ÚNICA
                fuente de ids/pasos/objetos/reglas reales para lo que sigue,
                no inventes otros:
                {combinedJson}

                Texto completo del documento fuente (contexto adicional si lo
                necesitas):
                {documentText}

                NOW ANALYZE THIS PROCESS — PARTE 3 DE 3 (INSTRUMENTO DE
                EVALUACIÓN Y GAP ENGINE): usando el modelo de arriba, genera
                COMPLETAMENTE: assessment_instrument (las 8 dimensiones, EN
                ORDEN, cada una con varias preguntas tipadas
                AUTO/BUSINESS/GAP — nunca omitas una dimensión ni la dejes
                sin preguntas), gap_engine (una entrada por cada pregunta
                tipo GAP, con solution, app_component, effort y priority),
                pre_gaps_recognized y workshops.

                IMPORTANTE PARA DATA QUALITY: usa el sistema fuente reportado
                como hipótesis inicial para las preguntas AUTO y el
                gap_engine, y contrástalo con el modelo derivado y el
                documento. Si hay inconsistencia o no hay evidencia
                suficiente, márcalo explícitamente como GAP (sin inventar
                tablas ni endpoints).
                """;

            var assessment = await RunPhaseWithCorrectionAsync<AgentReadinessAssessmentPart>(
                phaseCPrompt, processName, "instrumento de evaluación (Parte 3/3)",
                result => ValidateAssessment(structural, result), cancellationToken);

            return new AgentReadinessResult
            {
                Meta = processResult.Meta,
                Process = processResult.Process,
                Ontology = structural.Ontology,
                BusinessRules = structural.BusinessRules,
                Roles = structural.Roles,
                Handoffs = structural.Handoffs,
                Exceptions = structural.Exceptions,
                DataGovernance = structural.DataGovernance,
                AiGovernance = structural.AiGovernance,
                AgentDesign = structural.AgentDesign,
                Integration = structural.Integration,
                AssessmentInstrument = assessment.AssessmentInstrument,
                GapEngine = assessment.GapEngine,
                PreGapsRecognized = assessment.PreGapsRecognized,
                Workshops = assessment.Workshops,
                // Scoring is a fixed, document-independent rubric (same
                // formula/legend regardless of the process analyzed) — never
                // trust the model to reproduce it faithfully, just use the
                // constant default every time.
                Scoring = new Scoring(),
            };
        }

        private static readonly string[] RequiredAssessmentDimensions =
        [
            "Process Engineering",
            "Data Governance",
            "Data Quality",
            "Accountability",
            "People & Skills",
            "Agent Design",
            "Integration Readiness",
            "Business Value",
        ];

        /// <summary>Checks phase B's derived model for the most common
        /// "valid JSON but referentially incomplete" failures: roles/
        /// handoffs left empty despite the process model clearly implying
        /// them, business rule ids referenced in steps but never defined,
        /// and autonomy/guardrail mappings that don't match the process
        /// model. Returns a human-readable list of issues (empty = OK).</summary>
        private static List<string> ValidateStructural(
            AgentReadinessProcessResult processResult, AgentReadinessStructuralResult structural)
        {
            var issues = new List<string>();
            var steps = processResult.Process.Steps;

            var distinctRoles = steps
                .Select(s => s.RoleResponsible)
                .Where(r => !string.IsNullOrWhiteSpace(r))
                .Distinct()
                .ToList();
            if (distinctRoles.Count > 0 && structural.Roles.Count == 0)
            {
                issues.Add(
                    $"roles está vacío, pero los pasos tienen estos role_responsible distintos que deben " +
                    $"convertirse en entradas de roles: {string.Join(", ", distinctRoles)}.");
            }

            var stepsWithHandoff = steps.Count(s => !string.IsNullOrWhiteSpace(s.HandoffTo));
            if (stepsWithHandoff > 0 && structural.Handoffs.Count == 0)
            {
                issues.Add(
                    "handoffs está vacío, pero varios pasos tienen handoff_to hacia el paso siguiente — " +
                    "genera una entrada de handoff por cada transición entre pasos.");
            }

            var distinctDataObjects = steps
                .SelectMany(s => s.DataObjects)
                .Where(d => !string.IsNullOrWhiteSpace(d))
                .Distinct()
                .ToList();
            if (distinctDataObjects.Count > 0 && structural.Ontology.Objects.Count < distinctDataObjects.Count)
            {
                issues.Add(
                    $"ontology.objects tiene menos entradas ({structural.Ontology.Objects.Count}) que los " +
                    $"data_objects distintos mencionados en los pasos ({distinctDataObjects.Count}: " +
                    $"{string.Join(", ", distinctDataObjects)}) — falta definir al menos uno como objeto de " +
                    "ontología.");
            }

            var referencedRuleIds = steps.SelectMany(s => s.BusinessRules).Distinct().ToList();
            var definedRuleIds = structural.BusinessRules.Select(r => r.Id).ToHashSet();
            var missingRuleIds = referencedRuleIds.Where(id => !definedRuleIds.Contains(id)).ToList();
            if (missingRuleIds.Count > 0)
            {
                issues.Add(
                    $"los pasos referencian estos ids de business_rules que NO están definidos en el arreglo " +
                    $"business_rules: {string.Join(", ", missingRuleIds)} — agrega una entrada completa para " +
                    "cada uno.");
            }

            if (steps.Count > 0 && structural.AiGovernance.AutonomyMap.Count == 0)
            {
                issues.Add(
                    "ai_governance.autonomy_map está vacío — debe tener una entrada por cada paso del proceso, " +
                    "reflejando su autonomy_level.");
            }

            var humanOnlySteps = steps.Where(s => s.AutonomyLevel == 0).Select(s => s.Id).ToList();
            var declaredHumanOnly = structural.AiGovernance.HumanOnlySteps.ToHashSet();
            var missingHumanOnly = humanOnlySteps.Where(id => !declaredHumanOnly.Contains(id)).ToList();
            if (missingHumanOnly.Count > 0)
            {
                issues.Add(
                    $"ai_governance.human_only_steps no incluye estos pasos con autonomy_level 0: " +
                    $"{string.Join(", ", missingHumanOnly)} — agrégalos.");
            }

            var guardrailCandidateRules = structural.BusinessRules.Count(r => r.GuardrailCandidate);
            if (guardrailCandidateRules > 0 && structural.AiGovernance.Guardrails.Count == 0)
            {
                issues.Add(
                    $"hay {guardrailCandidateRules} business_rules con guardrail_candidate=true, pero " +
                    "ai_governance.guardrails está vacío — genera una entrada de guardrail por cada una.");
            }

            if (structural.Ontology.Objects.Count > 0 && structural.DataGovernance.OwnershipMatrix.Count == 0)
            {
                issues.Add(
                    "data_governance.ownership_matrix está vacío, pero ontology.objects tiene entradas — " +
                    "genera una entrada de ownership_matrix por cada objeto de ontología.");
            }

            return issues;
        }

        /// <summary>Checks phase C's assessment instrument/gap engine for
        /// the most common incompleteness failure: fewer than the
        /// mandatory 8 dimensions, dimensions with no questions, GAP-type
        /// questions that never produced a matching gap_engine entry, or
        /// ownership_matrix entries missing a data owner/steward that never
        /// turned into an explicit Data Governance question.</summary>
        private static List<string> ValidateAssessment(
            AgentReadinessStructuralResult structural, AgentReadinessAssessmentPart assessment)
        {
            var issues = new List<string>();
            var dimensions = assessment.AssessmentInstrument.Dimensions;

            var presentDimensions = dimensions.Select(d => d.Dimension).ToHashSet(StringComparer.OrdinalIgnoreCase);
            var missingDimensions = RequiredAssessmentDimensions
                .Where(required => !presentDimensions.Contains(required))
                .ToList();
            if (missingDimensions.Count > 0)
            {
                issues.Add(
                    $"assessment_instrument.dimensions no incluye estas dimensiones obligatorias: " +
                    $"{string.Join(", ", missingDimensions)} — deben estar TODAS, en el orden fijo de las 8 " +
                    "dimensiones, cada una con al menos una pregunta.");
            }

            var emptyDimensions = dimensions.Where(d => d.Questions.Count == 0).Select(d => d.Dimension).ToList();
            if (emptyDimensions.Count > 0)
            {
                issues.Add(
                    $"estas dimensiones no tienen ninguna pregunta: {string.Join(", ", emptyDimensions)} — " +
                    "agrega al menos una pregunta a cada una (puede ser tipo GAP si no hay evidencia).");
            }

            var gapQuestionCount = dimensions.SelectMany(d => d.Questions).Count(q => q.Type == "GAP");
            if (gapQuestionCount > 0 && assessment.GapEngine.Gaps.Count == 0)
            {
                issues.Add(
                    $"hay {gapQuestionCount} preguntas tipo GAP en assessment_instrument, pero gap_engine.gaps " +
                    "está vacío — genera al menos una entrada de gap por cada pregunta GAP sin resolver.");
            }

            var objectsMissingOwnership = structural.DataGovernance.OwnershipMatrix
                .Where(o => string.IsNullOrWhiteSpace(o.DataOwnerBusiness) || string.IsNullOrWhiteSpace(o.DataStewardOperational))
                .Select(o => o.ObjectId)
                .ToList();
            if (objectsMissingOwnership.Count > 0)
            {
                var dataGovernanceQuestions = dimensions
                    .Where(d => string.Equals(d.Dimension, "Data Governance", StringComparison.OrdinalIgnoreCase))
                    .SelectMany(d => d.Questions)
                    .Count();
                if (dataGovernanceQuestions < objectsMissingOwnership.Count)
                {
                    issues.Add(
                        $"estos objetos de ontology no tienen dueño de negocio y/o steward operativo definido " +
                        $"en data_governance.ownership_matrix: {string.Join(", ", objectsMissingOwnership)} — la " +
                        "dimensión Data Governance debe tener una pregunta literal de sí/no por cada uno (p. ej. " +
                        "\"¿Existe un steward operativo designado para <objeto>?\"), no dejarlo como un vacío " +
                        "silencioso.");
                }
            }

            return issues;
        }

        /// <summary>Runs a phase, validates the result, and — if the
        /// validator finds referential-completeness issues — makes ONE
        /// corrective follow-up call that spells out exactly what was
        /// missing, before accepting whatever comes back (even if still
        /// imperfect, this is reliably better than the first attempt).</summary>
        private async Task<T> RunPhaseWithCorrectionAsync<T>(
            string prompt,
            string processName,
            string phaseLabel,
            Func<T, List<string>> validate,
            CancellationToken cancellationToken)
        {
            var result = await RunPhaseAsync<T>(prompt, processName, phaseLabel, cancellationToken);
            var issues = validate(result);
            if (issues.Count == 0)
            {
                return result;
            }

            _logger?.LogWarning(
                "Agent-Readiness {Phase} incomplete for process '{ProcessName}' — requesting one corrective pass. Issues: {Issues}",
                phaseLabel, processName, string.Join(" | ", issues));

            var correctivePrompt = $"""
                {prompt}

                REVISIÓN OBLIGATORIA DE TU RESPUESTA ANTERIOR: tu respuesta
                anterior a esta misma solicitud quedó incompleta en los
                siguientes puntos — corrígelos TODOS en esta nueva respuesta
                completa (no repitas los mismos huecos):
                {string.Join("\n", issues.Select(i => "- " + i))}
                """;

            return await RunPhaseAsync<T>(correctivePrompt, processName, phaseLabel + " (corrección)", cancellationToken);
        }

        /// <summary>Runs a single structured-output call with retries. The
        /// agent sometimes ends its turn on a tool call (load_skill /
        /// read_skill_resource) without ever producing a final JSON answer
        /// — the SDK then throws "The response did not contain JSON to be
        /// deserialized." This is usually transient (a retry with the same
        /// input succeeds), so retry a couple of times before giving up,
        /// logging enough to diagnose if it keeps failing.</summary>
        private async Task<T> RunPhaseAsync<T>(
            string prompt, string processName, string phaseLabel, CancellationToken cancellationToken)
        {
            ChatMessage message = new(ChatRole.User, prompt);

            // Large, deeply nested schema — raise the output token cap well
            // above the framework default so a thorough response for a
            // real multi-page process document isn't truncated mid-JSON.
            var runOptions = new ChatClientAgentRunOptions(new ChatOptions { MaxOutputTokens = 16000 });

            const int maxAttempts = 3;
            Exception? lastError = null;
            for (var attempt = 1; attempt <= maxAttempts; attempt++)
            {
                try
                {
                    var response = await _agent!.RunAsync<T>(
                        message, options: runOptions, cancellationToken: cancellationToken);

                    return response.Result;
                }
                catch (Exception ex)
                {
                    lastError = ex;
                    _logger?.LogWarning(
                        ex,
                        "Agent-Readiness extraction attempt {Attempt}/{MaxAttempts} failed for process '{ProcessName}' ({Phase})",
                        attempt, maxAttempts, processName, phaseLabel);
                }
            }

            throw new InvalidOperationException(
                $"El agente de Agent-Readiness no devolvió una respuesta estructurada válida para {phaseLabel} " +
                $"tras {maxAttempts} intentos. Esto suele pasar con documentos muy largos/complejos que agotan el " +
                "presupuesto de salida del modelo. Intenta de nuevo o divide el documento en secciones más cortas.",
                lastError);
        }
    }
}
