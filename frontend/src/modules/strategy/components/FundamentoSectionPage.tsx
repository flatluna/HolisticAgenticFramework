import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, CircularProgress, Typography } from '@mui/material'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import { useAcumenBootstrap } from '../useAcumenBootstrap'
import { DirtyStateProvider, useDirtyState } from '../dirtyStateContext'

interface FundamentoSectionPageProps {
  icon: ReactNode
  gradient: string
  shadowColor: string
  title: string
  description: string
  children: ReactNode
  previousPath: string
  nextPath: string
}

// Shared chrome for each Fundamento sub-section page (Empresa, Org Design,
// Mandato, Business Strategy & Future-State): a "Fundamento" back link,
// a colorful header matching its overview card, the section form, and a
// bottom bar that moves to the previous/next section in the sequence.
// Wrapped in a DirtyStateProvider so the section below can report unsaved
// edits, which this shell then confirms before any navigation away.
export const FundamentoSectionPage = (props: FundamentoSectionPageProps) => {
  const ready = useAcumenBootstrap()
  return (
    <DirtyStateProvider>
      <FundamentoSectionPageContent {...props} ready={ready} />
    </DirtyStateProvider>
  )
}

const FundamentoSectionPageContent = ({
  icon,
  gradient,
  shadowColor,
  title,
  description,
  children,
  ready,
}: FundamentoSectionPageProps & { ready: boolean }) => {
  const navigate = useNavigate()
  const { isDirty } = useDirtyState()

  const confirmAndNavigate = (path: string) => {
    if (isDirty() && !window.confirm('Tienes cambios sin guardar en esta sección. ¿Deseas salir sin guardarlos?')) {
      return
    }
    navigate(path)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <Box sx={{ position: 'sticky', top: 0, zIndex: 2, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ px: 3, pt: 1.75 }}>
          <Button
            startIcon={<ArrowBackRoundedIcon />}
            size="small"
            color="inherit"
            onClick={() => confirmAndNavigate('/')}
            sx={{ color: 'text.secondary', px: 1 }}
          >
            Fundamento
          </Button>
        </Box>
        <Box sx={{ px: 3, pt: 0.75, pb: 2.25, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              flexShrink: 0,
              borderRadius: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: gradient,
              color: '#fff',
              boxShadow: `0 6px 14px ${shadowColor}`,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', lineHeight: 1.2 }}>
              Fundamento estratégico
            </Typography>
            <Typography variant="h2">{title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, p: 3 }}>
        {ready ? (
          children
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, py: 8 }}>
            <CircularProgress size={22} />
            <Typography variant="body2" color="text.secondary">
              Cargando datos de la empresa...
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}

