import {
  Box,
  Typography,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Stack,
  Alert,
  Divider,
} from '@mui/material'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import type { AgentReadinessResult, AssessmentQuestionType } from './agentReadinessApi'

const autonomyColor = (level: number): 'error' | 'warning' | 'info' | 'success' | 'default' =>
  level === 0 ? 'error' : level === 1 ? 'warning' : level === 2 ? 'info' : level === 3 ? 'success' : 'default'

const questionTypeChip = (type: AssessmentQuestionType) => {
  const map: Record<AssessmentQuestionType, { label: string; color: 'success' | 'warning' | 'error' }> = {
    AUTO: { label: '🟢 AUTO', color: 'success' },
    BUSINESS: { label: '🟡 BUSINESS', color: 'warning' },
    GAP: { label: '🔴 GAP', color: 'error' },
  }
  const info = map[type] ?? map.GAP
  return <Chip size="small" label={info.label} color={info.color} variant="outlined" />
}

const severityColor = (severity: string): 'error' | 'warning' | 'success' | 'default' =>
  /alta/i.test(severity) ? 'error' : /media/i.test(severity) ? 'warning' : /baja/i.test(severity) ? 'success' : 'default'

const riskColor = (risk: string): 'error' | 'warning' | 'success' | 'default' =>
  /alto/i.test(risk) ? 'error' : /medio/i.test(risk) ? 'warning' : /bajo/i.test(risk) ? 'success' : 'default'

const Section = ({
  title,
  subtitle,
  defaultExpanded,
  children,
}: {
  title: string
  subtitle?: string
  defaultExpanded?: boolean
  children: React.ReactNode
}) => (
  <Accordion defaultExpanded={defaultExpanded} disableGutters>
    <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
      <Box>
        <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
    </AccordionSummary>
    <AccordionDetails>{children}</AccordionDetails>
  </Accordion>
)

const Empty = ({ text = 'Sin datos.' }: { text?: string }) => (
  <Typography variant="body2" color="text.secondary">
    {text}
  </Typography>
)

