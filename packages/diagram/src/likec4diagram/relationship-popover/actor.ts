import { type EdgeId } from '@likec4/core/types'
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
  | { type: 'dropdown.dismiss' }

export interface RelationshipPopoverActorContext {
  edgeId: EdgeId | null
  /**
   * True if the edge was selected
   */
  edgeSelected: boolean
}

const _actorLogic = setup({
  types: {
    context: {} as RelationshipPopoverActorContext,
    events: {} as RelationshipPopoverActorEvent,
    tags: 'opened',
  },
  delays: {
    'open timeout': ({ context }) => {
      if (context.edgeSelected) {
        return 500
      }
      return 800
    },
    'close timeout': 500,
  },
  actions: {
    'update edgeId': assign(({ context, event }) => {
      assertEvent(event, ['xyedge.select', 'xyedge.mouseEnter'])
      return {
        edgeId: event.edgeId,
        edgeSelected: context.edgeSelected || event.type === 'xyedge.select',
      }
    }),
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
  }),
  initial: 'idle',
  on: {
    'close': {
      target: '#idle',
      actions: 'reset edgeId',
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
          actions: 'reset edgeId',
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
