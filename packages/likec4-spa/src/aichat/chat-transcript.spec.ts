// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, expect, it } from 'vitest'
import { formatChatMessageText, formatChatTranscript } from './chat-transcript'
import type { TypedUIMessages } from './useChat'

describe('formatChatTranscript', () => {
  it('formats user and assistant text messages', () => {
    const messages: TypedUIMessages = [
      {
        id: 'user-1',
        role: 'user',
        parts: [{ type: 'text', content: 'What view is open?' }],
      },
      {
        id: 'assistant-1',
        role: 'assistant',
        parts: [{ type: 'text', content: 'top<Graphlet>' }],
      },
    ]

    expect(formatChatTranscript(messages)).toBe(
      '## User\n\nWhat view is open?\n\n## Assistant\n\ntop<Graphlet>',
    )
  })

  it('omits tool calls and tool results from exported transcript', () => {
    const messages: TypedUIMessages = [
      {
        id: 'assistant-1',
        role: 'assistant',
        parts: [
          {
            type: 'tool-call',
            id: 'call-1',
            name: 'read_ui',
            arguments: '{}',
            state: 'input-complete',
            output: {
              projectId: 'demo_project',
              editMode: false,
              view: {
                id: 'top',
                title: 'top<Graphlet>',
                type: 'element',
              },
            },
          },
          {
            type: 'tool-result',
            toolCallId: 'call-1',
            content: '{"projectId":"demo_project"}',
            state: 'complete',
          },
          { type: 'text', content: 'top<Graphlet>' },
        ],
      },
    ]

    expect(formatChatTranscript(messages)).toBe('## Assistant\n\ntop<Graphlet>')
    expect(formatChatMessageText(messages[0]!)).toBe('top<Graphlet>')
  })
})
