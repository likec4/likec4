// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { type PropsWithChildren, type RefObject, createContext, useContext, useMemo, useRef } from 'react'
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
  onRelationshipBrowserScopeChange: null,
}

const HandlerNames = keys(defaultHandlers)

type DiagramEventHandlersRef = RefObject<Required<LikeC4DiagramEventHandlers>>

export type DiagramEventHandlersContext = RequiredOrNull<LikeC4DiagramEventHandlers> & {
  handlersRef: DiagramEventHandlersRef
}

const DiagramEventHandlersReactContext = createContext<DiagramEventHandlersContext>({
  ...mapToObj(HandlerNames, (name) => [name, null]),
  handlersRef: {
    current: defaultHandlers,
  },
})

export function DiagramEventHandlers({
  handlers,
  children,
}: PropsWithChildren<{ handlers: Required<LikeC4DiagramEventHandlers> }>) {
  const handlersRef = useRef(
    handlers as Required<LikeC4DiagramEventHandlers>,
  )
  handlersRef.current = handlers

  const deps = HandlerNames.map((name) => isFunction(handlers[name]) ? name : '-').join(',')

  const value = useMemo((): DiagramEventHandlersContext => ({
    ...mapToObj(HandlerNames, (name) => {
      if (isFunction(handlers[name])) {
        // @ts-expect-error TODO: fix this
        return [name, (...args: any[]) => handlersRef.current[name]?.(...args)]
      }
      return [name, null]
    }),
    handlersRef,
  }), [handlersRef, deps])

  return (
    <DiagramEventHandlersReactContext.Provider value={value}>
      {children}
    </DiagramEventHandlersReactContext.Provider>
  )
}

export function useDiagramEventHandlers(): DiagramEventHandlersContext {
  return useContext(DiagramEventHandlersReactContext)
}
