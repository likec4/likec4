// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { LLMProviderConfig } from './providers/types'

const STORAGE_KEY = 'likec4:ai-chat:config'

export function loadProviderConfig(): LLMProviderConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const config = parsed as Record<string, unknown>
    if (typeof config['providerId'] !== 'string' || typeof config['model'] !== 'string') return null
    return config as unknown as LLMProviderConfig
  } catch {
    return null
  }
}

export function saveProviderConfig(config: LLMProviderConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {
    // localStorage may be unavailable in some contexts
  }
}

export function clearProviderConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
