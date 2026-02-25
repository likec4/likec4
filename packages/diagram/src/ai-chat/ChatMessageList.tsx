// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { cx } from '@likec4/styles/css'
import { markdownBlock } from '@likec4/styles/recipes'
import { ScrollArea } from '@mantine/core'
import { IconArrowDown, IconCheck, IconChevronRight, IconCopy } from '@tabler/icons-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import * as styles from './AIChatCard.css'
import { useAIChatConfig } from './AIChatConfigContext'
import { loadProviderConfig } from './config'
import { type TemplateVariables, interpolateTemplate } from './context-builder'
import type { ChatMessage } from './providers/types'

type ChatMessageListProps = {
  messages: ChatMessage[]
  streamingResponse: string
  streamingReasoning: string
  isStreaming: boolean
  subjectTitle: string
  templateVars: TemplateVariables | null
  onSend: (message: string) => void
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      // Clipboard API may fail in non-secure contexts
    })
  }, [text])

  return (
    <button
      className={cx(styles.copyButton, 'copy-btn')}
      onClick={handleCopy}
      aria-label="Copy message"
      type="button"
    >
      {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
    </button>
  )
}

function ThinkingIndicator() {
  return (
    <div className={styles.thinkingIndicator}>
      <span />
      <span />
      <span />
    </div>
  )
}

function ReasoningBlock({
  reasoning,
  streaming,
  duration,
}: {
  reasoning: string
  streaming?: boolean
  /** Stored duration in seconds for completed messages */
  duration?: number
}) {
  const [expanded, setExpanded] = useState(!!streaming)
  const startTimeRef = useRef<number>(Date.now())
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!streaming) return
    setExpanded(true)
    startTimeRef.current = Date.now()
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [streaming])

  useEffect(() => {
    if (!streaming && expanded) {
      setExpanded(false)
    }
  }, [streaming])

  const displayTime = streaming ? elapsed : (duration ?? elapsed)
  const label = streaming
    ? `Thinking... ${displayTime}s`
    : `Thought for ${displayTime}s`

  return (
    <div className={cx(styles.reasoningBlock, streaming && styles.reasoningStreaming)}>
      <button
        type="button"
        className={styles.reasoningHeader}
        onClick={() => setExpanded(v => !v)}
      >
        <IconChevronRight
          size={12}
          className={cx(styles.reasoningChevron, expanded && styles.reasoningChevronOpen)}
        />
        {label}
      </button>
      {expanded && (
        <div className={styles.reasoningContent}>
          {reasoning}
        </div>
      )}
    </div>
  )
}

function getSuggestedQuestions(
  subjectTitle: string,
  templateVars: TemplateVariables | null,
  configQuestions?: string[],
): string[] {
  if (configQuestions && configQuestions.length > 0) {
    if (!templateVars) return configQuestions
    return configQuestions
      .map(q => interpolateTemplate(q, templateVars, { hideIfEmpty: true }))
      .filter((q): q is string => q !== null)
  }
  return [
    `What does ${subjectTitle} do?`,
    `What are the dependencies of ${subjectTitle}?`,
    `Are there any concerns with ${subjectTitle}?`,
  ]
}

const markdownClass = cx(
  markdownBlock(),
  styles.markdownContent,
)

const remarkPlugins = [remarkGfm]
const markdownComponents = {
  a: ({ href, children, ...props }: React.ComponentPropsWithoutRef<'a'>) => (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>
  ),
}

/**
 * Strip citation markers that models like Perplexity Sonar append.
 * Handles [1], [^1], and superscript-style <sup>1</sup> references.
 * Only strips markers that follow punctuation/word boundaries — not markdown link syntax like [text](url).
 */
