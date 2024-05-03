import { createContext, type PropsWithChildren, useRef } from 'react'
import { useUpdateEffect } from '../hooks'
import { useXYFlow } from '../xyflow/hooks'
import { createDiagramStore, type DiagramInitialState } from './diagramStore'

type DiagramContextValue = ReturnType<typeof createDiagramStore>
export const DiagramContext = createContext<DiagramContextValue | null>(null)

export function DiagramContextProvider({ children, view, ...props }: PropsWithChildren<DiagramInitialState>) {
  const xyflow = useXYFlow()
  const store = useRef<DiagramContextValue>()

  if (!store.current) {
    store.current = createDiagramStore({
      xyflow,
      view,
      ...props
    })
  }

  useUpdateEffect(
    () => store.current?.setState({ xyflow }, false, 'update xyflow'),
    [xyflow],
    Object.is
  )

  useUpdateEffect(
    () => store.current?.getState().updateView(view),
    [view]
  )

  useUpdateEffect(
    () => store.current?.setState(props, false, 'update incoming props'),
    [props]
  )

  return (
    <DiagramContext.Provider value={store.current}>
      {children}
    </DiagramContext.Provider>
  )
}
