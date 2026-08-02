import { AppBar, Toolbar, Box, Typography, Chip, Avatar, IconButton, Tooltip } from '@mui/material'
import HubRoundedIcon from '@mui/icons-material/HubRounded'
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded'
import FlagRoundedIcon from '@mui/icons-material/FlagRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import MenuOpenRoundedIcon from '@mui/icons-material/MenuOpenRounded'
import { useThemeMode } from '@/app/ThemeModeContext'
import { useEmpresaActiva } from '@/shared/hooks/useEmpresaActiva'

interface TopInfoBarProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

export const TopInfoBar = ({ sidebarOpen, onToggleSidebar }: TopInfoBarProps) => {
  const nombreEmpresa = useEmpresaActiva()
  const { mode, toggleMode } = useThemeMode()
  return (
    <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
      <Toolbar sx={{ gap: 1.5, py: 0.5 }}>
        <Tooltip title={sidebarOpen ? 'Ocultar barra lateral' : 'Mostrar barra lateral'}>
          <IconButton
            onClick={onToggleSidebar}
            size="small"
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              color: 'text.secondary',
              width: 34,
              height: 34,
              mr: 0.5,
            }}
          >
            {sidebarOpen ? <MenuOpenRoundedIcon sx={{ fontSize: 18 }} /> : <MenuRoundedIcon sx={{ fontSize: 18 }} />}
          </IconButton>
        </Tooltip>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'primary.main',
            }}
          >
            <HubRoundedIcon sx={{ color: '#fff', fontSize: 19 }} />
          </Box>
          <Box>
            <Typography variant="h1" sx={{ fontSize: '1rem', lineHeight: 1.1 }}>
              AETP
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, lineHeight: 1 }}>
              Agentic Enterprise Transformation
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1.5,
            py: 0.6,
            borderRadius: 2,
            bgcolor: 'rgba(21, 26, 46, 0.035)',
            border: '1px solid rgba(21, 26, 46, 0.06)',
          }}
        >
          <BusinessRoundedIcon sx={{ fontSize: 16, color: 'primary.main' }} />
          <Typography variant="body2" color="text.secondary">
            Cliente
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            {nombreEmpresa ?? 'Sin empresa'}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1.5,
            py: 0.6,
            borderRadius: 2,
            bgcolor: 'rgba(21, 26, 46, 0.035)',
            border: '1px solid rgba(21, 26, 46, 0.06)',
          }}
        >
          <FlagRoundedIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
          <Typography variant="body2" color="text.secondary">
            Engagement
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            {nombreEmpresa ? `Transformación ${nombreEmpresa}` : 'Sin engagement'}
          </Typography>
        </Box>

        <Chip
          label="Borrador"
          size="small"
          sx={{
            bgcolor: 'warning.light',
            color: 'warning.main',
            fontWeight: 800,
            fontSize: '0.7rem',
          }}
        />

        <Tooltip title={mode === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}>
          <IconButton
            onClick={toggleMode}
            size="small"
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              color: 'text.secondary',
              width: 34,
              height: 34,
            }}
          >
            {mode === 'dark' ? <LightModeRoundedIcon sx={{ fontSize: 18 }} /> : <DarkModeRoundedIcon sx={{ fontSize: 18 }} />}
          </IconButton>
        </Tooltip>

        <Avatar
          sx={{
            width: 34,
            height: 34,
            ml: 0.5,
            fontSize: '0.8rem',
            fontWeight: 800,
            bgcolor: 'primary.dark',
          }}
        >
          JP
        </Avatar>
      </Toolbar>
    </AppBar>
  )
}

