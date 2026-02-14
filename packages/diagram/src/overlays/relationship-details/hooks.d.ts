import { type EdgeId, type Fqn } from '@likec4/core';
import type { RelationshipDetailsActorRef, RelationshipDetailsSnapshot } from './actor';
export declare const RelationshipDetailsActorContext: import("react").Context<RelationshipDetailsActorRef>;
export declare function useRelationshipDetailsActor(): any;
export declare function useRelationshipDetailsState<T = unknown>(selector: (state: RelationshipDetailsSnapshot) => T, compare?: (a: NoInfer<T>, b: NoInfer<T>) => boolean): NoInfer<T>;
export declare function useRelationshipDetails(): {
    actor: any;
    readonly rootElementId: string;
    getState: () => any;
    send: any;
    navigateTo: (...params: [edgeId: EdgeId] | [source: Fqn, target: Fqn]) => void;
    fitDiagram: () => void;
    close: () => void;
};
