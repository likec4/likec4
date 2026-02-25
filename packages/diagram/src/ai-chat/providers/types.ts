// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  reasoning?: string
  /** Duration of reasoning/thinking phase in seconds */
  reasoningDuration?: number
}

export interface ChatStreamCallbacks {
  onToken: (token: string) => void
  onReasoningToken: (token: string) => void
  onComplete: (fullText: string, reasoning?: string) => void
  onError: (error: Error) => void
}

export interface LLMProviderConfig {
  providerId: string
  apiKey: string
  model: string
  baseUrl?: string
  /** Custom fetch function to bypass CORS (e.g. in VSCode webview) */
  customFetch?:
    | ((input: string | URL, init?: Omit<RequestInit, 'body'> & { body?: string }) => Promise<Response>)
    | undefined
}

export interface LLMProvider {
  id: string
  displayName: string
  defaultModel: string
  availableModels: readonly string[]
  requiresApiKey: boolean
  defaultBaseUrl?: string
  streamChat(
    messages: ChatMessage[],
    config: LLMProviderConfig,
    callbacks: ChatStreamCallbacks,
    signal: AbortSignal,
  ): Promise<void>
}
