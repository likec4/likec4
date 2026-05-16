// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { type Fqn, nonexhaustive } from '@likec4/core'
import { useDiagram } from '@likec4/diagram'
import type { Types, XYStoreState } from '@likec4/diagram/custom'
import { type NodeData, navigateToDef, readUiStateDef, updateUiStateDef } from '@likec4/vite-plugin/ai/tools'
import {
  type UIMessage,
  clientTools,
} from '@tanstack/ai-client'
import { type UseChatOptions, fetchServerSentEvents, useChat as useTanstackChat } from '@tanstack/ai-react'
import { useNavigate } from '@tanstack/react-router'
import { aiEndpoint } from 'likec4:rpc'
import { useEffect, useMemo } from 'react'
import { find, map, pipe } from 'remeda'
import { parse, stringify } from 'superjson'
import { useCurrentProject } from '../hooks'

function mapToNodeData(storeState: XYStoreState) {
  return <T extends Types.NodeType>({ id, data, ...node }: Types.Node<T>): NodeData => {
    let icon = data.icon ?? undefined
    if (icon === 'none') {
      icon = undefined
    }

    let children = storeState.parentLookup.get(id)?.values().map(child => child.id).toArray()

    return {
      id,
      title: data.title,
      shape: data.shape,
      color: data.color,
      icon,
      parentId: node.parentId,
      children,
      x: data.x,
      y: data.y,
      width: node.measured?.width ?? node.width ?? node.initialWidth ?? 0,
      height: node.measured?.height ?? node.height ?? node.initialHeight ?? 0,
      ...('modelFqn' in data && data.modelFqn && { modelFqn: data.modelFqn }),
    }
  }
}

function useChatTools() {
  const { id: projectId } = useCurrentProject()
  const navigate = useNavigate()

  const diagram = useDiagram()

  return useMemo(() =>
    clientTools(
      // -------------
      navigateToDef.client(({ viewId }) => {
        navigate({
          to: './',
          params: (current) => ({
            ...current,
            viewId,
          }),
        })
        return {}
      }),
      // -------------
      readUiStateDef.client((params) => {
        const {
          view,
          focusedNode,
          xynodes,
          xystore,
          toggledFeatures,
          features,
        } = diagram.getContext()

        const isReadOnly = toggledFeatures.enableReadOnly ?? features.enableReadOnly

        const toNodeData = mapToNodeData(xystore.getState())

        // if include nodes
        const nodes = params.nodes === true && map(xynodes, toNodeData) || undefined

        // if include nodes
        const selectedNode = params.selectedNode === true && pipe(
          xynodes,
          find(n => !!n.selected || n.id === focusedNode),
          n => n ? toNodeData(n) : undefined,
        )

        return {
          projectId,
          editMode: !isReadOnly,
          view: {
            id: view.id,
            title: view.title ?? '',
            type: view._type,
          },
          ...(nodes && { nodes }),
          ...(selectedNode && { selectedNode }),
        }
      }),
      // -------------
      updateUiStateDef.client(({ command }) => {
        switch (command.type) {
          case 'focus':
            diagram.focusOnElement(command.elementId as Fqn)
            break
          case 'fitview':
            diagram.fitDiagram()
            break
          default:
            nonexhaustive(command)
        }
        return {}
      }),
    ), [
    // Dependencies
    navigate,
    diagram,
    projectId,
  ])
}

// Step 3: Infer message types for full type safety
export type TypedUIMessage = UIMessage<ReturnType<typeof useChatTools>>
export type TypedUIMessages = Array<TypedUIMessage>

const storage = {
  key: 'likec4.ai.chat.messages',
  read(): TypedUIMessages {
    try {
      const stored = sessionStorage.getItem(this.key)
      if (!stored) return []
      return parse(stored)
    } catch {
      return []
    }
  },
  write(messages: TypedUIMessages) {
    try {
      if (messages.length === 0) {
        sessionStorage.removeItem(this.key)
        return
      }
      sessionStorage.setItem(this.key, stringify(messages))
    } catch {
      // ignore
    }
  },
}

export function useChat(options: Omit<UseChatOptions, 'connection' | 'tools' | 'initialMessages'>) {
  const memoProps = useMemo(() => {
    if (!aiEndpoint) {
      throw new Error('AI chat endpoint is not configured')
    }
    return {
      connection: fetchServerSentEvents(aiEndpoint),
      initialMessages: storage.read(),
    }
  }, [])
  const chat = useTanstackChat({
    ...memoProps,
    ...options,
    tools: useChatTools(),
  })
  useEffect(() => {
    storage.write(chat.messages)
  }, [chat.messages])
  return chat
}

export type UseChatReturn = ReturnType<typeof useChat>
