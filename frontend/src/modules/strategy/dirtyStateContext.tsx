import { createContext, useContext, useMemo, useRef, type ReactNode } from 'react'

interface DirtyStateContextValue {
  isDirty: () => boolean
  setDirty: (dirty: boolean) => void
}

const DirtyStateContext = createContext<DirtyStateContextValue | null>(null)

// Lets a Fundamento section (Empresa, Org Design, Mandato, Business Strategy)
// report "I have unsaved edits" up to the shared FundamentoSectionPage shell,
// which then confirms with the user before navigating away (Anterior/
// Siguiente/back to Fundamento) so edits are never silently discarded.
export const DirtyStateProvider = ({ children }: { children: ReactNode }) => {
  const dirtyRef = useRef(false)
  const value = useMemo<DirtyStateContextValue>(
    () => ({
      isDirty: () => dirtyRef.current,
      setDirty: (dirty: boolean) => {
        dirtyRef.current = dirty
      },
    }),
    [],
  )
  return <DirtyStateContext.Provider value={value}>{children}</DirtyStateContext.Provider>
}

export const useDirtyState = (): DirtyStateContextValue => {
  const ctx = useContext(DirtyStateContext)
  if (!ctx) throw new Error('useDirtyState must be used within a DirtyStateProvider')
  return ctx
}
