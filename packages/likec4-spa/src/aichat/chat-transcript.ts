// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { TypedUIMessages } from './useChat'

const roleLabel = {
  system: 'System',
  user: 'User',
  assistant: 'Assistant',
} as const

export function formatChatTranscript(messages: TypedUIMessages): string {
  return messages
    .map(message => {
      const text = formatChatMessageText(message)

      if (!text) {
        return ''
      }

      return `## ${roleLabel[message.role]}\n\n${text}`
    })
    .filter(Boolean)
    .join('\n\n')
}

export function formatChatMessageText(message: TypedUIMessages[number]): string {
  return message.parts
    .flatMap(part => part.type === 'text' ? [part.content.trim()] : [])
    .filter(Boolean)
    .join('\n\n')
}
