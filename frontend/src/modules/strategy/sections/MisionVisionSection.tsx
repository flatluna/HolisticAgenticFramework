import { useEffect, useState } from 'react'
import { Card, CardContent, Typography, TextField, Grid, Box, Button, Alert, Snackbar } from '@mui/material'
import { ChipListInput } from '@/shared/components/ChipListInput'
import axios from 'axios'
import { getEngagementMissionVision, saveEngagementMissionVision } from '../services/api'

interface AutomationTargets {
  atencionCliente: number | null
  finanzas: number | null
  recursosHumanos: number | null
  marketing: number | null
  ventas: number | null
  operaciones: number | null
  analiticaReportes: number | null
}

interface MissionVisionStructuredForm {
  strategyTitle: string
  companyName: string
  sector: string
  direccionGeneral: string
  visionEjecutiva: string
  misionHoy: string
  valorActual: string[]
  clientesObjetivo: string[]
  visionObjetivo: string
  automationTargets: AutomationTargets
  crecimiento: string[]
  eficiencia: string[]
  calidad: string[]
  innovacion: string[]
  principiosTransformacion: string[]
  declaracionFinal: string
}

const defaultTargets: AutomationTargets = {
  atencionCliente: null,
  finanzas: null,
  recursosHumanos: null,
  marketing: null,
  ventas: null,
  operaciones: null,
  analiticaReportes: null,
}

const defaultFormState: MissionVisionStructuredForm = {
  strategyTitle: 'Estrategia Global del Negocio',
  companyName: '',
  sector: '',
  direccionGeneral: '',
  visionEjecutiva: '',
  misionHoy: '',
  valorActual: [],
  clientesObjetivo: [],
  visionObjetivo: '',
  automationTargets: defaultTargets,
  crecimiento: [],
  eficiencia: [],
  calidad: [],
  innovacion: [],
  principiosTransformacion: [],
  declaracionFinal: '',
}

const sampleFormState: MissionVisionStructuredForm = {
  strategyTitle: 'Estrategia Global del Negocio',
  companyName: 'NovaFlow Solutions',
  sector: 'Servicios empresariales digitales y operaciones administradas mediante IA',
  direccionGeneral:
    'NovaFlow busca convertirse en una empresa altamente automatizada donde agentes de IA ejecuten la mayoria de procesos operativos y administrativos con supervision humana en decisiones criticas.',
  visionEjecutiva:
    'Operar una organizacion donde mas del 80% de procesos repetitivos y basados en conocimiento sean ejecutados por agentes de IA coordinados.',
  misionHoy:
    'Ayudar a pequenas y medianas empresas a optimizar operaciones mediante servicios digitales que reduzcan costos y mejoren la productividad.',
  valorActual: [
    'Soporte operativo',
    'Gestion administrativa',
    'Atencion a clientes',
    'Analisis de informacion y reportes',
    'Optimizacion de procesos',
  ],
  clientesObjetivo: [
    'Pequenas y medianas empresas',
    'Empresas en crecimiento',
    'Organizaciones que buscan transformacion digital',
  ],
  visionObjetivo:
    'En 12-36 meses evolucionar a un modelo AI-First Enterprise con operaciones escalables, decisiones basadas en evidencia y monitoreo continuo.',
  automationTargets: {
    atencionCliente: 80,
    finanzas: 85,
    recursosHumanos: 75,
    marketing: 90,
    ventas: 80,
    operaciones: 90,
    analiticaReportes: 95,
  },
  crecimiento: [
    'Incrementar ingresos en 200% en 3 anos',
    'Expandir operaciones a nuevos mercados',
    'Duplicar capacidad de atencion sin crecer plantilla al mismo ritmo',
  ],
  eficiencia: [
    'Reducir costos operativos en 40%',
    'Reducir tiempos de respuesta en 70%',
    'Disminuir errores operativos en 90%',
  ],
  calidad: [
    'Satisfaccion del cliente superior al 95%',
    'Disponibilidad de servicios 24/7',
    'Consistencia operativa superior al 98%',
  ],
  innovacion: [
    'Lanzamiento anual de nuevos servicios basados en IA',
    'Mejora continua impulsada por datos y aprendizaje de agentes',
  ],
  principiosTransformacion: [
    'IA como amplificador del negocio',
    'Humano en el circuito',
    'Automatizar primero',
    'Decisiones basadas en evidencia',
    'Escalabilidad desde el diseno',
    'Seguridad y gobernanza',
    'Medicion continua de valor',
    'Mejora continua',
  ],
  declaracionFinal:
    'Construiremos una empresa AI-First donde personas y agentes colaboren para crear una organizacion mas rapida, eficiente y orientada a resultados.',
}


const parsePercent = (raw: string): number | null => {
  if (!raw.trim()) return null
  const parsed = Number(raw)
  if (Number.isNaN(parsed)) return null
  return Math.min(100, Math.max(0, parsed))
}

