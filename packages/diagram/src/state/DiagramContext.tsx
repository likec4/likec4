import { invariant } from '@likec4/core'
import { Box } from '@mantine/core'
import { useMergedRef, useReducedMotion } from '@mantine/hooks'
import { deepEqual, shallowEqual } from 'fast-equals'
import { useAnimate } from 'framer-motion'
import { createContext, type PropsWithChildren, useCallback, useEffect, useRef } from 'react'
import { clone } from 'remeda'
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
  const isMotionReduced = useReducedMotion() ?? false
  const [scope, animate] = useAnimate()
  const containerRef = useRef<HTMLDivElement>(null)
  const ref = useMergedRef(scope, containerRef)
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
      whereFilter: clone(whereFilter),
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
        current.setState({ whereFilter: clone(whereFilter) }, false, 'update where filter')
      }
      current.getState().updateView(view)
    },
    [view, whereFilter] as const,
    (a, b) => shallowEqual(a[0], b[0]) && deepEqual(a[1], b[1])
  )

  const api = store.current
  useEffect(() => {
    if (isMotionReduced) {
      return
    }
    return api.subscribe(s => !!s.activeOverlay, (isActiveOverlay) => {
      animate('.likec4-diagram .react-flow__renderer', {
        opacity: isActiveOverlay ? 0.7 : 1,
        filter: isActiveOverlay ? 'grayscale(1)' : 'grayscale(0)',
        transform: isActiveOverlay ? `perspective(300px) translateZ(-10px) translateY(2px)` : `translateY(0)`
      }, {
        duration: isActiveOverlay ? 0.4 : 0.2
      })
    }, {
      fireImmediately: true
    })
  }, [api, isMotionReduced])

  return (
    <Box
      ref={ref}
      className={className}
      {...(keepAspectRatio && {
        style: {
          aspectRatio: `${Math.ceil(view.bounds.width)}/${Math.ceil(view.bounds.height)}`,
          maxHeight: Math.ceil(view.bounds.height)
        }
      })}>
      <DiagramContext.Provider value={api}>
        {children}
      </DiagramContext.Provider>
    </Box>
  )
}
DiagramContextProvider.displayName = 'DiagramContextProvider'
