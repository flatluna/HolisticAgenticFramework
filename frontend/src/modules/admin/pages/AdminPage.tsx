import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Paper,
  Typography,
  Divider,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import RefreshIcon from '@mui/icons-material/Refresh'
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { companyProfileAPI, CompanyProfile, CompanyProfileRequest } from '../services/api'
import { DepartmentManager } from '../components/DepartmentManager'
import { LocationManager } from '../components/LocationManager'

export const AdminPage = () => {
  const [engagementId] = useState(uuidv4())
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<CompanyProfileRequest>({
    name: '',
    industry: '',
    foundedYear: undefined,
    headquarters: '',
    employees: undefined,
  })

  useEffect(() => {
    loadCompanyProfile()
  }, [])

  const loadCompanyProfile = async () => {
    setLoading(true)
    setError(null)
    try {
      const profile = await companyProfileAPI.getCompanyProfile(engagementId)
      setCompanyProfile(profile)
      setFormData({
        name: profile.name,
        industry: profile.industry,
        foundedYear: profile.foundedYear,
        headquarters: profile.headquarters,
        employees: profile.employees,
      })
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Perfil de empresa no encontrado. Crea uno nuevo.')
        setCompanyProfile(null)
      } else {
        setError('Error al cargar el perfil de la empresa. ' + (err.message || ''))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setLoading(true)
    setError(null)
    try {
      if (companyProfile?.id) {
        await companyProfileAPI.updateCompanyProfile(engagementId, companyProfile.id, formData)
      } else {
        const newProfile = await companyProfileAPI.createCompanyProfile(engagementId, formData)
        setCompanyProfile(newProfile)
      }
      await loadCompanyProfile()
    } catch (err: any) {
      setError('Error al guardar el perfil de la empresa. ' + (err.message || ''))
    } finally {
      setLoading(false)
    }
  }

  const handleAddDepartment = async (department) => {
    if (!companyProfile?.id) {
      setError('Por favor guarda primero el perfil de la empresa')
      return
    }
    await companyProfileAPI.addDepartment(engagementId, companyProfile.id, department)
    await loadCompanyProfile()
  }

  const handleUpdateDepartment = async (department) => {
    if (!department.id) return
    await companyProfileAPI.updateDepartment(engagementId, department.id, department)
    await loadCompanyProfile()
  }

  const handleDeleteDepartment = async (departmentId: string) => {
    await companyProfileAPI.deleteDepartment(engagementId, departmentId)
    await loadCompanyProfile()
  }

  const handleAddLocation = async (location) => {
    if (!companyProfile?.id) {
      setError('Por favor guarda primero el perfil de la empresa')
      return
    }
    await companyProfileAPI.addLocation(engagementId, companyProfile.id, location)
    await loadCompanyProfile()
  }

  const handleUpdateLocation = async (location) => {
    if (!location.id) return
    await companyProfileAPI.updateLocation(engagementId, location.id, location)
    await loadCompanyProfile()
  }

  const handleDeleteLocation = async (locationId: string) => {
    await companyProfileAPI.deleteLocation(engagementId, locationId)
    await loadCompanyProfile()
  }

  if (loading && !companyProfile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <BusinessRoundedIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h2" sx={{ fontWeight: 700 }}>
            Perfil de la Empresa
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadCompanyProfile}
          disabled={loading}
        >
          Actualizar
        </Button>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <DescriptionRoundedIcon color="action" fontSize="small" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Información de la Empresa
            </Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre de la Empresa"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ej. Acme Corporation"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Industria"
                value={formData.industry || ''}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="ej. Tecnología, Finanzas"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Año de Fundación"
                type="number"
                value={formData.foundedYear || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    foundedYear: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="ej. 2010"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Número de Empleados"
                type="number"
                value={formData.employees || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    employees: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="ej. 500"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ubicación de la Sede"
                value={formData.headquarters || ''}
                onChange={(e) => setFormData({ ...formData, headquarters: e.target.value })}
                placeholder="ej. San Francisco, USA"
                variant="outlined"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSaveProfile}
              disabled={loading || !formData.name}
              size="large"
            >
              {companyProfile?.id ? 'Actualizar' : 'Crear'} Perfil de Empresa
            </Button>
          </Box>
        </CardContent>
      </Card>

      {companyProfile && (
        <>
          <Paper sx={{ p: 3, mb: 4 }} variant="outlined">
            <Grid container spacing={3}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  ID de Perfil
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                  {companyProfile.id?.substring(0, 8)}...
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  Departamentos
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {companyProfile.departments?.length || 0}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  Ubicaciones
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {companyProfile.locations?.length || 0}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  Estado
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CheckCircleRoundedIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                    Activo
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          <DepartmentManager
            departments={companyProfile.departments || []}
            engagementId={engagementId}
            companyProfileId={companyProfile.id || ''}
            onAdd={handleAddDepartment}
            onUpdate={handleUpdateDepartment}
            onDelete={handleDeleteDepartment}
          />

          <LocationManager
            locations={companyProfile.locations || []}
            onAdd={handleAddLocation}
            onUpdate={handleUpdateLocation}
            onDelete={handleDeleteLocation}
          />
        </>
      )}
    </Box>
  )
}
