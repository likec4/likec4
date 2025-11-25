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
import { elementDetailsLogic } from './element-details/actor'
import { relationshipDetailsLogic } from './relationship-details/actor'
import { relationshipsBrowserLogic } from './relationships-browser/actor'
import type { Overlays } from './types'

export type OverlayActorEvent =
  | { type: 'open.elementDetails' } & Overlays.ElementDetails.Input
  | { type: 'open.relationshipDetails' } & Overlays.RelationshipDetails.Input
  | { type: 'open.relationshipsBrowser' } & Overlays.RelationshipsBrowser.Input
  | { type: 'close'; actorId?: string | undefined } // Close last overlay if actorId is not provided
  | { type: 'close.all' }

export interface OverlaysContext {
  seq: number
  overlays: Array<
    | { type: 'elementDetails'; id: `elementDetails-${number}`; subject: Fqn }
    | { type: 'relationshipDetails'; id: `relationshipDetails-${number}` }
    | { type: 'relationshipsBrowser'; id: `relationshipsBrowser-${number}`; subject: Fqn }
  >
}

export type OverlayActorEmitedEvent =
  | { type: 'opened'; overlay: 'elementDetails' | 'relationshipsBrowser' | 'relationshipDetails' }
  | { type: 'closed'; overlay: 'elementDetails' | 'relationshipsBrowser' | 'relationshipDetails' }
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
    },
  },
  actors: {
    relationshipDetails: relationshipDetailsLogic,
    elementDetails: elementDetailsLogic,
    relationshipsBrowser: relationshipsBrowserLogic,
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
    }
  })

const closeAllOverlays = () =>
  machine.enqueueActions(({ context, enqueue }) => {
    for (const { id } of reverse(context.overlays)) {
      enqueue.sendTo(id, { type: 'close' })
      enqueue.stopChild(id)
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
  })

const openOverlay = () =>
  machine.enqueueActions(({ enqueue, event }) => {
    console.log('openOverlay event', event)
    assertEvent(event, [
      'open.elementDetails',
      'open.relationshipDetails',
      'open.relationshipsBrowser',
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
      console.log('No overlays left, raising close event')
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
