import { useMemo } from 'react'

import { useRootContainerElement } from '../context'

export function useMantinePortalProps():
  | {
    withinPortal: true
    portalProps: { target: HTMLDivElement }
  }
  | {
    withinPortal: false
    portalProps?: never
  }
{
  const target = useRootContainerElement()
  return useMemo(() => target ? { portalProps: { target }, withinPortal: true } : { withinPortal: false }, [target])
}
