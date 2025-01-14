import { useSyncedRef } from '@react-hookz/web'
import { type PropsWithChildren, createContext, useContext, useMemo } from 'react'
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

const DiagramEventHandlersContext = createContext<RequiredOrNull<LikeC4DiagramEventHandlers>>(
  mapToObj(HandlerNames, (name) => [name, null]),
)

export function DiagramEventHandlers({
  handlers,
  children,
}: PropsWithChildren<{ handlers: LikeC4DiagramEventHandlers }>) {
  const handlersRef = useSyncedRef(handlers)

  const deps = HandlerNames.map((name) => isFunction(handlers[name]))

  return (
    <DiagramEventHandlersContext.Provider
      value={useMemo(() =>
        mapToObj(HandlerNames, (name) => {
          if (handlersRef.current[name]) {
            // @ts-ignore
            return [name, (...args: any[]) => handlersRef.current[name]!(...args)]
          }
          return [name, null]
        }), [handlersRef, ...deps])}>
      {children}
    </DiagramEventHandlersContext.Provider>
  )
}

export function useDiagramEventHandlers() {
  return useContext(DiagramEventHandlersContext)
}
