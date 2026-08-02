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
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import { useState } from 'react'
import { Department } from '../services/api'

interface DepartmentManagerProps {
  departments: Department[]
  engagementId: string
  companyProfileId: string
  onAdd: (department: Department) => Promise<void>
  onUpdate: (department: Department) => Promise<void>
  onDelete: (departmentId: string) => Promise<void>
}

export const DepartmentManager = ({
  departments,
  onAdd,
  onUpdate,
  onDelete,
}: DepartmentManagerProps) => {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Department>({ name: '', description: '' })

  const handleOpen = (department?: Department) => {
    if (department) {
      setFormData(department)
      setEditingId(department.id || null)
    } else {
      setFormData({ name: '', description: '' })
      setEditingId(null)
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('El nombre del departamento es obligatorio')
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
      console.error('Error saving department:', error)
      alert('Error al guardar el departamento')
    }
  }

  const handleDelete = async (departmentId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este departamento?')) {
      try {
        await onDelete(departmentId)
      } catch (error) {
        console.error('Error deleting department:', error)
        alert('Error al eliminar el departamento')
      }
    }
  }

  return (
    <Card sx={{ mt: 3, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GroupsRoundedIcon color="action" fontSize="small" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Departamentos
          </Typography>
        </Box>
        <Tooltip title="Agregar Departamento">
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
              <TableCell>Descripción</TableCell>
              <TableCell>Presupuesto</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {departments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  Aún no hay departamentos
                </TableCell>
              </TableRow>
            ) : (
              departments.map((dept) => (
                <TableRow key={dept.id} hover>
                  <TableCell>{dept.name}</TableCell>
                  <TableCell>{dept.description || '-'}</TableCell>
                  <TableCell>{dept.budget ? `$${dept.budget.toLocaleString()}` : '-'}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        onClick={() => handleOpen(dept)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        onClick={() => dept.id && handleDelete(dept.id)}
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
        <DialogTitle>{editingId ? 'Editar Departamento' : 'Agregar Departamento'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Nombre del Departamento"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="dense"
          />
          <TextField
            fullWidth
            label="Descripción"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="dense"
            multiline
            rows={3}
          />
          <TextField
            fullWidth
            label="Presupuesto"
            type="number"
            value={formData.budget || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                budget: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
            margin="dense"
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
