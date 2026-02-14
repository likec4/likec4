import type { ActorRef, MachineSnapshot, StateMachine } from 'xstate';
import type { EditorActorRef } from '../../editor/editorActor.states';
import type { OverlaysActorRef } from '../../overlays/overlaysActor';
import type { SearchActorRef } from '../../search/searchActor';
import type { Context as DiagramContext, EmittedEvents as DiagramEmittedEvents, Events as DiagramEvents, Input } from './machine.setup';
/**
 * Here is a trick to reduce inference types
 */
export interface DiagramMachineLogic extends StateMachine<DiagramContext, DiagramEvents, {
    overlays: OverlaysActorRef | undefined;
    search: SearchActorRef | undefined;
    editor: EditorActorRef | undefined;
}, any, any, any, any, any, any, Input, any, any, any, any> {
}
export declare const diagramMachine: DiagramMachineLogic;
export type DiagramMachineSnapshot = MachineSnapshot<DiagramContext, DiagramEvents, {
    overlays: OverlaysActorRef | undefined;
    search: SearchActorRef | undefined;
    editor: EditorActorRef | undefined;
}, any, any, any, {}, {}>;
export interface DiagramMachineRef extends ActorRef<DiagramMachineSnapshot, DiagramEvents, DiagramEmittedEvents> {
}
export type { DiagramContext, DiagramEmittedEvents, DiagramEvents, };
