import { useState } from 'react'
import { Box, Toolbar } from '@mui/material'
import { Outlet } from 'react-router-dom'
import { TopInfoBar } from './TopInfoBar'
import { PhaseSidebar } from './PhaseSidebar'

const DRAWER_WIDTH = 232

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)

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
    </Box>
  )
}

export default Layout
