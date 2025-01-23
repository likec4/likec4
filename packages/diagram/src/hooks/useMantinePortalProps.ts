import { useMemo } from 'react'

import { useRootContainer } from '../context'

export function useMantinePortalProps() {
  const target = useRootContainer()
  return useMemo(() => target ? { portalProps: { target }, withinPortal: true } : { withinPortal: false }, [target])
}
