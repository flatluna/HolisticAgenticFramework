import { useState, useRef, useEffect } from 'react'
import {
  TextField,
  List,
  ListItem,
  ListItemText,
  Paper,
  Box,
  CircularProgress,
  Autocomplete,
  AutocompleteInputChangeReason,
} from '@mui/material'
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded'
import axios from 'axios'

interface LocationSuggestion {
  address: string
  position: {
    lat: number
    lon: number
  }
  placeId: string
  // Structured address components, so callers can populate independent
  // fields (calle, colonia, ciudad, estado, país, código postal) instead of
  // only having the single freeform address string.
  streetAddress?: string
  neighborhood?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
}

interface AzureMapsLocationSearchProps {
  value: string
  onChange: (location: string, details?: LocationSuggestion) => void
  placeholder?: string
  error?: boolean
  helperText?: string
  label?: string
}

export const AzureMapsLocationSearch = ({
  value,
  onChange,
  placeholder = 'Ej. Ciudad de México',
  error = false,
  helperText = '',
  label = 'Sede principal',
}: AzureMapsLocationSearchProps) => {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  // Typing quickly can fire several requests before earlier ones finish. Without
  // this guard, a slower/older response can resolve AFTER a newer one and
  // silently overwrite the correct suggestions (often with empty results),
  // which is what caused the dropdown to appear only intermittently.
  const requestIdRef = useRef(0)

  const VITE_AZURE_MAPS_KEY = import.meta.env.VITE_AZURE_MAPS_KEY
  const AZURE_MAPS_ENDPOINT = import.meta.env.VITE_AZURE_MAPS_ENDPOINT

  const searchLocations = async (query: string) => {
    const requestId = ++requestIdRef.current

    if (!query || query.length < 2) {
      setSuggestions([])
      return
    }

    if (!VITE_AZURE_MAPS_KEY) {
      console.warn('Azure Maps Subscription Key not configured')
      setSuggestions([])
      return
    }

    setLoading(true)
    try {
      // Azure Maps REST API requires hyphenated query params: "api-version" and
      // "subscription-key". Using underscores here causes an unauthenticated
      // request (401), which used to silently fall back to a fake suggestion.
      const response = await axios.get(
        `https://atlas.microsoft.com/search/address/json`,
        {
          params: {
            'api-version': '1.0',
            query: query,
            'subscription-key': VITE_AZURE_MAPS_KEY,
            limit: 5,
            countrySet: 'MX,ES,AR,CO', // Focus on Spanish-speaking countries
          },
          timeout: 5000,
        }
      )

      // Ignore this response if a newer request has been fired since — its
      // result would be stale and could otherwise overwrite fresher, correct
      // suggestions (the cause of the dropdown showing up only sometimes).
      if (requestId !== requestIdRef.current) {
        return
      }

      if (response.data.results && Array.isArray(response.data.results)) {
        const mapped = response.data.results.map((result: any) => ({
          address: result.address?.freeformAddress || result.address?.streetNameAndNumber || query,
          position: {
            lat: result.position?.lat || 0,
            lon: result.position?.lon || 0,
          },
          placeId: result.id || '',
          streetAddress: result.address?.streetNameAndNumber || result.address?.streetName || '',
          neighborhood: result.address?.municipalitySubdivision || '',
          city: result.address?.municipality || '',
          state: result.address?.countrySubdivisionName || result.address?.countrySubdivision || '',
          country: result.address?.country || '',
          postalCode: result.address?.postalCode || result.address?.extendedPostalCode || '',
        }))
        // Azure Maps can return multiple POIs that share the same freeform
        // address text (e.g. same street, different building) — dedupe by
        // address so the dropdown doesn't show visually identical rows.
        const unique = Array.from(new Map(mapped.map((item) => [item.address, item])).values())
        setSuggestions(unique)
      } else {
        setSuggestions([])
      }
    } catch (error: any) {
      if (requestId !== requestIdRef.current) {
        return
      }
      console.error('Azure Maps search error:', error.message)
      setSuggestions([])
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }

  const handleInputChange = (
    _event: React.SyntheticEvent,
    newInputValue: string,
    reason: AutocompleteInputChangeReason
  ) => {
    setInputValue(newInputValue)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (reason === 'input') {
        searchLocations(newInputValue)
      }
    }, 300)
  }

  const handleChange = (_event: React.SyntheticEvent, newValue: LocationSuggestion | string | null) => {
    if (newValue && typeof newValue !== 'string') {
      setInputValue(newValue.address)
      onChange(newValue.address, newValue)
      setSuggestions([])
    }
  }

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  return (
    <Autocomplete
      freeSolo
      options={suggestions}
      // Azure Maps already filters results server-side for the current query.
      // MUI's Autocomplete otherwise ALSO re-filters `options` locally against
      // `inputValue` on every keystroke (matching getOptionLabel as a
      // substring). As you keep typing past what the last fetched batch of
      // suggestions textually matches, that local filter would hide all of
      // them until the next debounced fetch resolves — looking exactly like
      // the list "apareciendo y desapareciendo sola". Disable it here.
      filterOptions={(options) => options}
      getOptionLabel={(option) => (typeof option === 'string' ? option : option.address)}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      onChange={handleChange}
      loading={loading}
      componentsProps={{
        popper: {
          // The Card that wraps this field uses MUI's default `overflow:
          // hidden` (for rounded-corner clipping). Popper's flip/overflow
          // detection otherwise treats that Card as the clipping boundary
          // and flips the suggestion list UP, off the top of the page,
          // instead of showing it right below the field. Force the
          // viewport as the boundary so it always opens downward normally.
          modifiers: [
            { name: 'flip', options: { boundary: 'viewport', fallbackPlacements: ['bottom-start'] } },
            { name: 'preventOverflow', options: { boundary: 'viewport' } },
          ],
        },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={error}
          helperText={helperText}
          fullWidth
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props
        return (
          <ListItem key={key} {...optionProps} disablePadding>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%', px: 2, py: 1 }}>
              <LocationOnRoundedIcon sx={{ mr: 1.5, mt: 0.5, color: 'primary.main', fontSize: '1.2rem' }} />
              <Box sx={{ flex: 1 }}>
                <ListItemText
                  primary={option.address}
                  secondary={`Lat: ${option.position.lat.toFixed(4)}, Lon: ${option.position.lon.toFixed(4)}`}
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </Box>
            </Box>
          </ListItem>
        )
      }}
    />
  )
}
