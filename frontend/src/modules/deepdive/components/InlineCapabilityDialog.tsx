import { useState } from 'react'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material'
import { DEPARTAMENTOS } from '../data/catalogs'
import { SelectWithOther } from './SelectWithOther'
import { createCapability, emptyCapabilityForm, type CapabilityDto } from '@/modules/madurez/capabilities/capabilityApi'

// "➕ Crear capacidad" — creación INLINE de una Capacidad de Negocio desde la
// Etapa ① del wizard de pasos, sin redirigir a otra pantalla (Madurez →
// Capacidades). Solo pide los 2 campos que el backend realmente exige
// (Name + BusinessDomain — ver CreateCapability en BusinessCapabilityFunctions.cs);
// el resto de la ficha completa de la capacidad se puede enriquecer después
// desde su propia pantalla.
export const InlineCapabilityDialog = ({
  open,
  engagementId,
  onClose,
  onCreated,
}: {
  open: boolean
  engagementId: string
  onClose: () => void
  onCreated: (capability: CapabilityDto) => void
}) => {
  const [name, setName] = useState('')
  const [businessDomain, setBusinessDomain] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!name.trim() || !businessDomain.trim()) {
      setError('El nombre y el dominio de negocio son obligatorios.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const created = await createCapability(engagementId, {
        ...emptyCapabilityForm(),
        name: name.trim(),
        businessDomain: businessDomain.trim(),
      })
      onCreated(created)
      setName('')
      setBusinessDomain('')
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'No se pudo crear la capacidad.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>➕ Crear capacidad de negocio</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        <TextField
          size="small"
          autoFocus
          label="Nombre de la capacidad"
          placeholder='Ej: "Gestión de Pedidos"'
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <SelectWithOther label="Dominio de negocio" options={DEPARTAMENTOS} value={businessDomain} onChange={setBusinessDomain} />
        {error && <Alert severity="error">{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? 'Creando…' : 'Crear capacidad'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
