// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { createContext, useContext } from 'react'

export type AIChatProjectConfig = {
  enabled?: boolean | undefined
  apiKey?: string | undefined
  model?: string | undefined
  baseUrl?: string | undefined
  allowUnsafeApiKey?: boolean | undefined
  suggestedQuestions?: {
    element?: string[] | undefined
  } | undefined
  systemPrompt?: string | undefined
  /** Custom fetch function to bypass CORS (e.g. in VSCode webview) */
  customFetch?:
    | ((input: string | URL, init?: Omit<RequestInit, 'body'> & { body?: string }) => Promise<Response>)
    | undefined
}

const AIChatConfigContext = createContext<AIChatProjectConfig | null>(null)

export const AIChatConfigProvider = AIChatConfigContext.Provider

export function useAIChatConfig(): AIChatProjectConfig | null {
  return useContext(AIChatConfigContext)
}
