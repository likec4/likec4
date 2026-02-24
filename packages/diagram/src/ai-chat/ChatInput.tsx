// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { ActionIcon, Textarea } from '@mantine/core'
import { IconPlayerStop, IconSend2 } from '@tabler/icons-react'
import { type KeyboardEvent, useEffect, useRef, useState } from 'react'
import * as styles from './AIChatCard.css'

type ChatInputProps = {
  onSend: (message: string) => void
  onCancel: () => void
  isStreaming: boolean
}

/** Chat input with send/cancel controls and Enter-to-submit keyboard shortcut. */
export function ChatInput({ onSend, onCancel, isStreaming }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || isStreaming) return
    onSend(trimmed)
    setValue('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={styles.inputArea}>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about this element..."
        autosize
        minRows={1}
        maxRows={4}
        style={{ flex: 1 }}
        disabled={isStreaming}
        size="sm"
      />
      {isStreaming
        ? (
          <ActionIcon
            variant="light"
            color="red"
            size="lg"
            onClick={onCancel}
            aria-label="Stop streaming"
          >
            <IconPlayerStop size={18} />
          </ActionIcon>
        )
        : (
          <ActionIcon
            variant="filled"
            size="lg"
            onClick={handleSend}
            disabled={!value.trim()}
            aria-label="Send message"
          >
            <IconSend2 size={18} />
          </ActionIcon>
        )}
    </div>
  )
}
