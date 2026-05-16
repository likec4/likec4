// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, expect, it } from 'vitest'
import type { SharedVirtualModuleOptions } from './_shared'
import { generateRpcModuleCode } from './rpc'

function moduleOptions(
  overrides: Partial<SharedVirtualModuleOptions>,
): SharedVirtualModuleOptions {
  return {
    rpcEnabled: false,
    logger: {} as SharedVirtualModuleOptions['logger'],
    likec4: {} as SharedVirtualModuleOptions['likec4'],
    assetsDir: '',
    isAIAvailable: false,
    ai: undefined,
    aiEndpoint: undefined,
    aiAdapterName: undefined,
    ...overrides,
  }
}

describe('rpc virtual module', () => {
  it('enables AI chat for static builds when an external AI endpoint is configured', () => {
    const code = generateRpcModuleCode(moduleOptions({
      isAIAvailable: true,
      aiEndpoint: 'https://proxy.example.com/__likec4_ai',
      aiAdapterName: 'external',
    }))

    expect(code).toContain('export const isRpcAvailable = !!import.meta.hot && false')
    expect(code).toContain('export const aiEndpoint = "https://proxy.example.com/__likec4_ai"')
    expect(code).toContain('export const isAIAvailable = true && !!aiEndpoint')
    expect(code).toContain('export const isLocalAIAvailable = isRpcAvailable && false')
  })

  it('uses the local dev-server AI endpoint when local AI is configured', () => {
    const code = generateRpcModuleCode(moduleOptions({
      rpcEnabled: true,
      isAIAvailable: true,
      ai: { adapter: { name: 'openai' } } as SharedVirtualModuleOptions['ai'],
      aiEndpoint: '/__likec4_ai',
      aiAdapterName: 'openai',
    }))

    expect(code).toContain('export const isRpcAvailable = !!import.meta.hot && true')
    expect(code).toContain('export const aiEndpoint = "/__likec4_ai"')
    expect(code).toContain('export const isAIAvailable = true && !!aiEndpoint')
    expect(code).toContain('export const isLocalAIAvailable = isRpcAvailable && true')
  })
})
