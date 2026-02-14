import { BBox } from '@likec4/core/geometry';
import type { DeploymentFqn, DiagramEdge, DiagramNode, DiagramView, Fqn } from '@likec4/core/types';
import { type Viewport } from '@xyflow/system';
import type { ActorSystem } from 'xstate';
import type { EditorActorRef } from '../../editor/editorActor.states';
import type { OverlaysActorRef } from '../../overlays/overlaysActor';
import type { SearchActorRef } from '../../search/searchActor';
import type { Types } from '../types';
import type { Context } from './machine.setup';
import type { DiagramActorRef, NodeWithData } from './types';
export declare const findNodeByModelFqn: <T extends NodeWithData>(xynodes: T[], elementFqn: Fqn) => (T & {
    data: {
        modelFqn: Fqn;
    };
}) | null;
export declare function typedSystem(system: ActorSystem<any>): {
    readonly overlaysActorRef: OverlaysActorRef | null;
    readonly diagramActorRef: DiagramActorRef;
    readonly searchActorRef: SearchActorRef | null;
    readonly editorActorRef: EditorActorRef | null;
};
export declare namespace typedSystem {
    var editorActor: ({ system }: {
        system: ActorSystem<any>;
    }) => EditorActorRef;
    var overlaysActor: ({ system }: {
        system: ActorSystem<any>;
    }) => OverlaysActorRef;
    var diagramActor: ({ system }: {
        system: ActorSystem<any>;
    }) => DiagramActorRef;
    var searchActor: ({ system }: {
        system: ActorSystem<any>;
    }) => SearchActorRef;
}
export declare function findDiagramNode(ctx: Context, xynodeId: string): DiagramNode | null;
export declare function findDiagramEdge(ctx: Context, xyedgeId: string): DiagramEdge | null;
/**
 * Returns the bounds of the current view from the context.
 * If {@link nextView} is provided, returns the bounds of the next view.
 */
export declare function viewBounds(ctx: Pick<Context, 'view' | 'dynamicViewVariant'>, nextView?: DiagramView): BBox;
export declare function focusedBounds(params: {
    context: Context;
}): {
    bounds: BBox;
    duration?: number;
};
export declare function activeSequenceBounds(params: {
    context: Context;
}): {
    bounds: BBox;
    duration: number;
};
export declare function nodeRef(node: Types.Node): Fqn | DeploymentFqn | null;
export declare function findCorrespondingNode(context: Pick<Context, 'lastOnNavigate' | 'xynodes'>, event: {
    view: DiagramView;
    xynodes: Types.Node[];
}): {
    fromNode: null;
    toNode: null;
} | {
    fromNode: Types.Node;
    toNode: Types.Node | null;
};
export declare function calcViewportForBounds(context: Pick<Context, 'xystore' | 'fitViewPadding'>, bounds: BBox): Viewport;
