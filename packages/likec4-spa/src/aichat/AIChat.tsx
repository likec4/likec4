// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { useCurrentViewModel, useDiagramContext } from '@likec4/diagram'
import { css } from '@likec4/styles/css'
import { HStack, Txt, VStack } from '@likec4/styles/jsx'
import {
  ActionIcon,
  Badge,
  Button,
  CloseButton,
  CopyButton as MantineCopyButton,
  FloatingWindow,
  rem,
  ScrollAreaAutosize,
  Tooltip,
} from '@mantine/core'
import type { SetFloatingWindowPosition } from '@mantine/hooks'
import { useLocalStorage } from '@mantine/hooks'
import { useTimeoutEffect } from '@react-hookz/web'
import { IconCheck, IconCopy, IconDownload, IconSparkles } from '@tabler/icons-react'
import { AIAdapter } from 'likec4:rpc'
import { AnimatePresence, m } from 'motion/react'
import type { PanInfo } from 'motion/react'
import { useMemo, useRef } from 'react'
import { useCurrentProject } from '../hooks'
import { formatChatTranscript } from './chat-transcript'
import {
  type ChatWindowResizeDelta,
  type ChatWindowSize,
  CHAT_WINDOW_CONSTRAIN_OFFSET,
  DEFAULT_CHAT_WINDOW_SIZE,
  maxChatWindowSizeForResize,
  resizeChatWindowSize,
} from './chat-window-size'
import { ChatContext } from './ChatContext'
import { ChatInput } from './ChatInput'
import { ChatMessages } from './ChatMessage'
import { buildElementTemplateVariables, getSelectedElementId, interpolateChatTemplate } from './ui-state-data'
import { useChat } from './useChat'

type Position = { left?: number; top?: number; right?: number; bottom?: number }

const storage = {
  key: 'likec4.ai.chat.position',
  read(): Position | null {
    try {
      const stored = localStorage.getItem(this.key)
      if (!stored) return null
      return JSON.parse(stored)
    } catch {
      return null
    }
  },
  write<T extends Position | null>(position: T): T {
    try {
      if (position === null) {
        localStorage.removeItem(this.key)
        return position
      }
      localStorage.setItem(this.key, JSON.stringify(position))
    } catch {
      // ignore
    }
    return position
  },
}

const chatWindowClassName = css({
  rounded: 'md',
  padding: 'xs',
  shadow: 'md',
  layerStyle: 'likec4.panel',
  overflow: 'hidden',
})

const resizeHandleClassName = css({
  position: 'absolute',
  width: '14px',
  height: '14px',
  border: '3px solid',
  borderColor: 'text.dimmed',
  borderTop: 'none',
  borderLeft: 'none',
  borderRadius: 'xs',
  bottom: '1',
  right: '1',
  cursor: 'se-resize',
  opacity: 0.7,
  transition: 'fast',
  _hover: {
    opacity: 1,
    borderColor: 'text.bright',
  },
})

const suggestedQuestionClassName = css({
  maxWidth: '100%',
  height: 'auto',
  minHeight: '7',
  whiteSpace: 'normal',
  textAlign: 'left',
})

export default function AIChatComponent() {
  const initialPosition = useRef<{ left?: number; top?: number; right?: number; bottom?: number }>(null)
  const setPositionRef = useRef<SetFloatingWindowPosition | null>(null)
  if (!initialPosition.current) {
    initialPosition.current = storage.read() ?? { right: 16, bottom: 100 }
  }
  const onPositionChange = (pos: { x: number; y: number }) => {
    initialPosition.current = storage.write({ left: pos.x, top: pos.y })
  }

  const [isCollapsed, setCollapsed] = useLocalStorage({
    key: 'likec4.ai.chat.collapsed',
    defaultValue: true,
  })

  const [windowSize, setWindowSize] = useLocalStorage<ChatWindowSize>({
    key: 'likec4.ai.chat.size',
    defaultValue: DEFAULT_CHAT_WINDOW_SIZE,
  })

  const resizeWindow = (delta: ChatWindowResizeDelta) => {
    const windowElement = document.querySelector<HTMLElement>('[data-likec4-ai-window]')
    const rect = windowElement?.getBoundingClientRect()
    const position = rect
      ? {
        left: Math.max(CHAT_WINDOW_CONSTRAIN_OFFSET, rect.left),
        top: Math.max(CHAT_WINDOW_CONSTRAIN_OFFSET, rect.top),
      }
      : undefined
    const maxSize = rect ? maxChatWindowSizeForResize(rect) : undefined
    setWindowSize(size => resizeChatWindowSize(size, delta, maxSize))
    if (position) {
      requestAnimationFrame(() => setPositionRef.current?.(position))
    }
  }

  return (
    <AnimatePresence>
      {!isCollapsed && (
        <FloatingWindow
          w={`min(${windowSize.width}px, calc(100vw - 16px))`}
          h={`min(${windowSize.height}px, calc(100vh - 16px))`}
          pos="fixed"
          className={chatWindowClassName}
          data-likec4-ai-window
          constrainToViewport
          constrainOffset={CHAT_WINDOW_CONSTRAIN_OFFSET}
          excludeDragHandleSelector=".chat-input, .chat-action, .chat-resize-handle"
          initialPosition={initialPosition.current}
          onPositionChange={onPositionChange}
          setPositionRef={setPositionRef}
        >
          <AIChatWindowContent
            onClose={() => setCollapsed(true)}
            onResize={resizeWindow} />
        </FloatingWindow>
      )}
      {isCollapsed && (
        <m.div
          key={'collapsed'}
          initial={{ opacity: 0.1, translateX: '10%' }}
          animate={{ opacity: 1, translateX: 0 }}
          exit={{
            translateX: '50%',
            opacity: 0.1,
          }}
          style={{
            position: 'fixed',
            right: 8,
            bottom: 60,
            zIndex: 1000,
          }}
        >
          <Tooltip label="Show AI Assistant" color="dark" fz={'xs'}>
            <ActionIcon
              size={'lg'}
              variant="gradient"
              onClick={() => setCollapsed(false)}
            >
              <IconSparkles stroke={1.5} />
            </ActionIcon>
          </Tooltip>
        </m.div>
      )}
    </AnimatePresence>
  )
}

