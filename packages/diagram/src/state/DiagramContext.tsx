import { createContext, type PropsWithChildren, useEffect, useRef } from 'react'
import { hasSubObject, isIncludedIn } from 'remeda'
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

  useEffect(
    () => {
      if (store.current?.getState().xyflow !== xyflow) {
        store.current?.setState({ xyflow }, false, 'update xyflow')
      }
    },
    [xyflow]
  )

  useUpdateEffect(
    () => {
      if (!store.current) return
      const state = store.current.getState()
      if (state.view !== view) {
        state.updateView(view)
      }
      if (!hasSubObject(state, props)) {
        store.current.setState(props, false, 'update incoming props')
      }
      isIncludedIn
    },
    [view, props]
  )

  return (
    <DiagramContext.Provider value={store.current}>
      {children}
    </DiagramContext.Provider>
  )
}
