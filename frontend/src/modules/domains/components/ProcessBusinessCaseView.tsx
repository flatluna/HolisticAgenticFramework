import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { DomainConfig } from '../data/industriesData'
import {
  computePriorityScore,
  computeQuadrant,
  DomainAssessmentState,
  ProcessInventoryItem,
  Quadrant,
} from '../hooks/useDomainDiscovery'
import { QUADRANT_COLORS, QUADRANT_LABELS } from './quadrantMeta'

interface ProcessBusinessCaseSourceItem {
  domain: DomainConfig
  state: DomainAssessmentState
  effectiveAdjustment: number
}

interface ProcessBusinessCaseViewProps {
  items: ProcessBusinessCaseSourceItem[]
  onSelect: (domainId: string) => void
}

const DIM_COLUMNS: { key: keyof ProcessInventoryItem; label: string }[] = [
  { key: 'strategicValue', label: 'Valor' },
  { key: 'transformPotential', label: 'Potencial' },
  { key: 'roi', label: 'ROI' },
  { key: 'complexity', label: 'Complej.' },
  { key: 'urgency', label: 'Urgencia' },
]

interface ProcessBusinessCaseItem {
  domain: DomainConfig
  process: ProcessInventoryItem
  priorityScore: number
  quadrant: Quadrant
}

// Business Case a nivel de PROCESO — variante de BusinessCaseView pensada
// para armar el roadmap de siguientes pasos: el roadmap se construye
// proceso por proceso (no dominio por dominio), ya que cada proceso puede
// tener su propio score/cuadrante independiente de en qué dominio viva.
export const ProcessBusinessCaseView = ({ items, onSelect }: ProcessBusinessCaseViewProps) => {
  const evaluated: ProcessBusinessCaseItem[] = []
  for (const { domain, state, effectiveAdjustment } of items) {
    for (const process of state.processInventory) {
      const priorityScore = computePriorityScore(process, effectiveAdjustment)
      const quadrant = computeQuadrant(process, effectiveAdjustment)
      if (priorityScore !== null && quadrant !== null) {
        evaluated.push({ domain, process, priorityScore, quadrant })
      }
    }
  }
  evaluated.sort((a, b) => b.priorityScore - a.priorityScore)

  if (evaluated.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 2 }}>
        Todavía no hay procesos completamente evaluados (5/5 dimensiones) para armar el business case.
      </Typography>
    )
  }

  return (
    <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Proceso</TableCell>
            <TableCell>Dominio</TableCell>
            {DIM_COLUMNS.map((c) => (
              <TableCell key={c.key} align="center">
                {c.label}
              </TableCell>
            ))}
            <TableCell align="center">Score</TableCell>
            <TableCell align="center">Cuadrante</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {evaluated.map((item) => {
            const color = QUADRANT_COLORS[item.quadrant]
            return (
              <TableRow
                key={item.process.id}
                hover
                onClick={() => onSelect(item.domain.id)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {item.process.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Typography sx={{ fontSize: '1rem' }}>{item.domain.emoji}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.domain.name}
                    </Typography>
                  </Box>
                </TableCell>
                {DIM_COLUMNS.map((c) => (
                  <TableCell key={c.key} align="center">
                    {String(item.process[c.key] ?? '—')}
                  </TableCell>
                ))}
                <TableCell align="center" sx={{ fontWeight: 800 }}>
                  {item.priorityScore.toFixed(1)}
                </TableCell>
                <TableCell align="center">
                  <Box
                    sx={{
                      display: 'inline-block',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      px: 1,
                      py: 0.25,
                      borderRadius: 1,
                      bgcolor: `${color}22`,
                      color,
                    }}
                  >
                    {QUADRANT_LABELS[item.quadrant]}
                  </Box>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
