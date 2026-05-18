// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { type Fqn, nonexhaustive } from '@likec4/core'
import { useCurrentViewModel, useDiagram } from '@likec4/diagram'
import {
  navigateToDef,
  readConnectionsDef,
  readElementDef,
  readUiStateDef,
  updateUiStateDef,
} from '@likec4/vite-plugin/ai/tools'
import {
  type UIMessage,
  clientTools,
} from '@tanstack/ai-client'
import { type UseChatOptions, fetchServerSentEvents, useChat as useTanstackChat } from '@tanstack/ai-react'
import { useNavigate } from '@tanstack/react-router'
import { aiEndpoint } from 'likec4:rpc'
import { useEffect, useMemo, useRef } from 'react'
import { find, map, pipe } from 'remeda'
import { parse, stringify } from 'superjson'
import { useCurrentProject } from '../hooks'
import {
  buildElementTemplateVariables,
  getSelectedElementId,
  interpolateChatTemplate,
  mapElementContextData,
  mapToNodeData,
  mapViewEdges,
} from './ui-state-data'

function useLatestRef<T>(value: T) {
  const ref = useRef(value)
  ref.current = value
  return ref
}

function useChatTools() {
  const projectRef = useLatestRef(useCurrentProject())
  const diagramRef = useLatestRef(useDiagram())
  const currentViewModelRef = useLatestRef(useCurrentViewModel())
  const navigate = useNavigate()

  const getCurrentView = () => {
    const { view } = diagramRef.current.getContext()
    return {
      id: view.id,
      title: view.title ?? '',
      type: view._type,
    }
  }

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
          focusedNode,
          xynodes,
          xystore,
          toggledFeatures,
          features,
        } = diagramRef.current.getContext()

        const currentViewModel = currentViewModelRef.current
        const isReadOnly = toggledFeatures.enableReadOnly ?? features.enableReadOnly
        const toNodeData = mapToNodeData(xystore.getState())

        const nodes = params.nodes === true && map(xynodes, toNodeData) || undefined
        const edges = (params.edges === true || params.edgeRelations === true) &&
            mapViewEdges(currentViewModel, { includeRelations: params.edgeRelations === true }) ||
          undefined

        const selectedNode = params.selectedNode === true && pipe(
          xynodes,
          find(n => !!n.selected || n.id === focusedNode),
          n => n ? toNodeData(n) : undefined,
        )

        return {
          projectId: projectRef.current.id,
          editMode: !isReadOnly,
          view: getCurrentView(),
          ...(nodes && { nodes }),
          ...(edges && { edges }),
          ...(selectedNode && { selectedNode }),
        }
      }),
      // -------------
      readConnectionsDef.client(() => {
        const currentViewModel = currentViewModelRef.current
        return {
          projectId: projectRef.current.id,
          view: getCurrentView(),
          edges: mapViewEdges(currentViewModel, { includeRelations: true }),
        }
      }),
      // -------------
      readElementDef.client(({ elementId }) => {
        const diagram = diagramRef.current
        const currentViewModel = currentViewModelRef.current
        const project = projectRef.current
        const target = elementId ?? getSelectedElementId(diagram.getContext())
        const element = target ? currentViewModel.$model.findElement(target) : null

        if (!target) {
          return {
            projectId: project.id,
            view: getCurrentView(),
            element: null,
            reason: 'No selected or focused element',
          }
        }

        if (!element) {
          return {
            projectId: project.id,
            view: getCurrentView(),
            element: null,
            reason: `Element not found: ${target}`,
          }
        }

        return {
          projectId: project.id,
          view: getCurrentView(),
          element: mapElementContextData(element, currentViewModel, project.aiChat?.context),
        }
      }),
      // -------------
      updateUiStateDef.client(({ command }) => {
        const diagram = diagramRef.current
        const commandType = command.type
        switch (commandType) {
          case 'focus':
            diagram.focusOnElement(command.elementId as Fqn)
            break
          case 'fitview':
            diagram.fitDiagram()
            break
          default:
            nonexhaustive(commandType)
        }
        return {}
      }),
    ), [
    // Dependencies
    navigate,
    diagramRef,
    currentViewModelRef,
    projectRef,
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
  const projectRef = useLatestRef(useCurrentProject())
  const diagramRef = useLatestRef(useDiagram())
  const currentViewModelRef = useLatestRef(useCurrentViewModel())

  const memoProps = useMemo(() => {
    if (!aiEndpoint) {
      throw new Error('AI chat endpoint is not configured')
    }
    return {
      connection: fetchServerSentEvents(aiEndpoint, () => ({
        body: buildAIRequestBody(
          projectRef.current.aiChat?.systemPrompt,
          diagramRef.current,
          currentViewModelRef.current,
        ),
      })),
      initialMessages: storage.read(),
    }
  }, [currentViewModelRef, diagramRef, projectRef])
  const chat = useTanstackChat({
    ...memoProps,
    ...options,
    tools: useChatTools(),
  })
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      storage.write(chat.messages)
    }, 250)
    return () => {
      window.clearTimeout(timeout)
      storage.write(chat.messages)
    }
  }, [chat.messages])
  return chat
}

export type UseChatReturn = ReturnType<typeof useChat>

function buildAIRequestBody(
  systemPrompt: string | undefined,
  diagram: ReturnType<typeof useDiagram>,
  currentViewModel: ReturnType<typeof useCurrentViewModel>,
) {
  if (!systemPrompt?.trim()) {
    return {}
  }

  const selectedElementId = getSelectedElementId(diagram.getContext())
  const element = selectedElementId ? currentViewModel.$model.findElement(selectedElementId) : null
  const variables = buildElementTemplateVariables(element, currentViewModel)
  const renderedSystemPrompt = interpolateChatTemplate(systemPrompt, variables, { hideIfEmpty: false })?.trim()

  return renderedSystemPrompt ? { systemPrompt: renderedSystemPrompt } : {}
}
