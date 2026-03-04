// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { Fqn } from '@likec4/core/types'
import { getHotkeyHandler } from '@mantine/hooks'
import type { KeyboardEvent } from 'react'
import { isString, last, reverse } from 'remeda'
import {
  type ActorRef,
  type SnapshotFrom,
  type StateMachine,
  assertEvent,
  fromCallback,
  setup,
} from 'xstate'
import { not } from 'xstate/guards'
import type { AIChatSubject } from '../ai-chat/actor'
import { aiChatLogic } from '../ai-chat/actor'
import { elementDetailsLogic } from './element-details/actor'
import { relationshipDetailsLogic } from './relationship-details/actor'
import { relationshipsBrowserLogic } from './relationships-browser/actor'
import type { Overlays } from './types'

export type OverlayActorEvent =
  | { type: 'open.elementDetails' } & Overlays.ElementDetails.Input
  | { type: 'open.relationshipDetails' } & Overlays.RelationshipDetails.Input
  | { type: 'open.relationshipsBrowser' } & Overlays.RelationshipsBrowser.Input
  | { type: 'open.aiChat' } & Overlays.AIChat.Input
  | { type: 'close'; actorId?: string | undefined } // Close last overlay if actorId is not provided
  | { type: 'close.all' }

export interface OverlaysContext {
  seq: number
  overlays: Array<
    | { type: 'elementDetails'; id: `elementDetails-${number}`; subject: Fqn }
    | { type: 'relationshipDetails'; id: `relationshipDetails-${number}` }
    | { type: 'relationshipsBrowser'; id: `relationshipsBrowser-${number}`; subject: Fqn }
    | { type: 'aiChat'; id: `aiChat-${number}`; subject: AIChatSubject }
  >
}

export type OverlayType = 'elementDetails' | 'relationshipsBrowser' | 'relationshipDetails' | 'aiChat'

export type OverlayActorEmitedEvent =
  | { type: 'opened'; overlay: OverlayType }
  | { type: 'closed'; overlay: OverlayType }
  | { type: 'idle' }

type HotKeyEvent = { type: 'close' }
// TODO: naming convention for actors
const hotkeyLogic = fromCallback(({ sendBack }: {
  sendBack: (event: HotKeyEvent) => void
}) => {
  const handler = getHotkeyHandler([
    ['Escape', (event: KeyboardEvent) => {
      event.stopPropagation()
      sendBack({ type: 'close' })
    }, {
      preventDefault: true,
    }],
  ])
  document.body.addEventListener('keydown', handler, { capture: true })
  return () => {
    document.body.removeEventListener('keydown', handler, { capture: true })
  }
})

const machine = setup({
  types: {
    context: {} as OverlaysContext,
    events: {} as OverlayActorEvent,
    emitted: {} as OverlayActorEmitedEvent,
    children: {} as {
      hotkey: 'hotkey'
      [key: `elementDetails-${number}`]: 'elementDetails'
      [key: `relationshipDetails-${number}`]: 'relationshipDetails'
      [key: `relationshipsBrowser-${number}`]: 'relationshipsBrowser'
      [key: `aiChat-${number}`]: 'aiChat'
    },
  },
  actors: {
    relationshipDetails: relationshipDetailsLogic,
    elementDetails: elementDetailsLogic,
    relationshipsBrowser: relationshipsBrowserLogic,
    aiChat: aiChatLogic,
    hotkey: hotkeyLogic,
  },
  guards: {
    'has overlays?': ({ context }) => context.overlays.length > 0,
    'close specific overlay?': ({ context, event }) => {
      assertEvent(event, 'close')
      return isString(event.actorId) && context.overlays.some(o => o.id === event.actorId)
    },
    'last: is relationshipDetails?': ({ context }) => {
      const lastOverlay = last(context.overlays)
      return lastOverlay?.type === 'relationshipDetails'
    },
    'last: is relationshipsBrowser?': ({ context }) => {
      const lastOverlay = last(context.overlays)
      return lastOverlay?.type === 'relationshipsBrowser'
    },
  },
})

