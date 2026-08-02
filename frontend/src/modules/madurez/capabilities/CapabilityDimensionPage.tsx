import { useEffect, useState } from 'react'
import { Box, Grid, Card, CardContent, Typography, Button, Chip, CircularProgress, Alert } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import { CapabilityForm } from './CapabilityForm'
import { listCapabilities, type CapabilityDto } from './capabilityApi'

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

const maturityIndex = (c: CapabilityDto) =>
  Math.round(((c.maturityLevel + c.performanceLevel + c.digitalizationLevel) / 3) * 100) / 100

// Dimensión 2.2 "Capacidades Empresariales": lista de capacidades registradas
// (una card por capacidad, ej. "Marketing") con acceso al formulario de
// captura/edición completo (CapabilityForm).
export const CapabilityDimensionPage = () => {
  const [engagementId, setEngagementId] = useState<string | null>(null)
  const [capabilities, setCapabilities] = useState<CapabilityDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'form'>('list')
  const [editing, setEditing] = useState<CapabilityDto | undefined>(undefined)

  const loadCapabilities = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await listCapabilities(id)
      setCapabilities(data)
    } catch {
      setError('No se pudieron cargar las capacidades. Verifica que el backend esté corriendo.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const id = obtenerEngagementIdGuardado()
    setEngagementId(id)
    if (id) {
      loadCapabilities(id)
    } else {
      setLoading(false)
    }
  }, [])

  if (view === 'form' && engagementId) {
    return (
      <CapabilityForm
        engagementId={engagementId}
        initialData={editing}
        onCancel={() => setView('list')}
        onSaved={() => {
          setView('list')
          loadCapabilities(engagementId)
        }}
      />
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Capacidades registradas ({capabilities.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          disabled={!engagementId}
          onClick={() => {
            setEditing(undefined)
            setView('form')
          }}
        >
          Nueva capacidad
        </Button>
      </Box>

      {!engagementId && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Primero completa el perfil de la empresa en el Paso 1 (Empresa) para poder registrar capacidades.
        </Alert>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : capabilities.length === 0 ? (
        engagementId && (
          <Alert severity="info">Aún no hay capacidades registradas. Usa "Nueva capacidad" para agregar la primera.</Alert>
        )
      ) : (
        <Grid container spacing={2}>
          {capabilities.map((c) => (
            <Grid item xs={12} sm={6} md={4} key={c.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {c.name}
                    </Typography>
                    <Chip size="small" label={c.status} color={c.status === 'Completo' ? 'success' : 'default'} />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {c.businessDomain}
                    {c.owner ? ` · ${c.owner}` : ''}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                    <Chip size="small" label={`Madurez ${maturityIndex(c)}/5`} sx={{ bgcolor: 'action.hover' }} />
                    <Chip size="small" label={`Automatización ${c.automationPotentialPercent}%`} sx={{ bgcolor: 'action.hover' }} />
                    <Chip size="small" label={c.targetAutonomyLevel} sx={{ bgcolor: 'action.hover' }} />
                  </Box>
                  <Box sx={{ flexGrow: 1 }} />
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditRoundedIcon />}
                    onClick={() => {
                      setEditing(c)
                      setView('form')
                    }}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Editar
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}
