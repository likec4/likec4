// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { RichText } from '@likec4/core'
import { Markdown } from '@likec4/diagram/custom'
import { css } from '@likec4/styles/css'
import { HStack, Txt } from '@likec4/styles/jsx'
import { ActionIcon, CopyButton as MantineCopyButton, Notification, rem, Tooltip } from '@mantine/core'
import { IconCheck, IconCopy } from '@tabler/icons-react'
import type { ToolCallRenderProps } from '@tanstack/ai-react-ui'
import {
  ChatMessage as TanstackChatMessage,
} from '@tanstack/ai-react-ui'
import { formatToolActivityLabel } from './chat-tool-status'
import { formatChatMessageText } from './chat-transcript'
import type { TypedUIMessage } from './ChatContext'
import { useChatContext } from './ChatContext'

export function ChatMessages() {
  const { messages, error } = useChatContext()
  return (
    <>
      {messages.map((message) => <ChatMessage message={message} key={message.id} />)}
      {error && (
        <Notification
          styles={{
            icon: {
              alignSelf: 'flex-start',
            },
          }}
          color={'red'}
          title={'Oops, something went wrong'}
          withCloseButton={false}>
          <Txt
            fontSize={'sm'}
            fontFamily="mono"
            whiteSpace="pre"
            my="xs">
            {error.message}
            {error.stack && '\n' + error.stack}
          </Txt>
        </Notification>
      )}
    </>
  )
}

export const ChatMessage = ({ message }: { message: TypedUIMessage }) => {
  const role = message.role
  const text = formatChatMessageText(message)
  return (
    <HStack
      className={messageGroupClassName}
      data-likec4-ai-message-role={role}
      alignItems="flex-start">
      {role === 'user' && <CopyMessageButton text={text} />}
      <TanstackChatMessage
        message={message}
        userClassName={userMessageClassName}
        defaultToolRenderer={ToolActivityPart}
        toolResultRenderer={() => null}
        textPartRenderer={role === 'user' ? UserMessageTextPart : MarkdownTextPart} />
      {role !== 'user' && <CopyMessageButton text={text} />}
    </HStack>
  )
}

const messageGroupClassName = css({
  maxWidth: '100%',
  '&[data-likec4-ai-message-role="user"]': {
    alignSelf: 'flex-end',
  },
  '&[data-likec4-ai-message-role="assistant"]': {
    alignSelf: 'flex-start',
  },
  '& [data-likec4-ai-message-copy]': {
    opacity: 0,
  },
  _hover: {
    '& [data-likec4-ai-message-copy]': {
      opacity: 1,
    },
  },
  _focusWithin: {
    '& [data-likec4-ai-message-copy]': {
      opacity: 1,
    },
  },
})

const userMessageClassName = css({
  color: 'text.bright',
  paddingInline: '2',
  paddingBlock: '1',
  marginInlineEnd: '2',
  rounded: 'sm',
  backgroundColor: 'default.hover',
  whiteSpace: 'pre-wrap',
})

const toolActivityClassName = css({
  alignSelf: 'flex-start',
  color: 'text.dimmed',
  fontSize: 'xs',
  paddingInline: '2',
  paddingBlock: '1',
})

const ToolActivityPart = ({ name }: ToolCallRenderProps) => {
  return (
    <div
      className={toolActivityClassName}
      data-likec4-ai-tool-status>
      {formatToolActivityLabel(name)}
    </div>
  )
}

const CopyMessageButton = ({ text }: { text: string }) => {
  return (
    <MantineCopyButton value={text} timeout={2000}>
      {({ copied, copy }) => (
        <Tooltip label={copied ? 'Copied' : 'Copy message'} color="dark" fz={'xs'}>
          <ActionIcon
            aria-label="Copy message"
            data-likec4-ai-message-copy
            className="chat-action"
            size={'sm'}
            color={copied ? 'teal' : 'gray'}
            variant="subtle"
            disabled={!text}
            onClick={copy}>
            {copied
              ? <IconCheck style={{ width: rem(14), height: rem(14) }} />
              : <IconCopy style={{ width: rem(14), height: rem(14) }} />}
          </ActionIcon>
        </Tooltip>
      )}
    </MantineCopyButton>
  )
}

const UserMessageTextPart = ({ content }: { content: string }) => {
  return <>{content}</>
}

const MarkdownTextPart = ({ content }: { content: string }) => {
  return (
    <Markdown
      textScale={0.95}
      value={RichText.from({ md: content })}
    />
  )
}