const emitOpened = (overlay: OverlayType | `${OverlayType}-${number}`) =>
  machine.emit({
    type: 'opened',
    overlay: overlay.split('-')[0] as OverlayType,
  })

const emitClosed = (overlay: OverlayType | `${OverlayType}-${number}`) =>
  machine.emit({
    type: 'closed',
    overlay: overlay.split('-')[0] as OverlayType,
  })

const emitIdle = () => machine.emit({ type: 'idle' })

const closeLastOverlay = () =>
  machine.enqueueActions(({ context, enqueue }) => {
    if (context.overlays.length === 0) {
      return
    }
    const lastOverlay = last(context.overlays)?.id
    if (!lastOverlay) {
      return
    }
    enqueue.sendTo(lastOverlay, { type: 'close' })
    enqueue.stopChild(lastOverlay)
    enqueue.assign({
      overlays: context.overlays.filter(o => o.id !== lastOverlay),
    })
    enqueue(emitClosed(lastOverlay))
  })

const closeSpecificOverlay = () =>
  machine.enqueueActions(({ context, enqueue, event }) => {
    assertEvent(event, 'close')
    const actorId = event.actorId
    if (!isString(actorId)) {
      return
    }
    const toClose = context.overlays.find(o => o.id === actorId)?.id
    if (toClose) {
      enqueue.sendTo(toClose, { type: 'close' })
      enqueue.stopChild(toClose)
      enqueue.assign({
        overlays: context.overlays.filter(o => o.id !== toClose),
      })
      enqueue(emitClosed(toClose))
    }
  })

const closeAllOverlays = () =>
  machine.enqueueActions(({ context, enqueue }) => {
    for (const { id } of reverse(context.overlays)) {
      enqueue.sendTo(id, { type: 'close' })
      enqueue.stopChild(id)
      enqueue(emitClosed(id))
    }
    enqueue.assign({ overlays: [] })
  })

const openElementDetails = () =>
  machine.enqueueActions(({ context, enqueue, event }) => {
    assertEvent(event, 'open.elementDetails')
    if (context.overlays.some(o => o.type === 'elementDetails' && o.subject === event.subject)) {
      return
    }
    const id = `elementDetails-${context.seq}` as const
    enqueue.spawnChild('elementDetails', {
      id,
      input: event,
      syncSnapshot: true,
    })
    enqueue.assign({
      seq: context.seq + 1,
      overlays: [
        ...context.overlays,
        {
          id,
          type: 'elementDetails',
          subject: event.subject,
        },
      ],
    })
    enqueue(emitOpened(id))
  })

const openRelationshipDetails = () =>
  machine.enqueueActions(({ context, enqueue, event }) => {
    assertEvent(event, 'open.relationshipDetails')
    const currentOverlay = last(context.overlays)
    if (currentOverlay?.type === 'relationshipDetails') {
      enqueue.sendTo(currentOverlay.id, {
        ...event,
        type: 'navigate.to',
      })
      return
    }
    const id = `relationshipDetails-${context.seq}` as const
    enqueue.spawnChild('relationshipDetails', {
      id,
      input: event,
      syncSnapshot: true,
    })
    enqueue.assign({
      seq: context.seq + 1,
      overlays: [
        ...context.overlays,
        {
          id,
          type: 'relationshipDetails',
        },
      ],
    })
    enqueue(emitOpened(id))
  })

const openRelationshipsBrowser = () =>
  machine.enqueueActions(({ context, enqueue, event }) => {
    assertEvent(event, 'open.relationshipsBrowser')
    const currentOverlay = last(context.overlays)
    if (currentOverlay?.type === 'relationshipsBrowser') {
      enqueue.sendTo(currentOverlay.id, {
        type: 'navigate.to',
        subject: event.subject,
        viewId: event.viewId,
      })
      return
    }
    const id = `relationshipsBrowser-${context.seq}` as const
    enqueue.spawnChild('relationshipsBrowser', {
      id,
      input: event,
      syncSnapshot: true,
    })
    enqueue.assign({
      seq: context.seq + 1,
      overlays: [
        ...context.overlays,
        {
          id,
          type: 'relationshipsBrowser',
          subject: event.subject,
        },
      ],
    })
    enqueue(emitOpened(id))
  })

