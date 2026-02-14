import { type ActorRef, type SnapshotFrom, type StateMachine } from 'xstate';
import type { EditorActorContext, EditorActorEmitedEvent, EditorActorEvent, EditorActorInput } from './editorActor.setup';
export type { EditorActorContext, EditorActorEmitedEvent, EditorActorEvent, EditorActorInput, } from './editorActor.setup';
export interface EditorActorLogic extends StateMachine<EditorActorContext, EditorActorEvent, any, any, any, any, any, 'idle' | 'editing' | 'pending' | 'afterEdit' | 'applyLatestToManual' | 'executeChanges', any, EditorActorInput, any, EditorActorEmitedEvent, any, any> {
}
export declare const editorActorLogic: EditorActorLogic;
export type EditorActorSnapshot = SnapshotFrom<EditorActorLogic>;
export interface EditorActorRef extends ActorRef<EditorActorSnapshot, EditorActorEvent, EditorActorEmitedEvent> {
}
