import type { ActorRefFromLogic, ActorSystem, SnapshotFrom } from 'xstate'
import type { OverlaysActorRef } from '../overlays/overlaysActor'
import type { DiagramMachineLogic } from './diagram-machine'
import type { SyncLayoutActorLogic } from './syncManualLayoutActor'

export type System = ActorSystem<{
  actors: {
    diagram: DiagramActorRef
    overlays: OverlaysActorRef
  }
}>

export type DiagramActorRef = Omit<ActorRefFromLogic<DiagramMachineLogic>, 'system'> & {
  system: System
}
export type DiagramActorSnapshot = SnapshotFrom<DiagramMachineLogic>

export type { Context as DiagramContext } from './diagram-machine'

export type SyncLayoutActorRef = Omit<ActorRefFromLogic<SyncLayoutActorLogic>, 'system'> & {
  system: System
}
export type SyncLayoutActorSnapshot = SnapshotFrom<SyncLayoutActorLogic>