const openAIChat = () =>
  machine.enqueueActions(({ context, enqueue, event }) => {
    assertEvent(event, 'open.aiChat')
    // Only allow one AI chat at a time
    const existing = context.overlays.find(o => o.type === 'aiChat')
    if (existing) {
      return
    }
    const id = `aiChat-${context.seq}` as const
    enqueue.spawnChild('aiChat', {
      id,
      input: event,
      syncSnapshot: true,
    })
    enqueue.assign({
      seq: context.seq + 1,
      overlays: [
        ...context.overlays,
        {
          id,
          type: 'aiChat',
          subject: event.subject,
        },
      ],
    })
    enqueue(emitOpened(id))
  })

const openOverlay = () =>
  machine.enqueueActions(({ enqueue, event }) => {
    assertEvent(event, [
      'open.elementDetails',
      'open.relationshipDetails',
      'open.relationshipsBrowser',
      'open.aiChat',
    ])
    switch (event.type) {
      case 'open.elementDetails':
        enqueue(openElementDetails())
        break
      case 'open.relationshipDetails':
        enqueue(openRelationshipDetails())
        break
      case 'open.relationshipsBrowser':
        enqueue(openRelationshipsBrowser())
        break
      case 'open.aiChat':
        enqueue(openAIChat())
        break
    }
  })

const listenToEsc = () =>
  machine.spawnChild('hotkey', {
    id: 'hotkey',
  })

const stopListeningToEsc = () => machine.stopChild('hotkey')

const checkState = () =>
  machine.enqueueActions(({ enqueue, context }) => {
    if (context.overlays.length === 0) {
      // No more overlays, go to idle by raising close again
      enqueue.raise({ type: 'close' })
    }
  })

const _overlaysActorLogic = machine.createMachine({
  id: 'overlays',
  context: () => ({
    seq: 1,
    overlays: [],
  }),
  initial: 'idle',
  states: {
    idle: {
      entry: [
        emitIdle(),
      ],
      on: {
        'open.*': {
          actions: openOverlay(),
          target: 'active',
        },
      },
    },
    active: {
      entry: [
        listenToEsc(),
      ],
      exit: [
        stopListeningToEsc(),
      ],
      on: {
        'open.*': {
          actions: openOverlay(),
        },
        'close': [
          {
            guard: not('has overlays?'),
            target: 'idle',
          },
          {
            guard: 'close specific overlay?',
            actions: [
              closeSpecificOverlay(),
              checkState(),
            ],
          },
          {
            actions: [
              closeLastOverlay(),
              checkState(),
            ],
          },
        ],
        'close.all': {
          actions: [
            closeAllOverlays(),
          ],
          target: 'idle',
        },
      },
    },
    final: {
      entry: [
        closeAllOverlays(),
        stopListeningToEsc(),
      ],
      type: 'final',
    },
  },
})

// type InferredMachine = typeof _overlaysActorLogic
// export interface OverlaysActorLogic extends InferredMachine {}
export interface OverlaysActorLogic extends
  StateMachine<
    OverlaysContext,
    OverlayActorEvent,
    {
      [key: `elementDetails-${number}`]: Overlays.ElementDetails.ActorRef | undefined
      [key: `relationshipDetails-${number}`]: Overlays.RelationshipDetails.ActorRef | undefined
      [key: `relationshipsBrowser-${number}`]: Overlays.RelationshipsBrowser.ActorRef | undefined
      [key: `aiChat-${number}`]: Overlays.AIChat.ActorRef | undefined
    },
    any,
    any,
    any,
    any,
    any,
    never,
    never,
    any,
    OverlayActorEmitedEvent,
    any,
    any
  >
{
}
export const overlaysActorLogic: OverlaysActorLogic = _overlaysActorLogic as any

export type OverlaysActorSnapshot = SnapshotFrom<OverlaysActorLogic>
export interface OverlaysActorRef extends ActorRef<OverlaysActorSnapshot, OverlayActorEvent, OverlayActorEmitedEvent> {}
