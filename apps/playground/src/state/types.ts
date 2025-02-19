import type { ActorRefFromLogic, SnapshotFrom } from 'xstate'
import type { PlaygroundMachineLogic } from './playground-machine'

export type PlaygroundActorRef = ActorRefFromLogic<PlaygroundMachineLogic>
export type PlaygroundActorSnapshot = SnapshotFrom<PlaygroundMachineLogic>

export type { PlaygroundContext } from './playground-machine'
