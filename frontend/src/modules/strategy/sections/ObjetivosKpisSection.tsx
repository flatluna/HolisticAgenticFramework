import { useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  Chip,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import { v4 as uuidv4 } from 'uuid'

interface Objective {
  id: string
  objetivo: string
  kpi: string
  meta: string
  actual: string
  estado: 'En riesgo' | 'En curso' | 'Cumplido'
}

const estadoColor: Record<Objective['estado'], 'error' | 'warning' | 'success'> = {
  'En riesgo': 'error',
  'En curso': 'warning',
  Cumplido: 'success',
}

const emptyObjective: Omit<Objective, 'id'> = { objetivo: '', kpi: '', meta: '', actual: '', estado: 'En curso' }

export const ObjetivosKpisSection = () => {
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<Objective, 'id'>>(emptyObjective)

  const openAddDialog = () => {
    setEditingId(null)
    setForm(emptyObjective)
    setDialogOpen(true)
  }

  const openEditDialog = (objective: Objective) => {
    setEditingId(objective.id)
    setForm(objective)
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (editingId) {
      setObjectives((prev) => prev.map((o) => (o.id === editingId ? { ...o, ...form } : o)))
    } else {
      setObjectives((prev) => [...prev, { id: uuidv4(), ...form }])
    }
    setDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    setObjectives((prev) => prev.filter((o) => o.id !== id))
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Objetivos y KPIs
          </Typography>
          <Button size="small" startIcon={<AddRoundedIcon />} onClick={openAddDialog}>
            Agregar objetivo
          </Button>
        </Box>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Objetivo</TableCell>
                <TableCell>KPI</TableCell>
                <TableCell>Meta</TableCell>
                <TableCell>Actual</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {objectives.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                      Sin objetivos registrados.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {objectives.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>{o.objetivo}</TableCell>
                  <TableCell>{o.kpi}</TableCell>
                  <TableCell>{o.meta}</TableCell>
                  <TableCell>{o.actual}</TableCell>
                  <TableCell>
                    <Chip label={o.estado} size="small" color={estadoColor[o.estado]} />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEditDialog(o)}>
                      <EditRoundedIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(o.id)}>
                      <DeleteRoundedIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Editar objetivo' : 'Agregar objetivo'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Objetivo" fullWidth value={form.objetivo} onChange={(e) => setForm({ ...form, objetivo: e.target.value })} />
          <TextField label="KPI" fullWidth value={form.kpi} onChange={(e) => setForm({ ...form, kpi: e.target.value })} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Meta" fullWidth value={form.meta} onChange={(e) => setForm({ ...form, meta: e.target.value })} />
            <TextField label="Actual" fullWidth value={form.actual} onChange={(e) => setForm({ ...form, actual: e.target.value })} />
          </Box>
          <Select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value as Objective['estado'] })}>
            <MenuItem value="En curso">En curso</MenuItem>
            <MenuItem value="En riesgo">En riesgo</MenuItem>
            <MenuItem value="Cumplido">Cumplido</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}
