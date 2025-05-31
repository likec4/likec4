import { useMemo } from 'react'

import { useRootContainer } from '../context'

export function useMantinePortalProps():
  | {
    portalProps: { target: HTMLDivElement }
    withinPortal: true
  }
  | {
    withinPortal: false
    portalProps?: never
  }
{
  const target = useRootContainer()
  return useMemo(() => target ? { portalProps: { target }, withinPortal: true } : { withinPortal: false }, [target])
}
