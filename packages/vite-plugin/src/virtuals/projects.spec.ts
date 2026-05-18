// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, expect, it } from 'vitest'
import { generateProjectsModuleCode } from './projects'

describe('projects virtual module', () => {
  it('exposes safe AI Chat project defaults', () => {
    const code = generateProjectsModuleCode([{
      id: 'demo',
      title: 'Demo',
      landingPage: undefined,
      aiChat: {
        enabled: true,
        systemPrompt: 'Answer from model facts.',
        suggestedQuestions: {
          element: ['What does {title} do?'],
        },
        context: {
          relationships: {
            metadata: true,
          },
        },
      },
    }])

    expect(code).toContain('aiChat')
    expect(code).toContain('Answer from model facts.')
    expect(code).toContain('What does {title} do?')
    expect(code).not.toContain('apiKey')
    expect(code).not.toContain('allowUnsafeApiKey')
  })
})
