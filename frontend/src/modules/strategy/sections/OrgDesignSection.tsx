import { useEffect, useRef, useState } from 'react'
import { Box, Card, CardContent, Typography, Button, Table, TableContainer, TableHead, TableBody, TableRow, TableCell, IconButton, Dialog, TextField, MenuItem, Select, FormControl, InputLabel, Paper, Snackbar, Alert, CircularProgress } from '@mui/material'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'
import { extractOrgChart, downloadOrgChartImage, listStakeholders, bulkSaveStakeholders, type StakeholderDto } from '../services/api'

// Misma clave que usa EmpresaSection para guardar el engagementId de la
// empresa (singleton) tras crearla — así sabemos a qué empresa conectar
// los roles del organigrama.
const EMPRESA_STORAGE_KEY = 'aetp.empresa.perfil'

const obtenerEngagementIdGuardado = (): string | null => {
  const raw = localStorage.getItem(EMPRESA_STORAGE_KEY)
  if (!raw) return null
  try {
    const datos = JSON.parse(raw) as { engagementId?: string }
    return datos.engagementId ?? null
  } catch {
    return null
  }
}

interface Role {
  id: string
  nombre: string
  puesto: string
  replicaA: string
  nivelJerarquico: string
  responsabilidades: string
  reporta?: string
}

// Traduce el nivel numérico (0 = arriba del organigrama) que devuelve el
// agente de IA a una de las opciones existentes del Select de Nivel Jerárquico.
const nivelDesdeProfundidad = (level: number): string => {
  if (level <= 0) return 'Ejecutivo'
  if (level === 1) return 'Director'
  if (level === 2) return 'Gerente'
  if (level === 3) return 'Coordinador'
  return 'Especialista'
}