function AIChatWindowContent({
  onClose,
  onResize,
}: {
  onClose: () => void
  onResize: (delta: ChatWindowResizeDelta) => void
}) {
  const scrollAnchorRef = useRef<HTMLDivElement>(null)
  const scrollIntoView = () => {
    scrollAnchorRef.current?.scrollIntoView()
  }

  useTimeoutEffect(() => {
    scrollIntoView()
  }, 100)

  const chat = useChat({
    onChunk: scrollIntoView,
  })
  const suggestedQuestions = useSuggestedQuestions()
  const transcript = formatChatTranscript(chat.messages)
  const hasTranscript = transcript.length > 0
  const resizeByDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    onResize({
      width: info.delta.x,
      height: info.delta.y,
    })
  }
  return (
    <ChatContext value={chat}>
      <VStack w="100%" h="100%">
        <HStack cursor={'move'} justify="space-between">
          <HStack>
            <Txt textStyle="likec4.panel" userSelect="none">AI Assistant</Txt>
            <Badge size="xs" radius={'sm'} variant="light">{AIAdapter}</Badge>
          </HStack>
          <HStack gap="xs">
            <MantineCopyButton value={transcript} timeout={2000}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copied' : 'Copy chat'} color="dark" fz={'xs'}>
                  <ActionIcon
                    aria-label="Copy chat transcript"
                    className="chat-action"
                    size={'sm'}
                    color={copied ? 'teal' : 'gray'}
                    variant="subtle"
                    disabled={!hasTranscript}
                    onClick={e => {
                      e.stopPropagation()
                      copy()
                    }}>
                    {copied
                      ? <IconCheck style={{ width: rem(14), height: rem(14) }} />
                      : <IconCopy style={{ width: rem(14), height: rem(14) }} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </MantineCopyButton>
            <Tooltip label="Download chat" color="dark" fz={'xs'}>
              <ActionIcon
                aria-label="Download chat transcript"
                className="chat-action"
                size={'sm'}
                color="gray"
                variant="subtle"
                disabled={!hasTranscript}
                onClick={e => {
                  e.stopPropagation()
                  downloadTranscript(transcript)
                }}>
                <IconDownload style={{ width: rem(14), height: rem(14) }} />
              </ActionIcon>
            </Tooltip>
            <CloseButton
              className="chat-action"
              size={'sm'}
              onClick={e => {
                e.stopPropagation()
                onClose()
              }} />
          </HStack>
        </HStack>
        <ScrollAreaAutosize
          scrollbars="y"
          w="100%"
          flex={1}
          mih={0}
          mah="100%"
          classNames={{
            content: css({
              display: 'contents',
            }),
          }}>
          <VStack>
            {chat.messages.length === 0 && suggestedQuestions.length > 0 && (
              <HStack flexWrap="wrap" gap="xs" alignSelf="stretch">
                {suggestedQuestions.map(question => (
                  <Button
                    key={question}
                    className={`${suggestedQuestionClassName} chat-action`}
                    size="xs"
                    variant="light"
                    color="gray"
                    onClick={() => chat.sendMessage(question)}>
                    {question}
                  </Button>
                ))}
              </HStack>
            )}
            <ChatMessages />
            <div ref={scrollAnchorRef} style={{ height: 2 }}></div>
          </VStack>
        </ScrollAreaAutosize>
        <ChatInput />
        <m.div
          aria-label="Resize AI Assistant"
          className={`${resizeHandleClassName} chat-resize-handle`}
          drag
          dragElastic={0}
          dragMomentum={false}
          dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
          onDrag={resizeByDrag} />
      </VStack>
    </ChatContext>
  )
}

function downloadTranscript(transcript: string) {
  const blob = new Blob([transcript], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `likec4-ai-chat-${new Date().toISOString().replace(/[:.]/g, '-')}.md`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

function useSuggestedQuestions(): string[] {
  const project = useCurrentProject()
  const currentViewModel = useCurrentViewModel()
  const selectedElementId = useDiagramContext(getSelectedElementId)
  const templates: readonly string[] = project.aiChat?.suggestedQuestions?.element ?? []

  return useMemo(() => {
    if (templates.length === 0) {
      return []
    }

    const element = selectedElementId ? currentViewModel.$model.findElement(selectedElementId) : null
    const variables = buildElementTemplateVariables(element, currentViewModel)

    return templates
      .map(template => interpolateChatTemplate(template, variables, { hideIfEmpty: true }))
      .filter((question): question is string => !!question)
  }, [currentViewModel, selectedElementId, templates])
}
