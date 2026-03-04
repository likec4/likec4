// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { Fqn, NodeId, ViewId } from '@likec4/core/types'
import {
  ActionIcon,
  CloseButton,
  RemoveScroll,
  Text,
} from '@mantine/core'
import { useViewportSize } from '@mantine/hooks'
import { IconMessageChatbot, IconSettings, IconTrash } from '@tabler/icons-react'
import type { Rect } from '@xyflow/system'
import { type PanInfo, m, useDragControls, useMotionValue } from 'motion/react'
import { useCallback, useRef, useState } from 'react'
import { clamp } from 'remeda'
import { useCurrentViewModel } from '../hooks/useCurrentViewModel'
import { useLikeC4Model } from '../hooks/useLikeC4Model'
import type { AIChatActorRef, AIChatSnapshot, AIChatSubject } from './actor'
import * as styles from './AIChatCard.css'
import { useAIChatConfig } from './AIChatConfigContext'
import { ChatInput } from './ChatInput'
import { ChatMessageList } from './ChatMessageList'
import { loadProviderConfig } from './config'
import { type TemplateVariables, buildSystemPrompt, buildTemplateVariables } from './context-builder'
import type { LLMProviderConfig } from './providers/types'
import { ProviderSettings } from './ProviderSettings'

const MIN_PADDING = 24

type AIChatCardProps = {
  viewId: ViewId
  fromNode: NodeId | null
  rectFromNode: Rect | null
  subject: AIChatSubject
  onClose: () => void
  actorRef: AIChatActorRef
  messages: AIChatSnapshot['context']['messages']
  streamingResponse: string
  streamingReasoning: string
  isStreaming: boolean
  error: string | null
}

