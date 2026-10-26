import { nonNullable } from '@likec4/core'
import { createContext, use } from 'react'
import type { TypedUIMessage, UseChatReturn } from './useChat'

export const ChatContext = createContext<UseChatReturn>(null as any)

export function useChatContext() {
  return nonNullable(use(ChatContext), 'useChatContext: ChatProvider is not provided')
}

export type { TypedUIMessage, UseChatReturn }
