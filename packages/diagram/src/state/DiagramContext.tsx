import { invariant } from '@likec4/core'
import { deepEqual, shallowEqual } from 'fast-equals'
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
  whereFilter,
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
      whereFilter: structuredClone(whereFilter),
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
      const current = store.current
      invariant(current, 'DiagramContext.store.current is not defined')
      if (!deepEqual(whereFilter, current.getState().whereFilter)) {
        current.setState({ whereFilter: structuredClone(whereFilter) }, false, 'update where filter')
      }
      current.getState().updateView(view)
    },
    [view, whereFilter] as const,
    (a, b) => shallowEqual(a[0], b[0]) && deepEqual(a[1], b[1])
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
