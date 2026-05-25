import type { EdgeId } from '@likec4/core/types'
import {
  type ActorLogicFrom,
  type ActorRefFrom,
  type SnapshotFrom,
  type StateValueFrom,
  assertEvent,
  assign,
  setup,
} from 'xstate'
import { closeWindow, openWindow, toggleWindow } from './actions'
import { type BaseFloatingWindowsActor, createStateConfig, machine, to } from './setup'

const _actorLogic = machine.createMachine({
  id: 'windows',
  context: {
    opened: new Set(),
  },
  on: {
    'window.open': {
      actions: openWindow(),
      ...to.opened,
    },
    'window.toggle': {
      actions: toggleWindow(),
      ...to.opened,
    },
  },
  initial: 'idle',
  states: {
    idle: createStateConfig('idle', {}),
    opened: createStateConfig('opened', {
      on: {
        'window.close': {
          actions: closeWindow(),
        },
      },
    }),
  },
})

export interface FloatingWindowsActorLogic extends BaseFloatingWindowsActor<StateValueFrom<typeof _actorLogic>> {}
export const floatingWindowsActorLogic: FloatingWindowsActorLogic = _actorLogic as any

export type FloatingWindowsActorSnapshot = SnapshotFrom<FloatingWindowsActorLogic>
export interface FloatingWindowsActorRef extends ActorRefFrom<FloatingWindowsActorLogic> {}
