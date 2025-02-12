import { getHotkeyHandler } from '@mantine/hooks'
import { last, only, reverse, splitAt } from 'remeda'
import {
  type ActorRefFrom,
  type AnyActorRef,
  type AnyEventObject,
  type NonReducibleUnknown,
  assertEvent,
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
  | { type: 'close'; overlayActor?: AnyActorRef | undefined } // Close last overlay
  | { type: 'close.all' }

export interface OverlaysContext {
  seq: number
  overlays: Array<
    | { type: 'elementDetails'; actorRef: Overlays.ElementDetails.ActorRef }
    | { type: 'relationshipDetails'; actorRef: Overlays.RelationshipDetails.ActorRef }
    | { type: 'relationshipsBrowser'; actorRef: Overlays.RelationshipsBrowser.ActorRef }
  >
}

export type OverlayActorEmitedEvent =
  | { type: 'opened'; overlay: 'elementDetails' | 'relationshipsBrowser' | 'relationshipDetails' }
  | { type: 'closed'; overlay: 'elementDetails' | 'relationshipsBrowser' | 'relationshipDetails' }
  | { type: 'idle' }

type HotKeyEvent = { type: 'close' }
// TODO: naming convention for actors
const hotkeyLogic = fromCallback<AnyEventObject, NonReducibleUnknown, HotKeyEvent>(({ sendBack }: {
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
    // input: {} as {
    //   // xyflow: ReactFlowInstance<Base.Node, Base.Edge>
    //   // fitViewPadding?: number
    // },
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
    'closeOverlay': enqueueActions(({ context, enqueue }) => {
      if (context.overlays.length === 0) {
        return
      }
      const [overlays, tail] = context.overlays.length > 1 ? splitAt(context.overlays, -1) : [[], context.overlays]
      const last = only(tail)
      if (last === undefined) {
        return
      }
      enqueue.sendTo(last.actorRef, { type: 'close' })
      enqueue.stopChild(last.actorRef)
      enqueue.assign({ overlays })
    }),
    'closeSpecificOverlay': enqueueActions(({ context, enqueue }, params: { actorRef: AnyActorRef }) => {
      const toClose = context.overlays.find(o => o.actorRef === params.actorRef)?.actorRef
      if (toClose) {
        enqueue.sendTo(toClose, { type: 'close' })
        enqueue.stopChild(toClose)
        enqueue.assign({
          overlays: ({ context }) => context.overlays.filter(o => o.actorRef !== toClose),
        })
      }
    }),
    'closeAllOverlays': enqueueActions(({ context, enqueue }) => {
      reverse(context.overlays).forEach((overlay) => {
        enqueue.sendTo(overlay.actorRef, { type: 'close' })
        enqueue(() => overlay.actorRef.stop())
      })
      enqueue.assign({ overlays: [] })
    }),
    // 'openElementDetails': assign(({ context: { seq, overlays }, spawn }, params: Overlays.ElementDetails.Input) => {
    //   return {
    //     seq: seq + 1,
    //     overlays: [
    //       ...overlays,
    //       {
    //         type: 'elementDetails' as const,
    //         actorRef: spawn(`elementDetails`, {
    //           id: `elementDetails-${seq}`,
    //           input: params,
    //         }),
    //       },
    //     ],
    //   }
    // }),
    'openElementDetails': enqueueActions(({ context, enqueue, event }) => {
      assertEvent(event, 'open.elementDetails')
      const currentOverlay = last(context.overlays)
      if (currentOverlay?.type === 'elementDetails') {
        enqueue.sendTo(currentOverlay.actorRef, {
          type: 'change.subject',
          subject: event.subject,
        })
      } else {
        enqueue.assign(({ context, spawn }) => {
          return {
            seq: context.seq + 1,
            overlays: [
              ...context.overlays,
              {
                type: 'elementDetails' as const,
                actorRef: spawn(`elementDetails`, {
                  id: `elementDetails-${context.seq}`,
                  input: event,
                }),
              },
            ],
          }
        })
      }
    }),
    //     // enqueue.spawnChild('elementDetails', {
    //     //   id: `elementDetails-${context.seq}`,
    //     //   input: params,
    //     // })
    //     // enqueue.assign({
    //     //   seq: context.seq + 1,
    //     //   overlays: [
    //     //     ...context.overlays,
    //     //     {
    //     //       type: 'elementDetails' as const,
    //     //       actorRef,
    //     //     },
    //     //   ],
    //     // })
    //   }
    // }),
    'openRelationshipDetails': enqueueActions(({ context, enqueue, event }) => {
      assertEvent(event, 'open.relationshipDetails')
      const currentOverlay = last(context.overlays)
      if (currentOverlay?.type === 'relationshipDetails') {
        enqueue.sendTo(currentOverlay.actorRef, {
          type: 'navigate.to',
          edgeId: event.edgeId,
        })
      } else {
        enqueue.assign(({ context: { seq, overlays }, spawn }) => {
          return {
            seq: seq + 1,
            overlays: [
              ...overlays,
              {
                type: 'relationshipDetails' as const,
                actorRef: spawn(`relationshipDetails`, {
                  id: `relationshipDetails-${seq}`,
                  input: event,
                }),
              },
            ],
          }
        })
      }
    }),
    'openRelationshipsBrowser': enqueueActions(({ context, enqueue, event }) => {
      assertEvent(event, 'open.relationshipsBrowser')
      const currentOverlay = last(context.overlays)
      if (currentOverlay?.type === 'relationshipsBrowser') {
        enqueue.sendTo(currentOverlay.actorRef, {
          type: 'navigate.to',
          subject: event.subject,
        })
      } else {
        enqueue.assign(({ context: { seq, overlays }, spawn }) => {
          return {
            seq: seq + 1,
            overlays: [
              ...overlays,
              {
                type: 'relationshipsBrowser' as const,
                actorRef: spawn(`relationshipsBrowser`, {
                  id: `relationshipsBrowser-${seq}`,
                  input: event,
                }),
              },
            ],
          }
        })
      }
    }),
    'listenToEsc': spawnChild('hotkey', {
      id: 'hotkey',
    }),
    'stopListeningToEsc': stopChild('hotkey'),
  },
  guards: {
    'has overlays?': ({ context }) => context.overlays.length > 0,
    'close specific overlay?': ({ event }) => {
      assertEvent(event, 'close')
      return event.overlayActor !== undefined
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
    },
    'open.relationshipDetails': {
      actions: 'openRelationshipDetails',
      target: '.active',
    },
    'open.relationshipsBrowser': {
      actions: 'openRelationshipsBrowser',
      target: '.active',
    },
  },
  entry: 'listenToEsc',
  states: {
    idle: {},
    active: {
      on: {
        'close': [
          {
            guard: 'close specific overlay?',
            actions: {
              type: 'closeSpecificOverlay',
              params: ({ event }) => ({
                actorRef: event.overlayActor!,
              }),
            },
            target: 'closing',
          },
          {
            actions: 'closeOverlay',
            target: 'closing',
          },
        ],
        'close.all': {
          actions: 'closeAllOverlays',
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
        'idle',
      ],
    },
  },
  exit: [
    'stopListeningToEsc',
    'closeAllOverlays',
  ],
})

export interface OverlaysActorRef extends ActorRefFrom<typeof overlaysActorLogic> {}
