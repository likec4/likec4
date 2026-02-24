// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { LayoutedProjectsView } from '@likec4/core'
import type {
  ComputedLikeC4ModelData,
  DiagramView,
  LayoutType,
  ProjectId,
  ViewChange,
  ViewId,
} from '@likec4/core/types'
import { CancellationTokenImpl, HOST_EXTENSION } from 'vscode-messenger-common'
import { Messenger } from 'vscode-messenger-webview'
import {
  type GetLastClickedNodeHandler,
  type Handler,
  type WebviewLocateReq,
  AIChatProxyCancel,
  AIChatProxyChunk,
  AIChatProxyDone,
  AIChatProxyError,
  AIChatProxyStart,
  BroadcastModelUpdate,
  BroadcastProjectsUpdate,
  FetchComputedModel,
  FetchLayoutedView,
  FetchProjectsOverview,
  GetLastClickedNode,
  OnOpenView,
  ReadLocalIcon,
  ViewChangeReq,
  WebviewMsgs,
} from '../protocol'

export type VscodeState = {
  viewId: ViewId
  projectId: ProjectId
  view: DiagramView | null
  model: ComputedLikeC4ModelData | null
  nodesDraggable: boolean
  edgesEditable: boolean
  updatedAt: number
  screen: 'view' | 'projects'
  projectsOverview: LayoutedProjectsView | null
}
const vscode = acquireVsCodeApi<VscodeState>()

const messenger = new Messenger(vscode)
messenger.start()

// AI Chat proxy stream registry — handlers registered once, dispatched by streamId
type ProxyStreamEntry = {
  controller: ReadableStreamDefaultController<Uint8Array> | null
  pendingChunks: Uint8Array[]
  pendingError: Error | null
  pendingDone: boolean
  done: boolean
}
const activeProxyStreams = new Map<string, ProxyStreamEntry>()
const proxyEncoder = new TextEncoder()

function flushPending(entry: ProxyStreamEntry) {
  if (!entry.controller) return
  for (const chunk of entry.pendingChunks) {
    entry.controller.enqueue(chunk)
  }
  entry.pendingChunks = []
  if (entry.pendingError) {
    entry.done = true
    entry.controller.error(entry.pendingError)
    entry.controller = null
    // Find and delete the entry from the registry
    for (const [id, e] of activeProxyStreams) {
      if (e === entry) {
        activeProxyStreams.delete(id)
        break
      }
    }
  } else if (entry.pendingDone) {
    entry.done = true
    entry.controller.close()
    entry.controller = null
    for (const [id, e] of activeProxyStreams) {
      if (e === entry) {
        activeProxyStreams.delete(id)
        break
      }
    }
  }
}

messenger.onNotification(AIChatProxyChunk, (params) => {
  const entry = activeProxyStreams.get(params.streamId)
  if (!entry || entry.done) return
  const encoded = proxyEncoder.encode(params.chunk)
  if (entry.controller) {
    entry.controller.enqueue(encoded)
  } else {
    entry.pendingChunks.push(encoded)
  }
})
messenger.onNotification(AIChatProxyDone, (params) => {
  const entry = activeProxyStreams.get(params.streamId)
  if (!entry || entry.done) return
  if (entry.controller) {
    entry.done = true
    entry.controller.close()
    entry.controller = null
    activeProxyStreams.delete(params.streamId)
  } else {
    entry.pendingDone = true
  }
})
messenger.onNotification(AIChatProxyError, (params) => {
  const entry = activeProxyStreams.get(params.streamId)
  if (!entry || entry.done) return
  if (entry.controller) {
    entry.done = true
    entry.controller.error(new Error(params.error))
    entry.controller = null
    activeProxyStreams.delete(params.streamId)
  } else {
    entry.pendingError = new Error(params.error)
  }
})

