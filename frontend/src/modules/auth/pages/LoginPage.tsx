import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Card, CardContent, TextField, Button, Typography, Avatar, CircularProgress } from '@mui/material'
import HubRoundedIcon from '@mui/icons-material/HubRounded'
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded'
import { getEmpresaRegistrada, login } from '../authSession'

export const LoginPage = () => {
  const navigate = useNavigate()
  const empresa = getEmpresaRegistrada()
  const nombreEmpresa = empresa?.nombre || 'ACUMEN'
  const [usuario, setUsuario] = useState(`admin@${nombreEmpresa.toLowerCase().replace(/\s+/g, '')}.com`)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login()
      navigate('/', { replace: true })
    } catch (error) {
      console.error('Login error:', error)
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Card variant="outlined" sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, justifyContent: 'center' }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
              <HubRoundedIcon fontSize="small" />
            </Avatar>
            <Typography variant="h1" sx={{ fontSize: '1.25rem' }}>
              AETP
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1.5,
              mb: 3,
              borderRadius: 2,
              bgcolor: 'action.hover',
            }}
          >
            <Avatar sx={{ bgcolor: 'secondary.main', width: 40, height: 40 }}>
              <BusinessRoundedIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Bienvenido de nuevo
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {nombreEmpresa}
              </Typography>
            </Box>
          </Box>

          <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Usuario" fullWidth value={usuario} onChange={(e) => setUsuario(e.target.value)} disabled={loading} />
            <TextField
              label="Contraseña"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />
            <Button type="submit" variant="contained" size="large" sx={{ mt: 1 }} disabled={loading}>
              {loading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Cargando...
                </>
              ) : (
                'Iniciar sesión'
              )}
            </Button>
          </Box>

          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', mt: 2.5 }}>
            Simulación de acceso — no se valida usuario/contraseña
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
