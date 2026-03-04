// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { DiagramView, Fqn, NodeId } from '@likec4/core/types'
import type { Rect } from '@xyflow/system'
import {
  type ActorRef,
  type SnapshotFrom,
  type StateMachine,
  assign,
  fromCallback,
  setup,
} from 'xstate'
import { loadProviderConfig } from './config'
import type { ChatMessage, LLMProviderConfig } from './providers/types'

export type AIChatSubject = { type: 'element'; fqn: Fqn }

export type AIChatInput = {
  subject: AIChatSubject
  currentView: DiagramView
  initiatedFrom?: {
    node?: NodeId
    clientRect?: Rect
  }
}

export type AIChatContext = {
  subject: AIChatSubject
  currentView: DiagramView
  initiatedFrom: {
    node: NodeId | null
    clientRect: Rect | null
  }
  messages: ChatMessage[]
  currentStreamingResponse: string
  currentStreamingReasoning: string
  streamingStartTime: number
  isStreaming: boolean
  error: string | null
  /** Stored for invoke input (set on transition to streaming) */
  _streamSystemPrompt: string
  _streamProviderConfig: LLMProviderConfig | undefined
}

export type AIChatEvents =
  | { type: 'send.message'; content: string; systemPrompt: string; providerConfig?: LLMProviderConfig }
  | { type: 'retry.last'; systemPrompt: string; providerConfig?: LLMProviderConfig }
  | { type: 'stream.token'; token: string }
  | { type: 'stream.reasoning'; token: string }
  | { type: 'stream.complete'; fullText: string; reasoning?: string }
  | { type: 'stream.error'; error: string }
  | { type: 'cancel.stream' }
  | { type: 'clear.messages' }
  | { type: 'close' }

type StreamChildInput = {
  messages: ChatMessage[]
  systemPrompt: string
  providerConfig?: LLMProviderConfig
}

const streamingLogic = fromCallback<AIChatEvents, StreamChildInput>(({ sendBack, input }) => {
  const controller = new AbortController()
  ;(async () => {
    try {
      // Use project-level config if provided, otherwise fall back to localStorage config
      const config: LLMProviderConfig | null = input.providerConfig ?? loadProviderConfig()
      if (!config) {
        sendBack({ type: 'stream.error', error: 'No LLM provider configured. Open settings to configure.' })
        return
      }

      const { getProvider } = await import('./providers/registry')
      const provider = getProvider(config.providerId)
      if (!provider) {
        sendBack({ type: 'stream.error', error: `Unknown provider: ${config.providerId}` })
        return
      }

      const allMessages: ChatMessage[] = [
        { role: 'system', content: input.systemPrompt },
        ...input.messages,
      ]

      await provider.streamChat(
        allMessages,
        config,
        {
          onToken: (token) => sendBack({ type: 'stream.token', token }),
          onReasoningToken: (token) => sendBack({ type: 'stream.reasoning', token }),
          onComplete: (fullText, reasoning) => sendBack({ type: 'stream.complete', fullText, reasoning }),
          onError: (error) => sendBack({ type: 'stream.error', error: error.message }),
        },
        controller.signal,
      )
    } catch (error) {
      if (controller.signal.aborted) return
      const message = error instanceof Error ? error.message : 'Unknown streaming error'
      sendBack({ type: 'stream.error', error: message })
    }
  })()

  return () => {
    controller.abort()
  }
})

