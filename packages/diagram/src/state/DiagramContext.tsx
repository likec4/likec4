import { deepEqual } from 'fast-equals'
import { createContext, type PropsWithChildren, useEffect, useRef } from 'react'
import { hasSubObject, isNonNullish, pickBy } from 'remeda'
import { useUpdateEffect } from '../hooks'
import { useXYFlow, useXYStoreApi } from '../xyflow/hooks/useXYFlow'
import { createDiagramStore, type DiagramInitialState } from './diagramStore'

export type DiagramZustandStore = ReturnType<typeof createDiagramStore>
export const DiagramContext = createContext<DiagramZustandStore | null>(null)

export type DiagramContextProviderProps = PropsWithChildren<
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
  const xystore = useXYStoreApi()
  const xyflow = useXYFlow()
  const store = useRef<DiagramZustandStore>()

  if (!store.current) {
    store.current = createDiagramStore({
      xystore,
      xyflow,
      view,
      getContainer: () => containerRef.current,
      ...props
    })
  }

  useEffect(
    () => {
      if (!store.current) return
      const state = store.current.getState()
      if (state.xyflow !== xyflow || state.xystore !== xystore) {
        store.current.setState({ xyflow, xystore }, false, 'update xyflow and xystore')
      }
    },
    [xyflow, xystore]
  )

  const newProps = pickBy(props, isNonNullish)
  useUpdateEffect(
    () => store.current?.setState(newProps, false, 'update incoming props'),
    [newProps]
  )

  useUpdateEffect(
    () => {
      store.current?.getState().updateView(view)
    },
    [view],
    deepEqual
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
