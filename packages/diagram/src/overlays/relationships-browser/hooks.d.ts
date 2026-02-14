import { type Fqn } from '@likec4/core';
import type { RelationshipsBrowserActorRef, RelationshipsBrowserSnapshot } from './actor';
import type { LayoutRelationshipsViewResult } from './layout';
export declare const RelationshipsBrowserActorContext: import("react").Context<RelationshipsBrowserActorRef>;
export declare function useRelationshipsBrowserActor(): any;
export declare function useRelationshipsBrowserState<T>(selector: (state: RelationshipsBrowserSnapshot) => T, compare?: (a: T, b: T) => boolean): T;
export declare function useRelationshipsBrowser(): {
    actor: any;
    readonly rootElementId: string;
    getState: () => any;
    send: any;
    updateView: (layouted: LayoutRelationshipsViewResult) => void;
    changeScope: (scope: "global" | "view") => void;
    navigateTo: (subject: Fqn, fromNode?: string) => void;
    fitDiagram: () => void;
    close: () => void;
};
