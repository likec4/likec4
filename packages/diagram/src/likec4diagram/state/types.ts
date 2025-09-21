import type { ActorRefFromLogic, ActorSystem, EventFromLogic, SnapshotFrom } from 'xstate'
import type { OverlaysActorRef } from '../../overlays/overlaysActor'
import type { SearchActorRef } from '../../search/searchActor'
import type { DiagramMachineLogic } from './diagram-machine'
import type { SyncLayoutActorLogic } from './syncManualLayoutActor'

export type System = ActorSystem<{
  actors: {
    diagram: ActorRefFromLogic<DiagramMachineLogic>
    overlays: OverlaysActorRef
    search: SearchActorRef
  }
}>

export interface DiagramActorRef extends ActorRefFromLogic<DiagramMachineLogic> {
  system: System
}

// export type DiagramActorRef = Omit<ActorRefFromLogic<DiagramMachineLogic>, 'system'> & {
//   system: System
// }
export type DiagramActorSnapshot = SnapshotFrom<DiagramMachineLogic>

export type DiagramActorEvent = EventFromLogic<DiagramMachineLogic>

export type {
  Context as DiagramContext,
  EmittedEvents as DiagramEmittedEvents,
} from './diagram-machine'

export type SyncLayoutActorRef = Omit<ActorRefFromLogic<SyncLayoutActorLogic>, 'system'> & {
  system: System
}
export type SyncLayoutActorSnapshot = SnapshotFrom<SyncLayoutActorLogic>