// Muestra el JSON completo generado por el agente "Agent-Readiness Process
// Architect" en secciones plegables — una por cada bloque del contrato
// (proceso, ontología, reglas, roles/handoffs, governance, agent design,
// instrumento de evaluación de 8 dimensiones, gap engine, workshops).
export const AgentReadinessResultView = ({ result }: { result: AgentReadinessResult }) => {
  return (
    <Stack spacing={1.5}>
      <Section title="Resumen" subtitle={result.meta.process_name} defaultExpanded>
        <Stack spacing={1}>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            <Chip size="small" label={`Industria: ${result.meta.industry}`} />
            <Chip size="small" label={`Dueño: ${result.meta.process_owner_role}`} />
            <Chip size="small" label={`Origen: ${result.meta.source_type}`} />
            <Chip size="small" variant="outlined" label={`v${result.meta.version}`} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            <strong>Alcance:</strong> {result.meta.scope}
          </Typography>
          {result.meta.systems_involved.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {result.meta.systems_involved.map((s, i) => (
                <Chip key={i} size="small" variant="outlined" label={s} />
              ))}
            </Box>
          )}
        </Stack>
      </Section>

      <Section title={`Pasos del proceso (${result.process.steps.length})`}>
        {result.process.steps.length === 0 ? (
          <Empty />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Rol responsable</TableCell>
                <TableCell>Sistema</TableCell>
                <TableCell>Handoff a</TableCell>
                <TableCell>Autonomía</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {result.process.steps.map((step) => (
                <TableRow key={step.id}>
                  <TableCell>{step.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {step.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {step.description}
                    </Typography>
                  </TableCell>
                  <TableCell>{step.role_responsible}</TableCell>
                  <TableCell>{step.system ?? '—'}</TableCell>
                  <TableCell>{step.handoff_to ?? '—'}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={autonomyColor(step.autonomy_level)}
                      label={`L${step.autonomy_level}`}
                      title={step.autonomy_reason}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>

      <Section title={`Ontología (${result.ontology.objects.length} objetos)`}>
        <Stack spacing={1.5}>
          {result.ontology.objects.length === 0 ? (
            <Empty />
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Clasificación</TableCell>
                  <TableCell>Sistema fuente</TableCell>
                  <TableCell>Paso de origen</TableCell>
                  <TableCell>Atributos</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.ontology.objects.map((obj) => (
                  <TableRow key={obj.id}>
                    <TableCell>{obj.id}</TableCell>
                    <TableCell>{obj.name}</TableCell>
                    <TableCell>
                      <Chip size="small" label={obj.classification} />
                    </TableCell>
                    <TableCell>{obj.source_system ?? '—'}</TableCell>
                    <TableCell>{obj.origin_step ?? '—'}</TableCell>
                    <TableCell>{obj.attributes.join(', ') || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {result.ontology.principles.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                Principios
              </Typography>
              <Stack spacing={0.5}>
                {result.ontology.principles.map((p) => (
                  <Typography key={p.id} variant="body2" color="text.secondary">
                    <strong>{p.id}.</strong> {p.statement}
                  </Typography>
                ))}
              </Stack>
            </Box>
          )}
          {result.ontology.relationship_graph && (
            <Box component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: 12, bgcolor: 'action.hover', p: 1, borderRadius: 1 }}>
              {result.ontology.relationship_graph}
            </Box>
          )}
        </Stack>
      </Section>

      <Section title={`Reglas de negocio (${result.business_rules.length})`}>
        {result.business_rules.length === 0 ? (
          <Empty />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Regla</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Paso</TableCell>
                <TableCell>Guardrail</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {result.business_rules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.id}</TableCell>
                  <TableCell>{r.statement}</TableCell>
                  <TableCell>{r.type}</TableCell>
                  <TableCell>{r.applies_at_step ?? '—'}</TableCell>
                  <TableCell>
                    {r.guardrail_candidate ? <Chip size="small" color="warning" label="Sí" /> : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>

      <Section title={`Roles (${result.roles.length}) y Handoffs (${result.handoffs.length})`}>
        <Stack spacing={2}>
          {result.roles.length === 0 ? (
            <Empty text="Sin roles." />
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Rol</TableCell>
                  <TableCell>Pasos que ejecuta</TableCell>
                  <TableCell>Objetos que posee</TableCell>
                  <TableCell>Grupo de workshop</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.roles.map((role, i) => (
                  <TableRow key={i}>
                    <TableCell>{role.name}</TableCell>
                    <TableCell>{role.steps_executed.join(', ') || '—'}</TableCell>
                    <TableCell>{role.objects_owned.join(', ') || '—'}</TableCell>
                    <TableCell>{role.workshop_group ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <Divider />
          {result.handoffs.length === 0 ? (
            <Empty text="Sin handoffs." />
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>De</TableCell>
                  <TableCell>A</TableCell>
                  <TableCell>Medio</TableCell>
                  <TableCell>Riesgo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.handoffs.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell>{h.id}</TableCell>
                    <TableCell>{h.from}</TableCell>
                    <TableCell>{h.to}</TableCell>
                    <TableCell>{h.medium ?? '—'}</TableCell>
                    <TableCell>
                      <Chip size="small" color={riskColor(h.risk)} label={h.risk} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Stack>
      </Section>

      {result.exceptions.length > 0 && (
        <Section title={`Excepciones (${result.exceptions.length})`}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Frecuencia</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {result.exceptions.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{e.id}</TableCell>
                  <TableCell>{e.type}</TableCell>
                  <TableCell>{e.description}</TableCell>
                  <TableCell>{e.frequency ?? '—'}</TableCell>
                  <TableCell>{e.status ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>
      )}

      <Section title="Data Governance">
        <Stack spacing={2}>
          {result.data_governance.ownership_matrix.length > 0 && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Objeto</TableCell>
                  <TableCell>Dueño de negocio</TableCell>
                  <TableCell>Steward operativo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.data_governance.ownership_matrix.map((o, i) => (
                  <TableRow key={i}>
                    <TableCell>{o.object_id}</TableCell>
                    <TableCell>{o.data_owner_business ?? '—'}</TableCell>
                    <TableCell>{o.data_steward_operational ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {result.data_governance.classification_summary.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              {result.data_governance.classification_summary.map((c, i) => (
                <Chip key={i} size="small" label={`${c.classification}: ${c.objects.length}`} />
              ))}
            </Box>
          )}
          {result.data_governance.lineage_questions.length > 0 && (
            <Stack spacing={0.5}>
              {result.data_governance.lineage_questions.map((q, i) => (
                <Typography key={i} variant="body2" color="text.secondary">
                  🔎 {q.question} {q.traces ? `(${q.traces})` : ''}
                </Typography>
              ))}
            </Stack>
          )}
        </Stack>
      </Section>

      <Section title="AI Governance">
        <Stack spacing={2}>
          {result.ai_governance.human_only_steps.length > 0 && (
            <Alert severity="error" sx={{ '& .MuiAlert-message': { width: '100%' } }}>
              Pasos exclusivamente humanos: {result.ai_governance.human_only_steps.join(', ')}
            </Alert>
          )}
          {result.ai_governance.accountability_roles.length > 0 && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Rol de governance</TableCell>
                  <TableCell>Asignado a</TableCell>
                  <TableCell>Responsabilidad</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.ai_governance.accountability_roles.map((a, i) => (
                  <TableRow key={i}>
                    <TableCell>{a.governance_role}</TableCell>
                    <TableCell>{a.assigned_to ?? '—'}</TableCell>
                    <TableCell>{a.responsibility ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {result.ai_governance.guardrails.length > 0 && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Regla</TableCell>
                  <TableCell>Acción si falla</TableCell>
                  <TableCell>Codificado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.ai_governance.guardrails.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell>{g.id}</TableCell>
                    <TableCell>{g.rule}</TableCell>
                    <TableCell>{g.action_if_fail ?? '—'}</TableCell>
                    <TableCell>{g.codified ? 'Sí' : 'No'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Stack>
      </Section>

      <Section title="Diseño del agente (skills, tools, orquestación)">
        <Stack spacing={2}>
          <Chip size="small" label={`Orquestación: ${result.agent_design.orchestration}`} />
          {result.agent_design.skills.length > 0 && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Skill</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Pasos cubiertos</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.agent_design.skills.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.id}</TableCell>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.description ?? '—'}</TableCell>
                    <TableCell>{s.steps_covered.join(', ') || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {result.agent_design.tools.length > 0 && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Tool</TableCell>
                  <TableCell>Skill</TableCell>
                  <TableCell>Endpoint</TableCell>
                  <TableCell>Guardrails</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.agent_design.tools.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.id}</TableCell>
                    <TableCell>{t.name}</TableCell>
                    <TableCell>{t.skill_id ?? '—'}</TableCell>
                    <TableCell>{t.system_endpoint ?? '—'}</TableCell>
                    <TableCell>{t.guardrails.join(', ') || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Stack>
      </Section>

      <Section title={`Instrumento de evaluación (8 dimensiones)`} defaultExpanded>
        <Stack spacing={1}>
          {result.assessment_instrument.dimensions.map((dim, i) => (
            <Accordion key={i} disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                <Typography sx={{ fontWeight: 600 }}>
                  {dim.dimension} ({dim.questions.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {dim.core_question && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {dim.core_question}
                  </Typography>
                )}
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Pregunta</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Target</TableCell>
                      <TableCell>Dueño</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dim.questions.map((q) => (
                      <TableRow key={q.id}>
                        <TableCell>{q.id}</TableCell>
                        <TableCell>{q.question}</TableCell>
                        <TableCell>{questionTypeChip(q.type)}</TableCell>
                        <TableCell>
                          {q.target ?? '—'} {q.unit ?? ''}
                        </TableCell>
                        <TableCell>{q.owner_role ?? '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      </Section>

      <Section title={`Gaps detectados (${result.gap_engine.gaps.length})`} defaultExpanded>
        {result.gap_engine.gaps.length === 0 ? (
          <Empty />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Dimensión</TableCell>
                <TableCell>As-is → Target</TableCell>
                <TableCell>Severidad</TableCell>
                <TableCell>Solución</TableCell>
                <TableCell>Esfuerzo</TableCell>
                <TableCell>Prioridad</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {result.gap_engine.gaps.map((g) => (
                <TableRow key={g.id}>
                  <TableCell>{g.id}</TableCell>
                  <TableCell>{g.dimension}</TableCell>
                  <TableCell>
                    {g.as_is ?? 'unknown'} → {g.target ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" color={severityColor(g.severity)} label={g.severity} />
                  </TableCell>
                  <TableCell>{g.solution ?? '—'}</TableCell>
                  <TableCell>{g.effort}</TableCell>
                  <TableCell>{g.priority ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>

      {result.pre_gaps_recognized.length > 0 && (
        <Section title={`Pre-gaps reconocidos por el negocio (${result.pre_gaps_recognized.length})`}>
          <Stack spacing={0.5}>
            {result.pre_gaps_recognized.map((p, i) => (
              <Typography key={i} variant="body2" color="text.secondary">
                • {p.question} {p.linked_step ? `(${p.linked_step})` : ''}
              </Typography>
            ))}
          </Stack>
        </Section>
      )}

      {result.workshops.length > 0 && (
        <Section title={`Workshops propuestos (${result.workshops.length})`}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Grupo</TableCell>
                <TableCell>Audiencia</TableCell>
                <TableCell>Foco</TableCell>
                <TableCell>Duración</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {result.workshops.map((w, i) => (
                <TableRow key={i}>
                  <TableCell>{w.group}</TableCell>
                  <TableCell>{w.audience_role ?? '—'}</TableCell>
                  <TableCell>{w.focus ?? '—'}</TableCell>
                  <TableCell>{w.duration_min} min</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>
      )}
    </Stack>
  )
}
