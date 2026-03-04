// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { css } from '@likec4/styles/css'

export const backdropBlur = '--_blur'
export const backdropOpacity = '--_opacity'

export const dialog = css({
  boxSizing: 'border-box',
  margin: '0',
  padding: '0',
  position: 'fixed',
  inset: '0',
  width: '100vw',
  height: '100vh',
  maxWidth: '100vw',
  maxHeight: '100vh',
  background: 'transparent',
  border: 'transparent',
  _backdrop: {
    backdropFilter: 'auto',
    backdropBlur: `var(${backdropBlur})`,
    backgroundColor: `[rgb(36 36 36 / var(${backdropOpacity}, 5%))]`,
  },
})

export const card = css({
  position: 'absolute',
  pointerEvents: 'all',
  display: 'flex',
  flexDirection: 'column',
  padding: '4',
  gap: 'sm',
  justifyContent: 'stretch',
  color: 'text',
  boxShadow: 'md',
  overflow: 'hidden',
  border: 'none',
  borderRadius: 'md',
  background: 'likec4.overlay.body',
})

export const cardHeader = css({
  flex: 0,
  cursor: 'move',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'sm',
})

export const title = css({
  display: 'block',
  fontFamily: 'likec4.element',
  fontOpticalSizing: 'auto',
  fontStyle: 'normal',
  fontWeight: 'bold',
  fontSize: '18px',
  lineHeight: 'xs',
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

export const messagesContainer = css({
  flex: 1,
  overflow: 'hidden',
  minHeight: '200px',
})

export const messageList = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'sm',
  padding: '1',
})

export const userMessage = css({
  flexShrink: 0,
  alignSelf: 'flex-end',
  maxWidth: '85%',
  padding: '[8px 12px]',
  borderRadius: 'md',
  fontSize: 'sm',
  lineHeight: '1.5',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  background: '[var(--mantine-color-blue-6)]',
  color: 'white',
  _light: {
    background: '[var(--mantine-color-blue-5)]',
  },
})

// Full-width document-style for assistant messages (like ChatGPT/Claude)
export const assistantMessage = css({
  fontSize: 'sm',
  lineHeight: '1.6',
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
  color: 'default.color',
})

// Same full-width style for streaming
export const streamingMessage = css({
  fontSize: 'sm',
  lineHeight: '1.6',
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
  color: 'default.color',
})

export const inputArea = css({
  flex: 0,
  display: 'flex',
  gap: 'xs',
  alignItems: 'flex-end',
})

export const errorMessage = css({
  padding: '[6px 10px]',
  borderRadius: 'sm',
  fontSize: 'xs',
  color: '[var(--mantine-color-red-6)]',
  background: '[var(--mantine-color-red-0)]',
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  _dark: {
    background: '[color-mix(in srgb, var(--mantine-color-red-9) 20%, transparent)]',
    color: '[var(--mantine-color-red-4)]',
  },
})

export const emptyState = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'sm',
  padding: '8',
  color: 'mantine.colors.dimmed',
  fontSize: 'sm',
  textAlign: 'center',
})

export const configureWarning = css({
  fontWeight: 'bold',
  color: '[var(--mantine-color-red-6)]',
  _dark: {
    color: '[var(--mantine-color-red-4)]',
  },
})

export const settingsPanel = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'sm',
  padding: '3',
  borderRadius: 'sm',
  background: 'mantine.colors.gray[0]',
  _dark: {
    background: 'mantine.colors.dark[7]',
  },
})

export const thinkingIndicator = css({
  flexShrink: 0,
  padding: '[8px 0]',
  display: 'flex',
  gap: '1',
  alignItems: 'center',
  '& span': {
    width: '6px',
    height: '6px',
    borderRadius: '[9999px]',
    background: 'mantine.colors.gray[5]',
    _dark: {
      background: 'mantine.colors.gray[6]',
    },
    animationName: 'indicatorOpacity',
    animationDuration: '0.8s',
    animationDirection: 'alternate',
    animationIterationCount: 'infinite',
    animationTimingFunction: '[ease-in-out]',
    '&:nth-child(2)': {
      animationDelay: '0.2s',
    },
    '&:nth-child(3)': {
      animationDelay: '0.4s',
    },
  },
})

export const messageWrapper = css({
  flexShrink: 0,
  position: 'relative',
  '&:hover .copy-btn': {
    opacity: 1,
  },
})

