import { useIsomorphicLayoutEffect } from '@react-hookz/web'
import { shallowEqual } from 'fast-equals'
import { createContext, type PropsWithChildren, useRef } from 'react'
import { useUpdateEffect } from '../hooks'
import { createDiagramStore } from './store'
import type { DiagramInitialState, DiagramState } from './types'

type DiagramContextValue = ReturnType<typeof createDiagramStore>
export const DiagramContext = createContext<DiagramContextValue | null>(null)

export function DiagramContextProvider({ children, ...props }: PropsWithChildren<DiagramInitialState>) {
  const store = useRef<DiagramContextValue>()
  if (!store.current) {
    store.current = createDiagramStore(props)
  }
  useUpdateEffect(
    () => store.current?.setState(props),
    [props],
    shallowEqual,
    useIsomorphicLayoutEffect
  )
  return (
    <DiagramContext.Provider value={store.current}>
      {children}
    </DiagramContext.Provider>
  )
}
