import { useState } from 'react'
import { Box, Card, Chip, MenuItem, TextField, Typography } from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import InputAdornment from '@mui/material/InputAdornment'
import { API_TYPES, CLOUD_PROVIDERS, HOSTING_OPTIONS, hostingMeta, type HostingType } from '../data/catalogs'
import { SelectWithOther } from '../components/SelectWithOther'
import { setSystemApiInfo, setSystemHostingInfo, useSystemsCatalog } from '../state/systemsCatalogStore'

// "🖥 Catálogo de Sistemas" — vista central de los sistemas empresariales
// conocidos (SAP, Salesforce, Dynamics 365, etc.), sean del catálogo
// precargado o agregados por un FDE durante la captura de un paso.
// Conocimiento GLOBAL por sistema (no por paso/proceso): módulos,
// transacciones, disponibilidad de API y, aquí, HOSTING — dónde corre el
// sistema. Insumo directo para el "reference architecture" del cliente:
// define cómo se integraría un Agente de IA (API en la nube vs. sistema
// legacy on-premises).
export const SystemsCatalogPage = () => {
  const systems = useSystemsCatalog()
  const [search, setSearch] = useState('')
  const [selectedName, setSelectedName] = useState<string | null>(null)

  const filtered = systems.filter((s) => s.name.toLowerCase().includes(search.trim().toLowerCase()))
  const selected = systems.find((s) => s.name === selectedName) ?? filtered[0]

  return (
    <Box sx={{ minHeight: '100%', bgcolor: 'background.default', color: 'text.primary' }}>
      <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          🖥 Catálogo de Sistemas
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {systems.length} sistema{systems.length === 1 ? '' : 's'} conocido{systems.length === 1 ? '' : 's'} · hosting,
          API y módulos son conocimiento global — se capturan una vez por sistema y aplican a todos los procesos que lo usen.
        </Typography>
      </Box>

      <Box sx={{ p: 3, display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'flex-start' }}>
        {/* Lista + buscador */}
        <Box sx={{ flex: '1 1 340px', minWidth: 300, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <TextField
            size="small"
            placeholder="Buscar sistema..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          {filtered.map((system) => {
            const isSelected = system.name === selected?.name
            return (
              <Card
                key={system.name}
                variant="outlined"
                onClick={() => setSelectedName(system.name)}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  cursor: 'pointer',
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  bgcolor: isSelected ? 'action.selected' : 'background.paper',
                  '&:hover': { borderColor: 'primary.main' },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography sx={{ fontWeight: 700, flexGrow: 1 }}>{system.name}</Typography>
                  {system.esSuite && <Chip size="small" label="Suite" />}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {system.hosting ? hostingMeta(system.hosting).label : '❔ Hosting sin capturar'}
                  {system.tieneAPI ? ' · 🔌 Con API' : ''}
                </Typography>
              </Card>
            )
          })}

          {filtered.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              No se encontraron sistemas con ese criterio.
            </Typography>
          )}
        </Box>

        {/* Ficha del sistema seleccionado */}
        <Box sx={{ flex: '1 1 420px', minWidth: 320 }}>
          {!selected ? (
            <Card variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2, borderStyle: 'dashed' }}>
              <Typography color="text.secondary">Selecciona un sistema de la lista para ver su ficha completa.</Typography>
            </Card>
          ) : (
            <Card variant="outlined" sx={{ p: 2.5, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, flexGrow: 1 }}>
                  {selected.name}
                </Typography>
                {selected.esSuite && <Chip size="small" label="Suite" />}
              </Box>

              {selected.modulos.length > 0 && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Módulos / Áreas
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 0.5 }}>
                    {selected.modulos.map((m) => (
                      <Chip key={m} size="small" label={m} />
                    ))}
                  </Box>
                </Box>
              )}

              {selected.transacciones.length > 0 && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Transacciones conocidas
                  </Typography>
                  {selected.transacciones.map((t, i) => (
                    <Typography key={i} variant="body2">
                      {t.codigo && <strong>{t.codigo}</strong>}
                      {t.codigo && t.nombre ? ' — ' : ''}
                      {t.nombre}
                    </Typography>
                  ))}
                </Box>
              )}

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  p: 1.5,
                  border: '1px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <Typography variant="overline" color="text.secondary">
                  🔌 API del sistema
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <TextField
                    select
                    size="small"
                    label="¿Este sistema tiene API?"
                    sx={{ minWidth: 220 }}
                    value={selected.tieneAPI ? 'si' : 'no'}
                    onChange={(e) => setSystemApiInfo(selected.name, { tieneAPI: e.target.value === 'si' })}
                  >
                    <MenuItem value="si">Sí</MenuItem>
                    <MenuItem value="no">No / No sé todavía</MenuItem>
                  </TextField>
                  {selected.tieneAPI && (
                    <Box sx={{ minWidth: 200 }}>
                      <SelectWithOther
                        label="Tipo de API"
                        options={API_TYPES}
                        value={selected.tipoAPI}
                        onChange={(v) => setSystemApiInfo(selected.name, { tipoAPI: v })}
                      />
                    </Box>
                  )}
                </Box>
                {selected.tieneAPI && (
                  <TextField
                    size="small"
                    label="Notas de la API del sistema"
                    placeholder='Ej: "BAPIs estándar (VA01→BAPI_SALESORDER_CREATEFROMDAT2), OData Gateway"'
                    helperText='Texto libre: nombres de BAPIs/endpoints que YA CONOCES o hayas confirmado. No inventes nombres de API que no existan — si no lo sabes, déjalo vacío o escribe "por confirmar".'
                    value={selected.notasAPI}
                    onChange={(e) => setSystemApiInfo(selected.name, { notasAPI: e.target.value })}
                  />
                )}
                <Typography variant="caption" color="text.secondary">
                  Este es el único lugar donde se edita — se ve reflejado automáticamente en todos los pasos/datos que
                  usen "{selected.name}".
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  p: 1.5,
                  border: '1px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <Typography variant="overline" color="text.secondary">
                  ☁️ Hosting del sistema
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <TextField
                    select
                    size="small"
                    label="¿Dónde corre?"
                    sx={{ minWidth: 220 }}
                    value={selected.hosting}
                    onChange={(e) => setSystemHostingInfo(selected.name, { hosting: e.target.value as HostingType })}
                  >
                    {HOSTING_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  {(selected.hosting === 'nube' || selected.hosting === 'hibrido') && (
                    <Box sx={{ minWidth: 200 }}>
                      <SelectWithOther
                        label="Proveedor de nube"
                        options={CLOUD_PROVIDERS}
                        value={selected.proveedorNube}
                        onChange={(v) => setSystemHostingInfo(selected.name, { proveedorNube: v })}
                      />
                    </Box>
                  )}
                </Box>
                <TextField
                  size="small"
                  label="Notas de hosting"
                  placeholder='Ej: "ECC clásico on-premises; migración a S/4HANA Cloud planeada para 2027"'
                  value={selected.notasHosting}
                  onChange={(e) => setSystemHostingInfo(selected.name, { notasHosting: e.target.value })}
                />
              </Box>
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  )
}
