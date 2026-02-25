// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { ReasoningTagParser } from './reasoning-tag-parser'
import type { ChatMessage, ChatStreamCallbacks, LLMProvider, LLMProviderConfig } from './types'

async function parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  callbacks: ChatStreamCallbacks,
  signal: AbortSignal,
): Promise<void> {
  const decoder = new TextDecoder()
  let buffer = ''
  let fullText = ''
  let reasoningText = ''
  let hasNativeReasoning = false

  const tagParser = new ReasoningTagParser({
    onContent: (text) => {
      fullText += text
      callbacks.onToken(text)
    },
    onReasoning: (text) => {
      reasoningText += text
      callbacks.onReasoningToken(text)
    },
  })

  try {
    while (!signal.aborted) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ') || line === 'data: [DONE]') continue

        try {
          const data = JSON.parse(line.slice(6))
          const delta = data.choices?.[0]?.delta
          // Support separate reasoning fields used by some providers
          const reasoning = delta?.reasoning_content ?? delta?.reasoning ?? delta?.thinking
          if (reasoning) {
            hasNativeReasoning = true
            reasoningText += reasoning
            callbacks.onReasoningToken(reasoning)
          }
          if (delta?.content) {
            // Skip <think> tag parsing when model provides native reasoning fields
            if (hasNativeReasoning) {
              fullText += delta.content
              callbacks.onToken(delta.content)
            } else {
              tagParser.process(delta.content)
            }
          }
        } catch (e) {
          if (e instanceof SyntaxError) continue
          throw e
        }
      }
    }

    // Parse any leftover data in buffer (stream ended without trailing newline)
    if (buffer.trim()) {
      const line = buffer.trim()
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        try {
          const data = JSON.parse(line.slice(6))
          const delta = data.choices?.[0]?.delta
          const reasoning = delta?.reasoning_content ?? delta?.reasoning ?? delta?.thinking
          if (reasoning) {
            hasNativeReasoning = true
            reasoningText += reasoning
            callbacks.onReasoningToken(reasoning)
          }
          if (delta?.content) {
            if (hasNativeReasoning) {
              fullText += delta.content
              callbacks.onToken(delta.content)
            } else {
              tagParser.process(delta.content)
            }
          }
        } catch {
          // ignore parse errors in trailing buffer
        }
      }
    }

    // If aborted (user cancelled), skip completion — the actor handles cancel.stream separately
    if (signal.aborted) return

    tagParser.flush()

    // If model sent reasoning but no content (e.g. Nemotron), treat reasoning as content
    if (!fullText && reasoningText) {
      callbacks.onComplete(reasoningText, undefined)
    } else {
      callbacks.onComplete(fullText, reasoningText || undefined)
    }
  } finally {
    reader.releaseLock()
  }
}

export const openaiProvider: LLMProvider = {
  id: 'openai',
  displayName: 'OpenAI',
  defaultModel: 'gpt-4o',
  availableModels: [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4.1',
    'gpt-4.1-mini',
    'gpt-4.1-nano',
  ],
  requiresApiKey: true,

  async streamChat(
    messages: ChatMessage[],
    config: LLMProviderConfig,
    callbacks: ChatStreamCallbacks,
    signal: AbortSignal,
  ): Promise<void> {
    const baseUrl = config.baseUrl ?? 'https://api.openai.com/v1'
    const fetchFn = config.customFetch ?? globalThis.fetch

    const response = await fetchFn(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: config.model,
        stream: true,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      }),
      signal,
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error')
      throw new Error(`OpenAI API error (${response.status}): ${errorBody}`)
    }

    if (!response.body) {
      throw new Error('No response body from OpenAI API')
    }

    await parseSSEStream(response.body.getReader(), callbacks, signal)
  },
}
