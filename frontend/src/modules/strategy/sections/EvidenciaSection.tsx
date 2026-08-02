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
} from '@mui/material'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import { v4 as uuidv4 } from 'uuid'

interface Evidence {
  id: string
  nombre: string
  tipo: string
  fecha: string
  subidoPor: string
}

export const EvidenciaSection = () => {
  const [items, setItems] = useState<Evidence[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ nombre: '', tipo: 'Documento', subidoPor: '' })

  const handleAdd = () => {
    if (!form.nombre.trim()) return
    setItems((prev) => [
      ...prev,
      { id: uuidv4(), nombre: form.nombre, tipo: form.tipo, subidoPor: form.subidoPor, fecha: new Date().toLocaleDateString('es-ES') },
    ])
    setForm({ nombre: '', tipo: 'Documento', subidoPor: '' })
    setDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Evidencia de respaldo
          </Typography>
          <Button size="small" startIcon={<UploadFileRoundedIcon />} onClick={() => setDialogOpen(true)}>
            Subir evidencia
          </Button>
        </Box>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Subido por</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                      Sin evidencia cargada.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DescriptionRoundedIcon fontSize="small" color="disabled" />
                      {item.nombre}
                    </Box>
                  </TableCell>
                  <TableCell>{item.tipo}</TableCell>
                  <TableCell>{item.fecha}</TableCell>
                  <TableCell>{item.subidoPor || '—'}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleDelete(item.id)}>
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
        <DialogTitle>Subir evidencia</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Nombre del documento"
            fullWidth
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
          <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
            <MenuItem value="Documento">Documento</MenuItem>
            <MenuItem value="Presentación">Presentación</MenuItem>
            <MenuItem value="Hoja de cálculo">Hoja de cálculo</MenuItem>
            <MenuItem value="Otro">Otro</MenuItem>
          </Select>
          <TextField
            label="Subido por"
            fullWidth
            value={form.subidoPor}
            onChange={(e) => setForm({ ...form, subidoPor: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleAdd}>
            Agregar
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}