const _aiChatLogic = setup({
  types: {
    context: {} as AIChatContext,
    input: {} as AIChatInput,
    events: {} as AIChatEvents,
  },
  actors: {
    streamingLogic,
  },
}).createMachine({
  id: 'ai-chat',
  context: ({ input }) => ({
    ...input,
    initiatedFrom: {
      node: input.initiatedFrom?.node ?? null,
      clientRect: input.initiatedFrom?.clientRect ?? null,
    },
    messages: [],
    currentStreamingResponse: '',
    currentStreamingReasoning: '',
    streamingStartTime: 0,
    isStreaming: false,
    error: null,
    _streamSystemPrompt: '',
    _streamProviderConfig: undefined,
  }),
  initial: 'active',
  states: {
    active: {
      initial: 'idle',
      states: {
        idle: {
          on: {
            'clear.messages': {
              actions: assign({
                messages: [],
                currentStreamingResponse: '',
                currentStreamingReasoning: '',
                error: null,
              }),
            },
            'send.message': {
              target: 'streaming',
              actions: assign({
                messages: ({ context, event }) => [
                  ...context.messages,
                  { role: 'user' as const, content: event.content },
                ],
                error: null,
              }),
            },
            'retry.last': {
              target: 'streaming',
              guard: ({ context }) => context.messages.some(m => m.role === 'user'),
              actions: assign({
                // Drop the last assistant message so the model retries from the last user prompt
                messages: ({ context }) => {
                  const msgs = [...context.messages]
                  while (msgs.length > 0 && msgs[msgs.length - 1]!.role === 'assistant') {
                    msgs.pop()
                  }
                  return msgs
                },
                error: null,
              }),
            },
          },
        },
        streaming: {
          entry: assign(({ event }) => ({
            isStreaming: true,
            currentStreamingResponse: '',
            currentStreamingReasoning: '',
            streamingStartTime: Date.now(),
            ...((event.type === 'send.message' || event.type === 'retry.last') && {
              _streamSystemPrompt: event.systemPrompt,
              _streamProviderConfig: event.providerConfig,
            }),
          })),
          exit: assign({ isStreaming: false }),
          invoke: {
            src: 'streamingLogic',
            input: ({ context }) => ({
              messages: context.messages,
              systemPrompt: context._streamSystemPrompt,
              ...(context._streamProviderConfig && { providerConfig: context._streamProviderConfig }),
            }),
          },
          on: {
            'stream.token': {
              actions: assign({
                currentStreamingResponse: ({ context, event }) => context.currentStreamingResponse + event.token,
              }),
            },
            'stream.reasoning': {
              actions: assign({
                currentStreamingReasoning: ({ context, event }) => context.currentStreamingReasoning + event.token,
              }),
            },
            'stream.complete': {
              target: 'idle',
              actions: assign({
                messages: ({ context, event }) => {
                  const duration = Math.floor((Date.now() - context.streamingStartTime) / 1000)
                  return [
                    ...context.messages,
                    {
                      role: 'assistant' as const,
                      content: event.fullText,
                      ...(event.reasoning && { reasoning: event.reasoning, reasoningDuration: duration }),
                    },
                  ]
                },
                currentStreamingResponse: '',
                currentStreamingReasoning: '',
              }),
            },
            'stream.error': {
              target: 'idle',
              actions: assign({
                error: ({ event }) => event.error,
                currentStreamingResponse: '',
                currentStreamingReasoning: '',
              }),
            },
            'cancel.stream': {
              target: 'idle',
              actions: assign({
                messages: ({ context }) => {
                  const partial = context.currentStreamingResponse.trim()
                  const reasoning = context.currentStreamingReasoning.trim()
                  if (!partial && !reasoning) return context.messages
                  const duration = Math.floor((Date.now() - context.streamingStartTime) / 1000)
                  return [
                    ...context.messages,
                    {
                      role: 'assistant' as const,
                      content: partial || '*(cancelled)*',
                      ...(reasoning && { reasoning, reasoningDuration: duration }),
                    },
                  ]
                },
                currentStreamingResponse: '',
                currentStreamingReasoning: '',
              }),
            },
          },
        },
      },
      on: {
        'close': 'closed',
      },
    },
    closed: {
      id: 'closed',
      type: 'final',
    },
  },
})

export interface AIChatLogic extends
  StateMachine<
    AIChatContext,
    AIChatEvents,
    any,
    any,
    any,
    any,
    any,
    any,
    never,
    AIChatInput,
    any,
    any,
    any,
    any
  >
{
}
export const aiChatLogic: AIChatLogic = _aiChatLogic as any

export type AIChatSnapshot = SnapshotFrom<AIChatLogic>
export interface AIChatActorRef extends ActorRef<AIChatSnapshot, AIChatEvents> {
}

export type {
  AIChatInput as Input,
}
