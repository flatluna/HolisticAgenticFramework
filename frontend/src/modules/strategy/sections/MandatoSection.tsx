import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  IconButton,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import axios from 'axios'
import { getEngagementMandate, saveEngagementMandate } from '../services/api'

interface StakeholderRow {
  id: number
  stakeholder: string
  rol: string
}

interface FormState {
  tituloMandato: string
  objetivoMandato: string
  alcanceIncluido: string
  alcanceExcluido: string
  patrocinadorEjecutivo: string
  responsabilidadesPatrocinador: string
  resultadosEsperados: string
  criterioExito: string
  horizonteMinMeses: number | ''
  horizonteMaxMeses: number | ''
  metaCrecimientoIngresosPct: number | ''
  metaReduccionCostosPct: number | ''
  metaMejoraProductividadPct: number | ''
  metaMejoraSlaPct: number | ''
}

const initialState: FormState = {
  tituloMandato: 'Transformacion Empresarial con IA Agentica',
  objetivoMandato:
    'Definir una hoja de ruta empresarial para identificar, priorizar, disenar e implementar capacidades de IA Agentica que generen valor medible.',
  alcanceIncluido:
    '- Evaluacion de estrategia y prioridades del negocio\n- Identificacion de oportunidades de IA y automatizacion\n- Definicion de casos de uso prioritarios\n- Diseno de roadmap de implementacion',
  alcanceExcluido:
    '- Desarrollo tecnico completo\n- Compra de licencias\n- Operacion de largo plazo\n- Soporte productivo posterior',
  patrocinadorEjecutivo: 'Director General (CEO)',
  responsabilidadesPatrocinador:
    '- Aprobar vision estrategica\n- Remover obstaculos\n- Asegurar recursos\n- Validar decisiones clave',
  resultadosEsperados:
    '1. Casos de uso priorizados y aprobados\n2. Modelo operativo objetivo\n3. Arquitectura recomendada\n4. Gobierno y riesgos definidos\n5. Roadmap a 12-24 meses\n6. Business case con KPIs\n7. Plan de adopcion',
  criterioExito:
    'La organizacion cuenta con una vision clara, priorizada y aprobada para evolucionar hacia una empresa impulsada por IA Agentica.',
  horizonteMinMeses: 12,
  horizonteMaxMeses: 24,
  metaCrecimientoIngresosPct: 12,
  metaReduccionCostosPct: 18,
  metaMejoraProductividadPct: 20,
  metaMejoraSlaPct: 25,
}

const initialStakeholders: StakeholderRow[] = [
  { id: 1, stakeholder: 'CEO', rol: 'Patrocinio ejecutivo y aprobacion final' },
  { id: 2, stakeholder: 'COO', rol: 'Transformacion de procesos operativos' },
  { id: 3, stakeholder: 'CIO/CTO', rol: 'Arquitectura tecnologica e integracion' },
  { id: 4, stakeholder: 'CFO', rol: 'Analisis financiero y medicion de valor' },
]

