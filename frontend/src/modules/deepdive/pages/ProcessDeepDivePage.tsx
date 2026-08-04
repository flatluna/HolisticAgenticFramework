import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  Chip,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material'
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import SubdirectoryArrowRightRoundedIcon from '@mui/icons-material/SubdirectoryArrowRightRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded'
import { phases } from '@/layout/phaseData'
import { useEmpresaActiva } from '@/shared/hooks/useEmpresaActiva'
import { PRIORITY_META, STATUS_LABEL, type ProcessDeepDiveStatus } from '../data/catalogs'
import { useDeepDiveProcesses } from '../state/deepDiveStore'

const allSteps = phases.flatMap((phase) => phase.steps.map((step, idx) => ({ ...step, phase, phaseStepIndex: idx })))
const stepIndex = allSteps.findIndex((s) => s.path === '/deep-dive')
const step = allSteps[stepIndex]

// Botón de acción a la derecha de cada card — varía según el estado del
// deep dive de ese proceso. Todos llevan a la misma pantalla de captura
// paso a paso (Ver/Editar abren en modo edición sobre pasos existentes).
const ProcessActionButton = ({ status, onClick }: { status: ProcessDeepDiveStatus; onClick: () => void }) => {
  if (status === 'pendiente') {
    return (
      <Button variant="contained" size="small" startIcon={<PlayArrowRoundedIcon />} onClick={onClick}>
        Iniciar Deep Dive
      </Button>
    )
  }
  if (status === 'en-progreso') {
    return (
      <Button variant="outlined" size="small" startIcon={<SubdirectoryArrowRightRoundedIcon />} onClick={onClick}>
        Continuar
      </Button>
    )
  }
  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button variant="outlined" size="small" startIcon={<VisibilityRoundedIcon />} onClick={onClick}>
        Ver
      </Button>
      <Button variant="outlined" size="small" startIcon={<EditRoundedIcon />} onClick={onClick}>
        Editar
      </Button>
    </Box>
  )
}

export const ProcessDeepDivePage = () => {
  const navigate = useNavigate()
  const nombreEmpresa = useEmpresaActiva()
  const processes = useDeepDiveProcesses()
  const [search, setSearch] = useState('')

  const orderedProcesses = useMemo(() => {
    const filtered = processes.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()))
    return [...filtered].sort((a, b) => a.priority - b.priority)
  }, [processes, search])

  return (
    <Box sx={{ minHeight: '100%', bgcolor: 'background.default', color: 'text.primary' }}>
      <Box sx={{ px: 3, pt: 2 }}>
        <Breadcrumbs
          separator={<NavigateNextRoundedIcon sx={{ fontSize: 16 }} />}
          sx={{ color: 'text.secondary', fontSize: '0.8rem' }}
        >
          <Typography variant="caption" color="text.secondary">
            {nombreEmpresa || 'Cliente'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {step ? `${step.phase.code} · ${step.phase.label}` : 'L3 · Deep Dive de Procesos'}
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* 1. Header — título/subtítulo a la izquierda, buscador a la derecha */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            L3 — Deep Dive de Procesos
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Captura detallada, paso a paso, de cada proceso priorizado en L2
          </Typography>
        </Box>

        <TextField
          size="small"
          placeholder="Buscar proceso..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 260 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      {/* 2. Lista de procesos priorizados */}
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="overline" color="text.secondary">
          Procesos priorizados (heredados de L2)
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {orderedProcesses.map((process) => {
            const priorityMeta = PRIORITY_META[process.priorityLevel]
            return (
              <Card
                key={process.id}
                variant="outlined"
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2.5,
                  borderRadius: 2,
                  transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                  '&:hover': { boxShadow: 3, borderColor: 'primary.main' },
                }}
              >
                {/* Izquierda: número de prioridad + badge de nivel */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, width: 84, flexShrink: 0 }}>
                  <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: 'text.secondary', lineHeight: 1 }}>
                    #{process.priority}
                  </Typography>
                  <Chip
                    size="small"
                    label={`${priorityMeta.emoji} ${priorityMeta.label}`}
                    sx={{
                      bgcolor: `${priorityMeta.color}1F`,
                      color: priorityMeta.color,
                      fontWeight: 700,
                      fontSize: '0.7rem',
                    }}
                  />
                </Box>

                {/* Centro: nombre + metadata */}
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {process.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.4, color: 'text.secondary' }}>
                    <ScheduleRoundedIcon sx={{ fontSize: 14 }} />
                    <Typography variant="caption" color="text.secondary">
                      Est. {process.estMinutes} min · {process.steps.length}/{process.expectedStepCount} pasos ·{' '}
                      {STATUS_LABEL[process.status]}
                    </Typography>
                  </Box>
                </Box>

                {/* Derecha: acción según estado */}
                <Box sx={{ flexShrink: 0 }}>
                  <ProcessActionButton status={process.status} onClick={() => navigate(`/deep-dive/${process.id}`)} />
                </Box>
              </Card>
            )
          })}

          {orderedProcesses.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              Ningún proceso coincide con "{search}".
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  )
}