export const ExtensionApi = {
  navigateTo: (viewId: ViewId, projectId?: ProjectId) => {
    messenger.sendNotification(WebviewMsgs.NavigateTo, HOST_EXTENSION, { screen: 'view', viewId, projectId })
  },
  navigateToProjectsOverview: () => {
    messenger.sendNotification(WebviewMsgs.NavigateTo, HOST_EXTENSION, { screen: 'projects' })
  },
  closeMe: () => {
    messenger.sendNotification(WebviewMsgs.CloseMe, HOST_EXTENSION)
  },
  locate: (params: WebviewLocateReq) => {
    messenger.sendNotification(WebviewMsgs.Locate, HOST_EXTENSION, params)
  },
  updateTitle: (title: string) => {
    messenger.sendNotification(WebviewMsgs.UpdateMyTitle, HOST_EXTENSION, { title })
  },

  change: async (params: {
    projectId: ProjectId
    viewId: ViewId
    change: ViewChange
  }): Promise<
    | { success: true }
    | { success: false; error: string }
  > => {
    return await messenger.sendRequest(ViewChangeReq, HOST_EXTENSION, params)
  },

  fetchComputedModel: async (
    projectId: ProjectId,
    signal: AbortSignal,
  ): Promise<{
    model: ComputedLikeC4ModelData | null
    error: string | null
  }> => {
    const cancellationToken = new CancellationTokenImpl()
    signal.addEventListener('abort', () => cancellationToken.cancel())
    return await messenger.sendRequest(FetchComputedModel, HOST_EXTENSION, { projectId }, cancellationToken)
  },

  // Layoted vuew
  fetchDiagramView: async (
    params: {
      projectId: ProjectId
      viewId: ViewId
      layoutType: LayoutType
    },
    signal: AbortSignal,
  ): Promise<{
    view: DiagramView | null
    error: string | null
  }> => {
    const cancellationToken = new CancellationTokenImpl()
    signal.addEventListener('abort', () => cancellationToken.cancel())
    return await messenger.sendRequest(FetchLayoutedView, HOST_EXTENSION, params, cancellationToken)
  },

  fetchProjectsOverview: async (signal: AbortSignal): Promise<{
    projectsView: LayoutedProjectsView | null
  }> => {
    const cancellationToken = new CancellationTokenImpl()
    signal.addEventListener('abort', () => cancellationToken.cancel())
    return await messenger.sendRequest(
      FetchProjectsOverview,
      HOST_EXTENSION,
      undefined,
      cancellationToken,
    )
  },

  // Read local icon file and convert to base64 data URI
  readLocalIcon: async (uri: string) => {
    return await messenger.sendRequest(ReadLocalIcon, HOST_EXTENSION, uri)
  },

  onOpenViewNotification: (handler: Handler<typeof OnOpenView>) => {
    messenger.onNotification(OnOpenView, handler)
  },

  onGetLastClickedNodeRequest: (handler: GetLastClickedNodeHandler) => {
    messenger.onRequest(GetLastClickedNode, handler)
  },

  onModelUpdateNotification: (handler: () => void) => {
    messenger.onNotification(BroadcastModelUpdate, handler)
  },

  onProjectsUpdateNotification: (handler: () => void) => {
    messenger.onNotification(BroadcastProjectsUpdate, handler)
  },

  /**
   * Proxy fetch through the extension host to bypass CORS in the webview.
   * Returns a standard Response with a streaming body.
   */
  proxyFetch: async (input: string | URL, init?: Omit<RequestInit, 'body'> & { body?: string }): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString()
    const method = init?.method ?? 'GET'
    const headers: Record<string, string> = {}
    if (init?.headers) {
      new Headers(init.headers).forEach((v, k) => {
        headers[k] = v
      })
    }
    const body = typeof init?.body === 'string' ? init.body : ''

    const result = await messenger.sendRequest(AIChatProxyStart, HOST_EXTENSION, {
      url,
      method,
      headers,
      body,
    })

    if (!result.ok) {
      return new Response(result.errorBody ?? 'Proxy error', {
        status: result.status || 502,
        statusText: 'Proxy Error',
      })
    }

    const streamId = result.streamId
    const entry: ProxyStreamEntry = {
      controller: null,
      pendingChunks: [],
      pendingError: null,
      pendingDone: false,
      done: false,
    }
    activeProxyStreams.set(streamId, entry)

    // Handle abort signal
    if (init?.signal) {
      if (init.signal.aborted) {
        activeProxyStreams.delete(streamId)
        messenger.sendNotification(AIChatProxyCancel, HOST_EXTENSION, { streamId })
        throw new DOMException('The operation was aborted', 'AbortError')
      }
      init.signal.addEventListener('abort', () => {
        messenger.sendNotification(AIChatProxyCancel, HOST_EXTENSION, { streamId })
        if (entry.controller && !entry.done) {
          entry.done = true
          try {
            entry.controller.close()
          } catch {
            // already closed
          }
          entry.controller = null
          activeProxyStreams.delete(streamId)
        } else if (!entry.done) {
          entry.done = true
          activeProxyStreams.delete(streamId)
        }
      })
    }

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        entry.controller = controller
        flushPending(entry)
      },
      cancel() {
        if (entry.done) return
        entry.done = true
        activeProxyStreams.delete(streamId)
        messenger.sendNotification(AIChatProxyCancel, HOST_EXTENSION, { streamId })
      },
    })

    return new Response(stream, {
      status: result.status,
      statusText: 'OK',
      headers: { 'content-type': 'text/event-stream' },
    })
  },
}

export function getVscodeState(): VscodeState {
  const state = vscode.getState()
  return {
    viewId: state?.viewId ?? __VIEW_ID as ViewId,
    projectId: state?.projectId ?? __PROJECT_ID as ProjectId,
    view: state?.view ?? null,
    model: state?.model ?? null,
    nodesDraggable: state?.nodesDraggable ?? __INTERNAL_STATE?.nodesDraggable ?? true,
    edgesEditable: state?.edgesEditable ?? __INTERNAL_STATE?.edgesEditable ?? true,
    updatedAt: state?.updatedAt ?? 0,
    screen: state?.screen ?? __SCREEN,
    projectsOverview: state?.projectsOverview ?? null,
  }
}

export const saveVscodeState = (state: Partial<VscodeState>) => {
  vscode.setState({
    ...getVscodeState(),
    ...state,
    updatedAt: Date.now(),
  })
}
