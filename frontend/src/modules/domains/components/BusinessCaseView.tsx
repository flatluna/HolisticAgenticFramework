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
import { Quadrant } from '../hooks/useDomainDiscovery'
import { EvaluatedDomain } from './RankingView'
import { QUADRANT_COLORS, QUADRANT_LABELS } from './quadrantMeta'

interface BusinessCaseViewProps {
  items: EvaluatedDomain[]
  onSelect: (domainId: string) => void
}

const DIM_COLUMNS: { key: keyof EvaluatedDomain['state']; label: string }[] = [
  { key: 'strategicValue', label: 'Valor' },
  { key: 'transformPotential', label: 'Potencial' },
  { key: 'roi', label: 'ROI' },
  { key: 'complexity', label: 'Complej.' },
  { key: 'urgency', label: 'Urgencia' },
]

// Vista Business Case (tercera vista de Pantalla A) — tabla ejecutiva con
// las 5 dimensiones capturadas, el priorityScore calculado y el cuadrante,
// pensada para exportar/leer en una junta de decisión.
export const BusinessCaseView = ({ items, onSelect }: BusinessCaseViewProps) => {
  const evaluated = items
    .filter((i): i is EvaluatedDomain & { priorityScore: number; quadrant: Quadrant } => i.priorityScore !== null && i.quadrant !== null)
    .sort((a, b) => b.priorityScore - a.priorityScore)

  if (evaluated.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 2 }}>
        Todavía no hay dominios completamente evaluados (5/5 dimensiones) para armar el business case.
      </Typography>
    )
  }

  return (
    <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
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
                key={item.domain.id}
                hover
                onClick={() => onSelect(item.domain.id)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: '1.1rem' }}>{item.domain.emoji}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {item.domain.name}
                    </Typography>
                  </Box>
                </TableCell>
                {DIM_COLUMNS.map((c) => (
                  <TableCell key={c.key} align="center">
                    {String(item.state[c.key] ?? '—')}
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
