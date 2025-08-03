import type { aux } from '@likec4/core/types'
import { useSyncedRef } from '@react-hookz/web'
import { type PropsWithChildren, type RefObject, createContext, useContext, useMemo } from 'react'
import { isFunction, mapToObj } from 'remeda'
import type { LikeC4DiagramEventHandlers } from '../LikeC4Diagram.props'

type RequiredOrNull<T> = {
  [P in keyof T]-?: NonNullable<T[P]> | null
}

const HandlerNames = [
  'onBurgerMenuClick',
  'onNavigateTo',
  'onOpenSource',
  'onCanvasClick',
  'onCanvasContextMenu',
  'onEdgeClick',
  'onEdgeContextMenu',
  'onNodeClick',
  'onNodeContextMenu',
  'onChange',
  'onCanvasDblClick',
] as const

export type DiagramEventHandlersContext = RequiredOrNull<LikeC4DiagramEventHandlers<aux.Any>> & {
  handlersRef: RefObject<LikeC4DiagramEventHandlers<aux.Any>>
}

const DiagramEventHandlersReactContext = createContext<DiagramEventHandlersContext>({
  ...mapToObj(HandlerNames, (name) => [name, null]),
  handlersRef: {
    current: {},
  },
})

export function DiagramEventHandlers<A extends aux.Any>({
  handlers,
  children,
}: PropsWithChildren<{ handlers: LikeC4DiagramEventHandlers<A> }>) {
  const handlersRef = useSyncedRef(handlers)

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
