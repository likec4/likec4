import type { aux } from '@likec4/core/types'
import { useSyncedRef } from '@react-hookz/web'
import { type PropsWithChildren, type RefObject, createContext, useContext, useMemo } from 'react'
import { isFunction, keys, mapToObj } from 'remeda'
import type { LikeC4DiagramEventHandlers } from '../LikeC4Diagram.props'

type RequiredOrNull<T> = {
  [P in keyof T]-?: NonNullable<T[P]> | null
}

const defaultHandlers: Required<LikeC4DiagramEventHandlers> = {
  onNavigateTo: null,
  onNodeClick: null,
  onNodeContextMenu: null,
  onCanvasContextMenu: null,
  onEdgeClick: null,
  onEdgeContextMenu: null,
  onCanvasClick: null,
  onCanvasDblClick: null,
  onLogoClick: null,
  onOpenSource: null,
  onInitialized: null,
  onLayoutTypeChange: null,
}

const HandlerNames = keys(defaultHandlers)

export type DiagramEventHandlersContext = RequiredOrNull<LikeC4DiagramEventHandlers> & {
  handlersRef: RefObject<Required<LikeC4DiagramEventHandlers>>
}

const DiagramEventHandlersReactContext = createContext<DiagramEventHandlersContext>({
  ...mapToObj(HandlerNames, (name) => [name, null]),
  handlersRef: {
    current: defaultHandlers,
  },
})

export function DiagramEventHandlers<A extends aux.Any>({
  handlers,
  children,
}: PropsWithChildren<{ handlers: Required<LikeC4DiagramEventHandlers<A>> }>) {
  const handlersRef = useSyncedRef(
    handlers as Required<LikeC4DiagramEventHandlers>,
  )

  const deps = HandlerNames.map((name) => isFunction(handlers[name]))

  const value = useMemo((): DiagramEventHandlersContext => ({
    ...mapToObj(HandlerNames, (name) => {
      if (handlersRef.current[name]) {
        // @ts-expect-error TODO: fix this
        return [name, (...args: any[]) => handlersRef.current[name]?.(...args)]
      }
      return [name, null]
    }),
    handlersRef,
  }), [handlersRef, ...deps])

  return (
    <DiagramEventHandlersReactContext.Provider value={value}>
      {children}
    </DiagramEventHandlersReactContext.Provider>
  )
}

export function useDiagramEventHandlers(): DiagramEventHandlersContext {
  return useContext(DiagramEventHandlersReactContext)
}

export function useDiagramEventHandlersRef<A extends aux.Any = aux.Any>(): RefObject<LikeC4DiagramEventHandlers<A>> {
  return useContext(DiagramEventHandlersReactContext).handlersRef
}
