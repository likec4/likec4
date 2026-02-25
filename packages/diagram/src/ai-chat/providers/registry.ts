// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { openaiProvider } from './openai'
import type { LLMProvider } from './types'

export const providers: readonly LLMProvider[] = [
  openaiProvider,
]

export function getProvider(id: string): LLMProvider | undefined {
  return providers.find(p => p.id === id)
}