export const copyButton = css({
  position: 'absolute',
  top: '0',
  right: '0',
  opacity: 0,
  transition: 'fast',
  cursor: 'pointer',
  padding: '1',
  borderRadius: 'sm',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'mantine.colors.gray[2]',
  color: 'mantine.colors.gray[7]',
  _dark: {
    background: 'mantine.colors.dark[5]',
    color: 'mantine.colors.gray[4]',
  },
  _hover: {
    background: 'mantine.colors.gray[3]',
    _dark: {
      background: 'mantine.colors.dark[4]',
    },
  },
  _focusVisible: {
    opacity: 1,
    outline: '[2px solid var(--mantine-color-blue-5)]',
    outlineOffset: '[1px]',
  },
})

export const suggestedQuestions = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'xs',
  padding: '2',
})

export const questionChip = css({
  cursor: 'pointer',
  padding: '[6px 12px]',
  borderRadius: 'xl',
  border: '1px solid',
  borderColor: 'mantine.colors.gray[3]',
  background: 'transparent',
  fontSize: 'xs',
  lineHeight: '1.4',
  color: 'text',
  transition: 'fast',
  _dark: {
    borderColor: 'mantine.colors.dark[4]',
  },
  _hover: {
    background: 'mantine.colors.gray[1]',
    borderColor: 'mantine.colors.gray[4]',
    _dark: {
      background: 'mantine.colors.dark[5]',
      borderColor: 'mantine.colors.dark[3]',
    },
  },
})

export const retryButton = css({
  cursor: 'pointer',
  padding: '[2px 8px]',
  marginLeft: '2',
  borderRadius: 'sm',
  border: 'none',
  fontSize: 'xs',
  fontWeight: 'medium',
  background: '[var(--mantine-color-red-1)]',
  color: '[var(--mantine-color-red-7)]',
  _dark: {
    background: '[color-mix(in srgb, var(--mantine-color-red-9) 30%, transparent)]',
    color: '[var(--mantine-color-red-4)]',
  },
  _hover: {
    background: '[var(--mantine-color-red-2)]',
    _dark: {
      background: '[color-mix(in srgb, var(--mantine-color-red-9) 50%, transparent)]',
    },
  },
})

export const scrollToBottom = css({
  position: 'absolute',
  bottom: '2',
  left: '[50%]',
  transform: 'translateX(-50%)',
  cursor: 'pointer',
  padding: '[4px 12px]',
  borderRadius: 'xl',
  border: '1px solid',
  borderColor: 'mantine.colors.gray[3]',
  background: 'likec4.overlay.body',
  fontSize: 'xs',
  color: 'mantine.colors.dimmed',
  display: 'flex',
  alignItems: 'center',
  gap: '1',
  boxShadow: 'sm',
  transition: 'fast',
  _dark: {
    borderColor: 'mantine.colors.dark[4]',
  },
  _hover: {
    background: 'mantine.colors.gray[1]',
    _dark: {
      background: 'mantine.colors.dark[5]',
    },
  },
})

export const markdownContent = css({
  '--text-fz': '0.875rem',
})

export const reasoningBlock = css({
  flexShrink: 0,
  borderLeft: '2px solid',
  borderColor: 'mantine.colors.gray[4]',
  borderRadius: 'sm',
  overflow: 'hidden',
  _dark: {
    borderColor: 'mantine.colors.dark[4]',
  },
})

export const reasoningHeader = css({
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '1',
  padding: '[4px 8px]',
  fontSize: 'xs',
  color: 'mantine.colors.dimmed',
  userSelect: 'none',
  background: 'transparent',
  border: 'none',
  width: '100%',
  textAlign: 'left',
  _hover: {
    color: 'text',
  },
  _focusVisible: {
    outline: '[2px solid var(--mantine-color-blue-5)]',
    outlineOffset: '[-2px]',
  },
})

export const reasoningChevron = css({
  transition: 'fast',
  flexShrink: 0,
})

export const reasoningChevronOpen = css({
  transform: 'rotate(90deg)',
})

export const reasoningContent = css({
  padding: '[4px 8px]',
  fontSize: 'xs',
  lineHeight: '1.5',
  color: 'mantine.colors.dimmed',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  maxHeight: '200px',
  overflowY: 'auto',
})

export const reasoningStreaming = css({
  animation: 'pulse',
  animationDuration: '2s',
  animationIterationCount: 'infinite',
})

export const resizeHandle = css({
  position: 'absolute',
  width: '14px',
  height: '14px',
  border: `3.5px solid`,
  borderColor: 'mantine.colors.dark[3]',
  borderTop: 'none',
  borderLeft: 'none',
  borderRadius: 'xs',
  bottom: '0.5',
  right: '0.5',
  transition: 'fast',
  cursor: 'se-resize',
  _hover: {
    borderWidth: '4px',
    borderColor: 'mantine.colors.dark[1]',
  },
})
