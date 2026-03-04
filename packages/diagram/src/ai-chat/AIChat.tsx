// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { useSelector } from '@xstate/react'
import { shallowEqual } from 'fast-equals'
import type { AIChatActorRef, AIChatSnapshot } from './actor'
import { AIChatActorContext } from './actorContext'
import { AIChatCard } from './AIChatCard'

export type AIChatProps = {
  actorRef: AIChatActorRef
  onClose: () => void
}

const selector = (s: AIChatSnapshot) => ({
  viewId: s.context.currentView.id,
  fromNode: s.context.initiatedFrom.node,
  rectFromNode: s.context.initiatedFrom.clientRect,
  subject: s.context.subject,
  messages: s.context.messages,
  streamingResponse: s.context.currentStreamingResponse,
  streamingReasoning: s.context.currentStreamingReasoning,
  isStreaming: s.context.isStreaming,
  error: s.context.error,
})

export function AIChat({
  actorRef,
  onClose,
}: AIChatProps) {
  const props = useSelector(
    actorRef,
    selector,
    shallowEqual,
  )
  return (
    <AIChatActorContext.Provider value={actorRef}>
      <AIChatCard
        onClose={onClose}
        actorRef={actorRef}
        {...props}
      />
    </AIChatActorContext.Provider>
  )
}
