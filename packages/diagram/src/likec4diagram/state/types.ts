import type { ActorRefFromLogic, ActorSystem, EventFromLogic, SnapshotFrom } from 'xstate'
import type { OverlaysActorRef } from '../../overlays/overlaysActor'
import type { SearchActorRef } from '../../search/searchActor'
import type { DiagramMachineLogic } from './diagram-machine'
import type { SyncLayoutActorRef } from './syncManualLayoutActor'

export type System = ActorSystem<{
  actors: {
    diagram: ActorRefFromLogic<DiagramMachineLogic>
    overlays: OverlaysActorRef
    search: SearchActorRef
    syncLayout: SyncLayoutActorRef
  }
}>

export interface DiagramActorRef extends ActorRefFromLogic<DiagramMachineLogic> {
  system: System
}
export type DiagramActorSnapshot = SnapshotFrom<DiagramMachineLogic>

export type DiagramActorEvent = EventFromLogic<DiagramMachineLogic>

export type {
  Context as DiagramContext,
  EmittedEvents as DiagramEmittedEvents,
} from './diagram-machine'
