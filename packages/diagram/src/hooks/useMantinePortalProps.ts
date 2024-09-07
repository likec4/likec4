import { useMemo } from 'react'

import { useDiagramState } from './useDiagramState'

export function useMantinePortalProps() {
  const target = useDiagramState(s => s.getContainer())
  return useMemo(() => target ? { portalProps: { target } } : { withinPortal: false }, [target])
}
