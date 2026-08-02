import { useEffect, useRef, useState } from 'react'
import { Box, Grid, TextField, Button, Card, CardContent, Typography, Snackbar, Alert, MenuItem, Select, FormControl, InputLabel, Tooltip, CircularProgress, Chip } from '@mui/material'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import { ChipListInput } from '@/shared/components/ChipListInput'
import { AzureMapsLocationSearch } from './AzureMapsLocationSearch'
import axios from 'axios'
import {
  createClientOrganization,
  createEngagement,
  createCompanyProfile,
  updateCompanyProfile,
  getCompanyProfile,
  lookupClientOrganizationByName,
} from '../services/api'
import { useDirtyState } from '../dirtyStateContext'
import { formatSectionDate } from '../sectionCatalog'

// Este caso de uso solo maneja UNA empresa (singleton). Una vez guardada,
// sus identificadores se persisten aquí para que el formulario pase a
// "modo edición" (UPDATE) en lugar de intentar crearla de nuevo.
const EMPRESA_STORAGE_KEY = 'aetp.empresa.perfil'

interface EmpresaGuardada {
  clientOrganizationId: string
  engagementId: string
  companyProfileId: string
  nombre: string
  industria: string
  fundacion: string
  empleados: string
  calle: string
  colonia: string
  ciudad: string
  estado: string
  pais: string
  codigoPostal: string
  telefonoCodigoPais: string
  telefono: string
  descripcion: string
  modeloIngresos: string
  mercados: string[]
  competidores: string[]
}

const industrias = [
  'Tecnología',
  'Manufactura',
  'Retail',
  'Finanzas',
  'Salud',
  'Energía',
  'Telecomunicaciones',
  'Educación',
  'Construcción',
  'Logística',
  'Otro',
]

const modelosIngresos = [
  'B2B (Empresa a empresa)',
  'B2C (Empresa a consumidor)',
  'SaaS (Software como servicio)',
  'Suscripción',
  'Transaccional',
  'Publicidad',
  'Licencias',
  'Consultoría',
  'Hybrid',
  'Otro',
]

