import type { Fqn, ViewId } from '@likec4/core/types';
import { type ActorRef, type SnapshotFrom, type StateMachine } from 'xstate';
export type SearchActorEvent = {
    type: 'open';
    search?: string | undefined;
} | {
    type: 'close';
} | {
    type: 'change.search';
    search: string;
} | {
    type: 'pickview.open';
    elementFqn: Fqn;
} | {
    type: 'navigate.to';
    viewId: ViewId;
    focusOnElement?: Fqn | undefined;
} | {
    type: 'animation.presence.end';
} | {
    type: 'pickview.close';
};
export interface SearchContext {
    openedWithSearch: string | null;
    searchValue: string;
    pickViewFor: Fqn | null;
    navigateTo: {
        viewId: ViewId;
        focusOnElement?: Fqn | undefined;
    } | null;
}
export interface SearchActorLogic extends StateMachine<SearchContext, SearchActorEvent, {}, any, any, any, any, 'inactive' | 'opened' | 'pickView' | 'waitAnimationEnd', never, never, any, any, any, any> {
}
export declare const searchActorLogic: SearchActorLogic;
export type SearchActorSnapshot = SnapshotFrom<SearchActorLogic>;
export interface SearchActorRef extends ActorRef<SearchActorSnapshot, SearchActorEvent> {
}