export const OrgDesignSection = () => {
  const [roles, setRoles] = useState<Role[]>([])
  const [openDialog, setOpenDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Omit<Role, 'id'>>({
    nombre: '',
    puesto: '',
    replicaA: '',
    nivelJerarquico: '',
    responsabilidades: '',
    reporta: '',
  })

  const [extrayendo, setExtrayendo] = useState(false)
  const [errorExtraccion, setErrorExtraccion] = useState('')
  const [extraccionExitosa, setExtraccionExitosa] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [descargandoImagen, setDescargandoImagen] = useState(false)
  const [errorDescargaImagen, setErrorDescargaImagen] = useState('')

  const [engagementId, setEngagementId] = useState<string | null>(() => obtenerEngagementIdGuardado())
  const [guardandoTodos, setGuardandoTodos] = useState(false)
  const [errorGuardarTodos, setErrorGuardarTodos] = useState('')
  const [guardadoTodosExitoso, setGuardadoTodosExitoso] = useState(false)

  const sincronizarEngagementDesdeStorage = () => {
    setEngagementId(obtenerEngagementIdGuardado())
  }

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === EMPRESA_STORAGE_KEY) {
        sincronizarEngagementDesdeStorage()
      }
    }
    const onEmpresaActualizada = () => sincronizarEngagementDesdeStorage()

    window.addEventListener('storage', onStorage)
    window.addEventListener('empresa-perfil-updated', onEmpresaActualizada)
    window.addEventListener('focus', onEmpresaActualizada)

    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('empresa-perfil-updated', onEmpresaActualizada)
      window.removeEventListener('focus', onEmpresaActualizada)
    }
  }, [])

  const mapearStakeholderARole = (s: StakeholderDto): Role => ({
    id: s.id,
    nombre: s.name,
    puesto: s.position ?? '',
    replicaA: s.replicaTo ?? '',
    nivelJerarquico: s.hierarchyLevel ?? '',
    responsabilidades: s.responsibilities ?? '',
    reporta: s.reportsTo ?? '',
  })

  // Al entrar a la sección, si ya existe una empresa guardada (ACUMEN),
  // carga los roles que ya se hayan guardado previamente en Stakeholders.
  useEffect(() => {
    if (!engagementId) return
    listStakeholders(engagementId)
      .then((stakeholders) => {
        if (stakeholders.length > 0) {
          setRoles(stakeholders.map(mapearStakeholderARole))
        }
      })
      .catch(() => {
        // Si falla la carga inicial, simplemente se queda la tabla vacía;
        // el usuario puede seguir agregando/extrayendo roles normalmente.
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagementId])

  // Guarda TODOS los roles de la tabla en el backend (Stakeholders),
  // conectados a la empresa/engagement ya guardado (ej. ACUMEN).
  const handleGuardarTodos = async () => {
    const id = obtenerEngagementIdGuardado()
    if (!id) {
      setErrorGuardarTodos('Aun no hay una empresa activa para vincular estos roles. Ve a "Empresa" y presiona "Guardar" o "Guardar cambios"; luego regresa a Organigrama.')
      return
    }
    if (roles.length === 0) {
      setErrorGuardarTodos('No hay roles para guardar.')
      return
    }

    setGuardandoTodos(true)
    setErrorGuardarTodos('')
    try {
      const stakeholders = await bulkSaveStakeholders(
        id,
        roles.map((r) => ({
          name: r.nombre,
          position: r.puesto || undefined,
          hierarchyLevel: r.nivelJerarquico || undefined,
          reportsTo: r.reporta || undefined,
          replicaTo: r.replicaA || undefined,
          responsibilities: r.responsabilidades || undefined,
        })),
      )
      setRoles(stakeholders.map(mapearStakeholderARole))
      setGuardadoTodosExitoso(true)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setErrorGuardarTodos(err.response.data.error)
      } else {
        setErrorGuardarTodos('No se pudieron guardar los roles. Intenta de nuevo.')
      }
    } finally {
      setGuardandoTodos(false)
    }
  }

  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setFormData(role)
      setEditingId(role.id)
    } else {
      setFormData({ nombre: '', puesto: '', replicaA: '', nivelJerarquico: '', responsabilidades: '', reporta: '' })
      setEditingId(null)
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setFormData({ nombre: '', puesto: '', replicaA: '', nivelJerarquico: '', responsabilidades: '', reporta: '' })
    setEditingId(null)
  }

  const handleSeleccionarImagen = () => {
    fileInputRef.current?.click()
  }

  // Sube el organigrama a la API y reemplaza la tabla de roles con la
  // jerarquía que el agente de IA extrajo de la imagen.
  const handleArchivoOrgChart = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const id = obtenerEngagementIdGuardado()
    if (!id) {
      setErrorExtraccion('Aun no hay una empresa activa para vincular esta imagen. Ve a "Empresa" y presiona "Guardar" o "Guardar cambios"; luego regresa a Organigrama.')
      return
    }

    setExtrayendo(true)
    setErrorExtraccion('')
    setExtraccionExitosa(false)
    try {
      const resultado = await extractOrgChart(file, id)
      const nuevosRoles: Role[] = resultado.people.map((persona) => ({
        id: uuidv4(),
        nombre: persona.name,
        puesto: persona.position,
        replicaA: '',
        nivelJerarquico: nivelDesdeProfundidad(persona.level),
        responsabilidades: '',
        reporta: persona.reportsTo ?? '',
      }))
      setRoles(nuevosRoles)
      setExtraccionExitosa(true)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 501) {
        setErrorExtraccion(
          'El agente de IA aún no está configurado en el backend (faltan credenciales de Azure OpenAI).',
        )
      } else if (axios.isAxiosError(err) && err.response?.data?.error) {
        setErrorExtraccion(err.response.data.error)
      } else {
        setErrorExtraccion('No se pudo extraer el organigrama de la imagen. Intenta de nuevo.')
      }
    } finally {
      setExtrayendo(false)
    }
  }

  // Descarga la última imagen de organigrama subida (guardada en Data Lake)
  // para que el usuario pueda verla/guardarla en su equipo.
  const handleDescargarImagen = async () => {
    const id = obtenerEngagementIdGuardado()
    if (!id) {
      setErrorDescargaImagen('Aun no hay una empresa activa. Ve a "Empresa" y guarda los datos primero.')
      return
    }

    setDescargandoImagen(true)
    setErrorDescargaImagen('')
    try {
      await downloadOrgChartImage(id)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setErrorDescargaImagen('Aun no se ha subido ninguna imagen de organigrama para esta empresa.')
      } else {
        setErrorDescargaImagen('No se pudo descargar la imagen. Intenta de nuevo.')
      }
    } finally {
      setDescargandoImagen(false)
    }
  }

  const handleSaveRole = () => {
    if (!formData.nombre.trim()) return

    if (editingId) {
      setRoles((prev) => prev.map((r) => (r.id === editingId ? { ...formData, id: editingId } : r)))
    } else {
      setRoles((prev) => [...prev, { ...formData, id: uuidv4() }])
    }
    handleCloseDialog()
  }

  const handleDeleteRole = (id: string) => {
    setRoles((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Descripción */}
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            Diseño Organizacional
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Define la estructura organizacional, roles clave, jerarquía y líneas de reporte.
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleArchivoOrgChart}
            />
            <Button
              variant="outlined"
              size="small"
              startIcon={extrayendo ? <CircularProgress size={14} /> : <AutoAwesomeRoundedIcon />}
              onClick={handleSeleccionarImagen}
              disabled={extrayendo}
            >
              {extrayendo ? 'Analizando organigrama…' : 'Extraer de imagen (IA)'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={descargandoImagen ? <CircularProgress size={14} /> : <DownloadRoundedIcon />}
              onClick={handleDescargarImagen}
              disabled={descargandoImagen}
            >
              {descargandoImagen ? 'Descargando…' : 'Descargar imagen'}
            </Button>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Sube una foto o captura de un organigrama y la IA detectará nombres, puestos y jerarquía.
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Tabla de roles */}
      <Card variant="outlined">
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Roles Organizacionales
              </Typography>
              {!engagementId && (
                <Typography variant="caption" sx={{ color: 'warning.main' }}>
                  Paso pendiente: primero guarda la empresa en la seccion "Empresa" (boton "Guardar" o "Guardar cambios") para crear el ID de vinculacion.
                </Typography>
              )}
              {engagementId && roles.length === 0 && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Agrega o extrae al menos un rol para habilitar "Guardar todos"
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                startIcon={guardandoTodos ? <CircularProgress size={14} /> : <SaveRoundedIcon />}
                variant="contained"
                size="small"
                onClick={handleGuardarTodos}
                disabled={guardandoTodos || roles.length === 0 || !engagementId}
              >
                {guardandoTodos ? 'Guardando…' : 'Guardar todos'}
              </Button>
              <Button startIcon={<AddRoundedIcon />} variant="outlined" size="small" onClick={() => handleOpenDialog()}>
                Agregar
              </Button>
            </Box>
          </Box>

          <TableContainer component={Paper} variant="outlined" sx={{ border: 'none' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'background.default' }}>
                  <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Nombre</TableCell>
                  <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Puesto</TableCell>
                  <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Nivel Jerárquico</TableCell>
                  <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Reporta A</TableCell>
                  <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Réplica A</TableCell>
                  <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      Aún no hay roles definidos
                    </TableCell>
                  </TableRow>
                ) : (
                  roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>{role.nombre || '-'}</TableCell>
                      <TableCell>{role.puesto || '-'}</TableCell>
                      <TableCell>{role.nivelJerarquico}</TableCell>
                      <TableCell>{role.reporta || '-'}</TableCell>
                      <TableCell>{role.replicaA || '-'}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleOpenDialog(role)}>
                          <EditRoundedIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteRole(role.id)}>
                          <DeleteRoundedIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog para agregar/editar rol */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
            {editingId ? 'Editar Rol' : 'Nuevo Rol'}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Nombre del rol"
              fullWidth
              value={formData.nombre}
              onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
              placeholder="Ej. Director de Transformación"
            />

            <TextField
              label="Puesto"
              fullWidth
              value={formData.puesto}
              onChange={(e) => setFormData((prev) => ({ ...prev, puesto: e.target.value }))}
              placeholder="Ej. Chief Transformation Officer"
            />

            <FormControl fullWidth>
              <InputLabel>Nivel Jerárquico</InputLabel>
              <Select
                value={formData.nivelJerarquico}
                onChange={(e) => setFormData((prev) => ({ ...prev, nivelJerarquico: e.target.value }))}
                label="Nivel Jerárquico"
              >
                <MenuItem value="">
                  <em>Seleccionar...</em>
                </MenuItem>
                <MenuItem value="Ejecutivo">Ejecutivo</MenuItem>
                <MenuItem value="Director">Director</MenuItem>
                <MenuItem value="Gerente">Gerente</MenuItem>
                <MenuItem value="Especialista">Especialista</MenuItem>
                <MenuItem value="Analista">Analista</MenuItem>
                <MenuItem value="Coordinador">Coordinador</MenuItem>
                <MenuItem value="Otro">Otro</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Reporta a"
              fullWidth
              value={formData.reporta}
              onChange={(e) => setFormData((prev) => ({ ...prev, reporta: e.target.value }))}
              placeholder="Nombre del rol superior"
            />

            <TextField
              label="Réplica a"
              fullWidth
              value={formData.replicaA}
              onChange={(e) => setFormData((prev) => ({ ...prev, replicaA: e.target.value }))}
              placeholder="Nombre del rol que replica"
            />

            <TextField
              label="Responsabilidades principales"
              fullWidth
              multiline
              minRows={3}
              value={formData.responsabilidades}
              onChange={(e) => setFormData((prev) => ({ ...prev, responsabilidades: e.target.value }))}
              placeholder="Describe las responsabilidades clave de este rol"
            />

            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 2 }}>
              <Button variant="outlined" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button variant="contained" onClick={handleSaveRole}>
                Guardar
              </Button>
            </Box>
          </Box>
        </Box>
      </Dialog>

      <Snackbar
        open={extraccionExitosa}
        autoHideDuration={4000}
        onClose={() => setExtraccionExitosa(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setExtraccionExitosa(false)} sx={{ boxShadow: 4 }}>
          Organigrama extraído correctamente. Revisa y ajusta los roles detectados.
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!errorExtraccion}
        autoHideDuration={6000}
        onClose={() => setErrorExtraccion('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" variant="filled" onClose={() => setErrorExtraccion('')} sx={{ boxShadow: 4 }}>
          {errorExtraccion}
        </Alert>
      </Snackbar>

      <Snackbar
        open={guardadoTodosExitoso}
        autoHideDuration={4000}
        onClose={() => setGuardadoTodosExitoso(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setGuardadoTodosExitoso(false)} sx={{ boxShadow: 4 }}>
          Roles guardados correctamente en la empresa.
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!errorGuardarTodos}
        autoHideDuration={6000}
        onClose={() => setErrorGuardarTodos('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" variant="filled" onClose={() => setErrorGuardarTodos('')} sx={{ boxShadow: 4 }}>
          {errorGuardarTodos}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!errorDescargaImagen}
        autoHideDuration={6000}
        onClose={() => setErrorDescargaImagen('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" variant="filled" onClose={() => setErrorDescargaImagen('')} sx={{ boxShadow: 4 }}>
          {errorDescargaImagen}
        </Alert>
      </Snackbar>
    </Box>
  )
}
