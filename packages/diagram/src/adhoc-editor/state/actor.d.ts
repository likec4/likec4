import type { ActorRef, SnapshotFrom, StateMachine } from 'xstate';
import { editor } from './actor.editor';
import { layouter } from './actor.layouter';
import { type Context, type EmittedEvents, type Events } from './actor.types';
export interface AdhocEditorLogic extends StateMachine<Context, Events, any, any, any, any, any, {
    layouter: keyof typeof layouter['states'];
    editor: keyof typeof editor['states'];
}, any, any, EmittedEvents, any, any, any> {
}
export declare const adhocEditorLogic: AdhocEditorLogic;
export type AdhocEditorSnapshot = SnapshotFrom<AdhocEditorLogic>;
export interface AdhocEditorActorRef extends ActorRef<AdhocEditorSnapshot, Events, EmittedEvents> {
}
