import type { Fqn } from '@likec4/core'
import { getHotkeyHandler } from '@mantine/hooks'
import { isString, last, reverse } from 'remeda'
import {
  type ActorLogicFrom,
  type ActorRefFrom,
  type SnapshotFrom,
  assertEvent,
  assign,
  enqueueActions,
  fromCallback,
  setup,
  spawnChild,
  stopChild,
} from 'xstate'
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
    ['Escape', () => sendBack({ type: 'close' }), {
      preventDefault: true,
    }],
  ])
  document.body.addEventListener('keydown', handler, { capture: true })
  return () => {
    document.body.removeEventListener('keydown', handler, { capture: true })
  }
})

export const overlaysActorLogic = setup({
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
    relationshipDetails: relationshipDetailsLogic as Overlays.RelationshipDetails.Logic,
    elementDetails: elementDetailsLogic as Overlays.ElementDetails.Logic,
    relationshipsBrowser: relationshipsBrowserLogic as Overlays.RelationshipsBrowser.Logic,
    hotkey: hotkeyLogic,
  },
  actions: {
    'closeLastOverlay': enqueueActions(({ context, enqueue }) => {
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
    }),
    'closeSpecificOverlay': enqueueActions(({ context, enqueue }, params: { actorId: string }) => {
      const toClose = context.overlays.find(o => o.id === params.actorId)?.id
      if (toClose) {
        enqueue.sendTo(toClose, { type: 'close' })
        enqueue.stopChild(toClose)
        enqueue.assign({
          overlays: context.overlays.filter(o => o.id !== toClose),
        })
      }
    }),
    'closeAllOverlays': enqueueActions(({ context, enqueue }) => {
      for (const { id } of reverse(context.overlays)) {
        enqueue.sendTo(id, { type: 'close' })
        enqueue.stopChild(id)
      }

      enqueue.assign({ overlays: [] })
    }),
    'openElementDetails': enqueueActions(({ context, enqueue, event }) => {
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
            type: 'elementDetails' as const,
            id,
            subject: event.subject,
          },
        ],
      })
    }),
    'openRelationshipDetails': enqueueActions(({ context, enqueue, event }) => {
      assertEvent(event, 'open.relationshipDetails')
      const currentOverlay = last(context.overlays)
      if (currentOverlay?.type === 'relationshipDetails') {
        enqueue.sendTo(currentOverlay.id, {
          type: 'navigate.to',
          edgeId: event.edgeId,
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
            type: 'relationshipDetails' as const,
            id,
          },
        ],
      })
    }),
    'openRelationshipsBrowser': enqueueActions(({ context, enqueue, event }) => {
      assertEvent(event, 'open.relationshipsBrowser')
      const currentOverlay = last(context.overlays)
      if (currentOverlay?.type === 'relationshipsBrowser') {
        enqueue.sendTo(currentOverlay.id, {
          type: 'navigate.to',
          subject: event.subject,
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
            type: 'relationshipsBrowser' as const,
            id,
            subject: event.subject,
          },
        ],
      })
    }),
    'listenToEsc': spawnChild('hotkey', {
      id: 'hotkey',
    }),
    'stopListeningToEsc': stopChild('hotkey'),
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
}).createMachine({
  id: 'overlays',
  context: () => ({
    seq: 1,
    overlays: [],
  }),
  initial: 'idle',
  on: {
    'open.elementDetails': {
      actions: 'openElementDetails',
      target: '.active',
      reenter: false,
    },
    'open.relationshipDetails': {
      actions: 'openRelationshipDetails',
      target: '.active',
      reenter: false,
    },
    'open.relationshipsBrowser': {
      actions: 'openRelationshipsBrowser',
      target: '.active',
      reenter: false,
    },
  },
  states: {
    idle: {},
    active: {
      entry: 'listenToEsc',
      exit: 'stopListeningToEsc',
      on: {
        'close': [
          {
            guard: 'close specific overlay?',
            actions: {
              type: 'closeSpecificOverlay',
              params: ({ event }) => ({ actorId: event.actorId! }),
            },
            target: 'closing',
          },
          {
            actions: 'closeLastOverlay',
            target: 'closing',
          },
        ],
        'close.all': {
          actions: [
            'closeAllOverlays',
            'stopListeningToEsc',
          ],
          target: 'idle',
        },
      },
    },
    closing: {
      always: [
        {
          guard: 'has overlays?',
          target: 'active',
        },
        {
          actions: 'stopListeningToEsc',
          target: 'idle',
        },
      ],
    },
  },
  exit: [
    'stopListeningToEsc',
    'closeAllOverlays',
  ],
})

export interface OverlaysActorLogic extends ActorLogicFrom<typeof overlaysActorLogic> {}
export type OverlaysActorSnapshot = SnapshotFrom<OverlaysActorLogic>
export interface OverlaysActorRef extends ActorRefFrom<OverlaysActorLogic> {}
