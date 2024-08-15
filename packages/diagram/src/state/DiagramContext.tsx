import { createContext, type PropsWithChildren, useCallback, useRef } from 'react'
import { useUpdateEffect } from '../hooks/useUpdateEffect'
import { useXYFlow, useXYStoreApi } from '../hooks/useXYFlow'
import { createDiagramStore, type DiagramInitialState, type DiagramZustandStore } from './diagramStore'

export const DiagramContext = createContext<DiagramZustandStore | null>(null)

export type DiagramContextProviderProps = PropsWithChildren<
  Omit<DiagramInitialState, 'xystore' | 'xyflow' | 'getContainer'> & {
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
  const xystore = useXYStoreApi()
  const xyflow = useXYFlow()
  const store = useRef<DiagramZustandStore>()

  const getContainer = useCallback(() => containerRef.current, [containerRef])

  if (!store.current) {
    store.current = createDiagramStore({
      xystore,
      xyflow,
      view,
      getContainer,
      ...props
    })
  }

  useUpdateEffect(
    () => store.current?.setState({ xyflow, xystore, getContainer }, false, 'update xyflow and xystore'),
    [xyflow, xystore, getContainer]
  )

  useUpdateEffect(
    () => store.current?.setState(props, false, 'update incoming props'),
    [props]
  )

  useUpdateEffect(
    () => {
      store.current?.getState().updateView(view)
    },
    [view]
  )

  return (
    <div
      ref={containerRef}
      className={className}
      {...(keepAspectRatio && {
        style: {
          aspectRatio: `${Math.ceil(view.bounds.width)}/${Math.ceil(view.bounds.height)}`,
          maxHeight: Math.ceil(view.bounds.height)
        }
      })}>
      <DiagramContext.Provider value={store.current}>
        {children}
      </DiagramContext.Provider>
    </div>
  )
}
