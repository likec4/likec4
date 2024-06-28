import { createContext, type PropsWithChildren, useEffect, useRef } from 'react'
import { hasSubObject } from 'remeda'
import { useUpdateEffect } from '../hooks'
import { useXYFlow } from '../xyflow/hooks'
import { createDiagramStore, type DiagramInitialState } from './diagramStore'

export type DiagramZustandStore = ReturnType<typeof createDiagramStore>
export const DiagramContext = createContext<DiagramZustandStore | null>(null)

type DiagramContextProviderProps = PropsWithChildren<
  DiagramInitialState & {
    className: string
    keepAspectRatio: boolean
  }
>

export function DiagramContextProvider({
  children,
  view,
  className,
  keepAspectRatio,
  ...props
}: DiagramContextProviderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const xyflow = useXYFlow()
  const store = useRef<DiagramZustandStore>()

  if (!store.current) {
    store.current = createDiagramStore({
      xyflow,
      view,
      getContainer: () => containerRef.current,
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
    },
    [view, props]
  )
  return (
    <div
      ref={containerRef}
      className={className}
      {...(keepAspectRatio && {
        style: {
          aspectRatio: `${Math.ceil(view.width)}/${Math.ceil(view.height)}`,
          maxHeight: Math.ceil(view.height)
        }
      })}>
      <DiagramContext.Provider value={store.current}>
        {children}
      </DiagramContext.Provider>
    </div>
  )
}
