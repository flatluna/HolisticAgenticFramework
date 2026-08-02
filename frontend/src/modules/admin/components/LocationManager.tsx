import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box,
  Tooltip,
  Typography,
  Card,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import { useState } from 'react'
import { Location } from '../services/api'

interface LocationManagerProps {
  locations: Location[]
  onAdd: (location: Location) => Promise<void>
  onUpdate: (location: Location) => Promise<void>
  onDelete: (locationId: string) => Promise<void>
}

export const LocationManager = ({ locations, onAdd, onUpdate, onDelete }: LocationManagerProps) => {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Location>({ name: '', address: '', city: '', country: '' })

  const handleOpen = (location?: Location) => {
    if (location) {
      setFormData(location)
      setEditingId(location.id || null)
    } else {
      setFormData({ name: '', address: '', city: '', country: '' })
      setEditingId(null)
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('El nombre de la ubicación es obligatorio')
      return
    }

    try {
      if (editingId) {
        await onUpdate(formData)
      } else {
        await onAdd(formData)
      }
      handleClose()
    } catch (error) {
      console.error('Error saving location:', error)
      alert('Error al guardar la ubicación')
    }
  }

  const handleDelete = async (locationId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta ubicación?')) {
      try {
        await onDelete(locationId)
      } catch (error) {
        console.error('Error deleting location:', error)
        alert('Error al eliminar la ubicación')
      }
    }
  }

  return (
    <Card sx={{ mt: 3, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocationOnIcon color="action" fontSize="small" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Ubicaciones
          </Typography>
        </Box>
        <Tooltip title="Agregar Ubicación">
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
            size="small"
          >
            Agregar
          </Button>
        </Tooltip>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Ciudad</TableCell>
              <TableCell>País</TableCell>
              <TableCell>Dirección</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {locations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  Aún no hay ubicaciones
                </TableCell>
              </TableRow>
            ) : (
              locations.map((loc) => (
                <TableRow key={loc.id} hover>
                  <TableCell>{loc.name}</TableCell>
                  <TableCell>{loc.city || '-'}</TableCell>
                  <TableCell>{loc.country || '-'}</TableCell>
                  <TableCell>{loc.address || '-'}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        onClick={() => handleOpen(loc)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        onClick={() => loc.id && handleDelete(loc.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Editar Ubicación' : 'Agregar Ubicación'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Nombre de la Ubicación"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="dense"
            placeholder="ej. Sede Central, Oficina Brasil"
          />
          <TextField
            fullWidth
            label="Ciudad"
            value={formData.city || ''}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            margin="dense"
            placeholder="ej. São Paulo"
          />
          <TextField
            fullWidth
            label="País"
            value={formData.country || ''}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            margin="dense"
            placeholder="ej. Brasil"
          />
          <TextField
            fullWidth
            label="Dirección"
            value={formData.address || ''}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            margin="dense"
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}
