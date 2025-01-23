import { createContext, useContext } from 'react'
import type { DiagramState } from '../hooks'

export const OverlayContext = createContext({} as {
  openOverlay: DiagramState['openOverlay']
  close: (onClosed?: () => void) => void
})

export function useOverlayDialog() {
  return useContext(OverlayContext)
}
