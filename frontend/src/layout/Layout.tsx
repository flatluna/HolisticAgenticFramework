import { useState } from 'react'
import { Box, Drawer, Toolbar } from '@mui/material'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { Outlet } from 'react-router-dom'
import { TopInfoBar } from './TopInfoBar'
import { PhaseSidebar } from './PhaseSidebar'
import { DataDictionaryBrowser } from '@/modules/datadictionary/components/DataDictionaryBrowser'

const DRAWER_WIDTH = 232

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  // Tab global "📚 Diccionario" — fijo hasta abajo de la pantalla, disponible
  // en CUALQUIER página (no solo dentro del ciclo de captura/edición de un
  // paso). Abre un panel de solo-consulta (readOnly): se puede buscar y ver
  // la ficha completa de cada dato, pero no agregar/editar/eliminar desde
  // aquí — para eso sigue existiendo la página dedicada /diccionario-datos.
  const [dictionaryOpen, setDictionaryOpen] = useState(false)

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <TopInfoBar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((v) => !v)} />

      <Box
        component="nav"
        sx={{
          width: sidebarOpen ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          borderRight: sidebarOpen ? 1 : 0,
          borderColor: 'divider',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'width 0.22s ease, border-color 0.22s ease',
        }}
      >
        <Toolbar />
        <Box sx={{ flexGrow: 1, overflowY: 'auto', width: DRAWER_WIDTH }}>
          <PhaseSidebar />
        </Box>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
          bgcolor: 'background.default',
        }}
      >
        <Toolbar />
        <Box sx={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <Outlet />
        </Box>
      </Box>

      {/* Pestaña fija hasta abajo — abre el diccionario en modo solo-consulta,
          sin salir de la página actual ni perder el progreso de un paso en
          edición. */}
      <Box
        onClick={() => setDictionaryOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 0,
          right: 32,
          zIndex: (t) => t.zIndex.drawer + 2,
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          px: 2,
          py: 0.75,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          borderRadius: '8px 8px 0 0',
          cursor: 'pointer',
          fontSize: '0.8125rem',
          fontWeight: 700,
          boxShadow: '0 -2px 8px rgba(21, 26, 46, 0.15)',
          '&:hover': { bgcolor: 'primary.dark' },
        }}
      >
        <MenuBookRoundedIcon fontSize="small" />
        Diccionario
      </Box>

      <Drawer
        anchor="bottom"
        open={dictionaryOpen}
        onClose={() => setDictionaryOpen(false)}
        PaperProps={{ sx: { height: '75vh', borderTopLeftRadius: 12, borderTopRightRadius: 12 } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 1.5, pt: 1 }}>
          <Box
            onClick={() => setDictionaryOpen(false)}
            sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'text.secondary' }}
            aria-label="Cerrar diccionario"
          >
            <CloseRoundedIcon fontSize="small" />
          </Box>
        </Box>
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <DataDictionaryBrowser readOnly />
        </Box>
      </Drawer>
    </Box>
  )
}

export default Layout