export const EmpresaSection = () => {
  const [empresaGuardada, setEmpresaGuardada] = useState<EmpresaGuardada | null>(() => {
    const raw = localStorage.getItem(EMPRESA_STORAGE_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as EmpresaGuardada
    } catch {
      return null
    }
  })
  const isEditMode = empresaGuardada !== null

  // Perfil de empresa
  const [nombre, setNombre] = useState(empresaGuardada?.nombre ?? '')
  const [industria, setIndustria] = useState(empresaGuardada?.industria ?? '')
  const [fundacion, setFundacion] = useState(empresaGuardada?.fundacion ?? '')
  const [empleados, setEmpleados] = useState(empresaGuardada?.empleados ?? '')

  // Dirección, guardada como campos independientes (no un solo string)
  const [busquedaDireccion, setBusquedaDireccion] = useState(
    empresaGuardada ? [empresaGuardada.calle, empresaGuardada.ciudad, empresaGuardada.estado].filter(Boolean).join(', ') : '',
  )
  const [calle, setCalle] = useState(empresaGuardada?.calle ?? '')
  const [colonia, setColonia] = useState(empresaGuardada?.colonia ?? '')
  const [ciudad, setCiudad] = useState(empresaGuardada?.ciudad ?? '')
  const [estado, setEstado] = useState(empresaGuardada?.estado ?? '')
  const [pais, setPais] = useState(empresaGuardada?.pais ?? 'México')
  const [codigoPostal, setCodigoPostal] = useState(empresaGuardada?.codigoPostal ?? '')

  // Teléfono, con código de país independiente del número
  const [telefonoCodigoPais, setTelefonoCodigoPais] = useState(empresaGuardada?.telefonoCodigoPais ?? '52')
  const [telefono, setTelefono] = useState(empresaGuardada?.telefono ?? '')

  // Contexto de negocio
  const [descripcion, setDescripcion] = useState(empresaGuardada?.descripcion ?? '')
  const [modeloIngresos, setModeloIngresos] = useState(empresaGuardada?.modeloIngresos ?? '')
  const [mercados, setMercados] = useState<string[]>(empresaGuardada?.mercados ?? [])
  const [competidores, setCompetidores] = useState<string[]>(empresaGuardada?.competidores ?? [])

  const [saved, setSaved] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorGuardado, setErrorGuardado] = useState('')
  const [cargandoPerfil, setCargandoPerfil] = useState(isEditMode)
  const [actualizando, setActualizando] = useState(false)

  // Validaciones
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fechas reales de auditoría (SQL), para mostrar "Última actualización" en el formulario.
  const [perfilTimestamps, setPerfilTimestamps] = useState<{ createdAt?: string; updatedAt?: string }>({})

  // Aplica al formulario los datos de un CompanyProfile recién traído del backend.
  const aplicarPerfilBackend = (perfil: Awaited<ReturnType<typeof getCompanyProfile>>) => {
    setCalle(perfil.headquartersStreet ?? '')
    setColonia(perfil.headquartersNeighborhood ?? '')
    setCiudad(perfil.headquartersCity ?? '')
    setEstado(perfil.headquartersState ?? '')
    setPais(perfil.headquartersCountry ?? 'México')
    setCodigoPostal(perfil.headquartersPostalCode ?? '')
    setTelefonoCodigoPais(perfil.phoneCountryCode ?? '52')
    setTelefono(perfil.phone ?? '')
    if (perfil.totalEmployees !== undefined && perfil.totalEmployees !== null) {
      setEmpleados(String(perfil.totalEmployees))
    }
    setBusquedaDireccion(
      [perfil.headquartersStreet, perfil.headquartersCity, perfil.headquartersState].filter(Boolean).join(', '),
    )
    if (perfil.geographicMarkets) {
      try {
        setMercados(JSON.parse(perfil.geographicMarkets))
      } catch {
        // ignorar JSON inválido, dejar el valor actual
      }
    }
    if (perfil.keyProducts) {
      try {
        setCompetidores(JSON.parse(perfil.keyProducts))
      } catch {
        // ignorar JSON inválido, dejar el valor actual
      }
    }
    setPerfilTimestamps({ createdAt: perfil.createdAt, updatedAt: perfil.updatedAt })
  }

  // --- Rastreo de cambios sin guardar -------------------------------------
  // Compara los valores actuales del formulario contra la última copia
  // guardada/cargada, para advertir antes de navegar si hay ediciones
  // pendientes (ver FundamentoSectionPage, que confirma antes de salir).
  const { setDirty } = useDirtyState()
  const buildFormSnapshot = () =>
    JSON.stringify({
      nombre,
      industria,
      fundacion,
      empleados,
      calle,
      colonia,
      ciudad,
      estado,
      pais,
      codigoPostal,
      telefonoCodigoPais,
      telefono,
      descripcion,
      modeloIngresos,
      mercados,
      competidores,
    })
  const savedSnapshotRef = useRef(buildFormSnapshot())
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    const dirty = buildFormSnapshot() !== savedSnapshotRef.current
    setIsDirty(dirty)
    setDirty(dirty)
  })

  // Trae (o vuelve a traer) los datos reales desde el backend. Si ya sabemos
  // el engagementId (modo edición) lo usamos directo; si no, buscamos por
  // nombre — así detectamos que "ACUMEN" ya existe aunque el navegador haya
  // perdido la copia local (localStorage borrado, otra pestaña, etc.).
  const refrescarDesdeBackend = async () => {
    if (empresaGuardada) {
      const perfil = await getCompanyProfile(empresaGuardada.engagementId)
      aplicarPerfilBackend(perfil)
      return
    }

    const nombreBusqueda = nombre.trim() || 'ACUMEN'
    const encontrado = await lookupClientOrganizationByName(nombreBusqueda)
    if (!encontrado.engagementId || !encontrado.companyProfileId) {
      throw Object.assign(new Error('La empresa existe pero aún no tiene un perfil guardado'), {
        response: { status: 404 },
      })
    }

    const perfil = await getCompanyProfile(encontrado.engagementId)
    aplicarPerfilBackend(perfil)
    setNombre(nombreBusqueda)

    const nueva: EmpresaGuardada = {
      clientOrganizationId: encontrado.clientOrganizationId,
      engagementId: encontrado.engagementId,
      companyProfileId: encontrado.companyProfileId,
      nombre: nombreBusqueda,
      industria,
      fundacion,
      empleados,
      calle: perfil.headquartersStreet ?? '',
      colonia: perfil.headquartersNeighborhood ?? '',
      ciudad: perfil.headquartersCity ?? '',
      estado: perfil.headquartersState ?? '',
      pais: perfil.headquartersCountry ?? 'México',
      codigoPostal: perfil.headquartersPostalCode ?? '',
      telefonoCodigoPais: perfil.phoneCountryCode ?? '52',
      telefono: perfil.phone ?? '',
      descripcion,
      modeloIngresos,
      mercados,
      competidores,
    }
    localStorage.setItem(EMPRESA_STORAGE_KEY, JSON.stringify(nueva))
    setEmpresaGuardada(nueva)
  }

  // Ya "inició sesión" la empresa registrada: trae sus datos reales desde
  // el backend usando su engagementId, en vez de confiar solo en la copia
  // local guardada en el navegador.
  useEffect(() => {
    if (!empresaGuardada) return

    let cancelado = false
    getCompanyProfile(empresaGuardada.engagementId)
      .then((perfil) => {
        if (!cancelado) aplicarPerfilBackend(perfil)
      })
      .catch((err) => {
        if (cancelado) return
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          // El perfil ya no existe en el backend (p.ej. base de datos reiniciada);
          // olvidamos la copia local y volvemos a modo creación.
          localStorage.removeItem(EMPRESA_STORAGE_KEY)
          setEmpresaGuardada(null)
        }
      })
      .finally(() => {
        if (!cancelado) setCargandoPerfil(false)
      })

    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cada vez que termina una carga desde el backend, el formulario queda
  // "limpio" (sin cambios pendientes) — actualizamos la referencia base.
  useEffect(() => {
    if (!cargandoPerfil) {
      savedSnapshotRef.current = buildFormSnapshot()
      setIsDirty(false)
      setDirty(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargandoPerfil])


  const llenarDatosEjemplo = () => {
    setNombre('ACUMEN')
    setIndustria('Manufactura')
    setFundacion('2008-03-15')
    setEmpleados('320')
    setBusquedaDireccion('Av. Manuel L. Barragán 1000, San Nicolás de los Garza, Monterrey, Nuevo León, México')
    setCalle('Av. Manuel L. Barragán 1000')
    setColonia('Residencial San Nicolás')
    setCiudad('San Nicolás de los Garza')
    setEstado('Nuevo León')
    setPais('México')
    setCodigoPostal('66450')
    setTelefonoCodigoPais('52')
    setTelefono('818 123 4567')
    setDescripcion(
      'ACUMEN es una empresa manufacturera con sede en Monterrey especializada en el diseño y producción de mouses (ratones) para computadora, enfocada en calidad y ergonomía para clientes corporativos y distribuidores.',
    )
    setModeloIngresos('B2B (Empresa a empresa)')
    setMercados(['México', 'Estados Unidos'])
    setCompetidores(['Perifericos del Norte', 'TecnoMouse MX'])
    setErrors({})
    setErrorGuardado('')
  }

  const validarNombre = (value: string): string => {
    if (!value.trim()) return 'El nombre es requerido'
    if (value.length < 3) return 'Mínimo 3 caracteres'
    return ''
  }

  const validarEmpleados = (value: string): string => {
    if (!value) return 'Campo requerido'
    const num = parseInt(value, 10)
    if (isNaN(num)) return 'Debe ser un número'
    if (num < 1) return 'Debe ser mayor a 0'
    if (num > 999999) return 'Valor muy alto'
    return ''
  }

  const formatearEmpleados = (value: string): string => {
    return value.replace(/[^0-9]/g, '')
  }

  const validarTelefono = (value: string): string => {
    if (!value) return 'Campo requerido'
    const numerosSolos = value.replace(/[^0-9]/g, '')
    if (numerosSolos.length < 10) return 'Mínimo 10 dígitos'
    if (numerosSolos.length > 15) return 'Máximo 15 dígitos'
    return ''
  }

  const formatearTelefono = (value: string): string => {
    const numerosSolos = value.replace(/[^0-9]/g, '')
    // Formato: +52 (123) 456-7890
    if (numerosSolos.length === 0) return ''
    if (numerosSolos.length <= 3) return numerosSolos
    if (numerosSolos.length <= 6) return `${numerosSolos.slice(0, 3)} ${numerosSolos.slice(3)}`
    if (numerosSolos.length <= 10) return `${numerosSolos.slice(0, 3)} ${numerosSolos.slice(3, 6)} ${numerosSolos.slice(6)}`
    return numerosSolos.slice(0, 15)
  }

  const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const formatted = formatearTelefono(value)
    setTelefono(formatted)
    setErrors((prev) => ({ ...prev, telefono: validarTelefono(formatted) }))
  }

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNombre(value)
    setErrors((prev) => ({ ...prev, nombre: validarNombre(value) }))
  }

  const handleEmpleadosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = formatearEmpleados(e.target.value)
    setEmpleados(value)
    setErrors((prev) => ({ ...prev, empleados: validarEmpleados(value) }))
  }

  const isFormValid = (): boolean => {
    const newErrors: Record<string, string> = {}
    newErrors.nombre = validarNombre(nombre)
    newErrors.empleados = validarEmpleados(empleados)
    newErrors.telefono = validarTelefono(telefono)

    setErrors(newErrors)
    return Object.values(newErrors).every((err) => !err)
  }

  if (cargandoPerfil) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, py: 8 }}>
        <CircularProgress size={22} />
        <Typography variant="body2" color="text.secondary">
          Cargando datos de la empresa...
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Perfil de empresa */}
        <Card variant="outlined">
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Perfil de la empresa
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={actualizando ? <CircularProgress size={14} /> : <RefreshRoundedIcon />}
                  disabled={actualizando}
                  onClick={async () => {
                    setActualizando(true)
                    setErrorGuardado('')
                    try {
                      await refrescarDesdeBackend()
                    } catch (err) {
                      if (axios.isAxiosError(err) && err.response?.status === 404) {
                        setErrorGuardado(`No se encontró una empresa guardada${nombre.trim() ? ` con el nombre "${nombre.trim()}"` : ''} en el backend`)
                      } else {
                        setErrorGuardado('Ocurrió un error al actualizar los datos. Intenta de nuevo.')
                      }
                    } finally {
                      setActualizando(false)
                    }
                  }}
                >
                  {actualizando ? 'Actualizando...' : 'Actualizar'}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AutoFixHighRoundedIcon />}
                  onClick={llenarDatosEjemplo}
                >
                  Llenar con datos de ejemplo (ACUMEN)
                </Button>
              </Box>
            </Box>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <Tooltip title={isEditMode ? 'El nombre no se puede modificar una vez guardada la empresa' : ''}>
                  <TextField
                    label="Nombre de la empresa"
                    fullWidth
                    value={nombre}
                    onChange={handleNombreChange}
                    placeholder="Ej. Acme Corporation"
                    error={!!errors.nombre}
                    helperText={errors.nombre}
                    disabled={isEditMode}
                  />
                </Tooltip>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.industria} disabled={isEditMode}>
                  <InputLabel>Industria</InputLabel>
                  <Select
                    value={industria}
                    onChange={(e) => {
                      setIndustria(e.target.value)
                      setErrors((prev) => ({ ...prev, industria: e.target.value ? '' : 'Campo requerido' }))
                    }}
                    label="Industria"
                  >
                    <MenuItem value="">
                      <em>Seleccionar...</em>
                    </MenuItem>
                    {industrias.map((ind) => (
                      <MenuItem key={ind} value={ind}>
                        {ind}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Año de fundación"
                  type="date"
                  fullWidth
                  value={fundacion}
                  onChange={(e) => setFundacion(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Cantidad de empleados"
                  fullWidth
                  type="text"
                  value={empleados}
                  onChange={handleEmpleadosChange}
                  placeholder="Ej. 500"
                  error={!!errors.empleados}
                  helperText={errors.empleados}
                  inputProps={{ inputMode: 'numeric' }}
                />
              </Grid>
              <Grid item xs={12}>
                <AzureMapsLocationSearch
                  value={busquedaDireccion}
                  onChange={(location, details) => {
                    setBusquedaDireccion(location)
                    if (details) {
                      if (details.streetAddress) setCalle(details.streetAddress)
                      if (details.neighborhood) setColonia(details.neighborhood)
                      if (details.city) setCiudad(details.city)
                      if (details.state) setEstado(details.state)
                      if (details.country) setPais(details.country)
                      if (details.postalCode) setCodigoPostal(details.postalCode)
                    }
                  }}
                  placeholder="Busca una dirección para llenar los campos automáticamente"
                  label="Buscar dirección"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Calle y número"
                  fullWidth
                  value={calle}
                  onChange={(e) => setCalle(e.target.value)}
                  placeholder="Ej. Av. Manuel L. Barragán 1000"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Colonia"
                  fullWidth
                  value={colonia}
                  onChange={(e) => setColonia(e.target.value)}
                  placeholder="Ej. Residencial San Nicolás"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Ciudad"
                  fullWidth
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  placeholder="Ej. Monterrey"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Estado"
                  fullWidth
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  placeholder="Ej. Nuevo León"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Código postal"
                  fullWidth
                  value={codigoPostal}
                  onChange={(e) => setCodigoPostal(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Ej. 66450"
                  inputProps={{ maxLength: 10, inputMode: 'numeric' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="País"
                  fullWidth
                  value={pais}
                  onChange={(e) => setPais(e.target.value)}
                  placeholder="Ej. México"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <FormControl sx={{ width: 168, flexShrink: 0 }}>
                    <InputLabel>Código de país</InputLabel>
                    <Select
                      value={telefonoCodigoPais}
                      onChange={(e) => setTelefonoCodigoPais(e.target.value)}
                      label="Código de país"
                    >
                      <MenuItem value="52">México (+52)</MenuItem>
                      <MenuItem value="1">Estados Unidos (+1)</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label="Teléfono"
                    fullWidth
                    value={telefono}
                    onChange={handleTelefonoChange}
                    placeholder="123 456 7890"
                    error={!!errors.telefono}
                    helperText={errors.telefono}
                    inputProps={{ maxLength: 20 }}
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

      {/* Contexto de negocio */}
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            Contexto de negocio
          </Typography>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                label="Descripción del negocio"
                multiline
                minRows={3}
                fullWidth
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describe el modelo de negocio y actividades principales"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Modelo de ingresos principal</InputLabel>
                <Select value={modeloIngresos} onChange={(e) => setModeloIngresos(e.target.value)} label="Modelo de ingresos principal">
                  <MenuItem value="">
                    <em>Seleccionar...</em>
                  </MenuItem>
                  {modelosIngresos.map((modelo) => (
                    <MenuItem key={modelo} value={modelo}>
                      {modelo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <ChipListInput label="Mercados donde opera" items={mercados} onChange={setMercados} placeholder="Ej. México" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <ChipListInput
                label="Principales competidores"
                items={competidores}
                onChange={setCompetidores}
                placeholder="Nombre del competidor"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Botón guardar */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
        {isDirty && !guardando && (
          <Chip size="small" color="warning" variant="outlined" label="Cambios sin guardar" />
        )}
        {perfilTimestamps.updatedAt ? (
          <Typography variant="caption" color="text.secondary">
            Última actualización: {formatSectionDate(perfilTimestamps.updatedAt)}
          </Typography>
        ) : perfilTimestamps.createdAt ? (
          <Typography variant="caption" color="text.secondary">
            Creado: {formatSectionDate(perfilTimestamps.createdAt)}
          </Typography>
        ) : null}
        {errorGuardado && (
          <Typography variant="body2" color="error">
            {errorGuardado}
          </Typography>
        )}
        <Button
          variant="contained"
          startIcon={<SaveRoundedIcon />}
          disabled={guardando}
          onClick={async () => {
            setErrorGuardado('')
            if (!isFormValid()) return

            setGuardando(true)
            try {
              const datosActuales: Omit<EmpresaGuardada, 'clientOrganizationId' | 'engagementId' | 'companyProfileId'> = {
                nombre,
                industria,
                fundacion,
                empleados,
                calle,
                colonia,
                ciudad,
                estado,
                pais,
                codigoPostal,
                telefonoCodigoPais,
                telefono,
                descripcion,
                modeloIngresos,
                mercados,
                competidores,
              }

              if (isEditMode && empresaGuardada) {
                // Esta empresa ya existe (caso de uso de una sola empresa):
                // actualizamos en lugar de intentar crear de nuevo.
                const actualizadaPerfil = await updateCompanyProfile(empresaGuardada.engagementId, empresaGuardada.companyProfileId, {
                  headquartersStreet: calle || undefined,
                  headquartersNeighborhood: colonia || undefined,
                  headquartersCity: ciudad || undefined,
                  headquartersState: estado || undefined,
                  headquartersCountry: pais || undefined,
                  headquartersPostalCode: codigoPostal || undefined,
                  phoneCountryCode: telefonoCodigoPais || undefined,
                  phone: telefono || undefined,
                  totalEmployees: empleados ? parseInt(empleados, 10) : undefined,
                  geographicMarkets: JSON.stringify(mercados),
                  keyProducts: JSON.stringify(competidores),
                })

                const actualizada: EmpresaGuardada = { ...empresaGuardada, ...datosActuales }
                localStorage.setItem(EMPRESA_STORAGE_KEY, JSON.stringify(actualizada))
                setEmpresaGuardada(actualizada)
                setPerfilTimestamps({ createdAt: actualizadaPerfil.createdAt, updatedAt: actualizadaPerfil.updatedAt })
                window.dispatchEvent(new Event('empresa-perfil-updated'))
              } else {
                const cliente = await createClientOrganization({
                  name: nombre.trim(),
                  industry: industria || undefined,
                  country: 'México',
                  employeeCount: empleados ? parseInt(empleados, 10) : undefined,
                })

                const engagement = await createEngagement(cliente.id, {
                  name: `Transformación ${cliente.name}`,
                  description: descripcion || undefined,
                })

                const perfil = await createCompanyProfile(engagement.id, {
                  clientOrganizationId: cliente.id,
                  headquartersStreet: calle || undefined,
                  headquartersNeighborhood: colonia || undefined,
                  headquartersCity: ciudad || undefined,
                  headquartersState: estado || undefined,
                  headquartersCountry: pais || undefined,
                  headquartersPostalCode: codigoPostal || undefined,
                  phoneCountryCode: telefonoCodigoPais || undefined,
                  phone: telefono || undefined,
                  totalEmployees: empleados ? parseInt(empleados, 10) : undefined,
                  geographicMarkets: JSON.stringify(mercados),
                  keyProducts: JSON.stringify(competidores),
                })

                const nueva: EmpresaGuardada = {
                  clientOrganizationId: cliente.id,
                  engagementId: engagement.id,
                  companyProfileId: perfil.id,
                  ...datosActuales,
                }
                localStorage.setItem(EMPRESA_STORAGE_KEY, JSON.stringify(nueva))
                setEmpresaGuardada(nueva)
                setPerfilTimestamps({ createdAt: perfil.createdAt, updatedAt: perfil.updatedAt })
                window.dispatchEvent(new Event('empresa-perfil-updated'))
              }

              savedSnapshotRef.current = buildFormSnapshot()
              setIsDirty(false)
              setDirty(false)
              setSaved(true)
            } catch (err) {
              console.error('Error saving company profile:', err)
              if (axios.isAxiosError(err)) {
                console.error('Response status:', err.response?.status)
                console.error('Response data:', err.response?.data)
              }
              if (axios.isAxiosError(err) && err.response?.status === 409) {
                setErrorGuardado(err.response.data?.error || 'Ya existe una empresa registrada con ese nombre')
              } else {
                setErrorGuardado('Ocurrió un error al guardar. Intenta de nuevo.')
              }
            } finally {
              setGuardando(false)
            }
          }}
        >
          {guardando ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Guardar'}
        </Button>
      </Box>

      <Snackbar open={saved} autoHideDuration={2500} onClose={() => setSaved(false)}>
        <Alert severity="success" variant="filled">
          Cambios guardados
        </Alert>
      </Snackbar>
    </Box>
  )
}
