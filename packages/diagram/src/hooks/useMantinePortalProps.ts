import { useMemo } from 'react'

import { useRootContainerElement } from '../context'

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
  const target = useRootContainerElement()
  return useMemo(() => target ? { portalProps: { target }, withinPortal: true } : { withinPortal: false }, [target])
}