export const MisionVisionSection = () => {
  const EMPRESA_STORAGE_KEY = 'aetp.empresa.perfil'
  const [form, setForm] = useState<MissionVisionStructuredForm>(defaultFormState)
  const [guardando, setGuardando] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [errorGuardado, setErrorGuardado] = useState('')
  const [guardado, setGuardado] = useState(false)

  const updateField = <K extends keyof MissionVisionStructuredForm>(field: K, value: MissionVisionStructuredForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const updateTarget = (field: keyof AutomationTargets, value: string) => {
    setForm((current) => ({
      ...current,
      automationTargets: {
        ...current.automationTargets,
        [field]: parsePercent(value),
      },
    }))
  }

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

  useEffect(() => {
    const engagementId = obtenerEngagementIdGuardado()
    if (!engagementId) return

    setCargando(true)
    getEngagementMissionVision(engagementId)
      .then((data) => {
        setForm({
          strategyTitle: data.strategyTitle ?? defaultFormState.strategyTitle,
          companyName: data.companyName ?? '',
          sector: data.sector ?? '',
          direccionGeneral: data.directionGeneral ?? '',
          visionEjecutiva: data.vision ?? '',
          misionHoy: data.mission ?? '',
          valorActual: data.valorActual ?? [],
          clientesObjetivo: data.clientesObjetivo ?? [],
          visionObjetivo: data.visionObjetivo ?? '',
          automationTargets: {
            atencionCliente: data.automationTargets?.atencionCliente ?? null,
            finanzas: data.automationTargets?.finanzas ?? null,
            recursosHumanos: data.automationTargets?.recursosHumanos ?? null,
            marketing: data.automationTargets?.marketing ?? null,
            ventas: data.automationTargets?.ventas ?? null,
            operaciones: data.automationTargets?.operaciones ?? null,
            analiticaReportes: data.automationTargets?.analiticaReportes ?? null,
          },
          crecimiento: data.crecimiento ?? [],
          eficiencia: data.eficiencia ?? [],
          calidad: data.calidad ?? [],
          innovacion: data.innovacion ?? [],
          principiosTransformacion: data.principles ?? [],
          declaracionFinal: data.declaracionFinal ?? '',
        })
      })
      .catch(() => {
        // Keep fields editable with empty defaults when loading fails.
      })
      .finally(() => setCargando(false))
  }, [])

  const guardar = async () => {
    setErrorGuardado('')
    if (!form.strategyTitle.trim()) {
      setErrorGuardado('El titulo de la estrategia es obligatorio.')
      return
    }
    if (!form.misionHoy.trim()) {
      setErrorGuardado('La mision es obligatoria.')
      return
    }
    if (!form.visionEjecutiva.trim()) {
      setErrorGuardado('La vision es obligatoria.')
      return
    }

    const engagementId = obtenerEngagementIdGuardado()
    if (!engagementId) {
      setErrorGuardado('Primero guarda la empresa en la pestana Empresa para obtener el engagementId.')
      return
    }

    setGuardando(true)
    try {
      await saveEngagementMissionVision(engagementId, {
        strategyTitle: form.strategyTitle,
        companyName: form.companyName,
        sector: form.sector,
        directionGeneral: form.direccionGeneral,
        mission: form.misionHoy,
        vision: form.visionEjecutiva,
        visionObjetivo: form.visionObjetivo,
        automationTargets: {
          atencionCliente: form.automationTargets.atencionCliente ?? undefined,
          finanzas: form.automationTargets.finanzas ?? undefined,
          recursosHumanos: form.automationTargets.recursosHumanos ?? undefined,
          marketing: form.automationTargets.marketing ?? undefined,
          ventas: form.automationTargets.ventas ?? undefined,
          operaciones: form.automationTargets.operaciones ?? undefined,
          analiticaReportes: form.automationTargets.analiticaReportes ?? undefined,
        },
        valorActual: form.valorActual,
        clientesObjetivo: form.clientesObjetivo,
        crecimiento: form.crecimiento,
        eficiencia: form.eficiencia,
        calidad: form.calidad,
        innovacion: form.innovacion,
        principles: form.principiosTransformacion,
        declaracionFinal: form.declaracionFinal,
      })
      setGuardado(true)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setErrorGuardado(err.response.data.error)
      } else {
        setErrorGuardado('No se pudo guardar Mision y Vision. Intenta de nuevo.')
      }
    } finally {
      setGuardando(false)
    }
  }

  const cargarCamposDePrueba = () => {
    setForm(sampleFormState)
    setErrorGuardado('')
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          Mision y vision con campos estructurados
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Completa la estrategia con campos separados para evitar bloques largos de texto pegado.
        </Typography>

        {cargando && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Cargando Mision y Vision guardadas...
          </Alert>
        )}

        {errorGuardado && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorGuardado}
          </Alert>
        )}

        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={8}>
            <TextField
              label="Titulo de la estrategia"
              fullWidth
              value={form.strategyTitle}
              onChange={(e) => updateField('strategyTitle', e.target.value)}
              placeholder="Ej. Estrategia Global del Negocio"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Empresa"
              fullWidth
              value={form.companyName}
              onChange={(e) => updateField('companyName', e.target.value)}
              placeholder="Ej. NovaFlow Solutions"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Sector"
              fullWidth
              value={form.sector}
              onChange={(e) => updateField('sector', e.target.value)}
              placeholder="Ej. Servicios empresariales digitales"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Direccion general"
              multiline
              minRows={3}
              fullWidth
              value={form.direccionGeneral}
              onChange={(e) => updateField('direccionGeneral', e.target.value)}
              placeholder="En que direccion se movera la empresa y como colaboraran personas y agentes IA"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Mision de negocio (hoy)"
              multiline
              minRows={4}
              fullWidth
              value={form.misionHoy}
              onChange={(e) => updateField('misionHoy', e.target.value)}
              placeholder="Que valor entrega hoy la empresa y a quien"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Vision ejecutiva"
              multiline
              minRows={4}
              fullWidth
              value={form.visionEjecutiva}
              onChange={(e) => updateField('visionEjecutiva', e.target.value)}
              placeholder="Estado objetivo AI-First con supervision humana"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Vision objetivo (12-36 meses)"
              multiline
              minRows={3}
              fullWidth
              value={form.visionObjetivo}
              onChange={(e) => updateField('visionObjetivo', e.target.value)}
              placeholder="Describe como se vera la empresa en 12-36 meses"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <ChipListInput
              label="Valor que entrega actualmente"
              items={form.valorActual}
              onChange={(items) => updateField('valorActual', items)}
              placeholder="Ej. Soporte operativo"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <ChipListInput
              label="Clientes objetivo"
              items={form.clientesObjetivo}
              onChange={(items) => updateField('clientesObjetivo', items)}
              placeholder="Ej. PYMEs en crecimiento"
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Nivel de automatizacion objetivo (%)
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              label="Atencion cliente"
              type="number"
              fullWidth
              value={form.automationTargets.atencionCliente ?? ''}
              onChange={(e) => updateTarget('atencionCliente', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              label="Finanzas"
              type="number"
              fullWidth
              value={form.automationTargets.finanzas ?? ''}
              onChange={(e) => updateTarget('finanzas', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              label="Recursos humanos"
              type="number"
              fullWidth
              value={form.automationTargets.recursosHumanos ?? ''}
              onChange={(e) => updateTarget('recursosHumanos', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              label="Marketing"
              type="number"
              fullWidth
              value={form.automationTargets.marketing ?? ''}
              onChange={(e) => updateTarget('marketing', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              label="Ventas"
              type="number"
              fullWidth
              value={form.automationTargets.ventas ?? ''}
              onChange={(e) => updateTarget('ventas', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              label="Operaciones"
              type="number"
              fullWidth
              value={form.automationTargets.operaciones ?? ''}
              onChange={(e) => updateTarget('operaciones', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              label="Analitica/reportes"
              type="number"
              fullWidth
              value={form.automationTargets.analiticaReportes ?? ''}
              onChange={(e) => updateTarget('analiticaReportes', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <ChipListInput
              label="Resultados esperados - Crecimiento"
              items={form.crecimiento}
              onChange={(items) => updateField('crecimiento', items)}
              placeholder="Ej. Incrementar ingresos 200% en 3 anos"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <ChipListInput
              label="Resultados esperados - Eficiencia"
              items={form.eficiencia}
              onChange={(items) => updateField('eficiencia', items)}
              placeholder="Ej. Reducir costos operativos 40%"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <ChipListInput
              label="Resultados esperados - Calidad"
              items={form.calidad}
              onChange={(items) => updateField('calidad', items)}
              placeholder="Ej. Satisfaccion del cliente superior al 95%"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <ChipListInput
              label="Resultados esperados - Innovacion"
              items={form.innovacion}
              onChange={(items) => updateField('innovacion', items)}
              placeholder="Ej. Nuevos servicios basados en IA cada ano"
            />
          </Grid>

          <Grid item xs={12}>
            <ChipListInput
              label="Principios de transformacion"
              items={form.principiosTransformacion}
              onChange={(items) => updateField('principiosTransformacion', items)}
              placeholder="Ej. Human-in-the-loop, Seguridad por diseno, Medir ROI"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Declaracion estrategica final"
              multiline
              minRows={4}
              fullWidth
              value={form.declaracionFinal}
              onChange={(e) => updateField('declaracionFinal', e.target.value)}
              placeholder="Define la declaracion final de la estrategia"
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button variant="outlined" onClick={cargarCamposDePrueba} disabled={guardando || cargando}>
                Cargar prueba
              </Button>
              <Button variant="contained" onClick={guardar} disabled={guardando || cargando}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>

      <Snackbar open={guardado} autoHideDuration={3000} onClose={() => setGuardado(false)}>
        <Alert severity="success" onClose={() => setGuardado(false)}>
          Mision y Vision guardadas correctamente.
        </Alert>
      </Snackbar>
    </Card>
  )
}
