import type {
  ActorSystem,
} from 'xstate'
import type { EditorActorRef } from '../../editor/editorActor'
import type { OverlaysActorRef } from '../../overlays/overlaysActor'
import type { SearchActorRef } from '../../search/searchActor'
import type {
  DiagramMachineRef,
} from './machine'

export type NodeWithData = { id: string; data: Record<string, unknown> }

export type System = ActorSystem<{
  actors: {
    diagram: DiagramMachineRef
    overlays: OverlaysActorRef
    search: SearchActorRef
    editor: EditorActorRef
  }
}>

export interface DiagramActorRef extends DiagramMachineRef {
  system: System
}

export type {
  DiagramContext,
  DiagramEmittedEvents,
  DiagramEvents,
  DiagramMachineSnapshot as DiagramActorSnapshot,
} from './machine'
