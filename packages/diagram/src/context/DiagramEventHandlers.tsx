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

type DiagramEventHandlersContextValue = RequiredOrNull<LikeC4DiagramEventHandlers> & {
  handlersRef: RefObject<LikeC4DiagramEventHandlers>
}

const DiagramEventHandlersContext = createContext<DiagramEventHandlersContextValue>({
  ...mapToObj(HandlerNames, (name) => [name, null]),
  handlersRef: {
    current: {},
  },
})

export function DiagramEventHandlers({
  handlers,
  children,
}: PropsWithChildren<{ handlers: LikeC4DiagramEventHandlers }>) {
  const handlersRef = useSyncedRef(handlers)

  const deps = HandlerNames.map((name) => isFunction(handlers[name]))

  const value = useMemo((): DiagramEventHandlersContextValue => ({
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
    <DiagramEventHandlersContext.Provider value={value}>
      {children}
    </DiagramEventHandlersContext.Provider>
  )
}

export function useDiagramEventHandlers() {
  return useContext(DiagramEventHandlersContext)
}

export function useDiagramEventHandlersRef() {
  return useContext(DiagramEventHandlersContext).handlersRef
}
