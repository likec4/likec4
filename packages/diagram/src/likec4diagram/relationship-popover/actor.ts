import type { EdgeId } from '@likec4/core/types'
import {
  type ActorLogicFrom,
  type ActorRefFrom,
  type SnapshotFrom,
  assertEvent,
  assign,
  setup,
} from 'xstate'

export type RelationshipPopoverActorEvent =
  // Events from the UI
  | { type: 'xyedge.mouseEnter'; edgeId: EdgeId }
  | { type: 'xyedge.mouseLeave' }
  | { type: 'xyedge.select'; edgeId: EdgeId }
  | { type: 'xyedge.unselect' }
  | { type: 'close' }
  // - From dropdown
  | { type: 'dropdown.mouseEnter' }
  | { type: 'dropdown.mouseLeave' }

export interface RelationshipPopoverActorContext {
  edgeId: EdgeId | null
  /**
   * True if the edge was selected
   */
  edgeSelected: boolean

  /**
   * The timeout for opening the popover
   * If it was closed recently (<1.5s), it will be 300ms
   * Otherwise, it will be 800ms
   */
  openTimeout: number
}

const _actorLogic = setup({
  types: {
    context: {} as RelationshipPopoverActorContext,
    events: {} as RelationshipPopoverActorEvent,
    tags: 'opened',
  },
  delays: {
    'open timeout': ({ context }) => context.openTimeout,
    'close timeout': 600,
    'long idle': 1500,
  },
  actions: {
    'update edgeId': assign(({ context, event }) => {
      assertEvent(event, ['xyedge.select', 'xyedge.mouseEnter'])
      return {
        edgeId: event.edgeId,
        edgeSelected: context.edgeSelected || event.type === 'xyedge.select',
      }
    }),
    'increase open timeout': assign(() => ({
      openTimeout: 800,
    })),
    'decrease open timeout': assign(() => ({
      openTimeout: 300,
    })),
    'reset edgeId': assign({
      edgeId: null,
      edgeSelected: false,
    }),
  },
  guards: {
    'edge was selected': ({ context }) => context.edgeSelected,
    'edge was hovered': ({ context }) => !context.edgeSelected,
  },
}).createMachine({
  id: 'breadcrumbs',
  context: () => ({
    edgeId: null,
    edgeSelected: false,
    openTimeout: 800,
  }),
  initial: 'idle',
  on: {
    'close': {
      target: '#idle',
      actions: [
        'reset edgeId',
        'increase open timeout',
      ],
    },
  },
  states: {
    idle: {
      id: 'idle',
      on: {
        'xyedge.mouseEnter': {
          target: 'opening',
          actions: 'update edgeId',
        },
        'xyedge.select': {
          target: 'active',
          actions: 'update edgeId',
        },
      },
      after: {
        'long idle': {
          actions: 'increase open timeout',
        },
      },
    },
    opening: {
      on: {
        'xyedge.mouseLeave': {
          target: 'idle',
        },
        'xyedge.select': {
          target: 'active',
          actions: 'update edgeId',
        },
      },
      after: {
        'open timeout': {
          actions: 'decrease open timeout',
          target: 'active',
        },
      },
    },
    active: {
      tags: ['opened'],
      initial: 'opened',
      exit: 'reset edgeId',
      on: {
        'xyedge.unselect': {
          target: 'idle',
          actions: 'increase open timeout',
        },
        'xyedge.select': {
          actions: 'update edgeId',
        },
      },
      states: {
        opened: {
          on: {
            'dropdown.mouseEnter': {
              target: 'hovered',
            },
            'xyedge.mouseLeave': {
              guard: 'edge was hovered',
              target: 'closing',
            },
          },
        },
        hovered: {
          on: {
            'dropdown.mouseLeave': [
              {
                guard: 'edge was selected',
                target: 'opened',
              },
              {
                target: 'closing',
              },
            ],
          },
        },
        closing: {
          on: {
            'xyedge.mouseEnter': {
              guard: 'edge was hovered',
              target: 'opened',
              actions: 'update edgeId',
            },
            'xyedge.select': {
              target: 'opened',
              actions: 'update edgeId',
            },
            'dropdown.mouseEnter': {
              target: 'hovered',
            },
          },
          after: {
            'close timeout': {
              target: '#idle',
            },
          },
        },
      },
    },
  },
})

export interface RelationshipPopoverActorLogic extends ActorLogicFrom<typeof _actorLogic> {}
export const RelationshipPopoverActorLogic: RelationshipPopoverActorLogic = _actorLogic

export type RelationshipPopoverActorSnapshot = SnapshotFrom<RelationshipPopoverActorLogic>
export interface RelationshipPopoverActorRef extends ActorRefFrom<RelationshipPopoverActorLogic> {}