export const MandatoSection = () => {
  const EMPRESA_STORAGE_KEY = 'aetp.empresa.perfil'
  const [form, setForm] = useState<FormState>(initialState)
  const [stakeholders, setStakeholders] = useState<StakeholderRow[]>(initialStakeholders)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [ok, setOk] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [errorGuardado, setErrorGuardado] = useState('')

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

  const nextStakeholderId = useMemo(() => {
    if (stakeholders.length === 0) return 1
    return Math.max(...stakeholders.map((s) => s.id)) + 1
  }, [stakeholders])

  const setText = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const setNumber = (key: keyof FormState, value: string) => {
    const parsed = value === '' ? '' : Number(value)
    setForm((prev) => ({ ...prev, [key]: Number.isNaN(parsed) ? '' : parsed }))
  }

  const addStakeholder = () => {
    setStakeholders((prev) => [...prev, { id: nextStakeholderId, stakeholder: '', rol: '' }])
  }

  const updateStakeholder = (id: number, patch: Partial<StakeholderRow>) => {
    setStakeholders((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  const removeStakeholder = (id: number) => {
    setStakeholders((prev) => prev.filter((row) => row.id !== id))
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}

    if (!form.tituloMandato.trim()) nextErrors.tituloMandato = 'El titulo del mandato es obligatorio.'
    if (!form.objetivoMandato.trim() || form.objetivoMandato.trim().length < 30) {
      nextErrors.objetivoMandato = 'El objetivo debe tener al menos 30 caracteres.'
    }
    if (!form.alcanceIncluido.trim()) nextErrors.alcanceIncluido = 'Define al menos un elemento incluido.'
    if (!form.alcanceExcluido.trim()) nextErrors.alcanceExcluido = 'Define al menos un elemento excluido.'
    if (!form.patrocinadorEjecutivo.trim()) nextErrors.patrocinadorEjecutivo = 'El patrocinador es obligatorio.'
    if (!form.responsabilidadesPatrocinador.trim()) {
      nextErrors.responsabilidadesPatrocinador = 'Describe las responsabilidades del patrocinador.'
    }
    if (!form.resultadosEsperados.trim()) nextErrors.resultadosEsperados = 'Agrega los resultados esperados.'
    if (!form.criterioExito.trim()) nextErrors.criterioExito = 'Define el criterio de exito.'

    if (form.horizonteMinMeses === '' || form.horizonteMinMeses < 1) {
      nextErrors.horizonteMinMeses = 'Minimo 1 mes.'
    }
    if (form.horizonteMaxMeses === '' || form.horizonteMaxMeses < 1) {
      nextErrors.horizonteMaxMeses = 'Minimo 1 mes.'
    }
    if (
      form.horizonteMinMeses !== '' &&
      form.horizonteMaxMeses !== '' &&
      form.horizonteMinMeses > form.horizonteMaxMeses
    ) {
      nextErrors.horizonteMaxMeses = 'El maximo debe ser mayor o igual al minimo.'
    }

    const percentFields: Array<[keyof FormState, string]> = [
      ['metaCrecimientoIngresosPct', 'Meta de crecimiento de ingresos'],
      ['metaReduccionCostosPct', 'Meta de reduccion de costos'],
      ['metaMejoraProductividadPct', 'Meta de mejora de productividad'],
      ['metaMejoraSlaPct', 'Meta de mejora de SLA'],
    ]

    percentFields.forEach(([key, label]) => {
      const value = form[key]
      if (value === '' || value < 0 || value > 100) {
        nextErrors[key] = `${label}: usa un porcentaje entre 0 y 100.`
      }
    })

    if (stakeholders.length === 0) {
      nextErrors.stakeholders = 'Agrega al menos un stakeholder clave.'
    }

    stakeholders.forEach((row) => {
      if (!row.stakeholder.trim()) {
        nextErrors[`stakeholder-${row.id}`] = 'Nombre requerido.'
      }
      if (!row.rol.trim()) {
        nextErrors[`rol-${row.id}`] = 'Rol requerido.'
      }
    })

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleValidate = () => {
    if (validate()) {
      setOk(true)
    }
  }

  useEffect(() => {
    const engagementId = obtenerEngagementIdGuardado()
    if (!engagementId) return

    setCargando(true)
    getEngagementMandate(engagementId)
      .then((data) => {
        setForm((prev) => ({
          ...prev,
          tituloMandato: data.title ?? prev.tituloMandato,
          objetivoMandato: data.objective ?? prev.objetivoMandato,
          alcanceIncluido: data.includedScope ?? prev.alcanceIncluido,
          alcanceExcluido: data.excludedScope ?? prev.alcanceExcluido,
          patrocinadorEjecutivo: data.executiveSponsor ?? prev.patrocinadorEjecutivo,
          responsabilidadesPatrocinador: data.sponsorResponsibilities ?? prev.responsabilidadesPatrocinador,
          resultadosEsperados: data.expectedOutcomes ?? prev.resultadosEsperados,
          criterioExito: data.successCriteria ?? prev.criterioExito,
          horizonteMinMeses: data.horizonMinMonths ?? prev.horizonteMinMeses,
          horizonteMaxMeses: data.horizonMaxMonths ?? prev.horizonteMaxMeses,
          metaCrecimientoIngresosPct: data.revenueGrowthTargetPct ?? prev.metaCrecimientoIngresosPct,
          metaReduccionCostosPct: data.costReductionTargetPct ?? prev.metaReduccionCostosPct,
          metaMejoraProductividadPct: data.productivityImprovementTargetPct ?? prev.metaMejoraProductividadPct,
          metaMejoraSlaPct: data.slaImprovementTargetPct ?? prev.metaMejoraSlaPct,
        }))

        if (data.stakeholders && data.stakeholders.length > 0) {
          setStakeholders(
            data.stakeholders.map((s, idx) => ({
              id: idx + 1,
              stakeholder: s.stakeholder,
              rol: s.role,
            })),
          )
        }
      })
      .catch(() => {
        // If loading fails, keep editable defaults so user can still save.
      })
      .finally(() => setCargando(false))
  }, [])

  const handleGuardar = async () => {
    setErrorGuardado('')
    if (!validate()) return

    const engagementId = obtenerEngagementIdGuardado()
    if (!engagementId) {
      setErrorGuardado('Primero guarda la empresa en la pestana Empresa para obtener el engagementId.')
      return
    }

    setGuardando(true)
    try {
      await saveEngagementMandate(engagementId, {
        title: form.tituloMandato,
        objective: form.objetivoMandato,
        includedScope: form.alcanceIncluido,
        excludedScope: form.alcanceExcluido,
        executiveSponsor: form.patrocinadorEjecutivo,
        sponsorResponsibilities: form.responsabilidadesPatrocinador,
        expectedOutcomes: form.resultadosEsperados,
        successCriteria: form.criterioExito,
        horizonMinMonths: form.horizonteMinMeses === '' ? undefined : form.horizonteMinMeses,
        horizonMaxMonths: form.horizonteMaxMeses === '' ? undefined : form.horizonteMaxMeses,
        revenueGrowthTargetPct:
          form.metaCrecimientoIngresosPct === '' ? undefined : form.metaCrecimientoIngresosPct,
        costReductionTargetPct: form.metaReduccionCostosPct === '' ? undefined : form.metaReduccionCostosPct,
        productivityImprovementTargetPct:
          form.metaMejoraProductividadPct === '' ? undefined : form.metaMejoraProductividadPct,
        slaImprovementTargetPct: form.metaMejoraSlaPct === '' ? undefined : form.metaMejoraSlaPct,
        stakeholders: stakeholders.map((s) => ({ stakeholder: s.stakeholder, role: s.rol })),
      })
      setOk(true)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setErrorGuardado(err.response.data.error)
      } else {
        setErrorGuardado('No se pudo guardar el mandato. Intenta de nuevo.')
      }
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Mandato del Engagement
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Completa cada propiedad con tipo de dato definido (texto, numerico o textarea) y valida que el mandato este
          listo para ejecucion.
        </Typography>

        {cargando && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Cargando mandato guardado...
          </Alert>
        )}

        {errorGuardado && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorGuardado}
          </Alert>
        )}

        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <TextField
              label="Titulo del mandato"
              fullWidth
              value={form.tituloMandato}
              onChange={(e) => setText('tituloMandato', e.target.value)}
              error={!!errors.tituloMandato}
              helperText={errors.tituloMandato}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Objetivo del mandato"
              multiline
              minRows={3}
              fullWidth
              value={form.objetivoMandato}
              onChange={(e) => setText('objetivoMandato', e.target.value)}
              error={!!errors.objetivoMandato}
              helperText={errors.objetivoMandato || 'Textarea: explica el valor de negocio que se busca.'}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Alcance incluido"
              multiline
              minRows={6}
              fullWidth
              value={form.alcanceIncluido}
              onChange={(e) => setText('alcanceIncluido', e.target.value)}
              error={!!errors.alcanceIncluido}
              helperText={errors.alcanceIncluido || 'Textarea: un elemento por linea.'}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Alcance excluido"
              multiline
              minRows={6}
              fullWidth
              value={form.alcanceExcluido}
              onChange={(e) => setText('alcanceExcluido', e.target.value)}
              error={!!errors.alcanceExcluido}
              helperText={errors.alcanceExcluido || 'Textarea: un elemento por linea.'}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Patrocinador ejecutivo"
              fullWidth
              value={form.patrocinadorEjecutivo}
              onChange={(e) => setText('patrocinadorEjecutivo', e.target.value)}
              error={!!errors.patrocinadorEjecutivo}
              helperText={errors.patrocinadorEjecutivo || 'Texto corto. Ej. Director General (CEO).'}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Responsabilidades del patrocinador"
              multiline
              minRows={4}
              fullWidth
              value={form.responsabilidadesPatrocinador}
              onChange={(e) => setText('responsabilidadesPatrocinador', e.target.value)}
              error={!!errors.responsabilidadesPatrocinador}
              helperText={errors.responsabilidadesPatrocinador || 'Textarea: una responsabilidad por linea.'}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Stakeholders clave
              </Typography>
              <Button size="small" startIcon={<AddRoundedIcon />} onClick={addStakeholder}>
                Agregar stakeholder
              </Button>
            </Box>
            {errors.stakeholders && (
              <Typography variant="caption" color="error">
                {errors.stakeholders}
              </Typography>
            )}
          </Grid>

          {stakeholders.map((row) => (
            <Grid item xs={12} key={row.id}>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                <TextField
                  label="Stakeholder"
                  fullWidth
                  value={row.stakeholder}
                  onChange={(e) => updateStakeholder(row.id, { stakeholder: e.target.value })}
                  error={!!errors[`stakeholder-${row.id}`]}
                  helperText={errors[`stakeholder-${row.id}`]}
                />
                <TextField
                  label="Rol"
                  fullWidth
                  value={row.rol}
                  onChange={(e) => updateStakeholder(row.id, { rol: e.target.value })}
                  error={!!errors[`rol-${row.id}`]}
                  helperText={errors[`rol-${row.id}`]}
                />
                <IconButton aria-label="eliminar stakeholder" onClick={() => removeStakeholder(row.id)}>
                  <DeleteRoundedIcon />
                </IconButton>
              </Box>
            </Grid>
          ))}

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Horizonte minimo (meses)"
              type="number"
              fullWidth
              value={form.horizonteMinMeses}
              onChange={(e) => setNumber('horizonteMinMeses', e.target.value)}
              error={!!errors.horizonteMinMeses}
              helperText={errors.horizonteMinMeses || 'Numerico. Ej. 12'}
              inputProps={{ min: 1 }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Horizonte maximo (meses)"
              type="number"
              fullWidth
              value={form.horizonteMaxMeses}
              onChange={(e) => setNumber('horizonteMaxMeses', e.target.value)}
              error={!!errors.horizonteMaxMeses}
              helperText={errors.horizonteMaxMeses || 'Numerico. Ej. 24'}
              inputProps={{ min: 1 }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Meta crecimiento de ingresos (%)"
              type="number"
              fullWidth
              value={form.metaCrecimientoIngresosPct}
              onChange={(e) => setNumber('metaCrecimientoIngresosPct', e.target.value)}
              error={!!errors.metaCrecimientoIngresosPct}
              helperText={errors.metaCrecimientoIngresosPct || 'Numerico 0-100'}
              inputProps={{ min: 0, max: 100 }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Meta reduccion de costos (%)"
              type="number"
              fullWidth
              value={form.metaReduccionCostosPct}
              onChange={(e) => setNumber('metaReduccionCostosPct', e.target.value)}
              error={!!errors.metaReduccionCostosPct}
              helperText={errors.metaReduccionCostosPct || 'Numerico 0-100'}
              inputProps={{ min: 0, max: 100 }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Meta mejora de productividad (%)"
              type="number"
              fullWidth
              value={form.metaMejoraProductividadPct}
              onChange={(e) => setNumber('metaMejoraProductividadPct', e.target.value)}
              error={!!errors.metaMejoraProductividadPct}
              helperText={errors.metaMejoraProductividadPct || 'Numerico 0-100'}
              inputProps={{ min: 0, max: 100 }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Meta mejora SLA / tiempo de respuesta (%)"
              type="number"
              fullWidth
              value={form.metaMejoraSlaPct}
              onChange={(e) => setNumber('metaMejoraSlaPct', e.target.value)}
              error={!!errors.metaMejoraSlaPct}
              helperText={errors.metaMejoraSlaPct || 'Numerico 0-100'}
              inputProps={{ min: 0, max: 100 }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Resultados esperados"
              multiline
              minRows={5}
              fullWidth
              value={form.resultadosEsperados}
              onChange={(e) => setText('resultadosEsperados', e.target.value)}
              error={!!errors.resultadosEsperados}
              helperText={errors.resultadosEsperados || 'Textarea: enumera resultados y entregables.'}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Criterio de exito"
              multiline
              minRows={3}
              fullWidth
              value={form.criterioExito}
              onChange={(e) => setText('criterioExito', e.target.value)}
              error={!!errors.criterioExito}
              helperText={errors.criterioExito || 'Textarea: como sabremos que el mandato se cumplio.'}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button variant="outlined" onClick={handleValidate}>
            Validar mandato
          </Button>
          <Button variant="contained" onClick={handleGuardar} disabled={guardando || cargando}>
            {guardando ? 'Guardando...' : 'Guardar'}
          </Button>
        </Box>
      </CardContent>

      <Snackbar open={ok} autoHideDuration={3000} onClose={() => setOk(false)}>
        <Alert severity="success" onClose={() => setOk(false)}>
          Mandato validado correctamente.
        </Alert>
      </Snackbar>
    </Card>
  )
}
