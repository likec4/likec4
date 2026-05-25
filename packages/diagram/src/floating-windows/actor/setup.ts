import type { EdgeId } from '@likec4/core/types'
import {
  type ActorLogicFrom,
  type ActorRefFrom,
  type ActorRefFromLogic,
  type SnapshotFrom,
  type StateMachine,
  type StateValue,
  assertEvent,
  assign,
  setup,
} from 'xstate'
import type { WindowId } from './types'

export type FloatingWindowsActorEvent = // Events from the UI
  | { type: 'window.open'; id: WindowId }
  | { type: 'window.minimize'; id: WindowId }
  | { type: 'window.close'; id: WindowId }
  | { type: 'window.toggle'; id: WindowId }

export interface FloatingWindowsActorContext {
  opened: ReadonlySet<WindowId>
  // Add your context properties here
}

export const machine = setup({
  types: {
    context: {} as FloatingWindowsActorContext,
    events: {} as FloatingWindowsActorEvent,
  },
  guards: {
    'have opened': ({ context }) => context.opened.size > 0,
  },
})
export const to = {
  idle: { target: '#idle' },
  opened: { target: '#opened' },
} as const

export function createStateConfig(name: keyof typeof to, config: Parameters<typeof machine.createStateConfig>[0]) {
  return {
    id: to[name].target.substring(1),
    ...config,
  }
}
/**
 * to workaround circular dependency issue between editor and diagram packages
 */
export interface BaseFloatingWindowsActor<State extends StateValue = any> extends
  StateMachine<
    FloatingWindowsActorContext,
    FloatingWindowsActorEvent,
    any, // inferChildrenRef<typeof actors>,
    any, // inferProvidedActor<typeof actors>,
    any,
    any,
    any,
    State,
    any, // EditorActorStateTag,
    any, // EditorActorInput,
    any,
    any, // EditorActorEmitedEvent,
    any,
    any
  >
{
}
export type BaseFloatingWindowsActorRef = ActorRefFromLogic<BaseFloatingWindowsActor>