export function AIChatCard({
  viewId: _viewId,
  fromNode: _fromNode,
  rectFromNode,
  subject,
  onClose,
  actorRef,
  messages,
  streamingResponse,
  streamingReasoning,
  isStreaming,
  error,
}: AIChatCardProps) {
  const [showSettings, setShowSettings] = useState(false)
  const windowSize = useViewportSize()
  const windowWidth = windowSize.width || (typeof window !== 'undefined' ? window.innerWidth : 0) || 1200
  const windowHeight = windowSize.height || (typeof window !== 'undefined' ? window.innerHeight : 0) || 800

  const model = useLikeC4Model()
  const viewModel = useCurrentViewModel()
  const projectAiConfig = useAIChatConfig()
  // Fully pre-configured = project config has apiKey bundled (allowUnsafeApiKey)
  const hasProjectApiKey = projectAiConfig != null && !!projectAiConfig.apiKey

  const dragControls = useDragControls()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const resizeRef = useRef<HTMLDivElement>(null)

  const cardWidth = useMotionValue(Math.min(520, windowWidth - MIN_PADDING * 2))
  const cardHeight = useMotionValue(Math.min(560, windowHeight - MIN_PADDING * 2))
  const initialCardWidth = Math.min(520, windowWidth - MIN_PADDING * 2)
  const initialCardHeight = Math.min(560, windowHeight - MIN_PADDING * 2)

  // Build template variables from element model
  let templateVars: TemplateVariables | null = null
  let subjectTitle = 'AI Chat'
  try {
    const element = model.element(subject.fqn)
    subjectTitle = element.title
    templateVars = buildTemplateVariables(element, viewModel)
  } catch {
    subjectTitle = String(subject.fqn)
  }

  // Build context and system prompt
  const getSystemPrompt = useCallback((): string => {
    if (!templateVars) {
      return buildSystemPrompt({
        title: subjectTitle,
        kind: '',
        technology: '',
        parent: '',
        tags: '',
        view: viewModel.title ?? viewModel.id,
        dependencies: '',
        dependents: '',
        context: `Element: ${subject.fqn}`,
      }, projectAiConfig?.systemPrompt)
    }
    return buildSystemPrompt(templateVars, projectAiConfig?.systemPrompt)
  }, [templateVars, viewModel, subject, subjectTitle, projectAiConfig?.systemPrompt])

  // Build provider config by merging project config with localStorage config.
  // Project config provides baseUrl/model; localStorage provides apiKey (and overrides if no project config).
  const buildProviderConfig = useCallback((): LLMProviderConfig | undefined => {
    const saved = loadProviderConfig()
    const customFetch = projectAiConfig?.customFetch
    if (hasProjectApiKey) {
      return {
        providerId: 'openai',
        apiKey: projectAiConfig.apiKey!,
        model: projectAiConfig.model || saved?.model || 'gpt-4o',
        ...(projectAiConfig.baseUrl && { baseUrl: projectAiConfig.baseUrl }),
        ...(customFetch && { customFetch }),
      }
    }
    if (!saved?.apiKey) return undefined
    const baseUrl = projectAiConfig?.baseUrl ?? saved.baseUrl
    return {
      providerId: 'openai',
      apiKey: saved.apiKey,
      model: projectAiConfig?.model || saved.model || 'gpt-4o',
      ...(baseUrl && { baseUrl }),
      ...(customFetch && { customFetch }),
    }
  }, [hasProjectApiKey, projectAiConfig])

  const handleSend = useCallback((content: string) => {
    const providerConfig = buildProviderConfig()
    actorRef.send({
      type: 'send.message',
      content,
      systemPrompt: getSystemPrompt(),
      ...(providerConfig && { providerConfig }),
    })
  }, [actorRef, getSystemPrompt, buildProviderConfig])

  const handleCancel = useCallback(() => {
    actorRef.send({ type: 'cancel.stream' })
  }, [actorRef])

  const handleRetry = useCallback(() => {
    const providerConfig = buildProviderConfig()
    actorRef.send({
      type: 'retry.last',
      systemPrompt: getSystemPrompt(),
      ...(providerConfig && { providerConfig }),
    })
  }, [actorRef, getSystemPrompt, buildProviderConfig])

  const handleClear = useCallback(() => {
    actorRef.send({ type: 'clear.messages' })
  }, [actorRef])

  // Position card (use initial card dimensions so bounds match on narrow viewports)
  const initialX = rectFromNode
    ? clamp(rectFromNode.x + rectFromNode.width + 16, {
      min: MIN_PADDING,
      max: windowWidth - initialCardWidth - MIN_PADDING,
    })
    : Math.max(MIN_PADDING, (windowWidth - initialCardWidth) / 2)

  const initialY = rectFromNode
    ? clamp(rectFromNode.y, {
      min: MIN_PADDING,
      max: windowHeight - initialCardHeight - MIN_PADDING,
    })
    : Math.max(MIN_PADDING, (windowHeight - initialCardHeight) / 2)

  return (
    <RemoveScroll forwardProps>
      <m.dialog
        ref={dialogRef}
        open
        className={styles.dialog}
        style={{
          [styles.backdropBlur as string]: '1px',
          [styles.backdropOpacity as string]: '2%',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => {
          if (e.target === dialogRef.current) {
            onClose()
          }
        }}
      >
        <m.div
          ref={cardRef}
          className={styles.card}
          drag
          dragControls={dragControls}
          dragListener={false}
          dragMomentum={false}
          dragElastic={0}
          initial={{
            x: initialX,
            y: initialY,
            opacity: 0,
            scale: 0.96,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            scale: 0.96,
          }}
          transition={{
            type: 'spring',
            damping: 25,
            stiffness: 400,
          }}
          style={{
            width: cardWidth,
            height: cardHeight,
          }}
        >
          {/* Header */}
          <div
            className={styles.cardHeader}
            onPointerDown={(e) => dragControls.start(e)}
          >
            <IconMessageChatbot size={20} style={{ opacity: 0.7, flex: '0 0 20px' }} />
            <Text className={styles.title} title={subjectTitle}>
              {subjectTitle}
            </Text>
            <ActionIcon
              variant="subtle"
              size="sm"
              color="gray"
              onClick={handleClear}
              disabled={messages.length === 0}
              aria-label="Clear messages"
            >
              <IconTrash size={14} />
            </ActionIcon>
            <ActionIcon
              variant={showSettings ? 'light' : 'subtle'}
              size="sm"
              color="gray"
              onClick={() => setShowSettings(v => !v)}
              aria-label="Settings"
            >
              <IconSettings size={14} />
            </ActionIcon>
            <CloseButton
              size="sm"
              onClick={onClose}
              aria-label="Close chat"
            />
          </div>

          {/* Settings */}
          {showSettings && <ProviderSettings onConfigured={() => setShowSettings(false)} />}

          {/* Error */}
          {error && (
            <div className={styles.errorMessage}>
              {error}
              <button
                type="button"
                className={styles.retryButton}
                onClick={handleRetry}
              >
                Retry
              </button>
            </div>
          )}

          {/* Messages */}
          <div className={styles.messagesContainer}>
            <ChatMessageList
              messages={messages}
              streamingResponse={streamingResponse}
              streamingReasoning={streamingReasoning}
              isStreaming={isStreaming}
              subjectTitle={subjectTitle}
              templateVars={templateVars}
              onSend={handleSend}
            />
          </div>

          {/* Input */}
          <ChatInput
            onSend={handleSend}
            onCancel={handleCancel}
            isStreaming={isStreaming}
          />

          {/* Resize handle */}
          <m.div
            ref={resizeRef}
            className={styles.resizeHandle}
            drag
            dragMomentum={false}
            dragElastic={0}
            dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
            onDrag={(_e, info: PanInfo) => {
              cardWidth.set(Math.max(320, cardWidth.get() + info.delta.x))
              cardHeight.set(Math.max(300, cardHeight.get() + info.delta.y))
            }}
          />
        </m.div>
      </m.dialog>
    </RemoveScroll>
  )
}
