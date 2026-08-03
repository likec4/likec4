import type { ActorSystem } from 'xstate'
import type { BaseEditorActorRef } from '../../editor/actor/setup'
import type { NavigationPanelActorRef } from '../../navigationpanel/actor'
import type { OverlaysActorRef } from '../../overlays/overlaysActor'
import type { SearchActorRef } from '../../search/searchActor'
import type { StoryActorRef } from '../../story/actor'
import type { DiagramMachineRef } from './machine'

export type NodeWithData = { id: string; data: Record<string, unknown> }

export type System = ActorSystem<{
  actors: {
    diagram: DiagramMachineRef
    overlays: OverlaysActorRef
    search: SearchActorRef
    editor: BaseEditorActorRef
    navigationPanel: NavigationPanelActorRef
    story: StoryActorRef
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