function sanitizeContent(text: string): string {
  return text
    // URL immediately followed by citation: "https://example.com[1]" -> "https://example.com"
    .replace(/(https?:\/\/[^\s\]]+)\[\^?\d+\]/g, '$1')
    // Citation markers after sentence-ending punctuation or word chars: "sentence.[1]" or "sentence.[^1]"
    .replace(/([.!?:;,])\s?\[\^?\d+\]/g, '$1')
    .replace(/(\w) \[\^?\d+\]/g, '$1')
    // Superscript citations: "sentence<sup>1</sup>" or "sentence <sup>[1]</sup>"
    .replace(/\s?<sup>\[?\^?\d+\]?<\/sup>/gi, '')
    // Standalone footnote definitions at end: "[^1]: ..." lines
    .replace(/^\[\^\d+\]:.*$/gm, '')
}

/** Renders chat messages with streaming support, reasoning blocks, and suggested starter questions. */
export function ChatMessageList({
  messages,
  streamingResponse,
  streamingReasoning,
  isStreaming,
  subjectTitle,
  templateVars,
  onSend,
}: ChatMessageListProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const projectConfig = useAIChatConfig()
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const isNearBottomRef = useRef(true)

  const scrollToBottom = useCallback(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [])

  useEffect(() => {
    // Only auto-scroll if the user hasn't scrolled up
    if (isNearBottomRef.current) {
      scrollToBottom()
    }
  }, [messages.length, streamingResponse, streamingReasoning, scrollToBottom])

  const handleScroll = useCallback(() => {
    if (!viewportRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = viewportRef.current
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    isNearBottomRef.current = distanceFromBottom <= 100
    setShowScrollBtn(distanceFromBottom > 100)
  }, [])

  const chatMessages = messages.filter(m => m.role !== 'system')

  if (chatMessages.length === 0 && !streamingResponse && !isStreaming) {
    const questions = getSuggestedQuestions(subjectTitle, templateVars, projectConfig?.suggestedQuestions?.element)
    const hasAnyConfig = !!projectConfig?.apiKey || !!loadProviderConfig()?.apiKey
    return (
      <div className={styles.emptyState}>
        <div>Ask questions about this architecture element.</div>
        {!hasAnyConfig && (
          <div className={styles.configureWarning}>Configure an LLM provider in settings to get started.</div>
        )}
        <div className={styles.suggestedQuestions}>
          {questions.map(q => (
            <button
              key={q}
              type="button"
              className={styles.questionChip}
              onClick={() => onSend(q)}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <ScrollArea h="100%" viewportRef={viewportRef} onScrollPositionChange={handleScroll}>
        <div className={styles.messageList}>
          {chatMessages.map((msg, i) => (
            msg.role === 'user'
              ? (
                <div key={i} className={styles.userMessage}>
                  {msg.content}
                </div>
              )
              : (
                <div key={i} className={styles.messageWrapper}>
                  {msg.reasoning && (
                    <ReasoningBlock
                      reasoning={msg.reasoning}
                      {...(msg.reasoningDuration != null && { duration: msg.reasoningDuration })}
                    />
                  )}
                  <div className={cx(styles.assistantMessage, markdownClass)}>
                    <Markdown remarkPlugins={remarkPlugins} components={markdownComponents}>
                      {sanitizeContent(msg.content)}
                    </Markdown>
                  </div>
                  <CopyButton text={msg.content} />
                </div>
              )
          ))}
          {isStreaming && streamingReasoning && <ReasoningBlock reasoning={streamingReasoning} streaming />}
          {isStreaming && !streamingReasoning && !streamingResponse && <ThinkingIndicator />}
          {streamingResponse && (
            <div className={cx(styles.streamingMessage, markdownClass)}>
              <Markdown remarkPlugins={remarkPlugins} components={markdownComponents}>
                {sanitizeContent(streamingResponse)}
              </Markdown>
            </div>
          )}
        </div>
      </ScrollArea>
      {showScrollBtn && (
        <button
          type="button"
          className={styles.scrollToBottom}
          onClick={scrollToBottom}
        >
          <IconArrowDown size={12} />
          New messages
        </button>
      )}
    </div>
  )
}
