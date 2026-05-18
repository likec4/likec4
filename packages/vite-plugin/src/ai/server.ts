// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { invariant } from '@likec4/core'
import { chat, convertMessagesToModelMessages, toServerSentEventsResponse } from '@tanstack/ai'
import type { ModelMessage, UIMessage } from '@tanstack/ai'
import type { AIOptions } from '../plugin'
import { navigateToDef, readUiStateDef, updateUiStateDef } from './tools'

export const LIKEC4_AI_ENDPOINT_PATH = '/__likec4_ai'
export const DEFAULT_LIKEC4_AI_REQUEST_MAX_BYTES = 4 * 1024 * 1024

export type LikeC4AIRequestBody = {
  messages: Array<UIMessage | ModelMessage>
  data?: Record<string, unknown>
}

export class LikeC4AIRequestBodyValidationError extends Error {
  readonly statusCode = 400

  constructor(message: string) {
    super(message)
    this.name = 'LikeC4AIRequestBodyValidationError'
  }
}

export class LikeC4AIRequestBodyTooLargeError extends Error {
  readonly statusCode = 413

  constructor(readonly maxBytes: number) {
    super(`LikeC4 AI request body exceeds ${maxBytes} bytes`)
    this.name = 'LikeC4AIRequestBodyTooLargeError'
  }
}

function validateLikeC4AIRequestBody(value: unknown): LikeC4AIRequestBody {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new LikeC4AIRequestBodyValidationError('AI request body must be an object')
  }

  const body = value as Record<string, unknown>
  if (!Array.isArray(body['messages'])) {
    throw new LikeC4AIRequestBodyValidationError('AI request body messages must be an array')
  }

  const data = body['data']
  if (data !== undefined && (!data || typeof data !== 'object' || Array.isArray(data))) {
    throw new LikeC4AIRequestBodyValidationError('AI request body data must be an object')
  }

  return {
    messages: body['messages'] as Array<UIMessage | ModelMessage>,
    ...(data && { data: data as Record<string, unknown> }),
  }
}

export type ReadLikeC4AIRequestBodyOptions = {
  maxBytes?: number | undefined
}

export async function readLikeC4AIRequestBody(
  req: AsyncIterable<unknown>,
  { maxBytes = DEFAULT_LIKEC4_AI_REQUEST_MAX_BYTES }: ReadLikeC4AIRequestBodyOptions = {},
): Promise<LikeC4AIRequestBody> {
  const chunks = [] as Buffer[]
  let receivedBytes = 0
  for await (const chunk of req) {
    const buffer = typeof chunk === 'string'
      ? Buffer.from(chunk)
      : Buffer.isBuffer(chunk)
      ? chunk
      : Buffer.from(chunk as Uint8Array)
    receivedBytes += buffer.byteLength
    if (receivedBytes > maxBytes) {
      throw new LikeC4AIRequestBodyTooLargeError(maxBytes)
    }
    chunks.push(buffer)
  }
  return validateLikeC4AIRequestBody(JSON.parse(Buffer.concat(chunks).toString('utf8')))
}

export type CreateLikeC4AIResponseParams = {
  ai: AIOptions | undefined
  body: LikeC4AIRequestBody
}

export function createLikeC4AIResponse({
  ai,
  body,
}: CreateLikeC4AIResponseParams): Response {
  invariant(ai, 'AI is not configured')

  const messages = convertMessagesToModelMessages(body.messages ?? [])
  const stream = chat({
    ...ai,
    messages,
    conversationId: typeof body.data?.['conversationId'] === 'string' ? body.data['conversationId'] : undefined,
    systemPrompts: [
      'You are a helpful assistant that can answer questions about LikeC4 model and update UI.',
    ],
    tools: [
      navigateToDef,
      updateUiStateDef,
      readUiStateDef,
    ],
  })

  return toServerSentEventsResponse(stream)
}
